// Weather core (Feature W of the "World Outside" arc). Pure logic + two fetch
// helpers. Three sources — a weather.* entity, a local station's raw sensors,
// or keyless Open-Meteo — all normalize to a single runtime `WeatherNow`.
//
// This is the FIRST third-party network call in the codebase. Everything that
// touches the network (fetchOpenMeteo / geocodeZip) is isolated here, wrapped
// in try/catch, and returns null on any failure so the caller can hold the
// last good value. The pure functions (wmoToCondition, deriveFromSensors, the
// unit normalizers, resolveWeatherEntity) have no network dependency and are
// exported cleanly so W2 / test pages can import them.

import type { HassState, WeatherConfig, WeatherEffectKey } from './types.js';
import type { ForecastRecord } from './ha-client.js';
import { isDay } from './time-of-day.js';

type States = Record<string, HassState> | null | undefined;

// HA's 15-state weather vocabulary (weather/__init__.py). Every source maps
// into exactly this set.
export type HaCondition =
  | 'clear-night' | 'cloudy' | 'exceptional' | 'fog' | 'hail'
  | 'lightning' | 'lightning-rainy' | 'partlycloudy' | 'pouring'
  | 'rainy' | 'snowy' | 'snowy-rainy' | 'sunny' | 'windy' | 'windy-variant';

export interface WeatherNow {
  condition: HaCondition;
  tempC: number | null;
  windKmh: number | null;
  windBearing: number | null;   // degrees, meteorological (from-direction)
  isDay: boolean;
  stale: boolean;               // source unhealthy / value held past its freshness window
  label?: string;               // place / entity name for the chip
  // Tomorrow's condition, when the source exposes a forecast (Open-Meteo daily,
  // or a legacy weather.* `forecast` attribute). Drives forecast-anticipation
  // thought bubbles (e.g. an umbrella when rain is coming). Undefined when the
  // source carries no forecast; null tolerated the same as undefined.
  forecastCondition?: HaCondition | null;
  // Rain-ish is coming within ~3 h (from an hourly forecast) while it isn't
  // raining now. Drives the "storm brewing" 3D effect. Undefined when the source
  // exposes no hourly forecast.
  rainSoon?: boolean;
  // ── W3 extended attributes (all optional per provider — every visual no-ops
  // when its field is absent). Populated by resolveWeatherEntity / fetchOpenMeteo;
  // the local-sensors source leaves them null.
  cloudCoverage?: number | null;   // %
  visibilityKm?: number | null;    // km (mi → km normalized)
  uvIndex?: number | null;
  windGustKmh?: number | null;     // km/h (same normalization as wind_speed)
  apparentC?: number | null;       // feels-like °C
  humidity?: number | null;        // %
}

// Normalized sensor readings fed to deriveFromSensors. All already in metric
// (mm/h, °C, km/h) so the heuristic stays a pure comparison.
export interface SensorReadings {
  precipMmH?: number | null;
  tempC?: number | null;
  windKmh?: number | null;
  lightning?: boolean;
  isDay: boolean;
}

// ── Unit normalization ────────────────────────────────────────────────────
// HA sensors carry their own unit_of_measurement; we normalize from that string
// rather than assuming a locale. Unknown/blank unit → value passed through as
// already-metric (the internal convention).

export function toCelsius(v: number, unit?: string): number {
  const u = (unit ?? '').toLowerCase().trim();
  if (u === '°f' || u === 'f' || u === 'fahrenheit') return (v - 32) * 5 / 9;
  if (u === 'k' || u === 'kelvin') return v - 273.15;
  return v;   // °C / blank
}

export function toKmh(v: number, unit?: string): number {
  const u = (unit ?? '').toLowerCase().trim();
  if (u.includes('mph') || u === 'mi/h') return v * 1.609344;
  if (u === 'm/s' || u === 'ms') return v * 3.6;
  if (u.includes('kn') || u.includes('knot')) return v * 1.852;
  if (u.includes('ft/s')) return v * 1.09728;
  return v;   // km/h / blank
}

// Precipitation RATE → mm/h. A bare 'mm' / 'in' unit is treated as an
// accumulation-over-the-report-period rate proxy (best the panel can do
// without a period); imperial rates convert inch→mm.
export function toMmPerH(v: number, unit?: string): number {
  const u = (unit ?? '').toLowerCase().trim();
  if (u.includes('in')) return v * 25.4;   // in/h or in
  return v;                                 // mm/h or mm
}

// Visibility → km. Miles → km; metres → km; km / blank passed through.
export function toKm(v: number, unit?: string): number {
  const u = (unit ?? '').toLowerCase().trim();
  if (u === 'mi' || u.includes('mile')) return v * 1.609344;
  if (u === 'm') return v / 1000;
  return v;   // km / blank
}

// wind_bearing may be a compass cardinal string ("N", "SالسE"…) rather than a
// number. Map the 16-point compass to degrees; unknown → NaN (caller nulls it).
const COMPASS_16: Record<string, number> = {
  n: 0, nne: 22.5, ne: 45, ene: 67.5, e: 90, ese: 112.5, se: 135, sse: 157.5,
  s: 180, ssw: 202.5, sw: 225, wsw: 247.5, w: 270, wnw: 292.5, nw: 315, nnw: 337.5,
};
export function parseWindBearing(raw: unknown): number | null {
  const n = parseFloat(String(raw));
  if (isFinite(n)) return n;
  const key = String(raw ?? '').trim().toLowerCase();
  const deg = COMPASS_16[key];
  return deg == null ? null : deg;
}

// ── W3: per-effect toggle resolver ──────────────────────────────────────────
// Each 3D weather visualization is individually toggleable. Absent from the
// config = the per-key default below. `effects3d === false` (the master
// kill-switch) is folded in by the CALLER (three-view) for effect-GROUP members,
// NOT here — this resolver is purely the per-key on/off with defaults, so it
// stays a pure lookup the test page and sidebar share.
const WEATHER_EFFECT_DEFAULTS: Record<WeatherEffectKey, boolean> = {
  precip: true, fog: true, lightning: true, wind: true, clouds: true,
  sunPosition: true, puddles: true,
  frost: false, precipForecast: false,
};

export function weatherEffectEnabled(
  cfg: WeatherConfig | undefined, key: WeatherEffectKey,
): boolean {
  const v = cfg?.effects?.[key];
  return v == null ? WEATHER_EFFECT_DEFAULTS[key] : v;
}

// ── W3: visibility → FogExp2 density (pure, testable) ───────────────────────
// Low visibility ⇒ denser fog. Continuous mapping used when the source reports
// `visibility`; the `fog` condition additionally floors the density in the
// renderer. Clamped so a 0 km reading can't blow the density up.
export function visibilityToFogDensity(visibilityKm: number): number {
  const v = Math.max(visibilityKm, 0.15);
  return Math.max(0, Math.min(0.0009, 0.00042 / v));
}

// ── W3: "rain is coming soon" from an hourly forecast (pure, testable) ──────
// True when any hourly record within `horizonH` hours of `nowMs` is rain-ish
// (precipitation_probability ≥ 60, or a rain/pour/storm condition). Records
// without a parseable datetime are treated as imminent (index-order proxy).
const RAINY_CONDITIONS = new Set<string>([
  'rainy', 'pouring', 'lightning-rainy', 'snowy-rainy', 'hail', 'lightning',
]);
export function forecastRainSoon(
  records: Array<{ datetime?: string; condition?: string; precipitation_probability?: number | null }>,
  nowMs: number, horizonH = 3,
): boolean {
  const horizon = nowMs + horizonH * 3600_000;
  for (const r of records) {
    const t = r.datetime ? Date.parse(r.datetime) : NaN;
    if (isFinite(t) && (t < nowMs - 3600_000 || t > horizon)) continue;
    const prob = r.precipitation_probability;
    if (typeof prob === 'number' && prob >= 60) return true;
    if (r.condition && RAINY_CONDITIONS.has(r.condition)) return true;
  }
  return false;
}

// ── Phase 3: moon phase → drawing terminator parameter (pure, testable) ──────
// HA's core `moon` integration exposes an 8-state phase string (no illumination
// %, no position). Map it to a signed illuminated fraction in [-1, 1] the moon
// sprite's canvas texture uses to draw the terminator:
//   magnitude = illuminated fraction of the disc (0 = new, 0.5 = quarter,
//               1 = full),
//   sign      = which limb is lit — positive = lit on the RIGHT (waxing,
//               Northern-Hemisphere convention), negative = lit on the LEFT
//               (waning).
// Unknown / absent state → 1 (full moon): the honest default for an unbound
// moon prop ("the moon is out"). Changes at most daily, so this is effectively
// a static lookup.
export type MoonPhase =
  | 'new_moon' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full_moon' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
const MOON_PHASE_FRACTION: Record<string, number> = {
  new_moon: 0,
  waxing_crescent: 0.25,
  first_quarter: 0.5,
  waxing_gibbous: 0.75,
  full_moon: 1,
  waning_gibbous: -0.75,
  last_quarter: -0.5,
  waning_crescent: -0.25,
};
export function moonPhaseFraction(state: string | null | undefined): number {
  const s = (state ?? '').toLowerCase().trim();
  const v = MOON_PHASE_FRACTION[s];
  return v == null ? 1 : v;
}

// ── Source: HA weather.* entity ─────────────────────────────────────────────
// condition = state; temperature/wind normalized from the entity's own unit
// attributes. sunny ↔ clear-night is re-gated through the shared sun logic so a
// mis-timed source can't show a daytime sun at night (and vice versa).
export function resolveWeatherEntity(
  state: string,
  attrs: Record<string, unknown>,
  states: States,
): WeatherNow {
  const day = isDay(states);
  let condition = normalizeCondition(state, day);
  // Re-gate the clear pair by our own sun read regardless of what the entity said.
  if (condition === 'sunny' || condition === 'clear-night') {
    condition = day ? 'sunny' : 'clear-night';
  }
  const t = parseFloat(String(attrs.temperature));
  const tempC = isFinite(t)
    ? toCelsius(t, String(attrs.temperature_unit ?? ''))
    : null;
  const w = parseFloat(String(attrs.wind_speed));
  const windUnit = String(attrs.wind_speed_unit ?? '');
  const windKmh = isFinite(w) ? toKmh(w, windUnit) : null;
  const windBearing = parseWindBearing(attrs.wind_bearing);
  const friendly = typeof attrs.friendly_name === 'string' ? attrs.friendly_name : undefined;
  // ── W3 extended attributes (all optional per provider) ──
  const num = (v: unknown): number | null => {
    const n = parseFloat(String(v));
    return isFinite(n) ? n : null;
  };
  const cloudCoverage = num(attrs.cloud_coverage);
  const vis = num(attrs.visibility);
  const visibilityKm = vis == null ? null : toKm(vis, String(attrs.visibility_unit ?? ''));
  const uvIndex = num(attrs.uv_index);
  const gust = num(attrs.wind_gust_speed);
  const windGustKmh = gust == null ? null : toKmh(gust, windUnit);
  const app = num(attrs.apparent_temperature);
  const apparentC = app == null ? null : toCelsius(app, String(attrs.temperature_unit ?? ''));
  const humidity = num(attrs.humidity);
  const bad = state === 'unavailable' || state === 'unknown' || state === '';
  // Best-effort forecast from the legacy `forecast` attribute (removed in modern
  // HA; a forecast service call is out of scope). Accept the first entry's
  // condition only if it's a known HaCondition string, else leave undefined.
  let forecastCondition: HaCondition | undefined;
  const fc = (attrs.forecast as Array<Record<string, unknown>> | undefined)?.[0]?.condition;
  if (typeof fc === 'string' && HA_CONDITIONS.has(fc as HaCondition)) {
    forecastCondition = fc as HaCondition;
  }
  return {
    condition, tempC, windKmh, windBearing, isDay: day, stale: bad, label: friendly,
    forecastCondition, cloudCoverage, visibilityKm, uvIndex, windGustKmh, apparentC, humidity,
  };
}

const HA_CONDITIONS = new Set<HaCondition>([
  'clear-night', 'cloudy', 'exceptional', 'fog', 'hail', 'lightning',
  'lightning-rainy', 'partlycloudy', 'pouring', 'rainy', 'snowy',
  'snowy-rainy', 'sunny', 'windy', 'windy-variant',
]);

function normalizeCondition(state: string, day: boolean): HaCondition {
  const s = (state || '').toLowerCase().trim();
  if (HA_CONDITIONS.has(s as HaCondition)) return s as HaCondition;
  // Unknown/unavailable → a best-effort neutral: clear by sun.
  return day ? 'sunny' : 'clear-night';
}

// ── Source: local station sensors (no condition string) ─────────────────────
// Heuristic per DESIGN-world Feature W. Precedence: lightning wins, then
// precipitation (snow when cold, pouring when heavy), then wind, then a plain
// clear/night read (no cloud signal available → prefer sunny/clear-night).
export function deriveFromSensors(r: SensorReadings): WeatherNow {
  const precip = r.precipMmH ?? 0;
  const temp = r.tempC ?? null;
  const wind = r.windKmh ?? 0;
  const lightning = !!r.lightning;
  const wet = precip > 0.1;

  let condition: HaCondition;
  if (lightning) {
    condition = wet ? 'lightning-rainy' : 'lightning';
  } else if (wet) {
    if (temp !== null && temp <= 0.5) condition = 'snowy';
    else condition = precip > 7.6 ? 'pouring' : 'rainy';
  } else if (wind > 38) {
    condition = 'windy';
  } else {
    condition = r.isDay ? 'sunny' : 'clear-night';
  }

  const noData = r.precipMmH == null && r.tempC == null && r.windKmh == null && !lightning;
  return {
    condition,
    tempC: temp,
    windKmh: r.windKmh ?? null,
    windBearing: null,
    isDay: r.isDay,
    stale: noData,
    label: 'Local station',
  };
}

// ── Source: Open-Meteo (WMO weather codes) ──────────────────────────────────
// The exact WMO → HA mapping from HA core's own open_meteo/const.py. Clear
// codes (0/1) map to sunny and get gated to clear-night when the sun is down.
const WMO_TO_HA: Record<number, HaCondition> = {
  0: 'sunny',           // Clear sky
  1: 'sunny',           // Mainly clear
  2: 'partlycloudy',    // Partly cloudy
  3: 'cloudy',          // Overcast
  45: 'fog',            // Fog
  48: 'fog',            // Depositing rime fog
  51: 'rainy',          // Drizzle: light
  53: 'rainy',          // Drizzle: moderate
  55: 'rainy',          // Drizzle: dense
  56: 'rainy',          // Freezing drizzle: light
  57: 'rainy',          // Freezing drizzle: dense
  61: 'rainy',          // Rain: slight
  63: 'rainy',          // Rain: moderate
  65: 'pouring',        // Rain: heavy
  66: 'rainy',          // Freezing rain: light
  67: 'pouring',        // Freezing rain: heavy
  71: 'snowy',          // Snow fall: slight
  73: 'snowy',          // Snow fall: moderate
  75: 'snowy',          // Snow fall: heavy
  77: 'snowy',          // Snow grains
  80: 'rainy',          // Rain showers: slight
  81: 'rainy',          // Rain showers: moderate
  82: 'pouring',        // Rain showers: violent
  85: 'snowy',          // Snow showers: slight
  86: 'snowy',          // Snow showers: heavy
  95: 'lightning',      // Thunderstorm: slight or moderate
  96: 'lightning-rainy',// Thunderstorm with slight hail
  99: 'lightning-rainy',// Thunderstorm with heavy hail
};

export function wmoToCondition(code: number, isDayNow: boolean): HaCondition {
  const c = WMO_TO_HA[code];
  if (!c) return isDayNow ? 'sunny' : 'clear-night';   // unmapped code → clear by sun
  if (c === 'sunny' && !isDayNow) return 'clear-night';
  return c;
}

// GET current weather from Open-Meteo (keyless, CORS *). Returns null on ANY
// failure (offline, non-2xx, malformed) so the caller holds its last value.
export async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherNow | null> {
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`
    + '&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,is_day'
    +   ',cloud_cover,relative_humidity_2m,apparent_temperature,wind_gusts_10m,visibility,uv_index'
    + '&daily=weather_code&forecast_days=2'
    + '&hourly=precipitation_probability,weather_code&forecast_hours=4'
    + '&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto';
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json() as {
      current?: Record<string, unknown>;
      daily?: { weather_code?: unknown };
      hourly?: { time?: unknown; precipitation_probability?: unknown; weather_code?: unknown };
    };
    const c = j.current;
    if (!c) return null;
    const numOM = (v: unknown): number | null => {
      const n = Number(v); return isFinite(n) ? n : null;
    };
    const base = parseOpenMeteoCurrent(c);
    // Tomorrow's daily code (index 1; index 0 is today). Forecast is framed as
    // day so a rainy tomorrow reads as 'rainy', not clear-night. Missing daily
    // block → undefined.
    const daily = Array.isArray(j.daily?.weather_code) ? j.daily!.weather_code as unknown[] : null;
    const tomorrow = daily && daily.length > 1 ? Number(daily[1]) : NaN;
    const forecastCondition = isFinite(tomorrow) ? wmoToCondition(tomorrow, true) : undefined;
    // rainSoon from the 4-hour hourly block (single fetch): probability ≥ 60 or a
    // rain-ish weather_code within the horizon. Undefined when no hourly block.
    let rainSoon: boolean | undefined;
    const times = Array.isArray(j.hourly?.time) ? j.hourly!.time as unknown[] : null;
    if (times) {
      const probs = Array.isArray(j.hourly?.precipitation_probability) ? j.hourly!.precipitation_probability as unknown[] : [];
      const codes = Array.isArray(j.hourly?.weather_code) ? j.hourly!.weather_code as unknown[] : [];
      const recs = times.map((tm, i) => ({
        datetime: String(tm),
        precipitation_probability: numOM(probs[i]),
        condition: isFinite(Number(codes[i])) ? wmoToCondition(Number(codes[i]), true) : undefined,
      }));
      rainSoon = forecastRainSoon(recs, Date.now());
    }
    return { ...base, forecastCondition, rainSoon };
  } catch {
    return null;
  }
}

// Pure: normalize an Open-Meteo `current` block → the base WeatherNow (condition
// + temp/wind + the W3 extended attributes incl. uvIndex). Forecast-derived
// fields (forecastCondition / rainSoon) are overlaid by fetchOpenMeteo after,
// from the daily/hourly blocks. Exported so the network-free parse is testable
// (fetchOpenMeteo itself does I/O). Open-Meteo's `uv_index` current variable is
// a unitless float; visibility is in metres.
export function parseOpenMeteoCurrent(c: Record<string, unknown>): WeatherNow {
  const day = c.is_day === 1 || c.is_day === true;
  const t = Number(c.temperature_2m);
  const w = Number(c.wind_speed_10m);
  const wb = Number(c.wind_direction_10m);
  const numOM = (v: unknown): number | null => {
    const n = Number(v); return isFinite(n) ? n : null;
  };
  const vis = numOM(c.visibility);
  return {
    condition: wmoToCondition(Number(c.weather_code), day),
    tempC: isFinite(t) ? t : null,
    windKmh: isFinite(w) ? w : null,
    windBearing: isFinite(wb) ? wb : null,
    isDay: day,
    stale: false,
    cloudCoverage: numOM(c.cloud_cover),
    visibilityKm: vis == null ? null : vis / 1000,
    uvIndex: numOM(c.uv_index),
    windGustKmh: numOM(c.wind_gusts_10m),
    apparentC: numOM(c.apparent_temperature),
    humidity: numOM(c.relative_humidity_2m),
  };
}

// Geocode a zip / place query → {lat, lon, label}. Numeric zips collide across
// countries, so results are filtered client-side: prefer a US result whose
// postcodes include the queried digits, else any result whose postcodes match,
// else the first result. Returns null on failure / no match.
export async function geocodeZip(
  query: string,
): Promise<{ lat: number; lon: number; label: string } | null> {
  const q = (query || '').trim();
  if (!q) return null;
  const digits = (q.match(/\d+/g) ?? []).join('');
  const url = 'https://geocoding-api.open-meteo.com/v1/search'
    + `?name=${encodeURIComponent(q)}&count=10&language=en&format=json`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json() as { results?: Array<Record<string, unknown>> };
    const results = Array.isArray(j.results) ? j.results : [];
    if (!results.length) return null;
    const matchesZip = (r: Record<string, unknown>): boolean =>
      !!digits && Array.isArray(r.postcodes)
      && (r.postcodes as unknown[]).some(pc => String(pc).includes(digits));
    let pick = results.find(r => r.country_code === 'US' && matchesZip(r))
      ?? results.find(r => matchesZip(r))
      ?? results[0];
    const parts = [pick.name, pick.admin1, pick.country_code].filter(Boolean).map(String);
    const label = parts.join(', ');
    const lat = Number(pick.latitude);
    const lon = Number(pick.longitude);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    return { lat, lon, label };
  } catch {
    return null;
  }
}

// ── Display helpers (shared by the chip + sidebar preview) ──────────────────
export const CONDITION_GLYPH: Record<HaCondition, string> = {
  'clear-night': '🌙',
  'cloudy': '☁️',
  'exceptional': '⚠️',
  'fog': '🌫️',
  'hail': '🧊',
  'lightning': '🌩️',
  'lightning-rainy': '⛈️',
  'partlycloudy': '🌤️',
  'pouring': '🌧️',
  'rainy': '🌦️',
  'snowy': '❄️',
  'snowy-rainy': '🌨️',
  'sunny': '☀️',
  'windy': '💨',
  'windy-variant': '🌬️',
};

export const CONDITION_LABEL: Record<HaCondition, string> = {
  'clear-night': 'Clear night',
  'cloudy': 'Cloudy',
  'exceptional': 'Exceptional',
  'fog': 'Fog',
  'hail': 'Hail',
  'lightning': 'Lightning',
  'lightning-rainy': 'Thunderstorm',
  'partlycloudy': 'Partly cloudy',
  'pouring': 'Pouring',
  'rainy': 'Rainy',
  'snowy': 'Snowy',
  'snowy-rainy': 'Sleet',
  'sunny': 'Sunny',
  'windy': 'Windy',
  'windy-variant': 'Windy',
};

// °C → display string, respecting the store's imperial flag.
export function tempText(tempC: number, imperial: boolean): string {
  if (imperial) return `${Math.round(tempC * 9 / 5 + 32)}°F`;
  return `${Math.round(tempC)}°C`;
}

// km/h → display string, respecting the store's imperial flag (mph).
export function windText(windKmh: number, imperial: boolean): string {
  if (imperial) return `${Math.round(windKmh * 0.621371)} mph`;
  return `${Math.round(windKmh)} km/h`;
}

// ── DC-C: chip anchor / content / forecast display helpers ──────────────────
// The weather chip is a screen-space overlay mounted once over the shared
// canvas area (both 2D + 3D). Its corner, extra content rows, and forecast
// strip are all config-driven. These helpers are PURE so the chip and the test
// page share one source of truth.

export type ChipAnchor = 'tl' | 'tm' | 'tr' | 'bl' | 'bm' | 'br';

// Resolve the chip container's absolute-position CSS. `anchor` picks a corner
// (default 'br' = bottom-right, the legacy spot); TOP anchors are pushed down
// by `barOffsetPx` so they clear the 3D view-controls bar (which sits at
// top:8px and is ~30 px tall → default 44 px clearance). `custom` px offsets
// win over the pure anchor: they replace the 8px/barOffset edge distances,
// measured from the anchor's own edges (x from the left/right edge the anchor
// uses, y from top/bottom). Center anchors lose their translateX centering
// under a custom offset (the user positioned it explicitly). Returns a CSS
// string of position declarations only.
export function chipAnchorStyle(
  anchor: ChipAnchor | undefined,
  custom: { x: number; y: number } | undefined,
  barOffsetPx = 44,
): string {
  const a: ChipAnchor = anchor ?? 'br';
  const isTop = a[0] === 't';
  const h = a[1];   // 'l' | 'm' | 'r'
  const parts: string[] = [];
  const vEdge = isTop ? 'top' : 'bottom';
  const vy = custom ? custom.y : (isTop ? barOffsetPx : 8);
  parts.push(`${vEdge}:${vy}px`);
  if (h === 'm' && !custom) {
    parts.push('left:50%');
    parts.push('transform:translateX(-50%)');
  } else {
    const hEdge = h === 'r' ? 'right' : 'left';
    const hx = custom ? custom.x : 8;
    parts.push(`${hEdge}:${hx}px`);
  }
  return parts.join(';');
}

// Resolved chip content flags (defaults folded in). apparent/humidity/wind are
// opt-in extra rows (default OFF → the chip stays glyph+temp+label like today);
// hourly/daily are forecast-entry counts (0/absent = that strip hidden),
// clamped to 0..12 / 0..7.
export interface ChipContent {
  apparent: boolean;
  humidity: boolean;
  wind: boolean;
  uv: boolean;
  hourly: number;
  daily: number;
}

// WHO UV-index risk band → label + color for the chip readout. Bands (rounded
// index): low ≤2 green, moderate 3–5 yellow, high 6–7 orange, very high 8–10
// red, extreme 11+ violet. Pure — the chip color-codes the figure at a glance
// (mirrors envColor's warn/danger threshold idiom).
export function uvBand(v: number): { label: string; color: string } {
  if (v <= 2) return { label: 'low', color: '#7cb342' };
  if (v <= 5) return { label: 'moderate', color: '#fdd835' };
  if (v <= 7) return { label: 'high', color: '#fb8c00' };
  if (v <= 10) return { label: 'very high', color: '#e53935' };
  return { label: 'extreme', color: '#8e24aa' };
}
function clampCount(n: unknown, lo: number, hi: number): number {
  const v = Math.floor(Number(n));
  if (!isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}
export function resolveChipContent(cfg?: WeatherConfig['chipContent']): ChipContent {
  return {
    apparent: cfg?.apparent === true,
    humidity: cfg?.humidity === true,
    wind: cfg?.wind === true,
    uv: cfg?.uv === true,
    hourly: clampCount(cfg?.hourly, 0, 12),
    daily: clampCount(cfg?.daily, 0, 7),
  };
}

// ── DC-C: wide Open-Meteo forecast (hourly + daily strips) ──────────────────
// The current-conditions fetch (fetchOpenMeteo) only pulls the minimum needed
// for forecastCondition/rainSoon. The chip's forecast strips need a WIDER
// query. Parse is factored out (pure, fixture-testable); the fetch is the same
// isolated try/catch/null-on-failure shape as fetchOpenMeteo.

// Shape of the raw Open-Meteo forecast JSON we read (all fields optional).
interface OpenMeteoForecastJson {
  hourly?: Record<string, unknown>;
  daily?: Record<string, unknown>;
}

export function parseOpenMeteoForecast(
  j: OpenMeteoForecastJson,
): { hourly: ForecastRecord[]; daily: ForecastRecord[] } {
  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const num = (v: unknown): number | undefined => {
    const n = Number(v);
    return isFinite(n) ? n : undefined;
  };
  // Hourly: time / temperature_2m / precipitation_probability / weather_code / is_day.
  const hTime = arr(j.hourly?.time);
  const hTemp = arr(j.hourly?.temperature_2m);
  const hProb = arr(j.hourly?.precipitation_probability);
  const hCode = arr(j.hourly?.weather_code);
  const hDay = arr(j.hourly?.is_day);
  const hourly: ForecastRecord[] = hTime.map((t, i) => {
    const code = num(hCode[i]);
    const day = hDay.length ? (hDay[i] === 1 || hDay[i] === true) : true;
    return {
      datetime: String(t),
      condition: code == null ? undefined : wmoToCondition(code, day),
      temperature: num(hTemp[i]),
      precipitation_probability: hProb.length ? (num(hProb[i]) ?? null) : undefined,
    };
  });
  // Daily: time / weather_code / temperature_2m_max (high) / _min (low) /
  // precipitation_probability_max. Framed as day so a rainy day reads 'rainy'.
  const dTime = arr(j.daily?.time);
  const dCode = arr(j.daily?.weather_code);
  const dMax = arr(j.daily?.temperature_2m_max);
  const dMin = arr(j.daily?.temperature_2m_min);
  const dProb = arr(j.daily?.precipitation_probability_max);
  const daily: ForecastRecord[] = dTime.map((t, i) => {
    const code = num(dCode[i]);
    return {
      datetime: String(t),
      condition: code == null ? undefined : wmoToCondition(code, true),
      temperature: num(dMax[i]),
      templow: num(dMin[i]),
      precipitation_probability: dProb.length ? (num(dProb[i]) ?? null) : undefined,
    };
  });
  return { hourly, daily };
}

// GET the wide forecast (24 h hourly + 7 d daily). Null on ANY failure so the
// caller holds its last value, exactly like fetchOpenMeteo.
export async function fetchOpenMeteoForecast(
  lat: number, lon: number,
): Promise<{ hourly: ForecastRecord[]; daily: ForecastRecord[] } | null> {
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}`
    + '&hourly=temperature_2m,precipitation_probability,weather_code,is_day'
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max'
    + '&forecast_hours=24&forecast_days=7'
    + '&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto';
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json() as OpenMeteoForecastJson;
    return parseOpenMeteoForecast(j);
  } catch {
    return null;
  }
}

// ── DC-D: weather ALERTS normalizer (pure) ──────────────────────────────────
// Alerts are a DIFFERENT animal from the forecast condition: discrete,
// severity-ranked, time-bounded *events* ("Tornado Warning until 4 PM") rather
// than a continuous ambient condition. There is NO single canonical HA alert
// entity — every regional integration is a different entity shape. We normalize
// on ingestion (like resolveWeatherEntity does for forecast sources) into a
// small 3-level ladder (advisory < watch < warning — the NWS product tier that
// users recognize from TV weather graphics). parseWeatherAlerts auto-detects the
// major shapes defensively; anything unparseable is skipped, an absent /
// unavailable entity yields []. All pure, no network — every source is already
// an HA entity read.

export interface WeatherAlert {
  event: string;                                  // "Tornado Warning" / "Flood Watch" / free text
  severity: 'advisory' | 'watch' | 'warning';
  headline?: string;
  expires?: string;                               // ISO (best-effort, source-dependent)
}

const ALERT_SEV_RANK: Record<WeatherAlert['severity'], number> = {
  advisory: 0, watch: 1, warning: 2,
};
// Ordering helper: higher = more urgent.
export function alertSeverityRank(s: WeatherAlert['severity']): number {
  return ALERT_SEV_RANK[s] ?? 0;
}
// The single most-urgent severity across a set (null when empty). Used by the
// chip badge, the settings preview, and the 3D beacon.
export function worstAlertSeverity(alerts: WeatherAlert[]): WeatherAlert['severity'] | null {
  let best: WeatherAlert['severity'] | null = null;
  for (const a of alerts) {
    if (best == null || alertSeverityRank(a.severity) > alertSeverityRank(best)) best = a.severity;
  }
  return best;
}
// Severity → badge / beacon color. MeteoAlarm's official yellow→orange→red ramp
// (§3 of the research doc), which every source's ladder collapses onto.
export const ALERT_SEVERITY_COLOR: Record<WeatherAlert['severity'], string> = {
  advisory: '#f5c400',   // yellow
  watch: '#ff8c00',      // orange
  warning: '#e6291a',    // red
};

// ── small string coercion helpers (local) ──
function alStr(v: unknown): string { return v == null ? '' : String(v).trim(); }
function alStrOpt(v: unknown): string | undefined { const s = alStr(v); return s || undefined; }
function alInt(v: unknown): number | null { const n = parseInt(String(v), 10); return isFinite(n) ? n : null; }

// Product-tier words in free text (event name / severity string) — the
// AUTHORITATIVE signal for the 3-level scale, since it literally IS the NWS
// Warning>Watch>Advisory product ladder. Returns null when no tier word appears.
function tierFromText(text: unknown): WeatherAlert['severity'] | null {
  const s = alStr(text).toLowerCase();
  if (!s) return null;
  if (s.includes('warning') || s.includes('emergency')) return 'warning';
  if (s.includes('watch')) return 'watch';
  if (s.includes('advisory') || s.includes('statement')) return 'advisory';
  return null;
}
// A source's explicit severity FIELD → 3-level, covering: CAP severity
// (Extreme/Severe/Moderate/Minor), color words (Environment Canada
// alert_colour_level "red", MeteoAlarm awareness_level color token), and numeric
// levels (MeteoAlarm awareness_level 2/3/4, DWD warning_N_level 1–4). null when
// the field carries no usable signal.
function severityFromField(raw: unknown): WeatherAlert['severity'] | null {
  const s = alStr(raw).toLowerCase();
  if (!s) return null;
  if (s === 'extreme' || s === 'severe') return 'warning';
  if (s === 'moderate') return 'watch';
  if (s === 'minor') return 'advisory';
  if (s.includes('red')) return 'warning';
  if (s.includes('orange')) return 'watch';
  if (s.includes('yellow')) return 'advisory';
  const lvl = alInt(s);
  if (lvl != null) {
    if (lvl >= 4) return 'warning';
    if (lvl === 3) return 'watch';
    if (lvl <= 2) return 'advisory';
  }
  return tierFromText(s);
}
// Combine: event-name tier word wins (it IS the product tier), else the explicit
// severity field, else 'advisory' (the documented unknown fallback).
function resolveAlertSeverity(rawSev: unknown, event: unknown): WeatherAlert['severity'] {
  return tierFromText(event) ?? severityFromField(rawSev) ?? 'advisory';
}
// DWD's own 4-tier ladder (1 Wetterwarnung, 2 markant, 3 Unwetter, 4 extrem).
function dwdLevelSeverity(level: number): WeatherAlert['severity'] {
  if (level >= 3) return 'warning';
  if (level === 2) return 'watch';
  return 'advisory';
}
// Drop non-Actual test/exercise/cancel entries where CAP status/messageType is
// present; pass through unfiltered where the field is absent (MeteoAlarm/DWD/EC
// don't expose it at the flat-sensor level). Research §7.
function isTestAlert(o: Record<string, unknown>): boolean {
  const status = alStr(o.status ?? o.Status).toLowerCase();
  if (status && status !== 'actual') return true;
  const mt = alStr(o.messageType ?? o.message_type ?? o.MessageType).toLowerCase();
  if (mt === 'cancel' || mt === 'ack' || mt === 'error') return true;
  return false;
}

// One CAP-ish dict OR a plain title string → a WeatherAlert (null when empty /
// filtered). Covers the NWS custom-integration `alerts` array items, Environment
// Canada `{title, alert_colour_level, expiry_time}` items, and cap_alerts dicts.
function parseAlertItem(item: unknown): WeatherAlert | null {
  if (item == null) return null;
  if (typeof item === 'string') {
    const event = item.trim();
    return event ? { event, severity: tierFromText(event) ?? 'advisory' } : null;
  }
  if (typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;
  if (isTestAlert(o)) return null;
  const event = alStr(o.event ?? o.Event ?? o.title ?? o.Title ?? o.headline ?? o.Headline ?? o.name);
  if (!event) return null;
  const sevRaw = o.severity ?? o.Severity ?? o.alert_colour_level ?? o.awareness_level ?? o.level;
  return {
    event,
    severity: resolveAlertSeverity(sevRaw, event),
    headline: alStrOpt(o.headline ?? o.Headline ?? o.description ?? o.Description),
    expires: alStrOpt(o.expires ?? o.Expires ?? o.ends ?? o.expiry_time ?? o.end),
  };
}
function parseAlertArray(arr: unknown[]): WeatherAlert[] {
  const out: WeatherAlert[] = [];
  for (const it of arr) { const a = parseAlertItem(it); if (a) out.push(a); }
  return out;
}
// DWD: walk warning_1_* … warning_N_* across the sensor's attributes.
function parseDwdAlerts(attrs: Record<string, unknown>): WeatherAlert[] {
  const out: WeatherAlert[] = [];
  const count = alInt(attrs.warning_count);
  const max = count && count > 0 ? count : 20;   // probe when count is absent
  for (let i = 1; i <= max; i++) {
    const name = alStr(attrs[`warning_${i}_name`] ?? attrs[`warning_${i}_event`] ?? attrs[`warning_${i}_headline`]);
    const lvlRaw = attrs[`warning_${i}_level`];
    if (!name && lvlRaw == null) { if (count && count > 0) continue; else break; }
    const level = alInt(lvlRaw);
    const event = name || (level != null ? `Level ${level} warning` : 'Weather warning');
    out.push({
      event,
      severity: level != null ? dwdLevelSeverity(level) : (tierFromText(event) ?? 'advisory'),
      headline: alStrOpt(attrs[`warning_${i}_headline`]),
      expires: alStrOpt(attrs[`warning_${i}_end`]),
    });
  }
  return out;
}
// MeteoAlarm binary_sensor: one active alert carried in the attributes.
function parseMeteoAlarmAlerts(stateStr: string, attrs: Record<string, unknown>): WeatherAlert[] {
  // awareness_type is a "code name" pair ("3 Thunderstorm") — strip the code.
  const rawEvent = alStr(attrs.event ?? attrs.awareness_type ?? attrs.headline)
    || (stateStr && stateStr.toLowerCase() !== 'on' ? stateStr : '');
  const event = rawEvent.replace(/^\s*\d+\s*[;:]?\s*/, '').trim() || 'Weather alert';
  return [{
    event,
    severity: resolveAlertSeverity(attrs.awareness_level ?? attrs.severity, event),
    headline: alStrOpt(attrs.headline),
    expires: alStrOpt(attrs.expires ?? attrs.expiration ?? attrs.expiry_time),
  }];
}
// NWS legacy shape: pipe-joined parallel strings (event | event, severity |
// severity, …) zipped by index.
function parsePipeJoinedAlerts(attrs: Record<string, unknown>): WeatherAlert[] {
  const split = (v: unknown): string[] => alStr(v).split('|').map(s => s.trim());
  const events = split(attrs.event ?? attrs.title ?? attrs.Event ?? attrs.Title);
  const heads = split(attrs.headline ?? attrs.display_desc ?? attrs.Headline);
  const sevs = split(attrs.severity ?? attrs.Severity);
  const exps = split(attrs.expires ?? attrs.ends ?? attrs.Expires);
  const out: WeatherAlert[] = [];
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event) continue;
    out.push({
      event,
      severity: resolveAlertSeverity(sevs[i], event),
      headline: heads[i] || undefined,
      expires: exps[i] || undefined,
    });
  }
  return out;
}

// Parse ANY supported alert entity into a normalized WeatherAlert[]. Shapes are
// tried in order; the first that yields ≥1 alert wins. Defensive throughout:
// absent / unavailable / unknown entity → []; anything unrecognizable → [].
//   • NWS Alerts (finity69x2): count state + `alerts` array attribute; also the
//     legacy pipe-joined `event`/`severity`/… strings.
//   • MeteoAlarm: binary_sensor + `awareness_level`/`awareness_type` (or an
//     `alerts` array in newer builds).
//   • DWD Weather Warnings: `warning_count` + indexed `warning_N_*` attributes.
//   • Environment Canada: `alerts` array of titles / `{title, alert_colour_level,
//     expiry_time}` dicts.
//   • Generic fallback: any `event`/`headline`/`severity` attributes → one alert.
export function parseWeatherAlerts(state: HassState | null | undefined): WeatherAlert[] {
  if (!state) return [];
  const st = alStr(state.state).toLowerCase();
  if (st === 'unavailable' || st === 'unknown') return [];
  const attrs = (state.attributes ?? {}) as Record<string, unknown>;

  // 1. Explicit `alerts` array (NWS custom, Environment Canada, cap_alerts, some MeteoAlarm).
  if (Array.isArray(attrs.alerts)) {
    const out = parseAlertArray(attrs.alerts as unknown[]);
    if (out.length) return out;
  }
  // 2. DWD indexed warning_N_* (two-sensor split — each sensor parsed independently).
  if ('warning_count' in attrs || 'warning_1_level' in attrs || 'warning_1_name' in attrs
      || 'warning_1_event' in attrs || 'warning_1_headline' in attrs) {
    const out = parseDwdAlerts(attrs);
    if (out.length) return out;
  }
  // 3. MeteoAlarm awareness pair (single active alert on the binary_sensor). An
  //    'off'/'' binary_sensor is inactive.
  if ('awareness_level' in attrs || 'awareness_type' in attrs) {
    if (st === 'off' || st === '') return [];
    const out = parseMeteoAlarmAlerts(alStr(state.state), attrs);
    if (out.length) return out;
  }
  // 4. NWS legacy pipe-joined parallel strings.
  if (typeof attrs.event === 'string' && (attrs.event as string).includes('|')) {
    const out = parsePipeJoinedAlerts(attrs);
    if (out.length) return out;
  }
  // 5. Generic single-alert fallback (an unlisted / future integration still
  //    shows something). Inactive binary sensors ('off') carry no event.
  if (st !== 'off' && (attrs.event != null || attrs.headline != null || attrs.severity != null)) {
    const a = parseAlertItem({
      event: attrs.event ?? attrs.headline, severity: attrs.severity,
      headline: attrs.headline, description: attrs.description,
      expires: attrs.expires ?? attrs.ends ?? attrs.expiry_time,
      status: attrs.status, messageType: attrs.messageType,
    });
    return a ? [a] : [];
  }
  return [];
}

// ── W2: 3D-effect intensity (0..1) per condition ────────────────────────────
// Kept here (pure + testable) so three-view's WeatherFxState derivation and the
// weather-fx-test page share ONE source of truth. Drives particle counts
// (600 + intensity·1900), fall speed, and flash energy. Conditions with no
// particle effect (clear/cloudy/exceptional) return 0. The heaviest sky
// (pouring / hail) maxes out; a plain thunderstorm (lightning-rainy) and windy
// sit high; ordinary rain / snow are mid; anything unmapped falls to a light
// drizzle-ish 0.4.
export function conditionIntensity(condition: HaCondition | string): number {
  switch (condition) {
    case 'pouring':
    case 'hail':            return 1.0;
    case 'lightning-rainy': return 0.8;
    case 'windy':
    case 'windy-variant':   return 0.65;
    case 'lightning':       return 0.6;
    case 'rainy':
    case 'snowy':
    case 'snowy-rainy':     return 0.55;
    case 'fog':             return 0.5;
    // Clear / overcast / exceptional: lighting + chip only, no particles.
    case 'sunny':
    case 'clear-night':
    case 'partlycloudy':
    case 'cloudy':
    case 'exceptional':     return 0;
    default:                return 0.4;   // unknown → light drizzle-ish
  }
}

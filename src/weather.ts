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

import type { HassState } from './types.js';
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
  const windKmh = isFinite(w)
    ? toKmh(w, String(attrs.wind_speed_unit ?? ''))
    : null;
  const wb = parseFloat(String(attrs.wind_bearing));
  const windBearing = isFinite(wb) ? wb : null;
  const friendly = typeof attrs.friendly_name === 'string' ? attrs.friendly_name : undefined;
  const bad = state === 'unavailable' || state === 'unknown' || state === '';
  // Best-effort forecast from the legacy `forecast` attribute (removed in modern
  // HA; a forecast service call is out of scope). Accept the first entry's
  // condition only if it's a known HaCondition string, else leave undefined.
  let forecastCondition: HaCondition | undefined;
  const fc = (attrs.forecast as Array<Record<string, unknown>> | undefined)?.[0]?.condition;
  if (typeof fc === 'string' && HA_CONDITIONS.has(fc as HaCondition)) {
    forecastCondition = fc as HaCondition;
  }
  return { condition, tempC, windKmh, windBearing, isDay: day, stale: bad, label: friendly, forecastCondition };
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
    + '&daily=weather_code&forecast_days=2'
    + '&wind_speed_unit=kmh&temperature_unit=celsius&timezone=auto';
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json() as {
      current?: Record<string, unknown>;
      daily?: { weather_code?: unknown };
    };
    const c = j.current;
    if (!c) return null;
    const day = c.is_day === 1 || c.is_day === true;
    const t = Number(c.temperature_2m);
    const w = Number(c.wind_speed_10m);
    const wb = Number(c.wind_direction_10m);
    // Tomorrow's daily code (index 1; index 0 is today). Forecast is framed as
    // day so a rainy tomorrow reads as 'rainy', not clear-night. Missing daily
    // block → undefined.
    const daily = Array.isArray(j.daily?.weather_code) ? j.daily!.weather_code as unknown[] : null;
    const tomorrow = daily && daily.length > 1 ? Number(daily[1]) : NaN;
    const forecastCondition = isFinite(tomorrow) ? wmoToCondition(tomorrow, true) : undefined;
    return {
      condition: wmoToCondition(Number(c.weather_code), day),
      tempC: isFinite(t) ? t : null,
      windKmh: isFinite(w) ? w : null,
      windBearing: isFinite(wb) ? wb : null,
      isDay: day,
      stale: false,
      forecastCondition,
    };
  } catch {
    return null;
  }
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

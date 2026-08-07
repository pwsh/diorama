// Motorized ground-mounted solar panel — the pure half.
//
// ZERO imports (the geo.ts / trilateration.ts / flights.ts idiom) so BOTH the
// app graph (three-view, canvas-render, canvas-hit, sidebar) and the LAZY
// three-renderer chunk can share one copy without dragging anything in. Every
// function is deterministic and takes its inputs explicitly — the clock
// fallback takes `nowMs` from the caller, never `Date.now()` internally, so the
// test page can drive a whole day through it.
//
// ── Sun resolution (shared BY CONSTRUCTION with the W3 `sunPosition` effect) ──
// The scene's sun LIGHT and the panel must never disagree about where the sun
// is, so the two attribute readers below are the single home for that math:
// three-view's `_weatherFxState` calls them for `WeatherFxState.sunAzimuthDeg /
// sunElevationDeg`, and `resolveSunPlan` (which the solar fixture uses) calls
// the SAME pair. `sun.sun`'s `azimuth` is a compass bearing (° CW from true
// north); `compassToPlanDeg` maps it into the plan frame through the fitted geo
// θ exactly like the wind bearing (θ = 0 ⇒ plan +Y is north).

export interface SunPlan {
  azDeg: number;    // plan-frame compass azimuth (0 = +Y world, 90 = +X world, CW)
  elevDeg: number;  // degrees above the horizon (negative = below)
}

export type SunSource = 'entity' | 'clock' | 'demo';

// Compass bearing (° CW from true north) → plan-frame azimuth degrees, mapped
// through the fitted geo rotation θ. Byte-identical to the wind/sun mapping in
// three-view's `_weatherFxState` (that site now calls this).
export function compassToPlanDeg(azCompassDeg: number, thetaRad: number): number {
  const a = (azCompassDeg * Math.PI) / 180;
  const c = Math.cos(thetaRad), s = Math.sin(thetaRad);
  const east = Math.sin(a), north = Math.cos(a);
  const dx = c * east - s * north, dy = s * east + c * north;
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

// `sun.sun`'s azimuth attribute → plan-frame azimuth degrees, or null when the
// attribute is missing / unparseable. Independent of the elevation reader so a
// half-populated sun entity degrades exactly the way it always did.
export function sunAzimuthPlanDeg(azRaw: unknown, thetaRad: number): number | null {
  const sa = parseFloat(String(azRaw));
  return isFinite(sa) ? compassToPlanDeg(sa, thetaRad) : null;
}

// `sun.sun`'s elevation attribute → degrees above the horizon, or null.
export function sunElevationDeg(elevRaw: unknown): number | null {
  const se = parseFloat(String(elevRaw));
  return isFinite(se) ? se : null;
}

// Local-clock fallback arc for installs with no `sun.sun` entity (the
// time-of-day.ts local-clock-fallback precedent). Deterministic: the sun rises
// due EAST at `sunriseH`, sets due WEST at `sunsetH`, and its elevation is a
// sine over that span peaking at `peakElevDeg` at solar noon. Outside daylight
// the sine goes negative on its own, so the panel parks without a special case.
export const SOLAR_CLOCK = {
  sunriseH: 6,        // local hour the arc starts (elev 0, due east)
  sunsetH: 18,        // local hour the arc ends (elev 0, due west)
  peakElevDeg: 60,    // elevation at solar noon
  riseAzDeg: 90,      // compass bearing at sunrise (east)
  setAzDeg: 270,      // compass bearing at sunset (west)
};

export function sunPlanFromClock(nowMs: number, thetaRad = 0): SunPlan {
  const d = new Date(nowMs);
  const h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  const span = SOLAR_CLOCK.sunsetH - SOLAR_CLOCK.sunriseH;
  const frac = (h - SOLAR_CLOCK.sunriseH) / span;   // 0 at sunrise, 1 at sunset
  const elevDeg = SOLAR_CLOCK.peakElevDeg * Math.sin(Math.PI * frac);
  const day = Math.max(0, Math.min(1, frac));       // azimuth only sweeps E→W
  const azCompass = SOLAR_CLOCK.riseAzDeg + (SOLAR_CLOCK.setAzDeg - SOLAR_CLOCK.riseAzDeg) * day;
  return { azDeg: compassToPlanDeg(azCompass, thetaRad), elevDeg };
}

// The sun the solar fixture tracks: an explicit OVERRIDE when the caller has
// one, else the REAL `sun.sun` reading when both attributes parse, else the
// deterministic clock arc. `source` drives the sidebar's "running on the clock
// fallback" / "demo sun" note.
//
// `override` (added for the demo weather source; absent = byte-identical to the
// original two-way resolution) carries a COMPASS azimuth — the same convention
// `sun.sun`'s attribute uses — so it maps through the SAME `compassToPlanDeg`
// as every other path and no second convention can appear. This module stays
// ZERO-import: the caller resolves the override (weather.ts `demoSunAltAz`) and
// hands it in as a plain pair.
export function resolveSunPlan(
  sunState: { state?: string; attributes?: Record<string, unknown> } | null | undefined,
  thetaRad: number,
  nowMs: number,
  override?: { azDeg: number; elevDeg: number } | null,
): { sun: SunPlan; source: SunSource } {
  if (override) {
    const oAz = Number(override.azDeg), oEl = Number(override.elevDeg);
    if (isFinite(oAz) && isFinite(oEl)) {
      return {
        sun: { azDeg: compassToPlanDeg(oAz, thetaRad), elevDeg: oEl },
        source: 'demo',
      };
    }
  }
  const attrs = sunState?.attributes;
  if (attrs) {
    const az = sunAzimuthPlanDeg(attrs['azimuth'], thetaRad);
    const el = sunElevationDeg(attrs['elevation']);
    if (az != null && el != null) return { sun: { azDeg: az, elevDeg: el }, source: 'entity' };
  }
  return { sun: sunPlanFromClock(nowMs, thetaRad), source: 'clock' };
}

// ── Tracking geometry ───────────────────────────────────────────────────────
// The mechanical travel of the tilt axis. `tiltDeg` is measured FROM HORIZONTAL
// (0 = flat, 90 = vertical), so the panel's face normal sits at elevation
// `90 − tiltDeg` — aiming the face at the sun means tilt = 90 − sunElev. Real
// trackers cannot lie flat or stand fully upright; the clamp is that stop.
export const SOLAR_TILT_MIN = 10;
export const SOLAR_TILT_MAX = 75;
// Night park pose: near-horizontal (the mechanical minimum) at the base yaw —
// the stow position a real tracker takes when the sun is down.
export const SOLAR_PARK_TILT = SOLAR_TILT_MIN;

export interface SolarAim {
  yawDeg: number;    // plan-frame yaw of the panel face (0 = faces +Y world, CW)
  tiltDeg: number;   // degrees from horizontal
  parked: boolean;   // see the park rule on solarAim
}

function normDeg(d: number): number { const m = d % 360; return m < 0 ? m + 360 : m; }
function clampTilt(t: number): number {
  return Math.max(SOLAR_TILT_MIN, Math.min(SOLAR_TILT_MAX, t));
}

// ── Per-axis tracking switches ──────────────────────────────────────────────
// Each axis can be frozen at a user-set value instead of following the sun —
// `trackAzimuth:false, trackTilt:false` is an ordinary FIXED roof/ground array.
// The pure aim function stays dumb: it takes an already-plan-frame fixed
// azimuth, because mapping the stored COMPASS bearing needs the fitted geo θ,
// which only the callers have. `solarTrackOpts` below is that one mapping, so
// the 3D build (via three-view), the 2D draw and the sidebar readout resolve
// identically and can never fork.
export interface SolarTrackOpts {
  trackAzimuth?: boolean;              // absent = true
  trackTilt?: boolean;                 // absent = true
  fixedAzimuthPlanDeg?: number | null; // plan-frame degrees (already through θ)
  fixedTiltDeg?: number | null;        // degrees from horizontal (clamped by solarAim)
}

// Defaults for a frozen axis: due SOUTH at a 35° pitch — the generic
// northern-hemisphere fixed-array orientation.
export const SOLAR_FIXED_AZIMUTH_DEG = 180;
export const SOLAR_FIXED_TILT_DEG = 35;

// Fixture → aim options, or `undefined` when BOTH axes track (the byte-identical
// fast path: `solarAim(az, el, base, undefined)` is the original two-axis
// tracker, expression for expression). The stored `fixedAzimuthDeg` is a COMPASS
// bearing, so "180" means TRUE south on any calibrated plan — mapped through the
// SAME `compassToPlanDeg` the sun itself uses.
export function solarTrackOpts(
  sp: {
    trackAzimuth?: boolean; trackTilt?: boolean;
    fixedAzimuthDeg?: number | null; fixedTiltDeg?: number | null;
  },
  thetaRad: number,
): SolarTrackOpts | undefined {
  const trackAzimuth = sp.trackAzimuth !== false;
  const trackTilt = sp.trackTilt !== false;
  if (trackAzimuth && trackTilt) return undefined;
  // `null` = unset (never 0 — see the same guard in solarAim).
  const azRaw = sp.fixedAzimuthDeg == null ? NaN : Number(sp.fixedAzimuthDeg);
  const tiltRaw = sp.fixedTiltDeg == null ? NaN : Number(sp.fixedTiltDeg);
  return {
    trackAzimuth, trackTilt,
    fixedAzimuthPlanDeg: compassToPlanDeg(
      isFinite(azRaw) ? azRaw : SOLAR_FIXED_AZIMUTH_DEG, thetaRad),
    fixedTiltDeg: isFinite(tiltRaw) ? tiltRaw : SOLAR_FIXED_TILT_DEG,
  };
}

// Compose the tracked sun aim with the fixture's BASE yaw offset, honouring the
// per-axis tracking switches.
//
// Per axis: a TRACKING axis follows the sun while it is up and goes to its stow
// value when the sun is down (tilt → SOLAR_PARK_TILT, yaw → the base rotation);
// a FROZEN axis holds its fixed value day and night.
//
// PARK RULE (pinned in solar-test §3b): `parked` = "the sun is unusable AND this
// panel actually has an axis that went home" —
//     parked = !sunUp && (trackAzimuth || trackTilt)
// so a fully FIXED mount (both switches off) is NEVER parked (it never moves, so
// there is nothing to stow), while any panel with at least one live axis parks at
// night even if the other axis is frozen. That keeps `parked`'s two consumers
// honest: both renderers dim the array and drop the "aiming at the sun" arrow
// exactly when there is no sun to aim at, and a fixed mount keeps its authored
// pose + full-strength look around the clock.
//
// With `opts` absent (or both axes tracking) every expression below reduces to
// the original two-axis tracker, so existing callers are bit-identical.
export function solarAim(
  sunAzDeg: number | null | undefined,
  sunElevDeg: number | null | undefined,
  baseRotDeg = 0,
  opts?: SolarTrackOpts,
): SolarAim {
  const baseRaw = Number(baseRotDeg);
  const base = isFinite(baseRaw) ? baseRaw : 0;
  const az = Number(sunAzDeg), el = Number(sunElevDeg);
  const sunUp = isFinite(az) && isFinite(el) && el > 0;

  const trackAz = opts?.trackAzimuth !== false;
  const trackTilt = opts?.trackTilt !== false;
  // A missing / non-finite fixed value is a defined degenerate, never a NaN
  // pose: the azimuth falls back to 0 (= the base rotation alone — this fn
  // cannot map a compass bearing without θ) and the tilt to the shared 35°
  // default. `null` means "unset" here and must NOT coerce to 0 — the fields are
  // typed `number | null`, and Number(null) === 0 would silently pitch a
  // tilt-frozen array flat at the mechanical minimum.
  const fAzRaw = opts?.fixedAzimuthPlanDeg == null ? NaN : Number(opts.fixedAzimuthPlanDeg);
  const fixedAz = isFinite(fAzRaw) ? fAzRaw : 0;
  const fTiltRaw = opts?.fixedTiltDeg == null ? NaN : Number(opts.fixedTiltDeg);
  const fixedTilt = isFinite(fTiltRaw) ? fTiltRaw : SOLAR_FIXED_TILT_DEG;

  return {
    yawDeg: trackAz
      ? normDeg(sunUp ? az + base : base)
      : normDeg(fixedAz + base),
    tiltDeg: trackTilt
      ? (sunUp ? clampTilt(90 - el) : SOLAR_PARK_TILT)
      : clampTilt(fixedTilt),
    parked: !sunUp && (trackAz || trackTilt),
  };
}

// ── Fixture metrics + readouts ──────────────────────────────────────────────
export const SOLAR_DEFAULTS = {
  panelW: 1650,       // panel width across the tilt axis (mm)
  panelH: 1000,       // panel length along the slope (mm)
  panelT: 60,         // laminate + frame thickness (mm)
  postH: 900,         // pedestal height to the tilt pivot (mm)
  postR: 80,          // pedestal radius (mm)
  hitRadiusMm: 500,   // 2D point-in-circle hit test on the base
};

export function solarRotation(sp: { rotation?: number }): number {
  const v = Number(sp.rotation ?? 0);
  return isFinite(v) ? v : 0;
}

// Bound power sensor → watts, or null when unbound / unparseable. Deliberately
// signed: some whole-home monitors report NEGATIVE for grid draw (vs positive
// generation), and the readouts say so instead of hiding it.
export function solarPowerValue(st: { state?: string } | null | undefined): number | null {
  if (!st) return null;
  const v = parseFloat(String(st.state));
  return isFinite(v) ? v : null;
}

export const SOLAR_GEN_COLOR = '#69f0ae';    // generating (positive watts)
export const SOLAR_DRAW_COLOR = '#ffb74d';   // drawing / negative reading

export function solarPowerColor(w: number | null | undefined): string {
  return (typeof w === 'number' && isFinite(w) && w < 0) ? SOLAR_DRAW_COLOR : SOLAR_GEN_COLOR;
}

export function solarPowerText(w: number | null | undefined): string {
  if (typeof w !== 'number' || !isFinite(w)) return '';
  const a = Math.abs(w);
  if (a >= 1000) return `${(w / 1000).toFixed(1)} kW`;
  return `${Math.round(w)} W`;
}

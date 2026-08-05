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

export type SunSource = 'entity' | 'clock';

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

// The sun the solar fixture tracks: the REAL `sun.sun` reading when both
// attributes parse, else the deterministic clock arc. `source` drives the
// sidebar's "running on the clock fallback" note.
export function resolveSunPlan(
  sunState: { state?: string; attributes?: Record<string, unknown> } | null | undefined,
  thetaRad: number,
  nowMs: number,
): { sun: SunPlan; source: SunSource } {
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
  parked: boolean;   // true = sun below the horizon (or unresolved) → stowed
}

function normDeg(d: number): number { const m = d % 360; return m < 0 ? m + 360 : m; }

// Compose the tracked sun aim with the fixture's BASE yaw offset. Sun at or
// below the horizon (or a non-finite reading) → parked flat at the base yaw.
export function solarAim(
  sunAzDeg: number | null | undefined,
  sunElevDeg: number | null | undefined,
  baseRotDeg = 0,
): SolarAim {
  const baseRaw = Number(baseRotDeg);
  const base = isFinite(baseRaw) ? baseRaw : 0;
  const az = Number(sunAzDeg), el = Number(sunElevDeg);
  if (!isFinite(az) || !isFinite(el) || el <= 0) {
    return { yawDeg: normDeg(base), tiltDeg: SOLAR_PARK_TILT, parked: true };
  }
  return {
    yawDeg: normDeg(az + base),
    tiltDeg: Math.max(SOLAR_TILT_MIN, Math.min(SOLAR_TILT_MAX, 90 - el)),
    parked: false,
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

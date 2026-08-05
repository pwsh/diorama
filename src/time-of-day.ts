// Shared time-of-day plumbing. Two deterministic resolvers used across the app:
//   resolveScenePreset — the 3D lighting rig preset (moved out of three-view so
//     activities/bubbles can consult the same auto-lighting logic).
//   resolveTimeBucket  — a coarse morning/day/evening/night/late_night bucket
//     for Sims-style contextual behavior (later phases).
// Both prefer HA's sun.sun elevation and fall back to the local clock.

import type { Scene3D, ScenePreset, HassState } from './types.js';

type States = Record<string, HassState> | null | undefined;

export function sunElevation(states: States): number {
  const sun = states?.['sun.sun'];
  return sun ? parseFloat(String((sun.attributes as Record<string, unknown>)?.elevation)) : NaN;
}

// Is the sun up? The single source of truth for sunny ↔ clear-night gating
// (weather) and any other day/night decision. Prefers HA's sun.sun state
// string, then its elevation, then the local clock (07:00–18:59 = day).
export function isDay(states: States): boolean {
  const sun = states?.['sun.sun'];
  if (sun?.state === 'above_horizon') return true;
  if (sun?.state === 'below_horizon') return false;
  const elev = sunElevation(states);
  if (isFinite(elev)) return elev > 0;
  const h = new Date().getHours();
  return h >= 7 && h < 19;
}

// Resolve the lighting preset for auto modes. 'clock' prefers HA's sun.sun
// elevation and falls back to the local clock; 'lux' maps an illuminance
// entity through fixed thresholds; 'manual' (default) uses sc.preset. Behavior
// is identical to the former three-view._effectivePreset — it now delegates
// here so the resolved preset still feeds the 3D dirty key.
// Weather lighting modifier (W2). The SINGLE mechanism is a day→dusk preset
// DOWNGRADE: overcast / precipitation / fog / lightning conditions knock a
// bright day scene down to the warmer, dimmer dusk rig; night/dusk are already
// dark and stay put; clear / partlycloudy / windy days keep full sun. Because
// three-view folds the effective preset into `_keyFloor`, a condition flip that
// changes the downgraded preset triggers exactly one floor rebuild — no new
// dirty-key plumbing. Consumed only when `weather.affectLighting !== false`.
export interface WeatherLightMod { condition: string; affect: boolean; }

const WEATHER_DIM_CONDITIONS = new Set<string>([
  'cloudy', 'fog', 'rainy', 'pouring', 'snowy', 'snowy-rainy', 'hail',
  'lightning', 'lightning-rainy',
]);

// `sunElevOverrideDeg` (demo weather source): when finite it REPLACES the
// `sun.sun` read in clock mode, so an authored elevation of −10 genuinely
// flips the scene to night at local noon. Absent / non-finite → the existing
// sun.sun-then-clock ladder, byte-identical.
export function resolveScenePreset(
  sc: Scene3D | undefined, states: States, weather?: WeatherLightMod,
  sunElevOverrideDeg?: number | null,
): ScenePreset {
  const st = states ?? {};
  const mode = sc?.lightMode ?? 'manual';
  let preset: ScenePreset;
  if (mode === 'clock') {
    const elev = (sunElevOverrideDeg != null && isFinite(sunElevOverrideDeg))
      ? sunElevOverrideDeg : sunElevation(st);
    if (isFinite(elev)) preset = elev > 10 ? 'day' : elev > -4 ? 'dusk' : 'night';
    else {
      const h = new Date().getHours();
      preset = (h >= 7 && h < 17) ? 'day'
             : ((h >= 5 && h < 7) || (h >= 17 && h < 20)) ? 'dusk' : 'night';
    }
  } else if (mode === 'lux' && sc?.luxEntity) {
    const v = parseFloat(st[sc.luxEntity]?.state ?? '');
    preset = isFinite(v) ? (v >= 3000 ? 'day' : v >= 300 ? 'dusk' : 'night') : (sc?.preset ?? 'night');
  } else {
    preset = sc?.preset ?? 'night';
  }
  // Weather dim: only a bright DAY is knocked to dusk (night/dusk already dark).
  if (weather && weather.affect && preset === 'day'
      && WEATHER_DIM_CONDITIONS.has(weather.condition)) {
    return 'dusk';
  }
  return preset;
}

export type TimeBucket = 'morning' | 'day' | 'evening' | 'night' | 'late_night';

// Coarse time-of-day bucket for contextual character behavior. Prefers HA's
// sun.sun elevation (tracks real daylight), disambiguating morning vs evening
// and day vs night by the local clock hour:
//   elevation > 10°  → 'day', but before 11:00 local it's still 'morning'
//   elevation > -4°  → twilight: 'morning' before noon, else 'evening'
//   else (night)     → 'late_night' when hour ≥ 23 or < 5, else 'night'
// Fallback without sun.sun, clock only:
//   05–10 morning · 11–16 day · 17–21 evening · 22 night · 23–04 late_night
// `sunElevOverrideDeg` (demo weather source) replaces the `sun.sun` read the
// same way resolveScenePreset's does — a demo night genuinely reads as night to
// the avatar bubble tiers. The local hour still disambiguates morning/evening
// (the demo source authors a sun, not a clock). Absent → byte-identical.
export function resolveTimeBucket(
  states: States, sunElevOverrideDeg?: number | null,
): TimeBucket {
  const h = new Date().getHours();
  const elev = (sunElevOverrideDeg != null && isFinite(sunElevOverrideDeg))
    ? sunElevOverrideDeg : sunElevation(states);
  if (isFinite(elev)) {
    if (elev > 10) return h < 11 ? 'morning' : 'day';
    if (elev > -4) return h < 12 ? 'morning' : 'evening';
    return (h >= 23 || h < 5) ? 'late_night' : 'night';
  }
  if (h >= 5 && h <= 10) return 'morning';
  if (h >= 11 && h <= 16) return 'day';
  if (h >= 17 && h <= 21) return 'evening';
  if (h === 22) return 'night';
  return 'late_night';  // 23:00–04:59
}

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
export function resolveScenePreset(sc: Scene3D | undefined, states: States): ScenePreset {
  const st = states ?? {};
  const mode = sc?.lightMode ?? 'manual';
  if (mode === 'clock') {
    const elev = sunElevation(st);
    if (isFinite(elev)) return elev > 10 ? 'day' : elev > -4 ? 'dusk' : 'night';
    const h = new Date().getHours();
    if (h >= 7 && h < 17) return 'day';
    if ((h >= 5 && h < 7) || (h >= 17 && h < 20)) return 'dusk';
    return 'night';
  }
  if (mode === 'lux' && sc?.luxEntity) {
    const v = parseFloat(st[sc.luxEntity]?.state ?? '');
    if (isFinite(v)) return v >= 3000 ? 'day' : v >= 300 ? 'dusk' : 'night';
  }
  return sc?.preset ?? 'night';
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
export function resolveTimeBucket(states: States): TimeBucket {
  const h = new Date().getHours();
  const elev = sunElevation(states);
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

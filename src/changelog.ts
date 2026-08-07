// Bundled release changelog — shown in Settings ▸ Connection, in the About
// block's scrolling "Recent releases" list under the Changelog link.
//
// ZERO imports, pure data (the flags.ts/sky-catalog.ts idiom). Bundled rather
// than fetched so the list works offline, in kiosk mode, and in the gh-pages
// demo — no network, no CORS, no staleness.
//
// MAINTENANCE (release runbook step — see docs/STATUS.md): every release
// PREPENDS one entry here (newest first) with 3–5 terse user-facing bullets
// condensed from the GitHub release notes. Keep all history in the file (it's
// cheap text); the UI shows only the first CHANGELOG_DISPLAY_COUNT. Dates are
// the UTC publish date. The first entry's version should always match
// package.json at release time.

export interface ChangelogEntry {
  version: string;   // 'v0.62.0'
  name: string;      // release codename ('personal space')
  date: string;      // UTC publish date, YYYY-MM-DD
  notes: string[];   // terse user-facing bullets, 3–5
}

export const CHANGELOG_DISPLAY_COUNT = 10;

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: 'v0.62.0', name: 'personal space', date: '2026-08-07',
    notes: [
      'Avatars stop mobbing windows — standing activity spots are single-occupancy, like seats',
      'Roamers genuinely roam: per-avatar wandering with real yard excursions',
      'Unreachable destinations re-roll instead of pathing into walls',
      'Wall-cutaway fade is frame-rate-independent (no more 120 Hz flashing while orbiting)',
    ],
  },
  {
    version: 'v0.61.0', name: 'measure twice', date: '2026-08-06',
    notes: [
      'Home Assistant 2026.8 compatibility: the panel sizes itself (HA’s new host styling collapsed it to zero height)',
      'After updating: reset the frontend cache and restart the companion app',
      'Do NOT add handle_safe_area to the panel_custom YAML — HA core 2026.8.0 rejects it',
    ],
  },
  {
    version: 'v0.60.0', name: 'solid ground', date: '2026-08-06',
    notes: [
      'Ground banding fixed — layered ground paint no longer hatches into dark wedges',
      'Motion-sensor coverage decals un-stuck from the floor slab',
      'Light floor-pools now wash over painted ground and rugs, matching the 2D plan',
    ],
  },
  {
    version: 'v0.59.0', name: 'true colors', date: '2026-08-06',
    notes: [
      'Airline liveries: identified aircraft paint real brand colors (129-operator table)',
      'Flight card gains a full Airline block — name, IATA, spoken ATC form, slogan, partners',
      'Customizable fuselage and tow-banner text; "airline" joins the label fields',
      'Regionals honestly carry no colors; military and privacy flags always win',
    ],
  },
  {
    version: 'v0.58.0', name: 'weather on demand', date: '2026-08-06',
    notes: [
      'Demo weather source: hand-author condition, temps, wind, clouds, moon phase, sun position, alerts — zero network',
      'Windows are solid to avatars and the robot vacuum; only doors pass',
      'The lawn mower is hard-contained outdoors — fences contain, gates pass',
      'mmWave sensors gain the "Demo avatar" checkbox',
    ],
  },
  {
    version: 'v0.57.0', name: 'chasing the sun', date: '2026-08-05',
    notes: [
      'Sun-tracking solar panel fixture — aims at the real sun, UV-tinted frame, wattage glow',
      'Eleven vehicle geometry corrections from visual review',
      'Three new vehicles: ex-police sedan, Apollo Lunar Rover, Perseverance Mars rover',
      'New flying-models gallery page (62 banner-tow craft)',
    ],
  },
  {
    version: 'v0.56.0', name: 'sound the alarm', date: '2026-08-05',
    notes: [
      'Sirens dispatch properly — state-aware on/off with tone, volume and duration, feature-gated per device',
      'Outdoor avatars raise a parasol at very high UV (rain’s umbrella still wins)',
      'New network rack appliance with an aggregate health LED',
    ],
  },
  {
    version: 'v0.55.0', name: 'wheels up', date: '2026-08-05',
    notes: [
      'Vehicle model library: selectable packs (Settings ▸ Vehicles) + a toolbar tab with real 3D thumbnails',
      '23 ground vehicles and 34 aircraft/spacecraft join the roster',
      'Military skins on live ADS-B traffic (F-16, F-22, A-10, B-2, B-52, Apache)',
      'Mailbox rebuilt as a proper tunnel box with a working, clickable flag',
    ],
  },
  {
    version: 'v0.54.0', name: 'that’s no moon', date: '2026-08-01',
    notes: [
      'Gates truly break railing walls, with railing-styled gate panels',
      '19 new banner tow craft (military/NASA + fiction homages); the news chopper becomes an aircraft option',
      '"Space station" moon option — the real phases still apply',
    ],
  },
  {
    version: 'v0.53.0', name: 'hands on', date: '2026-08-01',
    notes: [
      'Midpoint "+" handles insert vertices; whole shapes drag as one',
      'Room labels live at (and drag with) their placement marker',
      'Universal alignment guides + Alt+click identify anything',
      'Custom banner/train/chopper colors; doors and windows clickable in 3D',
    ],
  },
];

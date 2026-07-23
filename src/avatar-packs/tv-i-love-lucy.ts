// Pop Culture ▸ TV ▸ I Love Lucy — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric homage: color + silhouette only, no
// likenesses/logos. Remembered-in-color 1950s palette (the series was b/w).
// Named-cast pack → FIXED costume colors, not tint carriers. Collars/ties ride
// the `neck` anchor. Source doc: docs/avatars/pop-culture/tv-i-love-lucy.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'tv-i-love-lucy', version: 1, label: 'I Love Lucy',
  path: ['Pop Culture', 'TV Shows', 'I Love Lucy'], builtin: true, franchise: true,
  avatars: [
    // Lucy Ricardo — swept-up red hair, white Peter Pan collar over a red dress.
    // approx: iconic polka-dot print unsupported (no fabric patterns) — solid red.
    { id: 'tv-i-love-lucy/lucy-comedienne', label: 'Comedienne (upswept red hair, red dress)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, skin: 0xf0c7a0, body: 0xc41e3a, legColor: 0xc41e3a,
        shoe: 0x2a2220, eyes: 'almond', emI: 0, limbR: 0.9, hands: 'sphere' },
      accessories: [
        { shape: 'sphere', size: [75, 60, 70], anchor: 'crown', pos: [0, -6, 22], rot: [0.35, 0, 0], color: 0xb5451f },
        { shape: 'box', size: [40, 30, 14], anchor: 'crown', pos: [48, 6, 20], color: 0xf5f0e8 },
        { shape: 'box', size: [60, 26, 8], anchor: 'neck', pos: [-24, 2, -86], rot: [0, 0, 0.5], color: 0xffffff },
        { shape: 'box', size: [60, 26, 8], anchor: 'neck', pos: [24, 2, -86], rot: [0, 0, -0.5], color: 0xffffff },
        { shape: 'box', size: [210, 26, 165], anchor: 'hip', pos: [0, 30, 0], color: 0x1c1c1c },
      ],
      personality: { bobMul: 1.15, swayMul: 1.2, cadenceMul: 1.05, ampMul: 1.3 },
      bubbles: ['😆', '🍫', '📺', '💄'] },

    // Ricky Ricardo — white dinner jacket, black bow tie + ruffled shirt, conga.
    { id: 'tv-i-love-lucy/ricky-bandleader', label: 'Bandleader (white dinner jacket, conga)',
      rig: 'humanoid',
      humanoid: { sk: 1.03, headR: 124, skin: 0xc98a5e, body: 0xf5f2ea, legColor: 0x1a1a1a,
        shoe: 0x141414, eyes: 'almond', emI: 0, limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: [65, 18, 65], anchor: 'crown', pos: [0, -6, 4], rot: [0.25, 0, 0], color: 0x140d08 },
        { shape: 'box', size: [48, 18, 12], anchor: 'neck', pos: [0, 8, -86], color: 0x101010 },
        { shape: 'box', size: [70, 40, 8], anchor: 'chest', pos: [0, 20, -8], color: 0xffffff },
        { shape: 'cylinder', size: [55, 55, 90], anchor: 'handR', pos: [0, -50, 20], color: 0x8a5a34 },
        { shape: 'cylinder', size: [56, 56, 12], anchor: 'handR', pos: [0, -6, 20], color: 0xe8dcc0 },
      ],
      personality: { bobMul: 1.05, swayMul: 1.3, cadenceMul: 1.15, ampMul: 1.0 },
      bubbles: ['🎶', '🥁', '😲', '❤️'] },

    // Ethel Mertz — two-tone "bad dye job" blonde hair, apron over a housedress.
    { id: 'tv-i-love-lucy/ethel-landlady', label: 'Landlady friend (bleached blonde, apron)',
      rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 118, skin: 0xe6b58f, body: 0x7f9c8c, legColor: 0x7f9c8c,
        shoe: 0x5a3d2b, eyes: 'dots', emI: 0, limbR: 0.95 },
      accessories: [
        { shape: 'sphere', size: [64, 37, 64], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0xe4cf7e },
        { shape: 'box', size: [90, 16, 14], anchor: 'crown', pos: [0, -28, -40], color: 0x5c4a2e },
        { shape: 'box', size: [150, 210, 8], anchor: 'chest', pos: [0, 0, -8], color: 0xf2efe6 },
        { shape: 'box', size: [60, 30, 14], anchor: 'hip', pos: [0, 10, 40], color: 0xf2efe6 },
      ],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['🙄', '🧺', '☕', '😏'] },

    // Fred Mertz — bald (no crown accessory), brown cardigan, cigar prop.
    { id: 'tv-i-love-lucy/fred-landlord', label: 'Landlord (bald, brown cardigan)',
      rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, skin: 0xdda87e, body: 0x8a6a3e, legColor: 0x3a3a3a,
        shoe: 0x1c1c1c, eyes: 'dots', emI: 0.05, limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [70, 22, 6], anchor: 'neck', pos: [0, 4, -86], color: 0xf2efe6 },
        { shape: 'sphere', size: 8, anchor: 'chest', pos: [0, 24, -10], color: 0xc9a227 },
        { shape: 'sphere', size: 8, anchor: 'chest', pos: [0, -6, -10], color: 0xc9a227 },
        { shape: 'cylinder', size: [7, 7, 60], anchor: 'handR', pos: [0, -18, 0], rot: [0, 0, 1.57], color: 0x5a3a20 },
        { shape: 'sphere', size: 9, anchor: 'handR', pos: [30, -18, 0], color: 0xff7a1a, emissive: 0xff7a1a, emissiveIntensity: 0.5 },
      ],
      personality: { bobMul: 0.6, swayMul: 0.55, cadenceMul: 0.85, ampMul: 0.75 },
      bubbles: ['😤', '🪙', '📰', '😒'] },

    // Little Ricky — the pack's only child; overalls + drumsticks.
    { id: 'tv-i-love-lucy/little-ricky', label: 'Young son (overalls, drumsticks)',
      rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 108, skin: 0xd9a06e, body: 0xeae4d0, legColor: 0x3b5ba0,
        shoe: 0xf2efe6, eyes: 'dots', emI: 0, limbR: 0.9 },
      accessories: [
        { shape: 'sphere', size: [55, 15, 55], anchor: 'crown', pos: [0, -4, 2], rot: [0.25, 0, 0], color: 0x140d08 },
        { shape: 'box', size: [24, 130, 6], anchor: 'chest', pos: [0, -10, -10], color: 0xc41e3a },
        { shape: 'cylinder', size: [5, 5, 60], anchor: 'handR', pos: [0, -18, -6], rot: [1.2, 0, 0], color: 0x8a5a34 },
        { shape: 'cylinder', size: [5, 5, 60], anchor: 'handL', pos: [0, -18, -6], rot: [1.2, 0, 0], color: 0x8a5a34 },
      ],
      personality: { bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.3, ampMul: 1.2 },
      bubbles: ['🥁', '🎈', '🧸', '😄'] },

    // Tropicana showgirl — generic ensemble archetype; feather headdress, ruffles.
    { id: 'tv-i-love-lucy/tropicana-showgirl', label: 'Nightclub showgirl (ruffles, feather headdress)',
      rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 116, skin: 0xd9a06e, body: 0xff6f61, legColor: 0xff6f61,
        shoe: 0xf2efe6, eyes: 'almond', emI: 0.12, limbR: 0.85 },
      accessories: [
        { shape: 'sphere', size: [55, 45, 55], anchor: 'crown', pos: [0, -6, 12], rot: [0.35, 0, 0], color: 0xb5451f },
        { shape: 'cone', size: [16, 130, 16], anchor: 'crown', pos: [0, 60, 16], rot: [0.25, 0, 0], color: 0xff6f61 },
        { shape: 'cone', size: [15, 110, 15], anchor: 'crown', pos: [-32, 52, 16], rot: [0.25, 0, -0.3], color: 0xd4af37 },
        { shape: 'cone', size: [15, 110, 15], anchor: 'crown', pos: [32, 52, 16], rot: [0.25, 0, 0.3], color: 0xd4af37 },
        { shape: 'cone', size: [90, 60, 90], anchor: 'hip', pos: [0, -30, 0], rot: [3.14, 0, 0], color: 0xffb199 },
        { shape: 'sphere', size: 22, anchor: 'handR', pos: [0, -24, 0], color: 0xd4af37 },
      ],
      personality: { bobMul: 1.0, swayMul: 1.35, cadenceMul: 1.2, ampMul: 1.25 },
      bubbles: ['💃', '🎉', '🌺', '🎶'] },
  ],
};

export default pack;

// Cartoons ▸ Despicable Me — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric toon homage of the gadget-villain-turned-
// family franchise and its yellow pill-shaped henchmen: color + silhouette
// only, no logos/likenesses. The three henchmen share a goggle/bib accessory
// recipe; the rest are bespoke. Descriptive-generic labels; the homaged
// character is named in the // comment only.
// Source doc: docs/avatars/cartoons/despicable-me.md
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

// Shared henchman accessory recipe: goggle strap + blue overall bib.
const goggleStrap: AvatarPrimitive =
  { shape: 'box', size: [300, 34, 14], anchor: 'face', pos: [0, 30, -6], color: 0xb8bcc0 };
const bib: AvatarPrimitive[] = [
  { shape: 'box', size: [150, 150, 10], anchor: 'chest', pos: [0, -10, -10], color: 0x2b4a7a },
  { shape: 'box', size: [24, 180, 8], anchor: 'chest', pos: [-50, 20, -12], color: 0x2b4a7a },
  { shape: 'box', size: [24, 180, 8], anchor: 'chest', pos: [50, 20, -12], color: 0x2b4a7a },
  { shape: 'box', size: [40, 32, 6], anchor: 'chest', pos: [0, -24, -13], color: 0x1f3a5f },
];
// Shared henchman humanoid spec (yellow capsule, overalls, goggles via accessory).
const minion = {
  headR: 150, headShape: 'oval' as const, limbR: 0.85,
  skin: 0xf5d217, body: 0xf5d217, shoe: 0x1c1c1c, legColor: 0x2b4a7a,
  emI: 0, hands: 'sphere' as const, eyes: 'none' as const, steel: false,
  footMul: [1.15, 0.75, 1.2] as [number, number, number],
};

const pack: AvatarPackDef = {
  id: 'despicable-me', version: 3, label: 'Despicable Me',
  path: ['Cartoons', 'Despicable Me'], builtin: true, franchise: true,
  avatars: [
    // Gru — tall lanky bald protagonist, pointed nose, grey scarf, black turtleneck.
    { id: 'despicable-me/boss', label: 'Bald boss (grey scarf, black turtleneck)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 138, headShape: 'oval', limbR: 0.82, skin: 0xacb4bd, body: 0x1a1a1a,
        shoe: 0x141414, legColor: 0x1a1a1a, emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 1.0, legL: 1.05 },
      accessories: [
        { shape: 'cone', size: [44, 90], anchor: 'face', pos: [0, -10, -30], rot: [-1.57, 0, 0], color: 0xacb4bd }, // beak nose
        { shape: 'cylinder', size: [100, 100, 40], anchor: 'neck', pos: [0, 0, 0], color: 0xb8bcc0 }, // scarf wrap
        { shape: 'box', size: [70, 320, 10], anchor: 'chest', pos: [0, -60, -12], color: 0xb8bcc0 }, // scarf drape
      ],
      personality: { bobMul: 0.9, swayMul: 1.1, cadenceMul: 0.95, ampMul: 1.0 },
      bubbles: ['🌙', '😈', '🚀', '👧'] },

    // Kevin — tallest henchman, two round lenses, side-swept curl.
    { id: 'despicable-me/henchman_tall', label: 'Tall henchman (twin round lenses)', rig: 'humanoid',
      humanoid: { ...minion, sk: 0.6, armL: 0.85, legL: 0.82 },
      accessories: [
        goggleStrap,
        { shape: 'sphere', size: [44, 44, 20], anchor: 'face', pos: [-40, 26, -16], color: 0x3b2a1e }, // lens L
        { shape: 'sphere', size: [44, 44, 20], anchor: 'face', pos: [40, 26, -16], color: 0x3b2a1e }, // lens R
        { shape: 'cylinder', size: [10, 10, 30], anchor: 'crown', pos: [40, 10, 0], rot: [0, 0, 0.5], color: 0x161616 }, // curl
        ...bib,
      ],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['🍌', '🤟', '😃', '🎯'] },

    // Stuart — medium henchman, single centered lens, wild hair spike.
    { id: 'despicable-me/henchman_wild', label: 'Wild-haired henchman (single center lens)', rig: 'humanoid',
      humanoid: { ...minion, sk: 0.52, armL: 0.82, legL: 0.78 },
      accessories: [
        goggleStrap,
        { shape: 'sphere', size: [52, 52, 22], anchor: 'face', pos: [0, 26, -16], color: 0x4a3222 }, // center lens
        { shape: 'cone', size: [14, 90], anchor: 'crown', pos: [20, 20, 0], rot: [0, 0, 0.3], color: 0x161616 }, // hair spike
        ...bib,
      ],
      personality: { bobMul: 1.2, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.15 },
      bubbles: ['🎸', '🍌', '😝', '🎵'] },

    // Bob — shortest henchman, mismatched lenses (heterochromia via per-eye accessory), teddy bear.
    { id: 'despicable-me/henchman_small', label: 'Small henchman (mismatched lenses, teddy bear)', rig: 'humanoid',
      humanoid: { ...minion, sk: 0.45, armL: 0.8, legL: 0.75, footMul: [1.2, 0.8, 1.25] },
      accessories: [
        goggleStrap,
        { shape: 'sphere', size: [44, 44, 20], anchor: 'face', pos: [-40, 26, -16], color: 0x6b8f4a }, // green eye
        { shape: 'sphere', size: [44, 44, 20], anchor: 'face', pos: [40, 26, -16], color: 0x6b4423 }, // brown eye
        { shape: 'cylinder', size: [3, 3, 40], anchor: 'crown', pos: [0, 20, 0], color: 0x161616 }, // sparse wisp
        ...bib,
        { shape: 'sphere', size: 50, anchor: 'handL', pos: [0, -20, 0], color: 0x8a5a34 }, // teddy body
        { shape: 'sphere', size: 34, anchor: 'handL', pos: [0, 20, 0], color: 0x8a5a34 }, // teddy head
      ],
      // approx: teddy bear = static two-sphere cluster (no pose-aware hand prop).
      personality: { bobMul: 1.3, swayMul: 1.3, cadenceMul: 0.9, ampMul: 1.1 },
      bubbles: ['🧸', '🍌', '😊', '🦆'] },

    // Margo — oldest sister, olive jacket, ponytail, square glasses.
    { id: 'despicable-me/sister_oldest', label: 'Bespectacled big sister (olive jacket, ponytail)', rig: 'humanoid',
      humanoid: { sk: 0.66, headR: 118, headShape: 'sphere', limbR: 0.8, skin: 0xf0c8a0, body: 0x7a8f6e,
        shoe: 0xc0392b, legColor: 0x3a3550, emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.85, legL: 0.85 },
      accessories: [
        { shape: 'sphere', size: [60, 60, 50], anchor: 'crown', pos: [0, -10, 40], color: 0x5c3d22 }, // ponytail
        { shape: 'cylinder', size: [24, 24, 10], anchor: 'crown', pos: [0, -6, 40], color: 0xf2f0e8 }, // tie band
        { shape: 'box', size: [36, 30, 8], anchor: 'face', pos: [-30, 20, -8], color: 0x1a1a1a }, // square lens L
        { shape: 'box', size: [36, 30, 8], anchor: 'face', pos: [30, 20, -8], color: 0x1a1a1a }, // square lens R
        { shape: 'box', size: [24, 8, 8], anchor: 'face', pos: [0, 20, -8], color: 0x1a1a1a }, // bridge
        { shape: 'box', size: [90, 20, 10], anchor: 'chest', pos: [0, 60, -10], color: 0xf2f0e8 }, // cream underlayer
      ],
      personality: { bobMul: 0.9, swayMul: 0.85, cadenceMul: 0.95, ampMul: 0.9 },
      bubbles: ['📚', '😌', '👓', '💕'] },

    // Edith — tomboyish middle sister, pink striped ear-flap hat, round glasses.
    { id: 'despicable-me/sister_middle', label: 'Striped-hat sister (round glasses, pink)', rig: 'humanoid',
      humanoid: { sk: 0.6, headR: 118, headShape: 'sphere', limbR: 0.8, skin: 0xf0c8a0, body: 0xdb5c86,
        shoe: 0xf2f2ee, legColor: 0x6b2b3a, emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.85, legL: 0.85 },
      accessories: [
        { shape: 'sphere', size: [130, 90, 130], anchor: 'crown', pos: [0, 10, 0], rot: [0.4, 0, 0], color: 0xdb5c86, sphereArc: [0, 6.283, 0, 1.4] }, // chullo hat
        { shape: 'cylinder', size: [126, 126, 14], anchor: 'crown', pos: [0, -14, 0], rot: [0.4, 0, 0], color: 0xf2f2ee }, // white stripe
        { shape: 'cylinder', size: [10, 10, 80], anchor: 'head', pos: [-90, -40, 10], color: 0xdb5c86 }, // ear-flap L
        { shape: 'cylinder', size: [10, 10, 80], anchor: 'head', pos: [90, -40, 10], color: 0xdb5c86 }, // ear-flap R
        { shape: 'sphere', size: 16, anchor: 'head', pos: [-90, -90, 10], color: 0xf2f2ee }, // pompom L
        { shape: 'sphere', size: 16, anchor: 'head', pos: [90, -90, 10], color: 0xf2f2ee }, // pompom R
        { shape: 'sphere', size: [26, 26, 8], anchor: 'face', pos: [-30, 20, -8], color: 0x1a1a1a }, // round lens L
        { shape: 'sphere', size: [26, 26, 8], anchor: 'face', pos: [30, 20, -8], color: 0x1a1a1a }, // round lens R
        { shape: 'cylinder', size: [8, 8, 40], anchor: 'head', pos: [-70, -10, 10], color: 0xe8c96a }, // blonde wisp
      ],
      // approx: dangling ear-flap tassels are static (no independent secondary-prop sway).
      personality: { bobMul: 1.15, swayMul: 1.25, cadenceMul: 1.1, ampMul: 1.15 },
      bubbles: ['⚡', '😏', '🥋', '🎯'] },

    // Agnes — youngest sister, high ponytail + red scrunchie, unicorn plush.
    { id: 'despicable-me/sister_youngest', label: 'Youngest sister (unicorn plush)', rig: 'humanoid',
      humanoid: { sk: 0.5, headR: 122, headShape: 'sphere', limbR: 0.8, skin: 0xf0c8a0, body: 0xf0d060,
        shoe: 0xf2f2ee, legColor: 0x2b4a7a, emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.85, legL: 0.82 },
      accessories: [
        { shape: 'sphere', size: [54, 54, 50], anchor: 'crown', pos: [0, 20, 20], color: 0x141210 }, // high ponytail
        { shape: 'cylinder', size: [22, 22, 10], anchor: 'crown', pos: [0, 0, 20], color: 0xc0392b }, // red scrunchie
        ...bib,
        { shape: 'sphere', size: [70, 55, 90], anchor: 'handL', pos: [0, -20, 0], color: 0xece7f2 }, // unicorn body
        { shape: 'sphere', size: 40, anchor: 'handL', pos: [0, 20, -10], color: 0xece7f2 }, // unicorn head
        { shape: 'cone', size: [10, 30], anchor: 'handL', pos: [0, 50, -10], color: 0xe8d9a0 }, // unicorn horn
      ],
      // approx: unicorn plush = static sphere cluster (no pose-aware hand prop).
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.15, ampMul: 1.15 },
      bubbles: ['🦄', '🍬', '😊', '✨'] },

    // Dr. Nefario — elderly inventor, bald with side-tufts, huge goggle glasses, stoop.
    { id: 'despicable-me/inventor', label: 'Elderly inventor (goggle glasses, lab coat)', rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 132, headShape: 'oval', limbR: 0.85, skin: 0xe8c9a8, body: 0xf2f0ec,
        shoe: 0x2c2a28, legColor: 0x6b2a2a, emI: 0, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.85, legL: 0.82 },
      posture: { pitch: 0.15 },
      accessories: [
        { shape: 'sphere', size: 40, anchor: 'head', pos: [-90, 30, 0], color: 0xe8e4dc }, // side-tuft L
        { shape: 'sphere', size: 40, anchor: 'head', pos: [90, 30, 0], color: 0xe8e4dc }, // side-tuft R
        { shape: 'sphere', size: [72, 72, 20], anchor: 'face', pos: [-40, 20, -14], color: 0xd8c890 }, // goggle lens L
        { shape: 'sphere', size: [72, 72, 20], anchor: 'face', pos: [40, 20, -14], color: 0xd8c890 }, // goggle lens R
        { shape: 'box', size: [300, 20, 12], anchor: 'face', pos: [0, 20, -4], color: 0x1a1a1a }, // strap
        { shape: 'box', size: [16, 24, 16], anchor: 'head', pos: [95, 0, 0], color: 0x8a8f94 }, // hearing aid
        { shape: 'box', size: [30, 60, 10], anchor: 'chest', pos: [-40, 50, -10], color: 0xf2f0ec }, // collar flap L
        { shape: 'box', size: [30, 60, 10], anchor: 'chest', pos: [40, 50, -10], color: 0xf2f0ec }, // collar flap R
        { shape: 'cylinder', size: [10, 10, 80], anchor: 'handR', pos: [0, -20, 0], color: 0x8a8f94 }, // wrench shaft
        { shape: 'box', size: [30, 20, 16], anchor: 'handR', pos: [0, 30, 0], color: 0x8a8f94 }, // wrench head
      ],
      // approx: plaid trousers simplified to solid maroon per the no-texture convention.
      personality: { bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.6, ampMul: 0.55 },
      bubbles: ['🔧', '🧪', '👴', '⚙️'] },

    // Vector — bowl-cut gadget rival, orange tracksuit, chunky square glasses, potbelly.
    { id: 'despicable-me/villain_gadget', label: 'Bowl-cut rival (orange tracksuit)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 126, headShape: 'sphere', limbR: 1.05, skin: 0xe8b48c, body: 0xf2802a,
        shoe: 0xf2f2ee, legColor: 0xf2802a, emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false, armL: 0.95, legL: 0.9 },
      accessories: [
        { shape: 'sphere', size: [130, 90, 130], anchor: 'crown', pos: [0, 10, 0], rot: [0.4, 0, 0], color: 0x4a3020, sphereArc: [0, 6.283, 0, 1.5] }, // bowl cut
        { shape: 'box', size: [50, 44, 10], anchor: 'face', pos: [-34, 20, -8], color: 0x1a1a1a }, // chunky lens L
        { shape: 'box', size: [50, 44, 10], anchor: 'face', pos: [34, 20, -8], color: 0x1a1a1a }, // chunky lens R
        { shape: 'box', size: [24, 10, 10], anchor: 'face', pos: [0, 20, -8], color: 0x1a1a1a }, // bridge
        { shape: 'box', size: [12, 180, 10], anchor: 'chest', pos: [-60, 0, -12], color: 0xf2f2ee }, // side stripe L
        { shape: 'box', size: [12, 180, 10], anchor: 'chest', pos: [60, 0, -12], color: 0xf2f2ee }, // side stripe R
        { shape: 'sphere', size: 40, anchor: 'root', pos: [0, 20, -40], color: 0xe8b48c }, // potbelly
        { shape: 'cylinder', size: [16, 16, 60], anchor: 'handR', pos: [0, -20, 0], color: 0x3a3a3a }, // gadget
        { shape: 'box', size: [20, 20, 20], anchor: 'handR', pos: [0, 20, 0], color: 0xdb5c86 }, // gadget tip
      ],
      personality: { bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.1 },
      bubbles: ['😎', '🚀', '🦑', '👓'] },

    // El Macho — luchador villain, muscular, red cape, handlebar mustache.
    { id: 'despicable-me/villain_macho', label: 'Luchador villain (red cape, mustache)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 130, headShape: 'sphere', limbR: 1.35, skin: 0xc98a5c, body: 0x1a1a1a,
        shoe: 0x8a1620, legColor: 0x8a1620, emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false, armL: 1.05, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [40, 10, 10], anchor: 'face', pos: [-24, -30, -8], rot: [0, 0, 0.4], color: 0x1a1410 }, // mustache L
        { shape: 'box', size: [40, 10, 10], anchor: 'face', pos: [24, -30, -8], rot: [0, 0, -0.4], color: 0x1a1410 }, // mustache R
        { shape: 'sphere', size: [130, 70, 130], anchor: 'crown', pos: [0, -6, 0], color: 0x1a1410 }, // slicked hair
        { shape: 'cape', size: [340, 370, 500], anchor: 'back', pos: [0, -160, 20], rot: [0.12, 0, 0], color: 0x8a1620, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // cape
        { shape: 'cylinder', size: [20, 20, 6], anchor: 'chest', pos: [0, -10, -12], color: 0xd4af37 }, // medallion
        { shape: 'box', size: [220, 40, 180], anchor: 'hip', pos: [0, 0, 0], color: 0x141210 }, // belt
        { shape: 'box', size: [40, 34, 10], anchor: 'hip', pos: [0, 0, -92], color: 0xb8bcc0 }, // buckle
      ],
      personality: { bobMul: 0.85, swayMul: 1.0, cadenceMul: 0.85, ampMul: 0.95 },
      bubbles: ['💪', '😤', '🌶️', '👹'] },
  ],
};

export default pack;

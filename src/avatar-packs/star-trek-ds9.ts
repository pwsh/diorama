// Sci-Fi ▸ Star Trek ▸ Deep Space Nine — franchise pack (dynamic-import only).
// Stylized geometric homage: silhouette + division color, no likeness.
// Source doc: docs/avatars/sci-fi/star-trek-ds9.md.
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

// DS9 jumpsuit near-black + division collar colors.
const SUIT = 0x18181c, BOOT = 0x0d0d10;
const CMD = 0x8b1a1a, OPS = 0xb8860b, SCI = 0x2f6f6f;

// approx: no shoulder-yoke anchor — a mirrored pair of division-colored collar
// boxes on the shoulderL/R anchors carries the division color.
const collar = (col: number): AvatarPrimitive[] => [
  { shape: 'box', size: [95, 40, 60], anchor: 'shoulderL', color: col, emissiveIntensity: 0 },
  { shape: 'box', size: [95, 40, 60], anchor: 'shoulderR', color: col, emissiveIntensity: 0 },
];

const pack: AvatarPackDef = {
  id: 'star-trek-ds9', version: 1, label: 'Star Trek: DS9 crew',
  path: ['Sci-Fi', 'Star Trek', 'Deep Space Nine'], builtin: true, franchise: true,
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'sphere',
      eyes: 'dots', steel: false, emI: 0, armL: 1.0, legL: 1.0,
      footMul: [1.0, 1.0, 1.0], shoe: BOOT,
    },
  },
  avatars: [
    // Benjamin Sisko
    { id: 'star-trek-ds9/captain-command', label: 'Captain (command red)', rig: 'humanoid',
      humanoid: { skin: 0x6e4a30, body: SUIT },
      accessories: [...collar(CMD),
        { shape: 'box', size: [120, 16, 12], anchor: 'neck', pos: [0, 0, -78], color: 0x8a8a8f, emissiveIntensity: 0 },
        { shape: 'box', size: [40, 25, 15], anchor: 'face', pos: [0, -34, -8], color: 0x1a1a1a, emissiveIntensity: 0 }],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['☕', '⚾', '🖖', '📖'] },
    // Kira Nerys — Bajoran Militia
    { id: 'star-trek-ds9/first-officer-bajoran', label: 'First officer (Bajoran militia)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, skin: 0xd9a066, body: 0x7a1f2b, legColor: 0x9c8a5e, shoe: 0x3a2e20, limbR: 0.95, armL: 0.95, legL: 0.95 },
      accessories: [
        { shape: 'box', size: [200, 80, 15], anchor: 'chest', pos: [0, 0, -8], rot: [0, 0, 0.5], color: 0x9c8a5e, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 10, 8], anchor: 'face', pos: [0, -6, -10], color: 0xc48a52, emissiveIntensity: 0 },
        // approx: Bajoran right-ear earring simplified to two small beads
        { shape: 'sphere', size: 8, anchor: 'head', pos: [112, -30, 0], color: 0xb8bcc2, emissiveIntensity: 0.05 },
        { shape: 'sphere', size: 8, anchor: 'head', pos: [112, -45, 0], color: 0xb8bcc2, emissiveIntensity: 0.05 },
        { shape: 'sphere', size: [128, 90, 128], anchor: 'crown', pos: [0, -6, 4], rot: [0.2, 0, 0], color: 0x4a3222, emissiveIntensity: 0 }],
      personality: { bobMul: 1.1, swayMul: 1.1, cadenceMul: 1.15, ampMul: 1.1 },
      bubbles: ['🙏', '⚔️', '🕯️', '📿'] },
    // Odo — shapeshifter constable
    { id: 'star-trek-ds9/constable-shapeshifter', label: 'Security chief (shapeshifter constable)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 0xc9915a, body: 0x6b4f30, legColor: 0x8a6a45, shoe: 0x3a2a18, emI: 0.05, limbR: 0.95, armL: 0.95, legL: 0.95, earSkip: true },
      accessories: [
        { shape: 'box', size: [150, 30, 20], anchor: 'neck', pos: [0, 0, -76], color: 0x9c8a5e, emissiveIntensity: 0 },
        // sculpted one-piece "molded" hair dome — no side gaps, no strand detail
        { shape: 'sphere', size: [130, 82, 132], anchor: 'crown', pos: [0, -4, 0], rot: [0.15, 0, 0], color: 0x8a6a45, emissiveIntensity: 0 }],
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['🪣', '🔍', '🧴', '😐'] },
    // Quark — Ferengi bartender
    { id: 'star-trek-ds9/bartender-ferengi', label: 'Bartender (Ferengi entrepreneur)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 108, skin: 0xb5651d, body: 0x5a3620, shoe: 0x2a1a10, limbR: 0.8, armL: 0.85, legL: 0.8, earSkip: true },
      accessories: [
        // the defining huge scalloped ears
        { shape: 'box', size: [50, 120, 30], anchor: 'head', pos: [-100, 10, 0], rot: [0, 0, 0.4], color: 0xb5651d, emissiveIntensity: 0 },
        { shape: 'box', size: [50, 120, 30], anchor: 'head', pos: [100, 10, 0], rot: [0, 0, -0.4], color: 0xb5651d, emissiveIntensity: 0 },
        { shape: 'box', size: [120, 90, 15], anchor: 'chest', pos: [0, 10, -8], color: 0x3d5a2e, emissiveIntensity: 0 },
        { shape: 'sphere', size: 10, anchor: 'chest', pos: [0, 20, -14], color: 0xc9a227, emissiveIntensity: 0.1 },
        { shape: 'sphere', size: 10, anchor: 'chest', pos: [0, 0, -14], color: 0xc9a227, emissiveIntensity: 0.1 },
        { shape: 'box', size: [40, 8, 6], anchor: 'crown', pos: [0, -6, 0], color: 0xa8763f, emissiveIntensity: 0 },
        { shape: 'box', size: [40, 8, 6], anchor: 'crown', pos: [0, 6, 0], color: 0xa8763f, emissiveIntensity: 0 }],
      personality: { bobMul: 0.9, swayMul: 1.3, cadenceMul: 1.2, ampMul: 1.0 },
      bubbles: ['💰', '🍺', '📊', '😏'] },
    // Jadzia Dax — joined Trill
    { id: 'star-trek-ds9/science-officer-trill', label: 'Science officer (Trill)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, skin: 0xe8b891, body: SUIT, limbR: 0.9, armL: 0.95, legL: 0.95 },
      accessories: [...collar(SCI),
        // approx: Trill spot-trail as a short chain of tiny proud spheres
        { shape: 'sphere', size: 7, anchor: 'head', pos: [100, 20, -20], color: 0x3a2418, emissiveIntensity: 0 },
        { shape: 'sphere', size: 7, anchor: 'head', pos: [104, 5, -22], color: 0x3a2418, emissiveIntensity: 0 },
        { shape: 'sphere', size: 7, anchor: 'head', pos: [106, -10, -22], color: 0x3a2418, emissiveIntensity: 0 },
        { shape: 'sphere', size: 7, anchor: 'head', pos: [104, -25, -20], color: 0x3a2418, emissiveIntensity: 0 },
        { shape: 'sphere', size: [130, 100, 130], anchor: 'crown', pos: [0, -6, 4], rot: [0.2, 0, 0], color: 0x2a1a12, emissiveIntensity: 0 }],
      personality: { bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.1, ampMul: 1.05 },
      bubbles: ['🎲', '⚔️', '🔬', '😄'] },
    // Julian Bashir
    { id: 'star-trek-ds9/doctor', label: 'Chief medical officer (teal)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 0xc48a5b, body: SUIT, limbR: 0.95 },
      accessories: [...collar(SCI),
        { shape: 'sphere', size: [128, 40, 128], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x2a1a12, emissiveIntensity: 0 },
        { shape: 'box', size: [40, 60, 20], anchor: 'handR', pos: [0, 0, 0], color: 0xb0b4ba, emissiveIntensity: 0.05 }],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 0.95 },
      bubbles: ['💉', '🔬', '📚', '🎯'] },
    // Worf (DS9 era) — Klingon strategic ops
    { id: 'star-trek-ds9/strategic-ops-klingon', label: 'Strategic operations officer (Klingon)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, skin: 0xa9744f, body: SUIT, limbR: 1.1, armL: 1.05 },
      accessories: [...collar(CMD),
        { shape: 'box', size: [30, 10, 8], anchor: 'face', pos: [0, 26, -9], color: 0x8a5f3f, emissiveIntensity: 0 },
        { shape: 'box', size: [28, 10, 8], anchor: 'face', pos: [0, 38, -7], color: 0x8a5f3f, emissiveIntensity: 0 },
        { shape: 'box', size: [26, 10, 8], anchor: 'face', pos: [0, 50, -5], color: 0x8a5f3f, emissiveIntensity: 0 },
        { shape: 'box', size: [24, 10, 8], anchor: 'face', pos: [0, 62, -3], color: 0x8a5f3f, emissiveIntensity: 0 },
        { shape: 'sphere', size: [140, 120, 140], anchor: 'crown', pos: [0, -4, 8], rot: [0.25, 0, 0], color: 0x1a1210, emissiveIntensity: 0 },
        // approx: Klingon sash (baldric) via one rotated chest box + metal disc
        { shape: 'box', size: [260, 18, 12], anchor: 'chest', pos: [0, 10, -10], rot: [0, 0, -0.6], color: 0x2a1810, emissiveIntensity: 0 },
        { shape: 'sphere', size: 16, anchor: 'chest', pos: [0, 10, -16], color: 0x8a8a90, emissiveIntensity: 0.05 }],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.9, ampMul: 1.15 },
      bubbles: ['⚔️', '🩸', '🍖', '😤'] },
    // Miles O'Brien
    { id: 'star-trek-ds9/engineer', label: 'Chief of operations (engineer)', rig: 'humanoid',
      humanoid: { skin: 0xd9a878, body: SUIT },
      accessories: [...collar(OPS),
        { shape: 'box', size: [35, 8, 6], anchor: 'face', pos: [0, -14, -9], color: 0x8a6a44, emissiveIntensity: 0 },
        { shape: 'sphere', size: [128, 38, 128], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x9a7a50, emissiveIntensity: 0 },
        { shape: 'box', size: [40, 40, 16], anchor: 'handR', pos: [0, 0, 0], color: 0x8a8a90, emissiveIntensity: 0.05 }],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['🔧', '🍻', '🎣', '🛠️'] },
  ],
};

export default pack;

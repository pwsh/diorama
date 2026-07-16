// Sci-Fi ▸ Star Trek ▸ The Next Generation — franchise pack (dynamic-import
// only). Stylized geometric homage: silhouette + division color, no likeness.
// Source doc: docs/avatars/sci-fi/star-trek-tng.md.
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

// TNG division colors + shared trim.
const RED = 0x9c1c24, GOLD = 0xc9982f, TEAL = 0x1f6e7a;
const BLACK = 0x161616, BOOT = 0x0d0d0d, BADGE = 0xd4af37;

// Pack-wide combadge (upper-left chest) + black shoulder/collar yoke.
const COMBADGE: AvatarPrimitive = {
  shape: 'box', size: [40, 28, 6], anchor: 'chest', pos: [-45, 70, -6],
  color: BADGE, emissiveIntensity: 0.1,
};
// approx: no true shoulder-yoke anchor — a wide thin black band at the torso top.
const YOKE: AvatarPrimitive = {
  shape: 'box', size: [210, 38, 150], anchor: 'neck', pos: [0, -16, 0],
  color: BLACK, emissiveIntensity: 0,
};

const pack: AvatarPackDef = {
  id: 'star-trek-tng', version: 1, label: 'Star Trek: TNG crew',
  path: ['Sci-Fi', 'Star Trek', 'Next Generation'], builtin: true, franchise: true,
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'sphere',
      eyes: 'dots', steel: false, emI: 0, armL: 1.0, legL: 1.0,
      footMul: [1.0, 1.0, 1.0], legColor: BLACK, shoe: BOOT,
    },
  },
  avatars: [
    // Jean-Luc Picard
    { id: 'star-trek-tng/captain-bald', label: 'Captain (bald, red uniform)', rig: 'humanoid',
      humanoid: { skin: 0xe0b08c, body: RED },
      accessories: [COMBADGE, YOKE],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['☕', '📖', '🖖', '🚀'] },
    // William Riker
    { id: 'star-trek-tng/commander-bearded', label: 'Commander (bearded, red uniform)', rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 128, skin: 0xe0b08c, body: RED, limbR: 1.1, armL: 1.02 },
      accessories: [COMBADGE, YOKE,
        { shape: 'box', size: [90, 50, 70], anchor: 'face', pos: [0, -30, -6], color: 0x3a2a1e, emissiveIntensity: 0 },
        { shape: 'sphere', size: [130, 40, 130], anchor: 'crown', pos: [0, -8, 10], rot: [0.3, 0, 0], color: 0x3a2a1e, emissiveIntensity: 0 }],
      personality: { bobMul: 1.05, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.1 },
      bubbles: ['🎺', '🚀', '🖖', '😏'] },
    // Data — pale gold synthetic skin + emissive hint
    { id: 'star-trek-tng/android-officer', label: 'Operations officer (android, gold)', rig: 'humanoid',
      humanoid: { skin: 0xd9c99a, body: GOLD, steel: true, emI: 0.15 },
      accessories: [COMBADGE, YOKE,
        { shape: 'sphere', size: [132, 38, 132], anchor: 'crown', pos: [0, -6, 6], rot: [0.25, 0, 0], color: 0x1c1c1c, emissiveIntensity: 0 }],
      personality: { bobMul: 0.4, swayMul: 0.15, cadenceMul: 1.0, ampMul: 0.9 },
      bubbles: ['🤖', '🎻', '🔬', '❓'] },
    // Geordi La Forge — VISOR
    { id: 'star-trek-tng/engineer-visor', label: 'Chief engineer (VISOR, gold)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 0x6b4423, body: GOLD, eyes: 'visor', emI: 0.05 },
      accessories: [COMBADGE, YOKE,
        { shape: 'box', size: [150, 18, 14], anchor: 'face', pos: [0, 4, -8], color: 0xb0b0b0, emissiveIntensity: 0.1 },
        { shape: 'sphere', size: [130, 36, 130], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x1c1c1c, emissiveIntensity: 0 }],
      personality: { bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.15, ampMul: 1.05 },
      bubbles: ['🔧', '💡', '🖖', '🚀'] },
    // Worf — Klingon ridges + ceremonial sash (rotated chest box)
    { id: 'star-trek-tng/klingon-security-chief', label: 'Security chief (Klingon, gold)', rig: 'humanoid',
      humanoid: { sk: 1.08, headR: 132, skin: 0x8a5a3c, body: GOLD, limbR: 1.18, armL: 1.05, legL: 1.03 },
      accessories: [COMBADGE,
        { shape: 'box', size: [26, 14, 18], anchor: 'face', pos: [0, 30, -8], color: 0x6b4126, emissiveIntensity: 0 },
        { shape: 'box', size: [26, 14, 18], anchor: 'face', pos: [0, 44, -6], color: 0x6b4126, emissiveIntensity: 0 },
        { shape: 'box', size: [26, 14, 18], anchor: 'face', pos: [0, 58, -4], color: 0x6b4126, emissiveIntensity: 0 },
        { shape: 'sphere', size: [136, 44, 136], anchor: 'crown', pos: [0, -6, 8], rot: [0.3, 0, 0], color: 0x14100c, emissiveIntensity: 0 },
        // approx: diagonal baldric via one rotated chest box (no two-endpoint strap primitive)
        { shape: 'box', size: [260, 16, 10], anchor: 'chest', pos: [0, 10, -10], rot: [0, 0, -0.6], color: 0xc0c0c0, emissiveIntensity: 0.05 }],
      personality: { bobMul: 0.9, swayMul: 0.6, cadenceMul: 0.9, ampMul: 1.0 },
      bubbles: ['⚔️', '🛡️', '😤', '🦴'] },
    // Beverly Crusher
    { id: 'star-trek-tng/chief-medical-officer', label: 'Chief medical officer (blue, red hair)', rig: 'humanoid',
      humanoid: { sk: 0.96, headR: 122, skin: 0xe8c2a0, body: TEAL, limbR: 0.95 },
      accessories: [COMBADGE, YOKE,
        { shape: 'sphere', size: [140, 90, 140], anchor: 'crown', pos: [0, -4, 6], rot: [0.25, 0, 0], color: 0xa8461f, emissiveIntensity: 0 },
        { shape: 'sphere', size: [40, 70, 30], anchor: 'head', pos: [-110, -20, 0], color: 0xa8461f, emissiveIntensity: 0 },
        { shape: 'sphere', size: [40, 70, 30], anchor: 'head', pos: [110, -20, 0], color: 0xa8461f, emissiveIntensity: 0 }],
      personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.05, ampMul: 0.95 },
      bubbles: ['💉', '🩺', '🌿', '❤️'] },
    // Deanna Troi
    { id: 'star-trek-tng/ships-counselor', label: "Ship's counselor (teal, empath)", rig: 'humanoid',
      humanoid: { sk: 0.94, headR: 120, skin: 0xc48a6a, body: TEAL, eyes: 'almond', limbR: 0.9 },
      accessories: [COMBADGE, YOKE,
        { shape: 'sphere', size: [150, 130, 150], anchor: 'crown', pos: [0, -2, 8], rot: [0.3, 0, 0], color: 0x2b1a12, emissiveIntensity: 0 },
        { shape: 'sphere', size: [45, 110, 35], anchor: 'head', pos: [-112, -30, 0], color: 0x2b1a12, emissiveIntensity: 0 },
        { shape: 'sphere', size: [45, 110, 35], anchor: 'head', pos: [112, -30, 0], color: 0x2b1a12, emissiveIntensity: 0 },
        { shape: 'sphere', size: 14, anchor: 'chest', pos: [0, 30, -12], color: 0x3a2a55, emissiveIntensity: 0.05 }],
      personality: { bobMul: 0.8, swayMul: 0.75, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['💜', '🍫', '🧠', '😌'] },
    // Wesley Crusher
    { id: 'star-trek-tng/acting-ensign', label: 'Acting ensign (grey/burgundy, teen)', rig: 'humanoid',
      humanoid: { sk: 0.82, headR: 112, skin: 0xe8c2a0, body: 0x8a8a8a, legColor: 0x2a2a2a, limbR: 0.85, armL: 0.9, legL: 0.9 },
      accessories: [COMBADGE,
        { shape: 'box', size: [90, 110, 8], anchor: 'chest', pos: [0, 10, -6], color: 0x6b1f2b, emissiveIntensity: 0 },
        { shape: 'sphere', size: [110, 34, 110], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x4a3320, emissiveIntensity: 0 }],
      personality: { bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.2, ampMul: 1.15 },
      bubbles: ['💻', '🚀', '🤓', '✨'] },
  ],
};

export default pack;

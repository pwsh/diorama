// Base ▸ Farm Animals — builtin base-group pack (dynamic-import only). Batch C2
// roster. Fixed breed-accurate coat colors (a Holstein/rooster shouldn't recolor
// to a random sensor tint). Quadrupeds via _buildQuadruped; chicken/rooster are
// bipeds on the humanoid rig (cartoon_duck idiom). All pet:true.
//
// approx notes: large-animal sk is capped ~1.6× dog (visually reasonable in a
// human-scale room; real cow/horse ≈ 2.9×), silhouette carried by
// bodyLen/legLen/neckLen. There is no quad `legColor` field — dark "points"
// (horse/sheep) use `pawColor` (feet only). `neckLen` is mm (×sk in the builder).
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'base-farm-animals', version: 3, label: 'Farm Animals',
  path: ['Base', 'Farm Animals'], builtin: true,
  avatars: [
    // Cow — Holstein black-and-white patches, short horns, udder hint.
    { id: 'cow', label: '🐄 Cow (Holstein)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.15, bodyLen: 864, bodyW: 260, bodyH: 252, legLen: 0.85, neckLen: 90, headR: 130, ears: 'round', tail: 'down', tailLen: 1.0, tailTipColor: 0x2b2320, snout: 1.0, coat: 0xf3efe6, belly: 0xf3efe6, earColor: 0xf3efe6, snoutColor: 0x2b2320 },
      accessories: [
        { shape: 'cone', size: [20, 90], anchor: 'qhead', pos: [-40, 60, 0], rot: [0, 0, 0.3], color: 0xe8ddc8 }, // horn L
        { shape: 'cone', size: [20, 90], anchor: 'qhead', pos: [40, 60, 0], rot: [0, 0, -0.3], color: 0xe8ddc8 }, // horn R
        { shape: 'box', size: [140, 20, 150], anchor: 'qback', pos: [-40, 8, -80], color: 0x141414 }, // patch
        { shape: 'box', size: [110, 20, 130], anchor: 'qback', pos: [60, 8, 120], color: 0x141414 }, // patch
        { shape: 'box', size: [90, 20, 90], anchor: 'qback', pos: [-20, 8, 40], color: 0x141414 }, // patch
        { shape: 'sphere', size: [70, 50, 70], anchor: 'qrump', pos: [0, -90, -50], color: 0xe8a8ad }, // udder hint
      ],
      personality: { bobMul: 0.7, swayMul: 0.8, cadenceMul: 0.6, ampMul: 0.85 }, bubbles: ['🌾', '🐄', '🥛', '💤'] },

    // Pig — pink barrel body, flat disc snout, curly tail, nostril dots.
    { id: 'pig', label: '🐷 Pig', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.85, bodyLen: 736, bodyW: 280, bodyH: 276, legLen: 0.65, neckLen: 15, headR: 120, ears: 'round', tail: 'curl', tailLen: 0.5, snout: 0.9, coat: 0xf0b8bc, belly: 0xf5cdd0, earColor: 0xecabb0, snoutColor: 0xe89aa0 },
      accessories: [
        { shape: 'sphere', size: 12, anchor: 'qhead', pos: [-14, -26, -96], color: 0x3a2a2a }, // nostril L
        { shape: 'sphere', size: 12, anchor: 'qhead', pos: [14, -26, -96], color: 0x3a2a2a }, // nostril R
      ],
      personality: { bobMul: 1.1, swayMul: 1.2, cadenceMul: 1.0, ampMul: 0.9 }, bubbles: ['🌽', '🥔', '🍂', '😋'] },

    // Horse — bay, long neck + legs, near-black mane, dark points (pawColor approx).
    { id: 'horse', label: '🐴 Horse (bay)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.15, bodyLen: 800, bodyW: 170, bodyH: 228, legLen: 1.4, neckLen: 220, headR: 118, ears: 'pointy', tail: 'down', tailLen: 1.7, tailTipColor: 0x1c130e, snout: 1.3, coat: 0x8a5a34, belly: 0x8a5a34, earColor: 0x8a5a34, snoutColor: 0x2a1c14, pawColor: 0x241812 },
      accessories: [
        { shape: 'box', size: [20, 130, 10], anchor: 'qneck', pos: [0, 60, -40], rot: [-0.5, 0, 0], color: 0x1c130e }, // mane
        { shape: 'box', size: [20, 130, 10], anchor: 'qneck', pos: [0, 20, -70], rot: [-0.5, 0, 0], color: 0x1c130e }, // mane
        { shape: 'box', size: [20, 120, 10], anchor: 'qneck', pos: [0, -20, -100], rot: [-0.5, 0, 0], color: 0x1c130e }, // mane
        { shape: 'box', size: [20, 110, 10], anchor: 'qhead', pos: [0, 40, 30], color: 0x1c130e }, // forelock
      ],
      personality: { bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.85, ampMul: 1.3 }, bubbles: ['🌾', '🐴', '🍎', '💨'] },

    // Sheep — oversized cream wool body, black face/legs (face via colors, legs via pawColor).
    { id: 'sheep', label: '🐑 Sheep', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.85, bodyLen: 640, bodyW: 270, bodyH: 372, legLen: 0.55, neckLen: 30, headR: 95, ears: 'round', tail: 'down', tailLen: 0.3, snout: 0.75, coat: 0xf2ece0, belly: 0xf2ece0, earColor: 0x1c1c1c, snoutColor: 0x1c1c1c, pawColor: 0x1c1c1c },
      accessories: [
        { shape: 'sphere', size: 90, anchor: 'qback', pos: [-70, 20, -80], color: 0xf2ece0 }, // wool tuft
        { shape: 'sphere', size: 90, anchor: 'qback', pos: [70, 20, 90], color: 0xf2ece0 }, // wool tuft
        { shape: 'sphere', size: 80, anchor: 'qback', pos: [0, 30, 0], color: 0xf2ece0 }, // wool tuft
      ],
      personality: { bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.1, ampMul: 0.7 }, bubbles: ['🌿', '☁️', '😴', '🐑'] },

    // Goat — tan/fawn, backward-arching horns + chin beard (the goat-vs-sheep read).
    { id: 'goat', label: '🐐 Goat', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.85, bodyLen: 672, bodyW: 180, bodyH: 216, legLen: 1.1, neckLen: 110, headR: 105, ears: 'round', tail: 'down', tailLen: 0.3, snout: 0.85, coat: 0xc2a06a, belly: 0xe8d9bd, earColor: 0xc2a06a, snoutColor: 0x2b2320 },
      accessories: [
        { shape: 'cone', size: [16, 140], anchor: 'qhead', pos: [-28, 60, 10], rot: [-0.9, 0, 0], color: 0x2b2320 }, // horn L
        { shape: 'cone', size: [16, 140], anchor: 'qhead', pos: [28, 60, 10], rot: [-0.9, 0, 0], color: 0x2b2320 }, // horn R
        { shape: 'cone', size: [30, 70], anchor: 'qhead', pos: [0, -50, -70], rot: [3.14, 0, 0], color: 0x4a3c28 }, // beard
      ],
      personality: { bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.15, ampMul: 0.95 }, bubbles: ['🌿', '🥫', '❓', '😋'] },

    // Donkey — gray-dun, long ears (the signature), dorsal cross, upright roached mane.
    { id: 'donkey', label: '🫏 Donkey', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.05, bodyLen: 704, bodyW: 160, bodyH: 216, legLen: 1.15, neckLen: 150, headR: 120, ears: 'long', tail: 'tuft', tailLen: 0.9, tailTipColor: 0x2a2118, snout: 1.15, coat: 0xa39784, belly: 0xd8cdb8, earColor: 0xa39784, snoutColor: 0x362e24 },
      accessories: [
        { shape: 'box', size: [30, 20, 700], anchor: 'qback', pos: [0, 12, 0], color: 0x2a2118 }, // dorsal stripe
        { shape: 'box', size: [200, 20, 30], anchor: 'qback', pos: [0, 14, -150], color: 0x2a2118 }, // shoulder cross
        { shape: 'box', size: [16, 80, 8], anchor: 'qneck', pos: [0, 60, -30], color: 0x2a2118 }, // roached mane
        { shape: 'box', size: [16, 80, 8], anchor: 'qneck', pos: [0, 20, -60], color: 0x2a2118 }, // roached mane
        { shape: 'box', size: [16, 76, 8], anchor: 'qneck', pos: [0, -20, -90], color: 0x2a2118 }, // roached mane
      ],
      personality: { bobMul: 0.75, swayMul: 0.85, cadenceMul: 0.65, ampMul: 0.8 }, bubbles: ['🌾', '🚫', '😤', '💤'] },

    // Chicken — biped hen (rust-brown), yellow legs, cone beak, red comb + wattle.
    { id: 'chicken', label: '🐔 Chicken (hen)', rig: 'humanoid', pet: true,
      humanoid: { sk: 0.55, headR: 95, limbR: 0.75, skin: 0xa9552e, body: 0xa9552e, shoe: 0xe0a020, emI: 0.15, armL: 0.55, footMul: [1.3, 0.6, 1.15], legColor: 0xe0a020, earSkip: true },
      accessories: [
        { shape: 'cone', size: [22, 55], anchor: 'face', pos: [0, -8, -18], rot: [-1.5708, 0, 0], color: 0xe0a020 }, // beak
        { shape: 'sphere', size: 18, anchor: 'crown', pos: [0, 6, -20], color: 0xc23030, emissive: 0xc23030, emissiveIntensity: 0.2 }, // comb
        { shape: 'sphere', size: 18, anchor: 'crown', pos: [0, 8, 10], color: 0xc23030, emissive: 0xc23030, emissiveIntensity: 0.2 }, // comb
        { shape: 'sphere', size: 16, anchor: 'crown', pos: [0, 6, 40], color: 0xc23030, emissive: 0xc23030, emissiveIntensity: 0.2 }, // comb
        { shape: 'sphere', size: [16, 26, 12], anchor: 'face', pos: [0, -40, -20], color: 0xc23030 }, // wattle
      ],
      personality: { bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.3, ampMul: 0.6 }, bubbles: ['🌾', '🥚', '❓', '😮'] },

    // Rooster — iridescent black-green body, larger comb/wattle, sweeping tail plumes.
    { id: 'rooster', label: '🐓 Rooster', rig: 'humanoid', pet: true,
      humanoid: { sk: 0.62, headR: 98, limbR: 0.8, skin: 0x1c2420, body: 0x1c2420, shoe: 0xd4941a, emI: 0.28, armL: 0.55, footMul: [1.35, 0.6, 1.2], legColor: 0xd4941a, earSkip: true },
      accessories: [
        { shape: 'cone', size: [22, 55], anchor: 'face', pos: [0, -8, -18], rot: [-1.5708, 0, 0], color: 0xd4941a }, // beak
        { shape: 'sphere', size: 24, anchor: 'crown', pos: [0, 10, -24], color: 0xd83a3a, emissive: 0xd83a3a, emissiveIntensity: 0.25 }, // comb
        { shape: 'sphere', size: 24, anchor: 'crown', pos: [0, 14, 6], color: 0xd83a3a, emissive: 0xd83a3a, emissiveIntensity: 0.25 }, // comb
        { shape: 'sphere', size: 22, anchor: 'crown', pos: [0, 10, 36], color: 0xd83a3a, emissive: 0xd83a3a, emissiveIntensity: 0.25 }, // comb
        { shape: 'sphere', size: [18, 30, 14], anchor: 'face', pos: [-16, -42, -20], color: 0xd83a3a }, // wattle L
        { shape: 'sphere', size: [18, 30, 14], anchor: 'face', pos: [16, -42, -20], color: 0xd83a3a }, // wattle R
        { shape: 'cone', size: [22, 220], anchor: 'back', pos: [-30, 10, 30], rot: [-0.6, 0, 0.2], color: 0x141a17 }, // tail plume L
        { shape: 'cone', size: [22, 240], anchor: 'back', pos: [0, 20, 40], rot: [-0.5, 0, 0], color: 0x141a17 }, // tail plume mid
        { shape: 'cone', size: [22, 220], anchor: 'back', pos: [30, 10, 30], rot: [-0.6, 0, -0.2], color: 0x141a17 }, // tail plume R
      ],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.1, ampMul: 0.75 }, bubbles: ['🌅', '📣', '🐓', '❗'] },
  ],
};

export default pack;

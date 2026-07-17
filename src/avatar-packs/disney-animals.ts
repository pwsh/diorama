// Cartoons ▸ Disney Animals — franchise pack (opt-in, defaults loaded:false).
// Stylized geometric toon homage — NOT licensed characters, colour + silhouette
// only. Mixed rigs: dressed anthropomorphic mascots (humanoid) + true pets/wild
// animals (quadruped). The mascot recolors reuse existing geometry branches via
// legacyAccessories WITHOUT touching the locked core kinds. Sizes are mm at sk=1.
//
// approx: the doc's quadruped bodyLen/bodyW/bodyH were written as multipliers;
// converted here to absolute mm at sk=1 (the shipped QuadrupedFields convention,
// dog baseline 640/200/240) — e.g. cub bodyLen 0.9 -> ~576.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'disney-animals', version: 3, label: 'Disney Animals',
  path: ['Cartoons', 'Disney Animals'], builtin: true, franchise: true,
  avatars: [
    // The flagship mascot mouse — black body, red shorts, giant round black ears.
    // Built explicitly (NOT via cartoon_mouse) so it never touches the legacy kind.
    // approx: white four-finger gloves not separately modeled (rig hands render in body tone).
    { id: 'disney-animals/founding-mouse', label: 'The Founding Mouse (black & red)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 120, headShape: 'sphere', limbR: 0.9, skin: 0x16161a, body: 0x16161a,
        shoe: 0xf2c230, legColor: 0xd21f1a, emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false, earSkip: true },
      accessories: [
        { shape: 'sphere', size: [110, 110, 55], anchor: 'crown', pos: [-95, 60, -10], color: 0x16161a },
        { shape: 'sphere', size: [110, 110, 55], anchor: 'crown', pos: [95, 60, -10], color: 0x16161a },
        { shape: 'box', size: [230, 180, 160], anchor: 'hip', pos: [0, 10, 0], color: 0xd21f1a },
        { shape: 'sphere', size: 15, anchor: 'hip', pos: [-45, 20, 90], color: 0xf5f2ea },
        { shape: 'sphere', size: 15, anchor: 'hip', pos: [45, 20, 90], color: 0xf5f2ea },
        { shape: 'cylinder', size: [16, 10, 200], anchor: 'tailbone', pos: [0, -20, -50], rot: [1.0, 0, 0], color: 0x16161a },
      ],
      personality: { cadenceMul: 1.2, bobMul: 1.1 }, bubbles: ['🎶', '👋', '⭐', '😄'] },

    // The sailor duck — reuses cartoon_duck bill/webbed-feet geometry (already the
    // right white/orange palette); layers a navy sailor collar + cap on top.
    { id: 'disney-animals/sailor-duck', label: 'The Sailor Duck (blue & white)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 122, headShape: 'sphere', limbR: 0.9, skin: 0xf2f0e6, body: 0xf2f0e6,
        shoe: 0xe8a020, legColor: 0xe8a020, footMul: [1.6, 0.7, 1.35], emI: 0.20, hands: 'sphere',
        eyes: 'dots', steel: false },
      legacyAccessories: 'cartoon_duck',
      accessories: [
        { shape: 'box', size: [250, 12, 90], anchor: 'chest', pos: [-70, 150, 70], rot: [0, 0, 0.5], color: 0x2255aa },
        { shape: 'box', size: [250, 12, 90], anchor: 'chest', pos: [70, 150, 70], rot: [0, 0, -0.5], color: 0x2255aa },
        { shape: 'box', size: [260, 14, 40], anchor: 'chest', pos: [0, 130, -60], color: 0x2255aa },
        { shape: 'sphere', size: 22, anchor: 'chest', pos: [0, 120, 82], color: 0x161619 },
        { shape: 'cylinder', size: [140, 140, 30], anchor: 'crown', pos: [0, 30, 0], color: 0x2255aa },
        { shape: 'box', size: [40, 60, 8], anchor: 'crown', pos: [0, 10, -130], color: 'tint' },
      ],
      personality: { cadenceMul: 1.3, swayMul: 1.1, ampMul: 1.15 }, bubbles: ['💢', '🗯️', '🦆', '😤'] },

    // The tall dog-person pal — reuses cartoon_dog muzzle/floppy-ear geometry;
    // lanky build, green fedora, black vest, buck teeth.
    // approx: reused ear/muzzle materials are hardcoded browns, not derived from this skin.
    { id: 'disney-animals/tall-dog-pal', label: 'The Tall Dog Pal (orange & green)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, headShape: 'sphere', limbR: 0.85, skin: 0xd98a4a, body: 0xd98a4a,
        shoe: 0x5a3d28, legColor: 0x2b4a8a, emI: 0.18, armL: 1.15, legL: 1.15, hands: 'sphere',
        eyes: 'dots', steel: false },
      legacyAccessories: 'cartoon_dog',
      accessories: [
        { shape: 'cylinder', size: [88, 88, 180], anchor: 'crown', pos: [0, 130, -10], color: 0x1f7a3a },
        { shape: 'cylinder', size: [150, 150, 20], anchor: 'crown', pos: [0, 45, -10], color: 0x1f7a3a },
        { shape: 'box', size: [190, 40, 150], anchor: 'crown', pos: [0, 62, -10], color: 0x161619 },
        { shape: 'box', size: [90, 220, 20], anchor: 'chest', pos: [-70, 110, 78], color: 0x161619 },
        { shape: 'box', size: [90, 220, 20], anchor: 'chest', pos: [70, 110, 78], color: 0x161619 },
        { shape: 'box', size: [14, 22, 8], anchor: 'face', pos: [-10, -40, 45], color: 0xf5f2ea },
        { shape: 'box', size: [14, 22, 8], anchor: 'face', pos: [10, -40, 45], color: 0xf5f2ea },
      ],
      personality: { cadenceMul: 0.9, swayMul: 1.3, bobMul: 1.2 }, bubbles: ['😅', '🦴', '🎣', '🤪'] },

    // The pet dog — true quadruped, yellow-orange coat, dark floppy ears, swishing tail.
    { id: 'disney-animals/yellow-pup', label: 'The Yellow Pup (true quadruped)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.0, bodyLen: 640, bodyW: 200, bodyH: 240, legLen: 1.0, headR: 120, neckLen: 0,
        headScale: [1, 0.95, 1.05], ears: 'floppy', tail: 'up', tailLen: 1.35, snout: 1.0,
        coat: 0xe8a020, belly: 0xf2d9a0, earColor: 0x2a221c, snoutColor: 0x2a221c },
      accessories: [
        { shape: 'cylinder', size: [110, 110, 26], anchor: 'qneck', pos: [0, 0, 0], rot: [1.4, 0, 0], color: 'tint' },
      ],
      personality: { cadenceMul: 1.4, ampMul: 1.2, swayMul: 1.1 }, bubbles: ['🦴', '🐾', '❤️', '😊'] },

    // Chipmunk (smooth head, dark chocolate-chip nose) — fully new geometry.
    { id: 'disney-animals/chipmunk-smooth', label: 'Chipmunk (smooth head, dark nose)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 105, headShape: 'sphere', limbR: 0.8, skin: 0xa9633a, body: 0xa9633a,
        shoe: 0x5a3a24, legColor: 0xa9633a, emI: 0.10, armL: 0.85, legL: 0.8, hands: 'sphere',
        eyes: 'dots', steel: false, earSkip: true },
      accessories: [
        { shape: 'sphere', size: 34, anchor: 'head', pos: [-55, 80, -10], color: 0xa9633a },
        { shape: 'sphere', size: 34, anchor: 'head', pos: [55, 80, -10], color: 0xa9633a },
        { shape: 'sphere', size: [120, 90, 20], anchor: 'chest', pos: [0, 90, 70], color: 0xe8cfa0 },
        { shape: 'sphere', size: 16, anchor: 'face', pos: [0, -20, 45], color: 0x2a1f1a },
        { shape: 'box', size: [16, 200, 14], anchor: 'back', pos: [0, 60, 60], color: 0x2a1f1a },
        { shape: 'box', size: [10, 180, 12], anchor: 'back', pos: [-26, 60, 58], color: 0xe8cfa0 },
        { shape: 'box', size: [10, 180, 12], anchor: 'back', pos: [26, 60, 58], color: 0xe8cfa0 },
        { shape: 'cylinder', size: [30, 34, 90], anchor: 'back', pos: [0, 100, -20], rot: [-0.6, 0, 0], color: 0xa9633a },
        { shape: 'cylinder', size: [26, 30, 90], anchor: 'back', pos: [0, 180, -40], rot: [-1.1, 0, 0], color: 0xe8cfa0 },
        { shape: 'cylinder', size: [22, 26, 80], anchor: 'back', pos: [0, 250, -30], rot: [-1.6, 0, 0], color: 0xa9633a },
      ],
      personality: { cadenceMul: 1.5, ampMul: 0.7, bobMul: 1.3 }, bubbles: ['🌰', '🤔', '😏', '🧠'] },

    // Chipmunk (head tuft, red nose) — matched pair; differs only by nose + tuft.
    { id: 'disney-animals/chipmunk-tufted', label: 'Chipmunk (head tuft, red nose)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 105, headShape: 'sphere', limbR: 0.8, skin: 0xa9633a, body: 0xa9633a,
        shoe: 0x5a3a24, legColor: 0xa9633a, emI: 0.10, armL: 0.85, legL: 0.8, hands: 'sphere',
        eyes: 'dots', steel: false, earSkip: true },
      accessories: [
        { shape: 'sphere', size: 34, anchor: 'head', pos: [-55, 80, -10], color: 0xa9633a },
        { shape: 'sphere', size: 34, anchor: 'head', pos: [55, 80, -10], color: 0xa9633a },
        { shape: 'sphere', size: [120, 90, 20], anchor: 'chest', pos: [0, 90, 70], color: 0xe8cfa0 },
        { shape: 'sphere', size: 22, anchor: 'face', pos: [0, -20, 46], color: 0xd23a5a },
        { shape: 'box', size: [16, 200, 14], anchor: 'back', pos: [0, 60, 60], color: 0x2a1f1a },
        { shape: 'box', size: [10, 180, 12], anchor: 'back', pos: [-26, 60, 58], color: 0xe8cfa0 },
        { shape: 'box', size: [10, 180, 12], anchor: 'back', pos: [26, 60, 58], color: 0xe8cfa0 },
        { shape: 'cylinder', size: [30, 34, 90], anchor: 'back', pos: [0, 100, -20], rot: [-0.6, 0, 0], color: 0xa9633a },
        { shape: 'cylinder', size: [26, 30, 80], anchor: 'back', pos: [0, 180, -35], rot: [-1.2, 0, 0], color: 0xe8cfa0 },
        { shape: 'sphere', size: 20, anchor: 'crown', pos: [-10, 40, 0], rot: [0.3, 0, 0.4], color: 0xa9633a },
      ],
      personality: { cadenceMul: 1.6, ampMul: 0.85, bobMul: 1.5, swayMul: 1.2 }, bubbles: ['😜', '🥜', '💥', '🤪'] },

    // Lion cub prince — chibi golden cub, oversized head, small pre-mane tuft.
    { id: 'disney-animals/lion-cub-prince', label: 'Lion Cub (golden, chibi-proportioned)', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.85, bodyLen: 576, bodyW: 210, bodyH: 228, legLen: 0.85, headR: 150, neckLen: 40,
        ears: 'round', tail: 'tuft', tailLen: 0.75, snout: 0.9, coat: 0xd9a24a, belly: 0xf2e2b8,
        earColor: 0xd9a24a, snoutColor: 0xf2e2b8 },
      accessories: [
        { shape: 'sphere', size: 24, anchor: 'qhead', pos: [-16, 70, 0], color: 0x8a4a2a },
        { shape: 'sphere', size: 24, anchor: 'qhead', pos: [16, 70, -6], color: 0x8a4a2a },
        { shape: 'sphere', size: [30, 12, 30], anchor: 'qback', pos: [-40, 60, -30], color: 0xf2e2b8 },
        { shape: 'sphere', size: [30, 12, 30], anchor: 'qback', pos: [40, 55, 10], color: 0xf2e2b8 },
        { shape: 'sphere', size: [30, 12, 30], anchor: 'qback', pos: [-10, 62, 60], color: 0xf2e2b8 },
        { shape: 'sphere', size: 26, anchor: 'qrump', pos: [0, -60, 80], color: 0x5a3020 },
      ],
      personality: { bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.0, ampMul: 1.15 }, bubbles: ['🦁', '👑', '☀️', '😸'] },

    // Flying elephant calf — soft grey, oversized ears bigger than the body, trunk, blue eyes.
    // approx: 'round' ears enum is a placeholder; the huge ear read is carried by qhead accessories.
    { id: 'disney-animals/flying-elephant-calf', label: 'Elephant Calf (oversized ears)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.1, bodyLen: 704, bodyW: 260, bodyH: 288, legLen: 0.9, headR: 320, neckLen: 0,
        ears: 'round', tail: 'tuft', tailLen: 0.55, snout: 0, coat: 0x9ea0a0, belly: 0xb8bab8,
        earColor: 0x9ea0a0, snoutColor: 0x9ea0a0 },
      accessories: [
        { shape: 'sphere', size: [340, 300, 40], anchor: 'qhead', pos: [-260, 20, -20], rot: [0, -0.5, 0.2], color: 0x9ea0a0, sphereArc: [0, 6.283, 0, 1.6] },
        { shape: 'sphere', size: [340, 300, 40], anchor: 'qhead', pos: [260, 20, -20], rot: [0, 0.5, -0.2], color: 0x9ea0a0, sphereArc: [0, 6.283, 0, 1.6] },
        { shape: 'cylinder', size: [40, 34, 120], anchor: 'qhead', pos: [0, -60, 220], rot: [1.2, 0, 0], color: 0x9ea0a0 },
        { shape: 'cylinder', size: [34, 26, 110], anchor: 'qhead', pos: [0, -140, 280], rot: [1.7, 0, 0], color: 0x9ea0a0 },
        { shape: 'cylinder', size: [26, 20, 90], anchor: 'qhead', pos: [0, -180, 330], rot: [2.2, 0, 0], color: 0x9ea0a0 },
        { shape: 'sphere', size: 42, anchor: 'qhead', pos: [-90, 40, 210], color: 0x4a7ab5 },
        { shape: 'sphere', size: 42, anchor: 'qhead', pos: [90, 40, 210], color: 0x4a7ab5 },
      ],
      personality: { bobMul: 1.1, swayMul: 1.2, cadenceMul: 0.75, ampMul: 0.9 }, bubbles: ['🐘', '🎪', '🪶', '💧'] },

    // Spotted fawn — reddish-brown dappled coat, long gangly legs, big dark eyes, flag tail.
    // approx: dapple spots reduced to 8 hand-placed spheres (no scatter-authoring path).
    { id: 'disney-animals/spotted-fawn', label: 'Spotted Fawn (long legs, dappled coat)', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.9, bodyLen: 544, bodyW: 150, bodyH: 216, legLen: 1.3, headR: 110, neckLen: 90,
        ears: 'long', tail: 'up', tailLen: 0.3, snout: 1.0, coat: 0xb5623a, belly: 0xe8d9b5,
        earColor: 0xb5623a, snoutColor: 0x2a1f1a },
      accessories: [
        { shape: 'sphere', size: [16, 6, 16], anchor: 'qback', pos: [-50, 55, -60], color: 0xe8d9b5 },
        { shape: 'sphere', size: [15, 6, 15], anchor: 'qback', pos: [40, 58, -30], color: 0xe8d9b5 },
        { shape: 'sphere', size: [16, 6, 16], anchor: 'qback', pos: [-30, 60, 20], color: 0xe8d9b5 },
        { shape: 'sphere', size: [14, 6, 14], anchor: 'qback', pos: [45, 56, 40], color: 0xe8d9b5 },
        { shape: 'sphere', size: [16, 6, 16], anchor: 'qback', pos: [-55, 52, 70], color: 0xe8d9b5 },
        { shape: 'sphere', size: [14, 6, 14], anchor: 'qback', pos: [10, 60, 0], color: 0xe8d9b5 },
        { shape: 'sphere', size: 24, anchor: 'qhead', pos: [-45, 20, 55], color: 0x1c1410 },
        { shape: 'sphere', size: 24, anchor: 'qhead', pos: [45, 20, 55], color: 0x1c1410 },
      ],
      personality: { bobMul: 0.9, swayMul: 1.5, cadenceMul: 0.9, ampMul: 0.85 }, bubbles: ['🌼', '🦋', '🍃', '💗'] },
  ],
};

export default pack;

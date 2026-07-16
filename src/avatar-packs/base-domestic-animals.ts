// Base ▸ Domestic Animals — builtin base-group pack (dynamic-import only). The
// two legacy quadruped pets keep their EXACT bare ids ('cat' / 'dog').
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'base-domestic-animals', version: 1, label: 'Domestic Animals',
  path: ['Base', 'Domestic Animals'], builtin: true,
  avatars: [
    { id: 'cat', label: '🐱 Cat', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.58, ears: 'pointy', earColor: 0xf2a0b5, snoutColor: 0xd9c3a5, snout: 0.8, tailLen: 1.44 } },
    { id: 'dog', label: '🐶 Dog', rig: 'quadruped', pet: true,
      quadruped: { sk: 1, bodyLen: 640, bodyW: 200, bodyH: 240, ears: 'floppy', earColor: 0x6b4226, snoutColor: 0xd9c3a5, headScale: [1, 0.95, 1.05] } },

    // ── New small pets (Batch C2). Coat = sensor tint (identity survives);
    // secondary features use fixed species accents. All are pet:true.
    // Rabbit — tall upright ears + compact body. approx: single legLen (no
    // asymmetric front/rear leg field, so the raised-rump hop-crouch is stylized).
    { id: 'rabbit', label: '🐰 Rabbit', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.62, bodyLen: 380, bodyW: 160, bodyH: 190, legLen: 0.65, headR: 90, ears: 'long', tail: 'tuft', tailLen: 0.4, snout: 0.7, belly: 0xf5f0e6, earColor: 0xf2b9c4, snoutColor: 0xf2b9c4 },
      accessories: [
        { shape: 'box', size: [12, 16, 8], anchor: 'qhead', pos: [-8, -22, -72], color: 0xffffff }, // buck tooth L
        { shape: 'box', size: [12, 16, 8], anchor: 'qhead', pos: [8, -22, -72], color: 0xffffff }, // buck tooth R
      ],
      personality: { bobMul: 2.0, swayMul: 0.3, cadenceMul: 1.2, ampMul: 1.3 }, bubbles: ['🥕', '🥬', '❤️', '💤'] },

    // Hamster — round ball body, no tail, cheek pouches (the load-bearing trait).
    { id: 'hamster', label: '🐹 Hamster', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.30, bodyLen: 150, bodyW: 110, bodyH: 100, legLen: 0.4, headR: 62, ears: 'round', tail: 'none', snout: 0.5, belly: 0xf3e4c9, earColor: 0xf3e4c9, snoutColor: 0xf3e4c9 },
      accessories: [
        { shape: 'sphere', size: 30, anchor: 'qhead', pos: [-42, -14, -30], color: 'tint' }, // cheek pouch L
        { shape: 'sphere', size: 30, anchor: 'qhead', pos: [42, -14, -30], color: 'tint' }, // cheek pouch R
      ],
      personality: { bobMul: 0.4, swayMul: 0.6, cadenceMul: 2.2, ampMul: 0.5 }, bubbles: ['🌻', '🎡', '🥜', '💤'] },

    // Guinea pig — chunky low oval, no tail, small flat ears, optional rump patch.
    { id: 'guinea_pig', label: '🐹 Guinea pig', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.44, bodyLen: 240, bodyW: 130, bodyH: 110, legLen: 0.45, headR: 72, ears: 'round', tail: 'none', snout: 0.5, belly: 0xf5f0e6, earColor: 0x9c8060, snoutColor: 0x9c8060 },
      accessories: [
        { shape: 'box', size: [120, 20, 90], anchor: 'qback', pos: [0, 6, 60], color: 0xe8dcc0 }, // rump patch (proud)
      ],
      personality: { bobMul: 0.5, swayMul: 0.8, cadenceMul: 1.6, ampMul: 0.6 }, bubbles: ['🥒', '🌾', '🥕', '❗'] },

    // Ferret — very long low tube body + long neck, dark bandit mask, dark tail tip.
    { id: 'ferret', label: '🦦 Ferret', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.55, bodyLen: 420, bodyW: 90, bodyH: 90, legLen: 0.5, headR: 62, neckLen: 80, ears: 'round', tail: 'down', tailLen: 0.9, tailTipColor: 0x3a2a1e, snout: 0.7, belly: 0xf0e6d2, earColor: 0x3a2a1e, snoutColor: 0x3a2a1e },
      accessories: [
        { shape: 'box', size: [95, 26, 60], anchor: 'qhead', pos: [0, 12, -40], color: 0x3a2a1e }, // bandit mask
      ],
      personality: { bobMul: 1.6, swayMul: 1.1, cadenceMul: 1.4, ampMul: 1.2 }, bubbles: ['😴', '🎾', '🧦', '🍗'] },

    // Turtle — domed two-tone shell over a low body, short thick neck, red ear patches.
    { id: 'turtle', label: '🐢 Turtle', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.42, bodyLen: 190, bodyW: 150, bodyH: 70, legLen: 0.35, headR: 80, neckLen: 50, ears: 'none', tail: 'down', tailLen: 0.3, snout: 0.6, belly: 0x8a9c5a, snoutColor: 0x5f7a3d },
      accessories: [
        { shape: 'sphere', size: 150, anchor: 'qback', pos: [0, 30, 0], sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.5], color: 0x4a5c30 }, // shell dome
        { shape: 'cylinder', size: [160, 160, 20], anchor: 'qback', pos: [0, 0, 0], color: 0x8a9c5a }, // shell rim
        { shape: 'sphere', size: 15, anchor: 'qhead', pos: [-34, 12, -20], color: 0xc23b3b }, // red ear patch L
        { shape: 'sphere', size: 15, anchor: 'qhead', pos: [34, 12, -20], color: 0xc23b3b }, // red ear patch R
      ],
      personality: { bobMul: 0.15, swayMul: 0.4, cadenceMul: 0.3, ampMul: 0.35 }, bubbles: ['🥬', '☀️', '💤', '🐢'] },

    // Budgie — biped bird on the humanoid rig (cartoon_duck idiom): stubby wing-arms,
    // wide feet, cone beak. Fixed green plumage (costume-family, not tint). pet:true.
    { id: 'budgie', label: '🦜 Budgie', rig: 'humanoid', pet: true,
      humanoid: { sk: 0.5, headR: 95, limbR: 0.7, skin: 0x6fae3e, body: 0x6fae3e, shoe: 0x8f8f8f, emI: 0.18, armL: 0.45, legL: 0.62, footMul: [1.2, 0.5, 0.9], legColor: 0x8f8f8f, earSkip: true },
      accessories: [
        { shape: 'box', size: [95, 60, 20], anchor: 'face', pos: [0, 22, -4], color: 0xf5e14a }, // yellow face mask
        { shape: 'cone', size: [22, 55], anchor: 'face', pos: [0, -8, -18], rot: [-1.5708, 0, 0], color: 0xc9b89a }, // beak
        { shape: 'sphere', size: 8, anchor: 'face', pos: [-30, 4, -30], color: 0x232323 }, // cheek dot L
        { shape: 'sphere', size: 8, anchor: 'face', pos: [30, 4, -30], color: 0x232323 }, // cheek dot R
        { shape: 'box', size: [60, 90, 16], anchor: 'back', pos: [0, -40, 10], color: 0x3f6fb0 }, // blue tail
      ],
      personality: { bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.3, ampMul: 0.9 }, bubbles: ['🎵', '🪞', '🌾', '💭'] },
  ],
};

export default pack;

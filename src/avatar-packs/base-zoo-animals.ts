// Base ▸ Zoo Animals — builtin base-group pack (dynamic-import only). Batch C2
// roster. Fixed species-accurate coat colors (an iconic zoo animal shouldn't
// recolor to a random sensor tint). Quadrupeds via _buildQuadruped; monkey /
// gorilla / penguin / kangaroo are bipeds on the humanoid rig. All pet:true.
//
// approx notes: the largest animals are visually capped (~1.6× dog scale — a toon
// elephant/hippo reads by silhouette, not true scale; real elephant ≈ 6×, hippo
// ≈ 2.9×). Silhouette carried by bodyLen/legLen/neckLen. Stripe/patch "patterns"
// are a fixed reference layout of a handful of proud boxes (no scatter generator).
// The elephant trunk is a stacked-cylinder approximation (no poseable proboscis
// primitive). No quad `legColor` field — dark legs use `pawColor` (feet only).
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'base-zoo-animals', version: 3, label: 'Zoo Animals',
  path: ['Base', 'Zoo Animals'], builtin: true,
  avatars: [
    // Lion — tawny body, shaggy dark mane ruff (the headline read), dark tail tuft.
    { id: 'lion', label: '🦁 Lion (maned)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.0, bodyLen: 896, bodyW: 260, bodyH: 264, legLen: 0.95, neckLen: 90, headR: 180, ears: 'round', tail: 'down', tailLen: 1.5, tailTipColor: 0x3a2a1c, snout: 1.3, coat: 0xc9963e, belly: 0xe8d9b0, earColor: 0xc9963e, snoutColor: 0x6b4a2e },
      accessories: [
        { shape: 'sphere', size: 100, anchor: 'qhead', pos: [0, 20, 90], color: 0x6b4224 }, // mane back
        { shape: 'sphere', size: 95, anchor: 'qhead', pos: [-110, 0, 30], color: 0x6b4224 }, // mane L
        { shape: 'sphere', size: 95, anchor: 'qhead', pos: [110, 0, 30], color: 0x6b4224 }, // mane R
        { shape: 'sphere', size: 90, anchor: 'qhead', pos: [-70, -60, -10], color: 0x6b4224 }, // mane lower L
        { shape: 'sphere', size: 90, anchor: 'qhead', pos: [70, -60, -10], color: 0x6b4224 }, // mane lower R
        { shape: 'sphere', size: 88, anchor: 'qhead', pos: [0, 90, 40], color: 0x6b4224 }, // mane top
      ],
      personality: { bobMul: 0.8, swayMul: 0.75, cadenceMul: 0.65, ampMul: 1.0 }, bubbles: ['🦁', '☀️', '😴', '👑'] },

    // Tiger — bright orange, black vertical stripes (proud boxes), pale ear spots.
    { id: 'tiger', label: '🐯 Tiger (striped)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.0, bodyLen: 960, bodyW: 240, bodyH: 252, legLen: 0.95, neckLen: 60, headR: 165, ears: 'round', tail: 'down', tailLen: 1.7, snout: 1.25, coat: 0xe8791e, belly: 0xf5efe0, earColor: 0xe8791e, snoutColor: 0xf5efe0 },
      accessories: [
        { shape: 'box', size: [16, 130, 12], anchor: 'qback', pos: [-90, 6, -140], color: 0x151515 }, // stripe
        { shape: 'box', size: [16, 130, 12], anchor: 'qback', pos: [90, 6, -140], color: 0x151515 }, // stripe
        { shape: 'box', size: [16, 140, 12], anchor: 'qback', pos: [-100, 6, 0], color: 0x151515 }, // stripe
        { shape: 'box', size: [16, 140, 12], anchor: 'qback', pos: [100, 6, 0], color: 0x151515 }, // stripe
        { shape: 'box', size: [16, 130, 12], anchor: 'qback', pos: [-90, 6, 150], color: 0x151515 }, // stripe
        { shape: 'box', size: [16, 130, 12], anchor: 'qback', pos: [90, 6, 150], color: 0x151515 }, // stripe
        { shape: 'sphere', size: 22, anchor: 'qhead', pos: [-90, 100, 60], color: 0xf0ede0 }, // ear spot L
        { shape: 'sphere', size: 22, anchor: 'qhead', pos: [90, 100, 60], color: 0xf0ede0 }, // ear spot R
      ],
      personality: { bobMul: 0.85, swayMul: 0.9, cadenceMul: 0.7, ampMul: 1.05 }, bubbles: ['🐯', '🧡', '🎋', '😼'] },

    // Elephant — slate-grey, huge fan ears, stacked-cylinder trunk (approx), ivory tusks.
    { id: 'elephant', label: '🐘 Elephant', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.2, bodyLen: 1088, bodyW: 360, bodyH: 456, legLen: 1.3, neckLen: 0, headR: 220, ears: 'none', tail: 'down', tailLen: 1.0, tailTipColor: 0x3a3a36, snout: 0, coat: 0x8a8a86, belly: 0x8a8a86, snoutColor: 0x8a8a86 },
      accessories: [
        { shape: 'box', size: [220, 260, 20], anchor: 'qhead', pos: [-150, 20, 20], rot: [0, 0.4, 0], color: 0x8a8a86 }, // ear L
        { shape: 'box', size: [220, 260, 20], anchor: 'qhead', pos: [150, 20, 20], rot: [0, -0.4, 0], color: 0x8a8a86 }, // ear R
        { shape: 'cylinder', size: [50, 40, 130], anchor: 'qhead', pos: [0, -70, -160], rot: [1.1, 0, 0], color: 0x8a8a86 }, // trunk seg1
        { shape: 'cylinder', size: [40, 32, 130], anchor: 'qhead', pos: [0, -160, -210], rot: [1.4, 0, 0], color: 0x8a8a86 }, // trunk seg2
        { shape: 'cylinder', size: [30, 22, 110], anchor: 'qhead', pos: [0, -250, -220], rot: [1.7, 0, 0], color: 0x8a8a86 }, // trunk seg3
        { shape: 'cone', size: [22, 150], anchor: 'qhead', pos: [-40, -110, -150], rot: [1.9, 0, 0], color: 0xf2ede0 }, // tusk L
        { shape: 'cone', size: [22, 150], anchor: 'qhead', pos: [40, -110, -150], rot: [1.9, 0, 0], color: 0xf2ede0 }, // tusk R
      ],
      personality: { bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.5, ampMul: 0.65 }, bubbles: ['🐘', '🌿', '💧', '🎪'] },

    // Giraffe — extreme neck + legs, ossicones, reticulated chestnut patches.
    { id: 'giraffe', label: '🦒 Giraffe', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.15, bodyLen: 832, bodyW: 150, bodyH: 276, legLen: 2.6, neckLen: 850, headR: 150, ears: 'round', tail: 'down', tailLen: 1.4, tailTipColor: 0x2b2320, snout: 1.1, coat: 0xe8c9a0, belly: 0xf2e6cf, earColor: 0xe8c9a0, snoutColor: 0x2b2320 },
      accessories: [
        { shape: 'cylinder', size: [16, 16, 110], anchor: 'qhead', pos: [-26, 60, 0], color: 0xc9a878 }, // ossicone L
        { shape: 'sphere', size: 24, anchor: 'qhead', pos: [-26, 120, 0], color: 0xc9a878 }, // ossicone tip L
        { shape: 'cylinder', size: [16, 16, 110], anchor: 'qhead', pos: [26, 60, 0], color: 0xc9a878 }, // ossicone R
        { shape: 'sphere', size: 24, anchor: 'qhead', pos: [26, 120, 0], color: 0xc9a878 }, // ossicone tip R
        { shape: 'box', size: [90, 20, 90], anchor: 'qback', pos: [-60, 8, -100], color: 0x8b4a2b }, // patch
        { shape: 'box', size: [90, 20, 90], anchor: 'qback', pos: [70, 8, 40], color: 0x8b4a2b }, // patch
        { shape: 'box', size: [80, 20, 80], anchor: 'qback', pos: [-50, 8, 140], color: 0x8b4a2b }, // patch
        { shape: 'box', size: [70, 20, 200], anchor: 'qneck', pos: [40, 0, -60], rot: [-0.5, 0, 0], color: 0x8b4a2b }, // neck patch
      ],
      personality: { bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.55, ampMul: 1.4 }, bubbles: ['🦒', '🌳', '🍃', '😊'] },

    // Zebra — cream body, black stripes (proud boxes), upright dark mane.
    { id: 'zebra', label: '🦓 Zebra', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.0, bodyLen: 736, bodyW: 170, bodyH: 240, legLen: 1.25, neckLen: 180, headR: 160, ears: 'pointy', tail: 'down', tailLen: 1.2, tailTipColor: 0x1c1c1c, snout: 1.2, coat: 0xf2eee4, belly: 0xf2eee4, earColor: 0xf2eee4, snoutColor: 0x1c1c1c },
      accessories: [
        { shape: 'box', size: [30, 150, 18], anchor: 'qback', pos: [-85, -100, -110], color: 0x141414 }, // stripe (flank L)
        { shape: 'box', size: [30, 150, 18], anchor: 'qback', pos: [85, -100, -110], color: 0x141414 }, // stripe (flank R)
        { shape: 'box', size: [30, 160, 18], anchor: 'qback', pos: [-88, -100, 20], color: 0x141414 }, // stripe (flank L)
        { shape: 'box', size: [30, 160, 18], anchor: 'qback', pos: [88, -100, 20], color: 0x141414 }, // stripe (flank R)
        { shape: 'box', size: [30, 150, 18], anchor: 'qback', pos: [-85, -100, 150], color: 0x141414 }, // stripe (flank L)
        { shape: 'box', size: [18, 90, 8], anchor: 'qneck', pos: [0, 40, -40], color: 0x141414 }, // mane
        { shape: 'box', size: [18, 90, 8], anchor: 'qneck', pos: [0, 0, -70], color: 0x141414 }, // mane
        { shape: 'box', size: [18, 86, 8], anchor: 'qneck', pos: [0, -40, -100], color: 0x141414 }, // mane
      ],
      personality: { bobMul: 0.85, swayMul: 0.8, cadenceMul: 0.9, ampMul: 1.15 }, bubbles: ['🦓', '🌾', '👀', '💨'] },

    // Bear — grizzled brown, bulky low body, small round ears, shoulder hump.
    { id: 'bear', label: '🐻 Bear (grizzly)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.0, bodyLen: 768, bodyW: 270, bodyH: 300, legLen: 0.85, neckLen: 50, headR: 175, ears: 'round', tail: 'down', tailLen: 0.3, snout: 1.15, coat: 0x7a5a3c, belly: 0x7a5a3c, earColor: 0x7a5a3c, snoutColor: 0x3a2c1e },
      accessories: [
        { shape: 'sphere', size: [200, 120, 200], anchor: 'qback', pos: [0, 60, -150], color: 0x7a5a3c }, // shoulder hump
      ],
      personality: { bobMul: 0.7, swayMul: 0.85, cadenceMul: 0.6, ampMul: 0.9 }, bubbles: ['🐻', '🐟', '🍯', '😴'] },

    // Panda — white body, black ears/eye-goggles/muzzle/vest patches.
    { id: 'panda', label: '🐼 Panda', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.0, bodyLen: 640, bodyW: 260, bodyH: 288, legLen: 0.7, neckLen: 50, headR: 175, ears: 'round', tail: 'down', tailLen: 0.3, snout: 1.0, coat: 0xf5f3ec, belly: 0xf5f3ec, earColor: 0x161616, snoutColor: 0xf5f3ec },
      accessories: [
        { shape: 'sphere', size: [45, 55, 20], anchor: 'qhead', pos: [-60, 25, -150], color: 0x161616 }, // eye patch L
        { shape: 'sphere', size: [45, 55, 20], anchor: 'qhead', pos: [60, 25, -150], color: 0x161616 }, // eye patch R
        { shape: 'box', size: [90, 60, 40], anchor: 'qhead', pos: [0, -30, -160], color: 0x161616 }, // muzzle band
        { shape: 'box', size: [90, 20, 200], anchor: 'qback', pos: [-90, 8, -100], color: 0x161616 }, // vest L
        { shape: 'box', size: [90, 20, 200], anchor: 'qback', pos: [90, 8, -100], color: 0x161616 }, // vest R
      ],
      personality: { bobMul: 0.9, swayMul: 1.0, cadenceMul: 0.75, ampMul: 0.7 }, bubbles: ['🐼', '🎋', '😴', '🖤'] },

    // Hippo — huge low barrel on stumpy legs, broad muzzle (snout + wide headScale + box).
    { id: 'hippo', label: '🦛 Hippo', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.2, bodyLen: 1152, bodyW: 400, bodyH: 360, legLen: 0.55, neckLen: 0, headR: 220, headScale: [1.3, 0.9, 1.0], ears: 'round', tail: 'down', tailLen: 0.3, snout: 1.6, coat: 0x6e6a6a, belly: 0x8a7070, earColor: 0x6e6a6a, snoutColor: 0x6e6a6a },
      accessories: [
        { shape: 'box', size: [200, 90, 120], anchor: 'qhead', pos: [0, -30, -110], color: 0x6e6a6a }, // broad muzzle
        { shape: 'sphere', size: 20, anchor: 'qhead', pos: [-55, 30, -60], color: 0x9a6a6a }, // pink accent L
        { shape: 'sphere', size: 20, anchor: 'qhead', pos: [55, 30, -60], color: 0x9a6a6a }, // pink accent R
      ],
      personality: { bobMul: 0.65, swayMul: 0.6, cadenceMul: 0.55, ampMul: 0.75 }, bubbles: ['🦛', '💧', '🌿', '😮'] },

    // Monkey — biped capuchin, long arms, cream cap + pale face, tailbone tail.
    { id: 'monkey', label: '🐒 Monkey', rig: 'humanoid', pet: true,
      humanoid: { sk: 0.55, headR: 100, limbR: 0.85, skin: 0x2e2118, body: 0x2e2118, shoe: 0x1c1512, emI: 0.15, armL: 1.2, legL: 0.85, earSkip: true },
      accessories: [
        { shape: 'sphere', size: 110, anchor: 'head', pos: [0, 26, 24], rot: [-0.45, 0, 0], sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.5], color: 0xdccdaa }, // fur cap
        { shape: 'sphere', size: [70, 80, 16], anchor: 'face', pos: [0, -10, -6], color: 0xe8dcc0 }, // pale face
        { shape: 'cylinder', size: [16, 14, 150], anchor: 'tailbone', pos: [0, -20, 20], rot: [-0.6, 0, 0], color: 0x2e2118 }, // tail seg1
        { shape: 'cylinder', size: [14, 10, 130], anchor: 'tailbone', pos: [0, -120, 90], rot: [-1.6, 0, 0], color: 0x2e2118 }, // tail seg2 (curl)
      ],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.4, ampMul: 0.85 }, bubbles: ['🐒', '🍌', '❓', '😄'] },

    // Gorilla — biped silverback, extreme limb bulk + arm reach, silver saddle, crest.
    { id: 'gorilla', label: '🦍 Gorilla (silverback)', rig: 'humanoid', pet: true,
      humanoid: { sk: 1.15, headR: 150, limbR: 1.6, skin: 0x141210, body: 0x141210, shoe: 0x0a0a0a, emI: 0.10, hands: 'box', armL: 1.5, legL: 0.85, earSkip: true },
      accessories: [
        { shape: 'box', size: [220, 300, 16], anchor: 'back', pos: [0, 0, 8], color: 0xb9b9bd }, // silver saddle
        { shape: 'box', size: [16, 40, 120], anchor: 'crown', pos: [0, 10, 0], color: 0x141210 }, // sagittal crest
      ],
      personality: { bobMul: 0.75, swayMul: 0.9, cadenceMul: 0.65, ampMul: 1.1 }, bubbles: ['🦍', '🌿', '💪', '🥁'] },

    // Penguin — biped tuxedo, white belly panel, yellow patches, coral bill.
    { id: 'penguin', label: '🐧 Penguin', rig: 'humanoid', pet: true,
      humanoid: { sk: 0.9, headR: 118, limbR: 0.85, skin: 0x15161a, body: 0x15161a, shoe: 0xe2841c, emI: 0.18, hands: 'box', armL: 0.5, legL: 0.7, footMul: [1.3, 0.6, 1.1], legColor: 0xe2841c, earSkip: true },
      accessories: [
        { shape: 'box', size: [200, 360, 20], anchor: 'chest', pos: [0, -40, -6], color: 0xf5f3ea }, // white belly
        { shape: 'sphere', size: [40, 50, 16], anchor: 'head', pos: [-70, 20, -30], color: 0xe8d24a }, // ear patch L
        { shape: 'sphere', size: [40, 50, 16], anchor: 'head', pos: [70, 20, -30], color: 0xe8d24a }, // ear patch R
        { shape: 'cone', size: [26, 50], anchor: 'face', pos: [0, -4, -14], rot: [-1.5708, 0, 0], color: 0xc97a54 }, // bill
      ],
      personality: { bobMul: 1.3, swayMul: 1.6, cadenceMul: 0.75, ampMul: 0.9 }, bubbles: ['🐧', '❄️', '🐟', '😆'] },

    // Kangaroo — biped, powerful hind legs + long feet, thick tailbone tripod tail, tall ears.
    { id: 'kangaroo', label: '🦘 Kangaroo (red)', rig: 'humanoid', pet: true,
      humanoid: { sk: 1.0, headR: 108, limbR: 0.9, skin: 0xb5652e, body: 0xb5652e, shoe: 0x3a2a1c, emI: 0.20, armL: 0.55, legL: 1.6, footMul: [1.2, 0.65, 2.1], earSkip: true },
      accessories: [
        { shape: 'cylinder', size: [50, 36, 400], anchor: 'tailbone', pos: [0, -40, 30], rot: [-0.8, 0, 0], color: 0xb5652e }, // tail seg1
        { shape: 'cylinder', size: [36, 22, 360], anchor: 'tailbone', pos: [0, -300, 260], rot: [-1.4, 0, 0], color: 0xb5652e }, // tail seg2 (planted)
        { shape: 'cone', size: [24, 140], anchor: 'head', pos: [-50, 40, 0], rot: [0, 0, 0.15], color: 0xb5652e }, // ear L
        { shape: 'cone', size: [24, 140], anchor: 'head', pos: [50, 40, 0], rot: [0, 0, -0.15], color: 0xb5652e }, // ear R
      ],
      personality: { bobMul: 1.6, swayMul: 0.6, cadenceMul: 0.9, ampMul: 1.1 }, bubbles: ['🦘', '🥊', '🌏', '😤'] },
  ],
};

export default pack;

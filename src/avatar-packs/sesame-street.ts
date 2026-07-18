// Cartoons ▸ Sesame Street — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric homage: silhouette + color only, no
// likeness/logos/felt texture. Heterogeneous "street" of Muppets — no shared
// base. 10 humanoid (one sessile) + 1 quadruped. Fixed non-tint body colors
// (each member's color IS their identity). Source: docs/avatars/cartoons/sesame-street.md.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'sesame-street', version: 2, label: 'Sesame Street',
  path: ['Cartoons', 'Sesame Street'], builtin: true, franchise: true,
  avatars: [
    // Big Bird — tall golden-yellow bird, long orange stilt legs, cone beak.
    { id: 'sesame-street/big-bird', label: 'Tall Yellow Bird (long orange legs)', rig: 'humanoid',
      humanoid: { sk: 1.35, headR: 110, headShape: 'sphere', limbR: 0.85, skin: 0xf5d020, body: 0xf5d020,
        legColor: 0xe8720a, shoe: 0xe8720a, eyes: 'dots', emI: 0.05, hands: 'sphere',
        armL: 0.75, legL: 1.35, footMul: [1.5, 0.7, 1.6],
        pattern: { kind: 'dapples', color: 0xd9b81a, count: 10 } }, // darker-yellow feather texture
      accessories: [
        { shape: 'cone', size: [36, 70], anchor: 'face', pos: [0, -6, -20], rot: [-1.57, 0, 0], color: 0xe8720a }, // orange cone beak
        { shape: 'cone', size: [14, 60], anchor: 'crown', pos: [0, 20, 10], rot: [0.2, 0, 0], color: 0xf5d020 }, // feather crest center
        { shape: 'cone', size: [12, 50], anchor: 'crown', pos: [-34, 10, 14], rot: [0.2, 0, -0.3], color: 0xe8720a }, // feather crest L
        { shape: 'cone', size: [12, 50], anchor: 'crown', pos: [34, 10, 14], rot: [0.2, 0, 0.3], color: 0xe8720a }, // feather crest R
        { shape: 'sphere', size: [40, 50, 30], anchor: 'head', pos: [-96, -30, 10], color: 0xf5d020 }, // cheek-feather tuft L
        { shape: 'sphere', size: [40, 50, 30], anchor: 'head', pos: [96, -30, 10], color: 0xf5d020 }, // cheek-feather tuft R
      ],
      personality: { bobMul: 1.1, swayMul: 0.9, cadenceMul: 0.85, ampMul: 1.1 },
      bubbles: ['🐦', '🎨', '😊', '🖍️'] },

    // Elmo — small giggly red monster, round orange ball nose, bald.
    { id: 'sesame-street/elmo', label: 'Small Red Monster (giggly, big nose)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 130, headShape: 'sphere', limbR: 0.75, skin: 0xd41f1f, body: 0xd41f1f,
        legColor: 0xd41f1f, shoe: 0xd41f1f, eyes: 'dots', emI: 0.02, hands: 'sphere', armL: 0.7, legL: 0.65 },
      accessories: [
        { shape: 'sphere', size: 40, anchor: 'face', pos: [0, -8, -18], color: 0xf07d1a }, // big orange ball nose
      ],
      personality: { bobMul: 1.5, swayMul: 1.3, cadenceMul: 1.4, ampMul: 0.5 },
      bubbles: ['😂', '❤️', '🎈', '🤗'] },

    // Cookie Monster — big shaggy blue monster, huge googly eyes, big dark mouth.
    { id: 'sesame-street/cookie-monster', label: 'Shaggy Blue Monster (huge eyes, big mouth)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 150, headShape: 'sphere', limbR: 1.15, skin: 0x2f6fd1, body: 0x2f6fd1,
        legColor: 0x2f6fd1, shoe: 0x2f6fd1, eyes: 'dots', emI: 0.02, hands: 'sphere', noFace: true }, // giant mouth is a bespoke face accessory
      accessories: [
        { shape: 'box', size: [130, 80, 30], anchor: 'face', pos: [0, -40, -6], color: 0x1a1a1a }, // signature big dark mouth
        { shape: 'cone', size: [26, 60], anchor: 'head', pos: [-70, 60, 20], rot: [0, 0, -0.5], color: 0x2f6fd1 }, // shaggy fur tuft
        { shape: 'cone', size: [26, 60], anchor: 'head', pos: [70, 55, 10], rot: [0, 0, 0.6], color: 0x4a86e0 }, // shaggy fur tuft
        { shape: 'cone', size: [24, 55], anchor: 'head', pos: [0, 90, 30], rot: [-0.3, 0, 0], color: 0x2f6fd1 }, // shaggy fur tuft
        { shape: 'cone', size: [22, 50], anchor: 'head', pos: [-30, 80, -30], rot: [0.3, 0, -0.2], color: 0x4a86e0 }, // shaggy fur tuft
        { shape: 'cylinder', size: [46, 46, 16], anchor: 'handR', pos: [0, -30, -10], color: 0x8a5a2e }, // cookie body
        { shape: 'sphere', size: 7, anchor: 'handR', pos: [-14, -22, -20], color: 0x2a1810 }, // choc chip
        { shape: 'sphere', size: 7, anchor: 'handR', pos: [10, -34, -14], color: 0x2a1810 }, // choc chip
        { shape: 'sphere', size: 6, anchor: 'handR', pos: [2, -20, -4], color: 0x2a1810 }, // choc chip
      ],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.2 },
      bubbles: ['🍪', '😋', '🤪', '🎉'] },

    // Bert — tall oval head, unibrow, black hair wave, striped shirt, green pants.
    { id: 'sesame-street/bert', label: 'Tall Oval-Head Roommate (unibrow, striped shirt)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 120, headShape: 'oval', limbR: 0.8, skin: 0xe8c840, body: 0xd8821a,
        legColor: 0x3f8a3f, shoe: 0x3a3a3a, eyes: 'dots', emI: 0.02, hands: 'sphere', armL: 0.85,
        pattern: { kind: 'stripes', color: 0x2f5fae, count: 6 } }, // blue stripes over the orange shirt
      accessories: [
        { shape: 'box', size: [120, 18, 12], anchor: 'face', pos: [0, 34, -12], color: 0x1a1a1a }, // thick single unibrow
        { shape: 'cone', size: [50, 130], anchor: 'crown', pos: [0, -6, 30], rot: [-0.35, 0, 0], color: 0x1a1a1a }, // swept-up black hair wave
        { shape: 'cone', size: [22, 40], anchor: 'face', pos: [0, -8, -14], rot: [-1.57, 0, 0], color: 0xd8821a }, // orange nose bump
      ],
      personality: { bobMul: 0.7, swayMul: 0.4, cadenceMul: 0.85, ampMul: 0.6 },
      bubbles: ['🕊️', '📎', '😤', '📋'] },

    // Ernie — wide round orange head, no brows, red/white shirt, rubber duck.
    { id: 'sesame-street/ernie', label: 'Round-Head Roommate (rubber duck)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 132, headShape: 'sphere', limbR: 0.95, skin: 0xe8821a, body: 0xd21f1a,
        legColor: 0x3a5aa8, shoe: 0x3a3a3a, eyes: 'dots', emI: 0.02, hands: 'sphere',
        pattern: { kind: 'stripes', color: 0xf0ece0, count: 6 } }, // approx: generator runs VERTICAL bands; Ernie's canon stripes are horizontal (no orientation param)
      accessories: [
        { shape: 'box', size: [110, 55, 130], anchor: 'crown', pos: [0, -4, 0], color: 0x241d16 }, // short tufted dark hair (no brow accessory — bare-brow read)
        { shape: 'sphere', size: 40, anchor: 'handR', pos: [0, -70, 0], color: 0xf5d020 }, // rubber duckie body
        { shape: 'cone', size: [14, 26], anchor: 'handR', pos: [0, -70, -34], rot: [-1.57, 0, 0], color: 0xe8720a }, // duck beak
      ],
      personality: { bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.0 },
      bubbles: ['🛁', '🦆', '😄', '🎶'] },

    // Oscar the Grouch — green monster rooted in a battered trash can, no legs.
    { id: 'sesame-street/oscar-grouch', label: 'Grouch in a Trash Can (green, rooted)', rig: 'humanoid',
      sessile: true, // rooted in the can — legless, no gait, idle sway only (first shipped sessile use)
      humanoid: { sk: 1.0, headR: 130, headShape: 'sphere', limbR: 0.95, armL: 0.9, skin: 0x4a8a3f, body: 0x4a8a3f,
        eyes: 'dots', emI: 0.0, hands: 'sphere',
        // Shaggy-fur dapples — also lifts the legless rig above the harness's LEGGED
        // mesh floor (avatar-content-test has no dedicated sessile floor).
        pattern: { kind: 'dapples', color: 0x2f5a28, count: 8 } },
      accessories: [
        { shape: 'cylinder', size: [230, 230, 900], anchor: 'root', pos: [0, 450, 0], color: 0x8a8a86 }, // dented trash-can body
        { shape: 'cylinder', size: [240, 240, 60], anchor: 'root', pos: [0, 880, 0], color: 0x5a5a5a }, // darker rim band
        { shape: 'box', size: [60, 80, 20], anchor: 'root', pos: [180, 500, 120], rot: [0, 0.4, 0], color: 0x707070 }, // dent/scuff
        { shape: 'box', size: [50, 70, 20], anchor: 'root', pos: [-170, 640, 130], rot: [0, -0.3, 0], color: 0x707070 }, // dent/scuff
        { shape: 'cylinder', size: [250, 250, 24], anchor: 'root', pos: [-120, 1000, 240], rot: [0.5, 0, 0.4], color: 0x707070 }, // lid propped open behind
        { shape: 'box', size: [140, 26, 20], anchor: 'head', pos: [0, 44, -14], color: 0x2f5a28 }, // bushy unkempt eyebrow tufts (carry the crankiness)
      ],
      personality: { bobMul: 0.3, swayMul: 0.5, cadenceMul: 0, ampMul: 0 },
      bubbles: ['😠', '🗑️', '👎', '😤'] },

    // Grover — lighter blue furry monster, round nose, small red super-cape.
    { id: 'sesame-street/grover', label: 'Furry Blue Monster (round nose, cape flash)', rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 126, headShape: 'sphere', limbR: 0.85, skin: 0x3f9ad1, body: 0x3f9ad1,
        legColor: 0x3f9ad1, shoe: 0x3f9ad1, eyes: 'dots', emI: 0.02, hands: 'sphere', armL: 1.05 },
      accessories: [
        { shape: 'sphere', size: 34, anchor: 'face', pos: [0, -8, -18], color: 0x6ab8e0 }, // soft round nose
        { shape: 'cone', size: [140, 220], anchor: 'back', pos: [0, -40, 14], rot: [0.15, 0, 0], color: 0xc0392b, animate: { kind: 'flap', speed: 1.2, amp: 0.3 } }, // small red Super-Grover cape (flattened cone) — heroic flutter
      ],
      personality: { bobMul: 1.2, swayMul: 1.3, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🦸', '😅', '🐾', '💙'] },

    // Count von Count — purple vampire, tuxedo, cape, widow's-peak, monocle.
    { id: 'sesame-street/count-von-count', label: 'Vampire Count (purple, cape, monocle)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, headShape: 'sphere', limbR: 0.95, skin: 0x8a4fae, body: 0x141416,
        legColor: 0x141416, shoe: 0x0a0a0c, eyes: 'dots', emI: 0.05, hands: 'sphere' },
      accessories: [
        { shape: 'cone', size: [60, 70], anchor: 'crown', pos: [0, -30, -20], color: 0x0a0a0c }, // widow's-peak hair
        { shape: 'cone', size: [22, 50], anchor: 'face', pos: [0, -46, -10], rot: [3.1416, 0, 0], color: 0x0a0a0c }, // pointed goatee
        { shape: 'cylinder', size: [26, 26, 6], anchor: 'face', pos: [30, 6, -14], rot: [1.57, 0, 0], color: 0xc7ccd1 }, // monocle
        { shape: 'box', size: [70, 150, 12], anchor: 'chest', pos: [0, 0, -12], color: 0xf0ece0 }, // white dress-shirt front
        { shape: 'box', size: [40, 24, 10], anchor: 'chest', pos: [0, 70, -16], color: 0x0a0a0c }, // black bow tie
        { shape: 'cape', size: [340, 560, 460], anchor: 'back', pos: [0, -110, 12], rot: [0.12, 0, 0], color: 0x4a1e6b, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // flowing purple cape (cape technique)
        { shape: 'cone', size: [16, 40], anchor: 'head', pos: [-116, 30, 0], rot: [0, 0, 0.5], color: 0x8a4fae }, // pointed ear tip L
        { shape: 'cone', size: [16, 40], anchor: 'head', pos: [116, 30, 0], rot: [0, 0, -0.5], color: 0x8a4fae }, // pointed ear tip R
      ],
      personality: { bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.8, ampMul: 0.8 },
      bubbles: ['🔢', '⚡', '🦇', '1️⃣'] },

    // Rosita — turquoise monster, pom-pom antennae, slung guitar.
    { id: 'sesame-street/rosita', label: 'Turquoise Monster (guitar, antennae)', rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 120, headShape: 'sphere', limbR: 0.85, skin: 0x2fb0a8, body: 0x2fb0a8,
        legColor: 0x2fb0a8, shoe: 0x2fb0a8, eyes: 'dots', emI: 0.02, hands: 'sphere' },
      accessories: [
        { shape: 'cylinder', size: [8, 8, 70], anchor: 'head', pos: [-40, 40, 0], rot: [0, 0, 0.2], color: 0x2fb0a8 }, // antenna stalk L
        { shape: 'sphere', size: 22, anchor: 'head', pos: [-52, 110, 0], color: 0xf0c020 }, // pom-pom L
        { shape: 'cylinder', size: [8, 8, 70], anchor: 'head', pos: [40, 40, 0], rot: [0, 0, -0.2], color: 0x2fb0a8 }, // antenna stalk R
        { shape: 'sphere', size: 22, anchor: 'head', pos: [52, 110, 0], color: 0xf0c020 }, // pom-pom R
        { shape: 'box', size: [120, 150, 40], anchor: 'chest', pos: [-30, -10, -14], rot: [0, 0, -0.4], color: 0x8a5a34 }, // slung guitar body
        { shape: 'cylinder', size: [26, 26, 6], anchor: 'chest', pos: [-30, -10, -34], rot: [1.57, 0, -0.4], color: 0x5a3c22 }, // sound-hole disc
        { shape: 'cylinder', size: [12, 12, 220], anchor: 'handR', pos: [0, -110, 0], color: 0x5a3c22 }, // guitar neck
      ],
      personality: { bobMul: 1.1, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.05 },
      bubbles: ['🎸', '🎶', '😄', '🌟'] },

    // Mr. Snuffleupagus — huge shaggy brown mammoth-like creature, trunk, flap ears.
    { id: 'sesame-street/snuffleupagus', label: 'Woolly Giant (trunk, floppy ears)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.5, bodyLen: 1400, bodyW: 500, bodyH: 550, legLen: 1.3, headR: 200,
        headScale: [1.0, 1.05, 1.15], neckLen: 150, ears: 'flap', tail: 'down', tailLen: 0.6,
        snout: 1.6, snoutShape: 'cone', coat: 0x8a5a34, belly: 0xb08a5c,
        earColor: 0x6b4423, snoutColor: 0x8a5a34, pawColor: 0x8a5a34, eyes: 'dot',
        pattern: { kind: 'dapples', color: 0x6b4423, count: 10 } }, // shaggy fur texture
      accessories: [
        { shape: 'cylinder', size: [30, 55, 350], anchor: 'qhead', pos: [0, -60, -120], rot: [0.5, 0, 0], color: 0x8a5a34, animate: { kind: 'sway', speed: 0.8, amp: 0.2 } }, // long trunk with gentle idle swing
        { shape: 'cone', size: [10, 90], anchor: 'qhead', pos: [-60, 60, -60], rot: [-0.4, 0, -0.2], color: 0x2a2018 }, // long eyelash tuft L
        { shape: 'cone', size: [10, 90], anchor: 'qhead', pos: [60, 60, -60], rot: [-0.4, 0, 0.2], color: 0x2a2018 }, // long eyelash tuft R
        { shape: 'cone', size: [26, 90], anchor: 'qback', pos: [0, 60, 40], color: 0x6b4423 }, // hump/mane ridge tuft
        { shape: 'cone', size: [24, 80], anchor: 'qback', pos: [0, 60, -20], color: 0x6b4423 }, // hump/mane ridge tuft
        { shape: 'cone', size: [22, 70], anchor: 'qback', pos: [0, 60, -90], color: 0x6b4423 }, // hump/mane ridge tuft
      ],
      personality: { bobMul: 0.5, swayMul: 0.6, cadenceMul: 0.55, ampMul: 0.9 },
      bubbles: ['🐘', '🍝', '😊', '🤫'] },

    // Zoe — small orange monster, pink tutu, pet rock, pigtail puffs.
    { id: 'sesame-street/zoe', label: 'Small Orange Monster (tutu, pet rock)', rig: 'humanoid',
      humanoid: { sk: 0.7, headR: 118, headShape: 'sphere', limbR: 0.75, skin: 0xe8721a, body: 0xe8721a,
        legColor: 0xe8721a, shoe: 0xe8721a, eyes: 'dots', emI: 0.02, hands: 'sphere', armL: 0.8, legL: 0.85 },
      accessories: [
        { shape: 'sphere', size: 34, anchor: 'crown', pos: [-60, 10, 0], color: 0xe8721a }, // pigtail puff L
        { shape: 'sphere', size: 34, anchor: 'crown', pos: [60, 10, 0], color: 0xf29a4a }, // pigtail puff R
        { shape: 'cone', size: [150, 130], anchor: 'hip', pos: [0, -30, 0], color: 0xf199c4 }, // pink ballet tutu
        { shape: 'sphere', size: [40, 34, 40], anchor: 'handR', pos: [0, -60, 0], color: 0x8a8a86 }, // Rocco the pet rock
      ],
      personality: { bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.3, ampMul: 1.1 },
      bubbles: ['💃', '🎵', '🪨', '😆'] },
  ],
};

export default pack;

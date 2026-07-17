// Video Games ▸ Mario — franchise pack (dynamic-import only, default
// loaded:false). Core Mushroom Kingdom cast, all on the humanoid rig. Colour +
// silhouette only, no likenesses/letters. Source: docs/avatars/video-games/mario.md.
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

const OVERALL = 0x1c3d9e, GOLD = 0xd9b34a;

// Plumber overalls bib + shoulder straps + two buttons — shared three-part
// "dungarees" convention (recoloured per member).
const bib = (col: number): AvatarPrimitive[] => [
  { shape: 'box', size: [180, 160, 10], anchor: 'chest', pos: [0, -20, 0], color: col },
  { shape: 'sphere', size: 7, anchor: 'chest', pos: [-55, 40, -6], color: GOLD },
  { shape: 'sphere', size: 7, anchor: 'chest', pos: [55, 40, -6], color: GOLD },
];

const pack: AvatarPackDef = {
  id: 'mario', version: 3, label: 'Mario',
  path: ['Video Games', 'Mario'], builtin: true, franchise: true,
  avatars: [
    // Mario
    { id: 'mario/plumber-red', label: 'Plumber (red cap, blue overalls)', rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 130, limbR: 1.1, skin: 0xf2b28c, body: 0xd21f1a, legColor: OVERALL, shoe: 0x5a3620, eyes: 'dots', armL: 0.95, legL: 0.85, footMul: [1.1, 1.0, 1.05] }, // approx: white gloves not representable (no hand-colour field)
      accessories: [
        { shape: 'sphere', size: [70, 45, 70], anchor: 'crown', pos: [0, -10, -10], rot: [0.3, 0, 0], color: 0xd21f1a },
        { shape: 'sphere', size: [20, 20, 6], anchor: 'crown', pos: [0, -20, -70], color: 0xffffff },
        { shape: 'box', size: [40, 20, 20], anchor: 'head', pos: [0, -20, 55], color: 0x5a3620 },
        { shape: 'box', size: [90, 30, 20], anchor: 'face', pos: [0, -25, -12], color: 0x5a3620 },
        ...bib(OVERALL),
      ],
      personality: { bobMul: 1.1, cadenceMul: 1.05 }, bubbles: ['🍄', '⭐', '🪙', '😲'] },
    // Luigi — taller, thinner
    { id: 'mario/plumber-green', label: 'Tall Brother (green cap, blue overalls)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 124, limbR: 0.85, skin: 0xf2b28c, body: 0x1f9e2c, legColor: OVERALL, shoe: 0x3a2a1a, eyes: 'dots', armL: 1.05, legL: 1.05 },
      accessories: [
        { shape: 'sphere', size: [70, 45, 70], anchor: 'crown', pos: [0, -10, -10], rot: [0.3, 0, 0], color: 0x1f9e2c },
        { shape: 'sphere', size: [20, 20, 6], anchor: 'crown', pos: [0, -20, -70], color: 0xffffff },
        { shape: 'box', size: [40, 20, 20], anchor: 'head', pos: [0, -20, 55], color: 0x3a2418 },
        { shape: 'box', size: [70, 24, 18], anchor: 'face', pos: [0, -25, -12], color: 0x3a2418 },
        ...bib(OVERALL),
      ],
      personality: { bobMul: 0.95, swayMul: 1.1, cadenceMul: 1.1, ampMul: 0.9 }, bubbles: ['👻', '😱', '🍄', '⭐'] },
    // Peach
    { id: 'mario/mushroom-princess', label: 'Princess (pink gown, blonde, crown)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, limbR: 0.85, skin: 0xf6cba8, body: 0xf199c4, legColor: 0xf199c4, shoe: GOLD, eyes: 'almond', armL: 0.95 },
      accessories: [
        { shape: 'box', size: [50, 220, 40], anchor: 'head', pos: [-90, -70, 20], color: 0xf5d060 },
        { shape: 'box', size: [50, 220, 40], anchor: 'head', pos: [90, -70, 20], color: 0xf5d060 },
        { shape: 'box', size: [140, 260, 30], anchor: 'back', pos: [0, -40, 15], color: 0xf5d060 },
        { shape: 'box', size: [120, 24, 110], anchor: 'crown', pos: [0, -30, 0], color: GOLD },
        { shape: 'sphere', size: 10, anchor: 'crown', pos: [0, -30, -55], color: 'accent' },
        { shape: 'sphere', size: 9, anchor: 'chest', pos: [0, 50, -6], color: 0x3a6fd1 },
      ],
      personality: { bobMul: 0.55, swayMul: 0.45, cadenceMul: 0.85, ampMul: 0.7 }, bubbles: ['👑', '💖', '🍰', '🎀'] },
    // Toad — oversized mushroom cap
    { id: 'mario/mushroom-toad', label: 'Mushroom Retainer (red-spotted cap)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 130, limbR: 0.9, skin: 0xf0c9a0, body: 0x2255c9, legColor: 0xf5f2ea, shoe: 0x5a3d20, eyes: 'dots', armL: 0.8, legL: 0.7, footMul: [1.15, 0.9, 1.1] },
      accessories: [
        { shape: 'sphere', size: [100, 60, 100], anchor: 'crown', pos: [0, 0, 0], color: 0xf5f2ea }, // approx: oversized "fused" cap
        { shape: 'sphere', size: [20, 20, 10], anchor: 'crown', pos: [0, 40, -60], color: 0xd9241f },
        { shape: 'sphere', size: [20, 20, 10], anchor: 'crown', pos: [-70, 30, 20], color: 0xd9241f },
        { shape: 'sphere', size: [20, 20, 10], anchor: 'crown', pos: [70, 30, 20], color: 0xd9241f },
        { shape: 'sphere', size: [20, 20, 10], anchor: 'crown', pos: [0, 25, 70], color: 0xd9241f },
        { shape: 'box', size: [180, 20, 8], anchor: 'chest', pos: [0, 50, 0], color: 0xf0c020 },
      ],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.3, ampMul: 0.65 }, bubbles: ['🍄', '🎉', '😊', '✨'] },
    // Yoshi — biped dino
    { id: 'mario/dino-companion', label: 'Dinosaur Companion (green, saddle, big nose)', rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 110, limbR: 1.0, skin: 0x3fae3f, body: 0x3fae3f, legColor: 0x3fae3f, shoe: 0xe8720a, eyes: 'almond', armL: 0.7, legL: 1.1, footMul: [1.3, 0.9, 1.4] },
      accessories: [
        { shape: 'sphere', size: 35, anchor: 'face', pos: [0, -10, -20], color: 0xe8722a }, // approx: oversized nose via face sphere
        { shape: 'sphere', size: [90, 110, 10], anchor: 'chest', pos: [0, -30, -4], color: 0xf5f2ea },
        { shape: 'cone', size: [12, 30, 12], anchor: 'head', pos: [0, 20, 40], rot: [0.6, 0, 0], color: 0xd9481f },
        { shape: 'cone', size: [12, 30, 12], anchor: 'head', pos: [0, 0, 60], rot: [0.9, 0, 0], color: 0xd9481f },
        { shape: 'cone', size: [12, 30, 12], anchor: 'head', pos: [0, -20, 70], rot: [1.1, 0, 0], color: 0xd9481f },
        { shape: 'box', size: [130, 40, 120], anchor: 'back', pos: [0, 20, 10], color: 0xd9241f },
      ],
      personality: { bobMul: 1.2, cadenceMul: 1.15, ampMul: 1.05 }, bubbles: ['🥚', '🍎', '👅', '😋'] },
    // Bowser — spiked shell
    { id: 'mario/koopa-king', label: 'Koopa King (spiked shell, horns)', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 150, limbR: 1.3, skin: 0xc7b02e, body: 0xf0e2b0, legColor: 0xc7b02e, shoe: 0x3a2e1c, eyes: 'halfred', emI: 0.1, hands: 'box', armL: 1.2, legL: 0.95, footMul: [1.3, 1.0, 1.3] }, // approx: tail omitted, spikes/wristbands reduced
      accessories: [
        { shape: 'sphere', size: [140, 120, 140], anchor: 'back', pos: [0, 10, 20], color: 0x2f7a2e },
        { shape: 'cone', size: [30, 60, 30], anchor: 'back', pos: [0, 120, 30], color: 0xf5f2ea },
        { shape: 'cone', size: [30, 60, 30], anchor: 'back', pos: [-110, 40, 40], rot: [0, 0, -0.6], color: 0xf5f2ea },
        { shape: 'cone', size: [30, 60, 30], anchor: 'back', pos: [110, 40, 40], rot: [0, 0, 0.6], color: 0xf5f2ea },
        { shape: 'cone', size: [30, 60, 30], anchor: 'back', pos: [0, -70, 40], color: 0xf5f2ea },
        { shape: 'cone', size: [30, 120, 30], anchor: 'crown', pos: [-30, 10, 30], rot: [0.4, 0, -0.3], color: 0xd9481f },
        { shape: 'cone', size: [30, 120, 30], anchor: 'crown', pos: [30, 10, 30], rot: [0.4, 0, 0.3], color: 0xd9481f },
        { shape: 'cone', size: [12, 50, 12], anchor: 'head', pos: [-55, 40, -20], rot: [-0.4, 0, -0.4], color: 0xf0ece0 },
        { shape: 'cone', size: [12, 50, 12], anchor: 'head', pos: [55, 40, -20], rot: [-0.4, 0, 0.4], color: 0xf0ece0 },
      ],
      personality: { bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.55, ampMul: 1.1 }, bubbles: ['🔥', '😈', '👑', '💢'] },
    // Boo — hovering ghost
    { id: 'mario/shy-ghost', label: 'Shy Ghost (white, hovering)', rig: 'humanoid',
      humanoid: { sk: 0.75, headR: 140, limbR: 0.6, skin: 0xf5f2f0, body: 0xf5f2f0, eyes: 'dots', emI: 0.05, hover: 250 }, // approx: hover suppresses leg-gait (no-footfall)
      accessories: [
        { shape: 'box', size: [90, 20, 8], anchor: 'face', pos: [0, -25, -6], color: 0x2a2a2a },
        { shape: 'cone', size: [25, 40, 25], anchor: 'hip', pos: [-40, -20, 0], rot: [3.1416, 0, 0], color: 0xf5f2f0 },
        { shape: 'cone', size: [25, 40, 25], anchor: 'hip', pos: [0, -20, 30], rot: [3.1416, 0, 0], color: 0xf5f2f0 },
        { shape: 'cone', size: [25, 40, 25], anchor: 'hip', pos: [40, -20, 0], rot: [3.1416, 0, 0], color: 0xf5f2f0 },
      ],
      pet: true, personality: { bobMul: 1.6, swayMul: 1.5, cadenceMul: 0.4, ampMul: 0.2 }, bubbles: ['👻', '😈', '🤭', '💨'] },
    // Wario — broad rival
    { id: 'mario/rival-plumber', label: 'Rival Plumber (yellow & purple)', rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 132, limbR: 1.4, skin: 0xf2b28c, body: 0xf0c020, legColor: 0x6a2f9e, shoe: 0x4a2e1a, eyes: 'dots', armL: 0.9, legL: 0.75, footMul: [1.2, 1.0, 1.15] },
      accessories: [
        { shape: 'sphere', size: [70, 45, 70], anchor: 'crown', pos: [0, -10, -10], rot: [0.3, 0, 0], color: 0xf0c020 },
        { shape: 'sphere', size: [20, 20, 6], anchor: 'crown', pos: [0, -20, -70], color: 0x6a2f9e },
        { shape: 'box', size: [50, 20, 18], anchor: 'face', pos: [-30, -25, -12], rot: [0, 0, 0.4], color: 0x3a2418 },
        { shape: 'box', size: [50, 20, 18], anchor: 'face', pos: [30, -25, -12], rot: [0, 0, -0.4], color: 0x3a2418 },
        { shape: 'cone', size: [10, 30, 10], anchor: 'head', pos: [-100, 20, 0], rot: [0, 0, -1.0], color: 0xf2b28c },
        { shape: 'cone', size: [10, 30, 10], anchor: 'head', pos: [100, 20, 0], rot: [0, 0, 1.0], color: 0xf2b28c },
        ...bib(0x6a2f9e),
      ],
      personality: { bobMul: 1.4, swayMul: 1.3, cadenceMul: 0.85, ampMul: 1.15 }, bubbles: ['💰', '😤', '🧄', '💪'] },
    // Donkey Kong — big friendly ape (v2). NOT pet:true — matches the pack's
    // dino-companion (Yoshi), a full character that sits/does activities; only
    // shy-ghost (Boo) is pet:true here.
    { id: 'mario/barrel-ape', label: 'Barrel Ape (brown, red tie)', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 140, limbR: 1.5, skin: 0x6b4a2e, body: 0x6b4a2e, legColor: 0x6b4a2e, shoe: 0x3a2a1a, eyes: 'dots', hands: 'box', armL: 1.3, legL: 0.85, footMul: [1.3, 1.0, 1.4] },
      accessories: [
        { shape: 'box', size: [200, 240, 12], anchor: 'chest', pos: [0, -10, -6], color: 0xc9a06a }, // tan chest panel
        { shape: 'box', size: [50, 120, 10], anchor: 'chest', pos: [0, 60, -8], color: 0xd21f1a }, // red tie
        { shape: 'sphere', size: 40, anchor: 'head', pos: [-100, 10, 10], color: 0x6b4a2e }, // ear L
        { shape: 'sphere', size: 40, anchor: 'head', pos: [100, 10, 10], color: 0x6b4a2e }, // ear R
        { shape: 'box', size: [110, 20, 12], anchor: 'face', pos: [0, 30, -8], color: 0x2a1a12 }, // heavy brow
        { shape: 'box', size: [90, 40, 90], anchor: 'crown', pos: [0, 10, 0], color: 0x2a1a12 }, // hair tuft
      ],
      personality: { bobMul: 0.7, swayMul: 0.9, cadenceMul: 0.7, ampMul: 1.2 }, bubbles: ['🍌', '🦍', '💪', '😤'] },
  ],
};

export default pack;

// Video Games ▸ Animal Crossing — franchise pack (dynamic-import only, default
// loaded:false). Anthropomorphic-animal townsfolk built on the humanoid rig
// with a shared chibi base. Colour + silhouette only, no likenesses.
// Source: docs/avatars/video-games/animal-crossing.md.
import type { AvatarPackDef } from '../avatars.js';

const CREAM = 0xf5ecd0, DARKBROWN = 0x5c4030, NOSE = 0x201812;

const pack: AvatarPackDef = {
  id: 'animal-crossing', version: 2, label: 'Animal Crossing',
  path: ['Video Games', 'Animal Crossing'], builtin: true, franchise: true,
  // Whole pack shares chibi proportions; prominent ear accessories → earSkip.
  base: { rig: 'humanoid', humanoid: { sk: 0.7, headR: 155, limbR: 1.15, hands: 'sphere', eyes: 'dots', armL: 0.85, legL: 0.75, footMul: [1.15, 0.85, 1.05], earSkip: true } },
  avatars: [
    // Tom Nook
    { id: 'animal-crossing/tom-nook', label: 'Shopkeeper (raccoon, blue apron)', rig: 'humanoid',
      humanoid: { sk: 0.72, headR: 158, limbR: 1.1, skin: 0x9a7a54, body: 0x9a7a54, legColor: DARKBROWN, shoe: 0x3f2c1e, eyes: 'sleepy', armL: 0.8, legL: 0.7 },
      accessories: [
        { shape: 'sphere', size: [70, 30, 10], anchor: 'face', pos: [0, 15, -5], color: DARKBROWN },
        { shape: 'sphere', size: [35, 25, 45], anchor: 'face', pos: [0, -15, -10], color: DARKBROWN },
        { shape: 'sphere', size: 12, anchor: 'face', pos: [0, -15, -55], color: NOSE },
        { shape: 'sphere', size: [25, 30, 15], anchor: 'head', pos: [-100, 60, 0], color: DARKBROWN },
        { shape: 'sphere', size: [25, 30, 15], anchor: 'head', pos: [100, 60, 0], color: DARKBROWN },
        { shape: 'cylinder', size: [65, 65, 320], anchor: 'back', pos: [0, -60, 60], rot: [0.8, 0, 0], color: 0x9a7a54 }, // approx: static back-anchor tail
        { shape: 'sphere', size: 55, anchor: 'back', pos: [0, -170, 220], color: DARKBROWN },
        { shape: 'box', size: [180, 220, 15], anchor: 'chest', pos: [0, -30, 0], color: 0x3f7fbf },
        { shape: 'sphere', size: [20, 20, 6], anchor: 'chest', pos: [0, -30, -12], color: 0x5cab48 },
      ],
      personality: { bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.7, ampMul: 0.8 }, bubbles: ['💰', '🦝', '📦', '🏠'] },
    // Isabelle
    { id: 'animal-crossing/isabelle', label: 'Secretary (dog, yellow, ponytail)', rig: 'humanoid',
      humanoid: { sk: 0.72, headR: 152, limbR: 1.05, skin: 0xf6c945, body: 0xf6c945, legColor: 0xf6c945, shoe: 0xd9a52e, armL: 0.82 },
      accessories: [
        { shape: 'sphere', size: [27, 55, 17], anchor: 'head', pos: [-105, -20, 0], color: 0xe8791e },
        { shape: 'sphere', size: [27, 55, 17], anchor: 'head', pos: [105, -20, 0], color: 0xe8791e },
        { shape: 'sphere', size: [30, 20, 27], anchor: 'face', pos: [0, -10, -8], color: CREAM },
        { shape: 'sphere', size: 11, anchor: 'face', pos: [0, -10, -40], color: NOSE },
        { shape: 'cylinder', size: [20, 20, 20], anchor: 'crown', pos: [0, 5, 20], rot: [0.4, 0, 0], color: 0xe8791e },
        { shape: 'sphere', size: 32, anchor: 'crown', pos: [0, 30, 30], color: 0xf6c945 },
        { shape: 'sphere', size: [25, 15, 10], anchor: 'crown', pos: [0, -5, 40], color: 0xc23050 },
        { shape: 'box', size: [70, 90, 30], anchor: 'chest', pos: [-40, -10, 0], rot: [0, 0, 0.3], color: 0x6b4a2e },
      ],
      personality: { swayMul: 0.8, ampMul: 0.9 }, bubbles: ['🔔', '🎀', '📋', '🐾'] },
    // Blathers
    { id: 'animal-crossing/blathers', label: 'Museum curator (owl, brown, bowtie)', rig: 'humanoid',
      humanoid: { sk: 0.78, headR: 168, limbR: 1.0, skin: DARKBROWN, body: DARKBROWN, legColor: DARKBROWN, shoe: 0xf4c430, legL: 0.7 },
      accessories: [
        { shape: 'sphere', size: [85, 85, 15], anchor: 'face', pos: [0, 0, -6], color: 0xf0e6d2 },
        { shape: 'cone', size: [30, 45, 30], anchor: 'face', pos: [0, -5, -18], rot: [-1.5708, 0, 0], color: 0xf4c430 },
        { shape: 'box', size: [50, 18, 18], anchor: 'face', pos: [-35, 30, -18], rot: [0, 0, 0.3], color: 0x4a3220 },
        { shape: 'box', size: [50, 18, 18], anchor: 'face', pos: [35, 30, -18], rot: [0, 0, -0.3], color: 0x4a3220 },
        { shape: 'sphere', size: 20, anchor: 'face', pos: [-45, -10, -12], color: 0xf0a8b0 },
        { shape: 'sphere', size: 20, anchor: 'face', pos: [45, -10, -12], color: 0xf0a8b0 },
        { shape: 'cone', size: [15, 55, 15], anchor: 'crown', pos: [-40, 0, 10], rot: [0.4, 0, -0.3], color: 0x4a3220 },
        { shape: 'cone', size: [15, 55, 15], anchor: 'crown', pos: [40, 0, 10], rot: [0.4, 0, 0.3], color: 0x4a3220 },
        { shape: 'sphere', size: [70, 80, 10], anchor: 'chest', pos: [0, 0, -5], color: 0xf0e6d2 }, // approx: argyle belly → single cream patch
        { shape: 'sphere', size: [30, 17, 10], anchor: 'chest', pos: [0, 60, -8], color: 0x2f5233 },
      ],
      personality: { bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.75, ampMul: 0.7 }, bubbles: ['🦉', '📜', '😨'] },
    // Peppy dog (generic)
    { id: 'animal-crossing/peppy-villager-dog', label: 'Peppy villager (dog, pink)', rig: 'humanoid',
      humanoid: { sk: 0.68, headR: 150, limbR: 1.1, skin: 0xf5a9c9, body: 0xf5a9c9, legColor: 0xf5a9c9, shoe: 0xe07fae, emI: 0.05 },
      accessories: [
        { shape: 'sphere', size: [25, 50, 15], anchor: 'head', pos: [-100, -15, 0], color: 0xf5a9c9 },
        { shape: 'sphere', size: [25, 50, 15], anchor: 'head', pos: [100, -15, 0], color: 0xf5a9c9 },
        { shape: 'sphere', size: [27, 17, 25], anchor: 'face', pos: [0, -10, -8], color: CREAM },
        { shape: 'sphere', size: 4, anchor: 'face', pos: [-30, 25, -20], color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 },
        { shape: 'sphere', size: 4, anchor: 'face', pos: [30, 25, -20], color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.3 },
        { shape: 'sphere', size: [27, 15, 10], anchor: 'crown', pos: [-50, 10, 0], color: 0xc23050 },
        { shape: 'cone', size: [25, 50, 25], anchor: 'back', pos: [0, -40, 20], rot: [1.0, 0, 0], color: 0xf5a9c9 }, // approx: static stub tail
      ],
      personality: { bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.2 }, bubbles: ['🐶', '💬', '🎀', '😆'] },
    // Peppy cat (generic)
    { id: 'animal-crossing/peppy-villager-cat', label: 'Peppy villager (cat, cream)', rig: 'humanoid',
      humanoid: { sk: 0.68, headR: 148, limbR: 1.05, skin: 0xf5f0e6, body: 0xf5f0e6, legColor: 0xf5f0e6, shoe: 0xe0d8c4 },
      accessories: [
        { shape: 'cone', size: [22, 70, 22], anchor: 'head', pos: [-70, 40, 0], rot: [0, 0, -0.3], color: 0xf5f0e6 },
        { shape: 'cone', size: [22, 70, 22], anchor: 'head', pos: [70, 40, 0], rot: [0, 0, 0.3], color: 0xf5f0e6 },
        { shape: 'cone', size: [12, 45, 12], anchor: 'head', pos: [-70, 40, -5], rot: [0, 0, -0.3], color: 0xf2b8c4 },
        { shape: 'cone', size: [12, 45, 12], anchor: 'head', pos: [70, 40, -5], rot: [0, 0, 0.3], color: 0xf2b8c4 },
        { shape: 'box', size: [50, 40, 20], anchor: 'crown', pos: [0, -10, -30], color: 0x8b4a2b },
        { shape: 'sphere', size: 17, anchor: 'face', pos: [-45, -10, -10], color: 0xf2b8c4 },
        { shape: 'sphere', size: 17, anchor: 'face', pos: [45, -10, -10], color: 0xf2b8c4 },
        { shape: 'sphere', size: 7, anchor: 'face', pos: [0, -12, -35], color: 0xc23050 },
        { shape: 'cone', size: [20, 140, 20], anchor: 'back', pos: [0, -30, 30], rot: [1.1, 0, 0], color: 0xf5f0e6 }, // approx: static tail
      ],
      personality: { bobMul: 1.2, swayMul: 1.0, cadenceMul: 1.15, ampMul: 0.95 }, bubbles: ['🐱', '💕', '✨'] },
    // Peppy bear (generic)
    { id: 'animal-crossing/peppy-villager-bear', label: 'Peppy villager (bear, white)', rig: 'humanoid',
      humanoid: { sk: 0.75, headR: 162, limbR: 1.25, skin: 0xf7f7f4, body: 0xf7f7f4, legColor: 0xf7f7f4, shoe: 0xe8e8e2, legL: 0.72 },
      accessories: [
        { shape: 'sphere', size: 32, anchor: 'head', pos: [-95, 55, 0], color: 0xf7f7f4 },
        { shape: 'sphere', size: 32, anchor: 'head', pos: [95, 55, 0], color: 0xf7f7f4 },
        { shape: 'sphere', size: 17, anchor: 'head', pos: [-95, 55, -12], color: 0x6ab0d6 },
        { shape: 'sphere', size: 17, anchor: 'head', pos: [95, 55, -12], color: 0x6ab0d6 },
        { shape: 'box', size: [55, 35, 20], anchor: 'crown', pos: [0, -10, -30], color: 0xe8c766 },
        { shape: 'box', size: [45, 22, 8], anchor: 'face', pos: [-45, -5, -8], color: 0xf2c0c8 },
        { shape: 'box', size: [45, 22, 8], anchor: 'face', pos: [45, -5, -8], color: 0xf2c0c8 },
        { shape: 'sphere', size: [13, 10, 11], anchor: 'face', pos: [0, -15, -20], color: 0x1c1c1c },
      ],
      personality: { bobMul: 1.15, swayMul: 1.2, ampMul: 0.85 }, bubbles: ['🐻', '🍧', '❄️'] },
    // Mr. Resetti
    { id: 'animal-crossing/resetti', label: 'Mole warner (brown, blue overalls, hard hat)', rig: 'humanoid',
      humanoid: { sk: 0.65, headR: 145, limbR: 1.2, skin: 0x6b4a35, body: 0x2255aa, legColor: 0x2255aa, shoe: 0x1c1c1c, eyes: 'slit', armL: 0.8, legL: 0.65 }, // approx: whiskers omitted
      accessories: [
        { shape: 'sphere', size: [25, 17, 27], anchor: 'face', pos: [0, -15, -8], color: 0x4a3220 },
        { shape: 'sphere', size: 10, anchor: 'face', pos: [0, -15, -35], color: NOSE },
        { shape: 'box', size: [45, 16, 16], anchor: 'face', pos: [-32, 25, -12], rot: [0, 0, -0.4], color: NOSE },
        { shape: 'box', size: [45, 16, 16], anchor: 'face', pos: [32, 25, -12], rot: [0, 0, 0.4], color: NOSE },
        { shape: 'box', size: [180, 140, 10], anchor: 'chest', pos: [0, -20, 0], color: 0x2255aa },
        { shape: 'box', size: [180, 40, 6], anchor: 'chest', pos: [0, 60, -4], color: 0xf5f2ea },
        { shape: 'sphere', size: [70, 45, 70], anchor: 'crown', pos: [0, -10, -10], rot: [0.3, 0, 0], color: 0xf6c945 },
        { shape: 'sphere', size: 15, anchor: 'head', pos: [-90, 40, 0], color: 0x6b4a35 },
        { shape: 'sphere', size: 15, anchor: 'head', pos: [90, 40, 0], color: 0x6b4a35 },
      ],
      personality: { bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.65, ampMul: 1.1 }, bubbles: ['⛏️', '😠', '💾'] },
    // K.K. Slider
    { id: 'animal-crossing/kk-slider', label: 'Traveling musician (dog, white, guitar)', rig: 'humanoid',
      humanoid: { sk: 0.78, headR: 140, limbR: 0.95, skin: 0xf2f2ee, body: 0xf2f2ee, legColor: 0xf2f2ee, shoe: 0xe8e8e2, armL: 0.88, legL: 0.8 },
      accessories: [
        { shape: 'sphere', size: [25, 50, 15], anchor: 'head', pos: [-100, -10, 0], color: 0xf2f2ee },
        { shape: 'sphere', size: [25, 50, 15], anchor: 'head', pos: [100, -10, 0], color: 0xf2f2ee },
        { shape: 'sphere', size: [20, 25, 12], anchor: 'head', pos: [-105, -45, 0], color: 0x1c1c1c },
        { shape: 'sphere', size: [20, 25, 12], anchor: 'head', pos: [105, -45, 0], color: 0x1c1c1c },
        { shape: 'box', size: [50, 18, 18], anchor: 'face', pos: [-30, 30, -8], color: 0x1c1c1c },
        { shape: 'box', size: [50, 18, 18], anchor: 'face', pos: [30, 30, -8], color: 0x1c1c1c },
        { shape: 'sphere', size: [13, 10, 12], anchor: 'face', pos: [0, -12, -20], color: 0x1c1c1c },
        { shape: 'box', size: [140, 200, 40], anchor: 'handL', pos: [40, -60, -60], rot: [0.3, 0, 0.4], color: 0x8b5a2b },
        { shape: 'sphere', size: [25, 25, 4], anchor: 'handL', pos: [40, -60, -80], color: 0x3a2418 },
        { shape: 'cylinder', size: [10, 10, 260], anchor: 'handL', pos: [-40, 60, -50], rot: [0.3, 0, 0.4], color: 0x5c3a21 },
      ],
      personality: { bobMul: 0.7, swayMul: 0.9, cadenceMul: 0.7, ampMul: 0.8 }, bubbles: ['🎸', '🎵', '🌙'] },
  ],
};

export default pack;

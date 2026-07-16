// Video Games ▸ The Legend of Zelda — franchise pack (dynamic-import only,
// default loaded:false). Geometric homage: colour + silhouette only, no
// likenesses. Source: docs/avatars/video-games/zelda.md.
import type { AvatarPackDef } from '../avatars.js';

const HERO_GREEN = 0x2e7a34, ROYAL_PINK = 0xe85d9c, GOLD = 0xd4af37;
const GERUDO = 0x7a4a2a, VILLAIN = 0x181818, LEAF = 0x4c8c3c;
const WHITE = 0xf5f2ea, ROCK = 0xa0623a, ZORA = 0x2f7da0, RED = 0xc23030;

const pack: AvatarPackDef = {
  id: 'zelda', version: 1, label: 'The Legend of Zelda',
  path: ['Video Games', 'The Legend of Zelda'], builtin: true, franchise: true,
  avatars: [
    // Link
    { id: 'zelda/hylian-hero', label: 'Hero (green tunic, pointed cap)', rig: 'humanoid',
      humanoid: { skin: 0xe8b892, body: HERO_GREEN, legColor: 0xdbc9a0, shoe: 0x5c3a21, eyes: 'almond' },
      accessories: [
        { shape: 'cone', size: [55, 170, 55], anchor: 'crown', pos: [0, 10, 20], rot: [0.4, 0, 0.15], color: HERO_GREEN },
        { shape: 'cone', size: [9, 55, 9], anchor: 'head', pos: [-100, 20, 5], rot: [0, 0, -0.7], color: 0xe8b892 },
        { shape: 'cone', size: [9, 55, 9], anchor: 'head', pos: [100, 20, 5], rot: [0, 0, 0.7], color: 0xe8b892 },
        { shape: 'box', size: [40, 20, 20], anchor: 'head', pos: [0, -10, 60], color: 0xf0d060 },
        { shape: 'box', size: [200, 24, 8], anchor: 'chest', pos: [0, -45, 0], color: 0x5c3a21 },
        { shape: 'box', size: [26, 26, 8], anchor: 'chest', pos: [0, -45, -6], color: GOLD },
        { shape: 'box', size: [180, 220, 20], anchor: 'back', pos: [0, 40, 10], color: 0x1e4fa0 },
        { shape: 'cylinder', size: [12, 12, 340], anchor: 'back', pos: [0, 60, 30], rot: [0, 0, 0.5], color: 0xd6d6da },
        { shape: 'box', size: [90, 16, 16], anchor: 'back', pos: [40, 120, 30], rot: [0, 0, 0.5], color: GOLD },
      ],
      personality: { swayMul: 0.7 }, bubbles: ['🗡️', '🛡️', '🧭', '❤️'] },
    // Princess Zelda
    { id: 'zelda/hyrule-princess', label: 'Princess (pink & gold gown, tiara)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, limbR: 0.9, skin: 0xecc4a0, body: ROYAL_PINK, legColor: ROYAL_PINK, shoe: GOLD, eyes: 'almond', armL: 0.95 },
      accessories: [
        { shape: 'cone', size: [8, 48, 8], anchor: 'head', pos: [-95, 15, 5], rot: [0, 0, -0.7], color: 0xecc4a0 },
        { shape: 'cone', size: [8, 48, 8], anchor: 'head', pos: [95, 15, 5], rot: [0, 0, 0.7], color: 0xecc4a0 },
        { shape: 'box', size: [50, 220, 40], anchor: 'head', pos: [-90, -70, 20], color: 0xf0d060 },
        { shape: 'box', size: [50, 220, 40], anchor: 'head', pos: [90, -70, 20], color: 0xf0d060 },
        { shape: 'box', size: [140, 260, 30], anchor: 'back', pos: [0, -40, 15], color: 0xf0d060 },
        { shape: 'box', size: [130, 24, 110], anchor: 'crown', pos: [0, -30, 0], color: GOLD },
        { shape: 'sphere', size: 10, anchor: 'crown', pos: [0, -30, -55], color: 'accent' },
        { shape: 'box', size: [40, 30, 8], anchor: 'chest', pos: [0, -10, 0], color: GOLD }, // approx: Triforce → single gold emblem
        { shape: 'box', size: [180, 18, 6], anchor: 'hip', pos: [0, 0, 0], color: GOLD },
      ],
      personality: { bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.7 }, bubbles: ['✨', '👑', '📜', '🙏'] },
    // Ganondorf
    { id: 'zelda/demon-king', label: 'Demon King (dark bronze, red hair, tusks)', rig: 'humanoid',
      humanoid: { sk: 1.3, headR: 148, limbR: 1.25, skin: GERUDO, body: VILLAIN, legColor: VILLAIN, shoe: VILLAIN, eyes: 'halfred', emI: 0.15, steel: true, hands: 'box', armL: 1.15, legL: 1.05 },
      accessories: [
        { shape: 'cone', size: [12, 65, 12], anchor: 'head', pos: [-105, 15, 5], rot: [0, 0, -0.6], color: GERUDO },
        { shape: 'cone', size: [12, 65, 12], anchor: 'head', pos: [105, 15, 5], rot: [0, 0, 0.6], color: GERUDO },
        { shape: 'cone', size: [80, 140, 80], anchor: 'crown', pos: [0, 20, 30], rot: [0.4, 0, 0], color: 0xb33d1e },
        { shape: 'cone', size: [8, 45, 8], anchor: 'face', pos: [-25, -35, -10], rot: [-0.5, 0, 0], color: 0xe8dfc8 },
        { shape: 'cone', size: [8, 45, 8], anchor: 'face', pos: [25, -35, -10], rot: [-0.5, 0, 0], color: 0xe8dfc8 },
        { shape: 'box', size: [85, 65, 60], anchor: 'shoulderL', color: VILLAIN },
        { shape: 'box', size: [85, 65, 60], anchor: 'shoulderR', color: VILLAIN },
        { shape: 'sphere', size: [25, 25, 8], anchor: 'chest', pos: [0, 0, 0], color: GOLD },
        { shape: 'cone', size: [210, 560, 210], anchor: 'back', pos: [0, -120, 30], color: 0x5c1010 },
      ],
      personality: { bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.6, ampMul: 0.9 }, bubbles: ['😈', '🔥', '🐗', '⚡'] },
    // Korok — full leaf mask, no rig face (noFace + eyes:none)
    { id: 'zelda/forest-korok', label: 'Forest companion (wood body, leaf mask)', rig: 'humanoid',
      humanoid: { sk: 0.45, headR: 78, headShape: 'box', limbR: 0.55, skin: 0x8a6034, body: 0x8a6034, legColor: 0x6e4c28, shoe: 0x5a3d20, eyes: 'none', noFace: true, armL: 0.75, legL: 0.7, footMul: [0.9, 0.8, 0.9] }, // approx: sk bumped 0.4→0.45 (floor)
      accessories: [
        { shape: 'sphere', size: [65, 65, 10], anchor: 'face', pos: [0, 0, -4], color: LEAF },
        { shape: 'box', size: [4, 90, 2], anchor: 'face', pos: [0, 0, -14], color: 0x3a6e2c },
        { shape: 'cone', size: [10, 40, 10], anchor: 'crown', pos: [-15, 5, 0], rot: [0, 0, -0.3], color: 0x5cab48 },
        { shape: 'cone', size: [10, 40, 10], anchor: 'crown', pos: [15, 5, 0], rot: [0, 0, 0.3], color: 0x5cab48 },
        { shape: 'cylinder', size: [5, 5, 30], anchor: 'head', pos: [-70, 0, 0], rot: [0, 0, -1.2], color: 0x6e4c28 },
        { shape: 'cylinder', size: [5, 5, 30], anchor: 'head', pos: [70, 0, 0], rot: [0, 0, 1.2], color: 0x6e4c28 },
      ],
      personality: { bobMul: 1.4, swayMul: 1.1, cadenceMul: 1.2, ampMul: 0.7 }, bubbles: ['🌰', '🍃', '🌳', '❓'] },
    // Cucco — biped bird on the humanoid rig (cartoon_duck idiom)
    { id: 'zelda/farm-cucco', label: 'Farm chicken (white, red comb)', rig: 'humanoid',
      humanoid: { sk: 0.5, headR: 92, limbR: 0.75, skin: WHITE, body: WHITE, shoe: 0xe0a020, eyes: 'dots', armL: 0.55, legColor: 0xe0a020, footMul: [1.3, 0.6, 1.15] },
      accessories: [
        { shape: 'cone', size: [19, 50, 19], anchor: 'face', pos: [0, -5, -20], rot: [-1.5708, 0, 0], color: 0xe0a020 },
        { shape: 'cone', size: [10, 20, 10], anchor: 'crown', pos: [0, 0, -30], color: RED },
        { shape: 'cone', size: [10, 20, 10], anchor: 'crown', pos: [0, 5, 0], color: RED },
        { shape: 'cone', size: [10, 20, 10], anchor: 'crown', pos: [0, 0, 30], color: RED },
        { shape: 'sphere', size: [12, 18, 10], anchor: 'face', pos: [0, -35, -12], color: RED },
      ],
      personality: { bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.3, ampMul: 0.6 }, bubbles: ['🐔', '😠', '❗'] },
    // Goron
    { id: 'zelda/goron-brawler', label: 'Goron (rock-brown, boulder body)', rig: 'humanoid',
      humanoid: { sk: 1.25, headR: 145, limbR: 1.35, skin: ROCK, body: ROCK, legColor: 0x8f5530, shoe: 0x6e4020, eyes: 'dots', armL: 1.15, legL: 0.85, footMul: [1.2, 1.0, 1.1] },
      accessories: [
        { shape: 'sphere', size: 55, anchor: 'back', pos: [0, 60, 10], color: GERUDO },
        { shape: 'sphere', size: 48, anchor: 'back', pos: [-55, 20, 12], color: GERUDO },
        { shape: 'sphere', size: 48, anchor: 'back', pos: [55, 20, 12], color: GERUDO },
        { shape: 'sphere', size: 42, anchor: 'back', pos: [0, -30, 12], color: GERUDO },
        { shape: 'sphere', size: [15, 15, 6], anchor: 'chest', pos: [0, 20, 0], color: 0xd6552a },
        { shape: 'box', size: [200, 140, 10], anchor: 'hip', pos: [0, -20, 0], color: 0xc9a86a },
      ],
      personality: { bobMul: 0.8, swayMul: 0.9, cadenceMul: 0.55, ampMul: 1.0 }, bubbles: ['🪨', '🔥', '💪'] },
    // Zora
    { id: 'zelda/zora-swimmer', label: 'Zora (blue, finned, aquatic)', rig: 'humanoid',
      humanoid: { headR: 118, limbR: 0.9, skin: ZORA, body: ZORA, legColor: 0x2a6f90, shoe: ZORA, eyes: 'almond', emI: 0.08, legL: 1.05, footMul: [1.25, 0.7, 1.3] },
      accessories: [
        { shape: 'cone', size: [45, 160, 45], anchor: 'crown', pos: [0, 0, 30], rot: [0.6, 0, 0], color: 0x8fd0e0 },
        { shape: 'box', size: [50, 70, 12], anchor: 'handL', color: 0x8fd0e0 },
        { shape: 'box', size: [50, 70, 12], anchor: 'handR', color: 0x8fd0e0 },
        { shape: 'box', size: [24, 6, 4], anchor: 'face', pos: [-55, -30, 5], color: 0x1f5570 },
        { shape: 'box', size: [24, 6, 4], anchor: 'face', pos: [55, -30, 5], color: 0x1f5570 },
      ],
      personality: { bobMul: 0.5, swayMul: 0.9, cadenceMul: 0.9, ampMul: 0.85 }, bubbles: ['🌊', '🐟', '🎶'] },
  ],
};

export default pack;

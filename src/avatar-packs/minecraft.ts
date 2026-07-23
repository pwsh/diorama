// Video Games ▸ Minecraft — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric homage: the ENTIRE pack is boxy —
// headShape 'box' + box hands on every member, blocky accessories. Two default
// player skins plus six iconic mobs (mobs are pet:true — non-person creatures).
// Colour + silhouette only, no likenesses/letters.
// Source: docs/avatars/video-games/minecraft.md.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'minecraft', version: 2, label: 'Minecraft',
  path: ['Video Games', 'Minecraft'], builtin: true, franchise: true,
  // Cube heads + blocky hands are the single most Minecraft-defining trait.
  base: { rig: 'humanoid', humanoid: { headShape: 'box', hands: 'box', eyes: 'dots', emI: 0, steel: false, footMul: [1, 1, 1] } },
  avatars: [
    // Steve — original default player skin
    { id: 'minecraft/player-blue', label: 'Player (cyan shirt, brown hair)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 120, limbR: 1.0, skin: 0xd9a273, body: 0x4f8fce, legColor: 0x33344a, shoe: 0x8c8c8c, armL: 1.0, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [192, 40, 186], anchor: 'crown', pos: [0, 8, 0], color: 0x4a3728 }, // hair cap
        { shape: 'box', size: [70, 22, 16], anchor: 'face', pos: [0, -55, -6], color: 0x4a3728 }, // stubble
      ],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.0 }, bubbles: ['⛏️', '🧱', '💎', '😀'] },
    // Alex — second default player skin
    { id: 'minecraft/player-orange', label: 'Player (green shirt, orange ponytail)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 118, limbR: 0.85, skin: 0xe8c19a, body: 0x74b06a, legColor: 0x6b5338, shoe: 0x7a7267, armL: 0.95, legL: 1.0, footMul: [0.95, 1.0, 0.95] },
      accessories: [
        { shape: 'box', size: [40, 220, 35], anchor: 'head', pos: [78, -70, 40], rot: [0.2, 0, 0], color: 0xe08a30 }, // side ponytail
        { shape: 'box', size: [90, 110, 25], anchor: 'back', pos: [0, 30, 10], color: 0xe08a30 }, // hair back
        { shape: 'box', size: [180, 16, 10], anchor: 'chest', pos: [0, 62, -6], color: 0x4a7a42 }, // collar trim
      ],
      personality: { bobMul: 1.05, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.0 }, bubbles: ['🏹', '🌻', '💚', '😊'] },
    // Creeper — armless green column, flat pixel face
    { id: 'minecraft/explosive-crawler', label: 'Explosive Crawler (green, blocky, no arms)', rig: 'humanoid', pet: true,
      humanoid: { sk: 1.05, headR: 95, limbR: 0.5, skin: 0x3a8f3a, body: 0x3a8f3a, legColor: 0x2b6b2b, shoe: 0x2b6b2b, eyes: 'none', noFace: true, armL: 0.35, legL: 0.85, footMul: [1.3, 0.7, 1.3] },
      accessories: [
        { shape: 'box', size: [26, 26, 6], anchor: 'face', pos: [-28, 12, -6], color: 0x1c3d1c }, // eye L
        { shape: 'box', size: [26, 26, 6], anchor: 'face', pos: [28, 12, -6], color: 0x1c3d1c }, // eye R
        { shape: 'box', size: [20, 50, 6], anchor: 'face', pos: [0, -28, -6], color: 0x1c3d1c }, // frown
        { shape: 'box', size: [42, 42, 6], anchor: 'chest', pos: [34, 20, -6], color: 0x2b6b2b }, // blotch
        { shape: 'box', size: [40, 40, 6], anchor: 'chest', pos: [-32, -34, -6], color: 0x2b6b2b }, // blotch
        { shape: 'box', size: [40, 40, 6], anchor: 'back', pos: [-20, 24, 8], color: 0x2b6b2b }, // blotch
      ],
      personality: { bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.9, ampMul: 0.5 }, bubbles: ['💥', '😐', '💚', '🤫'] },
    // Zombie — rotted humanoid, forward hunch
    { id: 'minecraft/shambling-undead', label: 'Shambling Undead (rotted green, tattered blue)', rig: 'humanoid', pet: true,
      humanoid: { sk: 1.0, headR: 122, limbR: 1.0, skin: 0x4c7a3f, body: 0x3d5a73, legColor: 0x2b3a4a, shoe: 0x241f1f, armL: 1.05, legL: 0.95 },
      posture: { pitch: 0.12 },
      personality: { bobMul: 0.7, swayMul: 1.6, cadenceMul: 0.55, ampMul: 1.3 }, bubbles: ['😩', '🌙', '💀', '🚶'] },
    // Skeleton — bone-white archer, straight-stave bow approximation
    { id: 'minecraft/bone-archer', label: 'Bone Archer (bone white, bow)', rig: 'humanoid', pet: true,
      humanoid: { sk: 1.0, headR: 118, limbR: 0.65, skin: 0xdcd6c2, body: 0xd2ccb6, legColor: 0xcac4ae, shoe: 0xb0aa96, armL: 1.0, legL: 1.0, footMul: [0.85, 0.9, 0.85] },
      accessories: [
        { shape: 'cylinder', size: [14, 14, 260], anchor: 'handR', pos: [0, 0, -30], color: 0x5a4632 }, // approx: curved bow → straight stave
        { shape: 'cylinder', size: [40, 40, 140], anchor: 'back', pos: [34, 20, 20], rot: [0.3, 0, 0.3], color: 0x6b4e34 }, // quiver
        { shape: 'box', size: [30, 44, 8], anchor: 'back', pos: [34, 90, 22], color: 0xe0dccc }, // fletching tips
      ],
      personality: { bobMul: 0.9, swayMul: 0.6, cadenceMul: 1.0, ampMul: 0.8 }, bubbles: ['🏹', '💀', '🦴', '😨'] },
    // Enderman — tall, black, glowing purple eyes
    { id: 'minecraft/void-stalker', label: 'Void Stalker (tall, black, purple eyes)', rig: 'humanoid', pet: true,
      humanoid: { sk: 1.2, headR: 100, limbR: 0.55, skin: 0x18151a, body: 0x18151a, legColor: 0x18151a, shoe: 0x0d0b0d, eyes: 'none', noFace: true, armL: 1.5, legL: 1.35, footMul: [0.8, 0.9, 0.9] },
      accessories: [
        { shape: 'sphere', size: 18, anchor: 'face', pos: [-30, 6, -6], color: 0x9b30ff, emissive: 0x9b30ff, emissiveIntensity: 0.9, outlineSkip: true }, // eye L
        { shape: 'sphere', size: 18, anchor: 'face', pos: [30, 6, -6], color: 0x9b30ff, emissive: 0x9b30ff, emissiveIntensity: 0.9, outlineSkip: true }, // eye R
      ],
      personality: { bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.75, ampMul: 0.9 }, bubbles: ['😳', '🟪', '👀', '💨'] },
    // Villager — bald, big nose, unibrow, floor-length robe
    { id: 'minecraft/robed-trader', label: 'Robed Trader (brown robe, big nose, unibrow)', rig: 'humanoid', pet: true,
      humanoid: { sk: 0.95, headR: 128, limbR: 0.85, skin: 0xc9a06e, body: 0x8a6a45, legColor: 0x8a6a45, shoe: 0x5c4630, eyes: 'almond', armL: 0.9, legL: 0.9, footMul: [0.9, 1.0, 0.9] },
      accessories: [
        { shape: 'sphere', size: 55, anchor: 'face', pos: [0, -6, -22], color: 0xb98e5c }, // oversized hooked nose
        { shape: 'box', size: [100, 20, 14], anchor: 'face', pos: [0, 26, -8], color: 0x3a2a1a }, // unibrow
        { shape: 'box', size: [180, 260, 8], anchor: 'chest', pos: [0, -60, -6], color: 0xd9c39a }, // apron overlay
      ],
      personality: { bobMul: 0.8, swayMul: 0.7, cadenceMul: 0.9, ampMul: 0.7 }, bubbles: ['💚', '🌾', '🏠', '😟'] },
    // Piglin — pale pink, snout, tusks, gold jewelry
    { id: 'minecraft/tusked-raider', label: 'Tusked Raider (pale pink, tusks, gold)', rig: 'humanoid', pet: true,
      humanoid: { sk: 1.1, headR: 128, limbR: 1.15, skin: 0xe8a9a0, body: 0x4a3a2e, legColor: 0x3a2c22, shoe: 0x2a1f18, armL: 1.1, legL: 0.95, footMul: [1.1, 1.0, 1.15] },
      accessories: [
        { shape: 'sphere', size: 50, anchor: 'face', pos: [0, -10, -22], color: 0xd68f86 }, // snout
        { shape: 'box', size: [60, 90, 20], anchor: 'head', pos: [-95, 8, 8], color: 0xd68f86 }, // ear L
        { shape: 'box', size: [60, 90, 20], anchor: 'head', pos: [95, 8, 8], color: 0xd68f86 }, // ear R
        { shape: 'cone', size: [14, 36], anchor: 'face', pos: [-22, -34, -18], rot: [0, 0, 0.2], color: 0xf0ece0 }, // tusk L
        { shape: 'cone', size: [14, 36], anchor: 'face', pos: [22, -34, -18], rot: [0, 0, -0.2], color: 0xf0ece0 }, // tusk R
        { shape: 'box', size: [150, 12, 156], anchor: 'neck', pos: [0, -8, 0], color: 0xd9b34a }, // gold chain
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'head', pos: [98, -22, 10], rot: [0, 1.57, 0], color: 0xd9b34a }, // earring
      ],
      personality: { bobMul: 1.1, swayMul: 1.0, cadenceMul: 0.9, ampMul: 1.2 }, bubbles: ['🪙', '💰', '😠', '🔥'] },
  ],
};

export default pack;

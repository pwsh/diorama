// Video Games ▸ Genshin Impact — franchise pack (dynamic-import only, default
// loaded:false). Mascot + protagonist + six flagship characters, one signature
// elemental hue each. One legless floating fairy uses the rig's `hover` field.
// Colour + silhouette only, no likenesses. Source:
// docs/avatars/video-games/genshin-impact.md.
import type { AvatarPackDef } from '../avatars.js';

const GOLD = 0xd4af37;

const pack: AvatarPackDef = {
  id: 'genshin-impact', version: 1, label: 'Genshin Impact',
  path: ['Video Games', 'Genshin Impact'], builtin: true, franchise: true,
  base: { rig: 'humanoid', humanoid: { headR: 124, headShape: 'sphere', limbR: 1.0, hands: 'sphere', eyes: 'almond', steel: false, emI: 0, armL: 1.0, legL: 1.0, footMul: [1, 1, 1] } },
  avatars: [
    // Paimon — small floating fairy, white hair, halo tiara
    { id: 'genshin-impact/sky-fairy', label: 'Sky companion (small, white hair, floating halo)', rig: 'humanoid',
      humanoid: { sk: 0.45, headR: 100, limbR: 0.6, skin: 0xf3ddc4, body: 0xf5f0e8, legColor: 0xf5f0e8, shoe: 0xe8c9a0, eyes: 'dots', hover: 650, armL: 0.85, legL: 0.8, footMul: [0.85, 0.8, 0.85] },
      accessories: [
        { shape: 'sphere', size: [65, 45, 65], anchor: 'crown', pos: [0, -10, 0], color: 0xf7f5ef }, // hair mass
        { shape: 'cylinder', size: [45, 45, 10], anchor: 'crown', pos: [0, 42, 0], color: 0xd9a66c }, // approx: halo ring → flat disc (no torus)
        { shape: 'cone', size: [9, 18], anchor: 'head', pos: [50, 40, -10], color: 0x2a2a3a }, // hair star
        { shape: 'box', size: [110, 140, 15], anchor: 'back', pos: [0, -10, 10], color: 0x1c2540 }, // celestial cape
        { shape: 'sphere', size: 6, anchor: 'back', pos: [-30, 20, 12], color: 0xd9a66c }, // constellation dot
        { shape: 'sphere', size: 6, anchor: 'back', pos: [30, -10, 12], color: 0xd9a66c }, // constellation dot
        { shape: 'box', size: [30, 30, 6], anchor: 'chest', pos: [0, 20, -6], color: 0x2a2a3a }, // emblem
      ],
      personality: { bobMul: 1.5, swayMul: 1.3, cadenceMul: 1.1, ampMul: 0.6 }, bubbles: ['⭐', '🍞', '😋', '❗'] },
    // Traveler — blond, blue-white cape, star pendant
    { id: 'genshin-impact/sword-explorer', label: 'Traveler (blond, elemental sword, star pendant)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, limbR: 0.95, skin: 0xe8c4a0, body: 0x3b3228, legColor: 0x2a2622, shoe: 0x1c1c1c, armL: 1.0, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [120, 80, 110], anchor: 'crown', pos: [0, -10, 0], color: 0xf0d878 }, // hair
        { shape: 'cylinder', size: [30, 30, 260], anchor: 'back', pos: [0, 20, 10], rot: [0.3, 0, 0], color: 0xf0d878 }, // hair tail
        { shape: 'box', size: [150, 280, 15], anchor: 'back', pos: [0, -20, 12], color: 0xdbe9f2 }, // cape
        { shape: 'box', size: [150, 10, 4], anchor: 'back', pos: [0, -150, 14], color: GOLD }, // cape hem trim
        { shape: 'box', size: [24, 24, 10], anchor: 'chest', pos: [0, 30, -8], color: GOLD, emissive: 0x8fd0e0, emissiveIntensity: 0.3 }, // vision pendant
        { shape: 'box', size: [90, 30, 20], anchor: 'neck', pos: [0, -6, -8], color: 0xf5f2ea }, // scarf
        { shape: 'cylinder', size: [20, 20, 220], anchor: 'hip', pos: [80, -20, 0], rot: [0.2, 0, 0.2], color: 0xd6d6da }, // sheathed sword
        { shape: 'box', size: [60, 12, 12], anchor: 'hip', pos: [80, 80, 0], color: GOLD }, // cross-guard
      ],
      personality: { bobMul: 1.0, swayMul: 0.8, cadenceMul: 1.0, ampMul: 1.0 }, bubbles: ['⚔️', '✨', '🧭', '❓'] },
    // Diluc — red hair, black-and-gold coat
    { id: 'genshin-impact/crimson-vintner', label: 'Vintner (red hair, black-and-gold coat)', rig: 'humanoid',
      humanoid: { sk: 1.08, headR: 128, limbR: 1.05, skin: 0xe8c2a0, body: 0x181818, legColor: 0x1c1c1c, shoe: 0x141414, hands: 'box', armL: 1.1, legL: 1.05 },
      accessories: [
        { shape: 'box', size: [120, 80, 115], anchor: 'crown', pos: [0, -10, 0], color: 0xb02020 }, // red hair
        { shape: 'cylinder', size: [30, 30, 240], anchor: 'back', pos: [0, 20, 10], rot: [0.3, 0, 0], color: 0xb02020 }, // ponytail
        { shape: 'box', size: [30, 140, 8], anchor: 'chest', pos: [0, 20, -6], color: 0x101010 }, // tie
        { shape: 'box', size: [18, 18, 8], anchor: 'chest', pos: [0, 70, -8], color: 0xc23030 }, // red gem
        { shape: 'box', size: [180, 8, 4], anchor: 'chest', pos: [0, 60, -6], color: GOLD }, // lapel trim
        { shape: 'box', size: [140, 320, 15], anchor: 'back', pos: [0, -60, 10], color: 0x181818 }, // coattails
      ],
      personality: { bobMul: 0.55, swayMul: 0.4, cadenceMul: 0.75, ampMul: 0.9 }, bubbles: ['🍷', '🔥', '⚔️', '🌙'] },
    // Klee — child, red coat, newsboy cap
    { id: 'genshin-impact/spark-scout', label: 'Spark scout (child, red coat, newsboy cap)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 102, limbR: 0.65, skin: 0xf3d9c0, body: 0xc23030, legColor: 0xf5f2ea, shoe: 0x6e4020, eyes: 'dots', armL: 0.7, legL: 0.65, footMul: [0.9, 0.85, 0.9] },
      accessories: [
        { shape: 'sphere', size: [65, 40, 65], anchor: 'crown', pos: [0, 20, 0], rot: [0.4, 0, 0], color: 0xa82828 }, // newsboy cap
        { shape: 'box', size: [16, 16, 6], anchor: 'crown', pos: [40, 20, -20], color: 0x2f8f4e }, // clover badge
        { shape: 'box', size: [8, 30, 4], anchor: 'crown', pos: [48, 35, -15], color: 0xf5f2ea }, // feather
        { shape: 'box', size: [55, 70, 55], anchor: 'head', pos: [-70, -10, 0], color: 0xf0d878 }, // pigtail L
        { shape: 'box', size: [55, 70, 55], anchor: 'head', pos: [70, -10, 0], color: 0xf0d878 }, // pigtail R
        { shape: 'box', size: [34, 44, 6], anchor: 'chest', pos: [0, 20, -6], color: 0x8a1f1f }, // keyhole trim
        { shape: 'box', size: [90, 110, 50], anchor: 'back', pos: [0, 0, 15], color: 0x6b4a2e }, // backpack
        { shape: 'sphere', size: 24, anchor: 'back', pos: [50, -40, 15], color: 0xd9b98a }, // pom charm
        { shape: 'cylinder', size: [45, 45, 34], anchor: 'neck', pos: [0, -8, 0], color: 0xf5f2ea }, // scarf
      ],
      personality: { bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.25, ampMul: 0.75 }, bubbles: ['💣', '🌸', '😆', '✨'] },
    // Venti — green cape, feathered beret
    { id: 'genshin-impact/wind-bard', label: 'Wind bard (green cape, feathered beret)', rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 118, limbR: 0.85, skin: 0xecc4a0, body: 0xf5f2ea, legColor: 0x2f8f4e, shoe: 0xf5f2ea, armL: 0.9, legL: 1.0 },
      accessories: [
        { shape: 'cylinder', size: [75, 75, 40], anchor: 'crown', pos: [0, 20, 0], rot: [0.3, 0, 0], color: 0x2f8f4e }, // beret
        { shape: 'sphere', size: 12, anchor: 'crown', pos: [55, 25, -20], color: 0xf5f2ea }, // flower
        { shape: 'cylinder', size: [12, 12, 90], anchor: 'head', pos: [-60, -20, 10], rot: [0, 0, -0.2], color: 0x161a2e }, // braid L
        { shape: 'cylinder', size: [12, 12, 90], anchor: 'head', pos: [60, -20, 10], rot: [0, 0, 0.2], color: 0x161a2e }, // braid R
        { shape: 'sphere', size: 12, anchor: 'head', pos: [-65, -70, 10], color: 0x66d9c9 }, // approx: aqua ombré tip (2-piece, no gradient)
        { shape: 'sphere', size: 12, anchor: 'head', pos: [65, -70, 10], color: 0x66d9c9 }, // approx: aqua ombré tip
        { shape: 'box', size: [140, 280, 15], anchor: 'back', pos: [0, -20, 12], color: 0x2f8f4e }, // cape
        { shape: 'box', size: [40, 50, 10], anchor: 'back', pos: [0, 90, 14], color: 0x1e4fa0 }, // bow accent
        { shape: 'box', size: [170, 10, 4], anchor: 'chest', pos: [0, 20, -6], color: GOLD }, // embroidery trim
      ],
      personality: { bobMul: 0.85, swayMul: 1.0, cadenceMul: 0.95, ampMul: 0.85 }, bubbles: ['🎵', '🍃', '🍷', '🎶'] },
    // Zhongli — dark coat, amber waistcoat, gold-silver trim
    { id: 'genshin-impact/amber-contractor', label: 'Amber contractor (dark coat, dragon-scale trim)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 130, limbR: 1.0, skin: 0xe4bd96, body: 0x8a5a2a, legColor: 0x1c1a18, shoe: 0x141210, hands: 'box', armL: 1.0, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [118, 75, 112], anchor: 'crown', pos: [0, -10, 0], color: 0x3b2a1e }, // hair
        { shape: 'cylinder', size: [18, 18, 90], anchor: 'head', pos: [55, -30, 0], rot: [0, 0, 0.2], color: 0x3b2a1e }, // side fringe
        { shape: 'sphere', size: 18, anchor: 'head', pos: [60, -80, 0], color: 0xd9902a, emissive: 0xd9902a, emissiveIntensity: 0.15 }, // approx: amber ombré tip
        { shape: 'box', size: [26, 130, 8], anchor: 'chest', pos: [0, 20, -6], color: 0xf5f2ea }, // white tie
        { shape: 'box', size: [18, 18, 8], anchor: 'chest', pos: [0, 70, -8], color: 0xd9902a }, // amber gem
        { shape: 'box', size: [150, 360, 18], anchor: 'back', pos: [0, -60, 10], color: 0x3b2a1e }, // tailcoat
        { shape: 'box', size: [12, 300, 4], anchor: 'back', pos: [0, -60, 20], color: GOLD }, // center trim
      ],
      personality: { bobMul: 0.4, swayMul: 0.25, cadenceMul: 0.65, ampMul: 0.75 }, bubbles: ['⚱️', '📜', '🍵', '💰'] },
    // Raiden Shogun — violet kimono, braided hair, pauldron
    { id: 'genshin-impact/thunder-regent', label: 'Thunder regent (violet kimono, braided hair)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 122, limbR: 0.95, skin: 0xecc4a0, body: 0x3a1f52, legColor: 0x2a1640, shoe: 0x1c1030, emI: 0.05, armL: 0.95, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [118, 78, 112], anchor: 'crown', pos: [0, -10, 0], color: 0x6a4d9c }, // hair
        { shape: 'cylinder', size: [28, 28, 260], anchor: 'back', pos: [0, 20, 10], rot: [0.3, 0, 0], color: 0x6a4d9c }, // braid
        { shape: 'box', size: [50, 60, 14], anchor: 'head', pos: [55, 30, -10], rot: [0, 0, 0.3], color: GOLD }, // kanzashi
        { shape: 'cone', size: [90, 160], anchor: 'hip', pos: [0, -20, 0], color: 0xb89bd9 }, // kimono skirt
        { shape: 'box', size: [70, 50, 20], anchor: 'hip', pos: [0, 20, 20], color: 0xa02030 }, // obi bow
        { shape: 'box', size: [70, 55, 50], anchor: 'shoulderL', pos: [0, 10, 0], color: 0x161616 }, // pauldron
        { shape: 'box', size: [20, 20, 6], anchor: 'shoulderL', pos: [0, 20, -6], color: 0x6a4d9c, emissive: 0x6a4d9c, emissiveIntensity: 0.2 }, // electro symbol
        { shape: 'box', size: [40, 20, 8], anchor: 'chest', pos: [0, 90, -6], color: 0xa02030 }, // neck ribbon
      ],
      personality: { bobMul: 0.35, swayMul: 0.2, cadenceMul: 0.6, ampMul: 0.7 }, bubbles: ['⚡', '🗡️', '♾️', '🍡'] },
    // Ganyu — blue hair, black-red horns, bell
    { id: 'genshin-impact/frost-envoy', label: 'Frost envoy (blue hair, black-red horns)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 116, limbR: 0.85, skin: 0xecc8a8, body: 0x151515, legColor: 0x151515, shoe: 0x8a8a8a, armL: 0.9, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [112, 76, 108], anchor: 'crown', pos: [0, -10, 0], color: 0x4a90c4 }, // hair
        { shape: 'box', size: [40, 60, 40], anchor: 'crown', pos: [0, -40, 20], rot: [0.5, 0, 0], color: 0x2a5a80 }, // approx: darker ombré tips
        { shape: 'cone', size: [22, 90], anchor: 'crown', pos: [-40, 20, 10], rot: [0.6, 0, -0.2], color: 0x2a1010 }, // horn L
        { shape: 'cone', size: [22, 90], anchor: 'crown', pos: [40, 20, 10], rot: [0.6, 0, 0.2], color: 0x2a1010 }, // horn R
        { shape: 'sphere', size: 10, anchor: 'crown', pos: [-40, 90, 20], color: 0xb02020 }, // horn tip marking
        { shape: 'sphere', size: 10, anchor: 'crown', pos: [40, 90, 20], color: 0xb02020 }, // horn tip marking
        { shape: 'box', size: [180, 180, 15], anchor: 'chest', pos: [0, -10, -6], color: 0xf5f2ea }, // bodice panel
        { shape: 'cone', size: [20, 30], anchor: 'chest', pos: [0, 50, -8], color: 0x2f6fa0 }, // blue triangle trim
        { shape: 'sphere', size: 12, anchor: 'neck', pos: [0, -10, -10], color: GOLD }, // bell
        { shape: 'box', size: [90, 120, 12], anchor: 'back', pos: [0, -40, 10], color: 0xf5f2ea }, // tailcoat tail
      ],
      personality: { bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.8, ampMul: 0.65 }, bubbles: ['❄️', '🏹', '📋', '🔔'] },
  ],
};

export default pack;

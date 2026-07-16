// Video Games ▸ League of Legends — franchise pack (dynamic-import only,
// default loaded:false). Eight broadly-recognized champions spanning gunner,
// brawler, archer, scout, swordsman, mage, knight, explorer archetypes.
// Colour + silhouette only, no likenesses. Source:
// docs/avatars/video-games/league-of-legends.md.
import type { AvatarPackDef } from '../avatars.js';

const HEXTECH = 0x4fd8ff, GOLD = 0xc9a24a, DEMACIA = 0x1c3a6b;

const pack: AvatarPackDef = {
  id: 'league-of-legends', version: 1, label: 'League of Legends',
  path: ['Video Games', 'League of Legends'], builtin: true, franchise: true,
  base: { rig: 'humanoid', humanoid: { headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'sphere', eyes: 'dots', steel: false, emI: 0, armL: 1.0, legL: 1.0, footMul: [1, 1, 1] } },
  avatars: [
    // Jinx — blue braids, magenta, oversized minigun
    { id: 'league-of-legends/sharpshooter-blue-braids', label: 'Sharpshooter (blue braids, magenta crop top, oversized gun)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, limbR: 0.85, skin: 0xf2d9c4, body: 0xe0399e, legColor: 0xe0399e, shoe: 0x2a2a2a, emI: 0.05, armL: 0.95, legL: 1.0, footMul: [0.9, 1.0, 0.9] },
      accessories: [
        { shape: 'cylinder', size: [15, 30, 320], anchor: 'crown', pos: [0, 10, 30], rot: [1.3, 0, 0], color: 0x4dd8e0 }, // long braid
        { shape: 'cylinder', size: [12, 12, 140], anchor: 'head', pos: [-70, -20, 0], rot: [0, 0, -0.2], color: 0x4dd8e0 }, // side wisp
        { shape: 'cylinder', size: [12, 12, 140], anchor: 'head', pos: [70, -20, 0], rot: [0, 0, 0.2], color: 0x4dd8e0 }, // side wisp
        { shape: 'box', size: [140, 30, 8], anchor: 'chest', pos: [0, 20, -6], rot: [0, 0, 0.5], color: 0x1a1a1a }, // strap
        { shape: 'box', size: [180, 60, 15], anchor: 'hip', pos: [0, 10, 0], color: GOLD }, // bullet-belt
        { shape: 'cylinder', size: [45, 45, 280], anchor: 'handR', pos: [0, 0, -70], rot: [1.2, 0, 0], color: 0x3a3a3a }, // minigun
        { shape: 'cylinder', size: [30, 30, 20], anchor: 'handR', pos: [0, 0, -200], rot: [1.2, 0, 0], color: HEXTECH, emissive: HEXTECH, emissiveIntensity: 0.5 }, // muzzle
      ],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.25, ampMul: 1.1 }, bubbles: ['💥', '🔫', '🎉', '😜'] },
    // Vi — shaved pink hair, oversized gauntlets
    { id: 'league-of-legends/enforcer-shaved-pink-hair', label: 'Enforcer (shaved pink hair, oversized gauntlets)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, limbR: 1.1, skin: 0xf0c8a8, body: 0xf0f0ea, legColor: 0x2f2f38, shoe: 0x2f2f38, eyes: 'almond', emI: 0.1, hands: 'box', armL: 1.0, legL: 1.0, footMul: [1.05, 1.0, 1.05] },
      accessories: [
        { shape: 'cone', size: [65, 90], anchor: 'crown', pos: [-40, 20, 0], rot: [0.4, 0, -0.3], color: 0xd9668f }, // spiked half-hair
        { shape: 'box', size: [170, 60, 40], anchor: 'chest', pos: [0, 90, -6], color: 0x2f6fb0 }, // hoodie collar
        { shape: 'box', size: [140, 140, 160], anchor: 'handL', pos: [0, -10, -20], color: 0x5a6b7a }, // gauntlet L
        { shape: 'box', size: [140, 140, 160], anchor: 'handR', pos: [0, -10, -20], color: 0x5a6b7a }, // gauntlet R
        { shape: 'box', size: [130, 25, 20], anchor: 'handL', pos: [0, -40, -40], color: HEXTECH, emissive: HEXTECH, emissiveIntensity: 0.5 }, // knuckle band L
        { shape: 'box', size: [130, 25, 20], anchor: 'handR', pos: [0, -40, -40], color: HEXTECH, emissive: HEXTECH, emissiveIntensity: 0.5 }, // knuckle band R
        { shape: 'box', size: [120, 160, 6], anchor: 'back', pos: [0, 20, 8], color: 0xc27a9a }, // tattoo panel
      ],
      personality: { bobMul: 1.1, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.2 }, bubbles: ['👊', '💥', '🚨', '🍩'] },
    // Ashe — white hair, dark blue-gold robes, ice bow
    { id: 'league-of-legends/frost-archer-white-hair', label: 'Frost Archer (white hair, dark blue-gold robes, ice bow)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, limbR: 0.95, skin: 0xf2ddc9, body: 0x1c2740, legColor: 0x1c2740, shoe: 0x14192a, eyes: 'almond', emI: 0.08, armL: 1.0, legL: 1.05, footMul: [0.95, 1.0, 0.95] },
      accessories: [
        { shape: 'box', size: [90, 360, 20], anchor: 'crown', pos: [0, -40, 25], rot: [0.5, 0, 0], color: 0xf0f0f5 }, // long straight hair
        { shape: 'box', size: [140, 100, 8], anchor: 'chest', pos: [0, 60, -6], color: GOLD }, // gold robe trim
        { shape: 'box', size: [180, 90, 10], anchor: 'hip', pos: [0, 0, 0], color: GOLD }, // sash
        { shape: 'cylinder', size: [30, 30, 180], anchor: 'back', pos: [40, 10, 15], rot: [0.3, 0, 0.3], color: 0x3a2f28 }, // quiver
        { shape: 'box', size: [20, 260, 15], anchor: 'handL', pos: [0, 0, -20], color: 0x8fd8f5, emissive: 0x8fd8f5, emissiveIntensity: 0.15 }, // ice bow
      ],
      personality: { bobMul: 0.85, swayMul: 0.8, cadenceMul: 0.9, ampMul: 0.95 }, bubbles: ['🏹', '❄️', '👑', '🦅'] },
    // Teemo — small yordle, green hat, backpack
    { id: 'league-of-legends/scout-yordle-hat', label: 'Scout Yordle (beige fur, green hat, backpack)', rig: 'humanoid',
      humanoid: { sk: 0.5, headR: 132, limbR: 0.9, skin: 0xd9c39a, body: 0xd9c39a, legColor: 0xc4ac82, shoe: 0xc9b98a, emI: 0.05, armL: 0.9, legL: 0.85, footMul: [1.0, 0.9, 1.0] },
      accessories: [
        { shape: 'cone', size: [75, 110], anchor: 'crown', pos: [0, 20, 0], rot: [0.4, 0, 0], color: 0x3a7d3a }, // scout hat
        { shape: 'sphere', size: 16, anchor: 'head', pos: [-25, 90, -30], color: 0xd94f4f }, // goggle lens L
        { shape: 'sphere', size: 16, anchor: 'head', pos: [25, 90, -30], color: 0xd94f4f }, // goggle lens R
        { shape: 'cylinder', size: [45, 45, 40], anchor: 'neck', pos: [0, -10, 0], color: 0xc0392b }, // scarf
        { shape: 'box', size: [140, 160, 90], anchor: 'back', pos: [0, 0, 20], color: 0x6b4a2f }, // backpack
        { shape: 'box', size: [30, 20, 5], anchor: 'face', pos: [-40, 25, -6], color: 0x7a5c34 }, // eye marking L
        { shape: 'box', size: [30, 20, 5], anchor: 'face', pos: [40, 25, -6], color: 0x7a5c34 }, // eye marking R
      ],
      personality: { bobMul: 1.3, swayMul: 0.7, cadenceMul: 1.2, ampMul: 0.85 }, bubbles: ['🍄', '🔭', '🎒', '😄'] },
    // Yasuo — torn blue-grey armor, topknot, katana
    { id: 'league-of-legends/wind-samurai-topknot', label: 'Wind Samurai (torn blue-grey armor, topknot, katana)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, limbR: 0.95, skin: 0xe8c39e, body: 0x5c7a94, legColor: 0x3a3f45, shoe: 0x2a2a2a, eyes: 'almond', armL: 1.0, legL: 1.0, footMul: [0.95, 1.0, 1.0] },
      accessories: [
        { shape: 'box', size: [70, 50, 70], anchor: 'crown', pos: [0, 20, 0], color: 0x1a1a1a }, // topknot base
        { shape: 'cylinder', size: [17, 17, 140], anchor: 'head', pos: [0, 60, 20], rot: [0.6, 0, 0], color: 0x1a1a1a }, // topknot tail
        { shape: 'cylinder', size: [22, 22, 15], anchor: 'head', pos: [0, 55, 0], rot: [1.57, 0, 0], color: GOLD }, // cord
        { shape: 'box', size: [110, 80, 90], anchor: 'shoulderR', pos: [0, 10, 0], color: 0x8a8a8a }, // pauldron
        { shape: 'box', size: [180, 40, 10], anchor: 'hip', pos: [0, 0, 0], color: GOLD }, // sash
        { shape: 'box', size: [30, 420, 20], anchor: 'back', pos: [30, 0, 15], rot: [0, 0, 0.3], color: 0x3a2f28 }, // sheathed sword
        { shape: 'box', size: [40, 60, 20], anchor: 'back', pos: [-60, -180, 15], rot: [0, 0, 0.3], color: GOLD }, // hilt cap
      ],
      personality: { bobMul: 0.9, swayMul: 0.6, cadenceMul: 1.05, ampMul: 1.0 }, bubbles: ['⚔️', '🌪️', '🍃', '🥋'] },
    // Lux — blonde, silver-white armor, wand
    { id: 'league-of-legends/radiant-mage-blonde', label: 'Radiant Mage (blonde hair, silver-white armor, wand)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, limbR: 0.9, skin: 0xf2ddc9, body: 0xe8e8ec, legColor: DEMACIA, shoe: 0xf0f0f0, eyes: 'almond', emI: 0.1, steel: true, armL: 1.0, legL: 1.05, footMul: [0.95, 1.05, 0.95] },
      accessories: [
        { shape: 'box', size: [140, 20, 20], anchor: 'crown', pos: [0, -10, -10], color: DEMACIA }, // headband
        { shape: 'box', size: [50, 220, 30], anchor: 'head', pos: [-70, -40, 10], color: 0xf2d675 }, // hair L
        { shape: 'box', size: [50, 220, 30], anchor: 'head', pos: [70, -40, 10], color: 0xf2d675 }, // hair R
        { shape: 'box', size: [180, 110, 30], anchor: 'hip', pos: [0, -10, 0], color: 0xe8e8ec }, // armored skirt
        { shape: 'box', size: [50, 50, 8], anchor: 'chest', pos: [0, 20, -8], color: 0xffe27a, emissive: 0xffe27a, emissiveIntensity: 0.2 }, // light emblem
        { shape: 'cylinder', size: [15, 15, 220], anchor: 'handR', pos: [0, -20, -10], color: 0xf2d675 }, // wand
        { shape: 'sphere', size: 18, anchor: 'handR', pos: [0, 90, -10], color: 0xffe27a, emissive: 0xffe27a, emissiveIntensity: 0.4 }, // wand tip
      ],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.0 }, bubbles: ['✨', '💡', '🎀', '📖'] },
    // Garen — silver-gold plate, blue scarf, broadsword
    { id: 'league-of-legends/demacian-knight-broadsword', label: 'Demacian Knight (silver-gold armor, blue scarf, broadsword)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 128, limbR: 1.25, skin: 0xe0b090, body: 0xc0c0c8, legColor: 0x9a9aa0, shoe: 0x6b4a2f, eyes: 'dots', emI: 0.08, hands: 'box', steel: true, armL: 1.05, legL: 1.0, footMul: [1.15, 1.0, 1.15] },
      accessories: [
        { shape: 'box', size: [120, 50, 120], anchor: 'head', pos: [0, 20, 0], color: 0x5c3a1e }, // short hair
        { shape: 'box', size: [150, 130, 10], anchor: 'chest', pos: [0, 10, -6], color: GOLD }, // gold trim
        { shape: 'box', size: [100, 160, 20], anchor: 'neck', pos: [0, -20, 10], color: DEMACIA }, // scarf
        { shape: 'box', size: [110, 90, 100], anchor: 'shoulderL', pos: [0, 10, 0], color: 0xc0c0c8 }, // pauldron L
        { shape: 'box', size: [110, 90, 100], anchor: 'shoulderR', pos: [0, 10, 0], color: 0xc0c0c8 }, // pauldron R
        { shape: 'box', size: [50, 480, 25], anchor: 'back', pos: [0, 0, 15], rot: [0, 0, 0.2], color: 0x9a9aa0 }, // broadsword
        { shape: 'box', size: [90, 40, 25], anchor: 'back', pos: [0, -200, 15], rot: [0, 0, 0.2], color: GOLD }, // cross-guard
      ],
      personality: { bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.85, ampMul: 1.15 }, bubbles: ['⚔️', '🛡️', '🦁', '🎖️'] },
    // Ezreal — blonde, brown jacket, single gold gauntlet
    { id: 'league-of-legends/arcane-explorer-gauntlet', label: 'Arcane Explorer (blonde hair, brown jacket, gold gauntlet)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, limbR: 0.9, skin: 0xf2ddc9, body: 0x6b4a2f, legColor: 0x3a3f45, shoe: 0x4a3320, eyes: 'almond', emI: 0.05, armL: 1.0, legL: 1.0, footMul: [0.95, 1.0, 0.95] },
      accessories: [
        { shape: 'box', size: [130, 70, 130], anchor: 'crown', pos: [0, 10, 0], rot: [0.4, 0, 0], color: 0xf2d675 }, // tousled hair
        { shape: 'cylinder', size: [55, 55, 40], anchor: 'neck', pos: [0, -10, 0], color: 0x3a5a8a }, // fur collar
        { shape: 'box', size: [90, 110, 8], anchor: 'chest', pos: [0, 40, -6], color: 0xf0ece0 }, // white shirt V
        { shape: 'box', size: [30, 30, 6], anchor: 'chest', pos: [0, 40, -10], color: 0x4a3320 }, // brown diamond
        { shape: 'box', size: [120, 130, 140], anchor: 'handL', pos: [0, -10, -20], color: GOLD }, // gauntlet
        { shape: 'box', size: [60, 20, 20], anchor: 'handL', pos: [0, -40, -50], color: HEXTECH, emissive: HEXTECH, emissiveIntensity: 0.5 }, // knuckle slot
      ],
      personality: { bobMul: 1.0, swayMul: 0.95, cadenceMul: 1.1, ampMul: 1.0 }, bubbles: ['💎', '✨', '🗺️', '😏'] },
  ],
};

export default pack;

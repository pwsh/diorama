// Video Games ▸ Street Fighter — franchise pack (dynamic-import only, default
// loaded:false). The World Warriors roster + the arc villain. Fighters
// differentiate by gi/costume colours + headbands + builds via limbR/sk.
// Colour + silhouette only, no likenesses/letters. Source:
// docs/avatars/video-games/street-fighter.md.
import type { AvatarPackDef } from '../avatars.js';

const FIRE_RED = 0xc41e2a, KARATE_BLACK = 0x1a1410, GOLD = 0xd9b34a, SILVER = 0xc0c0c8, DARK_HAIR = 0x2a2018;

const pack: AvatarPackDef = {
  id: 'street-fighter', version: 1, label: 'Street Fighter',
  path: ['Video Games', 'Street Fighter'], builtin: true, franchise: true,
  base: { rig: 'humanoid', humanoid: { headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'sphere', eyes: 'dots', steel: false, emI: 0, armL: 1.0, legL: 1.0, footMul: [1, 1, 1] } },
  avatars: [
    // Ryu — white gi, red headband
    { id: 'street-fighter/shoto-white', label: 'Karate Fighter (white gi, red headband)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 126, limbR: 1.05, skin: 0xe8b48c, body: 0xf5f2ea, legColor: 0xf5f2ea, shoe: 0xe8b48c, armL: 1.0, legL: 0.95, footMul: [1.0, 0.9, 1.0] },
      accessories: [
        { shape: 'box', size: [130, 30, 8], anchor: 'head', pos: [0, 25, 0], color: FIRE_RED }, // headband (low, no tilt)
        { shape: 'box', size: [15, 120, 5], anchor: 'back', pos: [-20, 40, 10], color: FIRE_RED }, // headband tail
        { shape: 'box', size: [15, 120, 5], anchor: 'back', pos: [20, 40, 10], color: FIRE_RED }, // headband tail
        { shape: 'box', size: [90, 40, 90], anchor: 'head', pos: [0, 40, 0], color: KARATE_BLACK }, // black hair
        { shape: 'box', size: [200, 40, 10], anchor: 'hip', pos: [0, 0, 0], color: KARATE_BLACK }, // belt
        { shape: 'cylinder', size: [50, 50, 30], anchor: 'handL', pos: [0, 0, 0], color: FIRE_RED }, // fist wrap
        { shape: 'cylinder', size: [50, 50, 30], anchor: 'handR', pos: [0, 0, 0], color: FIRE_RED }, // fist wrap
      ],
      personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.0, ampMul: 1.0 }, bubbles: ['🥋', '👊', '🔥', '💥'] },
    // Ken — red gi, blonde hair, no headband
    { id: 'street-fighter/shoto-red', label: 'Rival Karate Fighter (red gi, blonde hair)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 124, limbR: 1.0, skin: 0xe8b48c, body: FIRE_RED, legColor: FIRE_RED, shoe: 0xe8b48c, armL: 1.05, legL: 1.0, footMul: [1.0, 0.9, 1.0] },
      accessories: [
        { shape: 'box', size: [100, 60, 100], anchor: 'head', pos: [0, 40, 0], color: 0xf0c840 }, // voluminous blonde hair
        { shape: 'box', size: [200, 40, 10], anchor: 'hip', pos: [0, 0, 0], color: KARATE_BLACK }, // belt
        { shape: 'cylinder', size: [50, 50, 30], anchor: 'handL', pos: [0, 0, 0], color: FIRE_RED }, // fist wrap
        { shape: 'cylinder', size: [50, 50, 30], anchor: 'handR', pos: [0, 0, 0], color: FIRE_RED }, // fist wrap
      ],
      personality: { bobMul: 1.05, swayMul: 1.0, cadenceMul: 1.1, ampMul: 1.05 }, bubbles: ['🥋', '😤', '🔥', '💪'] },
    // Chun-Li — blue qipao, ox-horn buns
    { id: 'street-fighter/kicker-blue', label: 'Martial Artist (blue qipao, hair buns)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, limbR: 0.85, skin: 0xf0c9a0, body: 0x1e56cc, legColor: 0xa0703c, shoe: 0xf5f2ea, eyes: 'almond', armL: 0.9, legL: 1.1 },
      accessories: [
        { shape: 'sphere', size: 70, anchor: 'head', pos: [-70, 50, 0], color: 0x2a1f1a }, // bun L
        { shape: 'sphere', size: 70, anchor: 'head', pos: [70, 50, 0], color: 0x2a1f1a }, // bun R
        { shape: 'cylinder', size: [40, 40, 10], anchor: 'head', pos: [-70, 70, 0], color: 0xf5f2ea }, // bun cover L
        { shape: 'cylinder', size: [40, 40, 10], anchor: 'head', pos: [70, 70, 0], color: 0xf5f2ea }, // bun cover R
        { shape: 'box', size: [140, 20, 8], anchor: 'chest', pos: [0, 80, -6], color: GOLD }, // collar trim
        { shape: 'box', size: [20, 80, 8], anchor: 'hip', pos: [-60, -20, -6], rot: [0, 0, 0.2], color: GOLD }, // slit trim L
        { shape: 'box', size: [20, 80, 8], anchor: 'hip', pos: [60, -20, -6], rot: [0, 0, -0.2], color: GOLD }, // slit trim R
        { shape: 'cylinder', size: [30, 30, 20], anchor: 'handL', pos: [0, 0, 0], color: 0x2a2a2a }, // bracelet
        { shape: 'cylinder', size: [30, 30, 20], anchor: 'handR', pos: [0, 0, 0], color: 0x2a2a2a }, // bracelet
      ],
      personality: { bobMul: 0.9, swayMul: 1.1, cadenceMul: 1.2, ampMul: 1.1 }, bubbles: ['🦵', '💥', '⚡', '😤'] },
    // Guile — green tank, rectangular flat-top, dog tags
    { id: 'street-fighter/soldier-flattop', label: 'Soldier (flat-top, dog tags, camo)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, limbR: 1.15, skin: 0xe8b48c, body: 0x3a7d3a, legColor: 0x5a6b45, shoe: 0x2a2a2a, armL: 1.05, legL: 1.0, footMul: [1.1, 1.0, 1.05] },
      accessories: [
        { shape: 'box', size: [140, 90, 150], anchor: 'crown', pos: [0, 20, 0], color: 0xe8c840 }, // flat-top
        { shape: 'cylinder', size: [4, 4, 80], anchor: 'chest', pos: [0, 60, -10], color: SILVER }, // dog tag chain
        { shape: 'box', size: [18, 26, 4], anchor: 'chest', pos: [0, 20, -12], color: SILVER }, // dog tag
        { shape: 'cylinder', size: [45, 45, 20], anchor: 'handL', pos: [0, 0, 0], color: 0x2a2a2a }, // glove cuff
        { shape: 'cylinder', size: [45, 45, 20], anchor: 'handR', pos: [0, 0, 0], color: 0x2a2a2a }, // glove cuff
      ],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.95, ampMul: 1.0 }, bubbles: ['🎖️', '💥', '😤', '🪖'] },
    // Blanka — green skin, orange mane, feral
    { id: 'street-fighter/beast-green', label: 'Jungle Beast (green skin, orange mane)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 118, limbR: 1.15, skin: 0x5cb82e, body: 0x5cb82e, legColor: 0x5cb82e, shoe: 0x5cb82e, hands: 'box', armL: 1.05, legL: 0.95, footMul: [1.2, 0.9, 1.2] },
      accessories: [
        { shape: 'box', size: [40, 140, 30], anchor: 'head', pos: [0, 50, 20], rot: [0.3, 0, 0], color: 0xe8720a }, // mane
        { shape: 'box', size: [40, 130, 30], anchor: 'head', pos: [-50, 40, 20], rot: [0.3, 0, -0.2], color: 0xe8720a }, // mane
        { shape: 'box', size: [40, 130, 30], anchor: 'head', pos: [50, 40, 20], rot: [0.3, 0, 0.2], color: 0xe8720a }, // mane
        { shape: 'box', size: [120, 160, 30], anchor: 'back', pos: [0, 30, 10], color: 0xe8720a }, // back mane
        { shape: 'box', size: [200, 80, 120], anchor: 'hip', pos: [0, 0, 0], color: 0x8a6a4a }, // torn shorts
        { shape: 'cone', size: [10, 24], anchor: 'face', pos: [-20, -40, -20], color: 0xf5f2ea }, // fang
        { shape: 'cone', size: [10, 24], anchor: 'face', pos: [20, -40, -20], color: 0xf5f2ea }, // fang
      ],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.15, ampMul: 1.1 }, bubbles: ['⚡', '🐒', '😝', '💥'] },
    // Zangief — red trunks, mohawk, beard, biggest build
    { id: 'street-fighter/wrestler-red', label: 'Wrestler (red trunks, mohawk)', rig: 'humanoid',
      humanoid: { sk: 1.4, headR: 140, limbR: 1.4, skin: 0xd9a06a, body: 0xd9a06a, legColor: 0xd9a06a, shoe: FIRE_RED, hands: 'box', armL: 1.3, legL: 0.9, footMul: [1.3, 1.0, 1.3] },
      accessories: [
        { shape: 'box', size: [220, 90, 150], anchor: 'hip', pos: [0, 0, 0], color: FIRE_RED }, // trunks
        { shape: 'box', size: [220, 20, 152], anchor: 'hip', pos: [0, 40, 0], color: GOLD }, // belt trim
        { shape: 'box', size: [30, 80, 180], anchor: 'crown', pos: [0, 20, 0], color: DARK_HAIR }, // mohawk
        { shape: 'box', size: [140, 60, 30], anchor: 'face', pos: [0, -40, -10], color: DARK_HAIR }, // beard
        { shape: 'sphere', size: [90, 70, 8], anchor: 'chest', pos: [0, 10, -6], color: 0x3a2a1e }, // chest hair
        { shape: 'cylinder', size: [45, 45, 25], anchor: 'handL', pos: [0, 0, 0], color: GOLD }, // wristband
        { shape: 'cylinder', size: [45, 45, 25], anchor: 'handR', pos: [0, 0, 0], color: GOLD }, // wristband
      ],
      personality: { bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.6, ampMul: 1.2 }, bubbles: ['💪', '🔥', '😤', '🤼'] },
    // Dhalsim — saffron wraps, elongated limbs, skull necklace
    { id: 'street-fighter/yogi-stretch', label: 'Yogi (yellow wraps, elongated limbs)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, limbR: 0.7, skin: 0x9c7048, body: 0x9c7048, legColor: 0xe0b93a, shoe: 0x9c7048, armL: 1.45, legL: 1.15, footMul: [0.9, 0.8, 0.9] },
      accessories: [
        { shape: 'box', size: [80, 10, 6], anchor: 'head', pos: [0, 55, -10], color: FIRE_RED }, // scalp stripe
        { shape: 'box', size: [80, 10, 6], anchor: 'head', pos: [0, 40, -20], color: FIRE_RED }, // scalp stripe
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'head', pos: [-75, -10, 0], rot: [0, 1.57, 0], color: GOLD }, // earring
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'head', pos: [75, -10, 0], rot: [0, 1.57, 0], color: GOLD }, // earring
        { shape: 'sphere', size: 14, anchor: 'neck', pos: [-30, -10, -10], color: 0xe8e0d0 }, // skull bead
        { shape: 'sphere', size: 14, anchor: 'neck', pos: [0, -15, -12], color: 0xe8e0d0 }, // skull bead
        { shape: 'sphere', size: 14, anchor: 'neck', pos: [30, -10, -10], color: 0xe8e0d0 }, // skull bead
        { shape: 'cylinder', size: [40, 40, 18], anchor: 'handL', pos: [0, 0, 0], color: GOLD }, // bangle
        { shape: 'cylinder', size: [40, 40, 18], anchor: 'handR', pos: [0, 0, 0], color: GOLD }, // bangle
        { shape: 'box', size: [200, 15, 120], anchor: 'hip', pos: [0, 0, 0], color: 0x5a3620 }, // waist rope
      ],
      personality: { bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.6, ampMul: 0.5 }, bubbles: ['🧘', '🔥', '😌', '✨'] },
    // M. Bison — deep-red uniform, peaked cap, cape
    { id: 'street-fighter/dictator-red', label: 'Dictator (red uniform, peaked cap, cape)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 128, limbR: 1.1, skin: 0xd9a878, body: 0x8c1414, legColor: 0x8c1414, shoe: 0x1a1a1a, eyes: 'halfred', emI: 0.05, armL: 1.05, legL: 1.0, footMul: [1.05, 1.0, 1.05] },
      accessories: [
        { shape: 'sphere', size: [70, 45, 70], anchor: 'crown', pos: [0, 10, 0], rot: [0.4, 0, 0], color: 0x8c1414 }, // cap dome
        { shape: 'box', size: [140, 12, 60], anchor: 'crown', pos: [0, -10, -40], color: 0x8c1414 }, // brim
        { shape: 'box', size: [140, 14, 120], anchor: 'crown', pos: [0, -15, 0], color: GOLD }, // cap band
        { shape: 'cylinder', size: [18, 18, 6], anchor: 'crown', pos: [0, 0, -45], rot: [1.57, 0, 0], color: 0xf5f2ea }, // blank emblem
        { shape: 'cylinder', size: [60, 60, 16], anchor: 'shoulderL', pos: [0, 10, 0], rot: [0, 0, 1.57], color: SILVER }, // epaulette
        { shape: 'cylinder', size: [60, 60, 16], anchor: 'shoulderR', pos: [0, 10, 0], rot: [0, 0, 1.57], color: SILVER }, // epaulette
        { shape: 'box', size: [12, 180, 6], anchor: 'chest', pos: [0, 10, -6], color: GOLD }, // gold braid
        { shape: 'cone', size: [140, 300], anchor: 'back', pos: [0, -20, 15], rot: [Math.PI, 0, 0], color: 0x2a1414 }, // cape
        { shape: 'box', size: [100, 16, 10], anchor: 'face', pos: [0, 30, -6], color: DARK_HAIR }, // heavy brow
      ],
      personality: { bobMul: 0.5, swayMul: 0.45, cadenceMul: 0.6, ampMul: 0.9 }, bubbles: ['👑', '💢', '😈', '⚡'] },
  ],
};

export default pack;

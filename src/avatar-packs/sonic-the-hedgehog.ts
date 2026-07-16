// Video Games ▸ Sonic the Hedgehog — franchise pack (dynamic-import only,
// default loaded:false). Speedster mammals + a human + a robot doppelganger,
// all on the humanoid rig; identity carried by colour family + one signature
// silhouette lever (quill shape, ears, build, headShape). High-cadence walks.
// Colour + silhouette only, no likenesses. Source:
// docs/avatars/video-games/sonic-the-hedgehog.md.
import type { AvatarPackDef } from '../avatars.js';

const HERO_BLUE = 0x1a50bc, GOLD = 0xd9b34a;

const pack: AvatarPackDef = {
  id: 'sonic-the-hedgehog', version: 1, label: 'Sonic the Hedgehog',
  path: ['Video Games', 'Sonic the Hedgehog'], builtin: true, franchise: true,
  base: { rig: 'humanoid', humanoid: { headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'sphere', eyes: 'dots', steel: false, emI: 0, armL: 1.0, legL: 1.0, footMul: [1, 1, 1] } },
  avatars: [
    // Sonic — blue quills, red shoes
    { id: 'sonic-the-hedgehog/blue-blur', label: 'Speedster (blue quills, red shoes)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 128, limbR: 0.85, skin: 0xffd7a0, body: HERO_BLUE, legColor: HERO_BLUE, shoe: 0xe6131f, eyes: 'almond', armL: 0.95, legL: 0.85, footMul: [1.15, 0.9, 1.2] },
      accessories: [
        { shape: 'cone', size: [35, 110], anchor: 'crown', pos: [-35, 30, 0], rot: [0.35, 0, -0.2], color: HERO_BLUE }, // bang quill L
        { shape: 'cone', size: [35, 110], anchor: 'crown', pos: [35, 30, 0], rot: [0.35, 0, 0.2], color: HERO_BLUE }, // bang quill R
        { shape: 'cone', size: [28, 170], anchor: 'back', pos: [0, 60, 10], rot: [1.05, 0, 0], color: HERO_BLUE }, // main quill
        { shape: 'cone', size: [24, 140], anchor: 'back', pos: [-45, 35, 12], rot: [1.15, 0, -0.2], color: HERO_BLUE }, // quill
        { shape: 'cone', size: [24, 140], anchor: 'back', pos: [45, 35, 12], rot: [1.15, 0, 0.2], color: HERO_BLUE }, // quill
        { shape: 'sphere', size: [70, 90, 5], anchor: 'chest', pos: [0, -10, -6], color: 0xffd7a0 }, // belly patch
      ],
      personality: { bobMul: 1.3, swayMul: 0.7, cadenceMul: 1.6, ampMul: 1.2 }, bubbles: ['💨', '💍', '😎', '🌭'] },
    // Tails — amber fox, two tails, big ears
    { id: 'sonic-the-hedgehog/twin-tailed-fox', label: 'Twin-Tailed Fox (amber fur, big ears)', rig: 'humanoid',
      humanoid: { sk: 0.65, headR: 118, limbR: 0.8, skin: 0xf0ece0, body: 0xe8891f, legColor: 0xe8891f, shoe: 0xd9241f, eyes: 'dots', armL: 0.85, legL: 0.7, footMul: [1.1, 0.85, 1.05] },
      accessories: [
        { shape: 'cone', size: [40, 140], anchor: 'head', pos: [-60, 55, 5], rot: [0.25, 0, -0.25], color: 0xe8891f }, // ear L
        { shape: 'cone', size: [40, 140], anchor: 'head', pos: [60, 55, 5], rot: [0.25, 0, 0.25], color: 0xe8891f }, // ear R
        { shape: 'cone', size: [18, 60], anchor: 'head', pos: [-60, 60, -8], rot: [0.25, 0, -0.25], color: 0xf0ece0 }, // inner ear L
        { shape: 'cone', size: [18, 60], anchor: 'head', pos: [60, 60, -8], rot: [0.25, 0, 0.25], color: 0xf0ece0 }, // inner ear R
        { shape: 'cone', size: [40, 280], anchor: 'tailbone', pos: [-30, -40, 120], rot: [1.3, 0, -0.1], color: 0xe8891f }, // tail L
        { shape: 'cone', size: [40, 280], anchor: 'tailbone', pos: [30, -40, 120], rot: [1.3, 0, 0.1], color: 0xe8891f }, // tail R
        { shape: 'sphere', size: 30, anchor: 'tailbone', pos: [-40, -20, 230], color: 0xf0ece0 }, // tip L
        { shape: 'sphere', size: 30, anchor: 'tailbone', pos: [40, -20, 230], color: 0xf0ece0 }, // tip R
        { shape: 'sphere', size: [65, 80, 5], anchor: 'chest', pos: [0, -10, -6], color: 0xf0ece0 }, // belly patch
      ],
      personality: { bobMul: 1.1, swayMul: 0.8, cadenceMul: 1.2, ampMul: 0.9 }, bubbles: ['🛩️', '🔧', '🦊', '💡'] },
    // Knuckles — red echidna, spiked fists, crescent chest
    { id: 'sonic-the-hedgehog/echidna-guardian', label: 'Echidna Guardian (red, spiked fists)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 130, limbR: 1.25, skin: 0xf2c9a0, body: 0xd91f1f, legColor: 0xd91f1f, shoe: 0xd9241f, eyes: 'dots', hands: 'box', armL: 1.15, legL: 0.85, footMul: [1.2, 1.0, 1.2] },
      accessories: [
        { shape: 'cone', size: [40, 120], anchor: 'crown', pos: [0, 30, 10], rot: [0.6, 0, 0], color: 0xd91f1f }, // spine
        { shape: 'cone', size: [35, 100], anchor: 'crown', pos: [-45, 20, 10], rot: [0.6, 0, -0.2], color: 0xd91f1f }, // spine
        { shape: 'cone', size: [35, 100], anchor: 'crown', pos: [45, 20, 10], rot: [0.6, 0, 0.2], color: 0xd91f1f }, // spine
        { shape: 'cone', size: [35, 110], anchor: 'back', pos: [-30, 30, 15], rot: [1.1, 0, -0.15], color: 0xd91f1f }, // trailing spine
        { shape: 'cone', size: [35, 110], anchor: 'back', pos: [30, 30, 15], rot: [1.1, 0, 0.15], color: 0xd91f1f }, // trailing spine
        { shape: 'box', size: [140, 90, 10], anchor: 'chest', pos: [0, 0, -6], color: 0xf5f2ea }, // crescent patch
        { shape: 'cone', size: [15, 40], anchor: 'handL', pos: [0, 22, -10], color: 0xe8e0d0 }, // knuckle spike
        { shape: 'cone', size: [15, 40], anchor: 'handR', pos: [0, 22, -10], color: 0xe8e0d0 }, // knuckle spike
      ],
      personality: { bobMul: 0.85, swayMul: 0.6, cadenceMul: 0.8, ampMul: 1.2 }, bubbles: ['💎', '🥊', '😤', '💪'] },
    // Amy — pink hedgehog, red dress, hammer
    { id: 'sonic-the-hedgehog/rosy-hero', label: 'Rosy Hero (pink fur, red dress, hammer)', rig: 'humanoid',
      humanoid: { sk: 0.8, headR: 122, limbR: 0.8, skin: 0xf6cba8, body: 0xcc1f2a, legColor: 0xf199c4, shoe: 0xcc1f2a, eyes: 'almond', armL: 0.85, legL: 0.95, footMul: [1.0, 1.05, 1.0] },
      accessories: [
        { shape: 'box', size: [130, 20, 15], anchor: 'crown', pos: [0, -10, -10], color: 0xcc1f2a }, // headband
        { shape: 'cone', size: [45, 70], anchor: 'crown', pos: [0, 10, -15], rot: [0.4, 0, 0], color: 0xf199c4 }, // bang
        { shape: 'cone', size: [30, 90], anchor: 'back', pos: [0, 40, 15], rot: [1.0, 0, 0], color: 0xf199c4 }, // quill
        { shape: 'box', size: [180, 20, 8], anchor: 'chest', pos: [0, 62, -6], color: 0xf5f2ea }, // collar trim
        { shape: 'cylinder', size: [15, 15, 200], anchor: 'handR', pos: [0, -40, -10], color: GOLD }, // hammer handle
        { shape: 'sphere', size: [65, 45, 35], anchor: 'handR', pos: [0, 60, -10], color: 0xf199c4 }, // mallet head
        { shape: 'box', size: [100, 20, 20], anchor: 'handR', pos: [0, 60, -10], color: 0xcc1f2a }, // mallet band
      ],
      personality: { bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.15, ampMul: 1.0 }, bubbles: ['💕', '🔨', '😊', '🎀'] },
    // Eggman — human, red coat, huge mustache, egg body
    { id: 'sonic-the-hedgehog/egg-shaped-genius', label: 'Egg-Shaped Genius (red coat, huge mustache)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 110, limbR: 1.5, skin: 0xf0c299, body: 0xcc1a1a, legColor: 0x1a1a1a, shoe: 0x1a1a1a, eyes: 'shades', armL: 0.85, legL: 0.65, footMul: [1.3, 0.8, 1.3] },
      accessories: [
        { shape: 'sphere', size: [240, 210, 190], anchor: 'chest', pos: [0, -40, -20], color: 0xcc1a1a }, // egg belly / coat front
        { shape: 'sphere', size: 12, anchor: 'chest', pos: [0, 20, -50], color: GOLD }, // button
        { shape: 'sphere', size: 12, anchor: 'chest', pos: [0, -60, -55], color: GOLD }, // button
        { shape: 'box', size: [130, 20, 20], anchor: 'crown', pos: [0, -40, -10], color: 0xcc1a1a }, // goggle band
        { shape: 'box', size: [90, 20, 15], anchor: 'crown', pos: [0, -40, -18], color: 0xd97a1a }, // goggle lens
        { shape: 'box', size: [150, 55, 30], anchor: 'face', pos: [0, -28, -14], color: 0xd9781a }, // mustache
        { shape: 'box', size: [70, 20, 10], anchor: 'face', pos: [0, -8, -16], color: 0x1a1a1a }, // pince-nez
        { shape: 'box', size: [120, 220, 20], anchor: 'back', pos: [-60, -20, 10], color: 0xcc1a1a }, // coat tail L
        { shape: 'box', size: [120, 220, 20], anchor: 'back', pos: [60, -20, 10], color: 0xcc1a1a }, // coat tail R
      ],
      personality: { bobMul: 0.5, swayMul: 0.5, cadenceMul: 0.6, ampMul: 0.9 }, bubbles: ['🥚', '😈', '🤖', '💢'] },
    // Shadow — black hedgehog, red streaks, hover skates
    { id: 'sonic-the-hedgehog/dark-rival', label: 'Dark Rival (black fur, red streaks)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 128, limbR: 0.85, skin: 0xe0b088, body: 0x1a1a1a, legColor: 0x1a1a1a, shoe: 0xcc1f1f, eyes: 'redvisor', emI: 0.2, armL: 0.95, legL: 0.85, footMul: [1.2, 0.95, 1.25] },
      accessories: [
        { shape: 'cone', size: [35, 110], anchor: 'crown', pos: [-35, 30, 0], rot: [0.35, 0, -0.2], color: 0x1a1a1a }, // bang quill L
        { shape: 'cone', size: [35, 110], anchor: 'crown', pos: [35, 30, 0], rot: [0.35, 0, 0.2], color: 0x1a1a1a }, // bang quill R
        { shape: 'cone', size: [28, 150], anchor: 'back', pos: [0, 50, 15], rot: [1.0, 0, 0], color: 0x1a1a1a }, // main quill
        { shape: 'cone', size: [24, 130], anchor: 'back', pos: [-40, 30, 15], rot: [1.0, 0, -0.2], color: 0x1a1a1a }, // quill
        { shape: 'cone', size: [24, 130], anchor: 'back', pos: [40, 30, 15], rot: [1.0, 0, 0.2], color: 0x1a1a1a }, // quill
        { shape: 'box', size: [15, 100, 5], anchor: 'back', pos: [0, 55, 5], rot: [1.0, 0, 0], color: 0xcc1f1f }, // red streak
        { shape: 'sphere', size: [55, 65, 5], anchor: 'chest', pos: [0, 10, -6], color: 0xf5f2ea }, // chest tuft
        { shape: 'cylinder', size: [25, 25, 12], anchor: 'handL', pos: [0, -10, 0], color: GOLD }, // inhibitor ring
        { shape: 'cylinder', size: [25, 25, 12], anchor: 'handR', pos: [0, -10, 0], color: GOLD }, // inhibitor ring
      ],
      personality: { bobMul: 0.9, swayMul: 0.5, cadenceMul: 1.4, ampMul: 0.9 }, bubbles: ['💢', '🖤', '⚡', '😤'] },
    // Metal Sonic — box head, steel, red visor, chest disc
    { id: 'sonic-the-hedgehog/robotic-doppelganger', label: 'Robotic Doppelganger (blue metal, red visor)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 126, headShape: 'box', limbR: 0.9, skin: 0xc0c4c8, body: HERO_BLUE, legColor: HERO_BLUE, shoe: 0xcc1f1f, eyes: 'redvisor', emI: 0.3, hands: 'box', steel: true, armL: 0.95, legL: 0.85, footMul: [1.1, 0.9, 1.15] },
      accessories: [
        { shape: 'cone', size: [30, 150], anchor: 'crown', pos: [0, 30, 10], rot: [0.7, 0, 0], color: 0xc0c4c8 }, // fin quill
        { shape: 'cone', size: [26, 130], anchor: 'crown', pos: [-40, 20, 10], rot: [0.7, 0, -0.2], color: 0xc0c4c8 }, // fin quill
        { shape: 'cone', size: [26, 130], anchor: 'crown', pos: [40, 20, 10], rot: [0.7, 0, 0.2], color: 0xc0c4c8 }, // fin quill
        { shape: 'sphere', size: 45, anchor: 'shoulderL', pos: [0, 10, 0], color: 0xc0c4c8, metalness: 0.6 }, // armor plate
        { shape: 'sphere', size: 45, anchor: 'shoulderR', pos: [0, 10, 0], color: 0xc0c4c8, metalness: 0.6 }, // armor plate
        { shape: 'cylinder', size: [45, 45, 15], anchor: 'chest', pos: [0, 10, -8], rot: [1.57, 0, 0], color: 0xf0c020 }, // chest disc
        { shape: 'cylinder', size: [20, 20, 16], anchor: 'chest', pos: [0, 10, -12], rot: [1.57, 0, 0], color: 0x1a1a1a }, // disc center
        { shape: 'box', size: [30, 10, 30], anchor: 'handL', pos: [0, 0, 0], color: 0xf0c020 }, // hand plate
        { shape: 'box', size: [30, 10, 30], anchor: 'handR', pos: [0, 0, 0], color: 0xf0c020 }, // hand plate
      ],
      personality: { bobMul: 0.6, swayMul: 0.3, cadenceMul: 1.5, ampMul: 0.8 }, bubbles: ['🤖', '⚡', '💢', '👁️'] },
  ],
};

export default pack;

// Pop Culture ▸ Movies ▸ The Wizard of Oz — franchise pack (dynamic-import only,
// default loaded:false). Stylized geometric toon homage of the 1939 Technicolor
// silhouettes: color + silhouette only, no logos/likenesses. Costume material +
// one loud signature color carry the read; each member keeps a small 'tint'
// carrier so per-sensor coding survives. Toto is the one pet/quadruped.
// Source doc: docs/avatars/pop-culture/movies-wizard-of-oz.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'movies-wizard-of-oz', version: 3, label: 'The Wizard of Oz',
  path: ['Pop Culture', 'Movies', 'The Wizard of Oz'], builtin: true, franchise: true,
  base: { humanoid: { emI: 0, hands: 'sphere', steel: false, headShape: 'sphere' } },
  avatars: [
    // Dorothy Gale — blue gingham + white pinafore, braids, ruby slippers.
    { id: 'movies-wizard-of-oz/dorothy', label: 'Farm girl (blue gingham, ruby shoes)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 116, limbR: 0.9, skin: 0xe8b48c, body: 0x4a6fa5, shoe: 0xc81e2c, eyes: 'dots',
        armL: 0.95, legL: 0.9, legColor: 0x4a6fa5, limbColors: { armL: 0xf0ead8, armR: 0xf0ead8 } },
      accessories: [
        { shape: 'sphere', size: 72, anchor: 'crown', pos: [0, 0, 0], color: 0x6b4226 }, // hair
        { shape: 'cylinder', size: [12, 10, 90], anchor: 'head', pos: [-70, -40, 10], color: 0x6b4226 }, // braid L
        { shape: 'cylinder', size: [12, 10, 90], anchor: 'head', pos: [70, -40, 10], color: 0x6b4226 }, // braid R
        { shape: 'box', size: [18, 18, 18], anchor: 'head', pos: [-70, -90, 10], color: 'tint' }, // ribbon L (tint)
        { shape: 'box', size: [18, 18, 18], anchor: 'head', pos: [70, -90, 10], color: 'tint' }, // ribbon R (tint)
        { shape: 'box', size: [90, 70, 10], anchor: 'chest', pos: [0, 20, -10], color: 0xf0ead8 }, // pinafore bib
        { shape: 'box', size: [160, 16, 150], anchor: 'hip', pos: [0, 10, 0], color: 0xf0ead8 }, // apron waistband
      ],
      // approx: gingham CHECK not renderable — flat blue stands in per the no-texture convention.
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 0.9 },
      bubbles: ['🏠', '🌪️', '👠', '🐕'] },

    // Scarecrow — patchwork burlap, floppy pointed hat, straw at every joint.
    { id: 'movies-wizard-of-oz/scarecrow', label: 'Scarecrow (patchwork burlap, straw)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 128, limbR: 0.8, skin: 0xc9a876, body: 0x7a5c3a, shoe: 0x4a3826, eyes: 'dots',
        armL: 1.1, legL: 1.05, footMul: [1.2, 0.7, 1.15], legColor: 0x6b4a2e },
      accessories: [
        { shape: 'cone', size: [170, 80], anchor: 'crown', pos: [0, 30, 0], rot: [0.4, 0, 0], color: 0x5c4526 }, // floppy hat
        { shape: 'cone', size: [8, 40], anchor: 'crown', pos: [-40, -6, 10], rot: [0, 0, -0.4], color: 0xd9c07a }, // straw
        { shape: 'cone', size: [8, 40], anchor: 'crown', pos: [0, -10, 20], rot: [0.2, 0, 0], color: 0xd9c07a }, // straw
        { shape: 'cone', size: [8, 40], anchor: 'crown', pos: [40, -6, 10], rot: [0, 0, 0.4], color: 0xd9c07a }, // straw
        { shape: 'cylinder', size: [6, 4, 60], anchor: 'neck', pos: [0, 10, -80], rot: [1.2, 0, 0], color: 0xe0c878 }, // collar straw
        { shape: 'cone', size: [10, 40], anchor: 'handL', pos: [0, -20, 0], color: 0xe0c878 }, // cuff straw
        { shape: 'cone', size: [10, 40], anchor: 'handR', pos: [0, -20, 0], color: 0xe0c878 }, // cuff straw
        { shape: 'box', size: [70, 70, 6], anchor: 'chest', pos: [0, 10, -10], color: 'tint' }, // patchwork patch (tint)
      ],
      // approx: boneless floppy posture only partially reachable via high sway/amp multipliers.
      personality: { bobMul: 1.3, swayMul: 1.5, cadenceMul: 0.95, ampMul: 1.2 },
      bubbles: ['🌾', '🧠', '🔥', '🤔'] },

    // Tin Woodman — full tin body, tall silver funnel hat, axe.
    { id: 'movies-wizard-of-oz/tin_man', label: 'Tin woodman (silver funnel hat, axe)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 120, limbR: 1.0, skin: 0xb8c0c6, body: 0xb0b8be, shoe: 0x8f979d, eyes: 'dots',
        hands: 'box', steel: true, armL: 1.0, legL: 1.0, legColor: 0xa8b0b6 },
      accessories: [
        { shape: 'cone', size: [70, 190], anchor: 'crown', pos: [0, 80, 0], rot: [0.3, 0, 0], color: 0xc0c6ca }, // funnel hat
        { shape: 'cylinder', size: [78, 78, 16], anchor: 'neck', pos: [0, 0, 0], color: 'tint' }, // collar ring (tint)
        { shape: 'cylinder', size: [26, 26, 8], anchor: 'chest', pos: [0, 10, -12], color: 0xc0392b }, // heart medallion
        { shape: 'cylinder', size: [9, 9, 220], anchor: 'handR', pos: [0, -100, 0], color: 0x5c3c22 }, // axe handle
        { shape: 'box', size: [80, 60, 14], anchor: 'handR', pos: [0, 20, 0], color: 0xd8dce0 }, // axe blade
        { shape: 'cylinder', size: [24, 24, 40], anchor: 'hip', pos: [100, 10, 0], color: 0x8a9296 }, // oil can
        { shape: 'cone', size: [6, 30], anchor: 'hip', pos: [100, 40, -20], rot: [-0.6, 0, 0], color: 0x8a9296 }, // spout
      ],
      // approx: heart medallion = flattened disc (no heart primitive).
      personality: { bobMul: 0.7, swayMul: 0.35, cadenceMul: 0.85, ampMul: 0.65 },
      bubbles: ['❤️', '🪓', '🛢️', '😢'] },

    // Cowardly Lion — bipedal, big tawny mane, red bow, tufted tail.
    { id: 'movies-wizard-of-oz/cowardly_lion', label: 'Cowardly lion (mane, red bow)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 148, limbR: 1.25, skin: 0xc9974f, body: 0xc9974f, shoe: 0x8a6430, eyes: 'dots',
        armL: 0.95, legL: 0.9, legColor: 0xb8863f },
      accessories: [
        { shape: 'sphere', size: 180, anchor: 'crown', pos: [0, -6, 0], color: 0xa8763a }, // mane
        { shape: 'cone', size: [16, 35], anchor: 'crown', pos: [-70, 20, 0], rot: [0, 0, -0.7], color: 0x8a6430 }, // mane spike
        { shape: 'cone', size: [16, 35], anchor: 'crown', pos: [0, 70, -10], rot: [-0.4, 0, 0], color: 0x8a6430 }, // mane spike
        { shape: 'cone', size: [16, 35], anchor: 'crown', pos: [70, 20, 0], rot: [0, 0, 0.7], color: 0x8a6430 }, // mane spike
        { shape: 'box', size: [40, 30, 10], anchor: 'neck', pos: [0, 0, -80], color: 0xc0392b }, // red bow
        { shape: 'cone', size: [14, 120], anchor: 'tailbone', pos: [0, -40, -40], rot: [0.9, 0, 0], color: 0xc9974f }, // tail
        { shape: 'sphere', size: 26, anchor: 'tailbone', pos: [0, -150, -120], color: 'tint' }, // tail tuft (tint)
        { shape: 'cone', size: [14, 30], anchor: 'head', pos: [-70, 60, 0], rot: [0, 0, -0.4], color: 0x8a6430 }, // ear
        { shape: 'cone', size: [14, 30], anchor: 'head', pos: [70, 60, 0], rot: [0, 0, 0.4], color: 0x8a6430 }, // ear
      ],
      // approx: mane-spike ring trimmed from 5 to 3 to hold the ≤10-primitive budget.
      personality: { bobMul: 1.15, swayMul: 1.4, cadenceMul: 0.8, ampMul: 0.75 },
      bubbles: ['😱', '🦁', '😢', '💪'] },

    // Wicked Witch — green skin, black gown + pointed hat, broom.
    { id: 'movies-wizard-of-oz/wicked_witch', label: 'Wicked witch (black robes, broom)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 118, limbR: 0.85, skin: 0x7a9c5e, body: 0x1c1c1c, shoe: 0x141414, eyes: 'slit',
        armL: 1.0, legL: 1.0, legColor: 0x1c1c1c },
      accessories: [
        { shape: 'cone', size: [85, 200], anchor: 'crown', pos: [0, 90, 0], rot: [0.35, 0, 0], color: 0x181818 }, // pointed hat
        { shape: 'cylinder', size: [86, 86, 16], anchor: 'crown', pos: [0, -6, 0], rot: [0.35, 0, 0], color: 0x2a2a2a }, // scarf band
        { shape: 'cape', size: [150, 322, 225], anchor: 'back', pos: [0, -135, 14], rot: [0.12, 0, 0], color: 0x202020, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // caped train
        { shape: 'box', size: [100, 16, 10], anchor: 'back', pos: [0, 10, 20], color: 'tint' }, // cape lining (tint)
        { shape: 'cylinder', size: [8, 8, 300], anchor: 'handR', pos: [0, -120, 0], color: 0x4a3320 }, // broomstick
        { shape: 'cone', size: [40, 80], anchor: 'handR', pos: [0, 60, 0], color: 0x7a6030 }, // bristles
        { shape: 'sphere', size: 10, anchor: 'face', pos: [10, -40, -8], color: 0x5c7a48 }, // wart
      ],
      personality: { bobMul: 0.95, swayMul: 0.65, cadenceMul: 1.15, ampMul: 0.9 },
      bubbles: ['🧹', '😈', '🔥', '💧'] },

    // Glinda — pale-pink sparkling gown, blonde hair, gold tiara, star wand.
    { id: 'movies-wizard-of-oz/glinda', label: 'Good witch (pink gown, star wand)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 118, limbR: 0.85, skin: 0xf0d0b0, body: 0xf5c8dc, shoe: 0xf0d8e0, eyes: 'almond',
        emI: 0.08, armL: 1.0, legL: 1.0, legColor: 0xf5c8dc },
      accessories: [
        { shape: 'sphere', size: 150, anchor: 'crown', pos: [0, -6, 0], color: 0xe8c878 }, // blonde hair
        { shape: 'cylinder', size: [80, 80, 10], anchor: 'head', pos: [0, 40, 0], color: 0xd8c078 }, // tiara band
        { shape: 'sphere', size: 10, anchor: 'head', pos: [-30, 50, -20], color: 'tint' }, // tiara gem (tint)
        { shape: 'sphere', size: 10, anchor: 'head', pos: [0, 56, -24], color: 'tint' }, // tiara gem (tint)
        { shape: 'sphere', size: 10, anchor: 'head', pos: [30, 50, -20], color: 'tint' }, // tiara gem (tint)
        { shape: 'cape', size: [160, 300, 240], anchor: 'back', pos: [0, -135, 14], rot: [0.12, 0, 0], color: 0xf8d8e8, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // cape drape
        { shape: 'cylinder', size: [8, 8, 280], anchor: 'handR', pos: [0, -110, 0], color: 0xe8d8a0 }, // wand
        { shape: 'cone', size: [26, 40], anchor: 'handR', pos: [0, 50, 0], color: 0xfff2b0, emissive: 0xfff2b0, emissiveIntensity: 0.3 }, // star tip
      ],
      // approx: sequin/sparkle stipple not available — flat pink + a touch of emI.
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.9, ampMul: 0.75 },
      bubbles: ['✨', '🎀', '🌟', '💗'] },

    // Toto — small shaggy dark terrier, Dorothy's companion.
    { id: 'movies-wizard-of-oz/toto', label: 'Terrier (shaggy dark coat)', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.4, bodyLen: 300, bodyW: 130, bodyH: 130, legLen: 0.5, headR: 74,
        ears: 'pointy', tail: 'up', tailLen: 0.35, snout: 0.55, coat: 0x3a3226, belly: 0x4a4030,
        earColor: 0x2a2418, snoutColor: 0x2a2418, pawColor: 0x2a2418 },
      accessories: [
        { shape: 'box', size: [110, 24, 80], anchor: 'qneck', pos: [0, 0, 0], color: 'tint' }, // collar (tint)
      ],
      personality: { bobMul: 1.4, swayMul: 0.8, cadenceMul: 1.6, ampMul: 1.0 },
      bubbles: ['🐾', '🦴', '🐕', '❤️'] },

    // The Wizard — portly showman, tall top hat, dark tailcoat.
    { id: 'movies-wizard-of-oz/wizard', label: 'Traveling showman (top hat, tailcoat)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 130, limbR: 1.15, skin: 0xd9a878, body: 0x2b2420, shoe: 0x241e1a, eyes: 'dots',
        armL: 1.0, legL: 0.95, legColor: 0x3a332c },
      accessories: [
        { shape: 'cylinder', size: [95, 95, 150], anchor: 'crown', pos: [0, 90, 0], rot: [0.2, 0, 0], color: 0x1c1a18 }, // top hat
        { shape: 'box', size: [40, 30, 14], anchor: 'neck', pos: [0, 0, -80], color: 'tint' }, // cravat (tint)
        { shape: 'box', size: [90, 120, 10], anchor: 'chest', pos: [0, -10, -10], color: 0x8a7a5c }, // waistcoat peek
        { shape: 'cylinder', size: [4, 4, 60], anchor: 'chest', pos: [20, -30, -12], rot: [0, 0, 0.4], color: 0xc9a227 }, // watch chain
        { shape: 'box', size: [160, 200, 16], anchor: 'back', pos: [0, -90, 6], color: 0x241e1a }, // coat tails
      ],
      // approx: top-hat-and-tailcoat is a generic showman read — the ensemble context sells "the Wizard".
      personality: { bobMul: 1.1, swayMul: 1.1, cadenceMul: 0.95, ampMul: 1.0 },
      bubbles: ['🎩', '🎈', '🐍', '😅'] },
  ],
};

export default pack;

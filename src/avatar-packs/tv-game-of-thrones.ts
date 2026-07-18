// Pop Culture ▸ TV Shows ▸ Game of Thrones — franchise pack (dynamic-import
// only, default loaded:false). Stylized geometric homage: color + silhouette
// only, no likenesses/logos/sigils. Named-cast pack → FIXED house-palette
// colors, not tint carriers; ONE signature prop per member carries recognition.
// Source doc: docs/avatars/pop-culture/tv-game-of-thrones.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'tv-game-of-thrones', version: 3, label: 'Game of Thrones',
  path: ['Pop Culture', 'TV Shows', 'Game of Thrones'], builtin: true, franchise: true,
  avatars: [
    // Jon Snow — black Night's Watch furs, fur collar, Longclaw across the back.
    { id: 'tv-game-of-thrones/black-cloak-ranger', label: "Night Watchman (black furs, wolf-pommel sword)",
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0xd9a878, body: 0x1c1c1c, legColor: 0x222222,
        shoe: 0x1a1a1a, eyes: 'dots', emI: 0, limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [64, 30, 64], anchor: 'crown', pos: [0, -6, 4], color: 0x241a10 }, // curly hair cap
        { shape: 'box', size: [50, 18, 6], anchor: 'face', pos: [0, -24, -8], color: 0x2a2018 }, // stubble
        { shape: 'cape', size: [300, 300, 450], anchor: 'back', pos: [0, -120, 30], rot: [0.12, 0, 0], color: 0x141414, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // fur cloak
        { shape: 'box', size: [120, 22, 20], anchor: 'back', pos: [0, 90, 34], color: 0x4a4038 }, // grey fur collar
        { shape: 'box', size: [14, 420, 10], anchor: 'back', pos: [40, -20, 40], rot: [0, 0, 0.5], color: 0xb0b0ac }, // Longclaw
        { shape: 'sphere', size: 18, anchor: 'back', pos: [130, 130, 40], color: 0xcfd0c8 }, // wolf pommel
      ],
      personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.0 },
      bubbles: ['🐺', '⚔️', '❄️', '😔'] },

    // Daenerys Targaryen — pale silver gown, braided silver crown, dragon pendant.
    { id: 'tv-game-of-thrones/silver-braided-queen', label: 'Silver-Haired Queen (pale gown, braided crown)',
      rig: 'humanoid',
      humanoid: { sk: 0.94, headR: 116, skin: 0xe8c4a0, body: 0xe4e8ec, legColor: 0xe4e8ec,
        shoe: 0xe4e8ec, eyes: 'almond', emI: 0, limbR: 0.82, armL: 0.9 },
      accessories: [
        { shape: 'sphere', size: [130, 70, 130], anchor: 'crown', pos: [0, -8, 4], color: 0xe8e4d0 }, // braided updo
        { shape: 'box', size: [50, 10, 14], anchor: 'crown', pos: [-30, 0, 30], rot: [0.3, 0, 0], color: 0xe8e4d0 }, // braid ridge L (approx plait)
        { shape: 'box', size: [50, 10, 14], anchor: 'crown', pos: [30, 0, 30], rot: [0.3, 0, 0], color: 0xe8e4d0 }, // braid ridge R (approx plait)
        { shape: 'box', size: [36, 150, 26], anchor: 'head', pos: [-56, -60, 6], color: 0xe8e4d0 }, // long hair L
        { shape: 'box', size: [36, 150, 26], anchor: 'head', pos: [56, -60, 6], color: 0xe8e4d0 }, // long hair R
        { shape: 'sphere', size: 20, anchor: 'chest', pos: [0, 118, -8], color: 0x3a4a6a, emissiveIntensity: 0.1 }, // dragon pendant
        { shape: 'cape', size: [270, 255, 400], anchor: 'back', pos: [0, -95, 26], rot: [0.12, 0, 0], color: 0xd8dce0, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // pale cape
      ],
      personality: { bobMul: 0.85, swayMul: 0.75, cadenceMul: 0.9, ampMul: 0.85 },
      bubbles: ['🐉', '🔥', '👑', '😤'] },

    // Tyrion Lannister — short stature, crimson doublet, Hand's chain, goblet.
    { id: 'tv-game-of-thrones/clever-small-lord', label: "Clever Small Lord (Hand's chain, wine goblet)",
      rig: 'humanoid',
      humanoid: { sk: 0.75, headR: 130, skin: 0xd9a878, body: 0x8a1c24, legColor: 0x2a2420,
        shoe: 0x2a2420, eyes: 'dots', emI: 0, limbR: 1.15 },
      accessories: [
        { shape: 'box', size: [68, 22, 68], anchor: 'crown', pos: [0, -6, 2], color: 0xb08850 }, // hair
        { shape: 'box', size: [40, 22, 6], anchor: 'face', pos: [0, -30, -8], color: 0x9a7040 }, // goatee
        { shape: 'box', size: [150, 14, 8], anchor: 'chest', pos: [0, 116, -8], color: 0xb8860a }, // Hand's chain
        { shape: 'cylinder', size: [26, 20, 30], anchor: 'handR', pos: [0, -18, 0], color: 0xb0985a }, // goblet
        { shape: 'cylinder', size: [20, 20, 6], anchor: 'handR', pos: [0, -2, 0], color: 0x5c1a20 }, // wine fill
      ],
      personality: { bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.0, ampMul: 0.95 },
      bubbles: ['🍷', '😏', '📜', '🧠'] },

    // Cersei Lannister — crimson-gold gown, golden braided crown, lion brooch.
    { id: 'tv-game-of-thrones/golden-lioness-queen', label: 'Golden Lioness (crimson-gold gown, braided crown)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 118, skin: 0xe6c0a0, body: 0x7a1420, legColor: 0x7a1420,
        shoe: 0x6a1218, eyes: 'almond', emI: 0, limbR: 0.85, armL: 0.85 },
      accessories: [
        { shape: 'sphere', size: [140, 74, 144], anchor: 'crown', pos: [0, -6, 2], color: 0xd4af5a }, // golden updo
        { shape: 'box', size: [46, 10, 16], anchor: 'crown', pos: [-28, 0, 28], rot: [0.3, 0, 0], color: 0xd4af5a }, // braid ridge L
        { shape: 'box', size: [46, 10, 16], anchor: 'crown', pos: [28, 0, 28], rot: [0.3, 0, 0], color: 0xd4af5a }, // braid ridge R
        { shape: 'sphere', size: 24, anchor: 'chest', pos: [0, 116, -8], color: 0xc9a227 }, // lion brooch
        { shape: 'box', size: [200, 20, 8], anchor: 'hip', pos: [0, 6, -6], color: 0xc9a227 }, // filigree belt
        { shape: 'cape', size: [290, 275, 425], anchor: 'back', pos: [0, -95, 26], rot: [0.12, 0, 0], color: 0x5a0f16, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // crimson train
      ],
      personality: { bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['🦁', '👑', '🍷', '😈'] },

    // Arya Stark — plain brown leather, ponytail, Needle at the hip.
    { id: 'tv-game-of-thrones/scrappy-blade-wanderer', label: 'Scrappy Wanderer (leather jacket, needle-thin blade)',
      rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 112, skin: 0xd9ac82, body: 0x4a3c2e, legColor: 0x38302a,
        shoe: 0x2e2620, eyes: 'dots', emI: 0, limbR: 0.85, armL: 0.85 },
      accessories: [
        { shape: 'box', size: [58, 18, 58], anchor: 'crown', pos: [0, -4, 2], color: 0x241a12 }, // pulled-back hair
        { shape: 'cylinder', size: [14, 10, 80], anchor: 'back', pos: [0, 40, 30], rot: [0.4, 0, 0], color: 0x241a12 }, // ponytail
        { shape: 'box', size: [150, 18, 8], anchor: 'hip', pos: [0, 6, -6], color: 0x3a2e22 }, // sword belt
        { shape: 'cylinder', size: [6, 6, 260], anchor: 'handR', pos: [0, -120, 0], color: 0xb8b8b4 }, // Needle
        { shape: 'sphere', size: 16, anchor: 'handR', pos: [0, 10, 0], color: 0x2a221a }, // hilt cap
      ],
      personality: { bobMul: 1.1, swayMul: 0.9, cadenceMul: 1.2, ampMul: 1.0 },
      bubbles: ['🗡️', '🐺', '😠', '🤫'] },

    // Sansa Stark — grey-blue northern gown, long red hair, fur mantle epaulets.
    { id: 'tv-game-of-thrones/northern-fur-lady', label: 'Northern Lady (fur-mantled gown, long red hair)',
      rig: 'humanoid',
      humanoid: { sk: 0.98, headR: 116, skin: 0xe8c4a0, body: 0x3a3c40, legColor: 0x3a3c40,
        shoe: 0x362e28, eyes: 'almond', emI: 0, limbR: 0.85, armL: 0.88 },
      accessories: [
        { shape: 'sphere', size: [124, 62, 124], anchor: 'crown', pos: [0, -8, 4], color: 0x9a3c22 }, // auburn hair
        { shape: 'box', size: [60, 190, 34], anchor: 'back', pos: [0, -60, 20], color: 0x9a3c22 }, // hair trailing back
        { shape: 'sphere', size: [70, 40, 60], anchor: 'shoulderL', pos: [0, 20, 0], color: 0xc8c4b8 }, // fur epaulet L
        { shape: 'sphere', size: [70, 40, 60], anchor: 'shoulderR', pos: [0, 20, 0], color: 0xc8c4b8 }, // fur epaulet R
        { shape: 'sphere', size: 22, anchor: 'chest', pos: [0, 116, -8], color: 0xb8bcc0 }, // direwolf brooch
      ],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.9, ampMul: 0.85 },
      bubbles: ['👑', '🐺', '❄️', '😌'] },

    // Jaime Lannister — gold plate, crimson cloak, gilded golden hand.
    { id: 'tv-game-of-thrones/golden-hand-knight', label: 'Golden Knight (gold armor, golden hand)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, skin: 0xd9ac82, body: 0xc9a227, legColor: 0x3a2e22,
        shoe: 0x2e2620, eyes: 'dots', emI: 0, limbR: 1.0, armL: 1.0,
        limbColors: { armR: 0xe6c84a } }, // approx: gilded prosthetic — recolor the R arm (no hand-only field)
      accessories: [
        { shape: 'box', size: [64, 20, 64], anchor: 'crown', pos: [0, -6, 2], color: 0xd4af5a }, // golden wavy hair
        { shape: 'cape', size: [290, 290, 425], anchor: 'back', pos: [0, -105, 30], rot: [0.12, 0, 0], color: 0x8a1420, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // crimson cloak
        { shape: 'sphere', size: 26, anchor: 'chest', pos: [0, 110, -8], color: 0xf0e6c0 }, // lion breastplate emblem
        { shape: 'sphere', size: 34, anchor: 'handR', pos: [0, -4, 0], color: 0xe6c84a, emissiveIntensity: 0.15 }, // golden hand glint
      ],
      personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.0 },
      bubbles: ['🦁', '⚔️', '🍷', '😏'] },

    // Ned Stark — dark leathers, grey fur cloak, oversized greatsword Ice.
    { id: 'tv-game-of-thrones/honorbound-northern-lord', label: 'Honorbound Lord (grey fur cloak, oversized greatsword)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0xd0a074, body: 0x3a342e, legColor: 0x2e2a24,
        shoe: 0x241e18, eyes: 'dots', emI: 0, limbR: 1.05 },
      accessories: [
        { shape: 'box', size: [62, 24, 62], anchor: 'crown', pos: [0, -6, 2], color: 0x2e241a }, // greying hair
        { shape: 'box', size: [46, 30, 8], anchor: 'face', pos: [0, -30, -8], color: 0x342a1e }, // beard
        { shape: 'cape', size: [320, 310, 475], anchor: 'back', pos: [0, -115, 32], rot: [0.12, 0, 0], color: 0x18140f, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // heavy black cloak
        { shape: 'box', size: [130, 24, 22], anchor: 'back', pos: [0, 92, 36], color: 0xc8c4b8 }, // pale fur trim
        { shape: 'sphere', size: 22, anchor: 'chest', pos: [0, 116, -8], color: 0xb8bcc0 }, // direwolf brooch
        { shape: 'box', size: [18, 480, 12], anchor: 'back', pos: [40, -40, 40], rot: [0, 0, 0.5], color: 0xacaca8 }, // greatsword Ice
      ],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.9 },
      bubbles: ['🐺', '⚔️', '❄️', '😐'] },
  ],
};

export default pack;

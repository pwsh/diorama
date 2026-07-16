// Pop Culture ▸ TV Shows ▸ The Fresh Prince of Bel-Air — franchise pack
// (dynamic-import only, default loaded:false). Stylized geometric homage: color
// + silhouette only, no likenesses/logos/text. Named-cast pack → FIXED costume
// colors (culture-clash palette: loud streetwear vs. old-money formalwear).
// Source doc: docs/avatars/pop-culture/tv-fresh-prince-of-bel-air.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'tv-fresh-prince-of-bel-air', version: 1, label: 'The Fresh Prince of Bel-Air',
  path: ['Pop Culture', 'TV Shows', 'The Fresh Prince of Bel-Air'], builtin: true, franchise: true,
  avatars: [
    // Will — color-blocked jacket, sideways flat-brim cap, boombox.
    { id: 'tv-fresh-prince-of-bel-air/transplant-will', label: 'Streetwise Nephew (color-blocked jacket, sideways cap)',
      rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 126, skin: 0x8a5a3a, body: 0xe8c020, legColor: 0x3a5590,
        shoe: 0xf0ece0, eyes: 'dots', emI: 0, limbR: 1.05 },
      accessories: [
        { shape: 'box', size: [130, 40, 130], anchor: 'crown', pos: [0, 0, 0], rot: [0, 0.3, 0], color: 0x1c2a4a }, // cap crown (sideways)
        { shape: 'cylinder', size: [90, 90, 12], anchor: 'crown', pos: [-40, -6, 40], rot: [0, 0.3, 0], color: 0x1c2a4a }, // brim
        { shape: 'box', size: [180, 90, 6], anchor: 'chest', pos: [0, 40, -8], color: 0x6a2a8a }, // color-block panel
        { shape: 'box', size: [70, 50, 40], anchor: 'handR', pos: [0, -24, 0], color: 0x1c1c1c }, // boombox
        { shape: 'cylinder', size: [8, 8, 6], anchor: 'handR', pos: [-18, -24, -22], rot: [1.5708, 0, 0], color: 0xc8c8c8 }, // dial L
        { shape: 'cylinder', size: [8, 8, 6], anchor: 'handR', pos: [18, -24, -22], rot: [1.5708, 0, 0], color: 0xc8c8c8 }, // dial R
      ],
      personality: { bobMul: 1.15, swayMul: 1.2, cadenceMul: 1.05, ampMul: 1.15 },
      bubbles: ['🎤', '🏀', '😎', '💰'] },

    // Carlton — mustard argyle sweater vest, popped collar, tennis racket.
    { id: 'tv-fresh-prince-of-bel-air/prep-carlton', label: 'Preppy Cousin (argyle sweater vest, popped collar)',
      rig: 'humanoid',
      humanoid: { sk: 0.98, headR: 122, skin: 0x8a5c3c, body: 0xc4a030, legColor: 0xd8c8a0,
        shoe: 0x5a3c24, eyes: 'dots', emI: 0, limbR: 0.9, armL: 0.95 },
      accessories: [
        { shape: 'box', size: [120, 26, 120], anchor: 'crown', pos: [0, -8, 0], color: 0x1c140e }, // combed hair
        { shape: 'box', size: [26, 20, 6], anchor: 'chest', pos: [-16, 118, -6], rot: [0, 0, 0.4], color: 0xf2ede0 }, // popped collar L
        { shape: 'box', size: [26, 20, 6], anchor: 'chest', pos: [16, 118, -6], rot: [0, 0, -0.4], color: 0xf2ede0 }, // popped collar R
        { shape: 'box', size: [20, 20, 4], anchor: 'chest', pos: [0, 70, -8], rot: [0, 0, 0.78], color: 0x8a6a20 }, // argyle diamond (approx)
        { shape: 'box', size: [20, 20, 4], anchor: 'chest', pos: [-34, 40, -8], rot: [0, 0, 0.78], color: 0xe8dcc0 }, // argyle diamond
        { shape: 'box', size: [20, 20, 4], anchor: 'chest', pos: [34, 40, -8], rot: [0, 0, 0.78], color: 0xe8dcc0 }, // argyle diamond
        { shape: 'sphere', size: [60, 90, 8], anchor: 'handR', pos: [0, -50, 0], color: 0xe8e4d8 }, // tennis racket frame
        { shape: 'cylinder', size: [8, 8, 60], anchor: 'handR', pos: [0, -10, 0], color: 0x5a3c24 }, // racket handle
      ],
      personality: { bobMul: 0.85, swayMul: 1.3, cadenceMul: 1.0, ampMul: 0.8 },
      bubbles: ['🎶', '💼', '📈', '😳'] },

    // Philip Banks — imposing three-piece suit, balding, mustache, gavel.
    { id: 'tv-fresh-prince-of-bel-air/patriarch-philip', label: 'Judge & Patriarch (three-piece suit, mustache)',
      rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 132, skin: 0x6a4530, body: 0x1e2438, legColor: 0x1a1e2e,
        shoe: 0x1c1c1c, eyes: 'dots', emI: 0, limbR: 1.15, armL: 1.05 },
      accessories: [
        { shape: 'box', size: [110, 18, 110], anchor: 'crown', pos: [0, -18, 0], color: 0x2a2018 }, // balding side band
        { shape: 'box', size: [50, 14, 10], anchor: 'face', pos: [0, -12, -8], color: 0x201810 }, // mustache
        { shape: 'box', size: [150, 130, 6], anchor: 'chest', pos: [0, 20, -6], color: 0x151a28 }, // vest front
        { shape: 'cylinder', size: [4, 4, 60], anchor: 'chest', pos: [-40, 40, -10], rot: [0, 0, 0.6], color: 0xd0b840 }, // watch chain
        { shape: 'cylinder', size: [10, 10, 50], anchor: 'handR', pos: [0, -10, 0], rot: [0, 0, 1.5708], color: 0x5a3c24 }, // gavel handle
        { shape: 'box', size: [30, 30, 30], anchor: 'handR', pos: [0, -34, 0], color: 0x3a2416 }, // gavel head
      ],
      personality: { bobMul: 0.75, swayMul: 0.7, cadenceMul: 0.9, ampMul: 0.85 },
      bubbles: ['😠', '💼', '⚖️', '🙄'] },

    // Vivian Banks — elegant updo, single strand of pearls, book.
    { id: 'tv-fresh-prince-of-bel-air/matriarch-vivian', label: 'Professor Matriarch (elegant updo, pearls)',
      rig: 'humanoid',
      humanoid: { sk: 0.94, headR: 118, skin: 0x6a4028, body: 0x5a2438, legColor: 0x4a1e2c,
        shoe: 0x2a1c14, eyes: 'almond', emI: 0, limbR: 0.85, armL: 0.9 },
      accessories: [
        { shape: 'sphere', size: [124, 80, 120], anchor: 'crown', pos: [0, -4, 2], color: 0x1c140e }, // updo
        { shape: 'sphere', size: 10, anchor: 'chest', pos: [-24, 118, -8], color: 0xf0ece0 }, // pearl
        { shape: 'sphere', size: 10, anchor: 'chest', pos: [0, 114, -8], color: 0xf0ece0 }, // pearl
        { shape: 'sphere', size: 10, anchor: 'chest', pos: [24, 118, -8], color: 0xf0ece0 }, // pearl
        { shape: 'box', size: [50, 70, 14], anchor: 'handL', pos: [0, -24, 0], color: 0x2a3a5a }, // book
      ],
      personality: { bobMul: 0.9, swayMul: 0.95, cadenceMul: 1.0, ampMul: 0.9 },
      bubbles: ['📚', '🎓', '❤️', '🧘'] },

    // Hilary Banks — black bowler hat, bold red power blazer, handbag.
    { id: 'tv-fresh-prince-of-bel-air/socialite-hilary', label: 'Socialite Fashionista (bowler hat, power blazer)',
      rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 116, skin: 0x8a5c3c, body: 0xb01c28, legColor: 0x1c1c1c,
        shoe: 0x1c1c1c, eyes: 'almond', emI: 0, limbR: 0.8, armL: 0.92 },
      accessories: [
        { shape: 'cylinder', size: [140, 140, 16], anchor: 'crown', pos: [0, -4, 6], rot: [0.4, 0, 0], color: 0x161616 }, // bowler brim (tilted back)
        { shape: 'sphere', size: [110, 60, 110], anchor: 'crown', pos: [0, 30, -6], sphereArc: [0, 6.283, 0, 1.9], color: 0x161616 }, // bowler crown dome
        { shape: 'sphere', size: 18, anchor: 'chest', pos: [-40, 116, -8], color: 0xd8b840 }, // gold brooch
        { shape: 'box', size: [70, 80, 24], anchor: 'handL', pos: [0, -30, 0], color: 0x1c1c1c }, // handbag
        { shape: 'box', size: [30, 10, 6], anchor: 'handL', pos: [0, 6, -14], color: 0xd8b840 }, // gold clasp
      ],
      personality: { bobMul: 1.0, swayMul: 1.3, cadenceMul: 1.0, ampMul: 1.15 },
      bubbles: ['💅', '👛', '💄', '😌'] },

    // Ashley Banks — child-scale, twin pigtails, basketball.
    { id: 'tv-fresh-prince-of-bel-air/youngest-ashley', label: 'Youngest Cousin (casual pigtails)',
      rig: 'humanoid',
      humanoid: { sk: 0.7, headR: 110, skin: 0x8a5c3c, body: 0x6a4a90, legColor: 0x3a4a70,
        shoe: 0xf0ece0, eyes: 'dots', emI: 0, limbR: 0.75, armL: 0.8 },
      accessories: [
        { shape: 'sphere', size: 50, anchor: 'head', pos: [-64, 20, 6], color: 0x1c140e }, // pigtail L
        { shape: 'sphere', size: 50, anchor: 'head', pos: [64, 20, 6], color: 0x1c140e }, // pigtail R
        { shape: 'box', size: [20, 16, 4], anchor: 'chest', pos: [0, 120, -8], color: 'tint' }, // ribbon bow (tint carrier)
        { shape: 'sphere', size: 50, anchor: 'handR', pos: [0, -24, 0], color: 0xd86a2a }, // basketball
      ],
      personality: { bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.25, ampMul: 1.1 },
      bubbles: ['🏀', '🤗', '📺', '😆'] },

    // Geoffrey — black tailcoat, wing collar + bow tie, balding grey, serving tray.
    { id: 'tv-fresh-prince-of-bel-air/butler-geoffrey', label: 'Household Butler (bow tie, tailcoat)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0x8a6040, body: 0x141414, legColor: 0x141414,
        shoe: 0x0c0c0c, eyes: 'dots', emI: 0, limbR: 0.92 },
      accessories: [
        { shape: 'box', size: [108, 16, 108], anchor: 'crown', pos: [0, -20, 0], color: 0x9a9690 }, // balding grey side band
        { shape: 'box', size: [44, 10, 8], anchor: 'face', pos: [0, -12, -8], color: 0x8a8680 }, // grey mustache
        { shape: 'box', size: [70, 130, 6], anchor: 'chest', pos: [0, 40, -8], color: 0xf2ede0 }, // wing-collar shirt front
        { shape: 'box', size: [26, 14, 8], anchor: 'chest', pos: [0, 116, -10], color: 0x0c0c0c }, // bow tie
        { shape: 'cylinder', size: [70, 70, 6], anchor: 'handR', pos: [0, -18, 0], color: 0xd0d0d0 }, // serving tray
      ],
      personality: { bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.95, ampMul: 0.75 },
      bubbles: ['🍷', '🎩', '😏', '🫖'] },
  ],
};

export default pack;

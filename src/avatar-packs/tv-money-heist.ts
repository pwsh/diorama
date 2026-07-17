// Pop Culture ▸ TV Shows ▸ Money Heist (La Casa de Papel) — franchise pack
// (dynamic-import only, default loaded:false). Stylized geometric homage: color
// + silhouette only, no likenesses/logos. Six heist-crew members share ONE
// jumpsuit red via the pack `base` + a shared crew-kit (folded hood + front
// zipper); the mastermind and police inspector wear their own civilian looks.
// The Dalí mask is deliberately NOT rendered (real-person likeness). Source doc:
// docs/avatars/pop-culture/tv-money-heist.md
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

const JUMPSUIT = 0xc1272d;

// Shared crew accessories: folded-down hood (back) + front zipper stripe (chest).
const crewKit: AvatarPrimitive[] = [
  { shape: 'sphere', size: [90, 70, 30], anchor: 'back', pos: [0, 40, 20], color: JUMPSUIT }, // folded hood
  { shape: 'box', size: [16, 190, 6], anchor: 'chest', pos: [0, 30, -8], color: 0x2a2a2a }, // zipper
];

const pack: AvatarPackDef = {
  id: 'tv-money-heist', version: 2, label: 'Money Heist',
  path: ['Pop Culture', 'TV Shows', 'Money Heist'], builtin: true, franchise: true,
  // Shared jumpsuit body — spread under every member; the two civilians and
  // Denver override body/legColor below.
  base: {
    rig: 'humanoid',
    humanoid: { body: JUMPSUIT, legColor: JUMPSUIT, shoe: 0x161616, emI: 0, eyes: 'dots', hands: 'sphere' },
  },
  avatars: [
    // The Professor — grey suit + overcoat, round glasses, full beard.
    { id: 'tv-money-heist/heist-mastermind', label: 'Mastermind (grey suit, round glasses)',
      rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, skin: 0xd9a878, body: 0x585858, legColor: 0x3f3f3f,
        shoe: 0x141414, limbR: 0.85, armL: 1.0, legL: 1.02 },
      accessories: [
        { shape: 'box', size: [50, 38, 6], anchor: 'face', pos: [-38, -2, -6], color: 0x141414 }, // lens L
        { shape: 'box', size: [50, 38, 6], anchor: 'face', pos: [38, -2, -6], color: 0x141414 }, // lens R
        { shape: 'box', size: [16, 6, 5], anchor: 'face', pos: [0, -2, -6], color: 0x141414 }, // bridge
        { shape: 'sphere', size: [132, 64, 132], anchor: 'crown', pos: [0, -6, 4], color: 0x2b1d14 }, // curly hair
        { shape: 'box', size: [90, 50, 30], anchor: 'face', pos: [0, -36, -6], color: 0x2b1d14 }, // beard
        { shape: 'box', size: [46, 12, 5], anchor: 'face', pos: [0, -14, -8], color: 0x2b1d14 }, // moustache
        { shape: 'box', size: [70, 20, 6], anchor: 'chest', pos: [0, 122, -6], color: 0xf0ede4 }, // shirt collar
        { shape: 'box', size: [34, 140, 8], anchor: 'chest', pos: [0, 40, -10], color: 0x6d1f24 }, // maroon tie
        { shape: 'cape', size: [240, 255, 350], anchor: 'back', pos: [0, -90, 30], rot: [0.12, 0, 0], color: 0x505050 }, // overcoat drape
      ],
      personality: { bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.85, ampMul: 0.7 },
      bubbles: ['📋', '🧠', '♟️', '😌'] },

    // Tokyo — dark blunt bob with a straight fringe, red jumpsuit.
    { id: 'tv-money-heist/reckless-getaway', label: 'Robber (dark bob, red jumpsuit)',
      rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, skin: 0xe0b48c, limbR: 0.85 },
      accessories: [
        ...crewKit,
        { shape: 'box', size: [128, 58, 128], anchor: 'crown', pos: [0, -16, 0], color: 0x2b1c14 }, // blunt bob
        { shape: 'box', size: [90, 16, 14], anchor: 'face', pos: [0, 30, -8], color: 0x2b1c14 }, // straight fringe
      ],
      personality: { bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.1 },
      bubbles: ['💥', '🔥', '😏', '💣'] },

    // Berlin — slick hair, jumpsuit worn open over a black waistcoat.
    { id: 'tv-money-heist/suave-strategist', label: 'Robber (slicked hair, open collar, vest)',
      rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 124, skin: 0xe8c2a0, limbR: 0.85 },
      accessories: [
        { shape: 'sphere', size: [90, 70, 30], anchor: 'back', pos: [0, 40, 20], color: JUMPSUIT }, // folded hood
        { shape: 'box', size: [124, 34, 124], anchor: 'crown', pos: [0, -8, 2], color: 0x2a1c14, emissiveIntensity: 0.05 }, // groomed hair
        { shape: 'box', size: [100, 130, 10], anchor: 'chest', pos: [0, 20, -8], color: 0x161616 }, // waistcoat V (replaces zipper)
        { shape: 'box', size: [50, 16, 6], anchor: 'chest', pos: [0, 116, -12], color: 0xede9e0 }, // shirt collar peek
      ],
      personality: { bobMul: 1.1, swayMul: 1.2, cadenceMul: 0.95, ampMul: 1.05 },
      bubbles: ['🎭', '🍷', '😏', '🎶'] },

    // Nairobi — dark wavy shoulder-length hair, gold hoop earrings.
    { id: 'tv-money-heist/crew-forewoman', label: 'Robber (curly hair, gold hoops)',
      rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, skin: 0xb97a52, limbR: 0.85 },
      accessories: [
        ...crewKit,
        { shape: 'sphere', size: [140, 80, 136], anchor: 'crown', pos: [0, -8, 4], color: 0x1c130c }, // wavy hair
        { shape: 'box', size: [40, 90, 30], anchor: 'head', pos: [-58, -30, 6], color: 0x1c130c }, // side lobe L
        { shape: 'box', size: [40, 90, 30], anchor: 'head', pos: [58, -30, 6], color: 0x1c130c }, // side lobe R
        { shape: 'cylinder', size: [18, 18, 6], anchor: 'head', pos: [-100, -20, 0], rot: [0, 1.5708, 0], color: 0xd4af37 }, // gold hoop L (approx)
        { shape: 'cylinder', size: [18, 18, 6], anchor: 'head', pos: [100, -20, 0], rot: [0, 1.5708, 0], color: 0xd4af37 }, // gold hoop R
      ],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 0.95 },
      bubbles: ['💰', '❤️', '😆', '💪'] },

    // Rio — youngest, slight build, tousled curly hair.
    { id: 'tv-money-heist/young-hacker', label: 'Robber (young, tousled curly hair)',
      rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 116, skin: 0xe0b48c, limbR: 0.78, armL: 0.95, legL: 0.95 },
      accessories: [
        ...crewKit,
        { shape: 'sphere', size: [116, 50, 116], anchor: 'crown', pos: [0, -4, 4], color: 0x4a2f1c }, // tousled dome
        { shape: 'sphere', size: 30, anchor: 'crown', pos: [-30, 18, 18], color: 0x4a2f1c }, // uneven tuft
      ],
      personality: { bobMul: 1.1, swayMul: 0.95, cadenceMul: 1.15, ampMul: 1.0 },
      bubbles: ['💻', '❤️', '😅', '🎧'] },

    // Denver — jumpsuit peeled down to a tank top, knotted at the waist.
    { id: 'tv-money-heist/hotheaded-brawler', label: 'Robber (tank top, jumpsuit tied at waist)',
      rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 124, skin: 0xcf9a68, body: 0xe6e2d8, limbR: 1.1 },
      accessories: [
        { shape: 'box', size: [124, 36, 124], anchor: 'crown', pos: [0, -8, 0], color: 0x15100c }, // curly hair
        { shape: 'cylinder', size: [46, 46, 100], anchor: 'hip', pos: [0, 6, 0], rot: [0, 0, 1.5708], color: JUMPSUIT }, // knotted jumpsuit top
      ],
      personality: { bobMul: 1.2, swayMul: 1.15, cadenceMul: 1.1, ampMul: 1.15 },
      bubbles: ['😂', '🥊', '😬', '💪'] },

    // Moscow — oldest, stout, grey beard + thinning grey hair.
    { id: 'tv-money-heist/veteran-digger', label: 'Robber (grey beard, stout build)',
      rig: 'humanoid',
      humanoid: { sk: 1.08, headR: 128, skin: 0xc99566, limbR: 1.2 },
      accessories: [
        ...crewKit,
        { shape: 'box', size: [50, 34, 46], anchor: 'head', pos: [-70, 20, 0], color: 0x9c9690 }, // thinning hair L
        { shape: 'box', size: [50, 34, 46], anchor: 'head', pos: [70, 20, 0], color: 0x9c9690 }, // thinning hair R
        { shape: 'box', size: [94, 54, 32], anchor: 'face', pos: [0, -32, -6], color: 0x9c9690 }, // grey beard
      ],
      personality: { bobMul: 0.85, swayMul: 0.75, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['⛏️', '😌', '🛠️', '❤️'] },

    // Raquel Murillo — police inspector, dark blazer, wavy chestnut hair, badge belt.
    { id: 'tv-money-heist/police-negotiator', label: 'Police inspector (dark blazer, badge)',
      rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 118, skin: 0xe8c2a0, body: 0x2a2e38, legColor: 0x24262c,
        shoe: 0x161616, limbR: 0.85, armL: 0.92, legL: 0.94 },
      accessories: [
        { shape: 'sphere', size: [130, 60, 130], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x6b4226 }, // wavy hair
        { shape: 'box', size: [64, 20, 6], anchor: 'chest', pos: [0, 122, -6], color: 0xf0ede4 }, // blouse collar
        { shape: 'box', size: [110, 130, 8], anchor: 'chest', pos: [0, 30, -6], color: 0x1e2027 }, // lapel panel
        { shape: 'box', size: [180, 18, 6], anchor: 'hip', pos: [0, 6, -6], color: 0x141414 }, // duty belt
      ],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🚔', '❤️', '🤔', '📋'] },
  ],
};

export default pack;

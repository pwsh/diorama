// Pop Culture ▸ TV Shows ▸ Squid Game — franchise pack (dynamic-import only,
// default loaded:false). Stylized geometric homage: color + silhouette only, no
// likenesses/logos/numbers. The seven ordinary players share ONE teal-green
// tracksuit via the pack `base` (tmnt shared-body pattern); the Front Man and
// Pink Guard fully override body/legColor. Source doc:
// docs/avatars/pop-culture/tv-squid-game.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'tv-squid-game', version: 3, label: 'Squid Game',
  path: ['Pop Culture', 'TV Shows', 'Squid Game'], builtin: true, franchise: true,
  // Shared tracksuit body — spread under every member; the two non-players
  // override body/legColor/shoe/eyes/noFace/hands below.
  base: {
    rig: 'humanoid',
    humanoid: { body: 0x1d6b52, legColor: 0x1d6b52, shoe: 0xf0ece0, emI: 0, hands: 'sphere', eyes: 'dots' },
  },
  avatars: [
    // Seong Gi-hun — everyman, receding hairline, betting slip.
    { id: 'tv-squid-game/protagonist-gihun', label: 'Debt-Ridden Gambler (green tracksuit, receding hairline)',
      rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 128, skin: 0xe0b48e, limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [90, 24, 70], anchor: 'crown', pos: [-40, -8, 6], color: 0x241c14 }, // hair patch L (receding)
        { shape: 'box', size: [90, 24, 70], anchor: 'crown', pos: [40, -8, 6], color: 0x241c14 }, // hair patch R
        { shape: 'box', size: [30, 20, 4], anchor: 'chest', pos: [-50, 118, -10], color: 0xf5f2ea }, // number patch
        { shape: 'box', size: [40, 30, 4], anchor: 'handR', pos: [0, -20, 0], color: 0xe8e2d0 }, // betting slip
      ],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 0.95, ampMul: 1.0 },
      bubbles: ['🐎', '💸', '😰', '🏃'] },

    // The Front Man — all-black coat, faceted plate mask, no face.
    { id: 'tv-squid-game/mastermind-frontman', label: 'Masked Overseer (black coat, faceted mask)',
      rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 124, skin: 0x2a2622, body: 0x0d0d0d, legColor: 0x0d0d0d,
        shoe: 0x111111, eyes: 'none', limbR: 1.0, hands: 'box', noFace: true },
      accessories: [
        { shape: 'box', size: [132, 150, 40], anchor: 'face', pos: [0, 10, -20], color: 0x161616 }, // faceted mask plate
        { shape: 'box', size: [40, 50, 10], anchor: 'face', pos: [-44, 6, -38], rot: [0, 0.3, 0], color: 0x1e1e1e }, // facet L (proud)
        { shape: 'box', size: [40, 50, 10], anchor: 'face', pos: [44, 6, -38], rot: [0, -0.3, 0], color: 0x1e1e1e }, // facet R (proud)
        { shape: 'cape', size: [400, 600, 560], anchor: 'back', pos: [0, -210, 30], rot: [0.12, 0, 0], color: 0x0d0d0d, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // long coat
        { shape: 'box', size: [34, 34, 40], anchor: 'handL', pos: [0, 0, 0], color: 0x141414 }, // glove L
        { shape: 'box', size: [34, 34, 40], anchor: 'handR', pos: [0, 0, 0], color: 0x141414 }, // glove R
      ],
      personality: { bobMul: 0.8, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['🎭', '🗡️', '🖤', '👁️'] },

    // Pink Guard — bubblegum jumpsuit, black hood + mask, triangle rank, rifle.
    { id: 'tv-squid-game/guard-pink', label: 'Masked Guard (pink jumpsuit, triangle rank)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0x2a2622, body: 0xe66fa0, legColor: 0xe66fa0,
        shoe: 0x1c1c1c, eyes: 'none', limbR: 1.0, hands: 'box', noFace: true },
      accessories: [
        { shape: 'box', size: [140, 60, 140], anchor: 'crown', pos: [0, -10, 0], color: 0x141414 }, // hood
        { shape: 'box', size: [118, 90, 20], anchor: 'face', pos: [0, 0, -10], color: 0x161616 }, // mask plate
        { shape: 'cone', size: [24, 32], anchor: 'face', pos: [0, 0, -26], color: 0x2a2a2a }, // triangle rank (approx)
        { shape: 'box', size: [10, 160, 6], anchor: 'chest', pos: [0, 40, -8], color: 0x141414 }, // zipper line
        { shape: 'box', size: [34, 34, 40], anchor: 'handL', pos: [0, 0, 0], color: 0x141414 }, // glove L
        { shape: 'box', size: [18, 18, 140], anchor: 'handR', pos: [0, 0, -30], color: 0x1c1c1c }, // rifle prop
      ],
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 1.0, ampMul: 0.8 },
      bubbles: ['🔺', '⚫', '🔫', '🤐'] },

    // Kang Sae-byeok — blunt bob with straight fringe, hidden shiv.
    { id: 'tv-squid-game/defector-saebyeok', label: 'Sharp-Eyed Survivor (green tracksuit, blunt bob)',
      rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 116, skin: 0xe6bd9c, eyes: 'almond', limbR: 0.85, armL: 0.92 },
      accessories: [
        { shape: 'box', size: [120, 60, 120], anchor: 'crown', pos: [0, -18, 0], color: 0x161310 }, // blunt bob
        { shape: 'box', size: [110, 18, 30], anchor: 'face', pos: [0, 30, -8], color: 0x161310 }, // straight fringe
        { shape: 'box', size: [60, 8, 4], anchor: 'handR', pos: [0, -20, 0], color: 0xb8bcc2 }, // hidden shiv
      ],
      personality: { bobMul: 0.95, swayMul: 0.85, cadenceMul: 1.1, ampMul: 0.95 },
      bubbles: ['🔪', '🤐', '🧷', '😔'] },

    // Cho Sang-woo — neat side-parted hair, a single marble.
    { id: 'tv-squid-game/strategist-sangwoo', label: 'Calculating Strategist (green tracksuit, marble in hand)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, skin: 0xdcb090, limbR: 0.95 },
      accessories: [
        { shape: 'box', size: [58, 30, 118], anchor: 'crown', pos: [-14, -8, 0], color: 0x18120c }, // hair (offset part) L
        { shape: 'box', size: [50, 26, 118], anchor: 'crown', pos: [40, -12, 0], color: 0x18120c }, // hair R
        { shape: 'sphere', size: 12, anchor: 'handR', pos: [0, -14, 0], color: 0xcfe0e8 }, // marble
        { shape: 'box', size: [26, 10, 6], anchor: 'chest', pos: [0, 120, -8], color: 0xeceadd }, // collar accent
      ],
      personality: { bobMul: 0.85, swayMul: 0.8, cadenceMul: 1.05, ampMul: 0.85 },
      bubbles: ['🔵', '🧠', '♟️', '😨'] },

    // Oh Il-nam — frail elder, stooped, wispy pale hair, tint belt.
    { id: 'tv-squid-game/elder-ilnam', label: 'Frail Elder (green tracksuit, stooped)',
      rig: 'humanoid',
      humanoid: { sk: 0.8, headR: 108, skin: 0xd9b48c, limbR: 0.75, armL: 0.85, legL: 0.9 },
      posture: { pitch: 0.25 },
      accessories: [
        { shape: 'box', size: [90, 20, 90], anchor: 'crown', pos: [0, -10, 0], color: 0xe6e2da }, // wispy hair
        { shape: 'box', size: [140, 20, 8], anchor: 'hip', pos: [0, 6, -6], color: 'tint' }, // belt (tint carrier)
      ],
      personality: { bobMul: 0.6, swayMul: 0.6, cadenceMul: 0.7, ampMul: 0.6 },
      bubbles: ['🎈', '👴', '🩺', '😊'] },

    // Han Mi-nyeo — voluminous frizzy permed hair.
    { id: 'tv-squid-game/schemer-minyeo', label: 'Flamboyant Schemer (voluminous permed hair)',
      rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 122, skin: 0xe0b494, eyes: 'almond', limbR: 0.85 },
      accessories: [
        { shape: 'sphere', size: [150, 110, 150], anchor: 'crown', pos: [0, -6, 4], color: 0x241c16 }, // frizzy perm dome
        { shape: 'sphere', size: 40, anchor: 'head', pos: [-64, 10, 20], color: 0x241c16 }, // frizz puff L
        { shape: 'sphere', size: 40, anchor: 'head', pos: [64, 10, 20], color: 0x241c16 }, // frizz puff R
      ],
      personality: { bobMul: 1.3, swayMul: 1.35, cadenceMul: 1.15, ampMul: 1.25 },
      bubbles: ['🃏', '😼', '💅', '🗣️'] },

    // Ali Abdul — short black curly hair, sturdy build.
    { id: 'tv-squid-game/worker-ali', label: 'Devoted Migrant Worker (curly hair, sturdy build)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0x8a5a3a, limbR: 1.05 },
      accessories: [
        { shape: 'sphere', size: [124, 50, 124], anchor: 'crown', pos: [0, -6, 2], color: 0x18120e }, // curly dome
        { shape: 'sphere', size: 26, anchor: 'crown', pos: [-30, 12, 30], color: 0x18120e }, // curl bump L
        { shape: 'sphere', size: 26, anchor: 'crown', pos: [30, 12, 30], color: 0x18120e }, // curl bump R
        { shape: 'box', size: [140, 20, 8], anchor: 'hip', pos: [0, 6, -6], color: 0x3a3a2c }, // work belt
      ],
      personality: { bobMul: 1.05, swayMul: 0.95, cadenceMul: 0.95, ampMul: 1.05 },
      bubbles: ['💪', '🙏', '😊', '❤️'] },

    // Nameless Player — plain crop, tint number-patch (the pack's tint carrier).
    { id: 'tv-squid-game/recruit-anonymous', label: 'Nameless Player (green tracksuit, plain crop)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0xdcb090, limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [118, 24, 118], anchor: 'crown', pos: [0, -8, 0], color: 0x201812 }, // plain crop
        { shape: 'box', size: [30, 20, 4], anchor: 'chest', pos: [-50, 118, -10], color: 'tint' }, // number patch (tint)
      ],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['😨', '🔢', '🤝', '😰'] },
  ],
};

export default pack;

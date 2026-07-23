// Pop Culture ▸ TV ▸ Friends — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric homage: color + silhouette only, no
// likenesses/logos. Named-cast pack → FIXED costume colors, not tint carriers.
// Hair shape is the primary read for most members. Collars/ties ride the `neck`
// anchor. Source doc: docs/avatars/pop-culture/tv-friends.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'tv-friends', version: 1, label: 'Friends',
  path: ['Pop Culture', 'TV Shows', 'Friends'], builtin: true, franchise: true,
  avatars: [
    // Ross Geller — sweater vest, white collar, dinosaur-bone prop.
    { id: 'tv-friends/paleontologist-ross', label: 'Paleontologist (burgundy sweater vest)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 126, skin: 0xe0b090, body: 0x7a2a30, legColor: 0x5a4632,
        shoe: 0x4a3624, eyes: 'dots', emI: 0, limbR: 0.95, hands: 'sphere' },
      accessories: [
        { shape: 'sphere', size: [62, 16, 62], anchor: 'crown', pos: [0, -6, 4], rot: [0.3, 0, 0], color: 0x2e1c12 },
        { shape: 'box', size: [26, 14, 6], anchor: 'neck', pos: [-16, 2, -86], rot: [0, 0, 0.5], color: 0xf2ede0 },
        { shape: 'box', size: [26, 14, 6], anchor: 'neck', pos: [16, 2, -86], rot: [0, 0, -0.5], color: 0xf2ede0 },
        { shape: 'cylinder', size: [7, 7, 50], anchor: 'handR', pos: [0, -18, 0], rot: [0.3, 0, 0.4], color: 0xe8dfc8 },
      ],
      personality: { bobMul: 1.0, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.05 },
      bubbles: ['🦕', '🦴', '📚', '😬'] },

    // Monica Geller — blunt dark bob, chef whites + bib apron, whisk prop.
    { id: 'tv-friends/chef-monica', label: 'Chef (dark bob, chef whites)',
      rig: 'humanoid',
      humanoid: { sk: 0.96, headR: 120, skin: 0xe0b090, body: 0xf2f0ea, legColor: 0x232323,
        shoe: 0x1c1c1c, eyes: 'dots', emI: 0, limbR: 0.9, armL: 0.95 },
      accessories: [
        { shape: 'box', size: [136, 88, 140], anchor: 'crown', pos: [0, -34, 6], color: 0x1c1410 },
        { shape: 'box', size: [200, 250, 8], anchor: 'chest', pos: [0, 4, -8], color: 0xf8f6f0 },
        { shape: 'box', size: [206, 16, 12], anchor: 'chest', pos: [0, -120, -10], color: 0x2a2a2a },
        { shape: 'cylinder', size: [6, 6, 55], anchor: 'handR', pos: [0, -22, 0], rot: [0.3, 0, 0.3], color: 0x9a7040 },
      ],
      personality: { bobMul: 0.9, swayMul: 0.8, cadenceMul: 1.2, ampMul: 0.9 },
      bubbles: ['🍳', '🧽', '✨', '😤'] },

    // Rachel Green — the flipped-layer haircut (the primary read), blush top.
    { id: 'tv-friends/fashionista-rachel', label: 'Fashionista (flipped-layer haircut)',
      rig: 'humanoid',
      humanoid: { sk: 0.94, headR: 116, skin: 0xe6b89c, body: 0xdcb8c4, legColor: 0xe8dcc8,
        shoe: 0xf0ece0, eyes: 'almond', emI: 0, limbR: 0.82, armL: 0.92 },
      accessories: [
        { shape: 'sphere', size: [65, 35, 65], anchor: 'crown', pos: [0, -10, 6], rot: [0.3, 0, 0], color: 0x8a5c34 },
        { shape: 'box', size: [46, 30, 20], anchor: 'head', pos: [-62, -8, -10], rot: [0, 0, -0.5], color: 0x8a5c34 },
        { shape: 'box', size: [46, 30, 20], anchor: 'head', pos: [62, -8, -10], rot: [0, 0, 0.5], color: 0x8a5c34 },
        { shape: 'box', size: [50, 60, 18], anchor: 'handR', pos: [0, -34, 0], color: 0xf5efe0 },
      ],
      personality: { bobMul: 1.0, swayMul: 1.25, cadenceMul: 1.0, ampMul: 1.1 },
      bubbles: ['👗', '☕', '💅'] },

    // Joey Tribbiani — black leather jacket, popped collar, sandwich prop.
    { id: 'tv-friends/actor-joey', label: 'Actor (black leather jacket)',
      rig: 'humanoid',
      humanoid: { sk: 1.06, headR: 128, skin: 0xd8a878, body: 0x1c1a18, legColor: 0x2e4258,
        shoe: 0x2a2a2a, eyes: 'dots', emI: 0, limbR: 1.05, armL: 1.0 },
      accessories: [
        { shape: 'sphere', size: [64, 18, 64], anchor: 'crown', pos: [0, -6, 4], rot: [0.25, 0, 0], color: 0x241a10 },
        { shape: 'box', size: [34, 20, 10], anchor: 'neck', pos: [-20, 6, -84], rot: [0.3, 0, 0.4], color: 0x2a2622 },
        { shape: 'box', size: [34, 20, 10], anchor: 'neck', pos: [20, 6, -84], rot: [0.3, 0, -0.4], color: 0x2a2622 },
        { shape: 'box', size: [46, 26, 30], anchor: 'handR', pos: [0, -22, 0], color: 0xd8b878 },
      ],
      personality: { bobMul: 1.05, swayMul: 1.15, cadenceMul: 0.92, ampMul: 1.1 },
      bubbles: ['🍕', '📺', '😏'] },

    // Phoebe Buffay — long blonde waves (crown+sides+back), boho vest, guitar.
    { id: 'tv-friends/masseuse-phoebe', label: 'Quirky masseuse (long blonde waves, boho)',
      rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 118, skin: 0xe6c0a0, body: 0xb8863a, legColor: 0x6a5a3a,
        shoe: 0x8a6a3a, eyes: 'almond', emI: 0, limbR: 0.8, armL: 0.95 },
      accessories: [
        { shape: 'sphere', size: [68, 45, 68], anchor: 'crown', pos: [0, -10, 10], rot: [0.35, 0, 0], color: 0xd8c078 },
        { shape: 'box', size: [40, 140, 30], anchor: 'head', pos: [-56, -56, 12], color: 0xd8c078 },
        { shape: 'box', size: [40, 140, 30], anchor: 'head', pos: [56, -56, 12], color: 0xd8c078 },
        { shape: 'cylinder', size: [35, 20, 220], anchor: 'back', pos: [0, -90, 12], color: 0xd8c078 },
        { shape: 'box', size: [200, 60, 155], anchor: 'hip', pos: [0, -30, 0], color: 0x9a7028 },
        { shape: 'box', size: [90, 130, 20], anchor: 'handR', pos: [0, -40, 0], color: 0xa87840 },
        { shape: 'cylinder', size: [8, 8, 90], anchor: 'handR', pos: [0, 30, 0], color: 0x6a4a28 },
      ],
      personality: { bobMul: 1.3, swayMul: 1.3, cadenceMul: 1.1, ampMul: 1.2 },
      bubbles: ['🎸', '🔮', '🌙', '😄'] },

    // Chandler Bing — navy V-neck sweater vest with a tie, coffee-mug prop.
    { id: 'tv-friends/statistician-chandler', label: 'Statistician (navy sweater vest, tie)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, skin: 0xdcb090, body: 0x2a3a5a, legColor: 0x4a4640,
        shoe: 0x3a2e22, eyes: 'dots', emI: 0, limbR: 0.9, armL: 0.95 },
      accessories: [
        { shape: 'sphere', size: [61, 14, 61], anchor: 'crown', pos: [0, -6, 2], rot: [0.25, 0, 0], color: 0x2a1c12 },
        { shape: 'box', size: [30, 24, 6], anchor: 'neck', pos: [-16, -6, -86], rot: [0, 0, 0.5], color: 0xe8e4d8 },
        { shape: 'box', size: [30, 24, 6], anchor: 'neck', pos: [16, -6, -86], rot: [0, 0, -0.5], color: 0xe8e4d8 },
        { shape: 'box', size: [18, 70, 6], anchor: 'chest', pos: [0, 0, -10], color: 0x6a2a30 },
        { shape: 'cylinder', size: [22, 22, 46], anchor: 'handR', pos: [0, -20, 0], rot: [1.57, 0, 0], color: 0xe8e4d8 },
      ],
      personality: { bobMul: 0.9, swayMul: 0.9, cadenceMul: 1.05, ampMul: 0.85 },
      bubbles: ['😏', '☕', '🙄'] },
  ],
};

export default pack;

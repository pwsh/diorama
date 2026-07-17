// Cartoons ▸ My Little Pony — franchise pack (opt-in, defaults loaded:false).
// Stylized geometric toon homage — NOT licensed characters, colour + silhouette
// only, no cutie-mark decals. All members are QUADRUPEDS on the shared
// _buildQuadruped rig with pastel coats; mane/tail are built as accessories in
// a mane-matching colour (the built-in tail renders in coat colour, so every
// member sets tail:'none' and rebuilds a static tail via qrump accessories).
// pet:true on all — ponies never enter the random-stranger pool.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'my-little-pony', version: 2, label: 'My Little Pony',
  path: ['Cartoons', 'My Little Pony'], builtin: true, franchise: true,
  base: {
    rig: 'quadruped',
    quadruped: {
      sk: 0.8, bodyLen: 620, bodyW: 230, bodyH: 260, legLen: 0.9,
      headR: 150, neckLen: 50, headScale: [1.08, 1.0, 1.05],
      ears: 'pointy', tail: 'none', snout: 0.3, snoutColor: 0xf0d8c8,
    },
  },
  avatars: [
    // Twilight Sparkle — lavender unicorn, navy mane w/ magenta+violet streaks.
    { id: 'my-little-pony/purple-unicorn', label: 'Purple Unicorn (horn, book-smart)',
      rig: 'quadruped', pet: true,
      quadruped: { coat: 0xcc9cdf, earColor: 0xcc9cdf, snoutColor: 0xdcb8ea },
      accessories: [
        { shape: 'cone', size: [26, 150, 0], anchor: 'qhead', pos: [0, 190, -55], rot: [-0.35, 0, 0], color: 0xe8d9a0 },
        { shape: 'box', size: [30, 140, 55], anchor: 'qneck', pos: [0, 40, 10], color: 0x243870 },
        { shape: 'box', size: [26, 130, 50], anchor: 'qneck', pos: [-18, 10, 60], color: 0x243870 },
        { shape: 'box', size: [16, 120, 45], anchor: 'qneck', pos: [-20, 25, 20], color: 0xb35fce },
        { shape: 'box', size: [14, 110, 42], anchor: 'qneck', pos: [-22, -5, 75], color: 0x8a5fce },
        { shape: 'box', size: [40, 220, 60], anchor: 'qrump', pos: [0, -60, 40], rot: [0.5, 0, 0], color: 0x243870 },
        { shape: 'box', size: [22, 160, 40], anchor: 'qrump', pos: [10, -160, 90], rot: [0.7, 0, 0], color: 0xb35fce },
      ],
      personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['📚', '✨', '🔮', '🤓'] },

    // Rainbow Dash — cyan pegasus, spiky 6-stripe rainbow mane + tail, wings.
    // approx: dropped the purple mane stripe to keep <=10 primitives.
    { id: 'my-little-pony/rainbow-pegasus', label: 'Rainbow Pegasus (fastest flyer)',
      rig: 'quadruped', pet: true,
      quadruped: { coat: 0x9bdbf5, earColor: 0x9bdbf5, snoutColor: 0xcaeefb },
      accessories: [
        { shape: 'sphere', size: [150, 40, 230], anchor: 'qback', pos: [-140, 40, -180], rot: [0.15, -0.35, 0.5], color: 0x9bdbf5 },
        { shape: 'sphere', size: [150, 40, 230], anchor: 'qback', pos: [140, 40, -180], rot: [0.15, 0.35, -0.5], color: 0x9bdbf5 },
        { shape: 'box', size: [26, 90, 40], anchor: 'qneck', pos: [0, 60, 0], rot: [0.2, 0, 0], color: 0xec4141 },
        { shape: 'box', size: [24, 85, 38], anchor: 'qneck', pos: [-4, 55, 35], rot: [0.35, 0, 0], color: 0xf2932e },
        { shape: 'box', size: [22, 80, 36], anchor: 'qneck', pos: [-6, 48, 65], rot: [0.5, 0, 0], color: 0xf5df4a },
        { shape: 'box', size: [20, 75, 34], anchor: 'qneck', pos: [-8, 40, 92], rot: [0.6, 0, 0], color: 0x5ecb6e },
        { shape: 'box', size: [18, 70, 32], anchor: 'qback', pos: [-10, 60, -20], rot: [0.3, 0, 0], color: 0x4fa8e0 },
        { shape: 'box', size: [34, 100, 45], anchor: 'qrump', pos: [0, -50, 30], rot: [0.6, 0, 0], color: 0xec4141 },
        { shape: 'box', size: [30, 95, 42], anchor: 'qrump', pos: [8, -110, 55], rot: [0.7, 0.1, 0], color: 0xf5df4a },
        { shape: 'box', size: [26, 90, 38], anchor: 'qrump', pos: [14, -165, 75], rot: [0.8, 0.15, 0], color: 0x4fa8e0 },
      ],
      personality: { bobMul: 0.9, swayMul: 1.05, cadenceMul: 1.35, ampMul: 1.2 },
      bubbles: ['🌈', '⚡', '😎', '🏆'] },

    // Pinkie Pie — pale-pink earth pony, poofy magenta sphere-cluster mane/tail.
    { id: 'my-little-pony/party-pony', label: 'Party Pony (pink, big bouncy mane)',
      rig: 'quadruped', pet: true,
      quadruped: { coat: 0xf5b7d0, earColor: 0xf5b7d0, snoutColor: 0xfbdde9 },
      accessories: [
        { shape: 'sphere', size: 55, anchor: 'qneck', pos: [-10, 70, -10], color: 0xeb458b },
        { shape: 'sphere', size: 50, anchor: 'qneck', pos: [-40, 55, 20], color: 0xeb458b },
        { shape: 'sphere', size: 48, anchor: 'qneck', pos: [-30, 40, 55], color: 0xeb458b },
        { shape: 'sphere', size: 45, anchor: 'qneck', pos: [-8, 65, 45], color: 0xeb458b },
        { shape: 'sphere', size: 42, anchor: 'qback', pos: [-20, 55, -30], color: 0xeb458b },
        { shape: 'sphere', size: 50, anchor: 'qrump', pos: [0, -20, 60], color: 0xeb458b },
        { shape: 'sphere', size: 46, anchor: 'qrump', pos: [16, -35, 90], color: 0xeb458b },
        { shape: 'sphere', size: 42, anchor: 'qrump', pos: [-14, -35, 90], color: 0xeb458b },
      ],
      personality: { bobMul: 1.6, swayMul: 1.3, cadenceMul: 1.3, ampMul: 1.15 },
      bubbles: ['🎉', '🧁', '🎈', '🥳'] },

    // Applejack — orange earth pony, pale-gold tied-back mane, brown Stetson.
    { id: 'my-little-pony/apple-farmer', label: 'Apple Farmer (orange, Stetson hat)',
      rig: 'quadruped', pet: true,
      quadruped: { coat: 0xfaba62, earColor: 0xfaba62, snoutColor: 0xfde6c4 },
      accessories: [
        { shape: 'cylinder', size: [95, 100, 30], anchor: 'qhead', pos: [0, 175, -25], color: 0x8a5a34 },
        { shape: 'cylinder', size: [50, 50, 90], anchor: 'qhead', pos: [0, 220, -25], color: 0x8a5a34 },
        { shape: 'box', size: [34, 90, 50], anchor: 'qneck', pos: [-6, 30, 30], color: 0xfaf5ab },
        { shape: 'box', size: [24, 130, 34], anchor: 'qneck', pos: [-4, -10, 70], rot: [0.4, 0, 0], color: 0xfaf5ab },
        { shape: 'box', size: [14, 24, 34], anchor: 'qneck', pos: [-4, 55, 40], color: 0xd94f4f },
        { shape: 'box', size: [40, 200, 55], anchor: 'qrump', pos: [0, -60, 40], rot: [0.5, 0, 0], color: 0xfaf5ab },
        { shape: 'box', size: [16, 26, 40], anchor: 'qrump', pos: [8, -90, 80], color: 0xd94f4f },
      ],
      personality: { bobMul: 0.8, swayMul: 0.85, cadenceMul: 0.95, ampMul: 1.0 },
      bubbles: ['🍎', '🤠', '🚜', '💪'] },

    // Rarity — near-white unicorn, deep-purple elegant wavy mane w/ curl tip.
    { id: 'my-little-pony/fashion-unicorn', label: 'Fashion Unicorn (white, elegant curl)',
      rig: 'quadruped', pet: true,
      quadruped: { coat: 0xeaeef0, earColor: 0xeaeef0, snoutColor: 0xf5f7f8 },
      accessories: [
        { shape: 'cone', size: [20, 145, 0], anchor: 'qhead', pos: [0, 188, -55], rot: [-0.3, 0, 0], color: 0xf0e6c8 },
        { shape: 'sphere', size: [50, 65, 70], anchor: 'qneck', pos: [-6, 55, 10], color: 0x794897 },
        { shape: 'sphere', size: [46, 58, 62], anchor: 'qneck', pos: [-22, 35, 55], color: 0x794897 },
        { shape: 'sphere', size: [40, 32, 32], anchor: 'qneck', pos: [-30, 5, 95], rot: [0, 0, 0.9], color: 0x4a1767 },
        { shape: 'sphere', size: [55, 75, 90], anchor: 'qrump', pos: [0, -20, 60], color: 0x794897 },
        { shape: 'sphere', size: [36, 30, 30], anchor: 'qrump', pos: [16, -80, 105], rot: [0, 0, 0.9], color: 0x4a1767 },
      ],
      personality: { bobMul: 0.7, swayMul: 0.75, cadenceMul: 0.85, ampMul: 0.85 },
      bubbles: ['💎', '✨', '👗', '💅'] },

    // Fluttershy — pale-yellow pegasus, long straight pale-pink mane, folded wings.
    { id: 'my-little-pony/shy-pegasus', label: 'Shy Pegasus (pale yellow, gentle)',
      rig: 'quadruped', pet: true,
      quadruped: { coat: 0xfaf5ab, earColor: 0xfaf5ab, snoutColor: 0xfdfae0 },
      accessories: [
        { shape: 'sphere', size: [110, 30, 170], anchor: 'qback', pos: [-110, 20, -140], rot: [0.05, -0.2, 0.25], color: 0xfaf5ab },
        { shape: 'sphere', size: [110, 30, 170], anchor: 'qback', pos: [110, 20, -140], rot: [0.05, 0.2, -0.25], color: 0xfaf5ab },
        { shape: 'box', size: [26, 160, 45], anchor: 'qneck', pos: [-8, 20, 20], color: 0xf3b5cf },
        { shape: 'box', size: [22, 150, 40], anchor: 'qneck', pos: [-24, 5, 55], color: 0xf3b5cf },
        { shape: 'box', size: [30, 40, 20], anchor: 'qhead', pos: [10, 60, -70], rot: [0.1, 0, 0.15], color: 0xf3b5cf },
        { shape: 'box', size: [36, 210, 50], anchor: 'qrump', pos: [0, -60, 45], rot: [0.45, 0, 0], color: 0xf3b5cf },
      ],
      personality: { bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.75, ampMul: 0.65 },
      bubbles: ['🦋', '🌸', '🐰', '🤫'] },
  ],
};

export default pack;

// Cartoons ▸ Teenage Mutant Ninja Turtles — franchise pack (opt-in, loaded:false).
// Stylized geometric toon homage — NOT licensed characters, colour + silhouette
// only, no text/decals. The four brothers share ONE turtle body via the pack
// `base`; per member only the mask/buckle colour + a signature weapon differ.
// The rat sensei, reporter ally, and armored villain are bespoke humanoids that
// fully override the shared body. Sizes are mm at sk=1.
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

// Shared turtle accessory stack (mask band + trailing knots, shell dome,
// plastron plate, belt + colour-coded buckle). The belt buckle is colour-coded
// to the mask (the house style has no text/decal capability — see doc Rig gap 4).
function turtleBody(mask: number): AvatarPrimitive[] {
  return [
    { shape: 'box', size: [136, 34, 12], anchor: 'face', pos: [0, 34, 32], color: mask },
    { shape: 'box', size: [30, 110, 8], anchor: 'head', pos: [-118, 16, -44], rot: [0, 0.3, 0], color: mask },
    { shape: 'box', size: [30, 110, 8], anchor: 'head', pos: [118, 16, -44], rot: [0, -0.3, 0], color: mask },
    { shape: 'sphere', size: [300, 240, 220], anchor: 'back', pos: [0, 40, 60], rot: [1.5708, 0, 0], color: 0x2f5233, sphereArc: [0, 6.283, 0, 1.73] }, // shell dome — pole faces +Z (flat opening parallel to torso)
    { shape: 'sphere', size: [180, 200, 20], anchor: 'chest', pos: [0, 110, 78], color: 0xd8c9a0 },
    { shape: 'box', size: [240, 46, 160], anchor: 'hip', pos: [0, 6, 0], color: 0x6b4423 },
    { shape: 'box', size: [40, 40, 20], anchor: 'hip', pos: [0, 6, 88], color: mask },
  ];
}

const pack: AvatarPackDef = {
  id: 'tmnt', version: 3, label: 'Teenage Mutant Ninja Turtles',
  path: ['Cartoons', 'Teenage Mutant Ninja Turtles'], builtin: true, franchise: true,
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 0.92, headR: 130, headShape: 'sphere', limbR: 1.15,
      skin: 0x4a9c53, body: 0x4a9c53, shoe: 0x4a9c53,
      emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
      armL: 1.0, legL: 0.95, footMul: [1.3, 0.8, 1.3],
    },
  },
  avatars: [
    // Leonardo — blue mask, twin katana crossed on the shell.
    { id: 'tmnt/leo', label: 'Leader (blue mask, twin swords)', rig: 'humanoid',
      humanoid: { sk: 0.93 },
      accessories: [
        ...turtleBody(0x2b5faa),
        { shape: 'box', size: [14, 320, 6], anchor: 'back', pos: [-40, 40, 40], rot: [0.15, 0, 0.35], color: 0xb8bcc2 },
        { shape: 'box', size: [14, 320, 6], anchor: 'back', pos: [40, 40, 40], rot: [0.15, 0, -0.35], color: 0xb8bcc2 },
      ],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 }, bubbles: ['⚔️', '🧭', '📜', '🐢'] },

    // Raphael — red mask, bulkiest build, twin sai at the hips.
    // approx: forked sai prong reduced to a plain cylinder (no forked-prop geometry).
    { id: 'tmnt/raph', label: 'Hothead (red mask, twin sai)', rig: 'humanoid',
      humanoid: { sk: 0.90, limbR: 1.25, legL: 0.92 },
      accessories: [
        ...turtleBody(0xc62828),
        { shape: 'cylinder', size: [10, 10, 140], anchor: 'hip', pos: [-110, 0, 40], color: 0xb0b4ba },
        { shape: 'cylinder', size: [10, 10, 140], anchor: 'hip', pos: [110, 0, 40], color: 0xb0b4ba },
      ],
      personality: { bobMul: 1.2, swayMul: 1.3, cadenceMul: 1.15, ampMul: 1.2 }, bubbles: ['😤', '🔥', '💢', '🏍️'] },

    // Donatello — purple mask, tallest/lankiest, tall bo staff on the back.
    { id: 'tmnt/donnie', label: 'Brains (purple mask, bo staff)', rig: 'humanoid',
      humanoid: { sk: 0.95, limbR: 1.1, armL: 1.05, legL: 1.0 },
      accessories: [
        ...turtleBody(0x8b3fa0),
        { shape: 'cylinder', size: [16, 16, 900], anchor: 'back', pos: [-20, 60, 40], rot: [0.1, 0, 0.35], color: 0x7a5230 },
      ],
      personality: { bobMul: 0.9, swayMul: 0.8, cadenceMul: 0.95, ampMul: 0.9 }, bubbles: ['🔧', '💻', '📡', '🤓'] },

    // Michelangelo — orange mask, smallest/roundest, nunchaku in hand.
    // approx: static three-segment nunchaku (no chain-swing physics).
    { id: 'tmnt/mikey', label: 'Party Dude (orange mask, nunchaku)', rig: 'humanoid',
      humanoid: { sk: 0.88, headR: 132, armL: 0.95, legL: 0.92, footMul: [1.35, 0.85, 1.35] },
      accessories: [
        ...turtleBody(0xf47a1f),
        { shape: 'cylinder', size: [14, 14, 110], anchor: 'handR', pos: [-14, 0, 0], color: 0x2a1e14 },
        { shape: 'cylinder', size: [14, 14, 110], anchor: 'handR', pos: [14, -20, 0], color: 0x2a1e14 },
        { shape: 'cylinder', size: [4, 4, 24], anchor: 'handR', pos: [0, 40, 0], rot: [0, 0, 1.57], color: 0x555a60 },
      ],
      personality: { bobMul: 1.4, swayMul: 1.4, cadenceMul: 1.25, ampMul: 1.3 }, bubbles: ['🍕', '🤙', '😝', '🎮'] },

    // Splinter — elderly mutant-rat master, brown robe, snout + rat ears, staff.
    // Ships WITH the rat tail via the tailbone anchor (now implemented).
    { id: 'tmnt/sensei', label: 'Sensei (rat master, walking staff)', rig: 'humanoid',
      humanoid: { sk: 0.86, headR: 118, headShape: 'sphere', limbR: 0.85, skin: 0x7a5230, body: 0x6e4a2e,
        shoe: 0x2a2016, legColor: 0x6e4a2e, emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
        armL: 0.9, legL: 0.85, footMul: [1, 1, 1], earSkip: true },
      accessories: [
        { shape: 'cone', size: [42, 65, 0], anchor: 'face', pos: [0, -6, 40], rot: [1.4, 0, 0], color: 0x7a5230 },
        { shape: 'sphere', size: 48, anchor: 'head', pos: [-70, 70, -10], color: 0x5c3d22 },
        { shape: 'sphere', size: 48, anchor: 'head', pos: [70, 70, -10], color: 0x5c3d22 },
        { shape: 'cylinder', size: [2, 2, 70], anchor: 'face', pos: [-30, -6, 40], rot: [0, 0, 0.3], color: 0x2a2016 },
        { shape: 'cylinder', size: [2, 2, 70], anchor: 'face', pos: [30, -6, 40], rot: [0, 0, -0.3], color: 0x2a2016 },
        { shape: 'box', size: [230, 40, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x141210 },
        { shape: 'cylinder', size: [16, 16, 780], anchor: 'handR', pos: [0, 60, 0], color: 0x4a3420 },
        { shape: 'cylinder', size: [18, 10, 180], anchor: 'tailbone', pos: [0, -40, -40], rot: [0.9, 0, 0], color: 0x5c3d22 },
        { shape: 'cylinder', size: [10, 6, 150], anchor: 'tailbone', pos: [0, -150, -140], rot: [1.2, 0, 0], color: 0x5c3d22 },
      ],
      personality: { bobMul: 0.55, swayMul: 0.45, cadenceMul: 0.65, ampMul: 0.6 }, bubbles: ['🍵', '🧘', '☯️', '📜'] },

    // April O'Neil — human reporter ally, bright yellow jumpsuit, auburn bob.
    { id: 'tmnt/reporter', label: 'Reporter (yellow jumpsuit)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 126, headShape: 'sphere', limbR: 0.95, skin: 0xe8b48c, body: 0xf4c430,
        shoe: 0xf2f2ee, legColor: 0xf4c430, emI: 0.08, hands: 'sphere', eyes: 'almond', steel: false,
        armL: 1.0, legL: 1.0, footMul: [1, 1, 1] },
      accessories: [
        { shape: 'sphere', size: 62, anchor: 'crown', pos: [0, 10, -5], color: 0xa8452a },
        { shape: 'sphere', size: 50, anchor: 'crown', pos: [0, -70, 30], color: 0xa8452a },
        { shape: 'box', size: [230, 24, 150], anchor: 'hip', pos: [0, 30, 0], color: 'tint' },
        { shape: 'cylinder', size: [20, 20, 90], anchor: 'handR', pos: [0, 40, 0], color: 0x1a1a1a },
        { shape: 'box', size: [46, 46, 46], anchor: 'handR', pos: [0, 95, 0], color: 0x1a1a1a },
      ],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.0 }, bubbles: ['🎙️', '📰', '📷', '❗'] },

    // Shredder — armored ninja-master nemesis; spiked steel helmet, dark cape.
    { id: 'tmnt/villain', label: 'Villain (spiked mask, cape)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 128, headShape: 'sphere', limbR: 1.1, skin: 0x2a2a2e, body: 0x8e97a0,
        shoe: 0x585d64, legColor: 0x3a1f24, emI: 0.15, hands: 'box', eyes: 'redvisor', steel: true,
        armL: 1.0, legL: 0.95, footMul: [1, 1, 1], earSkip: true },
      accessories: [
        { shape: 'sphere', size: [148, 150, 148], anchor: 'crown', pos: [0, 20, 0], color: 0x8e97a0, sphereArc: [0, 6.283, 0, 2.83] },
        { shape: 'cone', size: [14, 80, 0], anchor: 'crown', pos: [0, 90, -20], rot: [-0.5, 0, 0], color: 0x51565c },
        { shape: 'cone', size: [14, 70, 0], anchor: 'crown', pos: [-70, 50, 0], rot: [0, 0, -1.0], color: 0x51565c },
        { shape: 'cone', size: [14, 70, 0], anchor: 'crown', pos: [70, 50, 0], rot: [0, 0, 1.0], color: 0x51565c },
        { shape: 'cape', size: [360, 800, 500], anchor: 'back', pos: [0, -240, 30], rot: [0.14, 0, 0], color: 0x3a1f45, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // dark cape
        { shape: 'box', size: [120, 100, 18], anchor: 'shoulderL', pos: [0, 20, 0], color: 0x8e97a0 },
        { shape: 'box', size: [120, 100, 18], anchor: 'shoulderR', pos: [0, 20, 0], color: 0x8e97a0 },
        { shape: 'box', size: [40, 200, 20], anchor: 'chest', pos: [0, 110, 82], color: 0x585d64 },
        { shape: 'box', size: [30, 90, 16], anchor: 'chest', pos: [0, 70, 90], color: 'tint' },
        { shape: 'cone', size: [8, 100, 0], anchor: 'handR', pos: [0, 40, 0], color: 0xb8bcc2 },
      ],
      personality: { bobMul: 0.8, swayMul: 0.7, cadenceMul: 0.9, ampMul: 0.85 }, bubbles: ['⚔️', '😈', '💢', '👹'] },
  ],
};

export default pack;

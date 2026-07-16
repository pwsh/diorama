// Video Games ▸ Pac-Man — franchise pack (dynamic-import only, default
// loaded:false). The two dot-chompers (oversized single-sphere-body technique)
// plus the four maze ghosts (legless `hover` bodies differing only by hue —
// which is faithfully the whole character design). Radical minimalism is
// correct here, not a shortcut. Colour + silhouette only, no letters/likenesses.
// Source: docs/avatars/video-games/pac-man.md.
import type { AvatarDef, AvatarPackDef, AvatarPrimitive } from '../avatars.js';

const DARK = 0x2a2018;

// Wavy scalloped hem in place of legs — four down-pointing cones around the base,
// coloured to the ghost body (same technique as mario.md's Boo hem).
const ghostHem = (col: number): AvatarPrimitive[] => [
  { shape: 'cone', size: [26, 45], anchor: 'hip', pos: [-60, -25, 0], rot: [Math.PI, 0, 0], color: col },
  { shape: 'cone', size: [26, 45], anchor: 'hip', pos: [-20, -25, 30], rot: [Math.PI, 0, 0], color: col },
  { shape: 'cone', size: [26, 45], anchor: 'hip', pos: [20, -25, 30], rot: [Math.PI, 0, 0], color: col },
  { shape: 'cone', size: [26, 45], anchor: 'hip', pos: [60, -25, 0], rot: [Math.PI, 0, 0], color: col },
];

const ghost = (
  member: string, label: string, col: number,
  personality: { bobMul: number; swayMul: number; cadenceMul: number; ampMul: number },
  bubbles: string[],
): AvatarDef => ({
  id: `pac-man/${member}`, label, rig: 'humanoid' as const,
  // approx: arms always build → limbR/armL near-zero + body-matched colour hides
  // the vestigial stubs (no hideLimbs flag yet); hover omits legs entirely.
  humanoid: { sk: 0.8, headR: 128, limbR: 0.12, skin: col, body: col, legColor: col, eyes: 'dots' as const, emI: 0.08, hover: 180, armL: 0.25 },
  accessories: ghostHem(col),
  personality, bubbles,
});

const pack: AvatarPackDef = {
  id: 'pac-man', version: 1, label: 'Pac-Man',
  path: ['Video Games', 'Pac-Man'], builtin: true, franchise: true,
  base: { rig: 'humanoid', humanoid: { headShape: 'sphere', hands: 'sphere', eyes: 'dots', steel: false, emI: 0.05 } },
  avatars: [
    // Pac-Man — oversized yellow sphere body, wedge mouth
    { id: 'pac-man/dot-chomper', label: 'Rolling Yellow Hero (wedge mouth)', rig: 'humanoid',
      humanoid: { sk: 0.72, headR: 150, limbR: 0.55, skin: 0xf5d020, body: 0xf5d020, legColor: 0xf5d020, shoe: 0xd9241f, emI: 0.05, armL: 0.55, legL: 0.55, footMul: [1.1, 0.9, 1.05] },
      accessories: [
        { shape: 'box', size: [130, 45, 10], anchor: 'face', pos: [0, 30, -40], rot: [0.4, 0, 0], color: DARK }, // approx: wedge void (upper jaw)
        { shape: 'box', size: [130, 45, 10], anchor: 'face', pos: [0, -30, -40], rot: [-0.4, 0, 0], color: DARK }, // wedge void (lower jaw)
        { shape: 'box', size: [40, 20, 8], anchor: 'face', pos: [0, 0, -20], color: 0xc23030 }, // tongue
        { shape: 'box', size: [90, 14, 8], anchor: 'face', pos: [0, 60, -30], color: DARK }, // brow
        { shape: 'sphere', size: 46, anchor: 'handL', pos: [0, 0, 0], color: 0xe8720a }, // glove
        { shape: 'sphere', size: 46, anchor: 'handR', pos: [0, 0, 0], color: 0xe8720a }, // glove
      ],
      personality: { bobMul: 1.3, swayMul: 0.3, cadenceMul: 1.4, ampMul: 0.5 }, bubbles: ['🟡', '👻', '😋', '💨'] },
    // Ms. Pac-Man — same yellow ball, red bow + lipstick
    { id: 'pac-man/bow-chomper', label: 'Rolling Yellow Heroine (red bow)', rig: 'humanoid',
      humanoid: { sk: 0.68, headR: 145, limbR: 0.45, skin: 0xf5d020, body: 0xf5d020, legColor: 0xf5d020, shoe: 0xc23030, emI: 0.05, armL: 0.5, legL: 0.68, footMul: [0.85, 0.75, 0.9] },
      accessories: [
        { shape: 'box', size: [70, 50, 20], anchor: 'crown', pos: [-40, 20, 0], rot: [0, 0, 0.3], color: 0xd9241f }, // bow wing L
        { shape: 'box', size: [70, 50, 20], anchor: 'crown', pos: [40, 20, 0], rot: [0, 0, -0.3], color: 0xd9241f }, // bow wing R
        { shape: 'box', size: [20, 20, 20], anchor: 'crown', pos: [0, 20, 0], color: 0xd9241f }, // knot
        { shape: 'box', size: [30, 20, 15], anchor: 'crown', pos: [0, -5, 0], color: DARK }, // hair tuft
        { shape: 'box', size: [130, 45, 10], anchor: 'face', pos: [0, 25, -40], rot: [0.4, 0, 0], color: DARK }, // wedge void (upper)
        { shape: 'box', size: [130, 45, 10], anchor: 'face', pos: [0, -25, -40], rot: [-0.4, 0, 0], color: DARK }, // wedge void (lower)
        { shape: 'box', size: [40, 20, 8], anchor: 'face', pos: [0, 0, -20], color: 0xc23030 }, // tongue
        { shape: 'box', size: [50, 12, 8], anchor: 'face', pos: [0, -45, -30], color: 0xc23030 }, // lipstick
        { shape: 'sphere', size: 8, anchor: 'face', pos: [45, -20, -30], color: DARK }, // beauty mark
        { shape: 'box', size: [120, 10, 8], anchor: 'chest', pos: [0, 62, -6], color: 0xd9b34a }, // necklace
      ],
      personality: { bobMul: 1.15, swayMul: 0.5, cadenceMul: 1.3, ampMul: 0.55 }, bubbles: ['🎀', '💋', '🍒', '😘'] },
    // The four ghosts — identical build, hue-only differentiation
    ghost('chaser-ghost', 'Chasing Spirit (red)', 0xe0342f, { bobMul: 0.9, swayMul: 0.25, cadenceMul: 1.3, ampMul: 0.4 }, ['😠', '🎯', '👹', '💢']),
    ghost('ambush-ghost', 'Ambushing Spirit (pink)', 0xf5aef0, { bobMul: 1.0, swayMul: 0.6, cadenceMul: 1.1, ampMul: 0.5 }, ['😏', '🎯', '💕', '✨']),
    ghost('drifter-ghost', 'Drifting Spirit (cyan)', 0x3fd8e0, { bobMul: 1.3, swayMul: 1.4, cadenceMul: 0.9, ampMul: 0.7 }, ['😵', '💫', '❓', '🌀']),
    ghost('wander-ghost', 'Wandering Spirit (orange)', 0xf0a542, { bobMul: 1.1, swayMul: 1.0, cadenceMul: 0.6, ampMul: 0.3 }, ['😅', '🍊', '😴', '🤪']),
  ],
};

export default pack;

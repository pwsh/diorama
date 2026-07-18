// Video Games ▸ LEGO — franchise pack (dynamic-import only, default
// loaded:false). Classic minifigure archetypes on a shared cylinder-head,
// box-hand, stubby-leg base. Colour + silhouette only, no logos/prints.
// Source: docs/avatars/video-games/lego.md.
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

const MINI_YELLOW = 0xf2cd37, GOLD = 0xd4af37;

// Classic Space suit rig: bubble helmet + chest control panel + twin tanks +
// belt. Shared verbatim across the three colour variants (only body/boots differ).
const SPACE_ACC: AvatarPrimitive[] = [
  { shape: 'sphere', size: 85, anchor: 'crown', pos: [0, -70, 0], color: 0xf5e642, emissive: 0xf5e642, emissiveIntensity: 0.2 },
  { shape: 'box', size: [46, 34, 8], anchor: 'chest', pos: [0, 20, 0], color: 0x9a9a9a },
  { shape: 'cylinder', size: [10, 10, 70], anchor: 'back', pos: [-25, 20, 15], color: 0xcccccc },
  { shape: 'cylinder', size: [10, 10, 70], anchor: 'back', pos: [25, 20, 15], color: 0xcccccc },
  { shape: 'box', size: [180, 20, 6], anchor: 'hip', color: 0x9a9a9a },
];

const pack: AvatarPackDef = {
  id: 'lego', version: 4, label: 'LEGO',
  path: ['Video Games', 'LEGO'], builtin: true, franchise: true,
  // Minifig proportions: cylinder head, box hands, thin limbs, stubby legs,
  // blank yellow head shared by every member.
  base: { rig: 'humanoid', humanoid: { sk: 1.0, headR: 128, headShape: 'cylinder', limbR: 0.72, hands: 'box', skin: MINI_YELLOW, eyes: 'dots', armL: 1.0, legL: 0.7, footMul: [1.15, 0.55, 1.05] } },
  avatars: [
    // Classic Space — red
    { id: 'lego/spaceman-red', label: 'Classic Spaceman (red)', rig: 'humanoid',
      humanoid: { body: 0xd4231c, legColor: 0xd4231c, shoe: 0xffffff, eyes: 'visor', emI: 0.12 },
      accessories: SPACE_ACC,
      personality: { bobMul: 0.7, swayMul: 0.4, cadenceMul: 0.9, ampMul: 0.75 }, bubbles: ['🚀', '🛰️', '👽', '📡'] },
    // Classic Space — white
    { id: 'lego/spaceman-white', label: 'Classic Spaceman (white)', rig: 'humanoid',
      humanoid: { body: 0xf2f2f2, legColor: 0xf2f2f2, shoe: 0x1b1b1b, eyes: 'visor', emI: 0.12 },
      accessories: SPACE_ACC,
      personality: { bobMul: 0.7, swayMul: 0.4, cadenceMul: 0.9, ampMul: 0.75 }, bubbles: ['🚀', '🛰️', '👽', '📡'] },
    // Classic Space — blue
    { id: 'lego/spaceman-blue', label: 'Classic Spaceman (blue)', rig: 'humanoid',
      humanoid: { body: 0x0057a6, legColor: 0x0057a6, shoe: 0xf2f2f2, eyes: 'visor', emI: 0.12 },
      accessories: SPACE_ACC,
      personality: { bobMul: 0.7, swayMul: 0.4, cadenceMul: 0.9, ampMul: 0.75 }, bubbles: ['🚀', '🛰️', '👽', '📡'] },
    // Pirate Captain
    { id: 'lego/pirate-captain', label: 'Pirate Captain', rig: 'humanoid',
      humanoid: { headR: 124, limbR: 0.75, body: 0x1b1b1b, legColor: 0x1b1b1b, shoe: 0x2a2a2a, eyes: 'dots' },
      accessories: [
        { shape: 'cone', size: [75, 70, 75], anchor: 'crown', pos: [0, 0, -20], rot: [1.2, 0, 0], color: 0x1b1b1b },
        { shape: 'cone', size: [75, 70, 75], anchor: 'crown', pos: [0, 0, 20], rot: [-1.2, 0, 0], color: 0x1b1b1b },
        { shape: 'sphere', size: 9, anchor: 'crown', pos: [0, 10, -55], color: 0xf2f2f2 },
        { shape: 'cone', size: [8, 90, 8], anchor: 'crown', pos: [0, 40, 20], rot: [0.6, 0, 0], color: 0xf2f2f2 },
        { shape: 'box', size: [30, 22, 6], anchor: 'face', pos: [-35, 15, -4], color: 0x1b1b1b },
        { shape: 'box', size: [180, 26, 8], anchor: 'chest', pos: [0, 10, -4], rot: [0, 0, 0.6], color: GOLD },
        { shape: 'box', size: [190, 90, 20], anchor: 'hip', color: 0xb22222 },
        { shape: 'cylinder', size: [8, 8, 180], anchor: 'back', pos: [0, 20, 20], rot: [0, 0, 0.5], color: 0xd6d6da },
        { shape: 'box', size: [50, 12, 12], anchor: 'back', pos: [-45, 65, 20], rot: [0, 0, 0.5], color: GOLD },
      ],
      personality: { bobMul: 0.9, swayMul: 1.2, cadenceMul: 0.85 }, bubbles: ['🏴‍☠️', '💰', '🦜', '⚓'] },
    // Knight — Black Falcons
    { id: 'lego/knight-silver', label: 'Knight (silver armor, black falcon)', rig: 'humanoid',
      humanoid: { headR: 120, limbR: 0.78, body: 0x1b1b1b, legColor: 0x1b1b1b, shoe: 0x1b1b1b, eyes: 'slit', steel: true },
      accessories: [
        { shape: 'sphere', size: [80, 85, 80], anchor: 'crown', pos: [0, -70, 0], color: 0xb8b8b8 },
        { shape: 'cone', size: [8, 90, 8], anchor: 'crown', pos: [0, 10, 20], rot: [0.5, 0, 0], color: 0x1e4fa0 },
        { shape: 'box', size: [150, 130, 14], anchor: 'chest', pos: [0, 0, 0], color: 0xc0c0c0 },
        { shape: 'sphere', size: [20, 20, 6], anchor: 'chest', pos: [0, 0, -10], color: 0x101010 },
        { shape: 'cape', size: [150, 300, 225], anchor: 'back', pos: [0, -90, 15], rot: [0.12, 0, 0], color: 0x1b1b1b, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } },
        { shape: 'box', size: [110, 140, 16], anchor: 'handL', pos: [0, -40, -20], color: 0x1b1b1b },
        { shape: 'box', size: [50, 30, 6], anchor: 'handL', pos: [0, -40, -30], color: 0xc0c0c0 },
      ],
      personality: { bobMul: 0.55, swayMul: 0.4, cadenceMul: 0.65, ampMul: 0.85 }, bubbles: ['⚔️', '🛡️', '🐉', '🏰'] },
    // Construction Worker
    { id: 'lego/construction-worker', label: 'Construction Worker', rig: 'humanoid',
      humanoid: { headR: 124, limbR: 0.76, body: 0xff8200, legColor: 0x2b4c7e, shoe: 0x2a2a2a, eyes: 'dots' },
      accessories: [
        { shape: 'sphere', size: [75, 45, 75], anchor: 'crown', pos: [0, -20, 0], rot: [0.2, 0, 0], color: 0xffd500 },
        { shape: 'box', size: [180, 24, 8], anchor: 'chest', pos: [0, -30, 0], color: 0xe8e8e8, emissive: 0xe8e8e8, emissiveIntensity: 0.1 },
        { shape: 'box', size: [180, 20, 8], anchor: 'hip', color: 0x3a3020 },
        { shape: 'cylinder', size: [7, 7, 70], anchor: 'hip', pos: [90, -20, 0], color: 0x5c3a21 },
        { shape: 'box', size: [30, 14, 14], anchor: 'hip', pos: [90, -55, 0], color: 0x8a8a8a },
      ],
      personality: { cadenceMul: 1.0, ampMul: 0.95 }, bubbles: ['🔨', '🚧', '📐', '🏗️'] },
    // Police Officer
    { id: 'lego/police-officer', label: 'Police Officer', rig: 'humanoid',
      humanoid: { headR: 122, limbR: 0.72, body: 0x1e3a5f, legColor: 0x1e3a5f, shoe: 0x1b1b1b, eyes: 'dots' },
      accessories: [
        { shape: 'sphere', size: [70, 45, 75], anchor: 'crown', pos: [0, -15, 0], color: 0x16283f },
        { shape: 'box', size: [150, 10, 40], anchor: 'crown', pos: [0, -30, -60], color: 0x16283f },
        { shape: 'sphere', size: [10, 10, 6], anchor: 'crown', pos: [0, -20, -75], color: GOLD },
        { shape: 'box', size: [24, 24, 6], anchor: 'chest', pos: [-40, 30, 0], color: GOLD, emissive: GOLD, emissiveIntensity: 0.15 },
        { shape: 'box', size: [180, 20, 8], anchor: 'hip', color: 0x1b1b1b },
        { shape: 'box', size: [16, 30, 12], anchor: 'hip', pos: [85, -10, 0], color: 0x2a2a2a },
      ],
      personality: { bobMul: 0.9, swayMul: 0.5, cadenceMul: 1.0, ampMul: 0.9 }, bubbles: ['🚓', '🚨', '📋', '🍩'] },
    // Baseline smiley minifig — deliberately bare
    { id: 'lego/smiley-classic', label: 'Classic Smiley Minifig', rig: 'humanoid',
      humanoid: { body: 0xd01012, legColor: 0x1b1b1b, shoe: 0x1b1b1b, eyes: 'dots' },
      personality: { swayMul: 0.6 }, bubbles: ['😀', '⭐', '🧱', '❤️'] },
    // LEGO Batman — the only minifig here that swaps the blank yellow head for a
    // full cowl headpiece (headShape:'cylinder' now shipped). Source: dc-batman.md.
    { id: 'lego/batman', label: 'Caped Minifig (black/grey, cowl)', rig: 'humanoid',
      humanoid: { headR: 128, headShape: 'cylinder', limbR: 0.72, skin: 0x1c2030, body: 0x161616,
        legColor: 0x161616, shoe: 0x141414, eyes: 'dots', hands: 'box', steel: false,
        armL: 1.0, legL: 0.7, footMul: [1.15, 0.55, 1.05] },
      accessories: [
        { shape: 'cone', size: [8, 36], anchor: 'crown', pos: [-20, 8, 4], rot: [0.25, 0, 0], color: 0x1c2030 }, // cowl ear
        { shape: 'cone', size: [8, 36], anchor: 'crown', pos: [20, 8, 4], rot: [0.25, 0, 0], color: 0x1c2030 },
        { shape: 'cape', size: [90, 130, 100], anchor: 'back', pos: [0, -40, 15], rot: [0.12, 0, 0], color: 0x101010, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // small stiff minifig cape
        { shape: 'box', size: [180, 22, 10], anchor: 'hip', pos: [0, 0, -4], color: 0xf2c744 }, // yellow utility belt
        // approx: no bat-silhouette primitive — yellow oval color-block (see dc-batman Rig gaps #1).
        { shape: 'sphere', size: [15, 11, 2.5], anchor: 'chest', pos: [0, 20, -8], color: 0xf2c744 }],
      personality: { bobMul: 0.8, swayMul: 0.45, cadenceMul: 0.95, ampMul: 0.85 }, bubbles: ['🦇', '🧱', '😎', '🌃'] },
  ],
};

export default pack;

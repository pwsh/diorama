// Sci-Fi ▸ Power Rangers ▸ Mighty Morphin — franchise pack (dynamic-import only).
// Stylized geometric homage: color-blocked suit silhouettes only, no likeness.
// Source doc: docs/avatars/sci-fi/power-rangers-mighty-morphin.md.
import type { AvatarPackDef } from '../avatars.js';

const WHITE = 0xf2f0ea, GOLD = 0xc9a227, CHROME = 0xb8b8b8;

const pack: AvatarPackDef = {
  id: 'power-rangers-mighty-morphin', version: 3, label: 'Power Rangers: Mighty Morphin',
  path: ['Sci-Fi', 'Power Rangers', 'Mighty Morphin'], builtin: true, franchise: true,
  // Ideal shared base: one suited body — the six Ranger suits are near-identical
  // geometry, distinguished almost entirely by helmet/suit color per member.
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1.0, headR: 126, headShape: 'sphere', hands: 'box', eyes: 'visor',
      steel: false, emI: 0, shoe: WHITE, footMul: [1.0, 1.0, 1.0], limbR: 1.0,
    },
  },
  avatars: [
    // Jason Lee Scott — Red Ranger (T-Rex). skin colors head+hands (deviation, see doc).
    { id: 'power-rangers-mighty-morphin/jason-red-ranger', label: 'Red Ranger (red suit)', rig: 'humanoid',
      humanoid: { skin: 0xd6231f, body: 0xd6231f },
      accessories: [
        { shape: 'box', size: [90, 18, 14], anchor: 'face', pos: [0, -24, -10], color: CHROME },
        { shape: 'cylinder', size: [23, 23, 8], anchor: 'chest', pos: [0, 22, -12], color: GOLD },
        { shape: 'box', size: [150, 30, 16], anchor: 'hip', pos: [0, 0, -6], color: 0x1a1a1a },
        { shape: 'box', size: [50, 40, 10], anchor: 'hip', pos: [0, 0, -12], color: GOLD }],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🦖', '⚔️', '🛡️', '😤'] },
    // Zack Taylor — Black Ranger (Mastodon).
    { id: 'power-rangers-mighty-morphin/zack-black-ranger', label: 'Black Ranger (black suit)', rig: 'humanoid',
      humanoid: { skin: 0x1a1a1a, body: 0x1a1a1a, limbR: 1.05 },
      accessories: [
        { shape: 'cone', size: [8, 26], anchor: 'face', pos: [-14, -24, -12], rot: [Math.PI, 0, 0], color: CHROME },
        { shape: 'cone', size: [8, 26], anchor: 'face', pos: [14, -24, -12], rot: [Math.PI, 0, 0], color: CHROME },
        { shape: 'cylinder', size: [23, 23, 8], anchor: 'chest', pos: [0, 22, -12], color: GOLD },
        { shape: 'box', size: [150, 30, 16], anchor: 'hip', pos: [0, 0, -6], color: 0x2a2a2a },
        { shape: 'box', size: [50, 40, 10], anchor: 'hip', pos: [0, 0, -12], color: GOLD }],
      personality: { bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.15, ampMul: 1.05 },
      bubbles: ['🐘', '🪓', '🕺', '😄'] },
    // Billy Cranston — Blue Ranger (Triceratops).
    { id: 'power-rangers-mighty-morphin/billy-blue-ranger', label: 'Blue Ranger (blue suit)', rig: 'humanoid',
      humanoid: { skin: 0x2a63c9, body: 0x2a63c9, limbR: 0.95 },
      accessories: [
        { shape: 'cone', size: [9, 20], anchor: 'face', pos: [0, -24, -14], rot: [-Math.PI / 2, 0, 0], color: CHROME },
        { shape: 'cylinder', size: [23, 23, 8], anchor: 'chest', pos: [0, 22, -12], color: GOLD },
        { shape: 'box', size: [150, 30, 16], anchor: 'hip', pos: [0, 0, -6], color: 0x1c3a78 },
        { shape: 'box', size: [50, 40, 10], anchor: 'hip', pos: [0, 0, -12], color: GOLD }],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['🦕', '🔬', '🛠️', '🤓'] },
    // Trini Kwan — Yellow Ranger (Sabertooth).
    { id: 'power-rangers-mighty-morphin/trini-yellow-ranger', label: 'Yellow Ranger (yellow suit)', rig: 'humanoid',
      humanoid: { sk: 0.97, headR: 124, skin: 0xf5c400, body: 0xf5c400, limbR: 0.9 },
      accessories: [
        { shape: 'cone', size: [7, 24], anchor: 'face', pos: [-13, -24, -12], rot: [Math.PI, 0, 0], color: CHROME },
        { shape: 'cone', size: [7, 24], anchor: 'face', pos: [13, -24, -12], rot: [Math.PI, 0, 0], color: CHROME },
        { shape: 'cylinder', size: [23, 23, 8], anchor: 'chest', pos: [0, 22, -12], color: GOLD },
        { shape: 'box', size: [150, 30, 16], anchor: 'hip', pos: [0, 0, -6], color: 0xc9a300 },
        { shape: 'box', size: [50, 40, 10], anchor: 'hip', pos: [0, 0, -12], color: GOLD }],
      personality: { bobMul: 0.75, swayMul: 0.55, cadenceMul: 0.9, ampMul: 0.8 },
      bubbles: ['🐯', '🗡️', '🧘', '😌'] },
    // Kimberly Hart — Pink Ranger (Pterodactyl). Only member with a skirt silhouette.
    { id: 'power-rangers-mighty-morphin/kimberly-pink-ranger', label: 'Pink Ranger (pink suit, skirt)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, skin: 0xf24f9c, body: 0xf24f9c, limbR: 0.85 },
      accessories: [
        { shape: 'cone', size: [7, 22], anchor: 'face', pos: [0, -26, -14], rot: [-Math.PI / 2, 0, 0], color: CHROME },
        { shape: 'cylinder', size: [23, 23, 8], anchor: 'chest', pos: [0, 22, -12], color: GOLD },
        { shape: 'box', size: [150, 30, 16], anchor: 'hip', pos: [0, 0, -6], color: 0xd93f89 },
        { shape: 'box', size: [50, 40, 10], anchor: 'hip', pos: [0, 0, -12], color: GOLD },
        // short flared wrap skirt (legs stay visible) — a shorter variant of the gown-cone recipe
        { shape: 'cone', size: [120, 220], anchor: 'hip', pos: [0, -10, 0], color: 0xd93f89 }],
      personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.0, ampMul: 0.95 },
      bubbles: ['🦅', '🏹', '🤸', '💕'] },
    // Tommy Oliver — Green Ranger (Dragon Shield). See doc for White Ranger alt-state.
    { id: 'power-rangers-mighty-morphin/tommy-green-ranger', label: 'Green Ranger (gold dragon shield)', rig: 'humanoid',
      humanoid: { skin: 0x1e7a38, body: 0x1e7a38 },
      accessories: [
        { shape: 'sphere', size: [75, 85, 13], anchor: 'chest', pos: [0, 10, -16], color: GOLD },
        { shape: 'box', size: [150, 18, 10], anchor: 'neck', pos: [0, -2, -8], color: GOLD },
        { shape: 'cylinder', size: [25, 25, 20], anchor: 'shoulderL', color: GOLD },
        { shape: 'cylinder', size: [25, 25, 20], anchor: 'shoulderR', color: GOLD },
        { shape: 'box', size: [30, 90, 20], anchor: 'hip', pos: [70, -10, -8], color: 0x1a1a1a }],
      personality: { bobMul: 0.95, swayMul: 0.8, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['🐉', '🎺', '⚔️', '🤔'] },
    // Zordon — floating disembodied mentor head in an energy tube.
    { id: 'power-rangers-mighty-morphin/zordon-mentor', label: 'Floating mentor (giant head, energy tube)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 175, headShape: 'oval', skin: 0x6fa8dc, body: 0x274472, shoe: 0x274472,
        eyes: 'almond', emI: 0.15, hands: 'sphere', hover: 380, opacity: 0.85, limbR: 0.55, armL: 0.45 },
      accessories: [
        { shape: 'sphere', size: [130, 60, 130], anchor: 'crown', pos: [0, 0, 0], color: 0xb8b4a8, sphereArc: [0, Math.PI * 2, 0, 0.35] },
        { shape: 'box', size: [55, 20, 10], anchor: 'face', pos: [0, -30, -10], color: 0xc8c4b4 },
        { shape: 'box', size: [150, 20, 8], anchor: 'chest', pos: [0, 30, -8], color: 0x1c3a5e },
        // approx: the energy tube can't be translucent (AvatarPrimitive has no opacity) or
        // stay room-fixed — reduced to a glowing containment base ring under the float.
        { shape: 'cylinder', size: [200, 200, 40], anchor: 'root', pos: [0, -360, 0], color: 0x9fd8f0, emissiveIntensity: 0.25 }],
      personality: { bobMul: 0.25, swayMul: 0.2, cadenceMul: 0.4, ampMul: 0.25 },
      bubbles: ['🌌', '🔮', '📡', '🕊️'] },
    // Alpha 5 — short command-center robot, gold dome + flashing red visor.
    { id: 'power-rangers-mighty-morphin/alpha-5-robot', label: 'Command-center robot (gold dome, red visor)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 110, headShape: 'cylinder', skin: GOLD, body: 0x1a1a1a, legColor: GOLD,
        shoe: 0x8a1f1f, eyes: 'redvisor', emI: 0.3, steel: true, hands: 'box', limbR: 0.85, armL: 0.85, legL: 0.75, footMul: [0.9, 0.8, 0.9] },
      accessories: [
        { shape: 'cylinder', size: [5, 5, 60], anchor: 'crown', pos: [0, 0, 0], color: GOLD },
        { shape: 'box', size: [40, 50, 8], anchor: 'chest', pos: [-14, 10, -10], rot: [0, 0, 0.5], color: 0xf5c400 },
        { shape: 'box', size: [40, 50, 8], anchor: 'chest', pos: [14, 10, -10], rot: [0, 0, -0.5], color: 0xf5c400 },
        { shape: 'box', size: [40, 24, 36], anchor: 'shoulderL', color: GOLD },
        { shape: 'box', size: [40, 24, 36], anchor: 'shoulderR', color: GOLD },
        { shape: 'sphere', size: 8, anchor: 'head', pos: [-110, 0, 0], color: 0x8a7328 },
        { shape: 'sphere', size: 8, anchor: 'head', pos: [110, 0, 0], color: 0x8a7328 }],
      personality: { bobMul: 1.1, swayMul: 0.4, cadenceMul: 1.25, ampMul: 0.6 },
      bubbles: ['😨', '📡', '🔧', '🤖'] },
    // Rita Repulsa — space witch, black/gold gown + horned headdress + wand.
    { id: 'power-rangers-mighty-morphin/rita-repulsa', label: 'Space witch (black/gold gown, horns)', rig: 'humanoid',
      humanoid: { skin: 0xb8ae9c, body: 0x1c1a1e, legColor: 0x1c1a1e, shoe: 0x1c1a17, eyes: 'shades', hands: 'sphere', limbR: 0.9, gown: true },
      accessories: [
        { shape: 'cone', size: [150, 700], anchor: 'hip', pos: [0, -80, 0], color: 0x1c1a1e },
        { shape: 'cone', size: [12, 160], anchor: 'crown', pos: [-30, 10, -10], rot: [-0.3, 0, 0.4], color: 0x9a9a92 },
        { shape: 'cone', size: [12, 160], anchor: 'crown', pos: [30, 10, -10], rot: [-0.3, 0, -0.4], color: 0x9a9a92 },
        { shape: 'box', size: [14, 30, 110], anchor: 'crown', pos: [0, 4, 0], color: GOLD },
        { shape: 'cone', size: [130, 220], anchor: 'back', pos: [0, 60, 20], rot: [-0.5, 0, 0], color: 0x9a9a92 },
        { shape: 'sphere', size: 15, anchor: 'chest', pos: [0, 30, -12], color: 0x8a1f1f },
        { shape: 'cylinder', size: [7, 7, 260], anchor: 'handR', pos: [0, 120, 0], color: GOLD },
        { shape: 'sphere', size: 13, anchor: 'handR', pos: [0, 250, 0], color: 0x8a1f1f, emissiveIntensity: 0.4 }],
      personality: { bobMul: 0.7, swayMul: 1.1, cadenceMul: 0.8, ampMul: 0.9 },
      bubbles: ['😈', '🪄', '🌑', '😤'] },
    // Goldar — hulking gold-armored winged general with a scorpion tail + sword.
    { id: 'power-rangers-mighty-morphin/goldar-general', label: 'Winged general (gold armor, wings)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 132, headShape: 'box', skin: GOLD, body: 0xb8934a, legColor: GOLD,
        shoe: 0x8a7328, eyes: 'redvisor', emI: 0.25, hands: 'box', steel: true, limbR: 1.15, armL: 1.05, legL: 1.0, footMul: [1.1, 1.0, 1.1] },
      accessories: [
        { shape: 'cone', size: [25, 50], anchor: 'face', pos: [0, -20, -30], rot: [-Math.PI / 2, 0, 0], color: 0xb8934a },
        { shape: 'box', size: [90, 30, 30], anchor: 'crown', pos: [0, 0, 20], color: 0x8a7328 },
        { shape: 'box', size: [70, 60, 50], anchor: 'shoulderL', color: GOLD },
        { shape: 'box', size: [70, 60, 50], anchor: 'shoulderR', color: GOLD },
        // approx: folded wings — flattened cones aren't possible, so swept boxes on the back
        { shape: 'box', size: [24, 320, 200], anchor: 'back', pos: [-80, -20, 20], rot: [0, -0.3, 0.2], color: 0x8a7328, animate: { kind: 'flap', speed: 1.3, amp: 0.3 } }, // wing L
        { shape: 'box', size: [24, 320, 200], anchor: 'back', pos: [80, -20, 20], rot: [0, 0.3, -0.2], color: 0x8a7328, animate: { kind: 'flap', speed: 1.3, amp: -0.3 } }, // wing R (mirrored amp)
        { shape: 'cylinder', size: [8, 24, 160], anchor: 'tailbone', pos: [0, 0, 20], rot: [-0.6, 0, 0], color: GOLD },
        { shape: 'cone', size: [10, 24], anchor: 'tailbone', pos: [0, 130, 70], color: 0x3a2a1e },
        { shape: 'box', size: [16, 300, 16], anchor: 'handR', pos: [0, 140, 0], color: 0xd8d8d8 }],
      personality: { bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.7, ampMul: 0.9 },
      bubbles: ['🗡️', '🐒', '🔥', '😠'] },
  ],
};

export default pack;

// Sci-Fi ▸ Star Wars ▸ The Mandalorian — franchise pack (dynamic-import only).
// Stylized geometric homage: beskar/armor silhouette + color, no likeness.
// Source doc: docs/avatars/sci-fi/star-wars-mandalorian.md.
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

// approx: no shoulder anchor — pauldrons are shoulderL/R boxes tilted outward.
const pauldrons = (col: number, size: [number, number, number] = [70, 55, 50]): AvatarPrimitive[] => [
  { shape: 'box', size, anchor: 'shoulderL', rot: [0, 0, 0.2], color: col, emissiveIntensity: 0 },
  { shape: 'box', size, anchor: 'shoulderR', rot: [0, 0, -0.2], color: col, emissiveIntensity: 0 },
];
// approx: T-visor — thin vertical dark bar layered over the 'visor' band.
const TVISOR: AvatarPrimitive = { shape: 'box', size: [12, 64, 8], anchor: 'face', pos: [0, -4, -10], color: 0x1a1a1a, emissiveIntensity: 0 };

const pack: AvatarPackDef = {
  id: 'star-wars-mandalorian', version: 3, label: 'Star Wars: The Mandalorian',
  path: ['Sci-Fi', 'Star Wars', 'The Mandalorian'], builtin: true, franchise: true,
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'box',
      eyes: 'visor', steel: false, emI: 0, armL: 1.0, legL: 1.0,
      footMul: [1.0, 1.0, 1.0], shoe: 0x1c1a17,
    },
  },
  avatars: [
    // Din Djarin
    { id: 'star-wars-mandalorian/beskar-bounty-hunter', label: 'Bounty hunter (silver beskar, cape)', rig: 'humanoid',
      humanoid: { skin: 0xc7c9cc, body: 0xc7c9cc, legColor: 0xa8abb0, shoe: 0x2a2622, steel: true, limbR: 1.05 },
      accessories: [
        { shape: 'cylinder', size: [15, 15, 30], anchor: 'crown', pos: [40, 20, 0], rot: [0.3, 0, 0], color: 0x8a8a8a, emissiveIntensity: 0 },
        ...pauldrons(0xc7c9cc),
        { shape: 'cape', size: [320, 600, 480], anchor: 'back', pos: [0, -140, 12], rot: [0.12, 0, 0], color: 0x3b3b3d },
        { shape: 'box', size: [160, 40, 20], anchor: 'hip', pos: [0, 0, -6], color: 0x2a2622, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 60, 25], anchor: 'hip', pos: [70, -10, -6], color: 0x1c1a17, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [17, 17, 6], anchor: 'chest', pos: [0, 20, -12], rot: [1.57, 0, 0], color: 0x8a8a8a, emissiveIntensity: 0 },
        TVISOR],
      personality: { bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.8 },
      bubbles: ['🛡️', '🔫', '🎯', '🤨'] },
    // Grogu — the Child (green, huge drooping ears)
    { id: 'star-wars-mandalorian/foundling-child', label: 'The Child (green, brown robe)', rig: 'humanoid',
      humanoid: { sk: 0.32, headR: 108, skin: 0x7cb342, body: 0xd8c9a3, legColor: 0xd8c9a3, shoe: 0x7cb342, eyes: 'dots', hands: 'sphere', limbR: 0.85, armL: 0.8, legL: 0.7 },
      accessories: [
        { shape: 'cone', size: [45, 140, 45], anchor: 'head', pos: [-95, -10, 0], rot: [0, 0, 2.4], color: 0x7cb342, emissiveIntensity: 0 },
        { shape: 'cone', size: [45, 140, 45], anchor: 'head', pos: [95, -10, 0], rot: [0, 0, -2.4], color: 0x7cb342, emissiveIntensity: 0 },
        { shape: 'sphere', size: [140, 60, 140], anchor: 'crown', pos: [0, -10, 10], rot: [0.25, 0, 0], color: 0xd8c9a3, emissiveIntensity: 0, sphereArc: [0, 6.283, 0, 1.9] },
        { shape: 'box', size: [90, 14, 8], anchor: 'chest', pos: [0, 10, -8], rot: [0, 0, 0.4], color: 0xc4b48c, emissiveIntensity: 0 }],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 0.75, ampMul: 0.6 },
      bubbles: ['🍪', '🥣', '🔮', '😴'] },
    // Cobb Vanth — the Marshal (bare-headed default, single red pauldron)
    { id: 'star-wars-mandalorian/tatooine-marshal', label: 'Marshal (worn green/tan armor, red pauldron)', rig: 'humanoid',
      humanoid: { skin: 0x8a5a3c, body: 0xc9a86a, legColor: 0x5c6b3f, shoe: 0x3a2a1e, eyes: 'dots', limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [150, 20, 10], anchor: 'neck', pos: [0, 0, -8], color: 0x8a2020, emissiveIntensity: 0 },
        // single asymmetric red pauldron on the wearer's left only
        { shape: 'box', size: [75, 60, 55], anchor: 'shoulderL', rot: [0, 0, 0.2], color: 0x8a1f1f, emissiveIntensity: 0 },
        { shape: 'box', size: [60, 40, 10], anchor: 'hip', pos: [60, 0, -6], color: 0x7a1f2b, emissiveIntensity: 0 },
        { shape: 'sphere', size: [128, 38, 128], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x3a2a1e, emissiveIntensity: 0 }],
      personality: { bobMul: 0.9, swayMul: 0.9, cadenceMul: 0.85, ampMul: 0.85 },
      bubbles: ['🤠', '🏜️', '🔫', '🛡️'] },
    // Phase-III Dark Trooper
    { id: 'star-wars-mandalorian/dark-trooper', label: 'Dark trooper (black combat droid)', rig: 'humanoid',
      humanoid: { sk: 1.12, headR: 130, headShape: 'box', skin: 0x1c1c1e, body: 0x1c1c1e, legColor: 0x1c1c1e, shoe: 0x2a2a2c, eyes: 'redvisor', emI: 0.3, steel: true, limbR: 1.3, armL: 1.05, legL: 1.0, footMul: [1.3, 1.2, 1.3] },
      accessories: [
        ...pauldrons(0x1c1c1e, [90, 75, 70]),
        { shape: 'box', size: [16, 16, 16], anchor: 'neck', pos: [0, 6, -6], color: 0xb0b0b0, emissiveIntensity: 0.1 },
        { shape: 'box', size: [16, 16, 16], anchor: 'shoulderL', pos: [10, -50, 0], color: 0xb0b0b0, emissiveIntensity: 0.1 },
        { shape: 'box', size: [16, 16, 16], anchor: 'shoulderR', pos: [-10, -50, 0], color: 0xb0b0b0, emissiveIntensity: 0.1 }],
      personality: { bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.55, ampMul: 0.6 },
      bubbles: ['💀', '⚙️', '🔴', '👊'] },
    // The Armorer — gold horned helmet
    { id: 'star-wars-mandalorian/armor-forgemaster', label: 'Armorer (gold horned helmet, apron)', rig: 'humanoid',
      humanoid: { sk: 0.98, headR: 126, skin: 0xb8934a, body: 0x2a2420, legColor: 0x2a2420, shoe: 0x1c1814, eyes: 'visor', steel: true, limbR: 1.0 },
      accessories: [
        { shape: 'cone', size: [18, 40, 18], anchor: 'crown', pos: [-40, 0, 0], color: 0x5a5a5c, emissiveIntensity: 0 },
        { shape: 'cone', size: [18, 40, 18], anchor: 'crown', pos: [40, 0, 0], color: 0x5a5a5c, emissiveIntensity: 0 },
        { shape: 'cone', size: [14, 22, 14], anchor: 'crown', pos: [-22, 4, 0], color: 0x5a5a5c, emissiveIntensity: 0 },
        { shape: 'cone', size: [14, 22, 14], anchor: 'crown', pos: [22, 4, 0], color: 0x5a5a5c, emissiveIntensity: 0 },
        { shape: 'cone', size: [10, 14, 10], anchor: 'crown', pos: [0, 6, 0], color: 0x5a5a5c, emissiveIntensity: 0 },
        { shape: 'box', size: [10, 14, 140], anchor: 'crown', pos: [0, 0, 20], color: 0x5a5a5c, emissiveIntensity: 0 },
        { shape: 'cone', size: [190, 260, 190], anchor: 'hip', pos: [0, -60, 0], color: 0x2e2115, emissiveIntensity: 0 }],
      personality: { bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.8, ampMul: 0.7 },
      bubbles: ['🔥', '⚒️', '🛡️', '📿'] },
    // Imperial remnant shock trooper
    // approx: redvisor color is fixed red — use plain 'visor' (black band) + T bar.
    { id: 'star-wars-mandalorian/remnant-trooper', label: 'Shock trooper (white Imperial armor)', rig: 'humanoid',
      humanoid: { skin: 0xe6e2d8, body: 0xe6e2d8, legColor: 0xe6e2d8, shoe: 0x1c1a17, eyes: 'visor', emI: 0, limbR: 1.0 },
      accessories: [
        ...pauldrons(0xe6e2d8, [60, 30, 45]),
        { shape: 'box', size: [50, 30, 10], anchor: 'chest', pos: [0, 10, -8], color: 0x1c1a17, emissiveIntensity: 0 },
        TVISOR],
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 1.0, ampMul: 0.75 },
      bubbles: ['🎯', '🔫', '📡', '😬'] },
    // Bo-Katan Kryze — blue-grey armor, owl-wing helm
    { id: 'star-wars-mandalorian/nite-owl-warrior', label: 'Warrior (blue-grey armor, owl helm)', rig: 'humanoid',
      humanoid: { sk: 0.98, headR: 124, skin: 0x5b7a99, body: 0x5b7a99, legColor: 0x8a97a3, shoe: 0x2a2622, eyes: 'visor', steel: true, limbR: 0.95, armL: 0.98 },
      accessories: [
        { shape: 'cone', size: [20, 60, 20], anchor: 'crown', pos: [-45, 10, 20], rot: [0.4, 0, 0.3], color: 0x8a97a3, emissiveIntensity: 0 },
        { shape: 'cone', size: [20, 60, 20], anchor: 'crown', pos: [45, 10, 20], rot: [0.4, 0, -0.3], color: 0x8a97a3, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [12, 12, 32], anchor: 'crown', pos: [35, 15, 0], rot: [0.3, 0, 0], color: 0x8a8a8a, emissiveIntensity: 0 },
        ...pauldrons(0x5b7a99, [68, 52, 48]),
        TVISOR],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 1.0, ampMul: 0.9 },
      bubbles: ['⚔️', '👑', '🦉', '🛡️'] },
    // IG-11 — assassin-turned-nurse droid
    { id: 'star-wars-mandalorian/nurse-droid', label: 'Nurse droid (white/red)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 96, headShape: 'box', skin: 0xd6d2c8, body: 0xd6d2c8, legColor: 0xb0aca2, shoe: 0x8a867c, eyes: 'redvisor', emI: 0.35, hands: 'box', limbR: 0.55, armL: 1.1, legL: 1.15, footMul: [0.7, 0.8, 0.9] },
      accessories: [
        { shape: 'box', size: [180, 16, 10], anchor: 'chest', pos: [0, 10, -8], rot: [0, 0, 0.5], color: 0x8a1f1f, emissiveIntensity: 0 },
        { shape: 'box', size: [180, 16, 10], anchor: 'chest', pos: [0, 10, -8], rot: [0, 0, -0.5], color: 0x8a1f1f, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [8, 8, 30], anchor: 'head', pos: [-40, 40, 0], color: 0x8a867c, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [8, 8, 30], anchor: 'head', pos: [40, 40, 0], color: 0x8a867c, emissiveIntensity: 0 },
        { shape: 'box', size: [70, 10, 40], anchor: 'crown', pos: [0, 0, 0], color: 0xb0aca2, emissiveIntensity: 0 }],
      personality: { bobMul: 0.2, swayMul: 0.1, cadenceMul: 1.1, ampMul: 0.7 },
      bubbles: ['💉', '🩹', '🤖', '⚠️'] },
    // Imperial remnant warlord (Moff-style commander): silver-grey slicked hair, black
    // high-collar officer uniform, dark cape — menacing but simple. (v2 addition.)
    { id: 'star-wars-mandalorian/imperial-warlord', label: 'Imperial officer (black uniform, dark cape)', rig: 'humanoid',
      humanoid: { skin: 0xd8b79a, body: 0x161616, legColor: 0x161616, shoe: 0x141210, eyes: 'dots', emI: 0.1, hands: 'box', limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: [124, 40, 124], anchor: 'crown', pos: [0, -4, 4], rot: [0.25, 0, 0], color: 0xb8b8b0, emissiveIntensity: 0 },
        // stiff high collar on the neck anchor
        { shape: 'box', size: [150, 60, 20], anchor: 'neck', pos: [0, 10, -8], color: 0x0e0e10, emissiveIntensity: 0 },
        // rank insignia — the pack's one 'tint' accent so sensor color coding survives
        { shape: 'box', size: [40, 14, 6], anchor: 'chest', pos: [-50, 90, -10], color: 'tint', emissiveIntensity: 0 },
        { shape: 'cape', size: [340, 644, 500], anchor: 'back', pos: [0, -180, 12], rot: [0.12, 0, 0], color: 0x101012 }],
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.85 },
      bubbles: ['🖤', '😠', '⚡', '📡'] },
  ],
};

export default pack;

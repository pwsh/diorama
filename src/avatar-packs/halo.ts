// Video Games ▸ Halo — franchise pack (dynamic-import only).
// Stylized geometric homage: military sci-fi color-blocking only, no likeness.
// Source doc: docs/avatars/video-games/halo.md (canonical path ['Video Games','Halo']).
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'halo', version: 1, label: 'Halo',
  path: ['Video Games', 'Halo'], builtin: true, franchise: true,
  avatars: [
    // Master Chief (Spartan-117) — bulky olive Mjolnir armor, gold visor (rig renders cyan).
    { id: 'halo/spartan-supersoldier', label: 'Supersoldier (bulky green armor, gold-visored helmet)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 128, headShape: 'sphere', skin: 0x597859, body: 0x597859, legColor: 0x46614a, shoe: 0x2e3f30,
        eyes: 'visor', emI: 0.1, steel: true, hands: 'box', limbR: 1.25, armL: 1.05, legL: 1.0, footMul: [1.1, 1.05, 1.1] },
      accessories: [
        { shape: 'cylinder', size: [7, 7, 50], anchor: 'crown', pos: [40, 20, -30], color: 0x33363c },
        // approx: no shoulder anchor for the broad pauldrons — chest boxes offset outward + raised
        { shape: 'box', size: [150, 100, 130], anchor: 'chest', pos: [-90, 40, 0], color: 0x46614a },
        { shape: 'box', size: [150, 100, 130], anchor: 'chest', pos: [90, 40, 0], color: 0x46614a },
        { shape: 'box', size: [130, 160, 90], anchor: 'back', pos: [0, 0, 20], color: 0x3f5940 },
        { shape: 'box', size: [60, 50, 30], anchor: 'hip', pos: [70, -10, -8], color: 0x2e3f30 },
        { shape: 'box', size: [40, 20, 8], anchor: 'chest', pos: [0, 0, -12], color: 'accent', emissiveIntensity: 0.4 }],
      personality: { bobMul: 0.8, swayMul: 0.5, cadenceMul: 0.9, ampMul: 1.05 },
      bubbles: ['🎯', '🛡️', '⭐', '💪'] },
    // Cortana — translucent hovering blue AI hologram; body IS the identity tint.
    { id: 'halo/ai-companion', label: 'AI companion (translucent blue hologram)', rig: 'humanoid',
      // legColor/shoe don't accept 'tint' (only skin/body do); hover omits legs anyway.
      humanoid: { sk: 0.9, headR: 112, headShape: 'sphere', skin: 'tint', body: 'tint',
        eyes: 'almond', emI: 0.35, opacity: 0.55, hover: 260, hands: 'sphere', limbR: 0.75, armL: 0.95, legL: 0.95 },
      accessories: [
        { shape: 'sphere', size: [110, 40, 110], anchor: 'crown', pos: [0, 0, 0], color: 'tint', emissiveIntensity: 0.1 },
        { shape: 'box', size: [90, 10, 10], anchor: 'chest', pos: [0, 10, -10], color: 'accent', emissiveIntensity: 0.5 },
        { shape: 'sphere', size: 10, anchor: 'head', pos: [60, 60, 0], color: 'accent', emissiveIntensity: 0.5 }],
      personality: { bobMul: 0.3, swayMul: 0.4, cadenceMul: 1.0, ampMul: 0.5 },
      bubbles: ['💾', '📡', '🧠', '💡'] },
    // The Arbiter (Sangheili) — scaly hide, bronze combat harness, mandibled jaw.
    { id: 'halo/elite-commander', label: 'Elite commander (alien warrior, bronze harness, mandibles)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 118, headShape: 'oval', skin: 0x3d4a42, body: 0xa8763f, legColor: 0x7a5730, shoe: 0x3d4a42,
        eyes: 'slit', emI: 0.12, steel: true, hands: 'box', limbR: 1.0, armL: 1.05, legL: 1.1 },
      accessories: [
        { shape: 'box', size: [20, 60, 15], anchor: 'face', pos: [-18, -20, -14], rot: [0, 0, 0.15], color: 0x3d4a42 },
        { shape: 'box', size: [20, 60, 15], anchor: 'face', pos: [18, -20, -14], rot: [0, 0, -0.15], color: 0x3d4a42 },
        { shape: 'box', size: [100, 30, 40], anchor: 'crown', pos: [0, 0, 0], color: 0xa8763f },
        { shape: 'box', size: [50, 50, 15], anchor: 'chest', pos: [0, 10, -10], color: 0x7a5730 },
        { shape: 'sphere', size: 9, anchor: 'chest', pos: [0, 10, -18], color: 'accent', emissiveIntensity: 0.4 },
        { shape: 'cone', size: [140, 260], anchor: 'back', pos: [-40, 0, 10], rot: [0, 0, 0.2], color: 0x5a2020 },
        { shape: 'cylinder', size: [8, 8, 70], anchor: 'handR', pos: [0, 40, 0], color: 0x161616 },
        { shape: 'cylinder', size: [4, 4, 120], anchor: 'handR', pos: [0, 120, 0], color: 'accent', emissiveIntensity: 0.5 }],
      personality: { bobMul: 0.75, swayMul: 0.65, cadenceMul: 0.95, ampMul: 0.95 },
      bubbles: ['⚔️', '🛡️', '🐍', '👑'] },
    // Sergeant Johnson — olive digital-camo BDU, bald, cigar, sunglasses.
    { id: 'halo/marine-sergeant', label: 'Marine sergeant (digital-camo BDU, cigar, sunglasses)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, headShape: 'sphere', skin: 0x6b4b35, body: 0x6b6a4a, legColor: 0x5a5940, shoe: 0x2a2622,
        eyes: 'shades', emI: 0, hands: 'sphere', limbR: 1.0 },
      accessories: [
        { shape: 'cylinder', size: [6, 6, 40], anchor: 'face', pos: [24, -24, -30], rot: [-Math.PI / 2, 0, 0], color: 0x2e1c12 },
        { shape: 'box', size: [30, 20, 4], anchor: 'chest', pos: [-50, 80, -10], color: 0x8a7a2a },
        { shape: 'cylinder', size: [7, 7, 3], anchor: 'chest', pos: [-6, 10, -14], color: 'accent' },
        { shape: 'cylinder', size: [7, 7, 3], anchor: 'chest', pos: [6, 0, -14], color: 'accent' },
        { shape: 'box', size: [40, 70, 25], anchor: 'hip', pos: [70, -10, -8], color: 0x2a2622 },
        { shape: 'box', size: [30, 180, 10], anchor: 'back', pos: [-40, 0, 10], rot: [0, 0, 0.4], color: 0x4a4930 },
        { shape: 'box', size: [30, 180, 10], anchor: 'back', pos: [40, 0, 10], rot: [0, 0, -0.4], color: 0x4a4930 }],
      personality: { bobMul: 1.0, swayMul: 1.1, cadenceMul: 0.95, ampMul: 1.0 },
      bubbles: ['🚬', '🎖️', '💪', '😤'] },
    // Unggoy Grunt (Minor) — short hunched alien, orange harness, methane mask + tank.
    { id: 'halo/grunt-trooper', label: 'Grunt trooper (small hunched alien, methane mask)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 100, headShape: 'sphere', skin: 0x8a7a56, body: 0xd97b2e, legColor: 0xb85f22, shoe: 0x5a4a32,
        eyes: 'dots', emI: 0.05, hands: 'sphere', limbR: 0.85, armL: 0.75, legL: 0.55, footMul: [0.85, 0.7, 0.8] },
      posture: { pitch: 0.35 },
      accessories: [
        { shape: 'box', size: [70, 45, 30], anchor: 'face', pos: [0, -20, -14], color: 0x33362e },
        { shape: 'cylinder', size: [25, 25, 130], anchor: 'back', pos: [0, -10, 26], color: 0x6a6a52 },
        { shape: 'sphere', size: 8, anchor: 'back', pos: [0, 40, 30], color: 'accent', emissiveIntensity: 0.4 },
        { shape: 'cone', size: [7, 30], anchor: 'head', pos: [-40, 40, 20], rot: [0.4, 0, 0], color: 0x8a7a56 },
        { shape: 'cone', size: [7, 30], anchor: 'head', pos: [40, 40, 20], rot: [0.4, 0, 0], color: 0x8a7a56 },
        { shape: 'box', size: [40, 40, 20], anchor: 'hip', pos: [60, -10, -8], color: 0x33362e }],
      personality: { bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.2, ampMul: 0.7 },
      bubbles: ['😱', '🍖', '💥', '🏃'] },
    // Jiralhanae Brute — hulking furred alien, blue-grey armor, spiked pauldrons.
    { id: 'halo/brute-warrior', label: 'Brute warrior (hulking furred alien, blue-grey armor)', rig: 'humanoid',
      humanoid: { sk: 1.3, headR: 138, headShape: 'sphere', skin: 0x5c4632, body: 0x3a4a5c, legColor: 0x2e3a48, shoe: 0x22282f,
        eyes: 'dots', emI: 0.08, steel: true, hands: 'box', limbR: 1.45, armL: 1.1, legL: 0.95 },
      accessories: [
        { shape: 'box', size: [90, 20, 15], anchor: 'face', pos: [0, 30, -14], color: 0x4a3826 },
        { shape: 'cylinder', size: [80, 80, 60], anchor: 'head', pos: [0, -50, 0], color: 0x5c4632 },
        { shape: 'box', size: [180, 120, 150], anchor: 'chest', pos: [-100, 40, 0], color: 0x2e3a48 },
        { shape: 'box', size: [180, 120, 150], anchor: 'chest', pos: [100, 40, 0], color: 0x2e3a48 },
        { shape: 'cone', size: [10, 40], anchor: 'chest', pos: [-110, 100, 0], rot: [0, 0, 0.4], color: 0x1c2228 },
        { shape: 'cone', size: [10, 40], anchor: 'chest', pos: [110, 100, 0], rot: [0, 0, -0.4], color: 0x1c2228 },
        { shape: 'cone', size: [200, 260], anchor: 'back', pos: [0, -40, 12], color: 0x5c4632 },
        { shape: 'sphere', size: 10, anchor: 'chest', pos: [0, 0, -14], color: 'accent' }],
      personality: { bobMul: 0.6, swayMul: 0.9, cadenceMul: 0.7, ampMul: 1.3 },
      bubbles: ['💢', '🦍', '🔨', '😡'] },
    // ODST — sleek matte-black drop-trooper armor, blue-silver visor.
    { id: 'halo/odst-trooper', label: 'Drop trooper (black armor, blue-silver visor)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, headShape: 'sphere', skin: 0x1e1e22, body: 0x232327, legColor: 0x1a1a1d, shoe: 0x141416,
        eyes: 'visor', emI: 0.1, steel: true, hands: 'box', limbR: 1.0, armL: 1.0, legL: 1.0 },
      accessories: [
        { shape: 'cylinder', size: [6, 6, 40], anchor: 'crown', pos: [40, 10, 0], color: 0x4a4a50 },
        { shape: 'box', size: [24, 24, 10], anchor: 'chest', pos: [0, 0, -12], color: 'accent', emissiveIntensity: 0.4 },
        { shape: 'box', size: [30, 160, 10], anchor: 'back', pos: [-35, 0, 10], rot: [0, 0, 0.4], color: 0x3a3a3e },
        { shape: 'box', size: [30, 160, 10], anchor: 'back', pos: [35, 0, 10], rot: [0, 0, -0.4], color: 0x3a3a3e },
        { shape: 'box', size: [50, 50, 25], anchor: 'hip', pos: [70, -10, -8], color: 0x1a1a1d }],
      personality: { bobMul: 0.85, swayMul: 0.55, cadenceMul: 1.0, ampMul: 0.95 },
      bubbles: ['🪂', '🔫', '🌃', '🎯'] },
  ],
};

export default pack;

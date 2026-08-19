// Sci-Fi ▸ Star Wars ▸ Original Trilogy — franchise pack (dynamic-import only).
// Stylized geometric homage: silhouette + color only, no likeness/logos.
// Source doc: docs/avatars/sci-fi/star-wars-ot.md. Heterogeneous ensemble — no
// shared base spec.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'star-wars-ot', version: 5, label: 'Star Wars: Original Trilogy',
  path: ['Sci-Fi', 'Star Wars', 'Original Trilogy'], builtin: true, franchise: true,
  avatars: [
    // Luke Skywalker
    { id: 'star-wars-ot/luke-tan', label: 'Farmboy Jedi (tan tunic)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 'tint', body: 0xd9cba8, legColor: 0xc7b78e, shoe: 0x8a6a42, eyes: 'dots', emI: 0.15, hands: 'sphere', limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: [128, 40, 128], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0xc9a565, emissiveIntensity: 0 },
        { shape: 'box', size: [200, 30, 20], anchor: 'hip', pos: [0, 0, -6], color: 0x4a3524, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [22, 22, 60], anchor: 'hip', pos: [70, -10, -8], color: 0x2a1c14, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [18, 18, 90], anchor: 'handR', pos: [0, 40, 0], color: 0xc7c9cc, emissiveIntensity: 0.05 },
        { shape: 'cylinder', size: [12, 12, 500], anchor: 'handR', pos: [0, 320, 0], color: 0x3fa9f5, emissiveIntensity: 0.6 }],
      personality: { bobMul: 1.05, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🌵', '🚀', '⚔️', '✨'] },
    // Princess Leia
    { id: 'star-wars-ot/leia', label: 'Rebel princess (white robe)', rig: 'humanoid',
      humanoid: { sk: 0.94, headR: 118, skin: 'tint', body: 0xf4f2ea, legColor: 0xf4f2ea, shoe: 0xf4f2ea, eyes: 'dots', emI: 0.18, hands: 'sphere', limbR: 0.9 },
      accessories: [
        { shape: 'sphere', size: 40, anchor: 'head', pos: [-112, -10, 0], color: 0x3a2a20, emissiveIntensity: 0 },
        { shape: 'sphere', size: 40, anchor: 'head', pos: [112, -10, 0], color: 0x3a2a20, emissiveIntensity: 0 },
        { shape: 'sphere', size: [150, 80, 150], anchor: 'crown', pos: [0, 4, 14], rot: [0.35, 0, 0], color: 0xf4f2ea, emissiveIntensity: 0, sphereArc: [0, 6.283, 0, 1.9] },
        { shape: 'box', size: [150, 20, 16], anchor: 'hip', pos: [0, 0, -6], color: 0xc9ccd1, emissiveIntensity: 0.05 }],
      personality: { bobMul: 0.85, swayMul: 0.75, cadenceMul: 0.95, ampMul: 0.8 },
      bubbles: ['📜', '🔫', '👑', '✨'] },
    // Han Solo
    { id: 'star-wars-ot/han', label: 'Smuggler captain (vest & blaster)', rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 126, skin: 'tint', body: 0xe6ddc6, legColor: 0x1c2430, shoe: 0x14120f, eyes: 'dots', emI: 0.2, hands: 'sphere', limbR: 1.05, armL: 1.0 },
      accessories: [
        { shape: 'sphere', size: [128, 38, 128], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x2a1a14, emissiveIntensity: 0 },
        { shape: 'box', size: [150, 180, 16], anchor: 'chest', pos: [0, 0, -8], color: 0x111113, emissiveIntensity: 0 },
        { shape: 'box', size: [180, 26, 18], anchor: 'hip', pos: [0, 0, -6], color: 0x2a1e16, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [20, 20, 60], anchor: 'hip', pos: [72, -12, -8], color: 0x1c1c1c, emissiveIntensity: 0 }],
      personality: { bobMul: 1.1, swayMul: 1.2, cadenceMul: 1.0, ampMul: 1.05 },
      bubbles: ['💰', '🚀', '😏', '🔫'] },
    // Chewbacca
    { id: 'star-wars-ot/chewbacca', label: 'Wookiee co-pilot', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 150, skin: 0x8a5a35, body: 0x8a5a35, legColor: 0x8a5a35, shoe: 0x6e4527, eyes: 'dots', emI: 0.05, hands: 'sphere', limbR: 1.25, armL: 1.1, legL: 1.05 },
      accessories: [
        { shape: 'sphere', size: 40, anchor: 'head', pos: [-70, -30, -30], color: 0x6e4527, emissiveIntensity: 0 },
        { shape: 'sphere', size: 40, anchor: 'head', pos: [70, -30, -30], color: 0x6e4527, emissiveIntensity: 0 },
        { shape: 'sphere', size: 36, anchor: 'head', pos: [-40, -55, -20], color: 0x6e4527, emissiveIntensity: 0 },
        { shape: 'sphere', size: 36, anchor: 'head', pos: [40, -55, -20], color: 0x6e4527, emissiveIntensity: 0 },
        { shape: 'sphere', size: [140, 50, 140], anchor: 'crown', pos: [0, -6, 0], color: 0x6e4527, emissiveIntensity: 0 },
        // approx: diagonal bandolier via one rotated chest box + pouch nubs
        { shape: 'box', size: [280, 50, 18], anchor: 'chest', pos: [0, 10, -12], rot: [0, 0, -0.5], color: 0x3a281c, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [16, 16, 22], anchor: 'chest', pos: [-40, 40, -18], rot: [1.57, 0, -0.5], color: 0x2a1c12, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [16, 16, 22], anchor: 'chest', pos: [40, -30, -18], rot: [1.57, 0, -0.5], color: 0x2a1c12, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 50, 220], anchor: 'handR', pos: [0, -90, -40], color: 0x5a4a3a }], // bowcaster
      personality: { bobMul: 0.95, swayMul: 1.1, cadenceMul: 0.85, ampMul: 1.15 },
      bubbles: ['🔧', '🏹', '😤', '🏆'] },
    // C-3PO — gold protocol droid + silver right leg via limbColors
    { id: 'star-wars-ot/c3po', label: 'Protocol droid (gold)', rig: 'humanoid',
      humanoid: { headR: 122, skin: 0xc9a227, body: 0xc9a227, legColor: 0xc9a227, shoe: 0x8a6f1c, eyes: 'dots', emI: 0.15, hands: 'box', limbR: 1.0, steel: true, limbColors: { legR: 0x8a8a86 } },
      accessories: [
        { shape: 'sphere', size: 16, anchor: 'face', pos: [-30, 4, -8], color: 0xf2c200, emissiveIntensity: 0.5 },
        { shape: 'sphere', size: 16, anchor: 'face', pos: [30, 4, -8], color: 0xf2c200, emissiveIntensity: 0.5 },
        { shape: 'box', size: [40, 60, 10], anchor: 'chest', pos: [0, 0, -8], color: 0x8a6f1c, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [16, 16, 200], anchor: 'back', pos: [0, 0, 6], color: 0x33301c, emissiveIntensity: 0 }],
      personality: { bobMul: 0.9, swayMul: 0.6, cadenceMul: 0.8, ampMul: 0.7 },
      bubbles: ['😰', '📢', '🔢', '🌐'] },
    // R2-D2 — legless astromech; best-effort humanoid approximation
    // approx: no legless/rolling body type + no torso-shape field — squat short
    // legged rig with a chest/hip cylinder "shroud" standing in for the barrel body.
    { id: 'star-wars-ot/r2d2', label: 'Astromech droid (dome droid)', rig: 'humanoid',
      humanoid: { sk: 0.62, headR: 90, skin: 0xe6e3d8, body: 0x2a5fae, legColor: 0x8a8a86, shoe: 0x33342f, eyes: 'dots', emI: 0.2, hands: 'box', limbR: 0.55, armL: 0.4, legL: 0.45, steel: true },
      accessories: [
        { shape: 'sphere', size: 16, anchor: 'face', pos: [0, 0, -8], color: 0x141a22, emissiveIntensity: 0.1 },
        { shape: 'cylinder', size: [110, 110, 340], anchor: 'chest', pos: [0, -40, 0], color: 0xe6e3d8, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [114, 114, 40], anchor: 'hip', pos: [0, 30, 0], color: 0x2a5fae, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 30, 20], anchor: 'back', pos: [0, 60, 6], color: 0x8a8a86, emissiveIntensity: 0 }],
      personality: { bobMul: 0.5, swayMul: 1.3, cadenceMul: 1.4, ampMul: 0.4 },
      bubbles: ['🔧', '📡', '😤', '💡'] },
    // Darth Vader
    { id: 'star-wars-ot/vader', label: 'Dark lord (black armor)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 132, skin: 0x0d0d0f, body: 0x101012, legColor: 0x101012, shoe: 0x0a0a0b, eyes: 'visor', emI: 0.1, hands: 'sphere', limbR: 1.05, armL: 1.0, steel: false },
      accessories: [
        // helmet dome — upper hemisphere shell so the visor band stays visible
        { shape: 'sphere', size: 148, anchor: 'head', pos: [0, 12, 0], color: 0x1c1c1f, emissiveIntensity: 0, sphereArc: [0, 6.283, 0, 2.0] },
        { shape: 'box', size: [16, 70, 150], anchor: 'crown', pos: [0, 6, 40], color: 0x1c1c1f, emissiveIntensity: 0 },
        { shape: 'box', size: [70, 8, 10], anchor: 'face', pos: [0, -22, -10], color: 0x26262a, emissiveIntensity: 0 },
        { shape: 'box', size: [70, 8, 10], anchor: 'face', pos: [0, -34, -10], color: 0x26262a, emissiveIntensity: 0 },
        { shape: 'box', size: [60, 40, 14], anchor: 'chest', pos: [0, 12, -8], color: 0x3a3a3e, emissiveIntensity: 0 },
        { shape: 'sphere', size: 6, anchor: 'chest', pos: [-16, 12, -16], color: 0xd63a2a, emissiveIntensity: 0.4 },
        { shape: 'sphere', size: 6, anchor: 'chest', pos: [16, 12, -16], color: 0x3fae5f, emissiveIntensity: 0.4 },
        { shape: 'cape', size: [370, 713, 550], anchor: 'back', pos: [0, -180, 12], rot: [0.12, 0, 0], color: 0x0a0a0b, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }],
      personality: { bobMul: 0.75, swayMul: 0.5, cadenceMul: 0.8, ampMul: 0.85 },
      bubbles: ['😤', '⚡', '🖤', '🌌'] },
    // Yoda — sk 0.45 floor, big-eared master
    { id: 'star-wars-ot/yoda', label: 'Small green Jedi master', rig: 'humanoid',
      humanoid: { sk: 0.45, headR: 118, skin: 0x6b8c3e, body: 0x9c8058, legColor: 0x8a6f4a, shoe: 0x6b8c3e, eyes: 'dots', emI: 0.1, hands: 'sphere', limbR: 0.85, armL: 0.85, legL: 0.85 },
      accessories: [
        // long drooping ears — big-head cones off the head anchor
        { shape: 'cone', size: [30, 150, 30], anchor: 'head', pos: [-100, 0, 0], rot: [0, 0, 2.4], color: 0x5f7d38, emissiveIntensity: 0 },
        { shape: 'cone', size: [30, 150, 30], anchor: 'head', pos: [100, 0, 0], rot: [0, 0, -2.4], color: 0x5f7d38, emissiveIntensity: 0 },
        { shape: 'cone', size: [180, 400, 180], anchor: 'hip', pos: [0, -100, 0], color: 0x9c8058, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [8, 8, 50], anchor: 'crown', pos: [-14, 0, 0], color: 0xe8e4d8, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [8, 8, 50], anchor: 'crown', pos: [14, 0, 0], color: 0xe8e4d8, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [10, 10, 300], anchor: 'handR', pos: [0, -100, 0], color: 0x7a5a34, emissiveIntensity: 0 }],
      personality: { bobMul: 0.7, swayMul: 0.9, cadenceMul: 0.75, ampMul: 0.8 },
      bubbles: ['🌿', '🧘', '💚', '✨'] },
    // Stormtrooper
    { id: 'star-wars-ot/stormtrooper', label: 'Imperial trooper (white armor)', rig: 'humanoid',
      humanoid: { headR: 128, skin: 0xf0efe8, body: 0xf0efe8, legColor: 0xf0efe8, shoe: 0x1c1c1e, eyes: 'visor', emI: 0.08, hands: 'box', limbR: 1.1, steel: false },
      accessories: [
        { shape: 'box', size: [12, 16, 8], anchor: 'face', pos: [-16, -30, -10], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'box', size: [12, 16, 8], anchor: 'face', pos: [16, -30, -10], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [10, 10, 20], anchor: 'head', pos: [-122, 0, 0], rot: [0, 0, 1.57], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [10, 10, 20], anchor: 'head', pos: [122, 0, 0], rot: [0, 0, 1.57], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'box', size: [50, 40, 10], anchor: 'chest', pos: [0, 10, -8], color: 0x9a9a94, emissiveIntensity: 0 },
        { shape: 'box', size: [160, 24, 18], anchor: 'hip', pos: [0, 0, -6], color: 0xc7c7c0, emissiveIntensity: 0 },
        { shape: 'box', size: [24, 24, 140], anchor: 'handR', pos: [0, 40, -20], color: 0x1c1c1e, emissiveIntensity: 0 }],
      personality: { bobMul: 0.95, swayMul: 0.6, cadenceMul: 1.0, ampMul: 0.9 },
      bubbles: ['🎯', '📡', '⚠️', '🤖'] },
    // Boba Fett
    { id: 'star-wars-ot/boba', label: 'Bounty hunter (green armor)', rig: 'humanoid',
      humanoid: { headR: 126, skin: 0x3f5a34, body: 0x3f5a34, legColor: 0x2f4327, shoe: 0x232a1e, eyes: 't_visor', emI: 0.1, hands: 'box', limbR: 1.1, steel: false },
      accessories: [
        { shape: 'cylinder', size: [8, 8, 80], anchor: 'crown', pos: [40, 20, 0], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 40, 8], anchor: 'chest', pos: [-30, 10, -8], color: 0xa4271f, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 40, 8], anchor: 'chest', pos: [30, 10, -8], color: 0xc9982f, emissiveIntensity: 0 },
        { shape: 'cone', size: [180, 220, 180], anchor: 'hip', pos: [0, -80, 0], color: 0x6b5c3f, emissiveIntensity: 0 },
        { shape: 'box', size: [80, 120, 50], anchor: 'back', pos: [0, 40, 10], color: 0x4a5240, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [12, 12, 40], anchor: 'back', pos: [-30, 90, 20], color: 0x4a5240, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [12, 12, 40], anchor: 'back', pos: [30, 90, 20], color: 0x4a5240, emissiveIntensity: 0 }],
      personality: { bobMul: 0.85, swayMul: 0.55, cadenceMul: 0.9, ampMul: 0.75 },
      bubbles: ['🎯', '💰', '🚀', '🔇'] },
    // Obi-Wan "Ben" Kenobi — the aged desert hermit/mentor of A New Hope: grey-white
    // hair + beard, tan/brown hooded Jedi robe, blue lightsaber. (v2 addition.)
    { id: 'star-wars-ot/obi-wan', label: 'Aged mentor (brown hooded robe)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 'tint', body: 0x9c8a6a, legColor: 0x6b5a44, shoe: 0x4a3c2c, eyes: 'dots', emI: 0.13, hands: 'sphere', limbR: 1.0 },
      posture: { pitch: 0.05 },
      accessories: [
        { shape: 'sphere', size: [128, 40, 128], anchor: 'crown', pos: [0, -6, 4], rot: [0.3, 0, 0], color: 0xcac6ba, emissiveIntensity: 0 },
        { shape: 'box', size: [72, 34, 20], anchor: 'face', pos: [0, -26, -6], color: 0xc4c0b4, emissiveIntensity: 0 },
        // brown hood shell raised + tilted back so the front rim clears the brow
        { shape: 'sphere', size: [152, 82, 152], anchor: 'crown', pos: [0, 4, 16], rot: [0.4, 0, 0], color: 0x6b5a44, emissiveIntensity: 0, sphereArc: [0, 6.283, 0, 1.9] },
        { shape: 'cape', size: [320, 414, 480], anchor: 'back', pos: [0, -110, 12], rot: [0.12, 0, 0], color: 0x5c4630, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } },
        { shape: 'cylinder', size: [18, 18, 90], anchor: 'handR', pos: [0, 40, 0], color: 0xc7c9cc, emissiveIntensity: 0.05 },
        { shape: 'cylinder', size: [12, 12, 500], anchor: 'handR', pos: [0, 320, 0], color: 0x3fa9f5, emissiveIntensity: 0.6 }],
      personality: { bobMul: 0.8, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['🧙', '⚔️', '🌌', '🐫'] },
  ],
};

export default pack;

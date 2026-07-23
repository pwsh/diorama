// Sci-Fi ▸ Marvel ▸ The Avengers — franchise pack (dynamic-import only).
// Stylized geometric homage: costume color-blocking + one signature prop each,
// no likeness/logos. Source doc: docs/avatars/sci-fi/marvel-avengers.md.
import type { AvatarPackDef } from '../avatars.js';

const GOLD = 0xc9a227, GLOW = 0xbfe8ff;

const pack: AvatarPackDef = {
  id: 'marvel-avengers', version: 3, label: 'Marvel: The Avengers',
  path: ['Sci-Fi', 'Marvel', 'The Avengers'], builtin: true, franchise: true,
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'box',
      eyes: 'almond', steel: false, emI: 0, armL: 1.0, legL: 1.0, footMul: [1.0, 1.0, 1.0],
    },
  },
  avatars: [
    // Iron Man / Tony Stark — red/gold armor, glowing arc reactor.
    { id: 'marvel-avengers/armored-genius', label: 'Armored genius (red/gold suit)', rig: 'humanoid',
      humanoid: { skin: 0xb71c1c, body: 0xb71c1c, legColor: 0xd4a017, shoe: 0xd4a017, eyes: 'redvisor',
        emI: 0.25, steel: true, limbR: 1.05, limbColors: { armL: 0xd4a017, armR: 0xd4a017 } },
      accessories: [
        { shape: 'cylinder', size: [27, 27, 10], anchor: 'chest', pos: [0, 20, -14], color: 0xd4a017 },
        { shape: 'cylinder', size: [17, 17, 8], anchor: 'chest', pos: [0, 20, -18], color: GLOW, emissiveIntensity: 0.6 },
        { shape: 'cylinder', size: [18, 18, 8], anchor: 'handL', pos: [0, 20, 0], color: GLOW, emissiveIntensity: 0.5 },
        { shape: 'cylinder', size: [18, 18, 8], anchor: 'handR', pos: [0, 20, 0], color: GLOW, emissiveIntensity: 0.5 }],
      personality: { bobMul: 0.9, swayMul: 0.6, cadenceMul: 1.0, ampMul: 0.85 },
      bubbles: ['⚙️', '💡', '😏', '🚀'] },
    // Captain America / Steve Rogers — blue suit, ringed shield on the back.
    { id: 'marvel-avengers/super-soldier', label: 'Super soldier (blue suit, shield)', rig: 'humanoid',
      humanoid: { skin: 0x2a4d8f, body: 0x2a4d8f, legColor: 0x2a4d8f, shoe: 0x8a1f1f, eyes: 'almond' },
      accessories: [
        { shape: 'cone', size: [17, 16], anchor: 'crown', pos: [-38, 10, 12], rot: [-0.4, 0, 0], color: 0xf0ece0 },
        { shape: 'cone', size: [17, 16], anchor: 'crown', pos: [38, 10, 12], rot: [-0.4, 0, 0], color: 0xf0ece0 },
        { shape: 'box', size: [150, 30, 15], anchor: 'hip', pos: [0, 0, -6], color: 0x8a1f1f },
        // approx: no star/shield primitive — three stacked concentric discs read as a bullseye
        { shape: 'cylinder', size: [170, 170, 20], anchor: 'back', pos: [0, -20, 20], rot: [1.5708, 0, 0], color: 0x8a1f1f }, // shield lies FLAT on the back
        { shape: 'cylinder', size: [130, 130, 24], anchor: 'back', pos: [0, -20, 24], rot: [1.5708, 0, 0], color: 0xf0ece0 },
        { shape: 'cylinder', size: [70, 70, 28], anchor: 'back', pos: [0, -20, 28], rot: [1.5708, 0, 0], color: 0x2a4d8f }],
      personality: { bobMul: 1.0, swayMul: 0.7, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🛡️', '💪', '⭐', '🫡'] },
    // Thor Odinson — armor, blonde hair, red cape, Mjolnir.
    { id: 'marvel-avengers/thunder-god', label: 'Thunder god (armor, red cape, hammer)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 128, skin: 0xd8a878, body: 0x53504c, legColor: 0x1c1a18, shoe: 0x1c1a18,
        eyes: 'almond', emI: 0.05, steel: true, limbR: 1.15, armL: 1.05, legL: 1.05 },
      accessories: [
        { shape: 'box', size: [135, 55, 135], anchor: 'crown', pos: [0, 0, 0], color: 0xd8b878 },
        { shape: 'box', size: [38, 190, 28], anchor: 'head', pos: [-100, -40, 10], color: 0xd8b878 },
        { shape: 'box', size: [38, 190, 28], anchor: 'head', pos: [100, -40, 10], color: 0xd8b878 },
        { shape: 'cylinder', size: [17, 17, 10], anchor: 'chest', pos: [-30, 10, -12], color: 0x8a8a86 },
        { shape: 'cylinder', size: [17, 17, 10], anchor: 'chest', pos: [30, 10, -12], color: 0x8a8a86 },
        { shape: 'cape', size: [300, 700, 480], anchor: 'back', pos: [0, -220, 20], rot: [0.12, 0, 0], color: 0x8b1a1a, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // red cape
        { shape: 'cylinder', size: [8, 8, 95], anchor: 'handR', pos: [0, 40, 0], color: 0x3a2a1e },
        { shape: 'box', size: [70, 50, 60], anchor: 'handR', pos: [0, 100, 0], color: 0x6e6b66 }],
      personality: { bobMul: 1.1, swayMul: 0.6, cadenceMul: 0.9, ampMul: 1.1 },
      bubbles: ['⚡', '🔨', '😄', '🍺'] },
    // Hulk / Bruce Banner — green giant, torn purple shorts.
    { id: 'marvel-avengers/gamma-giant', label: 'Gamma giant (green, purple shorts)', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 132, skin: 0x5a9c3a, body: 0x5a9c3a, legColor: 0x5a9c3a, shoe: 0x5a9c3a,
        eyes: 'almond', limbR: 1.55, armL: 1.3, legL: 0.9, footMul: [1.3, 1.1, 1.3] },
      posture: { pitch: 0.12 },
      accessories: [
        { shape: 'box', size: [200, 220, 150], anchor: 'hip', pos: [0, -20, 0], color: 0x5b2a86 },
        { shape: 'box', size: [80, 60, 10], anchor: 'chest', pos: [-60, 60, -8], color: 0x3a3a38 }],
      personality: { bobMul: 0.6, swayMul: 0.3, cadenceMul: 0.65, ampMul: 1.4 },
      bubbles: ['💥', '😠', '🟢', '💪'] },
    // Black Widow / Natasha Romanoff — black tactical suit, red hair.
    { id: 'marvel-avengers/master-spy', label: 'Master spy (black suit, red hair)', rig: 'humanoid',
      humanoid: { sk: 0.96, headR: 122, skin: 0xdba888, body: 0x161616, legColor: 0x161616, shoe: 0x0d0d0d,
        eyes: 'almond', emI: 0.05, hands: 'sphere', limbR: 0.85 },
      accessories: [
        { shape: 'sphere', size: [59, 30, 59], anchor: 'crown', pos: [0, 0, 0], color: 0x8b2e1f },
        { shape: 'box', size: [40, 28, 40], anchor: 'handL', pos: [0, 10, 0], color: 0x1a1a1a },
        { shape: 'sphere', size: 6, anchor: 'handL', pos: [0, 10, -18], color: GLOW, emissiveIntensity: 0.5 },
        { shape: 'box', size: [40, 28, 40], anchor: 'handR', pos: [0, 10, 0], color: 0x1a1a1a },
        { shape: 'sphere', size: 6, anchor: 'handR', pos: [0, 10, -18], color: GLOW, emissiveIntensity: 0.5 },
        { shape: 'box', size: [140, 24, 14], anchor: 'hip', pos: [0, 0, -6], color: 0x0d0d0d },
        { shape: 'box', size: [30, 38, 20], anchor: 'hip', pos: [70, -12, -8], color: 0x0d0d0d }],
      personality: { bobMul: 0.85, swayMul: 0.6, cadenceMul: 1.05, ampMul: 0.8 },
      bubbles: ['🕶️', '🥷', '🔴', '🤫'] },
    // Hawkeye / Clint Barton — purple jacket, bow + quiver.
    { id: 'marvel-avengers/master-archer', label: 'Master archer (purple/black, bow)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 0xd8a878, body: 0x4a2f7a, legColor: 0x1a1a1a, shoe: 0x141414, eyes: 'almond', limbR: 0.95 },
      accessories: [
        { shape: 'box', size: [112, 42, 112], anchor: 'crown', pos: [0, 0, 0], color: 0x6b4a2e },
        { shape: 'box', size: [50, 70, 8], anchor: 'chest', pos: [0, 10, -10], color: 0x3a2060 },
        { shape: 'cylinder', size: [31, 31, 220], anchor: 'back', pos: [40, 20, 20], rot: [0, 0, 0.4], color: 0x2a2420 },
        { shape: 'cone', size: [7, 30], anchor: 'back', pos: [80, 120, 20], color: 0x8a8a86 },
        { shape: 'cone', size: [7, 30], anchor: 'back', pos: [58, 120, 20], color: 0x8a8a86 },
        // approx: no curved primitive — the recurve bow is a straight vertical rod
        { shape: 'cylinder', size: [8, 8, 260], anchor: 'handL', pos: [0, 40, 0], color: 0x0d0d0d }],
      personality: { bobMul: 0.85, swayMul: 0.55, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['🏹', '🎯', '😑', '🍿'] },
    // Spider-Man / Peter Parker — red/blue suit, full mask.
    { id: 'marvel-avengers/web-slinger', label: 'Web-slinger (red/blue, masked)', rig: 'humanoid',
      humanoid: { sk: 0.98, headR: 122, skin: 0xc41e2a, body: 0xc41e2a, legColor: 0x1a3a8f, shoe: 0x1a3a8f,
        eyes: 'shades', emI: 0.1, hands: 'sphere', limbR: 0.85, limbColors: { armL: 0x1a3a8f, armR: 0x1a3a8f } },
      accessories: [
        { shape: 'box', size: [20, 16, 20], anchor: 'handL', pos: [0, 12, -14], color: 0x1a1a1a },
        { shape: 'box', size: [20, 16, 20], anchor: 'handR', pos: [0, 12, -14], color: 0x1a1a1a }],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.15, ampMul: 1.0 },
      bubbles: ['🕸️', '😅', '📸', '🙃'] },
    // Black Panther / T'Challa — black cat-cowl suit, silver accents.
    { id: 'marvel-avengers/wakandan-king', label: 'Wakandan king (black suit, cat cowl)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 0x141414, body: 0x141414, legColor: 0x161616, shoe: 0x0d0d0d,
        eyes: 'slit', emI: 0.15, limbR: 0.95 },
      accessories: [
        { shape: 'cone', size: [10, 34], anchor: 'head', pos: [-40, 60, -10], color: 0x141414 },
        { shape: 'cone', size: [10, 34], anchor: 'head', pos: [40, 60, -10], color: 0x141414 },
        { shape: 'box', size: [130, 20, 8], anchor: 'chest', pos: [0, 40, -10], color: 0xb0b0b0 },
        { shape: 'box', size: [90, 12, 6], anchor: 'chest', pos: [0, 0, -10], rot: [0, 0, 0.5], color: 0x8a6fb0, emissiveIntensity: 0.3 }],
      personality: { bobMul: 0.8, swayMul: 0.85, cadenceMul: 1.05, ampMul: 0.9 },
      bubbles: ['🐾', '👑', '⚡', '🙏'] },
    // Doctor Strange / Stephen Strange — blue tunic, crimson cloak, amulet.
    { id: 'marvel-avengers/master-sorcerer', label: 'Master sorcerer (blue tunic, crimson cloak)', rig: 'humanoid',
      humanoid: { skin: 0xd8b090, body: 0x1a3a5c, legColor: 0x16324e, shoe: 0x3a2a1e, eyes: 'almond', emI: 0.05, hands: 'sphere', limbR: 0.95 },
      accessories: [
        { shape: 'box', size: [112, 46, 112], anchor: 'crown', pos: [0, 0, 0], color: 0x241f1c },
        { shape: 'box', size: [30, 20, 10], anchor: 'head', pos: [-100, 10, -10], color: 0x9a9086 },
        { shape: 'box', size: [30, 20, 10], anchor: 'head', pos: [100, 10, -10], color: 0x9a9086 },
        { shape: 'box', size: [90, 10, 8], anchor: 'neck', pos: [0, -4, -78], color: GOLD },
        { shape: 'cylinder', size: [16, 16, 14], anchor: 'chest', pos: [0, -10, -12], color: GOLD, emissiveIntensity: 0.4, animate: { kind: 'spin', speed: 1.2 } }, // Eye-of-Agamotto-style amulet
        { shape: 'cape', size: [300, 720, 460], anchor: 'back', pos: [0, -230, 20], rot: [0.12, 0, 0], color: 0x9c2b2b, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }], // crimson cloak (Cloak of Levitation)
      personality: { bobMul: 0.75, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['✨', '🔮', '📖', '🌀'] },
    // Loki — green/gold leathers, dark cape, horned helm.
    { id: 'marvel-avengers/trickster-prince', label: 'Trickster prince (green/gold, horned helm)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 0xd8c4b0, body: 0x1f6b3f, legColor: 0x161616, shoe: 0x141414, eyes: 'almond', emI: 0.05, limbR: 0.85 },
      accessories: [
        { shape: 'box', size: [112, 42, 112], anchor: 'crown', pos: [0, 0, 0], color: 0x141414 },
        { shape: 'cylinder', size: [66, 66, 40], anchor: 'crown', pos: [0, 0, 0], color: GOLD },
        { shape: 'cone', size: [13, 170], anchor: 'crown', pos: [-25, 20, -10], rot: [-0.35, 0, 0.35], color: GOLD },
        { shape: 'cone', size: [13, 170], anchor: 'crown', pos: [25, 20, -10], rot: [-0.35, 0, -0.35], color: GOLD },
        { shape: 'box', size: [66, 50, 46], anchor: 'shoulderL', color: 0x1c1c1c },
        { shape: 'box', size: [66, 50, 46], anchor: 'shoulderR', color: 0x1c1c1c },
        { shape: 'box', size: [140, 10, 8], anchor: 'chest', pos: [0, 40, -10], color: GOLD },
        { shape: 'cape', size: [290, 700, 450], anchor: 'back', pos: [0, -220, 20], rot: [0.12, 0, 0], color: 0x14401f, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // dark cape
        { shape: 'cylinder', size: [10, 10, 420], anchor: 'handR', pos: [0, 120, 0], color: 0x3a3a3c }, // scepter haft
        { shape: 'sphere', size: 20, anchor: 'handR', pos: [0, 300, 0], color: 0x2f9fd0, emissive: 0x2f9fd0, emissiveIntensity: 0.5, outlineSkip: true }], // scepter gem
      personality: { bobMul: 0.9, swayMul: 0.75, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['😏', '🐍', '👑', '✨'] },
  ],
};

export default pack;

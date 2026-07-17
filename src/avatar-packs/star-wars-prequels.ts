// Sci-Fi ▸ Star Wars ▸ Prequel Trilogy — franchise pack (dynamic-import only).
// Stylized geometric homage: silhouette + color only, no likeness/logos.
// Source doc: docs/avatars/sci-fi/star-wars-prequels.md. Heterogeneous ensemble —
// no shared base spec (sibling to star-wars-ot / star-wars-mandalorian).
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

const HILT = 0xc7c9cc;
// Reuses star-wars-ot's established hilt-cylinder + emissive-blade-cylinder recipe.
const saber = (anchor: 'handL' | 'handR', blade: number, hilt = HILT): AvatarPrimitive[] => [
  { shape: 'cylinder', size: [18, 18, 90], anchor, pos: [0, 40, 0], color: hilt, emissiveIntensity: 0.05 },
  { shape: 'cylinder', size: [12, 12, 500], anchor, pos: [0, 320, 0], color: blade, emissiveIntensity: 0.6 },
];

const pack: AvatarPackDef = {
  id: 'star-wars-prequels', version: 2, label: 'Star Wars: Prequel Trilogy',
  path: ['Sci-Fi', 'Star Wars', 'Prequel Trilogy'], builtin: true, franchise: true,
  avatars: [
    // Anakin Skywalker (Knight years) — near-black robes, blond hair, blue blade.
    { id: 'star-wars-prequels/anakin', label: 'Dark-robed Jedi Knight (blue blade)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, headShape: 'sphere', skin: 'tint', body: 0x241f1b, legColor: 0x1c1815, shoe: 0x141210, eyes: 'dots', emI: 0.15, hands: 'sphere', limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: [124, 42, 124], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0xd4b06a },
        { shape: 'box', size: [6, 40, 4], anchor: 'face', pos: [22, 10, -10], color: 0x8a5648 },
        ...saber('handR', 0x3fa9f5)],
      personality: { bobMul: 1.05, swayMul: 1.1, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🔧', '⚡', '😤', '✨'] },
    // Obi-Wan Kenobi (bearded Master) — beige tunic, brown robe, blue blade.
    { id: 'star-wars-prequels/obi-wan', label: 'Jedi Master (tan tunic & beard)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, headShape: 'sphere', skin: 'tint', body: 0xcdbf9c, legColor: 0x6b5a44, shoe: 0x4a3c2c, eyes: 'dots', emI: 0.15, hands: 'sphere', limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: [124, 40, 124], anchor: 'crown', pos: [0, -6, 4], rot: [0.3, 0, 0], color: 0x7a4a2e },
        { shape: 'box', size: [70, 30, 20], anchor: 'face', pos: [0, -28, -6], color: 0x6b3f28 },
        { shape: 'cape', size: [300, 345, 450], anchor: 'back', pos: [0, -110, 12], rot: [0.12, 0, 0], color: 0x5c4630 },
        ...saber('handR', 0x3fa9f5)],
      personality: { bobMul: 0.95, swayMul: 0.8, cadenceMul: 1.0, ampMul: 0.9 },
      bubbles: ['🧘', '⚔️', '😑', '🍵'] },
    // Padmé Amidala (Queen) — regal red gown, pale ceremonial makeup, headdress.
    { id: 'star-wars-prequels/padme', label: 'Naboo Royal (regal gown)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, headShape: 'sphere', skin: 0xf2e4d8, body: 0x8a1c1f, legColor: 0x8a1c1f, shoe: 0x8a1c1f, eyes: 'dots', emI: 0.15, hands: 'sphere', limbR: 0.9 },
      accessories: [
        { shape: 'box', size: [22, 6, 4], anchor: 'face', pos: [0, -30, -10], color: 0xb5222c },
        { shape: 'sphere', size: 6, anchor: 'face', pos: [-24, -14, -10], color: 0xb5222c },
        { shape: 'sphere', size: 6, anchor: 'face', pos: [24, -14, -10], color: 0xb5222c },
        { shape: 'sphere', size: [160, 90, 150], anchor: 'crown', pos: [0, 4, 14], rot: [0.35, 0, 0], color: 0x1a1a1a, sphereArc: [0, 6.283, 0, 1.9] },
        { shape: 'sphere', size: 12, anchor: 'head', pos: [0, 50, -14], color: 'tint' },
        { shape: 'box', size: [140, 18, 10], anchor: 'chest', pos: [0, 40, -8], color: 0xc9a227 },
        { shape: 'box', size: [150, 26, 14], anchor: 'hip', pos: [0, 0, -6], color: 0x1a1a1a },
        { shape: 'box', size: [40, 30, 10], anchor: 'hip', pos: [0, 0, -12], color: 0xc9a227 }],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 1.0, ampMul: 0.85 },
      bubbles: ['👑', '📜', '🕊️', '💔'] },
    // Qui-Gon Jinn — beige tunic + grey poncho + long grey hair, green blade.
    { id: 'star-wars-prequels/qui-gon', label: 'Jedi Master (poncho & long hair)', rig: 'humanoid',
      humanoid: { sk: 1.04, headR: 128, headShape: 'sphere', skin: 'tint', body: 0xd6c7a1, legColor: 0x6b5a44, shoe: 0x4a3c2c, eyes: 'dots', emI: 0.13, hands: 'sphere', limbR: 1.05 },
      accessories: [
        { shape: 'sphere', size: [140, 50, 140], anchor: 'crown', pos: [0, -6, 0], color: 0x8a8478 },
        { shape: 'cape', size: [340, 391, 500], anchor: 'back', pos: [0, -100, 10], rot: [0.12, 0, 0], color: 0x9a978c },
        ...saber('handR', 0x3fff6e)],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.9, ampMul: 0.95 },
      bubbles: ['🌌', '🧘', '🌱', '⚔️'] },
    // Mace Windu — bald (no crown), dark robes, unique purple blade.
    { id: 'star-wars-prequels/mace-windu', label: 'Jedi Master (bald, purple blade)', rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 126, headShape: 'sphere', skin: 'tint', body: 0x4a4034, legColor: 0x352d24, shoe: 0x241f19, eyes: 'dots', emI: 0.15, hands: 'sphere', limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [150, 26, 14], anchor: 'hip', pos: [0, 0, -6], color: 0x2e2620 },
        ...saber('handR', 0x9b30d9)],
      personality: { bobMul: 0.8, swayMul: 0.55, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['🟣', '🧘', '⚔️', '🛑'] },
    // Darth Maul — red skin + black tattoos, horn crown, double-bladed red saber.
    { id: 'star-wars-prequels/darth-maul', label: 'Sith Assassin (red & black horned)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, headShape: 'sphere', skin: 0xb5222c, body: 0x111112, legColor: 0x111112, shoe: 0x0c0c0d, eyes: 'dots', emI: 0.1, hands: 'sphere', limbR: 1.0 },
      accessories: [
        { shape: 'cone', size: [8, 30], anchor: 'crown', pos: [0, 6, -18], rot: [-0.4, 0, 0], color: 0x8a8274 },
        { shape: 'cone', size: [8, 30], anchor: 'crown', pos: [-30, 6, 10], rot: [0, 0, 0.4], color: 0x8a8274 },
        { shape: 'cone', size: [8, 30], anchor: 'crown', pos: [30, 6, 10], rot: [0, 0, -0.4], color: 0x8a8274 },
        { shape: 'box', size: [80, 6, 4], anchor: 'face', pos: [0, 16, -12], color: 0x111112 },
        { shape: 'box', size: [80, 6, 4], anchor: 'face', pos: [0, 0, -12], color: 0x111112 },
        // double-bladed variant of the saber recipe — two blades from one hilt
        { shape: 'cylinder', size: [18, 18, 120], anchor: 'handR', pos: [0, 40, 0], color: HILT, emissiveIntensity: 0.05 },
        { shape: 'cylinder', size: [12, 12, 400], anchor: 'handR', pos: [0, 240, 0], color: 0xff3b30, emissiveIntensity: 0.6 },
        { shape: 'cylinder', size: [12, 12, 400], anchor: 'handR', pos: [0, -160, 0], color: 0xff3b30, emissiveIntensity: 0.6 }],
      personality: { bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.2, ampMul: 1.1 },
      bubbles: ['😈', '🔥', '⚔️', '🤫'] },
    // Count Dooku — silver hair + goatee, long cloak, curved-hilt red saber.
    { id: 'star-wars-prequels/count-dooku', label: 'Sith Lord (aristocratic, cloaked)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 124, headShape: 'sphere', skin: 'tint', body: 0x2a2320, legColor: 0x211b18, shoe: 0x171310, eyes: 'dots', emI: 0.12, hands: 'sphere', limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: [124, 40, 124], anchor: 'crown', pos: [0, -6, 2], color: 0xc7c5bd },
        { shape: 'cone', size: [12, 40], anchor: 'face', pos: [0, -34, -10], rot: [Math.PI, 0, 0], color: 0xc7c5bd },
        { shape: 'cape', size: [340, 713, 500], anchor: 'back', pos: [0, -180, 12], rot: [0.12, 0, 0], color: 0x4a2c22 },
        // approx: no curved primitive — the signature curved hilt is a straight cylinder held at a tilt
        { shape: 'cylinder', size: [18, 18, 90], anchor: 'handR', pos: [0, 40, 0], rot: [0, 0, 0.3], color: 0xb9bcc2, emissiveIntensity: 0.05 },
        { shape: 'cylinder', size: [12, 12, 500], anchor: 'handR', pos: [0, 320, 0], rot: [0, 0, 0.3], color: 0xff3b30, emissiveIntensity: 0.6 }],
      personality: { bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.85, ampMul: 0.75 },
      bubbles: ['🎩', '⚔️', '🖤', '💰'] },
    // General Grievous — skeletal grey-white cyborg, black cape, two collected sabers.
    // approx: four canonical arms → two posable arms + static shoulder stub pair.
    { id: 'star-wars-prequels/general-grievous', label: 'Cyborg General (four-armed)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 108, headShape: 'oval', skin: 0xd8d5c8, body: 0x9a9890, legColor: 0x7a786e, shoe: 0x4a4840, eyes: 'visor', emI: 0.2, hands: 'box', steel: true, limbR: 0.85, armL: 1.15, legL: 1.05 },
      posture: { pitch: 0.12 },
      accessories: [
        { shape: 'cape', size: [320, 598, 480], anchor: 'back', pos: [0, -160, 12], rot: [0.12, 0, 0], color: 0x111112 },
        { shape: 'box', size: [140, 40, 14], anchor: 'chest', pos: [0, 0, -10], color: 0x6e6c62 },
        { shape: 'box', size: [40, 140, 40], anchor: 'shoulderL', pos: [10, -40, 0], rot: [0, 0, 0.3], color: 0x7a786e },
        { shape: 'box', size: [40, 140, 40], anchor: 'shoulderR', pos: [-10, -40, 0], rot: [0, 0, -0.3], color: 0x7a786e },
        ...saber('handL', 0x3fff6e, 0xb9bcc2),
        ...saber('handR', 0x3fa9f5, 0xb9bcc2)],
      personality: { bobMul: 0.7, swayMul: 1.4, cadenceMul: 1.15, ampMul: 1.3 },
      bubbles: ['⚙️', '🤧', '⚔️', '🏃'] },
  ],
};

export default pack;

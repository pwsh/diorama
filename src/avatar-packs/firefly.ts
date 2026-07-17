// Sci-Fi ▸ Firefly — franchise pack (dynamic-import only). Stylized geometric
// homage: "Western-in-space" earth-tone silhouettes + color, no likeness.
// Source doc: docs/avatars/sci-fi/firefly.md.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'firefly', version: 2, label: 'Firefly (Serenity crew)',
  path: ['Sci-Fi', 'Firefly'], builtin: true, franchise: true,
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'sphere',
      eyes: 'dots', steel: false, emI: 0, armL: 1.0, legL: 1.0, footMul: [1.0, 1.0, 1.0],
    },
  },
  avatars: [
    // Malcolm Reynolds — Captain, brown duster
    { id: 'firefly/captain-browncoat', label: 'Captain (brown duster, maroon shirt)', rig: 'humanoid',
      humanoid: { skin: 0xd9a878, body: 0x7a2f2f, legColor: 0x8a7052, shoe: 0x3a2a1a },
      accessories: [
        // browncoat = long back/chest coat panels
        { shape: 'box', size: [300, 560, 50], anchor: 'back', pos: [0, -120, 20], color: 0x5c3a1e, emissiveIntensity: 0 },
        // approx: suspenders via mirrored rotated chest boxes (no strap primitive)
        { shape: 'box', size: [14, 200, 8], anchor: 'chest', pos: [-30, 10, -8], rot: [0, 0, 0.25], color: 0x2a1a12, emissiveIntensity: 0 },
        { shape: 'box', size: [14, 200, 8], anchor: 'chest', pos: [30, 10, -8], rot: [0, 0, -0.25], color: 0x2a1a12, emissiveIntensity: 0 },
        { shape: 'box', size: [220, 50, 20], anchor: 'hip', pos: [0, 0, -6], color: 0x4a3520, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 60, 25], anchor: 'hip', pos: [72, -10, -6], color: 0x1c1c1c, emissiveIntensity: 0 },
        { shape: 'sphere', size: [128, 38, 128], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x2a1a14, emissiveIntensity: 0 }],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['🔫', '🤠', '🚀', '😏'] },
    // Zoe Washburne — first mate, leather vest
    { id: 'firefly/warrior-wife', label: 'First mate (leather vest, war veteran)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 0x6b4a30, body: 0x8a8a7a, legColor: 0x9c8a6a, shoe: 0x1a1a1a, limbR: 1.05 },
      accessories: [
        { shape: 'box', size: [150, 180, 20], anchor: 'chest', pos: [0, 0, -8], color: 0x4a2f1c, emissiveIntensity: 0 },
        { shape: 'box', size: [14, 20, 6], anchor: 'chest', pos: [-40, 0, -16], color: 0xc9a227, emissiveIntensity: 0.08 },
        { shape: 'box', size: [14, 20, 6], anchor: 'chest', pos: [40, 0, -16], color: 0xc9a227, emissiveIntensity: 0.08 },
        { shape: 'sphere', size: [124, 34, 124], anchor: 'crown', pos: [0, -6, 4], rot: [0.2, 0, 0], color: 0x1c140e, emissiveIntensity: 0 }],
      personality: { bobMul: 0.85, swayMul: 0.55, cadenceMul: 0.95, ampMul: 0.9 },
      bubbles: ['⚔️', '🛡️', '😐', '❤️'] },
    // Wash — pilot, Hawaiian shirt
    { id: 'firefly/ships-pilot', label: 'Pilot (Hawaiian shirt, flight coveralls)', rig: 'humanoid',
      humanoid: { skin: 0xe0b08c, body: 0x2f7d6b, legColor: 0xc9691f, shoe: 0x3a2a1a, limbR: 0.95, armL: 0.95, legL: 0.95 },
      accessories: [
        // approx: loud Hawaiian print via scattered proud "print dots"
        { shape: 'sphere', size: 16, anchor: 'chest', pos: [-35, 30, -8], color: 0xe0623f, emissiveIntensity: 0 },
        { shape: 'sphere', size: 16, anchor: 'chest', pos: [30, 15, -8], color: 0xe8c14a, emissiveIntensity: 0 },
        { shape: 'sphere', size: 16, anchor: 'chest', pos: [-25, -10, -8], color: 0xe8c14a, emissiveIntensity: 0 },
        { shape: 'sphere', size: 16, anchor: 'chest', pos: [40, -25, -8], color: 0xe0623f, emissiveIntensity: 0 },
        { shape: 'sphere', size: [126, 36, 126], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0xd9b872, emissiveIntensity: 0 },
        { shape: 'box', size: [34, 8, 6], anchor: 'face', pos: [0, -16, -9], color: 0x9c7a4a, emissiveIntensity: 0 }],
      personality: { bobMul: 1.1, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.05 },
      bubbles: ['🦖', '🦕', '😄', '🌺'] },
    // Kaylee — mechanic, olive coveralls
    { id: 'firefly/mechanic', label: 'Mechanic (olive coveralls, grease-stained)', rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 118, skin: 0xe8c2a0, body: 0x5a6b3a, legColor: 0x5a6b3a, shoe: 0x3a2a1a, limbR: 0.9, armL: 0.9, legL: 0.9 },
      accessories: [
        { shape: 'box', size: [40, 30, 4], anchor: 'chest', pos: [-30, 10, -8], color: 0x2a2a26, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [18, 22, 160], anchor: 'crown', pos: [0, -20, 40], rot: [0.6, 0, 0], color: 0x5a3a20, emissiveIntensity: 0 },
        { shape: 'cone', size: [60, 90, 60], anchor: 'handR', pos: [0, 90, 0], color: 0xe89ac0, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [6, 6, 90], anchor: 'handR', pos: [0, 30, 0], color: 0xf0e6d8, emissiveIntensity: 0 }],
      personality: { bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.15, ampMul: 1.15 },
      bubbles: ['🔧', '🌸', '😊', '💕'] },
    // Jayne — mercenary, cunning knit cap (stacked crown cylinders)
    { id: 'firefly/mercenary', label: 'Mercenary (cunning hat, tactical vest)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 132, skin: 0xc48a5e, body: 0x9c8a72, legColor: 0x5a5a4a, shoe: 0x1a1a1a, limbR: 1.25, armL: 1.05, legL: 1.0 },
      accessories: [
        // the cunning hat — 3 stacked knit bands + pom-pom + earflaps
        { shape: 'cylinder', size: [80, 80, 40], anchor: 'crown', pos: [0, -10, 0], color: 0x7a2f2f, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [76, 76, 40], anchor: 'crown', pos: [0, 26, 0], color: 0xc9982f, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [70, 70, 40], anchor: 'crown', pos: [0, 60, 0], color: 0xd9691f, emissiveIntensity: 0 },
        { shape: 'sphere', size: 13, anchor: 'crown', pos: [0, 86, 0], color: 0xe8c14a, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 70, 20], anchor: 'head', pos: [-100, -30, 0], color: 0x7a2f2f, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 70, 20], anchor: 'head', pos: [100, -30, 0], color: 0x7a2f2f, emissiveIntensity: 0 },
        // approx: tactical webbing via mirrored rotated chest boxes
        { shape: 'box', size: [16, 190, 10], anchor: 'chest', pos: [-30, 10, -8], rot: [0, 0, 0.5], color: 0x4a4a3a, emissiveIntensity: 0 },
        { shape: 'box', size: [16, 190, 10], anchor: 'chest', pos: [30, 10, -8], rot: [0, 0, -0.5], color: 0x4a4a3a, emissiveIntensity: 0 },
        { shape: 'box', size: [50, 40, 150], anchor: 'handR', pos: [0, 40, -20], color: 0x2a2a2a, emissiveIntensity: 0 }],
      personality: { bobMul: 1.25, swayMul: 1.2, cadenceMul: 0.85, ampMul: 1.1 },
      bubbles: ['🔫', '💰', '😤', '🧶'] },
    // Inara — Companion, red silk gown + gold sash
    { id: 'firefly/companion', label: 'Companion (red silk gown, gold sash)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, skin: 0xd9a878, body: 0x8a1f2f, legColor: 0x8a1f2f, shoe: 0x2a1a12, limbR: 0.85, armL: 0.85, legL: 0.85, gown: true },
      accessories: [
        { shape: 'cylinder', size: [95, 95, 70], anchor: 'hip', pos: [0, 0, 0], color: 0xc9a227, emissiveIntensity: 0.1 },
        // approx: floor-length gown train via a wide back cone (no skirt primitive)
        { shape: 'cone', size: [300, 940, 0], anchor: 'hip', pos: [0, -320, 0], color: 0x8a1f2f }, // floor-length gown (waist→floor)
        { shape: 'sphere', size: [118, 60, 118], anchor: 'crown', pos: [0, 0, 0], color: 0x2a1a12, emissiveIntensity: 0 },
        { shape: 'sphere', size: 14, anchor: 'chest', pos: [0, 20, -12], color: 0xd4af37, emissiveIntensity: 0.1 }],
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.75 },
      bubbles: ['🌹', '💋', '🍵', '✨'] },
    // Simon Tam — doctor, waistcoat
    { id: 'firefly/doctor', label: 'Doctor (waistcoat, white shirt)', rig: 'humanoid',
      humanoid: { sk: 0.98, headR: 122, skin: 0xe0b08c, body: 0xe8e4d8, legColor: 0x2a2a2a, shoe: 0x1a1a1a, limbR: 0.9, armL: 0.9, legL: 0.95 },
      accessories: [
        { shape: 'box', size: [150, 180, 18], anchor: 'chest', pos: [0, 0, -8], color: 0x2a2a2a, emissiveIntensity: 0 },
        { shape: 'sphere', size: 8, anchor: 'chest', pos: [0, 30, -18], color: 0xc9a227, emissiveIntensity: 0.08 },
        { shape: 'sphere', size: 8, anchor: 'chest', pos: [0, 10, -18], color: 0xc9a227, emissiveIntensity: 0.08 },
        { shape: 'sphere', size: 8, anchor: 'chest', pos: [0, -10, -18], color: 0xc9a227, emissiveIntensity: 0.08 },
        { shape: 'sphere', size: [122, 32, 122], anchor: 'crown', pos: [0, -8, 6], rot: [0.3, 0, 0], color: 0x2a1a12, emissiveIntensity: 0 }],
      personality: { bobMul: 0.75, swayMul: 0.6, cadenceMul: 0.95, ampMul: 0.8 },
      bubbles: ['💉', '🩺', '😟', '❤️'] },
    // River Tam — mysterious sister; barefoot approximated via shoe=skin
    // approx: no barefoot flag — shoe recolored to skin tone to suppress boot read.
    { id: 'firefly/mysterious-sister', label: 'Mysterious sister (dress, long dark hair)', rig: 'humanoid',
      humanoid: { sk: 0.8, headR: 110, skin: 0xe8c2a0, body: 0xaab4bc, legColor: 0xaab4bc, shoe: 0xe8c2a0, limbR: 0.78, armL: 0.8, legL: 0.82 },
      accessories: [
        { shape: 'sphere', size: [145, 140, 145], anchor: 'crown', pos: [0, -4, 6], rot: [0.25, 0, 0], color: 0x241a14, emissiveIntensity: 0 },
        { shape: 'sphere', size: [40, 100, 32], anchor: 'head', pos: [-104, -30, 0], color: 0x241a14, emissiveIntensity: 0 },
        { shape: 'sphere', size: [40, 100, 32], anchor: 'head', pos: [104, -30, 0], color: 0x241a14, emissiveIntensity: 0 }],
      personality: { bobMul: 1.15, swayMul: 1.3, cadenceMul: 1.1, ampMul: 1.2 },
      bubbles: ['🌀', '🩰', '💭', '🔪'] },
    // Shepherd Book — clergy collar
    { id: 'firefly/shepherd', label: 'Shepherd (grey shirt, clerical collar)', rig: 'humanoid',
      humanoid: { skin: 0x6b4a30, body: 0x8a8a86, legColor: 0x1a1a1a, shoe: 0x0d0d0d, limbR: 0.95, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [60, 16, 10], anchor: 'neck', pos: [0, -10, -10], color: 0xf0f0f0, emissiveIntensity: 0 },
        { shape: 'sphere', size: [128, 34, 128], anchor: 'crown', pos: [0, -6, 4], rot: [0.2, 0, 0], color: 0xb8b8b8, emissiveIntensity: 0 }],
      personality: { bobMul: 0.8, swayMul: 0.55, cadenceMul: 0.9, ampMul: 0.8 },
      bubbles: ['🙏', '📖', '☕', '😌'] },
  ],
};

export default pack;

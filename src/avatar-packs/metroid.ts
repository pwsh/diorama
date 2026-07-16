// Video Games ▸ Metroid — franchise pack (dynamic-import only, default
// loaded:false). Geometric homage: colour + silhouette only, no likenesses.
// Source: docs/avatars/video-games/metroid.md.
import type { AvatarPackDef } from '../avatars.js';

const VARIA = 0xe8621c, SUITRED = 0xc81818, VISOR = 0x39ff6a, ZERO = 0x1c5fd1;
const CHOZO = 0xc9a24a, STONE = 0x8a7048, PIRATE = 0x2f6b2f, RIDLEY = 0x9b3fb5;
const KRAID = 0x4a7a3a, BRAIN = 0xd99bb5, NUCLEI = 0xe6202a;

const pack: AvatarPackDef = {
  id: 'metroid', version: 1, label: 'Metroid',
  path: ['Video Games', 'Metroid'], builtin: true, franchise: true,
  avatars: [
    // Samus — Varia power suit
    { id: 'metroid/power-suit-huntress', label: 'Bounty Huntress (orange power armor, green visor)', rig: 'humanoid',
      humanoid: { headR: 130, limbR: 1.3, skin: VARIA, body: VARIA, legColor: VARIA, shoe: 0xb8490f, eyes: 'visor', emI: 0.15, hands: 'box', steel: true, legL: 1.05, footMul: [1.1, 1.0, 1.1] },
      accessories: [
        { shape: 'box', size: [180, 160, 60], anchor: 'chest', pos: [0, 10, 0], color: SUITRED },
        { shape: 'sphere', size: 55, anchor: 'shoulderL', color: VARIA },
        { shape: 'sphere', size: 55, anchor: 'shoulderR', color: VARIA },
        { shape: 'box', size: [90, 20, 10], anchor: 'face', pos: [0, 15, -6], color: VISOR, emissive: VISOR, emissiveIntensity: 0.3 },
        { shape: 'cylinder', size: [35, 35, 260], anchor: 'handR', pos: [0, -130, 0], color: VARIA },
        { shape: 'box', size: [80, 40, 80], anchor: 'handR', pos: [0, -250, 0], color: 0x4a4a4a },
      ],
      personality: { swayMul: 0.9, cadenceMul: 0.85, ampMul: 1.1 }, bubbles: ['🎯', '💥', '🛸', '🧬'] },
    // Zero Suit Samus
    { id: 'metroid/zero-suit-huntress', label: 'Bounty Huntress (blue bodysuit, blonde ponytail)', rig: 'humanoid',
      humanoid: { headR: 122, limbR: 0.9, skin: 0xf0c2a0, body: ZERO, legColor: ZERO, shoe: ZERO, eyes: 'almond', emI: 0.05, legL: 1.05, footMul: [0.95, 1.1, 0.95] },
      accessories: [
        { shape: 'box', size: [120, 40, 120], anchor: 'crown', pos: [0, -20, -20], rot: [0.4, 0, 0], color: 0xf2d675 },
        { shape: 'cylinder', size: [8, 24, 260], anchor: 'head', pos: [0, -30, 70], rot: [0.5, 0, 0], color: 0xf2d675 },
        { shape: 'box', size: [50, 20, 50], anchor: 'head', pos: [0, 10, 70], color: 0xcc2233 },
        { shape: 'box', size: [70, 90, 6], anchor: 'chest', pos: [-30, 20, 0], color: 0xff8fc7, emissive: 0xff8fc7, emissiveIntensity: 0.1 },
        { shape: 'box', size: [120, 140, 60], anchor: 'back', pos: [0, 20, 0], color: 0xff8fc7 },
      ],
      personality: { cadenceMul: 1.1 }, bubbles: ['⚡', '🏃', '💥', '🛰️'] },
    // Infant Metroid — floating jelly (hover + opacity)
    { id: 'metroid/infant-metroid', label: 'Infant Metroid (floating jelly, glowing nuclei)', rig: 'humanoid',
      humanoid: { sk: 0.45, headR: 140, skin: 0x8fe6c2, body: 0x8fe6c2, emI: 0.25, opacity: 0.6, hover: 350, eyes: 'dots', noFace: true }, // approx: sk bumped 0.35→0.45 (floor); translucency via opacity; hover for float
      accessories: [
        { shape: 'sphere', size: 10, anchor: 'face', pos: [-20, 10, -8], color: NUCLEI, emissive: NUCLEI, emissiveIntensity: 0.3 },
        { shape: 'sphere', size: 10, anchor: 'face', pos: [20, 10, -8], color: NUCLEI, emissive: NUCLEI, emissiveIntensity: 0.3 },
        { shape: 'sphere', size: 10, anchor: 'face', pos: [0, -15, -8], color: NUCLEI, emissive: NUCLEI, emissiveIntensity: 0.3 },
        { shape: 'sphere', size: 10, anchor: 'face', pos: [0, 5, 15], color: NUCLEI, emissive: NUCLEI, emissiveIntensity: 0.2 },
        { shape: 'cone', size: [5, 18, 5], anchor: 'hip', pos: [-30, -20, 0], rot: [3.1416, 0, 0], color: 0x3a3a3a },
        { shape: 'cone', size: [5, 18, 5], anchor: 'hip', pos: [30, -20, 0], rot: [3.1416, 0, 0], color: 0x3a3a3a },
      ],
      pet: true, personality: { bobMul: 1.6, swayMul: 1.3, cadenceMul: 0.4, ampMul: 0.6 }, bubbles: ['🧬', '💜', '🩸', '👻'] },
    // Space Pirate trooper
    { id: 'metroid/space-pirate-trooper', label: 'Space Pirate (green chitin armor, glowing red eyes)', rig: 'humanoid',
      humanoid: { headR: 120, headShape: 'box', limbR: 1.15, skin: 0x7a2e8f, body: PIRATE, legColor: 0x234d23, shoe: 0x234d23, eyes: 'redvisor', emI: 0.3, hands: 'box', legL: 0.95, footMul: [1.2, 0.8, 1.3] },
      accessories: [
        { shape: 'box', size: [40, 70, 20], anchor: 'head', pos: [-95, 20, 30], rot: [0, 0, -0.4], color: 0x1c4d1c },
        { shape: 'box', size: [40, 70, 20], anchor: 'head', pos: [95, 20, 30], rot: [0, 0, 0.4], color: 0x1c4d1c },
        { shape: 'box', size: [30, 220, 15], anchor: 'handL', pos: [0, -110, -30], rot: [-0.4, 0, 0], color: 0x4a4a4a },
        { shape: 'cylinder', size: [30, 30, 200], anchor: 'handR', pos: [0, -100, 0], color: 0x3a3a3a },
        { shape: 'cone', size: [15, 50, 15], anchor: 'back', pos: [0, 40, 15], color: 0x1c4d1c },
        { shape: 'cone', size: [15, 50, 15], anchor: 'back', pos: [0, 0, 15], color: 0x1c4d1c },
        { shape: 'cone', size: [15, 50, 15], anchor: 'back', pos: [0, -40, 15], color: 0x1c4d1c },
      ],
      personality: { cadenceMul: 1.2, ampMul: 1.05 }, bubbles: ['👾', '💢', '⚔️', '🛸'] },
    // Chozo Statue
    { id: 'metroid/chozo-guardian-statue', label: 'Chozo Statue (gold-bronze, bird motif)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 135, headShape: 'box', limbR: 1.4, skin: CHOZO, body: STONE, legColor: STONE, shoe: 0x5c4a2e, eyes: 'halfred', emI: 0.1, hands: 'box', armL: 1.05, footMul: [1.3, 1.0, 1.3] },
      accessories: [
        { shape: 'cone', size: [65, 110, 65], anchor: 'crown', pos: [0, 10, 30], rot: [0.5, 0, 0], color: CHOZO },
        { shape: 'cone', size: [30, 90, 30], anchor: 'face', pos: [0, -10, -20], rot: [-1.4, 0, 0], color: 0x7a6038 },
        { shape: 'box', size: [250, 340, 40], anchor: 'back', pos: [-140, -30, 20], rot: [0, -0.4, 0], color: STONE },
        { shape: 'box', size: [250, 340, 40], anchor: 'back', pos: [140, -30, 20], rot: [0, 0.4, 0], color: STONE },
        { shape: 'box', size: [200, 140, 20], anchor: 'hip', color: 0x5c4a2e },
        { shape: 'box', size: [60, 60, 10], anchor: 'chest', pos: [0, 10, 0], color: 0xe6a23c, emissive: 0xe6a23c, emissiveIntensity: 0.4 },
      ],
      personality: { bobMul: 0.1, swayMul: 0.05, cadenceMul: 0.6, ampMul: 0.7 }, bubbles: ['🗿', '⚱️', '✨'] },
    // Ridley — uses tailbone anchor for the bladed tail
    { id: 'metroid/space-dragon-ridley', label: 'Space Dragon (purple, wings, bladed tail)', rig: 'humanoid',
      humanoid: { sk: 1.6, headR: 140, headShape: 'box', limbR: 1.1, skin: RIDLEY, body: 0x7a2f96, legColor: 0x3a1a45, shoe: 0x3a1a45, eyes: 'slit', emI: 0.35, hands: 'box', armL: 1.2, legL: 1.15, footMul: [1.3, 0.9, 1.5] },
      accessories: [
        { shape: 'cone', size: [20, 90, 20], anchor: 'crown', pos: [-40, 0, 20], rot: [0.4, 0, -0.3], color: 0x5c2570 },
        { shape: 'cone', size: [20, 90, 20], anchor: 'crown', pos: [40, 0, 20], rot: [0.4, 0, 0.3], color: 0x5c2570 },
        { shape: 'box', size: [400, 550, 30], anchor: 'back', pos: [-230, -20, 20], rot: [0, -0.5, 0], color: 0x5c2570 },
        { shape: 'box', size: [400, 550, 30], anchor: 'back', pos: [230, -20, 20], rot: [0, 0.5, 0], color: 0x5c2570 },
        { shape: 'cone', size: [30, 300, 30], anchor: 'tailbone', pos: [0, -40, 150], rot: [1.2, 0, 0], color: 0x7a2f96 }, // approx: static tail (no jointed sway)
        { shape: 'cone', size: [20, 200, 20], anchor: 'tailbone', pos: [0, -160, 320], rot: [1.4, 0, 0], color: 0x7a2f96 },
        { shape: 'cone', size: [25, 90, 25], anchor: 'tailbone', pos: [0, -300, 450], rot: [1.4, 0, 0], color: 0xd9d9d9 },
      ],
      personality: { bobMul: 1.3, swayMul: 1.4, cadenceMul: 0.75, ampMul: 1.3 }, bubbles: ['🔥', '🐉', '💢', '🩸'] },
    // Kraid — oversized belly via a large chest sphere
    { id: 'metroid/reptilian-behemoth-kraid', label: 'Reptilian Behemoth (green, huge belly, small head)', rig: 'humanoid',
      humanoid: { sk: 1.8, headR: 100, limbR: 1.6, skin: KRAID, body: 0x3d6b30, legColor: 0x2a4a22, shoe: 0x2a4a22, eyes: 'dots', emI: 0.05, hands: 'box', armL: 1.4, legL: 0.8, footMul: [1.6, 1.0, 1.6] },
      accessories: [
        { shape: 'sphere', size: [225, 210, 190], anchor: 'chest', pos: [0, -40, -60], color: 0x6a9a52 }, // approx: torso-defining belly (soft rig gap)
        { shape: 'cone', size: [15, 60, 15], anchor: 'handL', pos: [0, -30, 0], rot: [3.1416, 0, 0], color: 0xe8e0c8 },
        { shape: 'cone', size: [15, 60, 15], anchor: 'handR', pos: [0, -30, 0], rot: [3.1416, 0, 0], color: 0xe8e0c8 },
        { shape: 'cone', size: [20, 70, 20], anchor: 'back', pos: [0, 80, 15], color: 0x254019 },
        { shape: 'cone', size: [20, 70, 20], anchor: 'back', pos: [-70, 30, 15], color: 0x254019 },
        { shape: 'cone', size: [20, 70, 20], anchor: 'back', pos: [70, 30, 15], color: 0x254019 },
        { shape: 'cone', size: [20, 70, 20], anchor: 'back', pos: [0, -30, 15], color: 0x254019 },
      ],
      personality: { bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.5, ampMul: 0.6 }, bubbles: ['🦖', '💢', '🌋', '🩸'] },
    // Mother Brain — grounded, limbless (shrunk limbs; no sessile flag)
    { id: 'metroid/mother-brain-jar', label: 'Brain in a Jar (pink mass, glass tank, single eye)', rig: 'humanoid',
      humanoid: { sk: 1.3, headR: 190, skin: BRAIN, body: 0x2a2a33, legColor: 0x1a1a20, shoe: 0x1a1a20, eyes: 'redvisor', emI: 0.25, steel: true, limbR: 0.3, armL: 0.01, legL: 0.3, footMul: [0.01, 0.01, 0.01] }, // approx: sessile approximated via shrunk limbs; tank rendered opaque pale (no translucency)
      accessories: [
        { shape: 'sphere', size: 210, anchor: 'crown', pos: [0, -120, 0], color: 0xbfe8f0, emissive: 0xbfe8f0, emissiveIntensity: 0.1 },
        { shape: 'cylinder', size: [10, 10, 280], anchor: 'hip', pos: [-60, -100, 30], color: 0x6a6a72 },
        { shape: 'cylinder', size: [10, 10, 280], anchor: 'hip', pos: [0, -100, 40], color: 0xc23030 },
        { shape: 'cylinder', size: [10, 10, 280], anchor: 'hip', pos: [60, -100, 30], color: 0xd4af37 },
        { shape: 'box', size: [300, 260, 300], anchor: 'hip', pos: [0, -60, 0], color: 0x2a2a33 },
      ],
      pet: true, personality: { bobMul: 0.15, swayMul: 0.1, cadenceMul: 0.3, ampMul: 0.4 }, bubbles: ['🧠', '⚡', '💢', '👁️'] },
  ],
};

export default pack;

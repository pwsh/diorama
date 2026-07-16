// Sci-Fi ▸ Transformers — franchise pack (dynamic-import only). Stylized
// geometric homage: G1 color-blocking + boxy silhouette, no likeness/insignia.
// Source doc: docs/avatars/sci-fi/transformers.md.
import type { AvatarPackDef } from '../avatars.js';

const CHROME = 0xc8ccd2, GUNMETAL = 0x3a3c40;

const pack: AvatarPackDef = {
  id: 'transformers', version: 1, label: 'Transformers (G1)',
  path: ['Sci-Fi', 'Transformers'], builtin: true, franchise: true,
  // Pack-wide "boxy robot" silhouette: box head + box hands + steel sheen.
  base: {
    rig: 'humanoid',
    humanoid: { headShape: 'box', hands: 'box', steel: true },
  },
  avatars: [
    // Optimus Prime
    { id: 'transformers/autobot-leader', label: 'Autobot leader (red/blue, semi)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 140, skin: 0xb0b4ba, body: 0xc41e3a, legColor: 0x1b4f91, shoe: 0x8fa8c8, emI: 0.15, eyes: 'visor', armL: 1.05, legL: 1.05 },
      accessories: [
        { shape: 'box', size: [40, 90, 15], anchor: 'crown', pos: [-50, 10, 0], rot: [0, 0, 0.3], color: 0xb0b4ba, emissiveIntensity: 0 },
        { shape: 'box', size: [40, 90, 15], anchor: 'crown', pos: [50, 10, 0], rot: [0, 0, -0.3], color: 0xb0b4ba, emissiveIntensity: 0 },
        { shape: 'box', size: [90, 50, 20], anchor: 'face', pos: [0, -24, -8], color: 0xb0b4ba, emissiveIntensity: 0 },
        { shape: 'box', size: [140, 60, 15], anchor: 'chest', pos: [0, 10, -8], color: CHROME, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 40, 10], anchor: 'chest', pos: [-35, 10, -16], color: 0x4fc3f7, emissiveIntensity: 0.3 },
        { shape: 'box', size: [30, 40, 10], anchor: 'chest', pos: [35, 10, -16], color: 0x4fc3f7, emissiveIntensity: 0.3 },
        { shape: 'cylinder', size: [12, 12, 140], anchor: 'back', pos: [-60, 60, 10], color: CHROME, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [12, 12, 140], anchor: 'back', pos: [60, 60, 10], color: CHROME, emissiveIntensity: 0 },
        { shape: 'box', size: [140, 30, 10], anchor: 'hip', pos: [0, 0, -6], color: CHROME, emissiveIntensity: 0 }],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.9, ampMul: 1.1 },
      bubbles: ['🛡️', '⚙️', '🔥', '✊'] },
    // Megatron
    { id: 'transformers/decepticon-leader', label: 'Decepticon leader (silver, hand cannon)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 130, skin: 0x9aa0a6, body: 0x9aa0a6, legColor: 0x2b2b2e, shoe: 0x2b2b2e, emI: 0.2, eyes: 'redvisor', armL: 1.05, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [30, 50, 10], anchor: 'crown', pos: [-45, 10, 0], color: 0x4a4c50, emissiveIntensity: 0 },
        { shape: 'box', size: [30, 50, 10], anchor: 'crown', pos: [45, 10, 0], color: 0x4a4c50, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [30, 30, 10], anchor: 'chest', pos: [0, 10, -10], rot: [1.57, 0, 0], color: 0x23262b, emissive: 0xd63a2a, emissiveIntensity: 0.15 },
        { shape: 'cylinder', size: [40, 40, 220], anchor: 'handR', pos: [0, 90, 0], rot: [1.57, 0, 0], color: GUNMETAL, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [44, 44, 12], anchor: 'handR', pos: [0, 40, 0], rot: [1.57, 0, 0], color: CHROME, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [44, 44, 12], anchor: 'handR', pos: [0, 140, 0], rot: [1.57, 0, 0], color: CHROME, emissiveIntensity: 0 },
        { shape: 'box', size: [140, 20, 10], anchor: 'hip', pos: [0, 0, -6], color: 0x6a3fa0, emissiveIntensity: 0 }],
      personality: { bobMul: 0.8, swayMul: 1.0, cadenceMul: 0.85, ampMul: 1.0 },
      bubbles: ['💀', '⚡', '👑', '💢'] },
    // Bumblebee
    { id: 'transformers/autobot-scout', label: 'Autobot scout (yellow, small)', rig: 'humanoid',
      humanoid: { sk: 0.80, headR: 118, skin: 0xf4c60e, body: 0xf4c60e, legColor: 0x1c1c1e, shoe: 0x1c1c1e, emI: 0.1, eyes: 'dots', armL: 0.95, legL: 0.9 },
      accessories: [
        { shape: 'cylinder', size: [10, 10, 70], anchor: 'crown', pos: [-25, 20, 0], rot: [0, 0, -0.3], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [10, 10, 70], anchor: 'crown', pos: [25, 20, 0], rot: [0, 0, 0.3], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'box', size: [130, 25, 15], anchor: 'chest', pos: [0, -10, -8], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [15, 15, 8], anchor: 'chest', pos: [0, -10, -16], rot: [1.57, 0, 0], color: 0xc8c8c8, emissiveIntensity: 0 },
        { shape: 'box', size: [100, 60, 30], anchor: 'back', pos: [0, 0, 6], color: 0x1c1c1e, emissiveIntensity: 0 },
        { shape: 'box', size: [120, 20, 10], anchor: 'hip', pos: [0, 0, -6], color: 0x1c1c1e, emissiveIntensity: 0 }],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.3, ampMul: 0.85 },
      bubbles: ['🐝', '⚡', '🚗', '😊'] },
    // Ironhide (black Diaclone variant)
    { id: 'transformers/autobot-weapons-specialist', label: 'Weapons specialist (black, twin cannons)', rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 132, skin: 0x3a3a3e, body: 0x1c1c1e, legColor: 0x1c1c1e, shoe: 0x1c1c1e, emI: 0.15, eyes: 'visor', limbR: 1.2, armL: 1.0, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [90, 40, 20], anchor: 'face', pos: [0, -28, -8], color: 0x4a4c50, emissiveIntensity: 0 },
        { shape: 'box', size: [130, 50, 10], anchor: 'chest', pos: [0, 10, -8], color: 0x9aa0a6, emissiveIntensity: 0 },
        { shape: 'box', size: [120, 20, 10], anchor: 'chest', pos: [0, 10, -14], rot: [0, 0, 0.3], color: 0x7a1f1f, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [17, 17, 100], anchor: 'back', pos: [-45, 60, 10], rot: [-0.4, 0, 0.2], color: GUNMETAL, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [17, 17, 100], anchor: 'back', pos: [45, 60, 10], rot: [-0.4, 0, -0.2], color: GUNMETAL, emissiveIntensity: 0 },
        { shape: 'box', size: [140, 30, 10], anchor: 'hip', pos: [0, 0, -6], color: 0x9aa0a6, emissiveIntensity: 0 }],
      personality: { bobMul: 0.9, swayMul: 1.1, cadenceMul: 0.85, ampMul: 1.05 },
      bubbles: ['💥', '🔫', '🛠️', '😤'] },
    // Ratchet
    { id: 'transformers/autobot-medic', label: 'Autobot medic (white, red cross)', rig: 'humanoid',
      humanoid: { headR: 128, skin: 0xe8e8e6, body: 0xf2f2f0, legColor: 0xf2f2f0, shoe: 0xd6362a, emI: 0.15, eyes: 'dots', limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [70, 15, 10], anchor: 'crown', pos: [0, 10, -10], color: 0x9aa0a6, emissiveIntensity: 0 },
        { shape: 'box', size: [50, 14, 10], anchor: 'chest', pos: [0, 10, -10], color: 0xd6362a, emissiveIntensity: 0.2 },
        { shape: 'box', size: [14, 50, 10], anchor: 'chest', pos: [0, 10, -10], color: 0xd6362a, emissiveIntensity: 0.2 },
        { shape: 'box', size: [15, 140, 5], anchor: 'chest', pos: [-70, 0, -6], color: 0xd6362a, emissiveIntensity: 0 },
        { shape: 'box', size: [15, 140, 5], anchor: 'chest', pos: [70, 0, -6], color: 0xd6362a, emissiveIntensity: 0 },
        { shape: 'box', size: [70, 50, 30], anchor: 'back', pos: [0, 20, 6], color: 0x9aa0a6, emissiveIntensity: 0 },
        { shape: 'box', size: [130, 20, 10], anchor: 'hip', pos: [0, 0, -6], color: 0xd6362a, emissiveIntensity: 0 }],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.1, ampMul: 1.0 },
      bubbles: ['🩹', '🔧', '❤️', '🚑'] },
    // Starscream
    { id: 'transformers/decepticon-seeker', label: 'Decepticon seeker (grey/blue, jet wings)', rig: 'humanoid',
      humanoid: { headR: 126, skin: 0x2e3a4d, body: 0xacb2b8, legColor: 0x1e3a5f, shoe: 0x16283f, emI: 0.2, eyes: 'slit', limbR: 0.9, armL: 0.95, legL: 1.0 },
      accessories: [
        { shape: 'cone', size: [40, 90, 40], anchor: 'crown', pos: [0, 10, 20], rot: [0.5, 0, 0], color: 0xacb2b8, emissiveIntensity: 0 },
        { shape: 'box', size: [70, 15, 8], anchor: 'face', pos: [0, 20, -10], color: 0xf2c230, emissiveIntensity: 0.2 },
        { shape: 'box', size: [90, 60, 10], anchor: 'chest', pos: [0, -5, -8], color: 0xf2c230, emissiveIntensity: 0.15 },
        { shape: 'box', size: [120, 15, 8], anchor: 'chest', pos: [0, 30, -12], color: 0xc81e2a, emissiveIntensity: 0 },
        { shape: 'box', size: [180, 90, 10], anchor: 'back', pos: [-70, 40, 10], rot: [0, 0.4, 0], color: 0x6e7a85, emissiveIntensity: 0 },
        { shape: 'box', size: [180, 90, 10], anchor: 'back', pos: [70, 40, 10], rot: [0, -0.4, 0], color: 0x6e7a85, emissiveIntensity: 0 },
        { shape: 'box', size: [130, 20, 10], anchor: 'hip', pos: [0, 0, -6], color: 0x1e3a5f, emissiveIntensity: 0 }],
      personality: { bobMul: 1.1, swayMul: 1.3, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🛩️', '😈', '👑', '💢'] },
    // Alpha Trion
    { id: 'transformers/autobot-elder', label: 'Autobot elder (silver/purple, energon core)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 130, skin: 0x9aa0a6, body: 0x9aa0a6, legColor: 0x6e7278, shoe: 0x6e7278, emI: 0.25, eyes: 'almond', armL: 0.95, legL: 0.9 },
      accessories: [
        { shape: 'box', size: [70, 10, 8], anchor: 'crown', pos: [0, -10, -10], color: 0xc9cdd1, emissiveIntensity: 0 },
        { shape: 'cone', size: [30, 90, 30], anchor: 'face', pos: [0, -40, -8], rot: [3.14159, 0, 0], color: 0xc9cdd1, emissiveIntensity: 0 },
        { shape: 'cylinder', size: [35, 35, 8], anchor: 'chest', pos: [0, 10, -8], rot: [1.57, 0, 0], color: 0x9aa0a6, emissiveIntensity: 0 },
        { shape: 'sphere', size: 25, anchor: 'chest', pos: [0, 10, -14], color: 0xff8c1a, emissiveIntensity: 0.6 },
        { shape: 'cone', size: [140, 220, 140], anchor: 'back', pos: [0, -60, 10], color: 0x5b3a78, emissiveIntensity: 0 },
        { shape: 'box', size: [140, 30, 10], anchor: 'hip', pos: [0, 0, -6], color: 0x5b3a78, emissiveIntensity: 0 }],
      personality: { bobMul: 0.7, swayMul: 0.8, cadenceMul: 0.6, ampMul: 0.6 },
      bubbles: ['📜', '🕯️', '🔮', '⚙️'] },
  ],
};

export default pack;

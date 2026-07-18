// Base ▸ Aliens — builtin base-group pack (dynamic-import only). Members keep
// their EXACT bare legacy ids + legacyAccessories markers.
import type { AvatarPackDef } from '../avatars.js';

const GREEN = 0x86d46a;

const pack: AvatarPackDef = {
  id: 'base-aliens', version: 2, label: 'Aliens', path: ['Base', 'Aliens'], builtin: true,
  avatars: [
    { id: 'alien', label: 'Alien', rig: 'humanoid', legacyAccessories: 'alien',
      humanoid: { headR: 158, limbR: 0.8, skin: GREEN, body: GREEN, emI: 0.35, eyes: 'almond', earSkip: true },
      bubbles: ['🛸', '❓'] },

    // ── New alien species (Batch C2). Distinct hue families; body ≈ skin (bare
    // creatures, no costume layer). Big heads, thin limbs — the family read.
    // Grey — huge ash cranium, jet-black almond eyes, matte/clinical (near-zero emI).
    { id: 'grey-alien', label: 'Grey (huge-eyed)', rig: 'humanoid',
      humanoid: { headR: 172, limbR: 0.7, skin: 0x9aa3ad, body: 0x9aa3ad, shoe: 0x24262b, emI: 0.08, eyes: 'almond', earSkip: true },
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.8 }, bubbles: ['🛸', '🔬', '👽', '❓'] },

    // Martian — red-orange skin, domed head, glowing-tip telepathy antennae.
    { id: 'martian', label: 'Martian (antennae)', rig: 'humanoid',
      humanoid: { headR: 148, limbR: 0.85, skin: 0xc74a2e, body: 0xc74a2e, shoe: 0x241512, emI: 0.20, eyes: 'almond', earSkip: true },
      accessories: [
        { shape: 'cylinder', size: [7, 7, 190], anchor: 'crown', pos: [-30, 70, 0], rot: [0, 0, 0.35], color: 0xc74a2e, animate: { kind: 'sway', speed: 1.1, amp: 0.22, phase: 0 } }, // antenna L
        { shape: 'cylinder', size: [7, 7, 190], anchor: 'crown', pos: [30, 70, 0], rot: [0, 0, -0.35], color: 0xc74a2e, animate: { kind: 'sway', speed: 1.1, amp: 0.22, phase: 1.6 } }, // antenna R
        { shape: 'sphere', size: 13, anchor: 'crown', pos: [-58, 155, 0], color: 0xff6a2e, emissive: 0xff6a2e, emissiveIntensity: 0.9, outlineSkip: true }, // tip L
        { shape: 'sphere', size: 13, anchor: 'crown', pos: [58, 155, 0], color: 0xff6a2e, emissive: 0xff6a2e, emissiveIntensity: 0.9, outlineSkip: true }, // tip R
      ],
      personality: { swayMul: 1.1 }, bubbles: ['📡', '🔴', '👽', '🛸'] },

    // Tentacle-head — ordinary eyes ABOVE a writhing tentacle rosette that replaces
    // the whole lower face (noFace suppresses the stock nose/mouth).
    { id: 'tentacle-head', label: 'Tentacle-head', rig: 'humanoid',
      humanoid: { headR: 150, limbR: 0.85, skin: 0x6a8a7a, body: 0x6a8a7a, shoe: 0x1c231f, emI: 0.15, eyes: 'dots', noFace: true, earSkip: true },
      accessories: [
        { shape: 'cone', size: [13, 100], anchor: 'face', pos: [0, -50, -12], rot: [3.0, 0, 0], color: 0x4d6a5c, animate: { kind: 'sway', speed: 0.9, amp: 0.3, phase: 0 } }, // tentacle center
        { shape: 'cone', size: [12, 92], anchor: 'face', pos: [-36, -46, -6], rot: [2.9, 0, 0.4], color: 0x4d6a5c, animate: { kind: 'sway', speed: 0.9, amp: 0.3, phase: 1.2 } }, // tentacle L
        { shape: 'cone', size: [12, 92], anchor: 'face', pos: [36, -46, -6], rot: [2.9, 0, -0.4], color: 0x4d6a5c, animate: { kind: 'sway', speed: 0.9, amp: 0.3, phase: 2.4 } }, // tentacle R
        { shape: 'cone', size: [10, 78], anchor: 'face', pos: [-18, -58, -18], rot: [3.05, 0, 0.2], color: 0x4d6a5c, animate: { kind: 'sway', speed: 0.9, amp: 0.3, phase: 3.6 } }, // tentacle inner L
        { shape: 'cone', size: [10, 78], anchor: 'face', pos: [18, -58, -18], rot: [3.05, 0, -0.2], color: 0x4d6a5c, animate: { kind: 'sway', speed: 0.9, amp: 0.3, phase: 4.8 } }, // tentacle inner R
      ],
      personality: { bobMul: 0.9, swayMul: 1.3, cadenceMul: 0.8, ampMul: 0.9 }, bubbles: ['🐙', '🌌', '👁️', '🫧'] },

    // Insectoid — angular box head, clawed box hands, side-bulging compound eyes.
    // approx: no 'compound' eye style (PARKED) — modeled as head-side dome accessory
    // pair over tiny 'dots'; wing cases + mandibles reinforce the insect read.
    { id: 'insectoid', label: 'Insectoid (mantis)', rig: 'humanoid',
      humanoid: { headR: 118, headShape: 'box', limbR: 0.6, skin: 0x5a7a3a, body: 0x44602c, shoe: 0x2a2f22, emI: 0.15, hands: 'box', eyes: 'dots', earSkip: true },
      accessories: [
        { shape: 'sphere', size: [54, 40, 54], anchor: 'head', pos: [-62, 22, -36], rot: [0, -0.5, 0], color: 0x3a0f14, emissive: 0x8a1f1f, emissiveIntensity: 0.2 }, // compound eye L
        { shape: 'sphere', size: [54, 40, 54], anchor: 'head', pos: [62, 22, -36], rot: [0, 0.5, 0], color: 0x3a0f14, emissive: 0x8a1f1f, emissiveIntensity: 0.2 }, // compound eye R
        { shape: 'cone', size: [12, 52], anchor: 'face', pos: [-20, -44, -18], rot: [2.6, 0, 0.3], color: 0x2a2f22 }, // mandible L
        { shape: 'cone', size: [12, 52], anchor: 'face', pos: [20, -44, -18], rot: [2.6, 0, -0.3], color: 0x2a2f22 }, // mandible R
        { shape: 'cone', size: [30, 180], anchor: 'back', pos: [-40, 20, 20], rot: [0.3, 0, 0.2], color: 0x44602c }, // wing case L
        { shape: 'cone', size: [30, 180], anchor: 'back', pos: [40, 20, 20], rot: [0.3, 0, -0.2], color: 0x44602c }, // wing case R
      ],
      personality: { bobMul: 0.7, swayMul: 0.6, cadenceMul: 1.3, ampMul: 0.85 }, bubbles: ['🦗', '🔬', '🧬', '👁️'] },

    // Blob alien — translucent teal ooze, internal glowing "organs" visible through
    // the skin. approx: no hideLimbs override (PARKED) — uses hover (legless float)
    // + opacity for the translucent mass; the thin arms still render faintly.
    { id: 'blob-alien', label: 'Blob (amorphous ooze)', rig: 'humanoid',
      humanoid: { headR: 190, limbR: 0.5, skin: 0x6ac2b0, body: 0x6ac2b0, shoe: 0x3a6a5f, emI: 0.30, eyes: 'dots', opacity: 0.55, hover: 220, earSkip: true },
      accessories: [
        { shape: 'sphere', size: 32, anchor: 'chest', pos: [-30, 60, 20], color: 0xffd23a, emissive: 0xffd23a, emissiveIntensity: 0.4, outlineSkip: true }, // organ
        { shape: 'sphere', size: 24, anchor: 'chest', pos: [40, 20, -10], color: 0xffd23a, emissive: 0xffd23a, emissiveIntensity: 0.4, outlineSkip: true }, // organ
        { shape: 'sphere', size: 20, anchor: 'chest', pos: [0, -40, 30], color: 0xffd23a, emissive: 0xffd23a, emissiveIntensity: 0.4, outlineSkip: true }, // organ
      ],
      personality: { bobMul: 1.6, swayMul: 1.5, cadenceMul: 0.6, ampMul: 0.5 }, bubbles: ['🫠', '🟢', '🔵', '❓'] },
  ],
};

export default pack;

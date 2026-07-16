// Base ▸ Humans — builtin base-group pack (dynamic-import only; never statically
// imported into the startup graph). Members keep their EXACT bare legacy ids.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'base-humans', version: 1, label: 'Humans', path: ['Base', 'Humans'], builtin: true,
  avatars: [
    { id: 'child', label: 'Child', rig: 'humanoid', legacyAccessories: 'child',
      humanoid: { sk: 0.6, headR: 107 }, personality: { bobMul: 1.25 }, bubbles: ['🎈', '🍭'] },

    // ── New age variants (Batch C2) ──────────────────────────────────────────
    // Generic 2-4yo. Doc sk 0.42 bumped to the 0.45 rig floor (nav/gait untested
    // below). Oversized head + very short legs read "toddler"; skin/body = tint.
    { id: 'toddler', label: 'Toddler', rig: 'humanoid',
      humanoid: { sk: 0.45, headR: 100, limbR: 1.15, shoe: 0xf2ede4, armL: 0.85, legL: 0.72 },
      accessories: [
        { shape: 'sphere', size: [45, 30, 45], anchor: 'crown', pos: [0, 8, 0], color: 'tint' }, // hair tuft
      ],
      personality: { bobMul: 1.4, swayMul: 1.3, cadenceMul: 1.3, ampMul: 0.75 },
      bubbles: ['🧸', '🍭', '🎈', '❓'] },

    // Generic 13-17yo. Near-adult scale, leaner; optional hoodie hood (hacker-hood
    // idiom: downward bowl, raised + tilted back so the rim clears the brow).
    { id: 'teen', label: 'Teen', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 118, limbR: 0.92 },
      accessories: [
        { shape: 'sphere', size: 146, anchor: 'head', pos: [0, 12, 38], rot: [-0.5, 0, 0],
          sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.6], color: 'body' }, // hoodie hood
      ],
      personality: { bobMul: 1.0, swayMul: 1.1, cadenceMul: 1.05, ampMul: 1.05 },
      bubbles: ['📱', '🎧', '🎮', '😂'] },

    // Generic 65+. Adult proportions, grey hair cap + glasses, damped gait, and a
    // gentle static stoop via posture.pitch (the elder-stoop rig extension).
    { id: 'elder', label: 'Elder', rig: 'humanoid',
      humanoid: { sk: 0.97, headR: 124, limbR: 1, shoe: 0x5a3d28 },
      accessories: [
        { shape: 'sphere', size: 130, anchor: 'head', pos: [0, 22, 20], rot: [-0.45, 0, 0],
          sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.55], color: 0xe4e2df }, // grey hair cap
        { shape: 'box', size: [150, 24, 12], anchor: 'face', pos: [0, 8, -4], color: 0x24242a }, // glasses
      ],
      posture: { pitch: 0.12 },
      personality: { bobMul: 0.8, swayMul: 0.9, cadenceMul: 0.75, ampMul: 0.8 },
      bubbles: ['📰', '☕', '🌷', '🧶'] },
  ],
};

export default pack;

// Pop Culture ▸ Movies ▸ The Lord of the Rings — franchise pack (dynamic-import
// only, default loaded:false). Stylized geometric homage: color + silhouette
// only, no likenesses/logos. Race/size does most of the silhouette work; one
// saturated accent per member over a shared earth-tone Fellowship palette.
// Source doc: docs/avatars/pop-culture/movies-lotr.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'movies-lotr', version: 1, label: 'The Lord of the Rings',
  path: ['Pop Culture', 'Movies', 'The Lord of the Rings'], builtin: true, franchise: true,
  // Shared un-magical earthbound base: no emissive, sphere hands.
  base: { humanoid: { emI: 0, hands: 'sphere' } },
  avatars: [
    // Frodo — Ring-bearer hobbit: small, curly brown hair, green cloak, bare feet.
    { id: 'movies-lotr/frodo', label: 'Ring-bearer hobbit (green cloak)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 112, skin: 0xe8b48c, body: 0x5c3a24, shoe: 0xe8b48c,
        eyes: 'almond', limbR: 0.9, armL: 0.95, legL: 0.85, footMul: [1.3, 0.6, 1.25], legColor: 0x6b4a30 },
      accessories: [
        { shape: 'sphere', size: [70, 44, 70], anchor: 'crown', pos: [0, -8, 4], color: 0x4a3324 },
        { shape: 'cylinder', size: [18, 18, 6], anchor: 'neck', pos: [0, 4, -14], rot: [1.57, 0, 0], color: 0xd8d8c0 },
        { shape: 'cone', size: [90, 300, 90], anchor: 'back', pos: [0, -120, 14], color: 0x4f6b47 },
        { shape: 'box', size: [180, 20, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x3a2818 },
      ],
      personality: { bobMul: 1.0, swayMul: 1.1, cadenceMul: 1.15, ampMul: 0.85 },
      // approx: hairy-hobbit-foot detail unsupported (no foot anchor) — enlarged
      // bare feet via footMul + skin-toned shoe only.
      bubbles: ['💍', '🌿', '😰', '🍞'] },

    // Sam — gardener hobbit: stouter, sandy hair, grey (not green) cloak, pack.
    { id: 'movies-lotr/sam', label: 'Gardener hobbit (grey cloak)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 112, skin: 0xe2ac82, body: 0x6e6b4a, shoe: 0xe2ac82,
        eyes: 'dots', limbR: 1.0, armL: 0.95, legL: 0.85, footMul: [1.3, 0.6, 1.25], legColor: 0x5c4a2e },
      accessories: [
        { shape: 'sphere', size: [70, 44, 70], anchor: 'crown', pos: [0, -8, 4], color: 0xc8a35a },
        { shape: 'cone', size: [90, 300, 90], anchor: 'back', pos: [0, -120, 14], color: 0x8f8f84 },
        { shape: 'cylinder', size: [30, 30, 90], anchor: 'back', pos: [0, -60, 30], rot: [1.57, 0, 0], color: 0x6b4a2e },
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'neck', pos: [0, 4, -14], rot: [1.57, 0, 0], color: 0x6b8f4e },
        { shape: 'cylinder', size: [22, 22, 40], anchor: 'handR', pos: [0, -22, 0], color: 0x6b6b68 },
      ],
      personality: { bobMul: 1.05, swayMul: 1.15, cadenceMul: 1.1, ampMul: 0.9 },
      bubbles: ['🍳', '🥔', '🎒', '😢'] },

    // Gandalf the Grey — pointed hat, long grey beard, staff. Alt "White" palette:
    // recolor robe→#f0f0ea, hat→#e8e8e0, beard→#f5f5f0, add faint robe emI ~0.08.
    { id: 'movies-lotr/gandalf', label: 'Grey wizard (pointed hat, staff)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 128, skin: 0xd8b48c, body: 0x7a7a76, shoe: 0x4a4a48,
        eyes: 'almond', limbR: 0.9, armL: 1.05, legL: 1.0, legColor: 0x7a7a76 },
      accessories: [
        { shape: 'cone', size: [80, 180, 80], anchor: 'crown', pos: [0, 70, 6], rot: [0.3, 0, 0], color: 0x6e6e6c },
        { shape: 'box', size: [70, 210, 40], anchor: 'face', pos: [0, -130, 12], color: 0xd8d8d0 },
        { shape: 'box', size: [180, 18, 155], anchor: 'hip', pos: [0, 0, 0], color: 0x5a4a30 },
        { shape: 'cone', size: [95, 320, 95], anchor: 'back', pos: [0, -110, 14], color: 0x5c5c5a },
        { shape: 'cylinder', size: [10, 10, 620], anchor: 'handR', pos: [0, -180, 0], color: 0x4a3826 },
        { shape: 'sphere', size: 26, anchor: 'handR', pos: [0, 130, 0], color: 0xcfd8e0, emissive: 0xcfd8e0, emissiveIntensity: 0.15 },
      ],
      personality: { bobMul: 0.9, swayMul: 0.8, cadenceMul: 0.85, ampMul: 0.9 },
      bubbles: ['🔥', '📜', '🕯️', '💭'] },

    // Aragorn — dark ranger leathers, cloak, stubble, sword. King variant: recolor
    // body→#1c1c1c, cloak→#2a2a30, add a thin silver circlet crown accessory.
    { id: 'movies-lotr/ranger', label: 'Ranger king (dark leathers, sword)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, skin: 0xc99770, body: 0x3a3f2e, shoe: 0x2b2620,
        eyes: 'almond', limbR: 1.05, armL: 1.0, legL: 1.0, legColor: 0x4a3c28 },
      accessories: [
        { shape: 'sphere', size: [64, 40, 64], anchor: 'crown', pos: [0, -8, 6], color: 0x2b2018 },
        { shape: 'box', size: [70, 30, 8], anchor: 'face', pos: [0, -34, -4], color: 0x2b2018 },
        { shape: 'cone', size: [95, 320, 95], anchor: 'back', pos: [0, -110, 14], color: 0x4a4f3e },
        { shape: 'box', size: [200, 24, 165], anchor: 'hip', pos: [0, 0, 0], color: 0x5c4a30 },
        { shape: 'box', size: [24, 24, 460], anchor: 'handR', pos: [0, -120, 0], color: 0xb0b0ac },
      ],
      personality: { bobMul: 1.0, swayMul: 0.7, cadenceMul: 0.95, ampMul: 1.05 },
      bubbles: ['⚔️', '👑', '🔥', '🛡️'] },

    // Legolas — long blonde hair, pointed ears, green tunic, bow + quiver on back.
    { id: 'movies-lotr/archer', label: 'Elf archer (green tunic, longbow)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 118, skin: 0xe8c9a8, body: 0x3f5c3a, shoe: 0x4a3c28,
        eyes: 'almond', limbR: 0.85, armL: 1.0, legL: 1.05, legColor: 0x33421f },
      accessories: [
        { shape: 'sphere', size: [75, 90, 75], anchor: 'crown', pos: [0, -14, 12], rot: [0.3, 0, 0], color: 0xe8d59a },
        { shape: 'cone', size: [15, 44, 15], anchor: 'head', pos: [-108, 20, 8], rot: [0, 0, -0.5], color: 0xe8c9a8 },
        { shape: 'cone', size: [15, 44, 15], anchor: 'head', pos: [108, 20, 8], rot: [0, 0, 0.5], color: 0xe8c9a8 },
        { shape: 'cylinder', size: [10, 10, 620], anchor: 'back', pos: [-30, 0, 30], rot: [0, 0, 0.25], color: 0x6b5636 },
        { shape: 'cylinder', size: [26, 26, 300], anchor: 'back', pos: [40, 40, 40], rot: [0.3, 0, -0.2], color: 0x6b5636 },
        { shape: 'box', size: [40, 60, 40], anchor: 'chest', pos: [0, 20, -6], color: 0x8a6a3d },
      ],
      personality: { bobMul: 0.75, swayMul: 0.5, cadenceMul: 1.2, ampMul: 0.9 },
      bubbles: ['🏹', '🍃', '👁️', '✨'] },

    // Gimli — stocky dwarf: red braided beard, winged helmet, chainmail, axe.
    { id: 'movies-lotr/dwarf', label: 'Dwarf warrior (red beard, axe)', rig: 'humanoid',
      humanoid: { sk: 0.7, headR: 130, skin: 0xd9a878, body: 0x5c2e22, shoe: 0x3a2e22,
        eyes: 'dots', limbR: 1.3, armL: 0.85, legL: 0.7, footMul: [1.1, 1.0, 1.1], legColor: 0x3a2e22 },
      accessories: [
        { shape: 'sphere', size: [86, 54, 86], anchor: 'crown', pos: [0, -14, 4], rot: [0.2, 0, 0], color: 0x8a6a2e, metalness: 0.5, roughness: 0.4 },
        { shape: 'cone', size: [24, 70, 24], anchor: 'crown', pos: [-72, -6, 0], rot: [0, 0, 1.2], color: 0x8a6a2e },
        { shape: 'cone', size: [24, 70, 24], anchor: 'crown', pos: [72, -6, 0], rot: [0, 0, -1.2], color: 0x8a6a2e },
        { shape: 'box', size: [90, 100, 50], anchor: 'face', pos: [0, -70, 6], color: 0xa83c28 },
        { shape: 'cylinder', size: [12, 10, 90], anchor: 'face', pos: [-26, -140, 6], color: 0xa83c28 },
        { shape: 'cylinder', size: [12, 10, 90], anchor: 'face', pos: [26, -140, 6], color: 0xa83c28 },
        { shape: 'box', size: [180, 160, 40], anchor: 'chest', pos: [0, 10, -8], color: 0x8a8a86, metalness: 0.5, roughness: 0.4 },
        { shape: 'box', size: [210, 30, 170], anchor: 'hip', pos: [0, 0, 0], color: 0x4a3020 },
        { shape: 'box', size: [140, 90, 20], anchor: 'handR', pos: [0, 40, 0], color: 0xb0b0ac },
        { shape: 'cylinder', size: [10, 10, 200], anchor: 'handR', pos: [0, -60, 0], color: 0x5c3c22 },
      ],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 0.9, ampMul: 1.1 },
      bubbles: ['🪓', '🍺', '😤', '💥'] },

    // Gollum — corrupted creature: gaunt, hunched, pale green-grey, big feet.
    { id: 'movies-lotr/corrupted', label: 'Corrupted creature (crouched, hunted)', rig: 'humanoid',
      humanoid: { sk: 0.5, headR: 100, headShape: 'oval', skin: 0x8a9c7a, body: 0x8a9c7a, shoe: 0x8a9c7a,
        eyes: 'dots', limbR: 0.6, armL: 1.1, legL: 0.8, footMul: [1.5, 0.6, 1.6], legColor: 0x8a9c7a },
      accessories: [
        { shape: 'cone', size: [12, 30, 12], anchor: 'head', pos: [-92, 24, 6], rot: [0, 0, -0.6], color: 0x8a9c7a },
        { shape: 'cone', size: [12, 30, 12], anchor: 'head', pos: [92, 24, 6], rot: [0, 0, 0.6], color: 0x8a9c7a },
        { shape: 'box', size: [150, 60, 130], anchor: 'hip', pos: [0, -10, 0], color: 0x4a4238 },
      ],
      // approx: no bulbous/luminous large-eye style (parked) — generic 'dots' eyes;
      // gaunt skull approximated by headShape:'oval'. Permanent hunch via posture.
      posture: { pitch: 0.5 },
      personality: { bobMul: 0.6, swayMul: 1.4, cadenceMul: 1.3, ampMul: 0.7 },
      bubbles: ['🐟', '💍', '😖', '🤫'] },

    // Boromir — Gondor captain: black leather surcoat, White Tree emblem, horn.
    { id: 'movies-lotr/captain', label: 'Gondor captain (black leather, white tree)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0xc9976e, body: 0x2e2620, shoe: 0x241e1a,
        eyes: 'dots', limbR: 1.05, armL: 1.05, legL: 1.0, legColor: 0x241e1a },
      accessories: [
        { shape: 'sphere', size: [65, 40, 65], anchor: 'crown', pos: [0, -8, 6], color: 0x3a2a1a },
        { shape: 'box', size: [66, 28, 8], anchor: 'face', pos: [0, -34, -4], color: 0x2a1c10 },
        { shape: 'cylinder', size: [34, 34, 6], anchor: 'chest', pos: [0, 20, -10], rot: [1.57, 0, 0], color: 0xd8d8d0 },
        { shape: 'cylinder', size: [14, 14, 150], anchor: 'chest', pos: [0, -20, -12], rot: [0, 0, 0.7], color: 0xe8dcc0 },
        { shape: 'cylinder', size: [16, 16, 20], anchor: 'chest', pos: [40, -44, -12], rot: [0, 0, 0.7], color: 0xb08a3a },
        { shape: 'cone', size: [95, 320, 95], anchor: 'back', pos: [0, -110, 14], color: 0x3a3530 },
        { shape: 'box', size: [200, 24, 165], anchor: 'hip', pos: [0, 0, 0], color: 0x4a3626 },
        { shape: 'box', size: [70, 70, 30], anchor: 'handR', pos: [0, -20, 0], color: 0x6a6058 },
      ],
      personality: { bobMul: 1.05, swayMul: 0.75, cadenceMul: 1.0, ampMul: 1.05 },
      bubbles: ['📯', '🛡️', '👑', '😔'] },
  ],
};

export default pack;

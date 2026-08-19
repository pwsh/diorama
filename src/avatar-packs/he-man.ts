// Cartoons ▸ He-Man — franchise pack (opt-in, defaults loaded:false).
// Stylized geometric toon homage — NOT licensed characters, colour + silhouette
// only. Heterogeneous cast (no shared base): armored barbarians, sorcerers, a
// floating imp, and a tiger mount. Allegiance is colour-coded by biology —
// heroes keep natural skin, villains get unnatural cool skin. Sizes are mm at sk=1.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'he-man', version: 5, label: 'He-Man',
  path: ['Cartoons', 'He-Man'], builtin: true, franchise: true,
  avatars: [
    // He-Man — bronzed barbarian, blond bob, crossed harness w/ red gem, back sword.
    { id: 'he-man/he-man', label: 'Barbarian Hero (harness & fur)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, headShape: 'sphere', limbR: 1.4, skin: 0xd9a373, body: 0xd9a373,
        legColor: 0xe8dfc8, shoe: 0x6b4a2e, eyes: 'dots', emI: 0.15, hands: 'sphere', armL: 1.05, legL: 1.0 },
      accessories: [
        { shape: 'sphere', size: [148, 96, 148], anchor: 'crown', pos: [0, 30, 0], color: 0xe8c468 },
        { shape: 'box', size: [26, 300, 14], anchor: 'chest', pos: [0, 110, 80], rot: [0, 0, 0.9], color: 0x6b4226 },
        { shape: 'box', size: [26, 300, 14], anchor: 'chest', pos: [0, 110, 80], rot: [0, 0, -0.9], color: 0x6b4226 },
        { shape: 'sphere', size: 34, anchor: 'chest', pos: [0, 110, 92], color: 0xc41e1e, emissive: 0xc41e1e, emissiveIntensity: 0.3 },
        { shape: 'box', size: [250, 40, 160], anchor: 'hip', pos: [0, 20, 0], color: 0x4a3320 },
        { shape: 'box', size: [50, 40, 20], anchor: 'hip', pos: [0, 20, 88], color: 0xc9a227 },
        { shape: 'box', size: [30, 340, 12], anchor: 'back', pos: [-30, -10, 50], rot: [0.15, 0, 0.5], color: 0xc7c9cc },
        { shape: 'cylinder', size: [18, 18, 90], anchor: 'back', pos: [-96, 130, 55], rot: [0.15, 0, 0.5], color: 0xd4af37 },
      ],
      personality: { bobMul: 1.15, swayMul: 0.6, cadenceMul: 0.9, ampMul: 1.2 }, bubbles: ['💪', '⚔️', '✨', '🛡️'] },

    // Skeletor — blue skin, bone-white skull shell over the head, purple hood/cape.
    { id: 'he-man/skeletor', label: 'Skull-Faced Sorcerer (blue & purple)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, headShape: 'sphere', limbR: 1.15, skin: 0x2f6bb0, body: 0x2f6bb0,
        legColor: 0x2f6bb0, shoe: 0x241c38, eyes: 'dots', emI: 0.1, hands: 'box', noFace: true },
      posture: { pitch: 0.08 },
      accessories: [
        { shape: 'sphere', size: [142, 148, 142], anchor: 'head', pos: [0, 8, 4], color: 0xe8e2d0 },
        { shape: 'sphere', size: [166, 172, 166], anchor: 'crown', pos: [0, 24, 44], rot: [-0.4, 0, 0], color: 0x4a2f7a, sphereArc: [0, 6.283, 0, 1.5] },
        { shape: 'box', size: [180, 12, 16], anchor: 'chest', pos: [0, 130, 78], color: 0xe8e2d0 },
        { shape: 'box', size: [150, 12, 16], anchor: 'chest', pos: [0, 96, 78], color: 0xe8e2d0 },
        { shape: 'cape', size: [280, 620, 420], anchor: 'back', pos: [0, -160, 30], rot: [0.16, 0, 0], color: 0x3a2265, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // hooded cape
        { shape: 'box', size: [220, 200, 70], anchor: 'hip', pos: [0, -10, 0], color: 0x3a2265 },
        { shape: 'cylinder', size: [16, 16, 420], anchor: 'handR', pos: [0, 60, 0], color: 0x4a3826 },
        { shape: 'cone', size: [40, 70, 0], anchor: 'handR', pos: [0, 300, 0], color: 0xe8e2d0 },
      ],
      personality: { bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.95 }, bubbles: ['💀', '☠️', '🔥', '😈'] },

    // Man-At-Arms — gold breastplate over green body-glove, grey moustache, mace.
    { id: 'he-man/man-at-arms', label: 'Weapons Captain (moustache & armor)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, headShape: 'sphere', limbR: 1.15, skin: 0xc9946a, body: 0x2e6b3a,
        legColor: 0x2e6b3a, shoe: 0x4a3320, eyes: 'dots', emI: 0.12, hands: 'box', steel: true, armL: 1.0, legL: 0.95 },
      accessories: [
        { shape: 'box', size: [80, 16, 12], anchor: 'face', pos: [0, -18, 20], color: 0x8a7050 },
        { shape: 'box', size: [40, 40, 30], anchor: 'head', pos: [-92, 30, 0], color: 0x9a9086 },
        { shape: 'box', size: [40, 40, 30], anchor: 'head', pos: [92, 30, 0], color: 0x9a9086 },
        { shape: 'box', size: [240, 240, 18], anchor: 'chest', pos: [0, 120, 78], color: 0xd4a017 },
        { shape: 'box', size: [240, 44, 160], anchor: 'hip', pos: [0, 20, 0], color: 0x5c4028 },
        { shape: 'box', size: [50, 40, 20], anchor: 'hip', pos: [0, 20, 88], color: 0xc9a227 },
        { shape: 'cylinder', size: [16, 16, 220], anchor: 'handR', pos: [0, 0, 0], color: 0x8a8a86 },
        { shape: 'box', size: [70, 90, 70], anchor: 'handR', pos: [0, 140, 0], color: 0x8a8a86 },
      ],
      personality: { bobMul: 0.9, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.85 }, bubbles: ['🔧', '⚔️', '🛡️', '😤'] },

    // Sorceress — cream costume, falcon-beaked headdress, two-tone orange/blue wings.
    { id: 'he-man/sorceress', label: 'Falcon Sorceress (winged headdress)', rig: 'humanoid',
      humanoid: { sk: 0.98, headR: 116, headShape: 'sphere', limbR: 0.85, skin: 0xdba876, body: 0xe8c9a0,
        legColor: 0xe8c9a0, shoe: 0x2f6fae, eyes: 'almond', emI: 0.2, hands: 'sphere', armL: 0.95, legL: 1.0 },
      accessories: [
        { shape: 'sphere', size: [120, 120, 120], anchor: 'crown', pos: [0, 40, 0], rot: [-0.4, 0, 0], color: 0xe8e4da, sphereArc: [0, 6.283, 0, 1.4] },
        { shape: 'cone', size: [30, 90, 0], anchor: 'crown', pos: [0, 70, -80], rot: [-1.4, 0, 0], color: 0x2f6fae },
        { shape: 'box', size: [40, 340, 200], anchor: 'back', pos: [-150, 20, 20], rot: [0.1, -0.4, 0.4], color: 0xe0791e, animate: { kind: 'flap', speed: 1.3, amp: 0.32 } }, // wing L
        { shape: 'box', size: [40, 340, 200], anchor: 'back', pos: [150, 20, 20], rot: [0.1, 0.4, -0.4], color: 0x2f6fae, animate: { kind: 'flap', speed: 1.3, amp: -0.32 } }, // wing R (mirrored amp)
        { shape: 'box', size: [22, 130, 14], anchor: 'chest', pos: [-45, 120, 80], rot: [0, 0, 0.4], color: 0xe0791e },
        { shape: 'box', size: [22, 130, 14], anchor: 'chest', pos: [45, 120, 80], rot: [0, 0, -0.4], color: 0x2f6fae },
        { shape: 'box', size: [200, 20, 130], anchor: 'hip', pos: [0, 30, 0], color: 0xc9a227 },
      ],
      personality: { bobMul: 0.85, swayMul: 0.5, cadenceMul: 0.9, ampMul: 0.85 }, bubbles: ['🦅', '✨', '🔮', '🏰'] },

    // Battle Cat — green tiger MOUNT (huge sk 1.9), red saddle + headguard.
    { id: 'he-man/battle-cat', label: 'Battle Tiger (green & red saddle)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.05, bodyLen: 900, bodyW: 260, bodyH: 300, legLen: 1.1, headR: 140, neckLen: 0,
        ears: 'round', tail: 'up', tailLen: 1.2, snout: 0.7, coat: 0x4a7a3a, belly: 0x8ac06a,
        earColor: 0x2f5a28, snoutColor: 0xd8d4b0,
        pattern: { kind: 'stripes', color: 0x1c3a18, count: 8, seed: 41 } },
      accessories: [
        { shape: 'box', size: [200, 90, 170], anchor: 'qhead', pos: [0, 60, -20], color: 0xb0281c },
        { shape: 'box', size: [210, 14, 18], anchor: 'qhead', pos: [0, 108, -20], color: 0xc9a227 },
        { shape: 'box', size: [240, 90, 260], anchor: 'qback', pos: [0, 60, 0], color: 0x8a1f18 },
        { shape: 'box', size: [30, 30, 280], anchor: 'qback', pos: [0, 108, 0], color: 0xc9a227 },
      ],
      personality: { bobMul: 1.2, swayMul: 1.3, cadenceMul: 0.8, ampMul: 1.3 }, bubbles: ['🐯', '💨', '😾', '🔥'] },

    // Teela — red hair bun + gold tiara, white/gold bodysuit, snake-motif chest armor.
    { id: 'he-man/teela', label: 'Warrior Captain (snake armor)', rig: 'humanoid',
      humanoid: { sk: 0.96, headR: 118, headShape: 'sphere', limbR: 0.95, skin: 0xdba876, body: 0xe8e4da,
        legColor: 0xe8e4da, shoe: 0x8a6a2e, eyes: 'dots', emI: 0.18, hands: 'sphere', armL: 0.95, legL: 1.0 },
      accessories: [
        { shape: 'sphere', size: 44, anchor: 'crown', pos: [0, 40, -50], color: 0x9c3a24 },
        { shape: 'cylinder', size: [80, 80, 20], anchor: 'crown', pos: [0, 30, 0], color: 0xc9a227 },
        { shape: 'box', size: [230, 220, 16], anchor: 'chest', pos: [0, 115, 78], color: 0x8a4a2e },
        { shape: 'cylinder', size: [10, 10, 130], anchor: 'chest', pos: [-40, 120, 88], rot: [0, 0, 0.6], color: 0x6b3a1e },
        { shape: 'cylinder', size: [10, 10, 130], anchor: 'chest', pos: [40, 120, 88], rot: [0, 0, -0.6], color: 0x6b3a1e },
        { shape: 'box', size: [200, 22, 130], anchor: 'hip', pos: [0, 30, 0], color: 0xc9a227 },
        { shape: 'cylinder', size: [80, 80, 16], anchor: 'handL', pos: [0, 0, 0], rot: [1.57, 0, 0], color: 0xc9a227 },
      ],
      personality: { bobMul: 1.0, swayMul: 0.7, cadenceMul: 1.05, ampMul: 1.0 }, bubbles: ['⚔️', '🛡️', '😤', '✨'] },

    // Evil-Lyn — bright yellow skin, tall pointed blue witch hat, blue robes, wand.
    { id: 'he-man/evil-lyn', label: 'Yellow Sorceress (blue robes)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 114, headShape: 'sphere', limbR: 0.85, skin: 0xd4c92a, body: 0x1f3f8a,
        legColor: 0x1f3f8a, shoe: 0x14224a, eyes: 'dots', emI: 0.15, hands: 'sphere', armL: 0.9, legL: 0.95 },
      accessories: [
        { shape: 'cone', size: [96, 280, 0], anchor: 'crown', pos: [0, 130, -30], rot: [-0.45, 0, 0], color: 0x16305e },
        { shape: 'sphere', size: [120, 60, 70], anchor: 'crown', pos: [0, 10, 40], color: 0xe8e4da, sphereArc: [0, 6.283, 0, 1.6] },
        { shape: 'box', size: [40, 40, 20], anchor: 'chest', pos: [0, 150, 78], color: 0xd4c92a },
        { shape: 'cape', size: [260, 460, 380], anchor: 'back', pos: [0, -110, 30], rot: [0.15, 0, 0], color: 0x1c2e5c, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // robe cape
        { shape: 'box', size: [180, 18, 120], anchor: 'hip', pos: [0, 30, 0], color: 0xc9a227 },
        { shape: 'cylinder', size: [10, 10, 260], anchor: 'handR', pos: [0, 40, 0], color: 0x2a2a2e },
        { shape: 'sphere', size: 26, anchor: 'handR', pos: [0, 175, 0], color: 0xffe066, emissive: 0xffe066, emissiveIntensity: 0.4 },
      ],
      personality: { bobMul: 0.85, swayMul: 0.65, cadenceMul: 0.95, ampMul: 0.9 }, bubbles: ['🔮', '😈', '✨', '💛'] },

    // Orko — diminutive floating imp; red robe + tall pointed hat, pale "O" emblem,
    // purple face scarf. Uses hover (implemented) for the canonical float — legs omitted.
    { id: 'he-man/orko', label: 'Floating Wizard (red robe)', rig: 'humanoid',
      humanoid: { sk: 0.5, headR: 100, headShape: 'sphere', limbR: 0.7, skin: 0x2f6bb0, body: 0xb0281c,
        eyes: 'dots', emI: 0.1, hands: 'sphere', armL: 0.85, hover: 260 },
      accessories: [
        { shape: 'cone', size: [110, 300, 0], anchor: 'crown', pos: [0, 120, -20], rot: [-0.4, 0, 0], color: 0xa8241a },
        { shape: 'box', size: [170, 46, 20], anchor: 'face', pos: [0, -22, 30], color: 0x5a3a7a },
        { shape: 'cylinder', size: [70, 70, 12], anchor: 'chest', pos: [0, 60, 90], rot: [1.57, 0, 0], color: 0xe8dcc0 },
        { shape: 'box', size: [200, 16, 130], anchor: 'hip', pos: [0, 20, 0], color: 0xc9a227 },
        { shape: 'cone', size: [300, 520, 0], anchor: 'hip', pos: [0, -230, 0], color: 0xb0281c },
      ],
      personality: { bobMul: 0.6, swayMul: 1.0, cadenceMul: 1.1, ampMul: 0.6 }, bubbles: ['🎩', '✨', '😅', '🪄'] },
  ],
};

export default pack;

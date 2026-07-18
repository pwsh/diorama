// Cartoons ▸ Shrek — franchise pack (dynamic-import only, default loaded:false).
// Stylized geometric toon homage of the ogre-and-fairy-tale-storybook franchise:
// color + silhouette only, no logos/likenesses. Five humanoid bipeds + two
// quadrupeds (the donkey and the dragon, pet:true). Descriptive-generic labels;
// the homaged character is named in the // comment only.
// Source doc: docs/avatars/cartoons/shrek.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'shrek', version: 3, label: 'Shrek',
  path: ['Cartoons', 'Shrek'], builtin: true, franchise: true,
  avatars: [
    // Shrek — bald olive-green ogre, big pointed ears, brown vest over poet shirt.
    { id: 'shrek/shrek', label: 'Big ogre (green, brown vest)', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 152, headShape: 'sphere', limbR: 1.5, skin: 0x6e9c3f, body: 0xe9dfc4,
        shoe: 0x5a3d22, legColor: 0x8a7550, emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
        armL: 1.0, legL: 0.95, footMul: [1.3, 0.9, 1.3] },
      accessories: [
        { shape: 'sphere', size: [50, 60, 30], anchor: 'head', pos: [-100, 10, 0], rot: [0, 0, -0.3], color: 0x6e9c3f }, // ear L
        { shape: 'sphere', size: [50, 60, 30], anchor: 'head', pos: [100, 10, 0], rot: [0, 0, 0.3], color: 0x6e9c3f }, // ear R
        { shape: 'box', size: [60, 180, 16], anchor: 'chest', pos: [-70, 10, -12], color: 0x6b4423 }, // vest panel L
        { shape: 'box', size: [60, 180, 16], anchor: 'chest', pos: [70, 10, -12], color: 0x6b4423 }, // vest panel R
        { shape: 'box', size: [260, 44, 190], anchor: 'hip', pos: [0, 0, 0], color: 0x161311 }, // belt
        { shape: 'box', size: [46, 40, 12], anchor: 'hip', pos: [0, -6, -96], color: 0xb8a24a }, // buckle
      ],
      // approx: plaid trousers simplified to solid muted tan-brown per the no-texture convention.
      personality: { bobMul: 1.3, swayMul: 1.1, cadenceMul: 0.75, ampMul: 1.3 },
      bubbles: ['🧅', '😤', '🏚️', '💚'] },

    // Donkey — grey miniature-donkey sidekick, long upright ears, black mane ridge.
    { id: 'shrek/donkey', label: 'Chatty steed (grey, long ears)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.15, bodyLen: 700, bodyW: 230, bodyH: 260, legLen: 1.25, neckLen: 90, headR: 150,
        headScale: [1.1, 1.1, 1.1], snout: 1.3, ears: 'long', tail: 'tuft', tailLen: 0.9,
        coat: 0x9e9e9e, belly: 0xd8d0c0, earColor: 0xc9a6a6, snoutColor: 0xd8d0c0, pawColor: 0x2a2a2a, tailTipColor: 0x1a1a1a },
      accessories: [
        { shape: 'box', size: [18, 80, 8], anchor: 'qneck', pos: [0, 40, 0], color: 0x1a1a1a }, // mane
        { shape: 'box', size: [18, 80, 8], anchor: 'qback', pos: [0, 40, 80], color: 0x1a1a1a }, // mane
        { shape: 'box', size: [18, 80, 8], anchor: 'qback', pos: [0, 40, 0], color: 0x1a1a1a }, // mane
        { shape: 'box', size: [18, 80, 8], anchor: 'qback', pos: [0, 40, -80], color: 0x1a1a1a }, // mane
        { shape: 'box', size: [30, 40, 20], anchor: 'qhead', pos: [0, 40, -40], color: 0x1a1a1a }, // forelock
      ],
      // corrected: doc's legLen/snout/tailLen/headScale were mm-typed; converted to multiplier/tuple forms.
      personality: { bobMul: 1.25, swayMul: 1.1, cadenceMul: 1.3, ampMul: 1.15 },
      bubbles: ['🧇', '🗣️', '😄', '⭐'] },

    // Fiona (ogre form) — green ogre skin, auburn bun, dark-green gown, brown corset.
    { id: 'shrek/fiona', label: 'Ogre princess (green, dark gown)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 132, headShape: 'sphere', limbR: 1.05, skin: 0x7ab04c, body: 0x1f5c34,
        shoe: 0x3a2a1a, legColor: 0x1f5c34, emI: 0, hands: 'sphere', eyes: 'almond', steel: false, armL: 0.98, legL: 0.98, gown: true },
      accessories: [
        { shape: 'sphere', size: [45, 50, 26], anchor: 'head', pos: [-95, 10, 0], rot: [0, 0, -0.3], color: 0x7ab04c }, // ear L
        { shape: 'sphere', size: [45, 50, 26], anchor: 'head', pos: [95, 10, 0], rot: [0, 0, 0.3], color: 0x7ab04c }, // ear R
        { shape: 'sphere', size: [110, 90, 100], anchor: 'crown', pos: [0, -6, 10], color: 0x9c3b1f }, // hair
        { shape: 'sphere', size: 50, anchor: 'crown', pos: [0, 60, 0], rot: [0.4, 0, 0], color: 0x9c3b1f }, // bun
        { shape: 'box', size: [120, 150, 14], anchor: 'chest', pos: [0, -10, -12], color: 0x6b4423 }, // corset
        { shape: 'box', size: [6, 120, 6], anchor: 'chest', pos: [-14, -10, -20], color: 0x8a6238 }, // lace line
        { shape: 'box', size: [6, 120, 6], anchor: 'chest', pos: [14, -10, -20], color: 0x8a6238 }, // lace line
        { shape: 'cone', size: [180, 340], anchor: 'hip', pos: [0, -140, 0], color: 0x1f5c34 }, // gown skirt
      ],
      personality: { bobMul: 1.0, swayMul: 0.95, cadenceMul: 1.1, ampMul: 1.05 },
      bubbles: ['👑', '🥋', '🌙', '💚'] },

    // Puss in Boots — upright orange tabby swashbuckler, cavalier hat, cape, rapier.
    { id: 'shrek/puss', label: 'Swashbuckling cat (orange tabby, feathered hat)', rig: 'humanoid',
      humanoid: { sk: 0.68, headR: 100, headShape: 'sphere', limbR: 0.8, skin: 0xd97a2b, body: 0xd97a2b,
        shoe: 0xb5241f, legColor: 0xd97a2b, emI: 0, hands: 'sphere', eyes: 'almond', steel: false,
        armL: 0.95, legL: 0.95, footMul: [1.25, 1.0, 1.25] },
      accessories: [
        { shape: 'cone', size: [30, 50], anchor: 'head', pos: [-50, 60, 0], rot: [0, 0, -0.3], color: 0xd97a2b }, // cat ear L
        { shape: 'cone', size: [30, 50], anchor: 'head', pos: [50, 60, 0], rot: [0, 0, 0.3], color: 0xd97a2b }, // cat ear R
        { shape: 'cylinder', size: [2, 2, 60], anchor: 'face', pos: [-30, -20, -20], rot: [0, 0.3, 0.2], color: 0xf2f0e6 }, // whisker
        { shape: 'cylinder', size: [2, 2, 60], anchor: 'face', pos: [30, -20, -20], rot: [0, -0.3, -0.2], color: 0xf2f0e6 }, // whisker
        { shape: 'sphere', size: [40, 60, 10], anchor: 'chest', pos: [0, 10, -12], color: 0xf2f0e6 }, // white chest patch
        { shape: 'sphere', size: [110, 60, 110], anchor: 'crown', pos: [0, 10, 0], rot: [0.4, 0, 0], color: 0x2a1a12, sphereArc: [0, 6.283, 0, 1.3] }, // cavalier hat
        { shape: 'cone', size: [8, 80], anchor: 'crown', pos: [30, 40, -20], rot: [-0.3, 0, 0.2], color: 0xe8c430 }, // feather plume
        { shape: 'cape', size: [150, 255, 225], anchor: 'back', pos: [0, -120, 14], rot: [0.12, 0, 0], color: 0x161619, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // cape
        { shape: 'cylinder', size: [18, 10, 180], anchor: 'tailbone', pos: [0, -40, -40], rot: [0.9, 0, 0], color: 0xd97a2b }, // tail
        { shape: 'cylinder', size: [6, 6, 260], anchor: 'handR', pos: [0, -100, 0], color: 0xb8bcc2 }, // rapier
      ],
      // approx: tail is a static curl (no idle-sway channel); whiskers may not read below ~50px.
      personality: { bobMul: 0.85, swayMul: 1.0, cadenceMul: 1.25, ampMul: 1.1 },
      bubbles: ['⚔️', '🥺', '🐈', '🥛'] },

    // Lord Farquaad — tiny vain tyrant, blond pageboy, tall red-and-white hat, red cape.
    { id: 'shrek/farquaad', label: 'Tiny tyrant (red & black, tall red hat)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 130, headShape: 'sphere', limbR: 0.95, skin: 0xe8c39a, body: 0xb5151a,
        shoe: 0x0f0f0f, legColor: 0x141414, limbColors: { armL: 0x1a1a1a, armR: 0x1a1a1a },
        emI: 0, hands: 'sphere', eyes: 'dots', steel: false },
      accessories: [
        { shape: 'cylinder', size: [95, 95, 60], anchor: 'crown', pos: [0, 40, 0], rot: [0.3, 0, 0], color: 0xb5151a }, // hat
        { shape: 'sphere', size: 50, anchor: 'crown', pos: [0, 80, 0], color: 0xf2f2ee }, // white hat top
        { shape: 'sphere', size: [130, 80, 130], anchor: 'crown', pos: [0, -6, 0], color: 0xe8c468, sphereArc: [0, 6.283, 0, 1.4] }, // pageboy dome
        { shape: 'box', size: [130, 20, 10], anchor: 'face', pos: [0, 40, -6], color: 0xe8c468 }, // fringe
        { shape: 'box', size: [40, 40, 30], anchor: 'face', pos: [0, -70, -10], color: 0xe8c39a }, // chin
        { shape: 'cape', size: [190, 300, 280], anchor: 'back', pos: [0, -135, 14], rot: [0.12, 0, 0], color: 0xb5151a, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // cape
        { shape: 'box', size: [100, 16, 10], anchor: 'back', pos: [0, 20, 20], color: 0xf2f2ee }, // cape trim
        { shape: 'box', size: [200, 30, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x141414 }, // belt
        { shape: 'box', size: [34, 28, 10], anchor: 'hip', pos: [0, 0, -78], color: 0xd4af37 }, // buckle
      ],
      // approx: gold-trimmed glove cuffs dropped to hold the ≤10-primitive budget.
      personality: { bobMul: 0.6, swayMul: 0.55, cadenceMul: 1.0, ampMul: 0.55 },
      bubbles: ['👑', '😤', '🏰', '💍'] },

    // Dragon — giant magenta wyrm, pink belly, bat wings, cheek + dorsal spikes.
    { id: 'shrek/dragon', label: 'Guardian wyrm (magenta, bat wings)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.35, bodyLen: 1500, bodyW: 420, bodyH: 480, legLen: 0.6, neckLen: 480, headR: 210,
        headScale: [1.3, 1.3, 1.3], snout: 2.2, ears: 'round', tail: 'up', tailLen: 1.4,
        coat: 0x8a2547, belly: 0xe8a0c0, earColor: 0x5c1830, snoutColor: 0x6e1c38, pawColor: 0x3a1020, tailTipColor: 0x4a1020 },
      accessories: [
        { shape: 'cone', size: [24, 60], anchor: 'qhead', pos: [-60, 0, -40], rot: [0, 0, -0.6], color: 0xf2f2ee }, // cheek spike
        { shape: 'cone', size: [24, 60], anchor: 'qhead', pos: [60, 0, -40], rot: [0, 0, 0.6], color: 0xf2f2ee }, // cheek spike
        { shape: 'cone', size: [20, 50], anchor: 'qhead', pos: [-70, -30, -20], rot: [0, 0, -0.8], color: 0xf2f2ee }, // cheek spike
        { shape: 'cone', size: [22, 50], anchor: 'qhead', pos: [0, 60, 20], color: 0x4a1020 }, // dorsal spine
        { shape: 'cone', size: [22, 55], anchor: 'qneck', pos: [0, 60, 0], color: 0x4a1020 }, // dorsal spine
        { shape: 'cone', size: [22, 55], anchor: 'qback', pos: [0, 60, 60], color: 0x4a1020 }, // dorsal spine
        { shape: 'cone', size: [22, 50], anchor: 'qback', pos: [0, 60, -60], color: 0x4a1020 }, // dorsal spine
        { shape: 'cone', size: [300, 60], anchor: 'qback', pos: [-120, 120, 40], rot: [0.6, 0, -1.2], color: 0x5c1a40, animate: { kind: 'flap', speed: 1.1, amp: 0.35 } }, // wing L
        { shape: 'cone', size: [300, 60], anchor: 'qback', pos: [120, 120, 40], rot: [0.6, 0, 1.2], color: 0x5c1a40, animate: { kind: 'flap', speed: 1.1, amp: -0.35 } }, // wing R (mirrored amp)
      ],
      // approx: webbed ears → 'round'; spade tail-tip → tailTipColor accent; wings beat via animate:'flap'.
      personality: { bobMul: 0.55, swayMul: 0.6, cadenceMul: 0.7, ampMul: 0.9 },
      bubbles: ['🔥', '💜', '🦇', '🥰'] },

    // Gingy — tiny sentient gingerbread cookie, white icing trim, gumdrop buttons.
    { id: 'shrek/gingy', label: 'Cookie fellow (gingerbread, icing trim)', rig: 'humanoid',
      humanoid: { sk: 0.5, headR: 80, headShape: 'oval', limbR: 1.3, skin: 0x8a5a2e, body: 0x8a5a2e,
        shoe: 0x6e4423, legColor: 0x8a5a2e, emI: 0, hands: 'sphere', eyes: 'dots', steel: false,
        noFace: true, armL: 0.55, legL: 0.55, footMul: [1.2, 0.6, 1.1] },
      accessories: [
        { shape: 'box', size: [60, 10, 6], anchor: 'face', pos: [0, -40, -8], color: 0xf5f2ea }, // icing smile
        { shape: 'box', size: [80, 10, 6], anchor: 'crown', pos: [0, -6, -6], color: 0xf5f2ea }, // icing hairline
        { shape: 'sphere', size: 16, anchor: 'chest', pos: [0, 20, -12], color: 0xd4213b }, // gumdrop button
        { shape: 'sphere', size: 16, anchor: 'chest', pos: [0, -20, -12], color: 0x2f9e44 }, // gumdrop button
        { shape: 'cylinder', size: [26, 26, 8], anchor: 'handL', pos: [0, 0, 0], color: 0xf5f2ea }, // icing cuff L
        { shape: 'cylinder', size: [26, 26, 8], anchor: 'handR', pos: [0, 0, 0], color: 0xf5f2ea }, // icing cuff R
      ],
      // approx: icing smile is one straight box (no curved geometry); ankle icing omitted (no foot anchor).
      personality: { bobMul: 1.35, swayMul: 1.2, cadenceMul: 1.4, ampMul: 0.5 },
      bubbles: ['🍪', '😊', '🧁', '💪'] },
  ],
};

export default pack;

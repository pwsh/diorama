// Sci-Fi ▸ Stranger Things — franchise pack (dynamic-import only, default
// loaded:false). Genre beats medium: a horror/sci-fi TV show lives under
// Sci-Fi (Firefly precedent), not Pop Culture. Stylized geometric homage: color
// + silhouette only, no likenesses/logos/creature-design geometry beyond
// silhouette. All members share a base spec; the Demogorgon is a pet:true
// creature (skips bubbles + standing activities). Source doc:
// docs/avatars/sci-fi/stranger-things.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'stranger-things', version: 2, label: 'Stranger Things',
  path: ['Sci-Fi', 'Stranger Things'], builtin: true, franchise: true,
  // Shared human base spec — spread under every member, then overridden.
  base: {
    rig: 'humanoid',
    humanoid: { sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'sphere',
      eyes: 'dots', steel: false, emI: 0, armL: 1.0, legL: 1.0, footMul: [1.0, 1.0, 1.0] },
  },
  avatars: [
    // Eleven — buzzed head, pink dress, oversized navy windbreaker.
    { id: 'stranger-things/psychic-girl', label: 'Escaped test subject (buzzed head, pink dress, blue jacket)',
      rig: 'humanoid',
      humanoid: { sk: 0.8, headR: 108, limbR: 0.78, skin: 0xe8c4a0, body: 0xeaa9bb,
        legColor: 0xeaa9bb, shoe: 0xf2f2ec, armL: 0.78, legL: 0.8 },
      accessories: [
        { shape: 'box', size: [260, 220, 22], anchor: 'chest', pos: [0, 20, -8], color: 0x1f3a5c }, // oversized windbreaker
        { shape: 'box', size: [6, 220, 24], anchor: 'chest', pos: [-124, 20, -8], color: 0xf0f0f0 }, // racing stripe L
        { shape: 'box', size: [6, 220, 24], anchor: 'chest', pos: [124, 20, -8], color: 0xf0f0f0 }, // racing stripe R
        { shape: 'box', size: [50, 10, 8], anchor: 'chest', pos: [0, 130, -12], color: 0xf5f5f0 }, // white collar peek
        { shape: 'box', size: [108, 8, 108], anchor: 'crown', pos: [0, -6, 0], color: 0x4a3626 }, // buzzed head
        { shape: 'sphere', size: 8, anchor: 'face', pos: [-8, -14, -8], color: 0x7a1414 }, // nosebleed accent
      ],
      personality: { bobMul: 0.75, swayMul: 0.5, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['🧇', '📻', '🩸', '😐'] },

    // Mike Wheeler — yellow/blue striped shirt, walkie-talkie.
    { id: 'stranger-things/party-leader', label: 'Party leader (striped shirt, walkie-talkie)',
      rig: 'humanoid',
      humanoid: { sk: 0.86, headR: 118, limbR: 0.86, skin: 0xe0b28c, body: 0xd9c14a,
        legColor: 0x6a86a8, shoe: 0xf0f0ec, armL: 0.86, legL: 0.88 },
      accessories: [
        { shape: 'box', size: [180, 10, 4], anchor: 'chest', pos: [0, 70, -8], color: 0x2f4f7a }, // stripe band
        { shape: 'box', size: [180, 10, 4], anchor: 'chest', pos: [0, 30, -8], color: 0x2f4f7a }, // stripe band
        { shape: 'box', size: [118, 40, 118], anchor: 'crown', pos: [0, -6, 4], color: 0x241a12 }, // side-swept hair
        { shape: 'box', size: [18, 40, 14], anchor: 'handR', pos: [0, -18, 0], color: 0x2a2a2a }, // walkie body
        { shape: 'cylinder', size: [3, 3, 30], anchor: 'handR', pos: [0, 8, 0], color: 0x9a9a9a }, // antenna
      ],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['📻', '🎲', '🚲', '❤️'] },

    // Dustin Henderson — red/white/navy trucker cap, curly tufts, backpack strap.
    { id: 'stranger-things/curious-inventor', label: 'Science kid (trucker cap, curly hair)',
      rig: 'humanoid',
      humanoid: { sk: 0.84, headR: 120, limbR: 0.86, skin: 0xe8bd92, body: 0x7a8a9a,
        legColor: 0x8a6a4a, shoe: 0xf0ece0, armL: 0.86, legL: 0.86 },
      accessories: [
        { shape: 'box', size: [130, 70, 20], anchor: 'crown', pos: [0, 6, -34], rot: [0.45, 0, 0], color: 0xb2242a }, // cap front panel
        { shape: 'box', size: [130, 12, 20], anchor: 'crown', pos: [0, 22, -34], rot: [0.45, 0, 0], color: 0xf0f0ec }, // white mid stripe
        { shape: 'box', size: [130, 60, 20], anchor: 'crown', pos: [0, 6, 40], color: 0x24406e }, // mesh back panel
        { shape: 'cylinder', size: [90, 90, 8], anchor: 'crown', pos: [0, -6, -70], rot: [1.1, 0, 0], color: 0x3a2a1a }, // brim
        { shape: 'sphere', size: 30, anchor: 'head', pos: [-64, -6, 10], color: 0x8a6440 }, // curl tuft L
        { shape: 'sphere', size: 30, anchor: 'head', pos: [64, -6, 10], color: 0x8a6440 }, // curl tuft R
        { shape: 'box', size: [14, 300, 8], anchor: 'chest', pos: [0, 20, -8], rot: [0, 0, 0.5], color: 0x5a6b3a }, // backpack strap (diagonal)
      ],
      personality: { bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.1 },
      bubbles: ['🧢', '🔬', '📻', '🍫'] },

    // Lucas Sinclair — low camo headband, slingshot.
    { id: 'stranger-things/sharp-shooter', label: 'Cautious scout (camo headband, slingshot)',
      rig: 'humanoid',
      humanoid: { sk: 0.86, headR: 118, limbR: 0.88, skin: 0x6b4a30, body: 0x7a94b0,
        legColor: 0x4a5f80, shoe: 0x2a2a2a, armL: 0.88, legL: 0.88 },
      accessories: [
        { shape: 'box', size: [50, 24, 140], anchor: 'crown', pos: [-40, -14, 0], color: 0x5a6b3a }, // camo patch L
        { shape: 'box', size: [46, 24, 140], anchor: 'crown', pos: [10, -14, 0], color: 0x4a3a20 }, // camo patch mid
        { shape: 'box', size: [44, 24, 140], anchor: 'crown', pos: [48, -14, 0], color: 0x8a7a52 }, // camo patch R
        { shape: 'cylinder', size: [10, 10, 70], anchor: 'handR', pos: [0, -20, 0], color: 0x5a3a20 }, // slingshot fork
        { shape: 'box', size: [100, 20, 100], anchor: 'head', pos: [0, 30, 0], color: 0x1c140e }, // short dark hair (mostly covered)
      ],
      personality: { bobMul: 0.95, swayMul: 0.85, cadenceMul: 1.0, ampMul: 0.95 },
      bubbles: ['🎯', '🚲', '🛡️', '😠'] },

    // Will Byers — red vest over tan shirt, slight build, sketchbook.
    { id: 'stranger-things/quiet-artist', label: 'Quiet artist (red vest, sandy hair)',
      rig: 'humanoid',
      humanoid: { sk: 0.78, headR: 112, limbR: 0.75, skin: 0xe8c4a0, body: 0xc9a86a,
        legColor: 0x5a6f92, shoe: 0x3a2a1a, armL: 0.75, legL: 0.78 },
      accessories: [
        { shape: 'box', size: [170, 200, 18], anchor: 'chest', pos: [0, 20, -6], color: 0x8a2f2f }, // red vest
        { shape: 'box', size: [112, 36, 112], anchor: 'crown', pos: [0, -6, 2], color: 0x9c7a4a }, // sandy hair
        { shape: 'box', size: [50, 66, 10], anchor: 'handL', pos: [0, -22, 0], color: 0xe8e0d0 }, // sketchbook
      ],
      personality: { bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.8 },
      bubbles: ['🎨', '📓', '🌌', '💭'] },

    // Max Mayfield — fiery red hair, striped tee, skateboard.
    { id: 'stranger-things/skater-newcomer', label: 'Skater newcomer (fiery red hair, striped tee)',
      rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 116, limbR: 0.85, skin: 0xe8c2a0, body: 0xc23b3b,
        legColor: 0x4a6088, shoe: 0xb2242a, armL: 0.85, legL: 0.85 },
      accessories: [
        { shape: 'sphere', size: [140, 120, 140], anchor: 'crown', pos: [0, -6, 4], color: 0xd1531f }, // red hair
        { shape: 'box', size: [35, 90, 30], anchor: 'head', pos: [-60, -30, 6], color: 0xd1531f }, // side lobe L
        { shape: 'box', size: [35, 90, 30], anchor: 'head', pos: [60, -30, 6], color: 0xd1531f }, // side lobe R
        { shape: 'box', size: [180, 10, 4], anchor: 'chest', pos: [0, 60, -8], color: 0xe0b83a }, // stripe band
        { shape: 'box', size: [180, 10, 4], anchor: 'chest', pos: [0, 30, -8], color: 0x2f4f7a }, // stripe band
        { shape: 'box', size: [30, 140, 8], anchor: 'handL', pos: [0, -30, 0], color: 0x8a1f1f }, // skateboard
        { shape: 'cylinder', size: [8, 8, 12], anchor: 'handL', pos: [0, -90, 6], rot: [0, 0, 1.5708], color: 0x1a1a1a }, // wheel end
      ],
      personality: { bobMul: 1.1, swayMul: 1.05, cadenceMul: 1.1, ampMul: 1.05 },
      bubbles: ['🛹', '🕹️', '🎧', '😏'] },

    // Steve Harrington — tall feathered hair, denim jacket, nail bat.
    { id: 'stranger-things/mall-cool-guy', label: 'Reluctant protector (feathered hair, nail bat)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 128, limbR: 0.95, skin: 0xe0b28c, body: 0x8a94a0,
        legColor: 0x8a9cb0, shoe: 0xf2f2ec, armL: 0.95, legL: 1.0 },
      accessories: [
        { shape: 'sphere', size: [130, 70, 130], anchor: 'crown', pos: [0, 6, 6], rot: [0.4, 0, 0], color: 0x2a1c12 }, // feathered hair (tilted back)
        { shape: 'box', size: [200, 180, 16], anchor: 'chest', pos: [0, 20, -6], color: 0x4a6a8c }, // denim jacket
        { shape: 'box', size: [70, 24, 8], anchor: 'chest', pos: [0, 120, -8], color: 0x4a6a8c }, // popped collar
        { shape: 'cylinder', size: [18, 18, 120], anchor: 'handR', pos: [0, -30, 0], color: 0x8a6a42 }, // nail bat
        { shape: 'cone', size: [6, 20], anchor: 'handR', pos: [-16, -70, 0], rot: [0, 0, -1.2], color: 0x2a2a2a }, // nail
        { shape: 'cone', size: [6, 20], anchor: 'handR', pos: [16, -70, 0], rot: [0, 0, 1.2], color: 0x2a2a2a }, // nail
        { shape: 'cone', size: [6, 20], anchor: 'handR', pos: [0, -90, -14], rot: [1.2, 0, 0], color: 0x2a2a2a }, // nail
      ],
      personality: { bobMul: 1.05, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['💇', '🏏', '🛡️', '😏'] },

    // Jim Hopper — tan sheriff uniform, wide-brim Stetson, mustache, duty belt.
    { id: 'stranger-things/small-town-sheriff', label: 'Small-town sheriff (tan uniform, wide-brim hat)',
      rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 132, limbR: 1.15, skin: 0xc98a5e, body: 0xb89a68,
        legColor: 0x2a3a52, shoe: 0x1a1a1a, armL: 1.1, legL: 1.05 },
      accessories: [
        { shape: 'cylinder', size: [92, 92, 60], anchor: 'crown', pos: [0, 20, 0], color: 0x8a7248 }, // Stetson crown
        { shape: 'cylinder', size: [180, 180, 12], anchor: 'crown', pos: [0, -6, 0], rot: [0.1, 0, 0], color: 0x8a7248 }, // wide brim
        { shape: 'sphere', size: 20, anchor: 'chest', pos: [-40, 116, -8], color: 0xd4af37, emissiveIntensity: 0.1 }, // badge
        { shape: 'box', size: [34, 8, 6], anchor: 'face', pos: [0, -12, -8], color: 0x6b5a42 }, // mustache
        { shape: 'box', size: [260, 60, 20], anchor: 'hip', pos: [0, 0, 0], color: 0x1a1a1a }, // duty belt
        { shape: 'box', size: [40, 60, 24], anchor: 'hip', pos: [96, -14, -60], color: 0x1a1a1a }, // holstered sidearm
      ],
      personality: { bobMul: 0.85, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.85 },
      bubbles: ['☕', '🚓', '😤', '❤️'] },

    // The Demogorgon — petal-flap head, elongated limbs, clawed. pet:true.
    { id: 'stranger-things/flower-faced-hunter', label: 'Faceless hunter (petal-jawed head, elongated limbs)',
      rig: 'humanoid', pet: true,
      humanoid: { sk: 1.2, headR: 110, skin: 0xc9baa0, body: 0xc9baa0, legColor: 0xb8ab8e,
        shoe: 0x1a1a1a, emI: 0.04, eyes: 'none', noFace: true, limbR: 0.68,
        armL: 1.3, legL: 1.35, footMul: [0.8, 1.3, 1.1] },
      posture: { pitch: 0.35 },
      accessories: [
        { shape: 'cone', size: [50, 70], anchor: 'crown', pos: [0, 20, -40], rot: [-0.6, 0, 0], color: 0xc2b39a }, // petal flap front
        { shape: 'cone', size: [50, 70], anchor: 'crown', pos: [-40, 20, 0], rot: [0, 0, -0.9], color: 0xc2b39a }, // petal flap L
        { shape: 'cone', size: [50, 70], anchor: 'crown', pos: [40, 20, 0], rot: [0, 0, 0.9], color: 0xc2b39a }, // petal flap R
        { shape: 'cone', size: [50, 70], anchor: 'crown', pos: [0, 20, 40], rot: [0.6, 0, 0], color: 0xc2b39a }, // petal flap back
        { shape: 'cone', size: [30, 40], anchor: 'crown', pos: [0, 40, 0], color: 0x6b2020 }, // inner-mouth hint (darker)
        { shape: 'cone', size: [14, 40], anchor: 'handL', pos: [0, -20, 0], color: 0x1a1a1a }, // clawed hand L (approx)
        { shape: 'cone', size: [14, 40], anchor: 'handR', pos: [0, -20, 0], color: 0x1a1a1a }, // clawed hand R (approx)
      ],
      // approx: petal head posed permanently closed (no unfurl animation channel);
      // clawed feet approximated off the foot geometry (no ankle/foot anchor).
      personality: { bobMul: 0.6, swayMul: 0.3, cadenceMul: 0.75, ampMul: 0.7 },
      bubbles: ['🌸', '🦷', '👀', '🩸'] },
  ],
};

export default pack;

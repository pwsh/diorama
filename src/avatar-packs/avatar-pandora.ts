// Sci-Fi ▸ Avatar (Pandora) — franchise pack (dynamic-import only, default
// loaded:false). Genre beats medium: a sci-fi film franchise lives under Sci-Fi
// (Firefly / Stranger Things precedent). Stylized geometric toon homage: color +
// silhouette only, no likenesses/logos/creature-design geometry beyond
// silhouette/build. The four Na'vi members share a base BODY spec (cyan-blue,
// tall, oval-skulled); the three human/RDA members override nearly every field
// back to ordinary human proportions. Because avatars.ts merges accessories as
// `a.accessories ?? base.accessories` (member array REPLACES base's, never
// concatenates), the shared Na'vi accessory set (pointed ears + tail + queue)
// is repeated INLINE in each Na'vi member's own accessories list, NOT hoisted
// into base. Source doc: docs/avatars/sci-fi/avatar-pandora.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'avatar-pandora', version: 1, label: 'Avatar (Pandora)',
  path: ['Sci-Fi', 'Avatar'], builtin: true, franchise: true,
  // Shared Na'vi body spec — spread under every member, then the 3 RDA humans
  // override it back to human values. (Accessories are NOT in base — see header.)
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1.2, headR: 128, headShape: 'oval', limbR: 0.85,
      skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
      hands: 'sphere', eyes: 'almond', emI: 0.03, earSkip: true,
      armL: 1.05, legL: 1.1, footMul: [0.9, 0.9, 1.15],
    },
  },
  avatars: [
    // Jake Sully — adopted clan leader in Na'vi form; bow + human dog-tag pendant.
    { id: 'avatar-pandora/navi-clan-leader',
      label: 'Adopted clan leader (Na\'vi form, bow, dog-tag pendant)',
      rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 128, headShape: 'oval', limbR: 0.85,
        skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
        hands: 'sphere', eyes: 'almond', emI: 0.03, earSkip: true,
        armL: 1.05, legL: 1.1, footMul: [0.9, 0.9, 1.15] },
      accessories: [
        { shape: 'cone', size: [10, 36], anchor: 'head', pos: [-84, 20, 14], rot: [0, 0, -0.5], color: 0x2a8fa3 }, // pointed ear L
        { shape: 'cone', size: [10, 36], anchor: 'head', pos: [84, 20, 14], rot: [0, 0, 0.5], color: 0x2a8fa3 }, // pointed ear R
        { shape: 'cylinder', size: [15, 12, 260], anchor: 'tailbone', pos: [0, -110, 60], rot: [0.5, 0, 0], color: 0x2a8fa3 }, // tail seg 1
        { shape: 'cylinder', size: [11, 8, 220], anchor: 'tailbone', pos: [0, -300, 150], rot: [0.85, 0, 0], color: 0x2a8fa3 }, // tail seg 2
        { shape: 'cylinder', size: [11, 7, 320], anchor: 'crown', pos: [0, -60, 60], rot: [0.5, 0, 0], color: 0x14100c }, // queue (neural braid)
        { shape: 'box', size: [30, 40, 4], anchor: 'chest', pos: [0, 30, -10], color: 0x9a9a92 }, // dog-tag pendant (his one tell)
        { shape: 'cylinder', size: [10, 10, 900], anchor: 'handR', pos: [0, -20, 0], color: 0x5a3a20 }, // bow (straight approx)
      ],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.05 },
      bubbles: ['🏹', '🦅', '💙', '🌳'] },

    // Neytiri — Omatikaya huntress; feathered/beaded queue, beaded choker, bow.
    { id: 'avatar-pandora/navi-huntress',
      label: 'Na\'vi huntress (feathered queue, beaded choker, bow)',
      rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 128, headShape: 'oval', limbR: 0.8,
        skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
        hands: 'sphere', eyes: 'almond', emI: 0.04, earSkip: true,
        armL: 1.0, legL: 1.05, footMul: [0.88, 0.9, 1.15] },
      accessories: [
        { shape: 'cone', size: [9, 32], anchor: 'head', pos: [-82, 20, 14], rot: [0, 0, -0.5], color: 0x2a8fa3 }, // pointed ear L
        { shape: 'cone', size: [9, 32], anchor: 'head', pos: [82, 20, 14], rot: [0, 0, 0.5], color: 0x2a8fa3 }, // pointed ear R
        { shape: 'cylinder', size: [13, 11, 250], anchor: 'tailbone', pos: [0, -110, 58], rot: [0.5, 0, 0], color: 0x2a8fa3 }, // tail seg 1
        { shape: 'cylinder', size: [11, 8, 210], anchor: 'tailbone', pos: [0, -290, 145], rot: [0.85, 0, 0], color: 0x2a8fa3 }, // tail seg 2
        { shape: 'cylinder', size: [10, 6, 300], anchor: 'crown', pos: [0, -55, 58], rot: [0.5, 0, 0], color: 0x14100c }, // queue
        { shape: 'cone', size: [10, 60], anchor: 'crown', pos: [0, -200, 155], rot: [0.9, 0, 0], color: 0xb2542a }, // feather accent at queue tip
        { shape: 'box', size: [140, 10, 8], anchor: 'chest', pos: [0, 120, -12], color: 0xe8dcc4 }, // beaded choker band
        { shape: 'sphere', size: 7, anchor: 'chest', pos: [0, 116, -18], color: 0x3a2a1a }, // choker bead accent
        { shape: 'cylinder', size: [9, 9, 850], anchor: 'handR', pos: [0, -20, 0], color: 0x5a3a20 }, // bow (straight approx)
        { shape: 'sphere', size: 6, anchor: 'face', pos: [-18, 6, -14], color: 0xdfffff, emissive: 0xdfffff, emissiveIntensity: 0.3 }, // biolum freckle accent
      ],
      // approx: bioluminescent facial "freckles" reduced to ONE emissive accent
      // sphere (no scatter-pattern primitive — parked rig gap).
      personality: { bobMul: 1.05, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🏹', '🦅', '🌺', '😤'] },

    // Mo'at — Tsahìk (clan spiritual elder); tall feathered headdress, staff.
    { id: 'avatar-pandora/navi-spiritual-elder',
      label: 'Clan spiritual elder (feathered headdress, bone necklace, staff)',
      rig: 'humanoid',
      humanoid: { sk: 1.15, headR: 128, headShape: 'oval', limbR: 0.85,
        skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
        hands: 'sphere', eyes: 'almond', emI: 0.03, earSkip: true,
        armL: 1.0, legL: 1.05, footMul: [0.9, 0.9, 1.15] },
      posture: { pitch: 0.06 }, // a slight elder's forward set (pack's only Na'vi posture bias)
      accessories: [
        { shape: 'cone', size: [10, 34], anchor: 'head', pos: [-83, 20, 14], rot: [0, 0, -0.5], color: 0x2a8fa3 }, // pointed ear L
        { shape: 'cone', size: [10, 34], anchor: 'head', pos: [83, 20, 14], rot: [0, 0, 0.5], color: 0x2a8fa3 }, // pointed ear R
        { shape: 'cylinder', size: [14, 11, 250], anchor: 'tailbone', pos: [0, -110, 58], rot: [0.5, 0, 0], color: 0x2a8fa3 }, // tail seg 1
        { shape: 'cylinder', size: [11, 8, 210], anchor: 'tailbone', pos: [0, -290, 145], rot: [0.85, 0, 0], color: 0x2a8fa3 }, // tail seg 2
        { shape: 'cylinder', size: [10, 6, 280], anchor: 'crown', pos: [0, -55, 58], rot: [0.5, 0, 0], color: 0x14100c }, // queue (plain)
        { shape: 'box', size: [140, 30, 140], anchor: 'crown', pos: [0, 24, -6], rot: [0.45, 0, 0], color: 0xe8dcc4 }, // headdress band (raised+tilted back)
        { shape: 'cone', size: [20, 160], anchor: 'crown', pos: [0, 120, 10], rot: [0.25, 0, 0], color: 0xb2542a }, // upright feather plume
        { shape: 'box', size: [150, 14, 10], anchor: 'chest', pos: [0, 100, -12], color: 0xe8dcc4 }, // bone/tooth necklace
        { shape: 'cylinder', size: [14, 14, 950], anchor: 'handR', pos: [0, -20, 0], color: 0x3a2a1a }, // walking staff
      ],
      personality: { bobMul: 0.85, swayMul: 0.6, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['🙏', '🌳', '🔮', '😌'] },

    // Tsu'tey — clan's finest warrior; diagonal quiver strap, spear, warpaint.
    { id: 'avatar-pandora/navi-warrior-scout',
      label: 'Na\'vi warrior-scout (quiver strap, spear, warpaint)',
      rig: 'humanoid',
      humanoid: { sk: 1.25, headR: 128, headShape: 'oval', limbR: 0.95,
        skin: 0x2a8fa3, body: 0x2a8fa3, legColor: 0x2a8fa3, shoe: 0x2a8fa3,
        hands: 'sphere', eyes: 'almond', emI: 0.03, earSkip: true,
        armL: 1.1, legL: 1.1, footMul: [0.92, 0.9, 1.15] },
      accessories: [
        { shape: 'cone', size: [11, 38], anchor: 'head', pos: [-86, 20, 14], rot: [0, 0, -0.5], color: 0x2a8fa3 }, // pointed ear L
        { shape: 'cone', size: [11, 38], anchor: 'head', pos: [86, 20, 14], rot: [0, 0, 0.5], color: 0x2a8fa3 }, // pointed ear R
        { shape: 'cylinder', size: [16, 12, 270], anchor: 'tailbone', pos: [0, -115, 62], rot: [0.5, 0, 0], color: 0x2a8fa3 }, // tail seg 1
        { shape: 'cylinder', size: [12, 9, 230], anchor: 'tailbone', pos: [0, -310, 155], rot: [0.85, 0, 0], color: 0x2a8fa3 }, // tail seg 2
        { shape: 'cylinder', size: [11, 7, 300], anchor: 'crown', pos: [0, -58, 60], rot: [0.5, 0, 0], color: 0x14100c }, // queue (plain warrior braid)
        { shape: 'box', size: [14, 300, 8], anchor: 'chest', pos: [0, 20, -10], rot: [0, 0, 0.5], color: 0x3a281c }, // diagonal quiver strap
        { shape: 'cylinder', size: [5, 5, 120], anchor: 'shoulderR', pos: [10, 60, 20], color: 0x5a3a20 }, // arrow-shaft nub over shoulder
        { shape: 'cylinder', size: [12, 12, 1000], anchor: 'handR', pos: [0, -20, 0], color: 0x3a2a1a }, // spear shaft (NOT a bow — silhouette clash)
        { shape: 'cone', size: [14, 60], anchor: 'handR', pos: [0, 480, 0], color: 0x9a9a92 }, // spearhead tip
        { shape: 'box', size: [180, 24, 4], anchor: 'chest', pos: [0, 60, -12], rot: [0, 0, 0.4], color: 0x1c5f70 }, // warpaint stripe (proud)
      ],
      // approx: doc's 2 arrow-shaft nubs trimmed to 1 for the ≤10-primitive
      // budget; spear/bow are straight-cylinder approximations (parked rig gap).
      personality: { bobMul: 1.0, swayMul: 0.8, cadenceMul: 1.0, ampMul: 1.1 },
      bubbles: ['🏹', '⚔️', '🦅', '😤'] },

    // Dr. Grace Augustine — RDA lead xenobotanist (human form); glasses, khakis.
    { id: 'avatar-pandora/rda-xenobotanist',
      label: 'RDA xenobotanist (cropped hair, glasses, field khakis)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 126, headShape: 'sphere', limbR: 0.95,
        skin: 0xe0b696, body: 0xb8a878, legColor: 0x8a7a5a, shoe: 0x3a2e22,
        hands: 'sphere', eyes: 'dots', emI: 0, earSkip: false,
        armL: 0.95, legL: 1.0, footMul: [1.0, 1.0, 1.0] },
      accessories: [
        { shape: 'box', size: [126, 34, 126], anchor: 'crown', pos: [0, -4, 0], color: 0xd8d4c8 }, // cropped grey-white hair
        { shape: 'box', size: [90, 8, 4], anchor: 'face', pos: [0, 6, -12], color: 0x2a2a2a }, // glasses (thin ring approx)
        { shape: 'box', size: [40, 30, 3], anchor: 'chest', pos: [-40, 60, -10], color: 0xc9bd94 }, // RDA ID patch
        { shape: 'box', size: [90, 120, 8], anchor: 'handL', pos: [0, -20, 0], color: 0x2a2a2a }, // field tablet body
        { shape: 'box', size: [78, 104, 3], anchor: 'handL', pos: [0, -20, -6], color: 0xcfe0d8 }, // tablet screen
        { shape: 'cylinder', size: [3, 3, 40], anchor: 'handR', pos: [0, -18, 0], color: 0xf0ece0 }, // cigarette
        { shape: 'cylinder', size: [3, 3, 6], anchor: 'handR', pos: [0, 4, 0], color: 0x8a2a1a, emissive: 0x8a2a1a, emissiveIntensity: 0.2 }, // ember tip
      ],
      // approx: glasses reuse the thin-ring-on-face eyewear workaround (no
      // dedicated eyewear anchor).
      personality: { bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['🌿', '🔬', '🚬', '😤'] },

    // Col. Miles Quaritch — RDA security chief (human form); buzz cut, face scars.
    { id: 'avatar-pandora/rda-security-colonel',
      label: 'RDA security colonel (buzz cut, facial scars, dog tags)',
      rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, headShape: 'sphere', limbR: 1.3,
        skin: 0xc99268, body: 0x4a4d34, legColor: 0x6b6b5c, shoe: 0x1a1a1a,
        hands: 'sphere', eyes: 'dots', emI: 0, earSkip: false,
        armL: 1.15, legL: 1.05, footMul: [1.0, 1.0, 1.0] },
      accessories: [
        { shape: 'box', size: [128, 6, 128], anchor: 'crown', pos: [0, -6, 0], color: 0x8a8a80 }, // buzz-cut stubble (barely proud)
        { shape: 'box', size: [30, 3, 2], anchor: 'face', pos: [34, 20, -12], rot: [0, 0, -0.4], color: 0x6b3a2a }, // viperwolf scar 1
        { shape: 'box', size: [30, 3, 2], anchor: 'face', pos: [40, 4, -12], rot: [0, 0, -0.4], color: 0x6b3a2a }, // viperwolf scar 2
        { shape: 'box', size: [30, 3, 2], anchor: 'face', pos: [36, -12, -12], rot: [0, 0, -0.4], color: 0x6b3a2a }, // viperwolf scar 3
        { shape: 'box', size: [26, 36, 3], anchor: 'chest', pos: [0, 40, -10], color: 0x9a9a92 }, // dog tags
        { shape: 'box', size: [30, 60, 20], anchor: 'hip', pos: [96, -14, -50], color: 0x1c1c1c }, // holstered sidearm
      ],
      personality: { bobMul: 0.8, swayMul: 0.5, cadenceMul: 0.85, ampMul: 1.15 },
      bubbles: ['🎖️', '💪', '😤', '🎯'] },

    // Trudy Chacón — RDA gunship pilot (defector); flight suit, aviators, headset.
    { id: 'avatar-pandora/rda-gunship-pilot',
      label: 'RDA gunship pilot (dark ponytail, aviators, flight suit)',
      rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 124, headShape: 'sphere', limbR: 0.9,
        skin: 0xc78f66, body: 0x707a52, legColor: 0x5c6444, shoe: 0x2a2a2a,
        hands: 'sphere', eyes: 'shades', emI: 0, earSkip: false,
        armL: 0.9, legL: 0.95, footMul: [1.0, 1.0, 1.0] },
      accessories: [
        { shape: 'sphere', size: [40, 30, 90], anchor: 'back', pos: [0, 20, 20], color: 0x1c140e }, // dark ponytail bundle
        { shape: 'box', size: [140, 14, 14], anchor: 'head', pos: [0, 40, 0], color: 0x2a2a2a }, // flight-headset band
        { shape: 'sphere', size: 26, anchor: 'head', pos: [80, 10, 0], color: 0x2a2a2a }, // headset earcup
        { shape: 'box', size: [26, 55, 18], anchor: 'hip', pos: [92, -12, -48], color: 0x2a2a2a }, // sidearm holster
        { shape: 'box', size: [36, 26, 3], anchor: 'chest', pos: [40, 60, -10], color: 0xc9bd94 }, // flight-suit chest patch
      ],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🚁', '😎', '💥', '❤️'] },
  ],
};

export default pack;

// Sci-Fi ▸ Fallout (TV Series) — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric homage: silhouette + color only, no
// likeness/logos. Heterogeneous ensemble — no shared base spec (vault suits,
// weathered gunslinger, Brotherhood dress, sealed power armor, household robots).
// Source doc: docs/avatars/sci-fi/fallout-tv.md.
import type { AvatarPackDef, AvatarDecal } from '../avatars.js';

// The Vault 33 blue/yellow jumpsuit, reused verbatim across every MacLean-family
// member + the standalone dweller (distinguished by hair / build / back number).
const VAULT_BLUE = 0x2f4a72, VAULT_LEG = 0x24395c, VAULT_SHOE = 0x1c2c40, GOLD = 0xd9b23a;
// Vault-number back decal (the sanctioned jersey-number technique for the suit).
const vaultDecal = (n: string): AvatarDecal[] =>
  [{ kind: 'text', text: n, anchor: 'back', color: GOLD, bg: VAULT_BLUE }];

const pack: AvatarPackDef = {
  id: 'fallout-tv', version: 2, label: 'Fallout (TV Series)',
  path: ['Sci-Fi', 'Fallout'], builtin: true, franchise: true,
  avatars: [
    // Lucy MacLean — Vault 33 protagonist, blonde twin braids.
    { id: 'fallout-tv/lucy-vault-suit', label: 'Vault Dweller (blue/yellow, twin braids)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, headShape: 'sphere', skin: 'tint', body: VAULT_BLUE, legColor: VAULT_LEG,
        shoe: VAULT_SHOE, eyes: 'dots', emI: 0.1, hands: 'sphere', limbR: 0.9, decals: vaultDecal('33') },
      accessories: [
        { shape: 'cylinder', size: [10, 20, 190], anchor: 'head', pos: [-106, -70, 14], rot: [0, 0, 0.12], color: 0xd9b95c }, // braid L
        { shape: 'cylinder', size: [10, 20, 190], anchor: 'head', pos: [106, -70, 14], rot: [0, 0, -0.12], color: 0xd9b95c }, // braid R
        { shape: 'box', size: [16, 180, 10], anchor: 'chest', pos: [0, 0, -8], color: GOLD }, // gold collar/zip trim
        { shape: 'box', size: [190, 22, 150], anchor: 'hip', pos: [0, 0, 0], color: 0xc9a227 }, // gold utility belt
      ],
      personality: { bobMul: 1.05, swayMul: 0.9, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['🚪', '⚡', '😊', '🔧'] },

    // Cooper Howard / The Ghoul — 200-year-old irradiated gunslinger, missing nose.
    { id: 'fallout-tv/cooper-ghoul', label: 'Wasteland Gunslinger (weathered duster)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, headShape: 'sphere', skin: 0x9c8f78, body: 0x6b5a45, legColor: 0x2a2a2e,
        shoe: 0x1c1a18, eyes: 'slit', emI: 0.05, hands: 'sphere', limbR: 1.0,
        pattern: { kind: 'spots', color: 0x746a55, count: 8 } }, // radiation-mottled skin (pattern on skin, not fur)
      accessories: [
        { shape: 'sphere', size: [128, 60, 128], anchor: 'crown', pos: [0, 4, 6], rot: [0.4, 0, 0], color: 0xd8d2c0, sphereArc: [0, 6.283, 0, 1.1] }, // cattleman hat dome
        { shape: 'cylinder', size: [150, 150, 10], anchor: 'crown', pos: [0, -14, 4], rot: [0.4, 0, 0], color: 0xd8d2c0 }, // wide brim
        { shape: 'box', size: [30, 20, 20], anchor: 'face', pos: [0, -8, -14], color: 0x8c8168 }, // missing-nose stub
        { shape: 'box', size: [280, 50, 18], anchor: 'chest', pos: [0, 10, -12], rot: [0, 0, -0.5], color: 0x2a201a }, // bandolier strap (Chewbacca technique)
        { shape: 'cylinder', size: [16, 16, 22], anchor: 'chest', pos: [-50, 45, -18], rot: [1.57, 0, -0.5], color: 0xb0932f }, // shell nub
        { shape: 'cylinder', size: [16, 16, 22], anchor: 'chest', pos: [0, 10, -18], rot: [1.57, 0, -0.5], color: 0xb0932f }, // shell nub
        { shape: 'cylinder', size: [16, 16, 22], anchor: 'chest', pos: [50, -25, -18], rot: [1.57, 0, -0.5], color: 0xb0932f }, // shell nub
        { shape: 'box', size: [180, 26, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x3a2c1e }, // gunbelt
        { shape: 'cylinder', size: [24, 24, 70], anchor: 'hip', pos: [72, -30, -8], color: 0x3a2c1e }, // holster
        { shape: 'cylinder', size: [10, 10, 180], anchor: 'handR', pos: [0, -90, 0], color: 0x4a4a4c }, // long-barrel revolver
      ],
      personality: { bobMul: 0.8, swayMul: 0.55, cadenceMul: 0.85, ampMul: 0.85 },
      bubbles: ['🤠', '🔫', '☢️', '😏'] },

    // Maximus (squire, pre-armor) — olive double-breasted coat, red scarf.
    { id: 'fallout-tv/maximus-squire', label: 'Brotherhood Squire (olive coat, no armor)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, headShape: 'sphere', skin: 'tint', body: 0x5a6048, legColor: 0x3f4536,
        shoe: 0x2a2420, eyes: 'dots', emI: 0.05, hands: 'box', limbR: 1.05 },
      accessories: [
        { shape: 'box', size: [150, 40, 150], anchor: 'neck', pos: [0, 0, 0], color: 0xa8281f }, // red scarf wrap
        { shape: 'box', size: [30, 130, 10], anchor: 'chest', pos: [0, 0, -12], color: 0x241f1a }, // double-breasted button placket
        { shape: 'box', size: [130, 50, 150], anchor: 'crown', pos: [0, -6, 0], color: 0x2a2018 }, // short cropped dark hair
        { shape: 'box', size: [40, 40, 10], anchor: 'hip', pos: [0, 0, -8], color: 0x8a8a86 }, // belt buckle
      ],
      personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.05, ampMul: 0.9 },
      bubbles: ['🛡️', '😰', '💪', '⭐'] },

    // Maximus in claimed T-60 power armor — the most iconic Fallout silhouette.
    { id: 'fallout-tv/t60-power-armor-knight', label: 'Knight (sealed T-60 power armor)', rig: 'humanoid',
      // sk 1.3 clamps to the build ceiling; the bulk read comes from limbR + pauldrons.
      humanoid: { sk: 1.3, headR: 140, headShape: 'sphere', skin: 0x2a2c30, body: 0x3a3d42, legColor: 0x33363b,
        shoe: 0x1c1e21, eyes: 'visor', eyeColor: 0xf0a830, emI: 0.15, hands: 'box', limbR: 1.35, steel: true },
      accessories: [
        { shape: 'sphere', size: 150, anchor: 'head', pos: [0, 10, 0], color: 0x2f3236, sphereArc: [0, 6.283, 0, 2.0] }, // sealed helmet dome (enclosing-helmet technique)
        { shape: 'box', size: [16, 70, 150], anchor: 'crown', pos: [0, 6, 40], color: 0x2f3236 }, // raised center ridge
        { shape: 'box', size: [70, 60, 14], anchor: 'chest', pos: [0, 10, -8], color: 0x8a6a3a }, // brass chestplate control panel
        { shape: 'sphere', size: 8, anchor: 'chest', pos: [0, 20, -16], color: 0xf0a830, emissive: 0xf0a830, emissiveIntensity: 0.5 }, // amber status light
        { shape: 'box', size: [90, 120, 60], anchor: 'back', pos: [0, 30, 14], color: 0x2a2c30 }, // servo backpack
        { shape: 'box', size: [110, 30, 44], anchor: 'back', pos: [0, 90, 20], color: 0x2a2c30 }, // vent bank (merged L+R to free a slot for the minigun — at 10-prim cap)
        { shape: 'sphere', size: [72, 52, 72], anchor: 'shoulderL', pos: [0, 20, 0], color: 0x4a4d52 }, // pauldron L
        { shape: 'sphere', size: [72, 52, 72], anchor: 'shoulderR', pos: [0, 20, 0], color: 0x4a4d52 }, // pauldron R
        { shape: 'cone', size: [180, 140], anchor: 'hip', pos: [0, -70, 0], color: 0x33363b }, // armored plating skirt
        { shape: 'cylinder', size: [22, 22, 320], anchor: 'handR', pos: [0, -140, -60], color: 0x2f3236 }, // minigun/laser rifle barrel
      ],
      personality: { bobMul: 0.65, swayMul: 0.4, cadenceMul: 0.7, ampMul: 1.1 },
      bubbles: ['🛡️', '⚡', '🤖', '💪'] },

    // Norm MacLean — Lucy's brother, same suit, short dark hair, stockier read.
    { id: 'fallout-tv/norm-maclean', label: 'Vault Sibling (short dark hair)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, headShape: 'sphere', skin: 'tint', body: VAULT_BLUE, legColor: VAULT_LEG,
        shoe: VAULT_SHOE, eyes: 'dots', emI: 0.1, hands: 'sphere', limbR: 1.0, decals: vaultDecal('33') },
      accessories: [
        { shape: 'box', size: [132, 60, 152], anchor: 'crown', pos: [0, -4, 0], color: 0x2a2018 }, // short tousled dark hair
        { shape: 'box', size: [16, 180, 10], anchor: 'chest', pos: [0, 0, -8], color: GOLD }, // gold zip trim
        { shape: 'box', size: [180, 20, 150], anchor: 'hip', pos: [0, 0, 0], color: 0xc9a227 }, // belt
      ],
      personality: { bobMul: 0.9, swayMul: 0.85, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['🔍', '🤨', '📋', '😒'] },

    // Hank MacLean — Overseer of Vault 33, cream coat over the suit, silver hair.
    { id: 'fallout-tv/hank-overseer', label: 'The Overseer (cream coat, silver hair)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 126, headShape: 'sphere', skin: 'tint', body: VAULT_BLUE, legColor: VAULT_LEG,
        shoe: VAULT_SHOE, eyes: 'dots', emI: 0.1, hands: 'sphere', limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: [128, 46, 128], anchor: 'crown', pos: [0, -6, 4], rot: [0.3, 0, 0], color: 0xc7c4ba, sphereArc: [0, 6.283, 0, 1.1] }, // neat silver hair
        { shape: 'cone', size: [200, 430], anchor: 'back', pos: [0, -120, 12], rot: [0.1, 0, 0], color: 0xdcd6c4 }, // long Overseer coat drape
        { shape: 'cylinder', size: [14, 14, 6], anchor: 'chest', pos: [0, 20, -14], rot: [1.57, 0, 0], color: GOLD }, // Overseer badge
      ],
      personality: { bobMul: 0.75, swayMul: 0.55, cadenceMul: 0.85, ampMul: 0.75 },
      bubbles: ['📢', '🔬', '🗝️', '😐'] },

    // CX404 "Dogmeat" — tan Belgian Malinois, black muzzle mask + ear tips.
    { id: 'fallout-tv/dogmeat-cx404', label: 'Wasteland Dog (tan, black mask)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.05, bodyLen: 620, bodyW: 190, bodyH: 230, legLen: 1.05, headR: 105,
        ears: 'pointy', tail: 'up', tailLen: 0.7, snout: 1.0, snoutShape: 'cone',
        coat: 0xc9a06a, belly: 0xe0c48c, earColor: 0x2a2018, snoutColor: 0x2a2018, pawColor: 0xc9a06a, eyes: 'dot' },
      accessories: [
        { shape: 'cylinder', size: [80, 80, 16], anchor: 'qneck', pos: [0, 0, 0], color: 0x4a3423 }, // worn leather collar
      ],
      personality: { bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.2, ampMul: 1.05 },
      bubbles: ['🐕', '🦴', '👃', '🏜️'] },

    // Generic vault resident — unmodified suit, a DIFFERENT vault number, plain.
    { id: 'fallout-tv/vault-dweller-generic', label: 'Vault Dweller (unnumbered, plain)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, headShape: 'sphere', skin: 'tint', body: VAULT_BLUE, legColor: VAULT_LEG,
        shoe: VAULT_SHOE, eyes: 'dots', emI: 0.1, hands: 'sphere', limbR: 1.0, decals: vaultDecal('111') },
      accessories: [
        { shape: 'box', size: [16, 180, 10], anchor: 'chest', pos: [0, 0, -8], color: GOLD }, // gold trim
        { shape: 'box', size: [40, 22, 8], anchor: 'chest', pos: [0, 50, -13], color: 'tint' }, // blank name-tag (tint accent)
      ],
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['🚪', '🥫', '😊', '❓'] },

    // Brotherhood Scribe — red robe over brown, round spectacles.
    { id: 'fallout-tv/brotherhood-scribe', label: 'Brotherhood Scribe (red robe, spectacles)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, headShape: 'sphere', skin: 'tint', body: 0xa8281f, legColor: 0x4a4238,
        shoe: 0x2a2420, eyes: 'dots', emI: 0.05, hands: 'sphere', limbR: 0.9 },
      accessories: [
        { shape: 'box', size: [130, 55, 150], anchor: 'crown', pos: [0, -4, 0], color: 'tint' }, // short practical hair (tint)
        { shape: 'box', size: [92, 14, 8], anchor: 'face', pos: [0, 4, -14], color: 0x8a8a86 }, // approx: round spectacles → a thin dark bar (no ring primitive)
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'chest', pos: [0, 12, -14], rot: [1.57, 0, 0], color: 0xc7c7c0 }, // gear-insignia patch disc
        { shape: 'box', size: [70, 90, 50], anchor: 'hip', pos: [82, -20, 0], color: 0x5a4a34 }, // satchel of scrolls
      ],
      personality: { bobMul: 0.85, swayMul: 0.7, cadenceMul: 0.85, ampMul: 0.75 },
      bubbles: ['📖', '🔬', '🗒️', '🤓'] },

    // Mister Handy — hovering cream-metal sphere, three desynced blue eyestalks.
    { id: 'fallout-tv/mr-handy', label: 'Household Robot (hovering, three eyestalks)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 150, headShape: 'sphere', hover: 650, skin: 0xc7c3b4, body: 0xc7c3b4,
        eyes: 'none', emI: 0.15, hands: 'box', steel: true, limbR: 0.9 },
      accessories: [
        { shape: 'sphere', size: 180, anchor: 'chest', pos: [0, 0, 65], color: 0xc7c3b4 }, // sphere shroud enclosing the torso (R2-D2 shroud technique; chest anchor auto-centers)
        { shape: 'cylinder', size: [8, 8, 62], anchor: 'face', pos: [0, 40, -30], rot: [-0.5, 0, 0], color: 0x8a8a86, animate: { kind: 'sway', speed: 1.5, amp: 0.3, phase: 0 } }, // eyestalk 1
        { shape: 'sphere', size: 16, anchor: 'face', pos: [0, 70, -58], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.5 }, // lens 1
        { shape: 'cylinder', size: [8, 8, 62], anchor: 'face', pos: [-42, 30, -26], rot: [-0.4, 0, 0.5], color: 0x8a8a86, animate: { kind: 'sway', speed: 1.5, amp: 0.3, phase: 1.4 } }, // eyestalk 2
        { shape: 'sphere', size: 16, anchor: 'face', pos: [-70, 52, -50], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.5 }, // lens 2
        { shape: 'cylinder', size: [8, 8, 62], anchor: 'face', pos: [42, 30, -26], rot: [-0.4, 0, -0.5], color: 0x8a8a86, animate: { kind: 'sway', speed: 1.5, amp: 0.3, phase: 2.8 } }, // eyestalk 3
        { shape: 'sphere', size: 16, anchor: 'face', pos: [70, 52, -50], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.5 }, // lens 3
        { shape: 'cylinder', size: [12, 12, 200], anchor: 'handL', pos: [0, -100, 0], color: 0x8a8a86 }, // extra mechanical arm (third-arm approx)
        { shape: 'cylinder', size: [12, 12, 200], anchor: 'handR', pos: [0, -100, 0], color: 0x8a8a86 }, // extra mechanical arm (third-arm approx)
        { shape: 'cylinder', size: [150, 150, 20], anchor: 'hip', pos: [0, -30, 0], color: 0x8a8a86 }, // ground-effect skirt flange
      ],
      personality: { bobMul: 0.4, swayMul: 0.6, cadenceMul: 0.3, ampMul: 0.2 },
      bubbles: ['🔧', '🫖', '🤖', '😊'] },

    // Protectron — clunky domed patrol drone, olive livery + white star.
    { id: 'fallout-tv/protectron', label: 'Patrol Robot (olive, domed head)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, headShape: 'sphere', skin: 0x5a6048, body: 0x4a5240, legColor: 0x3f4536,
        shoe: 0x2a2e28, eyes: 'compound', emI: 0.2, hands: 'box', steel: true, limbR: 1.05, gait: 'walk' },
      accessories: [
        { shape: 'cylinder', size: [40, 40, 8], anchor: 'chest', pos: [0, 10, -14], rot: [1.57, 0, 0], color: 0xf0ece0 }, // white star roundel (generic disc)
        { shape: 'cylinder', size: [6, 6, 70], anchor: 'crown', pos: [40, 20, 0], color: 0x2a2e28 }, // antenna stub
        { shape: 'box', size: [70, 90, 30], anchor: 'back', pos: [0, 20, 16], color: 0x3f4536 }, // exhaust/vent detail
      ],
      personality: { bobMul: 0.9, swayMul: 0.3, cadenceMul: 0.55, ampMul: 0.6 },
      bubbles: ['🤖', '🚨', '👁️', '⚠️'] },
  ],
};

export default pack;

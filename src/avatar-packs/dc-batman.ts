// Sci-Fi ▸ DC ▸ Batman — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric homage: classic-comics / animated-series
// costume color-blocking + one signature head/prop each. No likeness, no logos,
// no printed insignia/text. Source doc: docs/avatars/sci-fi/dc-batman.md.
import type { AvatarPackDef } from '../avatars.js';

const YELLOW = 0xf2c744, GOLD = 0xc9a227;

const pack: AvatarPackDef = {
  id: 'dc-batman', version: 2, label: 'DC: Batman',
  path: ['Sci-Fi', 'DC', 'Batman'], builtin: true, franchise: true,
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1.0, headR: 126, headShape: 'sphere', limbR: 1.0, hands: 'box',
      eyes: 'almond', steel: false, emI: 0, armL: 1.0, legL: 1.0, footMul: [1.0, 1.0, 1.0],
    },
  },
  avatars: [
    // Batman / Bruce Wayne — grey suit, near-black cape, pointed-ear cowl, yellow belt.
    { id: 'dc-batman/caped-crusader', label: 'Caped Crusader (grey/black suit, cowl)', rig: 'humanoid',
      humanoid: { skin: 0x232838, body: 0x8a8f99, legColor: 0x8a8f99, shoe: 0x1c1e24,
        // approx: cowl wants the 'slit' eye geometry glowing WHITE, not the style's
        // presumed red — no eye-color override param yet (see doc Rig gaps #2).
        eyes: 'slit', emI: 0, hands: 'box', limbR: 1.0,
        limbColors: { armL: 0x1c1e24, armR: 0x1c1e24 } },
      accessories: [
        { shape: 'cone', size: [12, 80], anchor: 'crown', pos: [-32, 30, 4], rot: [0.25, 0, 0], color: 0x1c2030 },
        { shape: 'cone', size: [12, 80], anchor: 'crown', pos: [32, 30, 4], rot: [0.25, 0, 0], color: 0x1c2030 },
        { shape: 'cape', size: [420, 620, 520], anchor: 'back', pos: [0, -220, 20], rot: [0.12, 0, 0], color: 0x1a2035, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // midnight-blue cape
        // approx: no bat-silhouette primitive — a yellow oval color-block carries the emblem read (doc Rig gaps #1).
        { shape: 'sphere', size: [45, 35, 3], anchor: 'chest', pos: [0, 20, -8], color: YELLOW },
        { shape: 'box', size: [190, 140, 20], anchor: 'hip', pos: [0, 0, 0], color: 0x1c1e24 }, // black trunks over grey tights
        { shape: 'box', size: [180, 40, 18], anchor: 'hip', pos: [0, 30, -4], color: YELLOW }, // utility belt band
        // belt pouches carry the per-sensor 'tint' slot (belt band stays iconic yellow).
        { shape: 'box', size: [22, 22, 14], anchor: 'hip', pos: [-52, 30, -8], color: 'tint' },
        { shape: 'box', size: [22, 22, 14], anchor: 'hip', pos: [0, 30, -10], color: 'tint' },
        { shape: 'box', size: [22, 22, 14], anchor: 'hip', pos: [52, 30, -8], color: 'tint' }],
      personality: { bobMul: 0.85, swayMul: 0.5, cadenceMul: 0.95, ampMul: 0.9 },
      bubbles: ['🦇', '🌃', '🥷', '🕵️'] },

    // Robin / Dick Grayson — red tunic, green tights, short yellow cape, domino mask.
    { id: 'dc-batman/boy-wonder', label: 'Boy Wonder (red/green, short cape)', rig: 'humanoid',
      humanoid: { sk: 0.82, headR: 118, skin: 0xd8a878, body: 0xcc2027, legColor: 0x1f7a3d,
        shoe: 0x1f7a3d, eyes: 'almond', emI: 0, hands: 'box', limbR: 0.9 },
      accessories: [
        { shape: 'box', size: [110, 42, 110], anchor: 'crown', pos: [0, 0, 0], color: 0x241f1c }, // short dark hair
        { shape: 'box', size: [90, 24, 10], anchor: 'face', pos: [0, 15, -4], color: 0x141414 }, // black domino mask
        { shape: 'cape', size: [300, 380, 340], anchor: 'back', pos: [0, -120, 20], rot: [0.12, 0, 0], color: 0xf4c430, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // short yellow cape
        // approx: no letter primitive — a small black disc stands in for the "R" emblem (doc Rig gaps #1).
        { shape: 'sphere', size: [20, 20, 2.5], anchor: 'chest', pos: [0, 20, -8], color: 0x141414 },
        { shape: 'box', size: [170, 26, 12], anchor: 'hip', pos: [0, 0, -4], color: 'tint' }], // belt = tint slot (cape carries yellow)
      personality: { bobMul: 1.05, swayMul: 0.85, cadenceMul: 1.2, ampMul: 1.05 },
      bubbles: ['🐦', '🤸', '❗', '😄'] },

    // Batgirl / Barbara Gordon — purple cowl + cape, yellow gloves/boots/belt, red hair.
    { id: 'dc-batman/batgirl', label: 'Batgirl (purple/yellow, cowl)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, skin: 0xd8a878, body: 0x5b2a86, legColor: 0x5b2a86,
        shoe: YELLOW, eyes: 'almond', emI: 0, hands: 'box', limbR: 0.88,
        limbColors: { armL: YELLOW, armR: YELLOW } }, // yellow gauntlet gloves
      accessories: [
        { shape: 'cone', size: [11, 72], anchor: 'crown', pos: [-30, 28, 4], rot: [0.25, 0, 0], color: 0x431f66 },
        { shape: 'cone', size: [11, 72], anchor: 'crown', pos: [30, 28, 4], rot: [0.25, 0, 0], color: 0x431f66 },
        { shape: 'box', size: [34, 140, 26], anchor: 'head', pos: [-95, -40, 15], color: 0x8b2e1f }, // trailing red hair
        { shape: 'box', size: [34, 140, 26], anchor: 'head', pos: [95, -40, 15], color: 0x8b2e1f },
        { shape: 'cape', size: [380, 560, 460], anchor: 'back', pos: [0, -190, 20], rot: [0.12, 0, 0], color: 0x431f66, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // purple cape
        { shape: 'sphere', size: [40, 31, 3], anchor: 'chest', pos: [0, 20, -8], color: YELLOW }, // bat-oval emblem approx
        { shape: 'box', size: [170, 34, 14], anchor: 'hip', pos: [0, 0, -4], color: 'tint' }], // belt = tint slot
      personality: { bobMul: 0.9, swayMul: 0.6, cadenceMul: 1.05, ampMul: 0.9 },
      bubbles: ['🦇', '📚', '🥋', '👩‍🎓'] },

    // Alfred Pennyworth — black tailcoat, grey waistcoat, moustache, receding hair.
    { id: 'dc-batman/butler', label: 'The Butler (black tailcoat, grey vest)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, skin: 0xd8b090, body: 0x1a1a1a, legColor: 0x6e6b66,
        shoe: 0x141414, eyes: 'almond', emI: 0, hands: 'box', limbR: 0.92 },
      accessories: [
        // approx: no receding-hairline shape — a thin back-set grey band leaves the crown bare (doc Rig gaps).
        { shape: 'box', size: [120, 28, 120], anchor: 'crown', pos: [0, -8, 22], color: 0x9a968f },
        { shape: 'box', size: [50, 10, 6], anchor: 'face', pos: [0, -8, -6], color: 0x9a968f }, // grey moustache
        { shape: 'box', size: [160, 140, 8], anchor: 'chest', pos: [0, 0, -6], color: 'tint' }, // waistcoat panel = tint slot
        { shape: 'box', size: [40, 20, 10], anchor: 'neck', pos: [0, 0, -78], color: 0x141414 }], // black bow tie
      personality: { bobMul: 0.6, swayMul: 0.3, cadenceMul: 0.75, ampMul: 0.7 },
      bubbles: ['🫖', '🎩', '🧐', '📖'] },

    // Commissioner Gordon — tan trench coat, white moustache, glasses, gold badge.
    { id: 'dc-batman/commissioner', label: 'The Commissioner (trench coat, badge)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0xd8b090, body: 0x6b5a45, legColor: 0x3a3a3a,
        shoe: 0x1c1c1c, eyes: 'almond', emI: 0, hands: 'box', limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [118, 40, 118], anchor: 'crown', pos: [0, 0, 0], color: 0xd8d4cc }, // white/grey hair
        { shape: 'box', size: [55, 14, 8], anchor: 'face', pos: [0, -8, -6], color: 0xd8d4cc }, // thick moustache
        { shape: 'box', size: [90, 16, 6], anchor: 'face', pos: [0, 8, -6], color: 0x1a1a1a }, // approx: horn-rim glasses as a flat bar (doc Rig gaps #3)
        // approx: no shield/star badge shape — a small gold disc color-block (doc Rig gaps #1).
        { shape: 'box', size: [26, 26, 6], anchor: 'chest', pos: [-40, 30, -8], color: 0xd4af37, emissiveIntensity: 0.1 },
        { shape: 'box', size: [24, 90, 6], anchor: 'chest', pos: [0, 0, -9], color: 'tint' }], // necktie = tint slot
      personality: { bobMul: 0.85, swayMul: 0.4, cadenceMul: 0.85, ampMul: 0.85 },
      bubbles: ['🚨', '🕵️', '☎️', '☕'] },

    // The Joker — white face, green hair, purple tailcoat, red grin.
    { id: 'dc-batman/clown-prince', label: 'Clown Prince (purple suit, green hair)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 126, skin: 0xf2f2f2, body: 0x5b2a86, legColor: 0x431f66,
        shoe: 0x1c1030, eyes: 'almond', emI: 0.05, hands: 'box', limbR: 0.9 },
      accessories: [
        { shape: 'box', size: [130, 60, 130], anchor: 'crown', pos: [0, 0, 10], color: 0x2fae52 }, // green swept-back hair
        { shape: 'box', size: [55, 10, 5], anchor: 'face', pos: [0, -14, -6], color: 0xcc1e2e }, // red rictus grin
        { shape: 'box', size: [40, 24, 10], anchor: 'neck', pos: [0, -4, -78], color: 0xff8c1a }, // orange cravat
        { shape: 'sphere', size: 10, anchor: 'chest', pos: [-40, 30, -10], color: 'tint' }], // boutonniere = tint slot
      personality: { bobMul: 1.15, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.2 },
      bubbles: ['🃏', '😂', '💜', '🎪'] },

    // Harley Quinn — red/black diamond jester, white ruffle, two-point cap, domino mask.
    { id: 'dc-batman/harlequin', label: 'Harlequin (red/black diamond, jester)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, skin: 0xf2e0d5, body: 0x161616, legColor: 0x161616,
        shoe: 0x161616, eyes: 'almond', emI: 0, hands: 'box', limbR: 0.85,
        // approx: diamond harlequin split approximated via whole-limb color-blocking (doc Rig gaps #6).
        limbColors: { armL: 0xcc1e2e, armR: 0x161616, legL: 0x161616, legR: 0xcc1e2e } },
      accessories: [
        // diamond chest patch (approx of the print) doubles as the per-sensor 'tint' slot — fits the multicolor jester.
        { shape: 'box', size: [70, 70, 8], anchor: 'chest', pos: [0, 10, -8], rot: [0, 0, 0.785], color: 'tint' },
        { shape: 'cylinder', size: [78, 78, 30], anchor: 'neck', pos: [0, 0, 0], color: 0xf2f2f2 }, // white ruffled collar approx
        { shape: 'cone', size: [15, 160], anchor: 'crown', pos: [-30, 20, 0], rot: [0.3, 0, 0.35], color: 0xcc1e2e },
        { shape: 'cone', size: [15, 160], anchor: 'crown', pos: [30, 20, 0], rot: [0.3, 0, -0.35], color: 0x161616 },
        { shape: 'sphere', size: 12, anchor: 'crown', pos: [-58, 150, 22], color: 0xf2f2f2 }, // pompom
        { shape: 'sphere', size: 12, anchor: 'crown', pos: [58, 150, 22], color: 0xf2f2f2 },
        { shape: 'box', size: [80, 22, 8], anchor: 'face', pos: [0, 15, -6], color: 0x161616 }], // black domino mask
      personality: { bobMul: 1.1, swayMul: 0.9, cadenceMul: 1.15, ampMul: 1.15 },
      bubbles: ['🔨', '💕', '🤪', '🎪'] },

    // Catwoman — sleek all-black catsuit, small cat ears, pale goggle lenses.
    { id: 'dc-batman/cat-burglar', label: 'Cat Burglar (black catsuit, goggles)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 120, skin: 0x181818, body: 0x181818, legColor: 0x181818,
        shoe: 0x0d0d0d, eyes: 'none', emI: 0.08, hands: 'sphere', limbR: 0.82 },
      accessories: [
        { shape: 'cone', size: [9, 50], anchor: 'crown', pos: [-30, 12, 0], rot: [-0.2, 0, 0], color: 0x181818 }, // cat ear
        { shape: 'cone', size: [9, 50], anchor: 'crown', pos: [30, 12, 0], rot: [-0.2, 0, 0], color: 0x181818 },
        // goggle lenses — a faint glassy glow reads better than transparency on toon shading.
        { shape: 'sphere', size: [20, 20, 7], anchor: 'face', pos: [-26, 8, -8], color: 0x9fd8f0, emissiveIntensity: 0.15 },
        { shape: 'sphere', size: [20, 20, 7], anchor: 'face', pos: [26, 8, -8], color: 0x9fd8f0, emissiveIntensity: 0.15 },
        { shape: 'box', size: [130, 14, 10], anchor: 'crown', pos: [0, 0, 20], color: 0x181818 }, // goggle strap
        { shape: 'cylinder', size: [60, 60, 16], anchor: 'hip', pos: [80, -14, -30], rot: [1.5708, 0, 0], color: 0x161616 }, // coiled whip
        { shape: 'box', size: [170, 24, 14], anchor: 'hip', pos: [0, 0, -4], color: 'tint' }], // gold belt = tint slot
      personality: { bobMul: 0.75, swayMul: 0.9, cadenceMul: 1.1, ampMul: 0.85 },
      bubbles: ['🐈‍⬛', '💎', '🥷', '😼'] },

    // The Penguin — short, portly, black tailcoat, tall top hat, monocle, umbrella.
    { id: 'dc-batman/penguin', label: 'The Penguin (short, top hat, monocle)', rig: 'humanoid',
      // approx: no torso-girth param — rotund read via bumped limbR + short legs + low sk (doc Rig gaps #5).
      humanoid: { sk: 0.88, headR: 130, skin: 0xdfb9a0, body: 0x161616, legColor: 0x161616,
        shoe: 0x141414, eyes: 'almond', emI: 0, hands: 'box', limbR: 1.35, armL: 0.9, legL: 0.85,
        footMul: [1.2, 0.6, 1.15] },
      accessories: [
        { shape: 'cylinder', size: [75, 75, 220], anchor: 'crown', pos: [0, 100, 0], rot: [0.1, 0, 0], color: 0x141414 }, // top hat
        { shape: 'cylinder', size: [78, 78, 20], anchor: 'crown', pos: [0, 12, 0], color: 'tint' }, // hatband = tint slot
        // approx: no ring/torus primitive — monocle = glassy lens disc + gold rim disc + chain cord (doc Rig gaps #3).
        { shape: 'cylinder', size: [18, 18, 6], anchor: 'face', pos: [26, 8, -9], rot: [1.5708, 0, 0], color: 0xd8ecf5, emissiveIntensity: 0.1 },
        { shape: 'cylinder', size: [20, 20, 4], anchor: 'face', pos: [26, 8, -6], rot: [1.5708, 0, 0], color: 0xc9a227 },
        { shape: 'cylinder', size: [3, 3, 80], anchor: 'face', pos: [26, -40, -6], color: 0xc9a227 }, // monocle chain
        { shape: 'box', size: [40, 22, 10], anchor: 'neck', pos: [0, 0, -78], color: 0x141414 }, // bow tie
        { shape: 'cylinder', size: [7, 7, 220], anchor: 'handL', pos: [0, 60, 0], color: 0x141414 }, // umbrella handle
        { shape: 'cone', size: [65, 90], anchor: 'handL', pos: [0, 175, 0], rot: [3.14159, 0, 0], color: 0x141414 }, // closed canopy
        { shape: 'cone', size: [10, 24], anchor: 'handL', pos: [0, 232, 0], color: GOLD }], // ferrule tip
      personality: { bobMul: 1.2, swayMul: 1.3, cadenceMul: 0.7, ampMul: 0.75 },
      bubbles: ['🐧', '☂️', '🎩', '🧐'] },

    // The Riddler — all-green suit, purple accents, green bowler hat, gold cane.
    { id: 'dc-batman/riddler', label: 'The Riddler (green, bowler hat, cane)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0xd8b090, body: 0x1f9e4a, legColor: 0x431f66,
        shoe: 0x161616, eyes: 'almond', emI: 0.05, hands: 'box', limbR: 0.9 },
      accessories: [
        { shape: 'sphere', size: [70, 45, 70], anchor: 'crown', pos: [0, 22, 0], color: 0x1f9e4a }, // bowler dome
        { shape: 'box', size: [150, 10, 160], anchor: 'crown', pos: [0, 4, 0], color: 0x1f9e4a }, // brim
        { shape: 'cylinder', size: [72, 72, 18], anchor: 'crown', pos: [0, 12, 0], color: 'tint' }, // hatband = tint slot
        { shape: 'box', size: [40, 20, 10], anchor: 'neck', pos: [0, 0, -78], color: 0x431f66 }, // purple bow tie
        // approx: no curved/hooked prop geometry — the question-mark cane is a straight gold rod + ball handle (doc Rig gaps #4).
        { shape: 'cylinder', size: [8, 8, 420], anchor: 'handR', pos: [0, 180, 0], color: GOLD },
        { shape: 'sphere', size: 16, anchor: 'handR', pos: [0, 390, 0], color: 0x161616 }],
      personality: { bobMul: 1.0, swayMul: 0.75, cadenceMul: 1.1, ampMul: 0.95 },
      bubbles: ['❓', '🟢', '🎩', '😏'] },
  ],
};

export default pack;

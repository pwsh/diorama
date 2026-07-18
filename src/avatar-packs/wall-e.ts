// Sci-Fi ▸ WALL-E — franchise pack (dynamic-import only, default loaded:false).
// Stylized geometric homage: silhouette + color only, no likeness/branding.
// Small primary cast (7) — robots + two Axiom humans, all on the humanoid rig.
// No shared base. Source doc: docs/avatars/sci-fi/wall-e.md.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'wall-e', version: 1, label: 'WALL-E',
  path: ['Sci-Fi', 'WALL-E'], builtin: true, franchise: true,
  avatars: [
    // WALL-E — squat rusty-yellow cube on treads, binocular eyes, solar panel.
    { id: 'wall-e/wall-e', label: 'Boxy Trash-Compactor Robot (rusty yellow, binocular eyes)', rig: 'humanoid',
      humanoid: { sk: 0.75, headR: 55, headShape: 'box', limbR: 1.0,
        hover: 120, // approx: WALL-E does NOT float; hover suppresses leg-gait so his tank treads read as smooth ground contact, not a walk cycle. See Rig gaps.
        skin: 0xc98a1f, body: 0xc98a1f, eyes: 'none', emI: 0.05, hands: 'box', steel: true },
      accessories: [
        { shape: 'cylinder', size: [22, 22, 45], anchor: 'face', pos: [-34, 6, -8], rot: [-1.57, 0, 0], color: 0x1a1a1a, animate: { kind: 'sway', speed: 1.0, amp: 0.3, phase: 0 } }, // binocular eye-lens L (expressive tilt)
        { shape: 'cylinder', size: [22, 22, 45], anchor: 'face', pos: [34, 6, -8], rot: [-1.57, 0, 0], color: 0x1a1a1a, animate: { kind: 'sway', speed: 1.0, amp: 0.3, phase: 1.6 } }, // binocular eye-lens R
        { shape: 'box', size: [120, 44, 260], anchor: 'root', pos: [-120, 40, 0], color: 0x1c1a18 }, // tank tread L (static approx)
        { shape: 'box', size: [120, 44, 260], anchor: 'root', pos: [120, 40, 0], color: 0x1c1a18 }, // tank tread R
        { shape: 'box', size: [150, 200, 12], anchor: 'chest', pos: [0, 0, -12], color: 0x2a4fae }, // hinged solar panel
        // approx: AvatarPrimitive has no per-primitive pattern; panel-cell grid via two thin proud lines.
        { shape: 'box', size: [150, 8, 14], anchor: 'chest', pos: [0, 30, -14], color: 0x1a2a5a }, // panel grid line
        { shape: 'box', size: [150, 8, 14], anchor: 'chest', pos: [0, -30, -14], color: 0x1a2a5a }, // panel grid line
        { shape: 'box', size: [70, 60, 40], anchor: 'back', pos: [0, 20, 14], color: 0x8a6a2a }, // compactor/exhaust vent
      ],
      personality: { bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.5, ampMul: 0.3 },
      bubbles: ['🌱', '🎬', '🤖', '💛'] },

    // EVE — glossy white ovoid probe, genuine hover, single blue LED eye-bar.
    { id: 'wall-e/eve', label: 'Sleek White Probe (hovering, blue eye-bar)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 130, headShape: 'oval', limbR: 0.7,
        hover: 900, // a REAL literal hover (unlike wall-e's approximation) — floats visibly clear of the ground.
        skin: 0xf2f4f6, body: 0xf2f4f6, eyes: 'none', emI: 0.35, hands: 'sphere', steel: true },
      accessories: [
        { shape: 'sphere', size: [150, 190, 150], anchor: 'chest', pos: [0, 0, 70], color: 0xf2f4f6 }, // seamless egg shroud (R2-D2/Mr.Handy technique)
        { shape: 'box', size: [110, 26, 10], anchor: 'face', pos: [0, 10, -6], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.7, animate: { kind: 'sway', speed: 1.8, amp: 0.15 } }, // single blue LED eye-bar
        { shape: 'cylinder', size: [130, 130, 8], anchor: 'hip', pos: [0, -40, 0], color: 0x2f9ad1, emissive: 0x2f9ad1, emissiveIntensity: 0.4, outlineSkip: true }, // soft blue thruster-glow disc
        { shape: 'box', size: [10, 90, 10], anchor: 'chest', pos: [0, -10, -8], color: 0x39c6f0, emissive: 0x39c6f0, emissiveIntensity: 0.2 }, // cyan seam accent (sleek-android idiom)
      ],
      personality: { bobMul: 0.5, swayMul: 0.3, cadenceMul: 0.2, ampMul: 0.1 },
      bubbles: ['🌿', '🔫', '✨', '💙'] },

    // M-O — tiny blue cleaning bot on a spinning brush base, single scanner eye.
    { id: 'wall-e/m-o', label: 'Tiny Cleaning Robot (blue, spinning brush)', rig: 'humanoid',
      humanoid: { sk: 0.5, headR: 70, headShape: 'box', limbR: 0.6,
        hover: 80, // approx: rolls on a brush-wheel base, not floating; same leg-gait suppression as wall-e.
        skin: 0x2f6fd1, body: 0x2f6fd1, eyes: 'none', emI: 0.2, hands: 'box', steel: true },
      accessories: [
        { shape: 'sphere', size: 26, anchor: 'face', pos: [0, 6, -10], color: 0x141a22 }, // single scanner-eye lens
        { shape: 'cylinder', size: [90, 90, 30], anchor: 'root', pos: [0, 20, 0], color: 0x1c1c1e, animate: { kind: 'spin', speed: 6 } }, // spinning brush-roller base (his signature motion)
        { shape: 'cylinder', size: [10, 10, 90], anchor: 'handL', pos: [0, -45, 0], color: 0xc7ccd1 }, // sanitizing wand
        { shape: 'cylinder', size: [10, 10, 90], anchor: 'handR', pos: [0, -45, 0], color: 0xc7ccd1 }, // sanitizing wand
      ],
      personality: { bobMul: 0.3, swayMul: 0.2, cadenceMul: 0.1, ampMul: 0.1 },
      bubbles: ['🧽', '🦠', '😤', '✨'] },

    // Captain B. McCrea — soft heavyset ship's captain, red uniform, gold trim.
    { id: 'wall-e/captain-mccrea', label: 'Ship\'s Captain (red uniform, heavyset)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 130, headShape: 'sphere', skin: 'tint', body: 0xa8281f, legColor: 0x8a1f18,
        shoe: 0x2a2420, eyes: 'dots', emI: 0.05, hands: 'sphere', limbR: 1.25, armL: 0.9, legL: 0.85 },
      accessories: [
        { shape: 'box', size: [180, 20, 12], anchor: 'chest', pos: [0, 40, -12], color: 0xd9b23a }, // gold insignia trim band
        { shape: 'box', size: [24, 24, 8], anchor: 'chest', pos: [-60, 40, -14], color: 0xd9b23a }, // blank rank star (no logo)
        { shape: 'box', size: [110, 45, 130], anchor: 'crown', pos: [0, -6, 0], color: 0xb8542a }, // short reddish hair
        { shape: 'box', size: [190, 20, 150], anchor: 'hip', pos: [0, 0, 0], color: 0xd9b23a }, // gold belt
      ],
      personality: { bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.7, ampMul: 0.6 },
      bubbles: ['🚀', '🫡', '🌍', '💪'] },

    // AUTO — white steering-wheel autopilot at the helm, single red HAL eye.
    { id: 'wall-e/auto', label: 'Ship\'s Autopilot (white wheel, red eye)', rig: 'humanoid',
      sessile: true, // permanently mounted at the helm — never moves; AUTO's defining trait.
      humanoid: { sk: 1.0, headR: 60, headShape: 'sphere', skin: 0xece8de, body: 0xece8de, eyes: 'none',
        emI: 0.3, hands: 'sphere', steel: true,
        armL: 0.01, // arms scaled to near-zero, hidden under the spoke assembly (Mother Brain limbless idiom)
        // Faint near-body dapples — clear the harness's LEGGED mesh floor for this
        // legless sessile rig (avatar-content-test has no sessile floor); reads as
        // subtle panel mottling on the cream chassis, not decoration.
        pattern: { kind: 'dapples', color: 0xdad4c6, count: 8 } },
      accessories: [
        { shape: 'box', size: [40, 300, 40], anchor: 'chest', pos: [0, 0, -8], rot: [0, 0, 0], color: 0xece8de }, // wheel spoke
        { shape: 'box', size: [40, 300, 40], anchor: 'chest', pos: [0, 0, -8], rot: [0, 0, 0.628], color: 0xece8de }, // wheel spoke
        { shape: 'box', size: [40, 300, 40], anchor: 'chest', pos: [0, 0, -8], rot: [0, 0, 1.256], color: 0xece8de }, // wheel spoke
        { shape: 'box', size: [40, 300, 40], anchor: 'chest', pos: [0, 0, -8], rot: [0, 0, 1.884], color: 0xece8de }, // wheel spoke
        { shape: 'box', size: [40, 300, 40], anchor: 'chest', pos: [0, 0, -8], rot: [0, 0, 2.513], color: 0xece8de }, // wheel spoke
        { shape: 'sphere', size: 60, anchor: 'face', pos: [0, 0, -10], color: 0xd21f1a, emissive: 0xd21f1a, emissiveIntensity: 0.8 }, // single glowing red eye (HAL homage)
        { shape: 'cylinder', size: [50, 50, 700], anchor: 'root', pos: [0, 350, 0], color: 0x8a8a86 }, // pedestal/mast to the floor
      ],
      personality: { bobMul: 0.1, swayMul: 0.1, cadenceMul: 0, ampMul: 0 },
      bubbles: ['👁️', '🔒', '🚫', '🤖'] },

    // BURN-E — small yellow hull-repair bot, four insectile eyestalks, torch arm.
    { id: 'wall-e/burn-e', label: 'Small Repair Robot (yellow, four eyestalks)', rig: 'humanoid',
      humanoid: { sk: 0.55, headR: 80, headShape: 'box', limbR: 0.65,
        hover: 70, // approx: magnetic-foot hull-crawling locomotion, approximated like wall-e's treads.
        skin: 0xd9c020, body: 0xd9c020, eyes: 'none', emI: 0.15, hands: 'box', steel: true },
      accessories: [
        // approx: each eyestalk's blue lens integrated into the emissive stalk tip (budget: 4 stalks + torch + stripe ≤ 10).
        { shape: 'cylinder', size: [7, 7, 60], anchor: 'face', pos: [-40, 30, -10], rot: [-0.5, 0, 0.3], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.4, animate: { kind: 'sway', speed: 2, amp: 0.3, phase: 0 } }, // eyestalk 1
        { shape: 'cylinder', size: [7, 7, 60], anchor: 'face', pos: [-14, 40, -10], rot: [-0.6, 0, 0.1], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.4, animate: { kind: 'sway', speed: 2, amp: 0.3, phase: 1.0 } }, // eyestalk 2
        { shape: 'cylinder', size: [7, 7, 60], anchor: 'face', pos: [14, 40, -10], rot: [-0.6, 0, -0.1], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.4, animate: { kind: 'sway', speed: 2, amp: 0.3, phase: 2.0 } }, // eyestalk 3
        { shape: 'cylinder', size: [7, 7, 60], anchor: 'face', pos: [40, 30, -10], rot: [-0.5, 0, -0.3], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.4, animate: { kind: 'sway', speed: 2, amp: 0.3, phase: 3.0 } }, // eyestalk 4
        { shape: 'cone', size: [18, 60], anchor: 'handR', pos: [0, -40, 0], rot: [3.1416, 0, 0], color: 0x8a8a86 }, // welding-torch tip
        { shape: 'sphere', size: 14, anchor: 'handR', pos: [0, -80, 0], color: 0xf5c040, emissive: 0xf5c040, emissiveIntensity: 0.7 }, // torch flame tip
        { shape: 'box', size: [120, 26, 12], anchor: 'chest', pos: [0, 0, -12], rot: [0, 0, -0.5], color: 0x1a1a1a }, // diagonal hazard warning stripe
      ],
      personality: { bobMul: 0.4, swayMul: 0.4, cadenceMul: 0.3, ampMul: 0.2 },
      bubbles: ['🔧', '🔥', '😬', '⚙️'] },

    // Axiom passenger — generic soft rotund human, red-piped jumpsuit, drink cup.
    { id: 'wall-e/axiom-passenger', label: 'Ship Passenger (soft build, hover-cup)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 132, headShape: 'sphere', skin: 'tint', body: 0xc7cdd6, legColor: 0xc7cdd6,
        shoe: 0xa8afb8, eyes: 'dots', emI: 0.02, hands: 'sphere', limbR: 1.4, armL: 0.8, legL: 0.75 },
      accessories: [
        { shape: 'box', size: [170, 18, 12], anchor: 'chest', pos: [0, 20, -12], color: 0xd21f1a }, // red piping trim
        { shape: 'cylinder', size: [30, 30, 70], anchor: 'handR', pos: [0, -45, 0], color: 0xf0ece0 }, // meal-in-a-cup
      ],
      personality: { bobMul: 0.3, swayMul: 0.2, cadenceMul: 0.4, ampMul: 0.3 },
      bubbles: ['🥤', '📺', '😴', '💺'] },
  ],
};

export default pack;

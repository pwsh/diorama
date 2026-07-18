// Base ▸ Robotic — builtin base-group pack (dynamic-import only). Members keep
// their EXACT bare legacy ids + legacyAccessories markers.
import type { AvatarPackDef } from '../avatars.js';

const GREY = 0x9aa3ad, MATTE = 0x1a1a1e;

const pack: AvatarPackDef = {
  id: 'base-robotic', version: 2, label: 'Robotic', path: ['Base', 'Robotic'], builtin: true,
  avatars: [
    { id: 'robot', label: 'Robot', rig: 'humanoid', legacyAccessories: 'robot',
      humanoid: { headR: 128, headShape: 'box', skin: GREY, body: GREY, shoe: 0x33363c, emI: 0.10, hands: 'box', eyes: 'visor', steel: true, earSkip: true },
      bubbles: ['⚙️', '🔋'] },
    { id: 'cyborg', label: 'Cyborg', rig: 'humanoid', legacyAccessories: 'cyborg',
      humanoid: { eyes: 'halfred' }, bubbles: ['🔧', '⚡'] },
    { id: 'ninja_cyborg', label: 'Ninja cyborg', rig: 'humanoid', legacyAccessories: 'ninja_cyborg',
      humanoid: { headR: 120, skin: MATTE, body: MATTE, shoe: 0x0a0a0c, emI: 0.05, eyes: 'redvisor', earSkip: true }, bubbles: ['⚔️'] },

    // ── New machines (Batch C2). Each keeps one 'tint' accent (antenna tip / seam /
    // stripe / drone) so per-sensor color coding survives on a fixed-metal body.
    // Retro tin wind-up bot — boxy silver body, dial-and-gauge chest, coil antenna.
    { id: 'retro-tin-bot', label: 'Tin wind-up bot', rig: 'humanoid',
      humanoid: { headR: 128, headShape: 'box', limbR: 1.15, skin: 0xaeb4bb, body: 0xaeb4bb, shoe: 0x8a2e22, emI: 0.15, hands: 'box', eyes: 'visor', steel: true, legColor: 0x8a2e22, earSkip: true },
      accessories: [
        { shape: 'cylinder', size: [9, 9, 130], anchor: 'crown', pos: [0, 20, 0], color: 0xd8dadd }, // antenna stalk
        { shape: 'sphere', size: 20, anchor: 'crown', pos: [0, 90, 0], color: 'tint', emissiveIntensity: 0.3, outlineSkip: true }, // antenna tip
        { shape: 'cylinder', size: [70, 70, 14], anchor: 'chest', pos: [-52, 70, -8], rot: [1.5708, 0, 0], color: 0xf2f0e6 }, // dial L
        { shape: 'cylinder', size: [70, 70, 14], anchor: 'chest', pos: [52, 70, -8], rot: [1.5708, 0, 0], color: 0xf2f0e6 }, // dial R
        { shape: 'cylinder', size: [90, 90, 14], anchor: 'chest', pos: [0, -60, -8], rot: [1.5708, 0, 0], color: 0x2a2a2e }, // gauge
        { shape: 'box', size: [240, 20, 20], anchor: 'hip', pos: [0, 40, 0], color: 0xd8dadd }, // waist seam
      ],
      personality: { cadenceMul: 0.85, bobMul: 1.3, swayMul: 0.4, ampMul: 0.9 }, bubbles: ['⚙️', '🔔', '📻', '🔧'] },

    // Sleek android — pearl-white shell, cyan visor + sternum seam light.
    { id: 'sleek-android', label: 'Sleek android', rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 122, limbR: 0.85, skin: 0xf2f4f6, body: 0xf2f4f6, shoe: 0xe5e8ea, emI: 0.30, eyes: 'visor', steel: true, earSkip: true },
      accessories: [
        { shape: 'box', size: [180, 26, 14], anchor: 'face', pos: [0, 6, -4], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.6, outlineSkip: true }, // cyan visor band
        { shape: 'box', size: [16, 300, 12], anchor: 'chest', pos: [0, 0, -6], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.5, outlineSkip: true }, // sternum seam
        { shape: 'sphere', size: 16, anchor: 'back', pos: [0, 90, 6], color: 0x4fd8ff, emissive: 0x4fd8ff, emissiveIntensity: 0.5, outlineSkip: true }, // nape node
      ],
      personality: { swayMul: 0.5, bobMul: 0.7, cadenceMul: 1.0, ampMul: 0.85 }, bubbles: ['💠', '🔷', '✨', '💫'] },

    // Drone carrier bot — broad dark chassis, back rack with two hover-drone orbs.
    { id: 'drone-carrier-bot', label: 'Drone carrier bot', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 118, headShape: 'box', limbR: 1.2, skin: 0x4a4f57, body: 0x3a3e44, shoe: 0x22242a, emI: 0.20, hands: 'box', eyes: 'redvisor', steel: true, earSkip: true },
      accessories: [
        { shape: 'box', size: [280, 120, 20], anchor: 'back', pos: [0, 60, 20], color: 0x50545c }, // docking rack
        { shape: 'sphere', size: 34, anchor: 'back', pos: [-90, 180, 30], color: 'tint', emissive: 0x40e0ff, emissiveIntensity: 0.3, outlineSkip: true, animate: { kind: 'orbit', speed: 0.8, amp: 70 } }, // drone L
        { shape: 'sphere', size: 34, anchor: 'back', pos: [90, 180, 30], color: 'tint', emissive: 0x40e0ff, emissiveIntensity: 0.3, outlineSkip: true, animate: { kind: 'orbit', speed: -0.8, amp: 70 } }, // drone R (counter-rotating = patrolling)
        { shape: 'box', size: [200, 20, 10], anchor: 'chest', pos: [0, 30, -6], color: 'tint', emissiveIntensity: 0.3, outlineSkip: true }, // status strip
        { shape: 'cone', size: [40, 60], anchor: 'crown', pos: [0, 10, 0], color: 0x2a2a2e }, // scanner dome
      ],
      personality: { bobMul: 1.1, cadenceMul: 0.8, swayMul: 0.9, ampMul: 1.0 }, bubbles: ['🛰️', '📡', '🚁', '🔋'] },

    // Steampunk automaton — brass body, exposed glowing chest gear, stovepipe hat.
    { id: 'steampunk-automaton', label: 'Steampunk automaton', rig: 'humanoid',
      humanoid: { headR: 126, skin: 0xb08d57, body: 0x8a6b3e, shoe: 0x4a3a22, emI: 0.10, eyes: 'visor', steel: true, earSkip: true },
      accessories: [
        { shape: 'cylinder', size: [140, 140, 16], anchor: 'chest', pos: [0, 0, -8], rot: [1.5708, 0, 0], color: 0xc9a45c }, // exposed gear disc
        { shape: 'sphere', size: 40, anchor: 'chest', pos: [0, 0, 8], color: 0xffa030, emissive: 0xff8020, emissiveIntensity: 0.6, outlineSkip: true }, // furnace core
        { shape: 'cylinder', size: [88, 88, 150], anchor: 'crown', pos: [0, 70, 12], rot: [-0.4, 0, 0], color: 0xc9a45c }, // stovepipe crown
        { shape: 'cylinder', size: [150, 150, 14], anchor: 'crown', pos: [0, -6, 0], color: 0xc9a45c }, // hat brim
        { shape: 'cylinder', size: [16, 16, 120], anchor: 'back', pos: [42, 60, 20], color: 0x4a3a22 }, // exhaust pipe
        { shape: 'sphere', size: 42, anchor: 'back', pos: [42, 130, 24], color: 0xcfcfcf, emissiveIntensity: 0.05, outlineSkip: true }, // steam puff
        { shape: 'box', size: [252, 40, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x4a3a22 }, // gear-buckle belt
      ],
      personality: { cadenceMul: 0.75, bobMul: 1.2, swayMul: 0.7, ampMul: 0.9 }, bubbles: ['⚙️', '🕰️', '💨', '🔧'] },

    // Security bot — matte-black chassis, bold red diagonal livery + warning beacon.
    { id: 'security-bot', label: 'Security bot', rig: 'humanoid',
      humanoid: { headR: 130, headShape: 'box', limbR: 1.1, skin: 0x2b2e33, body: 0x1c1e22, shoe: 0x111214, emI: 0.20, hands: 'box', eyes: 'redvisor', steel: true, earSkip: true },
      accessories: [
        { shape: 'box', size: [280, 30, 12], anchor: 'chest', pos: [0, 0, -6], rot: [0, 0, 0.4], color: 0xd21f1f, emissive: 0xd21f1f, emissiveIntensity: 0.2 }, // diagonal stripe
        { shape: 'cylinder', size: [30, 30, 12], anchor: 'chest', pos: [0, 40, -10], rot: [1.5708, 0, 0], color: 0xc7cbd0 }, // badge rim
        { shape: 'cylinder', size: [18, 18, 14], anchor: 'chest', pos: [0, 40, -14], rot: [1.5708, 0, 0], color: 0x0a0a0c }, // lens
        { shape: 'sphere', size: 26, anchor: 'crown', pos: [0, 20, 0], color: 0xd21f1f, emissive: 0xd21f1f, emissiveIntensity: 0.5, outlineSkip: true }, // beacon
        { shape: 'cylinder', size: [6, 6, 60], anchor: 'head', pos: [-84, 40, 0], color: 0x2a2a2e }, // antenna L
        { shape: 'cylinder', size: [6, 6, 60], anchor: 'head', pos: [84, 40, 0], color: 0x2a2a2e }, // antenna R
        { shape: 'cylinder', size: [10, 10, 150], anchor: 'hip', pos: [92, -20, 0], rot: [0, 0, 0.3], color: 0x1a1a1e }, // baton
      ],
      personality: { cadenceMul: 1.15, ampMul: 1.05, bobMul: 0.9, swayMul: 0.5 }, bubbles: ['🚨', '👁️', '🔒', '📛'] },
  ],
};

export default pack;

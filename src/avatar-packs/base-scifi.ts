// Base ▸ Sci-Fi — builtin base-group pack (dynamic-import only). Members keep
// their EXACT bare legacy ids; all accessories build declaratively.
import type { AvatarPackDef } from '../avatars.js';

const WHITE = 0xf2f2f2;

const pack: AvatarPackDef = {
  id: 'base-scifi', version: 2, label: 'Sci-Fi', path: ['Base', 'Sci-Fi'], builtin: true,
  avatars: [
    // wave-2B port: translucent helmet bubble (G2 opacity 0.22) + grey chest
    // panel + tint status lamp + light-grey backpack.
    { id: 'astronaut', label: 'Astronaut', rig: 'humanoid',
      humanoid: { headR: 118, limbR: 1.1, skin: WHITE, body: WHITE, shoe: WHITE, emI: 0.15, earSkip: true },
      accessories: [
        { shape: 'sphere', size: 148.68, anchor: 'head', color: 0xbfd8e8, emissive: 0, emissiveIntensity: 1, opacity: 0.22, outlineSkip: true }, // helmet bubble (translucent)
        { shape: 'box', size: [120, 168, 26], anchor: 'chest', pos: [0, 60, -10], color: 0x8a9099, emissive: 0, emissiveIntensity: 1 }, // chest control panel
        { shape: 'sphere', size: 20, anchor: 'chest', pos: [33.6, 108, -26], color: 'tint' }, // status lamp
        { shape: 'box', size: [204, 360, 84], anchor: 'back', pos: [0, 30, 44.8], color: 0xd8d8dc, emissive: 0, emissiveIntensity: 1 }, // backpack
      ],
      personality: { bobMul: 1.5, cadenceMul: 0.75 }, bubbles: ['🚀', '⭐'] },

    // ── New generic sci-fi archetypes (Batch C2). Desaturated utilitarian tones;
    // one 'tint' accent light per member so per-sensor color coding survives.
    // Space marine — bulky powered armor, broad pauldrons (shoulder anchors), HUD visor.
    { id: 'space-marine', label: 'Space marine (armor)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 122, limbR: 1.3, skin: 0x565a3d, body: 0x4a4e57, shoe: 0x2a2c30, emI: 0.15, hands: 'box', eyes: 'visor', steel: true, earSkip: true },
      accessories: [
        { shape: 'box', size: [170, 110, 140], anchor: 'shoulderL', pos: [-10, 30, 0], color: 0x565a3d }, // pauldron L
        { shape: 'box', size: [170, 110, 140], anchor: 'shoulderR', pos: [10, 30, 0], color: 0x565a3d }, // pauldron R
        { shape: 'box', size: [90, 60, 20], anchor: 'chest', pos: [0, 20, -8], color: 0x33363c }, // chest plate
        { shape: 'sphere', size: 20, anchor: 'chest', pos: [0, 20, -20], color: 'tint', emissiveIntensity: 0.4, outlineSkip: true }, // accent light
        { shape: 'box', size: [216, 420, 98], anchor: 'back', pos: [0, 0, 30], color: 0x4a4e57 }, // power unit
        { shape: 'box', size: [80, 40, 20], anchor: 'face', pos: [0, -42, -4], color: 0x2a2c30 }, // chin guard
        { shape: 'box', size: [252, 40, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x33363c }, // utility belt
        { shape: 'box', size: [26, 28, 320], anchor: 'handR', pos: [0, 10, -90], color: 0x2a2c30 }, // service rifle
      ],
      personality: { bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.85, ampMul: 1.1 }, bubbles: ['🛡️', '💥', '🎯', '📡'] },

    // Retro spaceman — raygun-gothic chrome suit, fishbowl helmet with a fin.
    { id: 'retro-spaceman', label: 'Retro spaceman (raygun)', rig: 'humanoid',
      humanoid: { headR: 124, skin: 0xc8ccd2, body: 0xc8ccd2, shoe: 0x1a1a1f, emI: 0.12, earSkip: true },
      accessories: [
        { shape: 'sphere', size: 168, anchor: 'head', pos: [0, 0, 0], color: 0xbfd8e8, roughness: 0.2, outlineSkip: true }, // fishbowl helmet
        { shape: 'box', size: [12, 90, 180], anchor: 'crown', pos: [0, 30, 0], color: 0xd8dce2 }, // helmet fin
        { shape: 'cylinder', size: [6, 6, 90], anchor: 'crown', pos: [44, 50, 40], color: 0xd8dce2 }, // antenna
        { shape: 'box', size: [90, 70, 20], anchor: 'chest', pos: [0, 40, -8], color: 0xd8dce2 }, // control box
        { shape: 'sphere', size: 16, anchor: 'chest', pos: [0, 40, -20], color: 'tint', emissiveIntensity: 0.4, outlineSkip: true }, // accent light
        { shape: 'cylinder', size: [16, 16, 120], anchor: 'handR', pos: [0, -20, -60], rot: [1.5708, 0, 0], color: 0xd8dce2 }, // raygun barrel
        { shape: 'sphere', size: 14, anchor: 'handR', pos: [0, -20, -120], color: 'tint', emissiveIntensity: 0.5, outlineSkip: true }, // raygun tip
      ],
      personality: { bobMul: 1.2, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.1 }, bubbles: ['🚀', '👽', '⚡', '🛸'] },

    // Time traveler — dark long coat with tails, top hat, brass goggles + watch chain.
    { id: 'time-traveler', label: 'Time traveler (chrononaut)', rig: 'humanoid',
      humanoid: { headR: 126, body: 0x3a2a1e, shoe: 0x1a1512, emI: 0.2, earSkip: false },
      accessories: [
        { shape: 'cylinder', size: [170, 170, 16], anchor: 'crown', pos: [0, -6, 0], color: 0x1c1712 }, // hat brim
        { shape: 'cylinder', size: [110, 110, 220], anchor: 'crown', pos: [0, 110, 0], color: 0x1c1712 }, // hat crown
        { shape: 'box', size: [170, 16, 16], anchor: 'crown', pos: [0, 20, 0], color: 0xb08d57 }, // hat band
        { shape: 'cylinder', size: [30, 30, 20], anchor: 'crown', pos: [-40, -30, -104], rot: [1.5708, 0, 0], color: 0xb08d57 }, // goggle L (on forehead)
        { shape: 'cylinder', size: [30, 30, 20], anchor: 'crown', pos: [40, -30, -104], rot: [1.5708, 0, 0], color: 0xb08d57 }, // goggle R
        { shape: 'sphere', size: 20, anchor: 'chest', pos: [0, 40, -10], color: 0xb08d57 }, // pocket watch
        { shape: 'box', size: [276, 700, 20], anchor: 'back', pos: [0, -300, 10], color: 0x3a2a1e }, // coat tails
        { shape: 'box', size: [252, 40, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x1a1512 }, // belt
      ],
      personality: { bobMul: 0.9, swayMul: 0.85, cadenceMul: 0.95, ampMul: 0.9 }, bubbles: ['⏳', '🕰️', '⚡', '📜'] },

    // Space pirate — salvage-plate jacket, eyepatch (occlusion) + chrome ear implant.
    { id: 'space-pirate', label: 'Space pirate (raider)', rig: 'humanoid',
      humanoid: { headR: 126, body: 0x3d3630, shoe: 0x201c18, emI: 0.2 },
      accessories: [
        { shape: 'box', size: [42, 30, 14], anchor: 'face', pos: [40, 12, -8], color: 0x14120f }, // eyepatch
        { shape: 'box', size: [30, 14, 8], anchor: 'face', pos: [70, 16, 4], rot: [0, 0.4, 0], color: 0x14120f }, // strap
        { shape: 'box', size: [24, 30, 20], anchor: 'head', pos: [-92, 8, 0], color: 0xd8dce2 }, // ear implant
        { shape: 'sphere', size: 10, anchor: 'head', pos: [-92, 20, -14], color: 'tint', emissiveIntensity: 0.5, outlineSkip: true }, // implant LED
        { shape: 'box', size: [40, 60, 24], anchor: 'hip', pos: [92, -10, -40], color: 0x33363c }, // holstered blaster
        { shape: 'sphere', size: 10, anchor: 'hip', pos: [92, -10, -74], color: 'tint', emissiveIntensity: 0.5, outlineSkip: true }, // muzzle glow
        { shape: 'box', size: [30, 300, 18], anchor: 'chest', pos: [0, 0, -6], rot: [0, 0, 0.5], color: 0x2a1c14 }, // bandolier
        { shape: 'sphere', size: 150, anchor: 'head', pos: [0, 34, 34], rot: [-0.5, 0, 0], sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.5], color: 0x6e2430 }, // bandana skullcap
      ],
      personality: { bobMul: 1.0, swayMul: 1.3, cadenceMul: 0.95, ampMul: 1.15 }, bubbles: ['🏴‍☠️', '💰', '🔫', '🌌'] },

    // Mad scientist — white coat, wild asymmetric frizz, oversized amber goggles, glowing vial.
    { id: 'mad-scientist', label: 'Mad scientist (inventor)', rig: 'humanoid',
      humanoid: { headR: 126, body: 0xe8e8e4, shoe: 0x2a2a2e, emI: 0.2 },
      accessories: [
        { shape: 'sphere', size: 54, anchor: 'crown', pos: [-70, 6, 10], color: 0xd8d4c8 }, // frizz L
        { shape: 'sphere', size: 48, anchor: 'crown', pos: [64, 24, -14], color: 0xd8d4c8 }, // frizz R
        { shape: 'sphere', size: 44, anchor: 'crown', pos: [10, 40, 40], color: 0xd8d4c8 }, // frizz top
        { shape: 'sphere', size: [46, 46, 20], anchor: 'face', pos: [-38, 10, -8], color: 0xd8a030 }, // goggle L
        { shape: 'sphere', size: [46, 46, 20], anchor: 'face', pos: [38, 10, -8], color: 0xd8a030 }, // goggle R
        { shape: 'cylinder', size: [16, 16, 90], anchor: 'handR', pos: [0, -30, -20], color: 0xcfe8ea }, // vial glass
        { shape: 'sphere', size: 22, anchor: 'handR', pos: [0, -60, -20], color: 'tint', emissiveIntensity: 0.6, outlineSkip: true }, // glowing liquid
      ],
      personality: { bobMul: 1.3, swayMul: 1.1, cadenceMul: 1.2, ampMul: 1.2 }, bubbles: ['🧪', '⚗️', '💡', '⚡'] },

    // Wasteland wanderer — patchwork wrap, gas mask covering the face (noFace), scrap pack.
    { id: 'wasteland-wanderer', label: 'Wasteland wanderer', rig: 'humanoid',
      humanoid: { headR: 126, limbR: 1.05, body: 0x6b6350, shoe: 0x3a342a, emI: 0.12, hands: 'box', eyes: 'dots', noFace: true },
      accessories: [
        { shape: 'box', size: [110, 80, 50], anchor: 'face', pos: [0, -18, -14], color: 0x1c1c1a }, // mask muzzle
        { shape: 'sphere', size: 26, anchor: 'face', pos: [-36, 12, -28], color: 0x333338 }, // lens L
        { shape: 'sphere', size: 26, anchor: 'face', pos: [36, 12, -28], color: 0x333338 }, // lens R
        { shape: 'cylinder', size: [16, 16, 40], anchor: 'face', pos: [-70, -20, -20], rot: [0, 0, 1.2], color: 0x4a4e57 }, // filter canister
        { shape: 'box', size: [80, 70, 16], anchor: 'chest', pos: [-30, 40, -8], color: 0x8a5a3a }, // patch
        { shape: 'box', size: [90, 60, 16], anchor: 'chest', pos: [40, -20, -8], color: 0xb8ab8a }, // patch
        { shape: 'cylinder', size: [40, 40, 200], anchor: 'back', pos: [0, 60, 26], rot: [0, 0, 1.5708], color: 0xb8ab8a }, // bedroll
        { shape: 'box', size: [140, 120, 60], anchor: 'back', pos: [0, -40, 26], color: 0x3a342a }, // scrap pack
      ],
      personality: { bobMul: 0.85, swayMul: 1.0, cadenceMul: 0.85, ampMul: 0.9 }, bubbles: ['☢️', '🔧', '🥫', '🌪️'] },
  ],
};

export default pack;

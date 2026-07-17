// Pop Culture ▸ Movies ▸ Pirates of the Caribbean — franchise pack (dynamic-
// import only, default loaded:false). Stylized geometric toon homage: color +
// silhouette only, no logos/likenesses. Each member has ONE strong hat/head
// shape read; fixed weathered High-Seas costume colors are load-bearing
// identity, each carrying at least one small saturated accent.
// Source doc: docs/avatars/pop-culture/movies-pirates-caribbean.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'movies-pirates-caribbean', version: 2, label: 'Pirates of the Caribbean',
  path: ['Pop Culture', 'Movies', 'Pirates of the Caribbean'], builtin: true, franchise: true,
  base: { rig: 'humanoid', humanoid: { emI: 0, hands: 'sphere', headShape: 'sphere', steel: false, eyes: 'almond', footMul: [1, 1, 1] } },
  avatars: [
    // Jack Sparrow — worn tricorn, red bandana, beaded dreadlocks, stacked belts.
    { id: 'movies-pirates-caribbean/jack', label: 'Roguish captain (tricorn, beaded dreadlocks)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, limbR: 0.95, skin: 0xc9976a, body: 0x5c4630, shoe: 0x3a2e20, armL: 1.0, legL: 1.0, legColor: 0x3a2e20 },
      accessories: [
        { shape: 'box', size: [130, 40, 90], anchor: 'crown', pos: [0, 30, 0], rot: [0.45, 0, 0], color: 0x241f1a }, // tricorn
        { shape: 'box', size: [110, 16, 80], anchor: 'crown', pos: [0, -6, 6], color: 0xa83030 }, // red bandana
        { shape: 'sphere', size: [90, 70, 70], anchor: 'head', pos: [0, -40, 20], color: 0x1c1810 }, // dreadlocks
        { shape: 'sphere', size: 10, anchor: 'head', pos: [40, -80, 30], color: 0xa8842e }, // bead
        { shape: 'box', size: [30, 140, 10], anchor: 'chest', pos: [0, 0, -10], rot: [0, 0, 0.5], color: 0xc9a86a }, // sash
        { shape: 'box', size: [210, 44, 160], anchor: 'hip', pos: [0, 0, 0], color: 0x3a2e20 }, // belts
        { shape: 'box', size: [46, 40, 12], anchor: 'hip', pos: [0, -6, -84], color: 0xa8842e }, // buckle
        { shape: 'cylinder', size: [30, 30, 10], anchor: 'handL', pos: [0, -20, 0], color: 0xa8842e }, // compass
      ],
      personality: { bobMul: 1.15, swayMul: 1.35, cadenceMul: 0.95, ampMul: 1.1 },
      bubbles: ['🏴‍☠️', '🧭', '🥃', '😏'] },

    // Will Turner — bandana (no hat), earthy red shirt, sword across back.
    { id: 'movies-pirates-caribbean/will', label: 'Blacksmith swordsman (red shirt, bandana)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 120, limbR: 1.0, skin: 0xd8ac82, body: 0x8a3d2c, shoe: 0x241f1a, armL: 1.05, legL: 1.0, legColor: 0x4a3826 },
      accessories: [
        { shape: 'sphere', size: [70, 50, 70], anchor: 'crown', pos: [0, -4, 0], color: 0x241f1a }, // dark hair
        { shape: 'box', size: [90, 14, 78], anchor: 'crown', pos: [0, -14, 4], color: 0xc9a86a }, // bandana
        { shape: 'box', size: [16, 300, 16], anchor: 'back', pos: [0, 20, 30], rot: [0, 0, 0.3], color: 0x8a8a86 }, // sword
        { shape: 'box', size: [20, 50, 20], anchor: 'back', pos: [-70, -110, 30], rot: [0, 0, 0.3], color: 0x3a2e20 }, // grip
        { shape: 'box', size: [160, 200, 16], anchor: 'back', pos: [0, -40, 6], color: 0x1c1a18 }, // sailor coat panel
        { shape: 'box', size: [190, 24, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x3a2e20 }, // belt
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'chest', pos: [0, -10, -12], color: 0xa8842e }, // medallion
      ],
      personality: { bobMul: 1.0, swayMul: 0.7, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['⚔️', '⚓', '❤️', '🔨'] },

    // Elizabeth Swann — wide low black hat with red piping, jade necklace.
    { id: 'movies-pirates-caribbean/elizabeth', label: 'Pirate captain (Eastern-style black leathers)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 114, limbR: 0.85, skin: 0xe8c2a0, body: 0x1c1a18, shoe: 0x1c1a18, armL: 0.95, legL: 1.0, legColor: 0x241f1a },
      accessories: [
        { shape: 'cylinder', size: [140, 140, 40], anchor: 'crown', pos: [0, 20, 0], rot: [0.4, 0, 0], color: 0x1c1a18 }, // wide low hat
        { shape: 'cylinder', size: [145, 145, 10], anchor: 'crown', pos: [0, 4, 0], rot: [0.4, 0, 0], color: 0xa83030 }, // red piping
        { shape: 'sphere', size: [80, 90, 70], anchor: 'head', pos: [0, -50, 20], color: 0x241f1a }, // long hair
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'chest', pos: [0, 0, -12], color: 0x3f6b5a }, // jade necklace
        { shape: 'box', size: [180, 40, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x3a342c }, // cincher
        { shape: 'box', size: [40, 30, 10], anchor: 'hip', pos: [0, 0, -80], color: 0xa8842e }, // brass detail
        { shape: 'cape', size: [140, 276, 200], anchor: 'back', pos: [0, -135, 12], rot: [0.12, 0, 0], color: 0x2a2420 }, // coat drape
        { shape: 'box', size: [16, 260, 10], anchor: 'handR', pos: [0, -100, 0], color: 0x8a8a86 }, // cutlass
      ],
      personality: { bobMul: 0.95, swayMul: 0.85, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['⚔️', '👑', '🌊', '😤'] },

    // Barbossa — feathered wide-brim hat, ash-grey coat, green bandana, apple.
    { id: 'movies-pirates-caribbean/barbossa', label: 'Cursed captain (feathered hat, apple)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, limbR: 1.0, skin: 0xc99a70, body: 0x7a756c, shoe: 0x241f1a, armL: 1.0, legL: 1.0, legColor: 0x3a342c },
      accessories: [
        { shape: 'cone', size: [150, 90], anchor: 'crown', pos: [0, 20, 0], rot: [0.42, 0, 0], color: 0x3a342c }, // wide-brim hat
        { shape: 'cone', size: [10, 70], anchor: 'crown', pos: [-30, 50, -20], rot: [-0.3, 0, -0.3], color: 0x241f1a }, // feather
        { shape: 'cone', size: [10, 60], anchor: 'crown', pos: [10, 50, -30], rot: [-0.4, 0, 0.1], color: 0x5c4630 }, // feather
        { shape: 'sphere', size: [70, 60, 70], anchor: 'head', pos: [0, -40, 10], color: 0x8a8378 }, // greying hair
        { shape: 'box', size: [80, 12, 74], anchor: 'head', pos: [0, -10, 6], color: 0x3f5c3a }, // green bandana
        { shape: 'box', size: [30, 40, 20], anchor: 'face', pos: [0, -70, 10], color: 0x8a8378 }, // goatee
        { shape: 'box', size: [200, 40, 160], anchor: 'hip', pos: [0, 0, 0], color: 0x4a3826 }, // belt
        { shape: 'box', size: [40, 34, 10], anchor: 'hip', pos: [0, 0, -84], color: 0xa8842e }, // buckle
        { shape: 'sphere', size: 35, anchor: 'handR', pos: [0, -20, 0], color: 0x4f6b3a }, // apple
      ],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.9, ampMul: 1.05 },
      bubbles: ['🍏', '🦜', '⚔️', '😏'] },

    // Davy Jones — faded pale-blue tricorn, tentacle beard, crab claw.
    { id: 'movies-pirates-caribbean/davyjones', label: 'Cursed sea captain (tentacle beard, claw)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 130, limbR: 1.0, skin: 0x5c6e5c, body: 0x5c7280, shoe: 0x2a3430, eyes: 'slit', armL: 1.0, legL: 0.95, footMul: [1.1, 1, 1.1], legColor: 0x3a4640 },
      accessories: [
        { shape: 'cone', size: [100, 150], anchor: 'crown', pos: [0, 40, 0], rot: [0.4, 0, 0], color: 0x5c7280 }, // tricorn
        { shape: 'cylinder', size: [95, 95, 8], anchor: 'crown', pos: [0, -10, 0], rot: [0.4, 0, 0], color: 0xa8842e }, // gold brim
        { shape: 'cylinder', size: [10, 6, 90], anchor: 'face', pos: [-30, -70, 20], rot: [0.4, 0, -0.2], color: 0x7a5c78 }, // tentacle
        { shape: 'cylinder', size: [10, 6, 100], anchor: 'face', pos: [-10, -80, 24], rot: [0.5, 0, 0], color: 0x6a4c68 }, // tentacle
        { shape: 'cylinder', size: [10, 6, 100], anchor: 'face', pos: [10, -80, 24], rot: [0.5, 0, 0], color: 0x5a3f5a }, // tentacle
        { shape: 'cylinder', size: [10, 6, 90], anchor: 'face', pos: [30, -70, 20], rot: [0.4, 0, 0.2], color: 0x4a3a52 }, // tentacle
        { shape: 'box', size: [50, 70, 44], anchor: 'handR', pos: [0, -10, 0], color: 0x8a9098, metalness: 0.6 }, // crab claw
        { shape: 'box', size: [30, 150, 10], anchor: 'hip', pos: [0, 0, -8], rot: [0, 0, 0.5], color: 0x5c1c1c }, // dark red sash
        { shape: 'cape', size: [150, 300, 225], anchor: 'back', pos: [0, -135, 14], rot: [0.12, 0, 0], color: 0x3a4650 }, // coat-tail
      ],
      // approx: writhing tentacle beard = fan of straight cylinders; crab claw = fused box (no pincer shape).
      personality: { bobMul: 0.8, swayMul: 1.1, cadenceMul: 0.75, ampMul: 0.85 },
      bubbles: ['🐙', '💔', '⚓', '😠'] },

    // Tia Dalma — heavy dreadlocks, ragged dark dress, shell/bone necklaces, gold tooth.
    { id: 'movies-pirates-caribbean/tiadalma', label: 'Voodoo seer (shell jewelry, dreadlocks)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 116, limbR: 0.85, skin: 0x5c4030, body: 0x3a2e22, shoe: 0x241a12, armL: 0.9, legL: 0.95, legColor: 0x2e2418 },
      accessories: [
        { shape: 'sphere', size: [140, 110, 120], anchor: 'crown', pos: [0, -6, 6], color: 0x1c140e }, // dreadlocks
        { shape: 'sphere', size: 14, anchor: 'chest', pos: [-30, 0, -12], color: 0xe8dcc0 }, // shell
        { shape: 'sphere', size: 14, anchor: 'chest', pos: [0, -6, -14], color: 0xe8dcc0 }, // shell
        { shape: 'sphere', size: 12, anchor: 'chest', pos: [30, 0, -12], color: 0xa8842e }, // bone bead
        { shape: 'box', size: [180, 18, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x8a6a3a }, // cord belt
        { shape: 'cone', size: [8, 40], anchor: 'hip', pos: [0, -30, -70], rot: [3.14, 0, 0], color: 0x8a6a3a }, // tassel
        { shape: 'cape', size: [145, 288, 215], anchor: 'back', pos: [0, -135, 12], rot: [0.12, 0, 0], color: 0x4a3c2c }, // overcoat drape
        { shape: 'cylinder', size: [8, 8, 4], anchor: 'face', pos: [0, -60, -8], color: 0xc9a83a }, // gold tooth glint
      ],
      personality: { bobMul: 0.85, swayMul: 1.0, cadenceMul: 0.8, ampMul: 0.8 },
      bubbles: ['🐍', '🔮', '🌊', '💀'] },
  ],
};

export default pack;

// Pop Culture ▸ TV ▸ The Big Bang Theory — franchise pack (dynamic-import only,
// default loaded:false). Stylized geometric homage: color + silhouette only, no
// likenesses/logos. Named-cast pack → FIXED costume colors, not tint carriers.
// Source doc: docs/avatars/pop-culture/tv-big-bang-theory.md
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

// Shared rectangular-glasses recipe (bolt-on frame over the generic 'dots'
// eyes). Two flat lens boxes + a bridge on the `face` anchor (already at the
// head front, z = -HEAD_R); pushed a few mm proud.
const glasses = (frame: number): AvatarPrimitive[] => [
  { shape: 'box', size: [52, 34, 8], anchor: 'face', pos: [ 58, -4, -4], color: frame, outlineSkip: true },
  { shape: 'box', size: [52, 34, 8], anchor: 'face', pos: [-58, -4, -4], color: frame, outlineSkip: true },
  { shape: 'box', size: [16, 8, 6],  anchor: 'face', pos: [0, -4, -6], color: frame, outlineSkip: true },
];

const pack: AvatarPackDef = {
  id: 'tv-big-bang-theory', version: 1, label: 'The Big Bang Theory',
  path: ['Pop Culture', 'TV Shows', 'The Big Bang Theory'], builtin: true, franchise: true,
  avatars: [
    // Sheldon Cooper — tallest/thinnest; red graphic tee + yellow bolt.
    { id: 'tv-big-bang-theory/sheldon-flash', label: 'Theoretical physicist (red tee, tall)',
      rig: 'humanoid',
      humanoid: { sk: 1.12, headR: 122, skin: 0xe8c4a0, body: 0x2b3a4a, legColor: 0x54595e,
        shoe: 0x2a2a2a, eyes: 'dots', emI: 0, limbR: 0.85, armL: 1.03, legL: 1.03 },
      accessories: [
        { shape: 'sphere', size: [65, 18, 65], anchor: 'crown', pos: [0, -6, 4], rot: [0.3, 0, 0], color: 0x4a2f1c },
        { shape: 'box', size: [208, 250, 10], anchor: 'chest', pos: [0, 6, -8], color: 0xd41e2c },
        { shape: 'box', size: [50, 18, 6], anchor: 'chest', pos: [-14, 4, -16], rot: [0, 0, 0.7], color: 0xf4c542 },
        { shape: 'box', size: [50, 18, 6], anchor: 'chest', pos: [14, 4, -16], rot: [0, 0, -0.7], color: 0xf4c542 },
      ],
      personality: { bobMul: 0.75, swayMul: 0.55, cadenceMul: 1.0, ampMul: 0.7 },
      bubbles: ['🚂', '🧠', '📐', '🧴'] },

    // Leonard Hofstadter — glasses, curly hair, layered jacket-over-hoodie.
    { id: 'tv-big-bang-theory/leonard-hoodie', label: 'Experimental physicist (glasses, layered jacket)',
      rig: 'humanoid',
      humanoid: { sk: 0.97, headR: 126, skin: 0xe4bf98, body: 0x8a7a52, legColor: 0x3f4a52,
        shoe: 0x232323, eyes: 'dots', emI: 0, limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: 40, anchor: 'crown', pos: [-24, -4, 10], color: 0x3a2416 },
        { shape: 'sphere', size: 40, anchor: 'crown', pos: [26, -2, 6], color: 0x3a2416 },
        { shape: 'sphere', size: 40, anchor: 'crown', pos: [0, 6, 26], color: 0x3a2416 },
        ...glasses(0x1c1408),
        { shape: 'box', size: [104, 30, 10], anchor: 'neck', pos: [0, -8, -86], color: 0x6b6f74 },
        { shape: 'box', size: [10, 140, 5], anchor: 'chest', pos: [0, -10, -10], color: 0x9a9ea2 },
      ],
      personality: { bobMul: 1.0, swayMul: 0.95, cadenceMul: 1.0, ampMul: 1.05 },
      bubbles: ['🔬', '📚', '💕', '🎮'] },

    // Howard Wolowitz — shortest; saturated turtleneck, poofy bowl-cut, big buckle.
    { id: 'tv-big-bang-theory/howard-turtleneck', label: 'Aerospace engineer (turtleneck, big buckle)',
      rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 124, skin: 0xe0ba92, body: 0x6a3fa0, legColor: 0x1c1c1c,
        shoe: 0x141414, eyes: 'dots', emI: 0, limbR: 0.85 },
      accessories: [
        { shape: 'sphere', size: [72, 23, 72], anchor: 'crown', pos: [0, -10, 4], rot: [0.25, 0, 0], color: 0x14100c },
        { shape: 'cylinder', size: [78, 78, 26], anchor: 'neck', pos: [0, -4, 0], color: 0xefe8da },
        { shape: 'box', size: [90, 60, 22], anchor: 'hip', pos: [0, 6, -30], color: 0xd4af37,
          metalness: 0.6, roughness: 0.3 },
      ],
      personality: { bobMul: 1.0, swayMul: 1.25, cadenceMul: 1.1, ampMul: 0.95 },
      bubbles: ['🚀', '😏', '🎹', '💍'] },

    // Raj Koothrappali — sweater vest, oversized flared collar, argyle hints.
    { id: 'tv-big-bang-theory/raj-sweater-vest', label: 'Astrophysicist (sweater vest, big collar)',
      rig: 'humanoid',
      humanoid: { sk: 0.97, headR: 126, skin: 0x8a5a3c, body: 0x8a2f3a, legColor: 0x8a7c54,
        shoe: 0x3a2a1a, eyes: 'dots', emI: 0, limbR: 0.95 },
      accessories: [
        { shape: 'sphere', size: [63, 17, 63], anchor: 'crown', pos: [0, -6, 4], rot: [0.3, 0, 0], color: 0x14100c },
        { shape: 'box', size: [70, 40, 8], anchor: 'neck', pos: [-34, -6, -88], rot: [0, 0, 0.5], color: 0xf2f0e8 },
        { shape: 'box', size: [70, 40, 8], anchor: 'neck', pos: [34, -6, -88], rot: [0, 0, -0.5], color: 0xf2f0e8 },
        // approx: argyle knit print unsupported (no fabric patterns) — a couple of
        // rotated diamond accent boxes stand in for the pattern.
        { shape: 'box', size: [30, 30, 6], anchor: 'chest', pos: [0, 20, -10], rot: [0, 0, 0.78], color: 0xc9a227 },
        { shape: 'box', size: [30, 30, 6], anchor: 'chest', pos: [0, -20, -10], rot: [0, 0, 0.78], color: 0xc9a227 },
        { shape: 'box', size: [200, 22, 165], anchor: 'hip', pos: [0, 0, 0], color: 0x4a3320 },
      ],
      personality: { bobMul: 0.95, swayMul: 0.85, cadenceMul: 0.95, ampMul: 0.9 },
      bubbles: ['🐶', '🎨', '🍸', '🔭'] },

    // Penny — the non-scientist neighbor; long blonde hair, pink top, no accessories.
    { id: 'tv-big-bang-theory/penny-neighbor', label: 'Neighbor (blonde, casual pink)',
      rig: 'humanoid',
      humanoid: { sk: 0.90, headR: 120, skin: 0xeac49c, body: 0xe0568a, legColor: 0x2b3f5c,
        shoe: 0xc9a06a, eyes: 'dots', emI: 0, limbR: 0.85 },
      accessories: [
        { shape: 'sphere', size: [74, 55, 74], anchor: 'crown', pos: [0, -14, 12], rot: [0.35, 0, 0], color: 0xe8c468 },
        { shape: 'box', size: [42, 90, 32], anchor: 'head', pos: [-58, -30, 12], color: 0xe8c468 },
        { shape: 'box', size: [42, 90, 32], anchor: 'head', pos: [58, -30, 12], color: 0xe8c468 },
      ],
      personality: { bobMul: 1.0, swayMul: 1.1, cadenceMul: 1.0, ampMul: 1.05 },
      bubbles: ['🍷', '💇', '🎭', '😂'] },

    // Bernadette — smallest build; red glasses, blonde bangs, sage floral skirt.
    { id: 'tv-big-bang-theory/bernadette-red-glasses', label: 'Microbiologist (petite, red glasses)',
      rig: 'humanoid',
      humanoid: { sk: 0.74, headR: 116, skin: 0xeac49c, body: 0xd9b8cf, legColor: 0x8ea67a,
        shoe: 0x1c1c1c, eyes: 'dots', emI: 0, limbR: 0.8, armL: 0.92, legL: 0.9 },
      accessories: [
        { shape: 'sphere', size: [66, 44, 66], anchor: 'crown', pos: [0, -12, 10], rot: [0.35, 0, 0], color: 0xe8c468 },
        { shape: 'box', size: [90, 20, 14], anchor: 'crown', pos: [0, -34, -40], color: 0xe8c468 },
        ...glasses(0xb01c24),
        // approx: floral print unsupported — a solid sage skirt band from waist to knee.
        { shape: 'box', size: [200, 75, 155], anchor: 'hip', pos: [0, -20, 0], color: 0x8ea67a },
      ],
      personality: { bobMul: 0.95, swayMul: 0.9, cadenceMul: 1.15, ampMul: 0.8 },
      bubbles: ['🔬', '👶', '😠', '🎀'] },

    // Amy Farrah Fowler — rectangular glasses, brunette hair, denim skirt.
    { id: 'tv-big-bang-theory/amy-cardigan-glasses', label: 'Neuroscientist (glasses, cardigan)',
      rig: 'humanoid',
      humanoid: { sk: 0.90, headR: 120, skin: 0xe4be98, body: 0x6a3550, legColor: 0x8a8a90,
        shoe: 0x3a2a1a, eyes: 'dots', emI: 0, limbR: 0.9 },
      accessories: [
        { shape: 'sphere', size: [68, 35, 68], anchor: 'crown', pos: [0, -10, 8], rot: [0.3, 0, 0], color: 0x2e1c12 },
        { shape: 'box', size: [40, 72, 30], anchor: 'head', pos: [-56, -24, 10], color: 0x2e1c12 },
        { shape: 'box', size: [40, 72, 30], anchor: 'head', pos: [56, -24, 10], color: 0x2e1c12 },
        ...glasses(0x4a2f1c),
        { shape: 'box', size: [196, 68, 150], anchor: 'hip', pos: [0, -18, 0], color: 0x4a5b74 },
      ],
      personality: { bobMul: 0.9, swayMul: 0.8, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['🧠', '🐈', '📓', '💜'] },
  ],
};

export default pack;

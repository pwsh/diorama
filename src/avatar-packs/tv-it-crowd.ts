// Pop Culture ▸ TV ▸ The IT Crowd — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric homage: color + silhouette only, no
// likenesses/logos. "Beige basement vs. glass boardroom" — muted IT regulars vs.
// rich executive suits. Named-cast pack → FIXED costume colors, not tint
// carriers. Collars/ties ride the `neck` anchor.
// Source doc: docs/avatars/pop-culture/tv-it-crowd.md
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

// Oversized rectangular-glasses recipe (bolt-on frame over generic 'dots' eyes)
// — the up-scaled variant exists for Moss's running "bigger glasses" gag.
const bigGlasses = (frame: number): AvatarPrimitive[] => [
  { shape: 'box', size: [70, 48, 8], anchor: 'face', pos: [ 62, -4, -4], color: frame, outlineSkip: true },
  { shape: 'box', size: [70, 48, 8], anchor: 'face', pos: [-62, -4, -4], color: frame, outlineSkip: true },
  { shape: 'box', size: [18, 10, 6], anchor: 'face', pos: [0, -4, -6], color: frame, outlineSkip: true },
];

const pack: AvatarPackDef = {
  id: 'tv-it-crowd', version: 1, label: 'The IT Crowd',
  path: ['Pop Culture', 'TV Shows', 'The IT Crowd'], builtin: true, franchise: true,
  avatars: [
    // Moss — enormous glasses, asymmetric side-part afro, checked shirt + tie.
    { id: 'tv-it-crowd/helpdesk-boffin', label: 'IT technician (huge glasses, checked shirt, tie)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 128, skin: 0xb9865e, body: 0x9fb2c0, legColor: 0xa8875a,
        shoe: 0x2a1c12, eyes: 'dots', emI: 0, limbR: 0.95 },
      accessories: [
        ...bigGlasses(0x151515),
        // asymmetric afro (fuller on one side, notched on the other) hints the hard side-part.
        { shape: 'sphere', size: [72, 36, 72], anchor: 'crown', pos: [-14, -6, 4], rot: [0.3, 0, 0], color: 0x0e0c0a },
        { shape: 'sphere', size: [48, 30, 48], anchor: 'crown', pos: [34, 0, 4], color: 0x0e0c0a },
        { shape: 'box', size: [70, 20, 6], anchor: 'neck', pos: [0, 4, -16], color: 0xf0ede4 },
        // approx: checked-shirt + knit-tie print unsupported — solid base + a tapered tie box.
        { shape: 'box', size: [40, 160, 8], anchor: 'chest', pos: [0, -10, -10], color: 0x5a2f24 },
      ],
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.9, ampMul: 0.65 },
      bubbles: ['🖥️', '💾', '📴', '😐'] },

    // Roy — graphic tee (approximated), messy tousled hair, held games console.
    { id: 'tv-it-crowd/helpdesk-slacker', label: 'IT technician (graphic tee, tousled hair)',
      rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, skin: 0xe0b48c, body: 0x2c2c2e, legColor: 0x33455e,
        shoe: 0xd8d4c8, eyes: 'dots', emI: 0, limbR: 1.05 },
      accessories: [
        { shape: 'sphere', size: [65, 23, 65], anchor: 'crown', pos: [-8, -2, 6], rot: [0.2, 0, -0.15], color: 0x3a2418 },
        // approx: graphic-tee print unsupported — an off-white patch + a red accent block.
        { shape: 'box', size: [150, 150, 6], anchor: 'chest', pos: [0, 6, -8], color: 0xd8d4c8 },
        { shape: 'box', size: [42, 32, 4], anchor: 'chest', pos: [10, 6, -12], rot: [0, 0, 0.4], color: 0xb01c24 },
        { shape: 'box', size: [70, 110, 14], anchor: 'handR', pos: [0, -30, -10], color: 0x232323 },
        { shape: 'box', size: [50, 70, 4], anchor: 'handR', pos: [0, -30, -18], color: 0x9fd0e0 },
      ],
      personality: { bobMul: 1.05, swayMul: 1.0, cadenceMul: 0.9, ampMul: 0.9 },
      bubbles: ['🎮', '🙄', '😏', '💤'] },

    // Jen — the one in formalwear; auburn fringed bob, charcoal waistcoat.
    { id: 'tv-it-crowd/relationship-manager', label: 'Manager (auburn bob, office blouse)',
      rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 118, skin: 0xe8c2a0, body: 0x1f6b5c, legColor: 0x2a2a2e,
        shoe: 0x1a1a1a, eyes: 'dots', emI: 0, limbR: 0.85, armL: 0.9, legL: 0.92 },
      accessories: [
        { shape: 'sphere', size: [66, 31, 66], anchor: 'crown', pos: [0, -10, 8], rot: [0.3, 0, 0], color: 0x7a3a24 },
        { shape: 'box', size: [86, 18, 12], anchor: 'crown', pos: [0, -30, -40], color: 0x7a3a24 },
        { shape: 'box', size: [150, 240, 10], anchor: 'chest', pos: [0, 0, -8], color: 0x33363a },
        { shape: 'box', size: [200, 22, 165], anchor: 'hip', pos: [0, 0, 0], color: 0x141414 },
      ],
      personality: { bobMul: 1.0, swayMul: 1.05, cadenceMul: 1.05, ampMul: 1.0 },
      bubbles: ['📋', '💼', '😅', '📱'] },

    // Richmond — head-to-toe black goth, pale face, long hair, eyeliner, choker.
    { id: 'tv-it-crowd/basement-recluse', label: 'Reclusive technician (all black, long hair, pale)',
      rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 124, skin: 0xede9e2, body: 0x111111, legColor: 0x0d0d0d,
        shoe: 0x0a0a0a, eyes: 'dots', emI: 0, limbR: 0.95 },
      accessories: [
        { shape: 'sphere', size: [75, 70, 75], anchor: 'crown', pos: [0, -8, 10], rot: [0.35, 0, 0], color: 0x0a0a0a },
        { shape: 'box', size: [42, 100, 32], anchor: 'head', pos: [-58, -36, 12], color: 0x0a0a0a },
        { shape: 'box', size: [42, 100, 32], anchor: 'head', pos: [58, -36, 12], color: 0x0a0a0a },
        // approx: makeup layer unsupported — thin dark eyeliner boxes framing the eyes.
        { shape: 'box', size: [36, 8, 4], anchor: 'face', pos: [-34, -2, -6], color: 0x0a0a0a, outlineSkip: true },
        { shape: 'box', size: [36, 8, 4], anchor: 'face', pos: [34, -2, -6], color: 0x0a0a0a, outlineSkip: true },
        { shape: 'cylinder', size: [42, 42, 14], anchor: 'neck', pos: [0, 0, 0], color: 0x0a0a0a },
        { shape: 'sphere', size: 10, anchor: 'neck', pos: [0, 0, -42], color: 0x9a9a9a },
      ],
      personality: { bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.7, ampMul: 0.55 },
      bubbles: ['🦇', '🖤', '🕯️', '😱'] },

    // Denholm — black blazer, slicked hair, incongruous brown mustache, red tie.
    { id: 'tv-it-crowd/founder-boss', label: 'CEO (black blazer, moustache)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 126, skin: 0xd9a878, body: 0x161616, legColor: 0x141414,
        shoe: 0x0d0d0d, eyes: 'dots', emI: 0, limbR: 1.0 },
      accessories: [
        { shape: 'sphere', size: [63, 16, 63], anchor: 'crown', pos: [0, -6, 4], rot: [0.2, 0, 0],
          color: 0x100c08, emissive: 0x100c08, emissiveIntensity: 0.05 },
        { shape: 'box', size: [50, 14, 6], anchor: 'face', pos: [0, -26, -6], color: 0x4a2f1c },
        { shape: 'box', size: [70, 22, 6], anchor: 'neck', pos: [0, 4, -16], color: 0xf0ede4 },
        { shape: 'box', size: [36, 150, 8], anchor: 'chest', pos: [0, -6, -10], color: 0xb01c24 },
      ],
      personality: { bobMul: 1.1, swayMul: 1.15, cadenceMul: 1.0, ampMul: 1.1 },
      bubbles: ['💼', '📢', '💰', '😤'] },

    // Douglas — tall pompadour, flamboyant purple suit, open collar + gold chain.
    { id: 'tv-it-crowd/heir-playboy', label: 'CEO (flamboyant suit, pompadour)',
      rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 126, skin: 0xcf9a68, body: 0x5a2350, legColor: 0x5a2350,
        shoe: 0x0d0d0d, eyes: 'dots', emI: 0, limbR: 1.05 },
      accessories: [
        { shape: 'box', size: [110, 90, 100], anchor: 'crown', pos: [0, 10, -20], rot: [0.4, 0, 0],
          color: 0x1c130c, emissive: 0x1c130c, emissiveIntensity: 0.06 },
        { shape: 'box', size: [60, 36, 8], anchor: 'neck', pos: [-22, -6, -16], rot: [0, 0, 0.5], color: 0xede9e0 },
        { shape: 'box', size: [60, 36, 8], anchor: 'neck', pos: [22, -6, -16], rot: [0, 0, -0.5], color: 0xede9e0 },
        { shape: 'cylinder', size: [26, 26, 6], anchor: 'chest', pos: [0, 26, -10], rot: [1.57, 0, 0],
          color: 0xd4af37, metalness: 0.6, roughness: 0.3 },
        { shape: 'box', size: [80, 54, 20], anchor: 'hip', pos: [0, 6, -30], color: 0xd4af37,
          metalness: 0.6, roughness: 0.3 },
      ],
      personality: { bobMul: 1.15, swayMul: 1.3, cadenceMul: 1.05, ampMul: 1.2 },
      bubbles: ['😏', '💋', '🍾', '👑'] },
  ],
};

export default pack;

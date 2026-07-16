// Pop Culture ▸ TV ▸ Seinfeld — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric homage: color + silhouette only, no
// likenesses/logos. 90s NYC normcore + one loud signifier per character.
// Named-cast pack → FIXED costume colors, not tint carriers. Collars ride the
// `neck` anchor. Source doc: docs/avatars/pop-culture/tv-seinfeld.md
import type { AvatarPackDef, AvatarPrimitive } from '../avatars.js';

// Shared rectangular-glasses recipe (bolt-on frame over generic 'dots' eyes).
const glasses = (frame: number): AvatarPrimitive[] => [
  { shape: 'box', size: [54, 34, 8], anchor: 'face', pos: [ 58, -4, -4], color: frame, outlineSkip: true },
  { shape: 'box', size: [54, 34, 8], anchor: 'face', pos: [-58, -4, -4], color: frame, outlineSkip: true },
  { shape: 'box', size: [16, 8, 6],  anchor: 'face', pos: [0, -4, -6], color: frame, outlineSkip: true },
];

const pack: AvatarPackDef = {
  id: 'tv-seinfeld', version: 1, label: 'Seinfeld',
  path: ['Pop Culture', 'TV Shows', 'Seinfeld'], builtin: true, franchise: true,
  avatars: [
    // Jerry — the deliberately "normal" one; solid bright shirt, white sneakers.
    { id: 'tv-seinfeld/comedian-jerry', label: 'The comedian (button shirt, white sneakers)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 126, skin: 0xe0b090, body: 0x3a7ab8, legColor: 0x22283a,
        shoe: 0xf5f5f0, eyes: 'dots', emI: 0, limbR: 0.95, hands: 'sphere' },
      accessories: [
        { shape: 'sphere', size: [64, 17, 64], anchor: 'crown', pos: [0, -6, 4], rot: [0.25, 0, 0], color: 0x2e1c12 },
      ],
      personality: { bobMul: 1.0, swayMul: 0.85, cadenceMul: 1.0, ampMul: 0.9 },
      bubbles: ['🥨', '🚗', '🃏', '🧴'] },

    // George — bald dome (empty crown), heavy dark glasses, short & stocky.
    { id: 'tv-seinfeld/friend-george', label: 'The friend (bald dome, glasses, stocky)',
      rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 132, skin: 0xe0b090, body: 0x6a7a5a, legColor: 0x3a4552,
        shoe: 0xece8dc, eyes: 'dots', emI: 0, limbR: 1.15, armL: 0.95, legL: 0.92 },
      accessories: [
        ...glasses(0x1a1410),
        { shape: 'box', size: [40, 26, 70], anchor: 'head', pos: [-62, 4, 20], color: 0x2e2016 },
        { shape: 'box', size: [40, 26, 70], anchor: 'head', pos: [62, 4, 20], color: 0x2e2016 },
      ],
      personality: { bobMul: 0.9, swayMul: 1.1, cadenceMul: 1.05, ampMul: 0.85 },
      bubbles: ['😤', '🥪', '🛋️', '🎭'] },

    // Kramer — the tallest, wildest hair spikes breaking the head silhouette.
    { id: 'tv-seinfeld/neighbor-kramer', label: 'The neighbor (tall wild hair, vintage shirt)',
      rig: 'humanoid',
      humanoid: { sk: 1.18, headR: 120, skin: 0xe0b090, body: 0xb8492a, legColor: 0x4a4640,
        shoe: 0x6a4a30, eyes: 'dots', emI: 0, limbR: 0.85, armL: 1.08, legL: 1.1 },
      accessories: [
        { shape: 'cone', size: [58, 140, 58], anchor: 'crown', pos: [-4, 30, 6], rot: [0.2, 0, -0.2], color: 0x1c1712 },
        { shape: 'cone', size: [55, 120, 55], anchor: 'crown', pos: [30, 24, 0], rot: [0.15, 0, 0.35], color: 0x1c1712 },
        { shape: 'cone', size: [52, 100, 52], anchor: 'crown', pos: [-30, 20, 10], rot: [0.15, 0, -0.4], color: 0x1c1712 },
        { shape: 'box', size: [210, 60, 165], anchor: 'hip', pos: [0, 20, 0], color: 0xb8492a },
      ],
      personality: { bobMul: 1.15, swayMul: 1.3, cadenceMul: 1.35, ampMul: 1.2 },
      bubbles: ['🍿', '🚬', '🕺', '💡'] },

    // Elaine — big curly volume; floral-print blouse approximated by a corsage.
    { id: 'tv-seinfeld/ex-elaine', label: 'The ex (big curly hair, floral blouse)',
      rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 118, skin: 0xe0b090, body: 0xc9524a, legColor: 0x262230,
        shoe: 0x2e2a2a, eyes: 'almond', emI: 0, limbR: 0.85, armL: 0.95 },
      accessories: [
        { shape: 'sphere', size: [75, 50, 75], anchor: 'crown', pos: [0, -6, 8], rot: [0.35, 0, 0], color: 0x2a1a10 },
        // approx: floral print unsupported — a corsage-style accent cluster near one shoulder.
        { shape: 'sphere', size: 11, anchor: 'chest', pos: [-70, 30, -10], color: 0xe8a0b0 },
        { shape: 'sphere', size: 11, anchor: 'chest', pos: [-54, 24, -10], color: 0xdec95a },
        { shape: 'sphere', size: 11, anchor: 'chest', pos: [-62, 14, -10], color: 0xe8a0b0 },
      ],
      personality: { bobMul: 1.1, swayMul: 1.4, cadenceMul: 1.05, ampMul: 1.15 },
      bubbles: ['💅', '📞', '😂', '👠'] },

    // Newman — heavyset postal carrier, patch + slung mailbag.
    { id: 'tv-seinfeld/rival-newman', label: 'The rival (postal uniform, mailbag)',
      rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 128, skin: 0xe0b090, body: 0x5a6a7a, legColor: 0x384552,
        shoe: 0x232323, eyes: 'dots', emI: 0, limbR: 1.3, armL: 0.95, legL: 0.92 },
      accessories: [
        { shape: 'sphere', size: [55, 10, 55], anchor: 'crown', pos: [0, -4, 0], color: 0x3a2a1a },
        { shape: 'box', size: [34, 26, 6], anchor: 'chest', pos: [-40, 24, -10], color: 0xc9a227 },
        { shape: 'box', size: [230, 40, 12], anchor: 'chest', pos: [0, 30, -6], rot: [0, 0, 0.5], color: 0x4a3a2a },
        { shape: 'box', size: [110, 90, 50], anchor: 'hip', pos: [90, 30, 20], color: 0x9a8a64 },
      ],
      personality: { bobMul: 1.05, swayMul: 1.0, cadenceMul: 0.85, ampMul: 0.8 },
      bubbles: ['📬', '😈', '🍔', '🗝️'] },

    // The Soup Nazi — tall upright white toque, dark mustache, bib apron.
    { id: 'tv-seinfeld/chef-soupstand', label: 'The chef (tall toque, apron, mustache)',
      rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 124, skin: 0xc99a72, body: 0xf0f0ec, legColor: 0x2a2a2a,
        shoe: 0x1c1c1c, eyes: 'dots', emI: 0, limbR: 1.05 },
      accessories: [
        { shape: 'cylinder', size: [100, 100, 130], anchor: 'crown', pos: [0, 55, 0], color: 0xf5f5f0 },
        { shape: 'box', size: [60, 16, 14], anchor: 'face', pos: [0, -26, -6], color: 0x171310 },
        { shape: 'box', size: [220, 240, 8], anchor: 'chest', pos: [0, 0, -8], color: 0xf5f5f0 },
        { shape: 'box', size: [220, 16, 12], anchor: 'chest', pos: [0, -118, -10], color: 0x2a2a2a },
      ],
      personality: { bobMul: 0.6, swayMul: 0.4, cadenceMul: 0.85, ampMul: 0.55 },
      bubbles: ['🍲', '🚫', '😠', '📏'] },

    // Puddy — black leather jacket with the eight-ball emblem on the back.
    { id: 'tv-seinfeld/boyfriend-puddy', label: 'The boyfriend (leather jacket, eight-ball, deadpan)',
      rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 126, skin: 0xe0b090, body: 0x1a1a1a, legColor: 0x1e1e1e,
        shoe: 0x232323, eyes: 'dots', emI: 0, limbR: 1.1 },
      accessories: [
        { shape: 'sphere', size: [63, 15, 63], anchor: 'crown', pos: [0, -6, 2], rot: [0.2, 0, 0], color: 0x1c140e },
        { shape: 'sphere', size: 55, anchor: 'back', pos: [0, 10, 10], color: 0xf5f5f0 },
        { shape: 'cylinder', size: [22, 22, 8], anchor: 'back', pos: [0, 10, 62], rot: [1.57, 0, 0], color: 0x141414 },
      ],
      personality: { bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.9, ampMul: 0.75 },
      bubbles: ['🏒', '🥪', '😐', '🚗'] },

    // Uncle Leo — older, cardigan + glasses, thinning grey side hair.
    { id: 'tv-seinfeld/uncle-leo', label: 'The uncle (cardigan, glasses)',
      rig: 'humanoid',
      humanoid: { sk: 0.88, headR: 122, skin: 0xdcb090, body: 0x8a3a3a, legColor: 0x4a4a4a,
        shoe: 0x5a4a3a, eyes: 'dots', emI: 0, limbR: 1.05, armL: 0.95, legL: 0.9 },
      accessories: [
        { shape: 'box', size: [36, 18, 60], anchor: 'head', pos: [-60, 6, 16], color: 0xb0aca4 },
        { shape: 'box', size: [36, 18, 60], anchor: 'head', pos: [60, 6, 16], color: 0xb0aca4 },
        ...glasses(0x3a2e22),
        { shape: 'sphere', size: 6, anchor: 'chest', pos: [0, 20, -10], color: 0x3a2e22 },
        { shape: 'sphere', size: 6, anchor: 'chest', pos: [0, 0, -10], color: 0x3a2e22 },
        { shape: 'sphere', size: 6, anchor: 'chest', pos: [0, -20, -10], color: 0x3a2e22 },
      ],
      personality: { bobMul: 1.05, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.1 },
      bubbles: ['👋', '😄', '🤝', '📰'] },
  ],
};

export default pack;

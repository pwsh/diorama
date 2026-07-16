// Pop Culture ▸ TV Shows ▸ Breaking Bad — franchise pack (dynamic-import only,
// default loaded:false). Stylized geometric homage: color + silhouette only, no
// likenesses/logos/text. Named-cast pack → FIXED costume colors, not tint
// carriers (each character's near-monochrome show palette IS the identity).
// Source doc: docs/avatars/pop-culture/tv-breaking-bad.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'tv-breaking-bad', version: 1, label: 'Breaking Bad',
  path: ['Pop Culture', 'TV Shows', 'Breaking Bad'], builtin: true, franchise: true,
  avatars: [
    // Walter White / "Heisenberg" — bald, goatee, shades, black pork-pie hat.
    { id: 'tv-breaking-bad/walter-white-heisenberg', label: 'Balding science teacher (goatee, dark porkpie hat)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 126, skin: 0xe4c39c, body: 0x1c1c1c, legColor: 0x2b2b2b,
        shoe: 0x141414, eyes: 'shades', emI: 0, limbR: 1.0 },
      accessories: [
        { shape: 'cylinder', size: [78, 78, 40], anchor: 'crown', pos: [0, 20, 0], color: 0x141414 }, // porkpie crown
        { shape: 'cylinder', size: [98, 98, 10], anchor: 'crown', pos: [0, 2, 0], color: 0x141414 }, // brim
        { shape: 'box', size: [46, 26, 16], anchor: 'face', pos: [0, -34, -8], color: 0x2e2a26 }, // goatee
        { shape: 'box', size: [110, 26, 8], anchor: 'chest', pos: [0, 128, -6], color: 0x141414 }, // lapel/collar hint
      ],
      personality: { bobMul: 0.9, swayMul: 0.7, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['🧪', '⚗️', '💰', '😎'] },

    // Jesse Pinkman — knit beanie, mustard hoodie, baggy jeans.
    { id: 'tv-breaking-bad/jesse-pinkman-hoodie', label: 'Young partner (beanie, mustard hoodie, baggy jeans)',
      rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 122, skin: 0xdab08c, body: 0xf2c230, legColor: 0x5a6b84,
        shoe: 0xd8d8d0, eyes: 'dots', emI: 0, limbR: 0.9, footMul: [1.15, 1.0, 1.15] },
      accessories: [
        { shape: 'box', size: [128, 48, 128], anchor: 'crown', pos: [0, -4, 0], color: 0x2a2a2a }, // beanie dome
        { shape: 'box', size: [132, 18, 132], anchor: 'crown', pos: [0, -30, 0], color: 0xb01c24 }, // red fold band
        { shape: 'box', size: [120, 70, 10], anchor: 'chest', pos: [0, -60, -8], color: 0xc99a1e }, // kangaroo pocket
        { shape: 'cylinder', size: [4, 4, 70], anchor: 'neck', pos: [-20, -30, -14], color: 0xc99a1e }, // drawstring L
        { shape: 'cylinder', size: [4, 4, 70], anchor: 'neck', pos: [20, -30, -14], color: 0xc99a1e }, // drawstring R
      ],
      personality: { bobMul: 1.05, swayMul: 1.1, cadenceMul: 1.1, ampMul: 1.1 },
      bubbles: ['🧪', '😬', '💨', '🎮'] },

    // Skyler White — cool blue blouse, golden-brown loose hair, silver necklace.
    { id: 'tv-breaking-bad/skyler-white-blazer', label: 'Wife and bookkeeper (blue blouse, golden-brown hair)',
      rig: 'humanoid',
      humanoid: { sk: 0.88, headR: 118, skin: 0xe8c4a0, body: 0x3f6d95, legColor: 0x8a8a90,
        shoe: 0x3a2a1a, eyes: 'dots', emI: 0, limbR: 0.85 },
      accessories: [
        { shape: 'sphere', size: [138, 76, 138], anchor: 'crown', pos: [0, -12, 8], rot: [0.35, 0, 0], color: 0x6b4a2c }, // hair
        { shape: 'box', size: [40, 80, 30], anchor: 'head', pos: [-58, -40, 6], color: 0x6b4a2c }, // side lobe L
        { shape: 'box', size: [40, 80, 30], anchor: 'head', pos: [58, -40, 6], color: 0x6b4a2c }, // side lobe R
        { shape: 'cylinder', size: [30, 30, 4], anchor: 'chest', pos: [0, 120, -8], color: 0xc0c0c0 }, // silver necklace hint
      ],
      personality: { bobMul: 0.95, swayMul: 0.8, cadenceMul: 0.95, ampMul: 0.85 },
      bubbles: ['📊', '😟', '🚬', '🛁'] },

    // Hank Schrader — stocky, mustache, burnt-orange shirt, DEA holster belt.
    { id: 'tv-breaking-bad/hank-schrader-dea', label: 'DEA agent (stocky, mustache, orange shirt, holster)',
      rig: 'humanoid',
      humanoid: { sk: 1.08, headR: 128, skin: 0xd9a066, body: 0xb5651d, legColor: 0x6b6f74,
        shoe: 0x1c1c1c, eyes: 'dots', emI: 0, limbR: 1.15 },
      accessories: [
        { shape: 'box', size: [128, 32, 128], anchor: 'crown', pos: [0, -6, 0], color: 0x3a2a1c }, // cropped hair
        { shape: 'box', size: [80, 26, 14], anchor: 'face', pos: [0, -10, -8], color: 0x3a2a1c }, // mustache
        { shape: 'box', size: [70, 90, 30], anchor: 'hip', pos: [96, -6, -60], color: 0x1c1c1c }, // holster
        { shape: 'box', size: [30, 20, 6], anchor: 'hip', pos: [-40, 6, -70], color: 0xd4af37 }, // badge glint
      ],
      personality: { bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.1 },
      bubbles: ['🪨', '😂', '🍺', '🎣'] },

    // Saul Goodman — loud mustard suit, purple shirt collar, gold jewelry.
    { id: 'tv-breaking-bad/saul-goodman-suit', label: 'Strip-mall lawyer (loud suit, purple shirt, gold jewelry)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0xe8c4a0, body: 0xc9962c, legColor: 0xc9962c,
        shoe: 0x5a3a1e, eyes: 'dots', emI: 0, limbR: 0.95 },
      accessories: [
        { shape: 'box', size: [120, 26, 120], anchor: 'crown', pos: [0, -8, 2], color: 0x4a3a2a }, // slicked hair
        { shape: 'box', size: [92, 46, 8], anchor: 'chest', pos: [0, 118, -6], color: 0x7a4a9c }, // purple collar wedge
        { shape: 'box', size: [90, 22, 6], anchor: 'chest', pos: [0, 70, -12], rot: [0, 0, 0.5], color: 0xd9531e }, // loud tie
        { shape: 'sphere', size: 14, anchor: 'handR', pos: [0, -6, 0], color: 0xd4af37 }, // ring
        { shape: 'cylinder', size: [20, 20, 18], anchor: 'handR', pos: [0, 30, 0], color: 0xd4af37 }, // gold cuff
      ],
      personality: { bobMul: 1.05, swayMul: 1.15, cadenceMul: 1.05, ampMul: 1.1 },
      bubbles: ['💰', '📞', '⚖️', '😬'] },

    // Gus Fring — yellow dress shirt, black tie, khakis, half-rim readers.
    { id: 'tv-breaking-bad/gus-fring-manager', label: 'Fried-chicken franchise manager (yellow shirt, half-rim glasses)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 124, skin: 0x8a5a3c, body: 0xd9c94a, legColor: 0xb8a074,
        shoe: 0x5a3a1e, eyes: 'dots', emI: 0, limbR: 1.0 },
      accessories: [
        { shape: 'box', size: [122, 24, 122], anchor: 'crown', pos: [0, -8, 0], color: 0x8a8a8a }, // greying hair
        { shape: 'box', size: [52, 10, 6], anchor: 'face', pos: [-38, -8, -6], color: 0x1c1c1c }, // half-rim bar L
        { shape: 'box', size: [52, 10, 6], anchor: 'face', pos: [38, -8, -6], color: 0x1c1c1c }, // half-rim bar R
        { shape: 'box', size: [16, 6, 4], anchor: 'face', pos: [0, -8, -6], color: 0x1c1c1c }, // bridge
        { shape: 'box', size: [26, 160, 8], anchor: 'chest', pos: [0, 40, -8], color: 0x1c1c1c }, // black tie
      ],
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 0.9, ampMul: 0.6 },
      posture: { pitch: -0.03 },
      bubbles: ['🍗', '📋', '😐', '💵'] },

    // Marie Schrader — head-to-toe purple, big wavy hair, handbag.
    { id: 'tv-breaking-bad/marie-schrader-purple', label: "Hank's wife (purple everything, big wavy hair)",
      rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 116, skin: 0xe8c4a0, body: 0x7a3f9c, legColor: 0x8a5ab0,
        shoe: 0x5a2f7a, eyes: 'dots', emI: 0, limbR: 0.85 },
      accessories: [
        { shape: 'box', size: [150, 70, 150], anchor: 'crown', pos: [0, -6, 4], color: 0x5a3a26 }, // big wavy hair
        { shape: 'sphere', size: 38, anchor: 'head', pos: [-50, 20, 30], color: 0x5a3a26 }, // curl volume L
        { shape: 'sphere', size: 38, anchor: 'head', pos: [50, 20, 30], color: 0x5a3a26 }, // curl volume R
        { shape: 'box', size: [200, 20, 150], anchor: 'hip', pos: [0, 6, 0], color: 0x4a1f6c }, // purple belt
        { shape: 'box', size: [50, 60, 24], anchor: 'handL', pos: [0, -20, 0], color: 0xc9a06a }, // handbag
      ],
      personality: { bobMul: 1.1, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.05 },
      bubbles: ['💜', '🏠', '😤', '👜'] },

    // Walter White Jr. / "Flynn" — varsity jacket, forearm crutches (approx).
    { id: 'tv-breaking-bad/walt-jr-flynn', label: 'Teen son on crutches (varsity jacket, cheerful)',
      rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 118, skin: 0xe4bf98, body: 0x36536b, legColor: 0x3a4a63,
        shoe: 0xd8d8d0, eyes: 'dots', emI: 0, limbR: 0.95 },
      accessories: [
        { shape: 'box', size: [120, 28, 120], anchor: 'crown', pos: [0, -8, 0], color: 0x3a2416 }, // hair
        { shape: 'box', size: [200, 26, 8], anchor: 'chest', pos: [0, 90, -8], color: 0xe8e4da }, // varsity stripe
        { shape: 'cylinder', size: [10, 10, 420], anchor: 'handL', pos: [0, -190, 0], color: 0xb0b0b0 }, // crutch shaft L
        { shape: 'cylinder', size: [30, 30, 8], anchor: 'handL', pos: [0, 60, 0], color: 0xb0b0b0 }, // forearm cuff L
        { shape: 'cylinder', size: [10, 10, 420], anchor: 'handR', pos: [0, -190, 0], color: 0xb0b0b0 }, // crutch shaft R
        { shape: 'cylinder', size: [30, 30, 8], anchor: 'handR', pos: [0, 60, 0], color: 0xb0b0b0 }, // forearm cuff R
      ],
      // approx: crutches are static hand-held props on the standard two-leg walk
      // cycle — no three-point crutch-gait variant exists in the rig.
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.95, ampMul: 0.9 },
      bubbles: ['🍳', '🥓', '😊', '🎮'] },
  ],
};

export default pack;

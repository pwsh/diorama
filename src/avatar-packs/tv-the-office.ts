// Pop Culture ▸ TV Shows ▸ The Office (US) — franchise pack (dynamic-import
// only, default loaded:false). Stylized geometric homage: color + silhouette
// only, no likenesses/logos/text. Named-cast pack → FIXED costume colors, not
// tint carriers; necktie width/angle/color is the load-bearing differentiator.
// Source doc: docs/avatars/pop-culture/tv-the-office.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'tv-the-office', version: 1, label: 'The Office',
  path: ['Pop Culture', 'TV Shows', 'The Office'], builtin: true, franchise: true,
  avatars: [
    // Michael Scott — navy suit, wide two-tone power tie, desk mug.
    { id: 'tv-the-office/regional-manager-michael', label: 'Regional Manager (navy suit, wide power tie)',
      rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 128, skin: 0xe6bb98, body: 0x28324a, legColor: 0x222a3c,
        shoe: 0x241d18, eyes: 'dots', emI: 0, limbR: 1.0, hands: 'sphere' },
      accessories: [
        { shape: 'box', size: [128, 30, 128], anchor: 'crown', pos: [0, -8, 0], color: 0x3a2c1e }, // side-part hair
        { shape: 'box', size: [70, 22, 6], anchor: 'chest', pos: [0, 122, -6], color: 0xf5f2ea }, // shirt collar
        { shape: 'box', size: [34, 160, 8], anchor: 'chest', pos: [0, 40, -8], color: 0xd8b830 }, // wide power tie
        { shape: 'cylinder', size: [44, 44, 48], anchor: 'handR', pos: [0, -20, 0], rot: [1.5708, 0, 0], color: 0xf2efe6 }, // desk mug
      ],
      personality: { bobMul: 1.1, swayMul: 1.2, cadenceMul: 1.05, ampMul: 1.15 },
      bubbles: ['😄', '🎤', '👍', '😬'] },

    // Jim Halpert — blue quarter-zip, loosened (angled) tie, jello-stapler prank.
    { id: 'tv-the-office/salesman-jim', label: 'Salesman (blue quarter-zip, loosened tie)',
      rig: 'humanoid',
      humanoid: { sk: 1.06, headR: 124, headShape: 'oval', skin: 0xe8c2a2, body: 0x3a5a78,
        legColor: 0x9a8a64, shoe: 0x4a3624, eyes: 'dots', emI: 0, limbR: 0.9, armL: 1.02 },
      accessories: [
        { shape: 'box', size: [124, 26, 124], anchor: 'crown', pos: [0, -8, 0], color: 0x342414 }, // neat hair
        { shape: 'box', size: [60, 18, 6], anchor: 'chest', pos: [0, 122, -6], color: 0xf2ede0 }, // collar
        { shape: 'box', size: [16, 130, 6], anchor: 'chest', pos: [8, 40, -8], rot: [0, 0, 0.18], color: 0x4a5866 }, // loosened tie (angled)
        { shape: 'box', size: [60, 50, 60], anchor: 'handR', pos: [0, -22, 0], color: 0xd8c878 }, // jello block (approx: opaque)
        { shape: 'box', size: [30, 10, 14], anchor: 'handR', pos: [0, -22, 0], color: 0x2a2a2a }, // embedded stapler
      ],
      personality: { bobMul: 0.95, swayMul: 0.9, cadenceMul: 0.95, ampMul: 0.9 },
      bubbles: ['😏', '📎', '👀', '😂'] },

    // Pam Beesly — soft pink cardigan, half-up wavy hair, sketchbook.
    { id: 'tv-the-office/receptionist-pam', label: 'Receptionist (pink cardigan, half-up wavy hair)',
      rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 112, skin: 0xecc4a4, body: 0xdca8b8, legColor: 0x5a4a3a,
        shoe: 0x8a6a4a, eyes: 'almond', emI: 0, limbR: 0.78, armL: 0.9 },
      accessories: [
        { shape: 'sphere', size: [120, 72, 120], anchor: 'crown', pos: [0, -6, 4], color: 0x5a3a26 }, // wavy hair
        { shape: 'box', size: [34, 46, 20], anchor: 'head', pos: [-62, -10, 6], color: 0x5a3a26 }, // half-up strand L
        { shape: 'box', size: [34, 46, 20], anchor: 'head', pos: [62, -10, 6], color: 0x5a3a26 }, // half-up strand R
        { shape: 'box', size: [50, 70, 10], anchor: 'handL', pos: [0, -24, 0], color: 0xf0ead8 }, // sketchbook
        { shape: 'cylinder', size: [6, 6, 60], anchor: 'handL', pos: [0, -24, -8], rot: [0, 0, 1.5708], color: 0xd8a840 }, // pencil
      ],
      personality: { bobMul: 0.95, swayMul: 1.0, cadenceMul: 1.0, ampMul: 0.95 },
      bubbles: ['🎨', '☕', '😊', '💌'] },

    // Dwight Schrute — mustard shirt, severe straight dark tie, round glasses, beet.
    { id: 'tv-the-office/assistant-regional-manager-dwight', label: 'Assistant (to the) Regional Manager (mustard shirt, round glasses)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 122, skin: 0xd8a878, body: 0xc8a030, legColor: 0x3a2e20,
        shoe: 0x241a10, eyes: 'dots', emI: 0, limbR: 0.95 },
      accessories: [
        { shape: 'box', size: [122, 24, 122], anchor: 'crown', pos: [0, -8, 0], color: 0x2a1c10 }, // severe hair
        { shape: 'cylinder', size: [26, 26, 8], anchor: 'face', pos: [-38, -2, -6], rot: [1.5708, 0, 0], color: 0x3a3a3a }, // round lens L
        { shape: 'cylinder', size: [26, 26, 8], anchor: 'face', pos: [38, -2, -6], rot: [1.5708, 0, 0], color: 0x3a3a3a }, // round lens R
        { shape: 'box', size: [16, 8, 6], anchor: 'face', pos: [0, -2, -6], color: 0x3a3a3a }, // bridge
        { shape: 'box', size: [16, 130, 6], anchor: 'chest', pos: [0, 40, -8], color: 0x232323 }, // severe straight tie
        { shape: 'sphere', size: [50, 60, 50], anchor: 'handR', pos: [0, -24, 0], color: 0x6a1a2e }, // beet
        { shape: 'box', size: [10, 20, 10], anchor: 'handR', pos: [0, 8, 0], color: 0x3a6a2a }, // beet stem
      ],
      personality: { bobMul: 1.15, swayMul: 0.85, cadenceMul: 1.25, ampMul: 1.1 },
      bubbles: ['🥊', '🚨', '🧮', '😤'] },

    // Andy Bernard — Cornell-red sweater vest, striped tie + clip, songbook.
    { id: 'tv-the-office/sales-rep-andy', label: 'Sales Rep (Cornell-red sweater vest, preppy)',
      rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 120, skin: 0xe8bfa0, body: 0xb03a3a, legColor: 0xd8c8a0,
        shoe: 0x8a6a3a, eyes: 'dots', emI: 0, limbR: 0.9, armL: 0.92 },
      accessories: [
        { shape: 'box', size: [120, 34, 120], anchor: 'crown', pos: [0, -6, 2], color: 0x6a4a2a }, // wavy hair
        { shape: 'box', size: [26, 20, 6], anchor: 'chest', pos: [-16, 118, -6], rot: [0, 0, 0.4], color: 0xe8e4d8 }, // collar wedge L
        { shape: 'box', size: [26, 20, 6], anchor: 'chest', pos: [16, 118, -6], rot: [0, 0, -0.4], color: 0xe8e4d8 }, // collar wedge R
        { shape: 'box', size: [16, 90, 6], anchor: 'chest', pos: [0, 60, -8], color: 0x2a3a5a }, // striped tie
        // Tie clip: the blade spans y 15..105 (box 90 tall centred at 60), so a clip
        // at y=24 sat at the very BOTTOM of the blade (reading as an inverted tie).
        // A clip belongs on the upper-middle of the blade, just below the knot.
        { shape: 'box', size: [20, 6, 4], anchor: 'chest', pos: [0, 88, -10], color: 0xc8c8c8 }, // tie clip
        { shape: 'box', size: [36, 40, 6], anchor: 'handR', pos: [0, -22, 0], color: 0xf0ead8 }, // a-cappella songbook
      ],
      personality: { bobMul: 1.05, swayMul: 1.1, cadenceMul: 1.05, ampMul: 1.05 },
      bubbles: ['🎵', '⛵', '😅', '💥'] },

    // Angela Martin — cat cardigan, tight blonde bun + headband, cat prop.
    { id: 'tv-the-office/senior-accountant-angela', label: 'Senior Accountant (cat sweater, tight bun)',
      rig: 'humanoid',
      humanoid: { sk: 0.84, headR: 106, skin: 0xead0b8, body: 0x5a2a38, legColor: 0x242424,
        shoe: 0x1c1c1c, eyes: 'almond', emI: 0, limbR: 0.7, armL: 0.85 },
      accessories: [
        { shape: 'box', size: [106, 20, 106], anchor: 'crown', pos: [0, -8, 0], color: 0xd8c078 }, // pulled-back hair
        { shape: 'sphere', size: 34, anchor: 'crown', pos: [0, -20, 40], color: 0xd8c078 }, // bun
        { shape: 'box', size: [110, 6, 8], anchor: 'crown', pos: [0, 6, 0], color: 0x1c1c1c }, // headband
        { shape: 'box', size: [40, 24, 4], anchor: 'chest', pos: [0, 60, -8], color: 0xe8dcc0 }, // cat-silhouette accent
        { shape: 'sphere', size: 40, anchor: 'handL', pos: [0, -22, 0], color: 0xe8dcc0 }, // cat prop
      ],
      personality: { bobMul: 0.8, swayMul: 0.75, cadenceMul: 0.95, ampMul: 0.7 },
      bubbles: ['🐱', '📏', '😒', '🙏'] },

    // Kevin Malone — heavyset, widest loud novelty tie, chili bowl.
    { id: 'tv-the-office/accountant-kevin', label: 'Accountant (oversized novelty tie, easygoing)',
      rig: 'humanoid',
      humanoid: { sk: 1.16, headR: 132, headShape: 'oval', skin: 0xd8a880, body: 0xd8d0c0,
        legColor: 0x4a4038, shoe: 0x342820, eyes: 'dots', emI: 0, limbR: 1.18, armL: 0.92 },
      accessories: [
        { shape: 'box', size: [100, 22, 100], anchor: 'crown', pos: [0, -6, 12], color: 0x2c2018 }, // receding hair (set back)
        { shape: 'box', size: [40, 170, 8], anchor: 'chest', pos: [0, 40, -8], color: 0x2a7a72 }, // widest novelty tie
        { shape: 'cylinder', size: [60, 60, 20], anchor: 'handR', pos: [0, -24, 0], color: 0xf0ead8 }, // chili bowl
        { shape: 'cylinder', size: [50, 50, 6], anchor: 'handR', pos: [0, -12, 0], color: 0x8a3020 }, // chili fill
      ],
      personality: { bobMul: 1.2, swayMul: 0.9, cadenceMul: 0.85, ampMul: 0.85 },
      bubbles: ['🥣', '🥁', '🎰', '😊'] },

    // Creed Bratton — oldest, wild frizzy grey hair, small tinted glasses, pick.
    { id: 'tv-the-office/quality-assurance-creed', label: 'Quality Assurance (graying frizzy hair, tinted glasses)',
      rig: 'humanoid',
      humanoid: { sk: 0.93, headR: 116, headShape: 'oval', skin: 0xc89870, body: 0x6a6255,
        legColor: 0x443c30, shoe: 0x2e2820, eyes: 'dots', emI: 0, limbR: 0.85 },
      posture: { pitch: 0.15 },
      accessories: [
        { shape: 'sphere', size: [118, 60, 118], anchor: 'crown', pos: [0, -6, 2], color: 0x9a968a }, // frizzy hair
        { shape: 'sphere', size: 44, anchor: 'crown', pos: [-40, 8, 20], color: 0x9a968a }, // frizz bump L
        { shape: 'sphere', size: 44, anchor: 'crown', pos: [40, 8, 20], color: 0x9a968a }, // frizz bump R
        { shape: 'box', size: [36, 26, 6], anchor: 'face', pos: [-38, -2, -6], color: 0x5a4326 }, // tinted lens L
        { shape: 'box', size: [36, 26, 6], anchor: 'face', pos: [38, -2, -6], color: 0x5a4326 }, // tinted lens R
        { shape: 'box', size: [10, 6, 5], anchor: 'face', pos: [0, -2, -6], color: 0x5a4326 }, // bridge
        { shape: 'box', size: [30, 32, 5], anchor: 'handR', pos: [0, -22, 0], color: 0x8a5a2a }, // guitar pick
      ],
      personality: { bobMul: 0.85, swayMul: 1.15, cadenceMul: 0.75, ampMul: 0.8 },
      bubbles: ['🎸', '🕶️', '🤔', '💤'] },
  ],
};

export default pack;

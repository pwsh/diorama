// Base ▸ Careers — builtin base-group pack (dynamic-import only). Members keep
// their EXACT bare legacy ids. The 10 formerly-imperative kinds (professional …
// wise_oracle) build via declarative `accessories` prims; the pre-existing
// base-careers occupations were always declarative.
import type { AvatarPackDef } from '../avatars.js';

const CHARCOAL = 0x2c2e34, NEARBLACK = 0x161619, PALE = 0xe7c6a4;
const GOLD = 0xcaa53a, ROBE = 0x7b718f;

const pack: AvatarPackDef = {
  id: 'base-careers', version: 4, label: 'Careers', path: ['Base', 'Careers'], builtin: true,
  avatars: [
    // ── Declarative accessory blocks. Each transcribes the former per-kind
    // mesh block into `accessories` prims from
    // docs/research/legacy-accessory-migration.md Part 1 (resolved to numbers at
    // the member's sk/HEAD_R). Fixed-hex parts set emissive/emissiveIntensity to
    // reproduce `_mat`'s output; rig-material parts use the color TOKENS. See
    // test-pages/legacy-migration-test.html for the parity harness.
    { id: 'professional', label: 'Professional', rig: 'humanoid',
      humanoid: { body: CHARCOAL, shoe: 0x141416, emI: 0.20 },
      // White V-neck (3-segment flat wedge cone, apex down + face-front) + tint tie.
      accessories: [
        { shape: 'cone', size: [81.6, 360], segments: 3, anchor: 'chest', pos: [0, 12, -8], rot: [Math.PI, Math.PI / 3, 0], color: 0xf2f2f0, emissive: 0x000000, emissiveIntensity: 1 },
        { shape: 'box', size: [24, 264, 14], anchor: 'chest', pos: [0, -12, -132.8 + 70], color: 'tint' }, // tie, proud of the cone
      ],
      bubbles: ['📊', '☕'] },
    { id: 'hacker', label: 'Hacker', rig: 'humanoid',
      // legColor = dark trousers matching the near-black hoodie (was pale skin — no
      // pants); shoe 0x141416 stays distinct.
      humanoid: { skin: PALE, body: NEARBLACK, shoe: 0x141416, emI: 0.15, earSkip: true, legColor: CHARCOAL },
      // Hoodie cowl: dark partial shell tilted back so the front rim clears the brow.
      accessories: [
        { shape: 'sphere', size: 153.72, sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.6], anchor: 'head', pos: [0, 10.08, 42.84], rot: [0.5, 0, 0], color: 0x18181c, emissive: 0x000000, emissiveIntensity: 1 },
      ],
      bubbles: ['💻', '🔓'] },
    { id: 'tech_expert', label: 'Tech expert', rig: 'humanoid',
      humanoid: { body: NEARBLACK, shoe: 0x33363c, emI: 0.20, earSkip: true },
      // Rectangular glasses (2 lenses + bridge) + half-ring headset band + mic +
      // tint utility belt.
      accessories: [
        { shape: 'box', size: [50.4, 37.8, 20], anchor: 'face', pos: [-47.88, 15.12, 10.08], color: 0x17181c, emissive: 0x000000, emissiveIntensity: 1 }, // lens L
        { shape: 'box', size: [50.4, 37.8, 20], anchor: 'face', pos: [47.88, 15.12, 10.08], color: 0x17181c, emissive: 0x000000, emissiveIntensity: 1 }, // lens R
        { shape: 'box', size: [25.2, 16, 16], anchor: 'face', pos: [0, 15.12, 7.56], color: 0x17181c, emissive: 0x000000, emissiveIntensity: 1 }, // bridge
        { shape: 'torus', size: [128.52, 16, Math.PI], anchor: 'head', color: 0x2c2e34, emissive: 0x000000, emissiveIntensity: 1 }, // headset band (half ring)
        { shape: 'cylinder', size: [10, 10, 88.2], anchor: 'head', pos: [78.12, -44.1, -63], rot: [0, 0, 1.15], color: 0x2c2e34, emissive: 0x000000, emissiveIntensity: 1 }, // mic stub
        { shape: 'sphere', size: 22, anchor: 'head', pos: [40.32, -63, -63], color: 'tint' }, // mic tip
        { shape: 'box', size: [252, 60, 147], anchor: 'hip', pos: [0, 48, 0], color: 'tint' }, // utility belt
      ],
      bubbles: ['💡', '🔌'] },
    { id: 'farmer', label: 'Farmer', rig: 'humanoid',
      // Decal: a plaid CHECK print on the chest reads as the flannel shirt without
      // texturing the toon body (crisp canvas decal plane, house style).
      humanoid: { shoe: 0x5a3d28, emI: 0.22, decals: [{ kind: 'print', print: 'check', color: 0x8a3b2e, anchor: 'chest' }] },
      // Straw hat (brim + crown) + denim overall bib + shoulder straps. Straw/denim
      // emissive default = color (eI 0.15), so only the color token is authored.
      accessories: [
        { shape: 'cylinder', size: [163.8, 163.8, 20], anchor: 'head', pos: [0, 69.3, 0], color: 0xd9b36a }, // straw brim
        { shape: 'cylinder', size: [88.2, 88.2, 69.3], anchor: 'head', pos: [0, 104.58, 0], color: 0xd9b36a }, // straw crown
        { shape: 'box', size: [134.4, 300, 20], anchor: 'chest', pos: [0, -30, -10], color: 0x3f5f8a }, // denim bib
        { shape: 'box', size: [48, 300, 16], anchor: 'chest', pos: [-62.4, 168, -8], color: 0x3f5f8a }, // strap L
        { shape: 'box', size: [48, 300, 16], anchor: 'chest', pos: [62.4, 168, -8], color: 0x3f5f8a }, // strap R
      ],
      bubbles: ['🌽', '🚜'] },
    { id: 'cowboy', label: 'Cowboy', rig: 'humanoid',
      humanoid: { shoe: 0x5a3d28, emI: 0.22 },
      // Coiled lasso at the hip (mirrors the Catwoman-whip idiom — a flat cylinder
      // reads as a coil without needing a curved primitive) + wide-brim hat + tint
      // bandana + brown vest front panels (hat/vest emissive default = color, eI 0.12).
      accessories: [
        { shape: 'cylinder', size: [55, 55, 14], anchor: 'hip', pos: [80, -10, 0], rot: [1.5708, 0, 0], color: 0x9c7a45 }, // coiled lasso
        { shape: 'cylinder', size: [178.92, 178.92, 24], anchor: 'head', pos: [0, 69.3, 0], color: 0x7a5230, emissiveIntensity: 0.12 }, // hat brim
        { shape: 'cylinder', size: [90.72, 90.72, 90.72], anchor: 'head', pos: [0, 114.66, 0], color: 0x7a5230, emissiveIntensity: 0.12 }, // hat crown
        { shape: 'box', size: [187.2, 55, 126], anchor: 'hip', pos: [0, 620, 0], color: 'tint' }, // bandana
        { shape: 'box', size: [76.8, 432, 18], anchor: 'chest', pos: [-79.2, 30, -8], color: 0x6b4226, emissiveIntensity: 0.12 }, // vest L
        { shape: 'box', size: [76.8, 432, 18], anchor: 'chest', pos: [79.2, 30, -8], color: 0x6b4226, emissiveIntensity: 0.12 }, // vest R
      ],
      bubbles: ['🤠', '🐴'] },
    { id: 'athlete', label: 'Athlete', rig: 'humanoid',
      // Decals: a jersey number '7' on the BACK + a team emblem star on the CHEST
      // (crisp canvas decal planes — text + glyph — riding proud of the jersey).
      humanoid: { shoe: 0xf2f2f2, decals: [
        { kind: 'text', text: '7', color: 0xf4f4f6, anchor: 'back' },
        { kind: 'glyph', glyph: '★', color: 0xf4f4f6, anchor: 'chest', scale: 0.6 },
      ] },
      // White forehead headband (full torus ring) + dark shorts (emissive default = color).
      accessories: [
        { shape: 'torus', size: [117.18, 16.38], anchor: 'head', pos: [0, 56.7, 0], rot: [Math.PI / 2, 0, 0], color: 0xf2f2f2, emissive: 0x000000, emissiveIntensity: 1 }, // headband
        { shape: 'box', size: [249.6, 204, 145.6], anchor: 'hip', pos: [0, 108, 0], color: 0x243043 }, // shorts
      ],
      bubbles: ['🏆', '💪'] },
    { id: 'movie_star', label: 'Movie star', rig: 'humanoid',
      // Decal: a film-clapper glyph on the chest (canon: the star's craft).
      humanoid: { body: GOLD, shoe: 0x0a0a0c, emI: 0.20, eyes: 'shades',
        decals: [{ kind: 'glyph', glyph: '🎬', anchor: 'chest', scale: 0.7 }] },
      // Golden accent stripe down the chest (shades handled in the face pass).
      accessories: [
        { shape: 'box', size: [38.4, 468, 20], anchor: 'chest', pos: [0, 0, -6], color: 0xffdd66, emissive: 0xcaa53a, emissiveIntensity: 0.4 },
      ],
      bubbles: ['🎬', '🌟'] },
    { id: 'supermodel', label: 'Supermodel', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 124, limbR: 0.9, shoe: 0xf2f2f2, earSkip: true },
      // Long dark hair (crown cap + fall) + sunglasses pushed up + tint dress below
      // the hips. HEAD_R-derived sizes/positions divide by sk (1.05) because HEAD_R
      // is absolute; TORSO-derived dress dims factor sk cleanly.
      accessories: [
        { shape: 'sphere', size: 124 * 1.13 / 1.05, sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.44], anchor: 'head', pos: [0, 124 * 0.04 / 1.05, 124 * 0.04 / 1.05], rot: [0.28, 0, 0], color: 0x2a2026, emissive: 0x000000, emissiveIntensity: 1 }, // hair cap
        { shape: 'box', size: [124 * 1.6 / 1.05, 124 * 1.9 / 1.05, 124 * 0.5 / 1.05], anchor: 'head', pos: [0, -124 * 0.4 / 1.05, 124 * 0.72 / 1.05], color: 0x2a2026, emissive: 0x000000, emissiveIntensity: 1 }, // hair fall
        { shape: 'box', size: [124 * 1.1 / 1.05, 124 * 0.22 / 1.05, 124 * 0.16 / 1.05], anchor: 'head', pos: [0, 124 * 0.62 / 1.05, -124 * 0.72 / 1.05], color: 0x0a0a0c, emissive: 0x000000, emissiveIntensity: 1 }, // sunglasses
        { shape: 'box', size: [240 * 1.06, 600 * 0.46, 140 * 1.06], anchor: 'hip', pos: [0, 0, 0], color: 'tint' }, // dress
      ],
      personality: { swayMul: 1.35, ampMul: 1.1 }, bubbles: ['📸', '💅'] },
    { id: 'magician', label: 'Magician', rig: 'humanoid',
      humanoid: { body: NEARBLACK, shoe: 0x0a0a0c, emI: 0.20 },
      // Wand (black + white tip; hand-anchored, composes with the top hat) + black
      // top hat (brim + crown) + white shirt V (3-seg cone) + tint bowtie.
      accessories: [
        { shape: 'cylinder', size: [6, 6, 240], anchor: 'handR', pos: [0, -110, 0], color: 0x141414 },
        { shape: 'sphere', size: 11, anchor: 'handR', pos: [0, 10, 0], color: 0xf2f2f0 }, // white tip
        { shape: 'cylinder', size: [141.12, 141.12, 18], anchor: 'head', pos: [0, 75.6, 0], color: 0x111114, emissive: 0x000000, emissiveIntensity: 1 }, // top-hat brim
        { shape: 'cylinder', size: [88.2, 88.2, 157.5], anchor: 'head', pos: [0, 154.98, 0], color: 0x111114, emissive: 0x000000, emissiveIntensity: 1 }, // top-hat crown
        { shape: 'cone', size: [81.6, 360], segments: 3, anchor: 'chest', pos: [0, 12, -8], rot: [Math.PI, Math.PI / 3, 0], color: 0xf2f2f0, emissive: 0x000000, emissiveIntensity: 1 }, // shirt V
        { shape: 'box', size: [72, 45, 22], anchor: 'chest', pos: [0, 264, -12], color: 'tint' }, // bowtie
      ],
      bubbles: ['🎩', '✨', '🐇'] },
    { id: 'wise_oracle', label: 'Wise oracle', rig: 'humanoid',
      // gown = force floor-length-robe leg-swing damping (was the renderer's
      // kind==='wise_oracle' special case; now data-driven).
      humanoid: { skin: PALE, body: ROBE, shoe: 0x3a3542, emI: 0.15, earSkip: true, gown: true },
      // Two-handed staff: a long wooden pole gripped by BOTH hands — registered on
      // handR and re-aimed toward handL every frame, so it tracks walking / sitting.
      // (A two-handed prop keeps its POSITION at the anchor hand; only orientation
      // is driven, so a single centered cylinder passing through the grip is the
      // right authoring — a second offset prim would not ride the staff end.)
      // Plus: ankle-length robe skirt (body material), white beard, tint amulet.
      accessories: [
        { shape: 'cylinder', size: [17, 21, 1320], anchor: 'handR', color: 0x6b4a2b, twoHanded: true },
        { shape: 'box', size: [348, 850, 280], anchor: 'hip', pos: [0, -385, 0], color: 'body' }, // robe skirt
        { shape: 'box', size: [78.12, 107.1, 35.28], anchor: 'face', pos: [0, -98.28, 35.28], color: 0xe8e8e4, emissiveIntensity: 0.1 }, // beard
        { shape: 'sphere', size: 50, anchor: 'chest', pos: [0, 132, -24], color: 'tint' }, // amulet
      ],
      personality: { cadenceMul: 0.8, swayMul: 0.6 }, bubbles: ['🔮', '📜'] },

    // ── New occupations (Batch C2). Adult proportions; occupation reads through
    // color + accessory silhouette. Each keeps one 'tint' accent for sensor color.
    // Doctor — white coat + stethoscope + scrub-blue collar/trousers.
    { id: 'doctor', label: 'Doctor (white coat)', rig: 'humanoid',
      humanoid: { body: 0xf5f5f2, shoe: 0xf2f2f2, emI: 0.18, legColor: 0x5b8ab0 },
      accessories: [
        { shape: 'box', size: [82, 60, 20], anchor: 'chest', pos: [0, 120, -6], color: 0x5b8ab0 }, // collar wedge
        { shape: 'cylinder', size: [6, 6, 200], anchor: 'chest', pos: [28, 20, -14], color: 0x2c2e34 }, // stethoscope tube
        { shape: 'sphere', size: 34, anchor: 'chest', pos: [28, -80, -18], color: 0x2c2e34 }, // chest-piece
        { shape: 'sphere', size: 12, anchor: 'chest', pos: [28, -80, -32], color: 'tint' }, // accent ring
        { shape: 'box', size: [30, 44, 6], anchor: 'chest', pos: [-58, 120, -14], color: 'tint' }, // ID badge
      ],
      bubbles: ['🩺', '📋', '💊'] },

    // Firefighter — dark turnout coat, red helmet, hi-vis stripe, SCBA tank.
    { id: 'firefighter', label: 'Firefighter (turnout gear)', rig: 'humanoid',
      humanoid: { body: 0x24262b, shoe: 0x141416, emI: 0.15, limbR: 1.05 },
      accessories: [
        { shape: 'sphere', size: 150, anchor: 'head', pos: [0, 20, 0], sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.55], color: 0xb81f24 }, // helmet dome
        { shape: 'cylinder', size: [168, 168, 16], anchor: 'head', pos: [0, 30, 14], color: 0xb81f24 }, // brim
        { shape: 'box', size: [40, 40, 10], anchor: 'face', pos: [0, 40, -6], color: 0xd9c34a }, // brass shield
        { shape: 'box', size: [228, 96, 16], anchor: 'chest', pos: [0, 0, -6], color: 0xd9e021, emissive: 0xd9e021, emissiveIntensity: 0.5 }, // hi-vis stripe
        { shape: 'cylinder', size: [45, 45, 260], anchor: 'back', pos: [-58, -10, 26], color: 0xd8d8dc }, // tank L
        { shape: 'cylinder', size: [45, 45, 260], anchor: 'back', pos: [58, -10, 26], color: 0xd8d8dc }, // tank R
      ],
      personality: { bobMul: 1.1, cadenceMul: 0.9 }, bubbles: ['🚒', '🔥', '🧯'] },

    // Police officer — navy uniform, flat cap, gold badge, duty belt + pouches.
    { id: 'police-officer', label: 'Police officer (navy)', rig: 'humanoid',
      humanoid: { body: 0x1c2b46, shoe: 0x141416, emI: 0.18 },
      accessories: [
        { shape: 'cylinder', size: [108, 108, 70], anchor: 'crown', pos: [0, 20, 0], rot: [-0.1, 0, 0], color: 0x161e30 }, // flat cap crown (sits atop dome)
        { shape: 'cylinder', size: [148, 148, 14], anchor: 'crown', pos: [0, -8, -30], rot: [-0.1, 0, 0], color: 0x161e30 }, // peaked brim
        { shape: 'box', size: [22, 22, 8], anchor: 'face', pos: [0, 96, -6], color: 0xd9c34a }, // cap badge
        { shape: 'box', size: [30, 30, 8], anchor: 'chest', pos: [-56, 118, -12], rot: [0, 0, 0.78], color: 0xd9c34a }, // chest badge
        { shape: 'box', size: [262, 70, 158], anchor: 'hip', pos: [0, 0, 0], color: 0x0e0e10 }, // duty belt
        { shape: 'box', size: [40, 52, 30], anchor: 'hip', pos: [92, -12, -70], color: 0x0e0e10 }, // pouch
      ],
      bubbles: ['🚓', '🚨', '📻'] },

    // Chef — white double-breasted jacket + tall poofy toque + apron + neckerchief.
    { id: 'chef', label: 'Chef (toque & whites)', rig: 'humanoid',
      humanoid: { body: 0xf5f5f2, shoe: 0x1a1a1e, emI: 0.15, legColor: 0x2c2e34 },
      accessories: [
        { shape: 'cylinder', size: [107, 107, 60], anchor: 'crown', pos: [0, 0, 0], color: 0xf5f5f2 }, // toque band
        { shape: 'sphere', size: [126, 96, 126], anchor: 'crown', pos: [0, 90, 0], color: 0xf5f5f2 }, // poof
        { shape: 'box', size: [168, 360, 20], anchor: 'chest', pos: [0, -110, -8], color: 0xe8e6e0 }, // apron
        { shape: 'box', size: [70, 26, 90], anchor: 'neck', pos: [0, -6, -78], color: 'tint' }, // neckerchief
        { shape: 'cylinder', size: [6, 6, 130], anchor: 'handR', pos: [0, -55, 0], color: 0xd8d8d0 }, // whisk handle
        { shape: 'sphere', size: [24, 36, 24], anchor: 'handR', pos: [0, 5, 0], color: 0xc8c8c8 }, // wire-loop approx
      ],
      bubbles: ['🍳', '🔪', '🥘'] },

    // Scientist — white lab coat, cyan safety goggles, clipboard, pocket protector.
    { id: 'scientist', label: 'Scientist (lab coat)', rig: 'humanoid',
      humanoid: { body: 0xf2f2f0, shoe: 0x2c2e34, emI: 0.15 },
      accessories: [
        { shape: 'box', size: [220, 22, 22], anchor: 'head', pos: [0, 16, 0], color: 0x2c2e34 }, // goggle strap
        { shape: 'box', size: [58, 46, 18], anchor: 'face', pos: [-40, 12, -6], color: 0xbfe0e8, emissive: 0xbfe0e8, emissiveIntensity: 0.2 }, // lens L
        { shape: 'box', size: [58, 46, 18], anchor: 'face', pos: [40, 12, -6], color: 0xbfe0e8, emissive: 0xbfe0e8, emissiveIntensity: 0.2 }, // lens R
        { shape: 'box', size: [134, 200, 20], anchor: 'handR', pos: [0, -30, -40], color: 0x8a6a3c }, // clipboard
        { shape: 'box', size: [44, 60, 10], anchor: 'chest', pos: [-52, 80, -8], color: 0x2c2e34 }, // pocket protector
        { shape: 'cylinder', size: [5, 5, 46], anchor: 'chest', pos: [-58, 96, -16], color: 'tint' }, // pen
      ],
      personality: { cadenceMul: 0.9 }, bubbles: ['🧪', '🔬', '💡'] },

    // Teacher — warm maroon cardigan, glasses, held book, white collar.
    { id: 'teacher', label: 'Teacher (cardigan)', rig: 'humanoid',
      humanoid: { body: 0x7a4b3a, shoe: 0x3a2a20, emI: 0.15 },
      accessories: [
        { shape: 'box', size: [48, 36, 10], anchor: 'face', pos: [-38, 8, -6], color: 0x1a1a1e }, // lens L
        { shape: 'box', size: [48, 36, 10], anchor: 'face', pos: [38, 8, -6], color: 0x1a1a1e }, // lens R
        { shape: 'box', size: [24, 10, 8], anchor: 'face', pos: [0, 8, -8], color: 0x1a1a1e }, // bridge
        { shape: 'box', size: [72, 60, 16], anchor: 'chest', pos: [0, 140, -6], color: 0xf2f2f0 }, // collar
        { shape: 'box', size: [120, 168, 30], anchor: 'handL', pos: [0, -14, -30], color: 'tint' }, // book
      ],
      bubbles: ['📚', '✏️', '🍎'] },

    // Construction worker — ANSI yellow hard hat + hi-vis orange vest + tool belt.
    { id: 'construction-worker', label: 'Construction worker (hi-vis)', rig: 'humanoid',
      humanoid: { body: 0x9a8468, shoe: 0x5a3d28, emI: 0.15, limbR: 1.05 },
      accessories: [
        { shape: 'sphere', size: 146, anchor: 'head', pos: [0, 22, 0], sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.5], color: 0xf5d90a }, // hard hat
        { shape: 'box', size: [252, 500, 18], anchor: 'chest', pos: [0, 0, -8], color: 0xf07a1e }, // vest front
        { shape: 'box', size: [252, 24, 18], anchor: 'chest', pos: [0, 60, -10], color: 0xd9d9d9, emissive: 0xd9d9d9, emissiveIntensity: 0.3 }, // stripe
        { shape: 'box', size: [252, 500, 18], anchor: 'back', pos: [0, 0, 8], color: 0xf07a1e }, // vest back
        { shape: 'box', size: [252, 60, 150], anchor: 'hip', pos: [0, 0, 0], color: 0x3a2a20 }, // tool belt
        { shape: 'box', size: [26, 90, 26], anchor: 'hip', pos: [96, -20, -66], color: 0x1a1a1e }, // hammer handle
        { shape: 'box', size: [62, 26, 26], anchor: 'hip', pos: [96, 28, -66], color: 0x3a3a3e }, // hammer head
      ],
      personality: { bobMul: 1.1 }, bubbles: ['🔨', '🚧', '⚠️'] },

    // Pilot — navy jacket, tall rounded cap + gold badge, gold wings bar, tie.
    { id: 'pilot', label: 'Pilot (navy & wings)', rig: 'humanoid',
      humanoid: { body: 0x14203a, shoe: 0x0e0e10, emI: 0.2 },
      accessories: [
        { shape: 'cylinder', size: [108, 108, 82], anchor: 'crown', pos: [0, 30, 0], rot: [-0.1, 0, 0], color: 0x14203a }, // cap crown (sits atop dome)
        { shape: 'cylinder', size: [148, 148, 14], anchor: 'crown', pos: [0, -10, -40], rot: [-0.1, 0, 0], color: 0x0e0e10 }, // brim
        { shape: 'sphere', size: 22, anchor: 'face', pos: [0, 100, -6], color: 0xd9c34a }, // cap badge
        { shape: 'box', size: [120, 24, 12], anchor: 'chest', pos: [0, 118, -8], color: 0xd9c34a }, // wings bar
        { shape: 'box', size: [24, 120, 10], anchor: 'chest', pos: [0, 30, -10], color: 0x0e0e10 }, // tie
      ],
      personality: { swayMul: 1.1 }, bubbles: ['✈️', '🧭', '☁️'] },

    // Nurse — teal scrubs, soft cap with the load-bearing red cross, ID badge.
    { id: 'nurse', label: 'Nurse (scrubs)', rig: 'humanoid',
      humanoid: { body: 0x6fb3c0, shoe: 0xf2f2f2, emI: 0.2 },
      accessories: [
        { shape: 'sphere', size: 136, anchor: 'head', pos: [0, 24, 0], sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.45], color: 0x9ed6df }, // scrub cap
        { shape: 'box', size: [30, 8, 6], anchor: 'face', pos: [0, 54, -8], color: 0xd9302f }, // cross bar H
        { shape: 'box', size: [8, 30, 6], anchor: 'face', pos: [0, 54, -8], color: 0xd9302f }, // cross bar V
        { shape: 'box', size: [30, 44, 6], anchor: 'chest', pos: [-56, 118, -12], color: 'tint' }, // ID badge
      ],
      personality: { cadenceMul: 1.1 }, bubbles: ['💉', '🩹', '❤️'] },

    // Mail carrier — postal blue-grey uniform, round-brim helmet, cross-body satchel.
    { id: 'mail-carrier', label: 'Mail carrier (satchel)', rig: 'humanoid',
      humanoid: { body: 0x5a6a78, shoe: 0x2c2e34, emI: 0.15, legColor: 0x3f4a54 },
      accessories: [
        { shape: 'sphere', size: 148, anchor: 'head', pos: [0, 18, 0], sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.5], color: 0x5a6a78 }, // helmet dome
        { shape: 'cylinder', size: [160, 160, 12], anchor: 'head', pos: [0, 6, 0], color: 0x5a6a78 }, // round brim
        { shape: 'box', size: [30, 520, 18], anchor: 'chest', pos: [0, 0, -6], rot: [0, 0, 0.5], color: 0x3a2a20 }, // strap
        { shape: 'box', size: [120, 240, 90], anchor: 'hip', pos: [112, -20, 0], color: 0x3a2a20 }, // satchel
        { shape: 'box', size: [34, 34, 6], anchor: 'chest', pos: [-56, 118, -10], color: 'tint' }, // patch
      ],
      personality: { cadenceMul: 1.15, bobMul: 1.05 }, bubbles: ['✉️', '📦', '🐕'] },
  ],
};

export default pack;

// Base ▸ Careers — builtin base-group pack (dynamic-import only). Members keep
// their EXACT bare legacy ids + legacyAccessories markers.
import type { AvatarPackDef } from '../avatars.js';

const CHARCOAL = 0x2c2e34, NEARBLACK = 0x161619, PALE = 0xe7c6a4;
const GOLD = 0xcaa53a, ROBE = 0x7b718f;

const pack: AvatarPackDef = {
  id: 'base-careers', version: 3, label: 'Careers', path: ['Base', 'Careers'], builtin: true,
  avatars: [
    { id: 'professional', label: 'Professional', rig: 'humanoid', legacyAccessories: 'professional',
      humanoid: { body: CHARCOAL, shoe: 0x141416, emI: 0.20 }, bubbles: ['📊', '☕'] },
    { id: 'hacker', label: 'Hacker', rig: 'humanoid', legacyAccessories: 'hacker',
      // legColor = dark trousers matching the near-black hoodie (was pale skin — no
      // pants); shoe 0x141416 stays distinct.
      humanoid: { skin: PALE, body: NEARBLACK, shoe: 0x141416, emI: 0.15, earSkip: true, legColor: CHARCOAL }, bubbles: ['💻', '🔓'] },
    { id: 'tech_expert', label: 'Tech expert', rig: 'humanoid', legacyAccessories: 'tech_expert',
      humanoid: { body: NEARBLACK, shoe: 0x33363c, emI: 0.20, earSkip: true }, bubbles: ['💡', '🔌'] },
    { id: 'farmer', label: 'Farmer', rig: 'humanoid', legacyAccessories: 'farmer',
      // Decal: a plaid CHECK print on the chest reads as the flannel shirt without
      // texturing the toon body (crisp canvas decal plane, house style).
      humanoid: { shoe: 0x5a3d28, emI: 0.22, decals: [{ kind: 'print', print: 'check', color: 0x8a3b2e, anchor: 'chest' }] },
      bubbles: ['🌽', '🚜'] },
    { id: 'cowboy', label: 'Cowboy', rig: 'humanoid', legacyAccessories: 'cowboy',
      humanoid: { shoe: 0x5a3d28, emI: 0.22 }, bubbles: ['🤠', '🐴'] },
    { id: 'athlete', label: 'Athlete', rig: 'humanoid', legacyAccessories: 'athlete',
      // Decals: a jersey number '7' on the BACK + a team emblem star on the CHEST
      // (crisp canvas decal planes — text + glyph — riding proud of the jersey).
      humanoid: { shoe: 0xf2f2f2, decals: [
        { kind: 'text', text: '7', color: 0xf4f4f6, anchor: 'back' },
        { kind: 'glyph', glyph: '★', color: 0xf4f4f6, anchor: 'chest', scale: 0.6 },
      ] },
      bubbles: ['🏆', '💪'] },
    { id: 'movie_star', label: 'Movie star', rig: 'humanoid', legacyAccessories: 'movie_star',
      // Decal: a film-clapper glyph on the chest (canon: the star's craft).
      humanoid: { body: GOLD, shoe: 0x0a0a0c, emI: 0.20, eyes: 'shades',
        decals: [{ kind: 'glyph', glyph: '🎬', anchor: 'chest', scale: 0.7 }] },
      bubbles: ['🎬', '🌟'] },
    { id: 'supermodel', label: 'Supermodel', rig: 'humanoid', legacyAccessories: 'supermodel',
      humanoid: { sk: 1.05, headR: 124, limbR: 0.9, shoe: 0xf2f2f2, earSkip: true },
      personality: { swayMul: 1.35, ampMul: 1.1 }, bubbles: ['📸', '💅'] },
    { id: 'magician', label: 'Magician', rig: 'humanoid', legacyAccessories: 'magician',
      humanoid: { body: NEARBLACK, shoe: 0x0a0a0c, emI: 0.20 }, bubbles: ['🎩', '✨', '🐇'] },
    { id: 'wise_oracle', label: 'Wise oracle', rig: 'humanoid', legacyAccessories: 'wise_oracle',
      humanoid: { skin: PALE, body: ROBE, shoe: 0x3a3542, emI: 0.15, earSkip: true },
      // Two-handed staff: a long wooden pole gripped by BOTH hands — registered on
      // handR and re-aimed toward handL every frame, so it tracks walking / sitting.
      // (A two-handed prop keeps its POSITION at the anchor hand; only orientation
      // is driven, so a single centered cylinder passing through the grip is the
      // right authoring — a second offset prim would not ride the staff end.)
      accessories: [
        { shape: 'cylinder', size: [17, 21, 1320], anchor: 'handR', color: 0x6b4a2b, twoHanded: true },
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
        { shape: 'box', size: [70, 26, 90], anchor: 'neck', pos: [0, -6, -8], color: 'tint' }, // neckerchief
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

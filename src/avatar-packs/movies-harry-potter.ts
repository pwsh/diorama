// Pop Culture ▸ Movies ▸ Harry Potter — franchise pack (dynamic-import only,
// default loaded:false). Stylized geometric toon homage: color + silhouette
// only, no crests/logos/likenesses. Most costumes are black-based, so each
// member carries ONE saturated house-color accent (tie/trim); hair silhouette
// does the heavy lifting across the cast. Fixed costume colors are load-bearing
// identity here (named-character homage), so no sensor-tint carriers.
// Source doc: docs/avatars/pop-culture/movies-harry-potter.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'movies-harry-potter', version: 3, label: 'Harry Potter',
  path: ['Pop Culture', 'Movies', 'Harry Potter'], builtin: true, franchise: true,
  // Shared Hogwarts base: black robe, no glow, sphere hands.
  base: { rig: 'humanoid', humanoid: { body: 0x1c1c1e, headShape: 'sphere', hands: 'sphere', steel: false, emI: 0 } },
  avatars: [
    // Harry Potter — messy black hair, round glasses, lightning scar, Gryffindor tie.
    { id: 'movies-harry-potter/harry', label: 'Bespectacled student wizard (scarlet-gold tie)', rig: 'humanoid',
      humanoid: { sk: 0.88, headR: 116, limbR: 0.85, skin: 0xe8b48c, shoe: 0x241e1a, eyes: 'dots',
        armL: 0.95, legL: 0.95, legColor: 0x3a3a3a },
      accessories: [
        { shape: 'sphere', size: [85, 52, 85], anchor: 'crown', pos: [0, -4, 4], color: 0x16130f },
        { shape: 'box', size: [72, 12, 8], anchor: 'face', pos: [0, -8, -6], color: 0x201c18 }, // round glasses
        { shape: 'box', size: [6, 20, 4], anchor: 'face', pos: [-30, 40, -6], rot: [0, 0, 0.4], color: 0x7a4a30 }, // scar
        { shape: 'box', size: [24, 90, 8], anchor: 'chest', pos: [0, 10, -10], color: 0x740001 }, // tie
        { shape: 'box', size: [24, 22, 8], anchor: 'chest', pos: [0, 22, -11], color: 0xeeba30 }, // tie gold stripe
        { shape: 'cape', size: [140, 288, 200], anchor: 'back', pos: [0, -135, 12], rot: [0.12, 0, 0], color: 0x1c1c1e, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } },
        { shape: 'cylinder', size: [6, 5, 220], anchor: 'handR', pos: [0, -100, 0], rot: [0.15, 0, 0.1], color: 0x6b4a2c }, // wand
      ],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 0.95 },
      bubbles: ['⚡', '🦉', '📖', '😳'] },

    // Hermione Granger — bushy brown hair, tie, book.
    { id: 'movies-harry-potter/hermione', label: 'Studious witch (bushy hair, scarlet-gold tie)', rig: 'humanoid',
      humanoid: { sk: 0.85, headR: 112, limbR: 0.8, skin: 0xe6bd98, shoe: 0x201c18, eyes: 'almond',
        armL: 0.9, legL: 0.9, legColor: 0x8a8a86 },
      accessories: [
        { shape: 'sphere', size: [120, 90, 120], anchor: 'crown', pos: [0, 0, 0], color: 0x4a3320 }, // bushy hair
        { shape: 'box', size: [24, 90, 8], anchor: 'chest', pos: [0, 10, -10], color: 0x740001 },
        { shape: 'box', size: [24, 22, 8], anchor: 'chest', pos: [0, 22, -11], color: 0xeeba30 },
        { shape: 'box', size: [50, 62, 16], anchor: 'handL', pos: [0, -20, 0], color: 0xd8d0b8 }, // book
        { shape: 'cape', size: [130, 276, 190], anchor: 'back', pos: [0, -135, 12], rot: [0.12, 0, 0], color: 0x1c1c1e, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } },
      ],
      personality: { bobMul: 0.95, swayMul: 0.85, cadenceMul: 1.15, ampMul: 0.95 },
      bubbles: ['📚', '✋', '🔮', '😤'] },

    // Ron Weasley — bright red hair, freckles, maroon sweater, lanky.
    { id: 'movies-harry-potter/ron', label: 'Tall freckled wizard (maroon sweater)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 116, limbR: 0.8, skin: 0xf0c8a0, body: 0x7a1f1f, shoe: 0x241e1a, eyes: 'dots',
        armL: 1.05, legL: 1.1, footMul: [1.1, 1, 1.1], legColor: 0x3a3a3a },
      accessories: [
        { shape: 'sphere', size: [85, 52, 85], anchor: 'crown', pos: [0, 0, 4], color: 0xc94a1e },
        { shape: 'sphere', size: 8, anchor: 'face', pos: [-24, -20, -4], color: 0xb5723a }, // freckle L
        { shape: 'sphere', size: 8, anchor: 'face', pos: [24, -20, -4], color: 0xb5723a }, // freckle R
        { shape: 'box', size: [22, 84, 8], anchor: 'chest', pos: [0, 10, -10], color: 0x740001 },
        { shape: 'box', size: [22, 20, 8], anchor: 'chest', pos: [0, 22, -11], color: 0xeeba30 },
        { shape: 'cape', size: [140, 276, 200], anchor: 'back', pos: [0, -135, 12], rot: [0.12, 0, 0], color: 0x1c1c1e, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } },
        { shape: 'cylinder', size: [6, 5, 230], anchor: 'handR', pos: [0, -105, 0], rot: [0.15, 0, 0.1], color: 0x7a5a34 }, // wand
      ],
      // approx: freckle scatter reduced to two proud cheek dots (no scatter generator).
      personality: { bobMul: 1.1, swayMul: 1.15, cadenceMul: 0.95, ampMul: 1.05 },
      bubbles: ['♟️', '🍫', '🕷️', '😨'] },

    // Albus Dumbledore — violet robes, tall pointed hat, silver beard, half-moon specs.
    { id: 'movies-harry-potter/headmaster', label: 'Elder headmaster (violet robes, silver beard)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, limbR: 0.9, skin: 0xd8b48c, body: 0x4a2e6e, shoe: 0x3a2a1a, eyes: 'almond',
        armL: 1.0, legL: 1.0, legColor: 0x4a2e6e },
      accessories: [
        { shape: 'cone', size: [80, 190], anchor: 'crown', pos: [0, 80, 6], rot: [0.3, 0, 0], color: 0x3a2258 }, // pointed hat
        { shape: 'box', size: [70, 210, 40], anchor: 'face', pos: [0, -130, 12], color: 0xe8e8e0 }, // beard
        { shape: 'box', size: [64, 14, 8], anchor: 'face', pos: [0, -20, -6], color: 0xd8b84a }, // half-moon specs
        { shape: 'box', size: [180, 18, 155], anchor: 'hip', pos: [0, 0, 0], color: 0x6b4a2e }, // belt
        { shape: 'cylinder', size: [9, 9, 300], anchor: 'handR', pos: [0, -120, 0], color: 0x4a3826 }, // wand
        { shape: 'sphere', size: 20, anchor: 'handR', pos: [0, 60, 0], color: 0xcfd8e0, emissive: 0xcfd8e0, emissiveIntensity: 0.15 },
      ],
      personality: { bobMul: 0.9, swayMul: 0.75, cadenceMul: 0.85, ampMul: 0.9 },
      bubbles: ['🍬', '⭐', '🕊️', '😌'] },

    // Severus Snape — near-black robe, flat center-parted hair, billowing back-cone.
    { id: 'movies-harry-potter/professor', label: 'Stern potions master (billowing black robes)', rig: 'humanoid',
      humanoid: { sk: 1.0, headR: 120, limbR: 0.85, skin: 0xd8c4a8, body: 0x141414, shoe: 0x0f0f0f, eyes: 'slit',
        armL: 1.0, legL: 1.0, legColor: 0x141414 },
      accessories: [
        { shape: 'sphere', size: [80, 50, 86], anchor: 'crown', pos: [0, -6, 6], color: 0x0d0d0d }, // flat hair
        { shape: 'box', size: [16, 140, 20], anchor: 'face', pos: [-60, -60, 10], color: 0x0d0d0d }, // hair curtain L
        { shape: 'box', size: [16, 140, 20], anchor: 'face', pos: [60, -60, 10], color: 0x0d0d0d }, // hair curtain R
        { shape: 'cape', size: [170, 414, 250], anchor: 'back', pos: [0, -160, 14], rot: [0.12, 0, 0], color: 0x101010, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // billowing robe
        { shape: 'box', size: [16, 180, 10], anchor: 'chest', pos: [0, 10, -10], color: 0x2a2a2a }, // buttoned front
      ],
      // approx: no cloth-flutter channel — the billowing robe is a static oversized back-cone.
      personality: { bobMul: 0.7, swayMul: 0.5, cadenceMul: 1.05, ampMul: 0.8 },
      bubbles: ['🧪', '🐍', '😒', '🤫'] },

    // Rubeus Hagrid — half-giant scale, huge black beard, moleskin coat, pink umbrella.
    { id: 'movies-harry-potter/groundskeeper', label: 'Towering groundskeeper (wild beard, moleskin coat)', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 150, limbR: 1.5, skin: 0xc9976e, body: 0x3a2e22, shoe: 0x241a10, eyes: 'dots',
        armL: 1.1, legL: 0.9, footMul: [1.4, 1.2, 1.4], legColor: 0x241a10 },
      accessories: [
        { shape: 'sphere', size: [150, 90, 150], anchor: 'crown', pos: [0, -6, 4], color: 0x1c1712 }, // wild hair
        { shape: 'box', size: [130, 170, 60], anchor: 'face', pos: [0, -90, 20], color: 0x1c1712 }, // huge beard
        { shape: 'cape', size: [190, 391, 275], anchor: 'back', pos: [0, -160, 14], rot: [0.12, 0, 0], color: 0x2e2418, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // overcoat
        { shape: 'cylinder', size: [10, 10, 300], anchor: 'handR', pos: [0, -140, 0], color: 0xd05a8a }, // pink umbrella
        { shape: 'sphere', size: 22, anchor: 'handR', pos: [0, 20, 0], color: 0xe8a0c0 },
        { shape: 'box', size: [240, 34, 180], anchor: 'hip', pos: [0, 0, 0], color: 0x1c1410 }, // belt
      ],
      personality: { bobMul: 1.3, swayMul: 1.15, cadenceMul: 0.8, ampMul: 1.2 },
      bubbles: ['🐉', '🍮', '🕷️', '😢'] },

    // Lord Voldemort — chalk-white, bald, noseless, glowing red eyes, spindly.
    { id: 'movies-harry-potter/darklord', label: 'Serpentine dark sorcerer (bald, crimson eyes)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 122, limbR: 0.65, skin: 0xe8e4e0, body: 0x0d0d0d, shoe: 0x0a0a0a, eyes: 'redvisor',
        armL: 1.1, legL: 1.05, footMul: [0.9, 1, 0.9], legColor: 0x0d0d0d, noFace: true },
      accessories: [
        { shape: 'cape', size: [170, 437, 250], anchor: 'back', pos: [0, -170, 14], rot: [0.12, 0, 0], color: 0x0a0a0a, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // floor-length robe
        { shape: 'cylinder', size: [9, 9, 280], anchor: 'handR', pos: [0, -110, 0], color: 0x2a2018 }, // wand
        { shape: 'sphere', size: 16, anchor: 'handR', pos: [0, 50, 0], color: 0xe8e4e0 },
        { shape: 'box', size: [120, 40, 16], anchor: 'chest', pos: [0, 40, -8], color: 0x1a1a1a }, // stiff collar
      ],
      // approx: noFace removes nose+mouth+brows as one bundle — exactly the noseless/lipless read wanted.
      personality: { bobMul: 0.6, swayMul: 0.55, cadenceMul: 0.8, ampMul: 0.75 },
      bubbles: ['🐍', '💀', '🌑', '😈'] },

    // Draco Malfoy — platinum slicked-back hair, Slytherin green-silver tie.
    { id: 'movies-harry-potter/rival', label: 'Slicked-blonde rival wizard (green-silver trim)', rig: 'humanoid',
      humanoid: { sk: 0.87, headR: 114, limbR: 0.8, skin: 0xefd9c0, shoe: 0x201c18, eyes: 'almond',
        armL: 0.95, legL: 0.95, legColor: 0x3a3a3a },
      accessories: [
        { shape: 'sphere', size: [78, 40, 84], anchor: 'crown', pos: [0, -4, 4], color: 0xe8dfa0 }, // slicked platinum hair
        { shape: 'box', size: [24, 90, 8], anchor: 'chest', pos: [0, 10, -10], color: 0x1a472a }, // Slytherin tie
        { shape: 'box', size: [24, 22, 8], anchor: 'chest', pos: [0, 22, -11], color: 0xaaaaaa }, // tie silver stripe
        { shape: 'cape', size: [130, 276, 190], anchor: 'back', pos: [0, -135, 12], rot: [0.12, 0, 0], color: 0x1c1c1e, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } },
        { shape: 'cylinder', size: [8, 8, 260], anchor: 'handR', pos: [0, -100, 0], color: 0x4a3826 }, // wand
      ],
      personality: { bobMul: 1.0, swayMul: 1.2, cadenceMul: 0.95, ampMul: 0.9 },
      bubbles: ['🐍', '💰', '😏', '🙄'] },
  ],
};

export default pack;

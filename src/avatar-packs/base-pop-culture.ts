// Base ▸ Pop Culture — builtin base-group pack (dynamic-import only). Members
// keep their EXACT bare legacy ids + legacyAccessories markers.
import type { AvatarPackDef } from '../avatars.js';

const MATTE = 0x1a1a1e, PLUSH = 0x8b5e3c, MOUSE = 0x9e9e9e;
const DOG_C = 0xa1704a, DUCKW = 0xf2f0e6;

const pack: AvatarPackDef = {
  id: 'base-pop-culture', version: 3, label: 'Pop Culture', path: ['Base', 'Pop Culture'], builtin: true,
  avatars: [
    { id: 'teddy_bear', label: 'Teddy bear', rig: 'humanoid', legacyAccessories: 'teddy_bear',
      humanoid: { sk: 0.9, headR: 140, limbR: 1.3, skin: PLUSH, body: PLUSH, shoe: PLUSH, emI: 0.20, armL: 0.8, legL: 0.8, earSkip: true },
      personality: { bobMul: 1.3, cadenceMul: 0.85 }, bubbles: ['🍯', '🤗'] },
    { id: 'cartoon_mouse', label: 'Cartoon mouse', rig: 'humanoid', legacyAccessories: 'cartoon_mouse',
      humanoid: { sk: 0.85, headR: 120, limbR: 0.9, skin: MOUSE, body: MOUSE, shoe: 0x555a60, emI: 0.20, earSkip: true },
      personality: { cadenceMul: 1.25, bobMul: 1.2 }, bubbles: ['🧀'] },
    { id: 'cartoon_dog', label: 'Cartoon dog', rig: 'humanoid', legacyAccessories: 'cartoon_dog',
      humanoid: { sk: 0.95, headR: 128, skin: DOG_C, body: DOG_C, shoe: 0x5a3d28, emI: 0.20, earSkip: true },
      personality: { cadenceMul: 1.1 }, bubbles: ['🦴', '🎾'] },
    { id: 'cartoon_duck', label: 'Cartoon duck', rig: 'humanoid', legacyAccessories: 'cartoon_duck',
      humanoid: { sk: 0.85, headR: 122, limbR: 0.9, skin: DUCKW, body: DUCKW, shoe: 0xe8a020, emI: 0.20, armL: 0.6, footMul: [1.6, 0.7, 1.35], legColor: 0xe8a020, earSkip: true },
      personality: { swayMul: 1.7, cadenceMul: 1.15 }, bubbles: ['💦', '🐟'] },
    { id: 'ninja', label: 'Ninja', rig: 'humanoid', legacyAccessories: 'ninja',
      humanoid: { headR: 120, skin: MATTE, body: MATTE, shoe: 0x0a0a0c, emI: 0.05, eyes: 'slit', earSkip: true }, bubbles: ['🥷', '💨'] },

    // ── New costume/folklore archetypes (Batch C2). Non-IP Halloween-aisle
    // silhouettes; tint kept on an accent piece where the costume overrides skin.
    // Pirate — tricorn (approx), eyepatch, bandolier, red sash, hook.
    { id: 'pirate', label: 'Pirate (tricorn + sash)', rig: 'humanoid',
      humanoid: { body: 0xe8dcc0, shoe: 0x3b2a1a, emI: 0.20 },
      accessories: [
        { shape: 'cylinder', size: [170, 170, 16], anchor: 'crown', pos: [0, -6, 0], color: 0x141416 }, // tricorn brim (approx)
        { shape: 'cylinder', size: [101, 101, 64], anchor: 'crown', pos: [0, 34, 0], color: 0x141416 }, // crown
        { shape: 'box', size: [42, 30, 14], anchor: 'face', pos: [40, 12, -8], color: 0x0a0a0c }, // eyepatch
        { shape: 'box', size: [53, 264, 18], anchor: 'chest', pos: [0, 0, -6], rot: [0, 0, 0.5], color: 'tint' }, // bandolier
        { shape: 'box', size: [252, 84, 148], anchor: 'hip', pos: [0, 0, 0], color: 0x9a1f1f }, // sash
        { shape: 'cone', size: [18, 90], anchor: 'handR', pos: [0, -20, 0], rot: [2.6, 0, 0], color: 0xb8bcc2 }, // hook
      ],
      personality: { swayMul: 1.35, cadenceMul: 0.9 }, bubbles: ['⚓', '🏴‍☠️', '💰', '🦜'] },

    // Vampire — pale skin, black cape + red lining sliver, widow's peak, fangs.
    { id: 'vampire', label: 'Vampire (cape)', rig: 'humanoid',
      humanoid: { skin: 0xe7d8ce, body: 0x14141a, shoe: 0x0a0a0c, emI: 0.18, gown: true },
      accessories: [
        { shape: 'cape', size: [380, 1380, 640], anchor: 'back', pos: [0, -470, 10], rot: [0.12, 0, 0], color: 0x0d0d10, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // cape outer (draped sheet)
        { shape: 'cape', size: [300, 1300, 520], anchor: 'back', pos: [0, -470, -6], rot: [0.12, 0, 0], color: 0x8a1220, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // red lining sliver
        { shape: 'cone', size: [28, 40], anchor: 'crown', pos: [0, -40, -120], rot: [3.14, 0, 0], color: 0x101013 }, // widow's peak
        { shape: 'cone', size: [8, 22], anchor: 'face', pos: [-20, -60, -10], rot: [3.14, 0, 0], color: 0xf2f2f2 }, // fang L
        { shape: 'cone', size: [8, 22], anchor: 'face', pos: [20, -60, -10], rot: [3.14, 0, 0], color: 0xf2f2f2 }, // fang R
        { shape: 'box', size: [70, 40, 16], anchor: 'chest', pos: [0, 150, -6], color: 'tint' }, // tint collar
      ],
      personality: { bobMul: 0.6, cadenceMul: 0.85 }, bubbles: ['🦇', '🩸', '🌙'] },

    // Zombie — sickly green-grey skin, torn cloth tatters, scar; static forward hunch.
    { id: 'zombie', label: 'Zombie (tattered)', rig: 'humanoid',
      humanoid: { skin: 0x8a9478, body: 0x5a5a48, shoe: 0x2f2f28, emI: 0.10 },
      accessories: [
        { shape: 'box', size: [72, 150, 10], anchor: 'chest', pos: [-70, -20, -6], rot: [0, 0, 0.3], color: 0x3f3f34 }, // tatter L
        { shape: 'box', size: [72, 150, 10], anchor: 'chest', pos: [70, 0, -6], rot: [0, 0, -0.3], color: 0x3f3f34 }, // tatter R
        { shape: 'box', size: [60, 150, 10], anchor: 'chest', pos: [0, -80, -8], rot: [0, 0, 0.15], color: 0x3f3f34 }, // tatter mid
        { shape: 'box', size: [63, 8, 6], anchor: 'face', pos: [30, 12, -6], rot: [0, 0, 0.6], color: 0x5a1414 }, // scar
      ],
      posture: { pitch: 0.15 }, personality: { cadenceMul: 0.55, swayMul: 1.6, bobMul: 0.85 }, bubbles: ['🧠', '🩸', '😖'] },

    // Witch / wizard — pointed cone hat (native tip), robe skirt, cord belt, orb staff.
    { id: 'witch_wizard', label: 'Witch / wizard (pointed hat)', rig: 'humanoid',
      humanoid: { body: 0x3a2a52, shoe: 0x141416, emI: 0.20, gown: true },
      accessories: [
        { shape: 'cylinder', size: [170, 170, 14], anchor: 'crown', pos: [0, -6, 0], color: 0x2a1e3e }, // hat brim
        { shape: 'cone', size: [63, 214], anchor: 'crown', pos: [0, 110, 0], rot: [0, 0, 0.12], color: 0x2a1e3e }, // pointed crown
        { shape: 'cape', size: [340, 1000, 520], anchor: 'back', pos: [0, -420, -10], rot: [0.1, 0, 0], color: 0x3a2a52, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // robe cape (draped sheet)
        { shape: 'box', size: [252, 22, 152], anchor: 'hip', pos: [0, 0, 0], color: 'tint' }, // cord belt
        { shape: 'cylinder', size: [16, 16, 520], anchor: 'handR', pos: [0, -100, 0], color: 0x3a2a1a }, // staff
        { shape: 'sphere', size: 40, anchor: 'handR', pos: [0, 160, 0], color: 'tint', emissiveIntensity: 0.5, outlineSkip: true }, // orb
      ],
      personality: { cadenceMul: 0.85, swayMul: 0.7 }, bubbles: ['🔮', '✨', '🪄', '📜'] },

    // Superhero — tinted bodysuit, flowing cape, diamond chest emblem, mask.
    { id: 'superhero', label: 'Superhero (cape + emblem)', rig: 'humanoid',
      humanoid: { shoe: 0x1a1a1f, emI: 0.30 },
      accessories: [
        { shape: 'cape', size: [360, 1200, 620], anchor: 'back', pos: [0, -360, 10], rot: [0.15, 0, 0], color: 'tint', animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // cape (draped sheet)
        { shape: 'box', size: [77, 77, 12], anchor: 'chest', pos: [0, 40, -8], rot: [0, 0, 0.785], color: 0xcaa53a }, // emblem
        { shape: 'box', size: [245, 40, 143], anchor: 'hip', pos: [0, 0, 0], color: 0xcaa53a }, // belt
        { shape: 'box', size: [113, 28, 10], anchor: 'face', pos: [0, 10, -6], color: 0x141414 }, // domino mask
      ],
      personality: { ampMul: 1.15 }, bubbles: ['💥', '🦸', '✨', '🛡️'] },

    // Clown — white face, rainbow wig (wraps sides → earSkip), red nose, big shoes.
    { id: 'clown', label: 'Clown (big shoes + red nose)', rig: 'humanoid',
      humanoid: { skin: 0xf2ede4, shoe: 0xffcf3d, emI: 0.25, footMul: [1.7, 0.6, 1.5], earSkip: true },
      accessories: [
        { shape: 'sphere', size: 38, anchor: 'head', pos: [-70, 30, 0], color: 0xdd2222 }, // wig
        { shape: 'sphere', size: 38, anchor: 'head', pos: [70, 30, 0], color: 0x3aa0dd }, // wig
        { shape: 'sphere', size: 38, anchor: 'head', pos: [-50, 40, 60], color: 0xffcf3d }, // wig
        { shape: 'sphere', size: 38, anchor: 'head', pos: [50, 40, 60], color: 0x3ac16a }, // wig
        { shape: 'sphere', size: 38, anchor: 'head', pos: [0, 30, 70], color: 0xdd2222 }, // wig
        { shape: 'sphere', size: 28, anchor: 'face', pos: [0, -10, -12], color: 0xdd2222, emissive: 0xdd2222, emissiveIntensity: 0.35, outlineSkip: true }, // red nose
        { shape: 'sphere', size: [150, 50, 150], anchor: 'neck', pos: [0, -10, 0], color: 0xf2f2f2 }, // ruffle collar
        { shape: 'sphere', size: 18, anchor: 'chest', pos: [0, 40, -8], color: 0x3aa0dd }, // pom-pom
        { shape: 'sphere', size: 18, anchor: 'chest', pos: [0, -20, -8], color: 0xdd2222 }, // pom-pom
      ],
      personality: { bobMul: 1.4, cadenceMul: 1.3, swayMul: 1.4 }, bubbles: ['🤡', '🎈', '🎪', '🎉'] },

    // Mummy — uniform bandage tan (skin = body), diagonal wrap, trailing strips, hollow sockets.
    { id: 'mummy', label: 'Mummy (wrapped)', rig: 'humanoid',
      humanoid: { skin: 0xd8c9a8, body: 0xd8c9a8, shoe: 0xcfc09c, emI: 0.10, earSkip: true },
      accessories: [
        { shape: 'box', size: [280, 18, 20], anchor: 'head', pos: [0, 20, 0], rot: [0, 0, 0.4], color: 0xc2b28c }, // wrap band
        { shape: 'box', size: [40, 260, 8], anchor: 'chest', pos: [-90, -20, -8], rot: [0, 0, 0.2], color: 0xc2b28c }, // trailing strip
        { shape: 'box', size: [40, 320, 8], anchor: 'hip', pos: [90, -60, 0], rot: [0, 0, -0.15], color: 0xc2b28c }, // trailing strip
        { shape: 'box', size: [40, 240, 8], anchor: 'back', pos: [0, -40, 10], color: 0xc2b28c }, // trailing strip
        { shape: 'sphere', size: 20, anchor: 'face', pos: [-36, 10, -8], color: 0x0e0e10 }, // socket L
        { shape: 'sphere', size: 20, anchor: 'face', pos: [36, 10, -8], color: 0x0e0e10 }, // socket R
      ],
      personality: { cadenceMul: 0.45, bobMul: 0.7, swayMul: 1.1, ampMul: 0.75 }, bubbles: ['🏺', '🧻', '😵‍💫'] },

    // Knight — brushed steel, closed helm shell (earSkip), tint tabard front+back, sword.
    { id: 'knight', label: 'Knight (plate + tabard)', rig: 'humanoid',
      humanoid: { headR: 128, limbR: 1.05, skin: 0x9aa3ad, body: 0x9aa3ad, shoe: 0x585d64, emI: 0.10, hands: 'box', eyes: 'visor', steel: true, earSkip: true },
      accessories: [
        { shape: 'sphere', size: 141, anchor: 'head', pos: [0, 0, 0], sphereArc: [0, Math.PI * 2, 0, Math.PI * 0.9], color: 0x9aa3ad, metalness: 0.7, roughness: 0.35 }, // helm shell
        { shape: 'cone', size: [20, 140], anchor: 'crown', pos: [0, 20, 0], rot: [-0.3, 0, 0], color: 'tint' }, // plume
        { shape: 'box', size: [204, 540, 14], anchor: 'chest', pos: [0, -20, -8], color: 'tint' }, // tabard front
        { shape: 'box', size: [60, 60, 8], anchor: 'chest', pos: [0, 40, -16], color: 0xcaa53a }, // emblem
        { shape: 'box', size: [204, 540, 14], anchor: 'back', pos: [0, -20, 8], color: 'tint' }, // tabard back
        { shape: 'box', size: [24, 420, 10], anchor: 'hip', pos: [92, -120, 0], rot: [0, 0, 0.25], color: 0x9aa3ad }, // sword
        { shape: 'box', size: [90, 24, 16], anchor: 'hip', pos: [92, 40, 0], rot: [0, 0, 0.25], color: 0x585d64 }, // crossguard
      ],
      personality: { cadenceMul: 0.75, bobMul: 1.2 }, bubbles: ['⚔️', '🛡️', '🐴'] },

    // Caveman — fur pelt, unkempt hair, asymmetric single-shoulder drape, bone necklace, club.
    { id: 'caveman', label: 'Caveman (pelt + club)', rig: 'humanoid',
      humanoid: { sk: 1.05, headR: 128, limbR: 1.1, body: 0x7a5a38, shoe: 0xd2a679, emI: 0.20 },
      accessories: [
        { shape: 'sphere', size: 45, anchor: 'crown', pos: [-40, 10, 10], color: 0x2a2016 }, // hair
        { shape: 'sphere', size: 45, anchor: 'crown', pos: [40, 16, -14], color: 0x2a2016 }, // hair
        { shape: 'sphere', size: 45, anchor: 'crown', pos: [0, 30, 40], color: 0x2a2016 }, // hair
        { shape: 'box', size: [120, 700, 24], anchor: 'chest', pos: [0, 0, -10], rot: [0, 0, 0.4], color: 0x8a6a45 }, // pelt drape
        { shape: 'box', size: [216, 180, 154], anchor: 'hip', pos: [0, 0, 0], color: 0x8a6a45 }, // loincloth
        { shape: 'cylinder', size: [10, 10, 26], anchor: 'chest', pos: [-30, 130, -10], color: 0xe8e4d8 }, // bone bead
        { shape: 'cylinder', size: [10, 10, 26], anchor: 'chest', pos: [30, 130, -10], color: 0xe8e4d8 }, // bone bead
        { shape: 'cone', size: [70, 340], anchor: 'handR', pos: [0, -60, 0], rot: [3.14, 0, 0], color: 0x5a3f24 }, // club (wide end up)
      ],
      personality: { bobMul: 1.3, cadenceMul: 0.8, ampMul: 1.25 }, bubbles: ['🦴', '🔥', '🦣'] },

    // Genie — vivid blue, gold cuffs, red sash, legless smoke tail via hover + hip cone.
    { id: 'genie', label: 'Genie (blue + cuffs)', rig: 'humanoid',
      humanoid: { headR: 124, limbR: 0.95, skin: 0x2f6fe0, body: 0x1c3a78, shoe: 0x2f6fe0, emI: 0.28, hover: 650 },
      accessories: [
        { shape: 'cone', size: [130, 600], anchor: 'hip', pos: [0, -300, 0], rot: [3.14, 0, 0], color: 0x2f6fe0 }, // smoke tail
        { shape: 'sphere', size: 37, anchor: 'head', pos: [0, 60, 20], color: 0x18181c }, // topknot
        { shape: 'box', size: [72, 510, 16], anchor: 'chest', pos: [-50, 0, -8], color: 0x0f2050 }, // vest lapel L
        { shape: 'box', size: [72, 510, 16], anchor: 'chest', pos: [50, 0, -8], color: 0x0f2050 }, // vest lapel R
        { shape: 'box', size: [260, 96, 154], anchor: 'hip', pos: [0, 80, 0], color: 0x9a1f1f }, // sash
        { shape: 'cylinder', size: [50, 50, 30], anchor: 'handL', pos: [0, 0, 0], color: 0xcaa53a, emissiveIntensity: 0.3 }, // cuff L
        { shape: 'cylinder', size: [50, 50, 30], anchor: 'handR', pos: [0, 0, 0], color: 0xcaa53a, emissiveIntensity: 0.3 }, // cuff R
        { shape: 'sphere', size: [46, 30, 50], anchor: 'handL', pos: [0, -30, -20], color: 0xd9b23a, metalness: 0.6, roughness: 0.3 }, // magic lamp body
        { shape: 'cone', size: [14, 46], anchor: 'handL', pos: [-30, -30, -50], rot: [0, 0, 1.2], color: 0xd9b23a }, // lamp spout
      ],
      personality: { bobMul: 0.5, swayMul: 1.3 }, bubbles: ['🧞', '💫', '🪔', '✨'] },
  ],
};

export default pack;

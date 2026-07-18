// Cartoons ▸ Disney Princess — franchise pack (opt-in, defaults loaded:false).
// Stylized geometric toon homage — NOT licensed characters, colour + silhouette
// only. Shared humanoid rig; the load-bearing trick is a hip-anchored cone
// "ballgown" that flares to the floor and hides the legs, plus hair built from
// crown/head sphere/cone/cylinder accessory stacks. A signature dress colour +
// hair volume are each member's read; a small accent piece carries the 'tint'
// so per-sensor colour-coding survives. Sizes are mm at sk=1.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'disney-princess', version: 4, label: 'Disney Princess',
  path: ['Cartoons', 'Disney Princess'], builtin: true, franchise: true,
  base: {
    rig: 'humanoid',
    humanoid: {
      sk: 1, headR: 126, headShape: 'sphere', limbR: 0.92,
      hands: 'sphere', eyes: 'almond', steel: false, armL: 1, legL: 1, footMul: [1, 1, 1],
    },
  },
  avatars: [
    // Elsa (Frozen) — icy powder-blue gown, single platinum over-shoulder braid.
    // approx: sheer cape rendered opaque (no per-primitive opacity field).
    { id: 'disney-princess/ice-queen', label: 'Ice Queen (ice-blue gown)', rig: 'humanoid',
      humanoid: { skin: 0xf6d9c4, body: 0xbfe6f5, shoe: 0xeaf6fb, legColor: 0xbfe6f5, emI: 0.14, gown: true },
      accessories: [
        { shape: 'cone', size: [320, 940, 0], anchor: 'hip', pos: [0, -320, 0], color: 0xd9f2fb }, // ballgown (waist→floor)
        { shape: 'cape', size: [240, 560, 380], anchor: 'back', pos: [0, -150, 25], rot: [0.18, 0, 0], color: 0xd6f0fb, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // sheer cape
        { shape: 'sphere', size: [140, 128, 118], anchor: 'crown', pos: [0, -18, 12], sphereArc: [0, 6.283, 0, 1.85], color: 0xe8e3d3 }, // hair crown cap
        { shape: 'sphere', size: [112, 168, 82], anchor: 'crown', pos: [-14, -230, 70], color: 0xe8e3d3 }, // long back mass (upper)
        { shape: 'sphere', size: [100, 172, 78], anchor: 'crown', pos: [-16, -410, 84], color: 0xe8e3d3 }, // long back mass (mid)
        { shape: 'sphere', size: [82, 158, 70], anchor: 'crown', pos: [-14, -580, 92], color: 0xe8e3d3 }, // long back mass (to waist)
        { shape: 'sphere', size: 34, anchor: 'crown', pos: [70, 10, 40], color: 0xe8e3d3 }, // side braid
        { shape: 'sphere', size: 30, anchor: 'crown', pos: [85, -80, 70], color: 0xe8e3d3 }, // side braid
        { shape: 'sphere', size: 26, anchor: 'crown', pos: [90, -180, 90], color: 0xe8e3d3 }, // side braid
        { shape: 'sphere', size: 22, anchor: 'crown', pos: [88, -280, 100], color: 0xe8e3d3 }, // side braid tail
        { shape: 'box', size: [230, 26, 150], anchor: 'hip', pos: [0, 40, 0], color: 'tint' },
      ],
      personality: { bobMul: 0.65, swayMul: 0.7, cadenceMul: 0.85 }, bubbles: ['❄️', '⛄', '✨', '👑'] },

    // Anna (Frozen) — black bodice, navy A-line skirt, teal cape, twin braids.
    { id: 'disney-princess/her-sister', label: 'Her Sister (teal cape, twin braids)', rig: 'humanoid',
      humanoid: { skin: 0xf7d1b8, body: 0x1a2230, shoe: 0x2b2320, legColor: 0x243247, emI: 0.05, gown: true },
      accessories: [
        { shape: 'cone', size: [280, 920, 0], anchor: 'hip', pos: [0, -310, 0], color: 0x243247 }, // A-line skirt (waist→floor)
        { shape: 'cape', size: [260, 520, 400], anchor: 'back', pos: [0, -130, 30], rot: [0.2, 0, 0], color: 0x2f8f7a, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // teal cape
        { shape: 'sphere', size: [138, 126, 116], anchor: 'crown', pos: [0, -14, 10], sphereArc: [0, 6.283, 0, 1.85], color: 0xd98c4a }, // hair crown cap
        { shape: 'sphere', size: [108, 150, 80], anchor: 'crown', pos: [0, -220, 72], color: 0xd98c4a }, // back mass (upper)
        { shape: 'sphere', size: [92, 150, 74], anchor: 'crown', pos: [0, -380, 86], color: 0xd98c4a }, // back mass (mid-back)
        { shape: 'sphere', size: 30, anchor: 'crown', pos: [-72, 0, 35], color: 0xd98c4a }, // braid L
        { shape: 'sphere', size: 26, anchor: 'crown', pos: [-84, -120, 55], color: 0xd98c4a }, // braid L
        { shape: 'sphere', size: 22, anchor: 'crown', pos: [-88, -250, 72], color: 0xd98c4a }, // braid L tail
        { shape: 'sphere', size: 30, anchor: 'crown', pos: [72, 0, 35], color: 0xd98c4a }, // braid R
        { shape: 'sphere', size: 26, anchor: 'crown', pos: [84, -120, 55], color: 0xd98c4a }, // braid R
        { shape: 'sphere', size: 22, anchor: 'crown', pos: [88, -250, 72], color: 0xd98c4a }, // braid R tail
        { shape: 'box', size: [200, 22, 140], anchor: 'chest', pos: [0, 120, 20], color: 'tint' },
      ],
      personality: { bobMul: 1.2, swayMul: 1.15, cadenceMul: 1.1 }, bubbles: ['❤️', '🥕', '⛄', '😄'] },

    // Ariel (The Little Mermaid) — LAND VARIANT: sea-green skirt carries the
    // canonical tail hue; purple seashell top; vivid red hair volume.
    { id: 'disney-princess/the-mermaid', label: 'The Mermaid (land variant, teal skirt)', rig: 'humanoid',
      humanoid: { skin: 0xf6cbb0, body: 0x8b3fa0, shoe: 0x1f9a5b, legColor: 0x1f9a5b, emI: 0.10, gown: true },
      accessories: [
        { shape: 'cone', size: [300, 920, 0], anchor: 'hip', pos: [0, -310, 0], color: 0x1f9a5b }, // skirt (waist→floor)
        { shape: 'cone', size: [120, 150, 0], anchor: 'hip', pos: [-90, -700, 40], color: 0x1f9a5b },
        { shape: 'cone', size: [120, 150, 0], anchor: 'hip', pos: [90, -700, 40], color: 0x1f9a5b },
        { shape: 'sphere', size: [146, 132, 124], anchor: 'crown', pos: [0, -12, 10], sphereArc: [0, 6.283, 0, 1.95], color: 0xc62828 }, // vivid-red crown cap (biggest volume)
        { shape: 'sphere', size: [120, 175, 92], anchor: 'crown', pos: [-8, -210, 70], color: 0xc62828 }, // flowing back mass (upper)
        { shape: 'sphere', size: [112, 185, 88], anchor: 'crown', pos: [-10, -400, 84], color: 0xc62828 }, // flowing back mass (mid)
        { shape: 'sphere', size: [96, 175, 78], anchor: 'crown', pos: [-8, -590, 92], color: 0xc62828 }, // flowing back mass (past the waist)
        { shape: 'sphere', size: [70, 120, 60], anchor: 'crown', pos: [96, -150, 40], color: 0xc62828 }, // front sweep over the shoulder
        { shape: 'sphere', size: [60, 55, 40], anchor: 'chest', pos: [-55, 90, 70], color: 0x8b3fa0, sphereArc: [0, 6.283, 0, 1.6] },
        { shape: 'sphere', size: [60, 55, 40], anchor: 'chest', pos: [55, 90, 70], color: 0x8b3fa0, sphereArc: [0, 6.283, 0, 1.6] },
        { shape: 'box', size: [180, 20, 120], anchor: 'hip', pos: [0, 40, 0], color: 'tint' },
      ],
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 0.95, ampMul: 1.05 }, bubbles: ['🐚', '🌊', '🎶', '💭'] },

    // Belle (Beauty and the Beast) — voluminous golden-yellow ballgown, brown hair.
    { id: 'disney-princess/beauty', label: 'Beauty (yellow ballgown)', rig: 'humanoid',
      humanoid: { skin: 0xf0c39a, body: 0xf4c430, shoe: 0xd9a916, legColor: 0xf4c430, emI: 0.12, gown: true },
      accessories: [
        { shape: 'cone', size: [360, 960, 0], anchor: 'hip', pos: [0, -330, 0], color: 0xf4c430 }, // ballgown (waist→floor)
        { shape: 'sphere', size: [140, 128, 120], anchor: 'crown', pos: [0, -14, 8], sphereArc: [0, 6.283, 0, 1.85], color: 0x5c3a21 }, // brown hair crown cap
        { shape: 'sphere', size: [110, 165, 84], anchor: 'crown', pos: [0, -225, 66], color: 0x5c3a21 }, // long wavy back mass (upper)
        { shape: 'sphere', size: [98, 172, 80], anchor: 'crown', pos: [0, -405, 82], color: 0x5c3a21 }, // long wavy back mass (mid)
        { shape: 'sphere', size: [80, 155, 70], anchor: 'crown', pos: [0, -575, 90], color: 0x5c3a21 }, // long wavy back mass (to waist)
        { shape: 'box', size: [230, 30, 150], anchor: 'chest', pos: [0, 150, 20], color: 0xd9a916 },
        { shape: 'box', size: [230, 24, 150], anchor: 'hip', pos: [0, 40, 0], color: 'tint' },
      ],
      personality: { bobMul: 0.85, swayMul: 0.75, cadenceMul: 0.9 }, bubbles: ['📖', '🌹', '💛', '📚'] },

    // Snow White — blue bodice, silver-white skirt, black bob + red bow, red cape.
    { id: 'disney-princess/the-first', label: 'The First (blue bodice, black bob)', rig: 'humanoid',
      humanoid: { skin: 0xf7dcc0, body: 0x2b5faa, shoe: 0x2b5faa, legColor: 0xe7e9ec, emI: 0.05, gown: true },
      accessories: [
        { shape: 'cone', size: [290, 890, 0], anchor: 'hip', pos: [0, -300, 0], color: 0xe7e9ec }, // skirt (waist→floor)
        { shape: 'box', size: [230, 40, 170], anchor: 'chest', pos: [0, 170, 10], color: 0xf5f5f2 },
        { shape: 'sphere', size: [140, 118, 128], anchor: 'crown', pos: [0, -22, 4], sphereArc: [0, 6.283, 0, 2.0], color: 0x161412 }, // black bob (short, frames the face)
        { shape: 'sphere', size: [120, 70, 96], anchor: 'crown', pos: [0, -120, 30], color: 0x161412 }, // bob underside (curls in at the jaw)
        { shape: 'cone', size: [26, 40, 0], anchor: 'crown', pos: [-24, 70, -20], rot: [0, 0, -1.2], color: 'tint' },
        { shape: 'cone', size: [26, 40, 0], anchor: 'crown', pos: [24, 70, -20], rot: [0, 0, 1.2], color: 'tint' },
        { shape: 'cape', size: [230, 420, 360], anchor: 'back', pos: [0, -90, 25], rot: [0.15, 0, 0], color: 0xc62828, animate: { kind: 'sway', speed: 0.6, amp: 0.15 } }, // red cape
      ],
      personality: { bobMul: 1.05, swayMul: 0.9, cadenceMul: 1.0 }, bubbles: ['🍎', '🎶', '🐦', '🌼'] },

    // Aurora (Sleeping Beauty) — rose-pink petal-overskirt gown, gold-blonde hair.
    { id: 'disney-princess/sleeping', label: 'Sleeping (pink gown)', rig: 'humanoid',
      humanoid: { skin: 0xf8d5b8, body: 0xf2a8c4, shoe: 0xe888ac, legColor: 0xf2a8c4, emI: 0.06, gown: true },
      accessories: [
        { shape: 'cone', size: [320, 940, 0], anchor: 'hip', pos: [0, -320, 0], color: 0xf2a8c4 }, // gown (waist→floor)
        { shape: 'cone', size: [300, 650, 0], anchor: 'hip', pos: [0, -230, 0], color: 0xd97a9e }, // petal overskirt
        { shape: 'sphere', size: [138, 128, 120], anchor: 'crown', pos: [0, -8, 6], sphereArc: [0, 6.283, 0, 1.85], color: 0xe8b923 }, // gold-blonde crown cap
        { shape: 'sphere', size: [110, 168, 84], anchor: 'crown', pos: [0, -230, 66], color: 0xe8b923 }, // long smooth back mass (upper)
        { shape: 'sphere', size: [98, 178, 80], anchor: 'crown', pos: [0, -420, 82], color: 0xe8b923 }, // long smooth back mass (mid)
        { shape: 'sphere', size: [82, 165, 72], anchor: 'crown', pos: [0, -600, 90], color: 0xe8b923 }, // long smooth back mass (to waist)
        { shape: 'cylinder', size: [82, 82, 30], anchor: 'crown', pos: [0, 80, 0], color: 0xd4af37 }, // tiara
        { shape: 'box', size: [220, 20, 140], anchor: 'hip', pos: [0, 40, 0], color: 'tint' },
      ],
      personality: { bobMul: 0.7, swayMul: 0.6, cadenceMul: 0.75 }, bubbles: ['🌹', '💤', '🎂', '✨'] },

    // Merida (Brave) — visible legs (no gown); enormous wild red-orange hair, bow on back.
    // approx: hair corona trimmed to 6 spheres (<=10 primitives); curved bow via straight cylinders.
    { id: 'disney-princess/the-archer', label: 'The Archer (wild curls, bow)', rig: 'humanoid',
      humanoid: { skin: 0xf2c8a0, body: 0x1f5c4a, shoe: 0x3b2a1a, legColor: 0x1f5c4a, emI: 0.05, limbR: 0.95 },
      accessories: [
        { shape: 'sphere', size: [156, 140, 140], anchor: 'crown', pos: [0, -6, 0], sphereArc: [0, 6.283, 0, 2.0], color: 0xc1440e }, // huge frizzy crown mane
        { shape: 'sphere', size: 34, anchor: 'crown', pos: [-40, 10, 0], color: 0xc1440e }, // wild curl
        { shape: 'sphere', size: 30, anchor: 'crown', pos: [40, 20, -10], color: 0xc1440e }, // wild curl
        { shape: 'sphere', size: 32, anchor: 'crown', pos: [0, 40, -20], color: 0xc1440e }, // wild curl
        { shape: 'sphere', size: 28, anchor: 'crown', pos: [-30, -40, 40], color: 0xc1440e }, // wild curl
        { shape: 'sphere', size: 26, anchor: 'crown', pos: [35, -50, 45], color: 0xc1440e }, // wild curl
        { shape: 'sphere', size: [130, 165, 120], anchor: 'crown', pos: [0, -210, 55], color: 0xc1440e }, // long wild back mass (upper)
        { shape: 'sphere', size: [120, 170, 112], anchor: 'crown', pos: [0, -390, 66], color: 0xc1440e }, // long wild back mass (mid)
        { shape: 'sphere', size: [100, 160, 96], anchor: 'crown', pos: [0, -560, 76], color: 0xc1440e }, // long wild back mass (past waist)
        { shape: 'cylinder', size: [26, 26, 210], anchor: 'back', pos: [-40, -20, 60], rot: [0.2, 0, 0.5], color: 0x5a3a20 },
        { shape: 'cylinder', size: [10, 10, 420], anchor: 'handL', pos: [0, 0, 0], rot: [0, 0, 0.25], color: 0x3b2a1a },
        { shape: 'box', size: [220, 22, 150], anchor: 'hip', pos: [0, 30, 0], color: 'tint' },
      ],
      personality: { cadenceMul: 1.25, ampMul: 1.15, swayMul: 0.85 }, bubbles: ['🏹', '🐻', '🎯', '🍞'] },

    // Rapunzel (Tangled) — lavender corset, purple skirt, THE floor-length golden braid.
    // approx: braid trimmed to 7 tapering spheres (<=10 primitives) vs the doc's 8-10.
    { id: 'disney-princess/the-tower-girl', label: 'The Tower Girl (very long braid)', rig: 'humanoid',
      humanoid: { skin: 0xf6cba7, body: 0x9a7ac0, shoe: 0xe8cf5b, legColor: 0x7a4fa0, emI: 0.08, gown: true },
      accessories: [
        { shape: 'cone', size: [290, 920, 0], anchor: 'hip', pos: [0, -310, 0], color: 0x7a4fa0 }, // skirt (waist→floor)
        { shape: 'sphere', size: [140, 128, 120], anchor: 'crown', pos: [0, -12, 8], sphereArc: [0, 6.283, 0, 1.85], color: 0xf2cf5b }, // golden hair crown cap (volume on the head)
        { shape: 'sphere', size: [96, 150, 78], anchor: 'crown', pos: [-6, -220, 66], color: 0xf2cf5b }, // loose hair down the back (behind the braid)
        { shape: 'sphere', size: 24, anchor: 'crown', pos: [30, 0, -30], color: 0xf2cf5b }, // braid
        { shape: 'sphere', size: 22, anchor: 'crown', pos: [45, -110, -10], color: 0xf2cf5b }, // braid
        { shape: 'sphere', size: 20, anchor: 'crown', pos: [50, -230, 20], color: 0xf2cf5b },
        { shape: 'sphere', size: 17, anchor: 'crown', pos: [48, -350, 40], color: 0xf2cf5b },
        { shape: 'sphere', size: 14, anchor: 'crown', pos: [44, -470, 55], color: 0xf2cf5b },
        { shape: 'sphere', size: 11, anchor: 'crown', pos: [40, -580, 65], color: 0xf2cf5b },
        { shape: 'sphere', size: 32, anchor: 'chest', pos: [-95, 150, 0], color: 0x9a7ac0 },
        { shape: 'sphere', size: 32, anchor: 'chest', pos: [95, 150, 0], color: 0x9a7ac0 },
        { shape: 'cylinder', size: [18, 18, 60], anchor: 'crown', pos: [42, -120, -5], color: 'tint' },
      ],
      personality: { bobMul: 1.1, swayMul: 1.0, cadenceMul: 1.05, ampMul: 1.1 }, bubbles: ['🎨', '🖌️', '☀️', '💡'] },

    // Tiana (The Princess and the Frog) — sparkling emerald ballgown, lily-pad tiara.
    { id: 'disney-princess/the-frog-princess', label: 'The Frog Princess (emerald ballgown)', rig: 'humanoid',
      humanoid: { skin: 0x8a5a3c, body: 0x1a7a4c, shoe: 0x156b41, legColor: 0x1a7a4c, emI: 0.16, gown: true },
      accessories: [
        { shape: 'cone', size: [340, 950, 0], anchor: 'hip', pos: [0, -325, 0], color: 0x1a7a4c }, // ballgown (waist→floor)
        { shape: 'cone', size: [330, 220, 0], anchor: 'hip', pos: [0, -700, 0], color: 0xf2e2a0 },
        { shape: 'sphere', size: [138, 132, 118], anchor: 'crown', pos: [0, 2, 0], sphereArc: [0, 6.283, 0, 1.8], color: 0x1c1a17 }, // dark upswept crown cap
        { shape: 'sphere', size: [70, 96, 70], anchor: 'crown', pos: [0, 60, -30], color: 0x1c1a17 }, // upswept front pouf
        { shape: 'sphere', size: 44, anchor: 'crown', pos: [0, -50, -60], color: 0x1c1a17 }, // gathered bun (upswept, at the nape)
        { shape: 'cylinder', size: [70, 70, 22], anchor: 'crown', pos: [30, 70, 0], color: 0x2fae6c },
        { shape: 'sphere', size: 14, anchor: 'crown', pos: [30, 82, 0], color: 0xf5f2ea },
        { shape: 'box', size: [200, 16, 130], anchor: 'chest', pos: [0, 175, 20], color: 0x8fd0e8 },
        { shape: 'box', size: [220, 22, 150], anchor: 'hip', pos: [0, 40, 0], color: 'tint' },
      ],
      personality: { cadenceMul: 1.15, bobMul: 1.0, ampMul: 1.05 }, bubbles: ['🍽️', '🌟', '💚', '🍳'] },

    // Mulan — visible armored legs (no gown); dark green-bronze plate, flat topknot, back sword.
    { id: 'disney-princess/the-warrior', label: 'The Warrior (armor, dark topknot)', rig: 'humanoid',
      humanoid: { skin: 0xe8b98c, body: 0x33422e, shoe: 0x2a2a26, legColor: 0x2b2b26, emI: 0.10, limbR: 1.0, steel: true },
      accessories: [
        { shape: 'box', size: [240, 252, 16], anchor: 'chest', pos: [0, 120, 80], color: 0x33422e },
        { shape: 'box', size: [240, 12, 18], anchor: 'chest', pos: [0, 175, 82], color: 0x9a7a3a },
        { shape: 'sphere', size: [132, 118, 122], anchor: 'crown', pos: [0, -6, 4], sphereArc: [0, 6.283, 0, 1.75], color: 0x1c1a17 }, // hair pulled flat + close (no side volume)
        { shape: 'sphere', size: 42, anchor: 'crown', pos: [0, 40, -60], color: 0x1c1a17 }, // warrior topknot bun
        { shape: 'box', size: [28, 340, 16], anchor: 'back', pos: [-30, -20, 50], rot: [0.15, 0, 0.5], color: 0xc7c9cc },
        { shape: 'cylinder', size: [18, 18, 70], anchor: 'back', pos: [-95, 130, 55], rot: [0.15, 0, 0.5], color: 0x9a7a3a },
        { shape: 'box', size: [220, 24, 150], anchor: 'hip', pos: [0, 30, 0], color: 'tint' },
      ],
      personality: { swayMul: 0.55, cadenceMul: 1.1, bobMul: 0.8 }, bubbles: ['⚔️', '🐉', '🎖️', '🔥'] },
  ],
};

export default pack;

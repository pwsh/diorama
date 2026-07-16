// Video Games ▸ Pokémon — franchise pack (dynamic-import only, default
// loaded:false). Creature-mons (mix of humanoid + quadruped rigs, pet:true so
// they behave like pets) plus one full-scale human trainer. Colour + silhouette
// only, no likenesses. Source: docs/avatars/video-games/pokemon.md.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'pokemon', version: 1, label: 'Pokémon',
  path: ['Video Games', 'Pokémon'], builtin: true, franchise: true,
  avatars: [
    // Pikachu — biped, tailbone zigzag tail
    { id: 'pokemon/pkmn-electric-mouse', label: 'Electric Mouse (yellow, red cheeks)', rig: 'humanoid',
      humanoid: { sk: 0.42, headR: 116, limbR: 0.85, skin: 0xf6d94e, body: 0xf6d94e, legColor: 0xf6d94e, shoe: 0xf6d94e, eyes: 'dots', emI: 0.05, armL: 0.6, legL: 0.75, footMul: [1.25, 0.7, 1.2] },
      accessories: [
        { shape: 'cone', size: [17, 190, 17], anchor: 'crown', pos: [-45, 40, 0], rot: [-0.2, 0, -0.25], color: 0xf6d94e },
        { shape: 'cone', size: [17, 190, 17], anchor: 'crown', pos: [45, 40, 0], rot: [-0.2, 0, 0.25], color: 0xf6d94e },
        { shape: 'cone', size: [17, 50, 17], anchor: 'crown', pos: [-63, 165, 0], rot: [-0.2, 0, -0.25], color: 0x181818 },
        { shape: 'cone', size: [17, 50, 17], anchor: 'crown', pos: [63, 165, 0], rot: [-0.2, 0, 0.25], color: 0x181818 },
        { shape: 'sphere', size: [35, 35, 9], anchor: 'face', pos: [-55, -5, -5], color: 0xd0262c },
        { shape: 'sphere', size: [35, 35, 9], anchor: 'face', pos: [55, -5, -5], color: 0xd0262c },
        { shape: 'box', size: [140, 26, 10], anchor: 'back', pos: [0, 40, 5], color: 0x4a3222 },
        { shape: 'box', size: [140, 26, 10], anchor: 'back', pos: [0, 5, 5], color: 0x4a3222 },
        { shape: 'box', size: [30, 130, 20], anchor: 'tailbone', pos: [0, -60, 60], rot: [1.0, 0, 0.4], color: 0x6b4a2e }, // approx: lightning tail as bent box-chain
        { shape: 'box', size: [26, 120, 18], anchor: 'tailbone', pos: [0, -150, 150], rot: [1.4, 0, -0.4], color: 0xf6d94e },
      ],
      pet: true, personality: { bobMul: 1.15, cadenceMul: 1.3, ampMul: 0.8 }, bubbles: ['⚡', '😊', '🔋', '❗'] },
    // Charmander — biped, emissive flame tail
    { id: 'pokemon/pkmn-fire-lizard', label: 'Fire Lizard (orange, flame tail)', rig: 'humanoid',
      humanoid: { sk: 0.48, headR: 100, limbR: 0.8, skin: 0xf0752a, body: 0xf0752a, legColor: 0xf0752a, shoe: 0xf2e6c8, eyes: 'dots', armL: 0.55, legL: 0.8, footMul: [1.1, 0.75, 1.15] },
      accessories: [
        { shape: 'box', size: [90, 200, 10], anchor: 'chest', pos: [0, -20, -4], color: 0xf2e6c8 },
        { shape: 'sphere', size: 10, anchor: 'crown', pos: [0, 5, 20], color: 0xcf6420 },
        { shape: 'sphere', size: 10, anchor: 'crown', pos: [0, 0, 40], color: 0xcf6420 },
        { shape: 'cylinder', size: [10, 14, 220], anchor: 'tailbone', pos: [0, -50, 100], rot: [1.1, 0, 0], color: 0xf0752a }, // approx: static tail (no jointed sway)
        { shape: 'cone', size: [27, 70, 27], anchor: 'tailbone', pos: [0, 30, 210], rot: [0.3, 0, 0], color: 0xffb020, emissive: 0xff7a1a, emissiveIntensity: 0.4 },
      ],
      pet: true, personality: { cadenceMul: 1.1, ampMul: 0.85 }, bubbles: ['🔥', '😊', '💤', '😠'] },
    // Bulbasaur — quadruped, back bulb
    { id: 'pokemon/pkmn-seed-dino', label: 'Seed Dino (teal-green, back bulb)', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.62, bodyLen: 620, bodyW: 210, bodyH: 230, legLen: 0.65, neckLen: 0, headR: 108, headScale: [1.15, 0.85, 1.0], ears: 'none', tail: 'none', snout: 0, coat: 0x5fa88e, belly: 0x9fd6b0, earColor: 0x5fa88e, snoutColor: 0x5fa88e },
      accessories: [
        { shape: 'sphere', size: 75, anchor: 'qback', pos: [0, 20, 0], color: 0x4c9c5c },
        { shape: 'sphere', size: [17, 12, 8], anchor: 'qback', pos: [-40, 10, 30], color: 0x2e6e3a },
        { shape: 'sphere', size: [17, 12, 8], anchor: 'qback', pos: [40, 10, -20], color: 0x2e6e3a },
        { shape: 'cone', size: [9, 45, 9], anchor: 'qback', pos: [-15, 80, 0], rot: [0, 0, -0.3], color: 0x6cc46a },
        { shape: 'cone', size: [9, 45, 9], anchor: 'qback', pos: [15, 80, 0], rot: [0, 0, 0.3], color: 0x6cc46a },
      ],
      personality: { bobMul: 0.75, swayMul: 0.7, cadenceMul: 0.7, ampMul: 0.8 }, bubbles: ['🌱', '☀️', '😌', '🍃'] },
    // Squirtle — biped, shell
    { id: 'pokemon/pkmn-shell-turtle', label: 'Shell Turtle (blue, brown shell)', rig: 'humanoid',
      humanoid: { sk: 0.44, headR: 96, limbR: 0.85, skin: 0x8fd0e8, body: 0x8fd0e8, legColor: 0x8fd0e8, shoe: 0x8fd0e8, eyes: 'dots', armL: 0.55, legL: 0.75, footMul: [1.2, 0.7, 1.2] },
      accessories: [
        { shape: 'sphere', size: [115, 80, 115], anchor: 'back', pos: [0, 10, 15], color: 0x6b4a2e },
        { shape: 'sphere', size: [90, 20, 90], anchor: 'back', pos: [0, -70, 15], color: 0xf0e0a0 },
        { shape: 'box', size: [230, 14, 8], anchor: 'back', pos: [0, -55, 20], color: 0xf5f2ea },
        { shape: 'sphere', size: [45, 35, 10], anchor: 'chest', pos: [0, -20, -4], color: 0xe8dcc0 },
      ],
      pet: true, personality: { bobMul: 0.9, swayMul: 0.8, ampMul: 0.8 }, bubbles: ['💧', '😌', '🐢', '💤'] },
    // Trainer — the one full human; green cuffs tint accent
    { id: 'pokemon/pkmn-trainer', label: 'Rookie Trainer (red cap, blue jacket)', rig: 'humanoid',
      humanoid: { skin: 0xe8b48c, body: 0x2f6fd1, legColor: 0xaed4e8, shoe: 0x1c1c1e, eyes: 'almond' },
      accessories: [
        { shape: 'sphere', size: [100, 45, 100], anchor: 'crown', pos: [0, -10, -10], rot: [0.3, 0, 0], color: 0xd42020 },
        { shape: 'sphere', size: [35, 35, 10], anchor: 'crown', pos: [0, -20, -85], color: 0xf5f5f0 },
        { shape: 'box', size: [180, 30, 8], anchor: 'chest', pos: [0, 55, 0], color: 0xf5f5f0 },
        { shape: 'box', size: [160, 220, 90], anchor: 'back', pos: [0, 10, 0], color: 0x3a7a3a },
        { shape: 'box', size: [180, 22, 8], anchor: 'hip', color: 0x5c3a21 },
        { shape: 'box', size: [26, 26, 8], anchor: 'hip', pos: [0, 0, -6], color: 0x9a9a96 },
        { shape: 'box', size: [40, 20, 40], anchor: 'handL', color: 'accent' },
        { shape: 'box', size: [40, 20, 40], anchor: 'handR', color: 'accent' },
      ],
      personality: { cadenceMul: 1.05 }, bubbles: ['🎒', '🗺️', '😃', '⭐'] },
    // Eevee — quadruped, cream collar
    { id: 'pokemon/pkmn-evolution-fox', label: 'Evolution Fox (brown, cream collar)', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.55, bodyLen: 560, bodyW: 190, bodyH: 210, legLen: 0.9, neckLen: 100, headR: 95, headScale: [1.0, 1.0, 1.05], ears: 'pointy', tail: 'tuft', tailLen: 1.3, snout: 0.55, coat: 0x8a5a34, belly: 0xefe3c8, earColor: 0x5c3c22, snoutColor: 0x8a5a34 },
      accessories: [
        { shape: 'sphere', size: 50, anchor: 'qneck', pos: [0, 30, 0], color: 0xefe3c8 },
        { shape: 'sphere', size: 45, anchor: 'qneck', pos: [-55, 10, 0], color: 0xefe3c8 },
        { shape: 'sphere', size: 45, anchor: 'qneck', pos: [55, 10, 0], color: 0xefe3c8 },
        { shape: 'sphere', size: 45, anchor: 'qneck', pos: [0, -10, 40], color: 0xefe3c8 },
        { shape: 'sphere', size: 20, anchor: 'qrump', pos: [0, 40, 60], color: 0xefe3c8 }, // approx: cream tail-tip won't track sway
      ],
      personality: { cadenceMul: 1.1, ampMul: 0.95 }, bubbles: ['✨', '❓', '😊', '🍃'] },
    // Jigglypuff — near-spherical biped
    { id: 'pokemon/pkmn-balloon-imp', label: 'Balloon Imp (pink, huge eyes)', rig: 'humanoid',
      humanoid: { sk: 0.45, headR: 148, limbR: 0.6, skin: 0xf2a0c0, body: 0xf2a0c0, legColor: 0xf2a0c0, shoe: 0xf2a0c0, eyes: 'almond', emI: 0.05, armL: 0.4, legL: 0.35, footMul: [0.85, 0.6, 0.8] }, // approx: sk bumped 0.34→0.45 (floor)
      accessories: [
        { shape: 'cone', size: [13, 55, 13], anchor: 'head', pos: [-90, 60, 0], rot: [0, 0, -0.4], color: 0xf2a0c0 },
        { shape: 'cone', size: [13, 55, 13], anchor: 'head', pos: [90, 60, 0], rot: [0, 0, 0.4], color: 0xf2a0c0 },
        { shape: 'cone', size: [13, 20, 13], anchor: 'head', pos: [-90, 45, 0], rot: [0, 0, -0.4], color: 0x1c1c1c },
        { shape: 'cone', size: [13, 20, 13], anchor: 'head', pos: [90, 45, 0], rot: [0, 0, 0.4], color: 0x1c1c1c },
        { shape: 'cylinder', size: [7, 7, 70], anchor: 'crown', pos: [0, 20, -20], rot: [-0.6, 0, 0], color: 0xf2a0c0 },
      ],
      pet: true, personality: { bobMul: 1.5, swayMul: 1.3, cadenceMul: 0.85, ampMul: 0.55 }, bubbles: ['🎤', '🎵', '😴', '💗'] },
    // Meowth — quadruped, forehead coin
    { id: 'pokemon/pkmn-coin-cat', label: 'Coin Cat (cream, gold coin)', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.52, bodyLen: 600, bodyW: 195, bodyH: 215, legLen: 0.95, neckLen: 40, headR: 100, headScale: [1.05, 1.0, 1.0], ears: 'pointy', tail: 'curl', tailLen: 1.15, snout: 0.45, coat: 0xf2ecd0, belly: 0xf7f2e2, earColor: 0x1c1c1c, snoutColor: 0xf2ecd0 }, // approx: black-exterior/brown-interior ear → single tone; brown paws unsupported
      accessories: [
        { shape: 'cylinder', size: [35, 35, 14], anchor: 'qhead', pos: [0, 55, -70], rot: [1.4, 0, 0], color: 0xd4af17, emissive: 0xd4af17, emissiveIntensity: 0.15 },
        { shape: 'box', size: [14, 14, 6], anchor: 'qhead', pos: [0, 78, -70], color: 0x8a6a10 },
      ],
      personality: { bobMul: 0.95, swayMul: 1.15, cadenceMul: 1.1, ampMul: 0.9 }, bubbles: ['💰', '😼', '✨', '❗'] },
  ],
};

export default pack;

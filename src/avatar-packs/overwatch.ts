// Video Games ▸ Overwatch — franchise pack (dynamic-import only).
// Stylized geometric homage: bold hero color-blocking + emissive tech accents,
// no likeness/logos. Source doc: docs/avatars/video-games/overwatch.md.
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'overwatch', version: 2, label: 'Overwatch',
  path: ['Video Games', 'Overwatch'], builtin: true, franchise: true,
  avatars: [
    // Tracer / Lena Oxton — brown bomber jacket, orange boots, chronal-accelerator glow.
    { id: 'overwatch/chrono-pilot', label: 'Chrono pilot (brown bomber jacket, orange accents)', rig: 'humanoid',
      humanoid: { sk: 0.92, headR: 118, headShape: 'sphere', skin: 0xdba876, body: 0x6b4a35, legColor: 0xc9b896, shoe: 0xd2691e,
        eyes: 'dots', emI: 0.1, hands: 'box', limbR: 0.9, armL: 0.95, legL: 0.95 },
      accessories: [
        { shape: 'box', size: [130, 30, 40], anchor: 'crown', pos: [0, -10, -20], color: 0xd98e2b },
        { shape: 'cone', size: [10, 40], anchor: 'crown', pos: [-30, 20, 10], color: 0x4a3222 },
        { shape: 'cone', size: [10, 40], anchor: 'crown', pos: [30, 20, 10], color: 0x4a3222 },
        { shape: 'cylinder', size: [35, 35, 25], anchor: 'chest', pos: [0, 10, -14], color: 0x4dfffe, emissiveIntensity: 0.5 },
        { shape: 'box', size: [30, 180, 10], anchor: 'back', pos: [0, 0, 10], rot: [0, 0, 0.5], color: 0x3f2c20 },
        { shape: 'box', size: [20, 40, 70], anchor: 'handL', pos: [0, 10, -10], color: 0x5a5a5c },
        { shape: 'box', size: [20, 40, 70], anchor: 'handR', pos: [0, 10, -10], color: 0x5a5a5c }],
      personality: { bobMul: 1.2, swayMul: 1.1, cadenceMul: 1.35, ampMul: 1.1 },
      bubbles: ['⏱️', '😄', '🔫', '✨'] },
    // D.Va / Hana Song — blue flight suit, pink accents + bunny emblem, ponytail.
    { id: 'overwatch/mech-pilot', label: 'Mech pilot (blue flight suit, pink accents)', rig: 'humanoid',
      humanoid: { sk: 0.9, headR: 116, headShape: 'sphere', skin: 0xe0b190, body: 0x2a5aa0, legColor: 0x1c3f70, shoe: 0xecebe6,
        eyes: 'almond', emI: 0.1, hands: 'box', limbR: 0.9, armL: 0.92, legL: 0.92 },
      accessories: [
        { shape: 'box', size: [40, 40, 180], anchor: 'crown', pos: [0, 10, 60], rot: [0.4, 0, 0], color: 0x2b211d },
        { shape: 'sphere', size: [7, 7, 2], anchor: 'face', pos: [-30, 0, -10], color: 0xff6fae },
        { shape: 'sphere', size: [7, 7, 2], anchor: 'face', pos: [30, 0, -10], color: 0xff6fae },
        { shape: 'cylinder', size: [16, 16, 4], anchor: 'chest', pos: [0, 10, -12], color: 0xff6fae },
        { shape: 'box', size: [80, 60, 10], anchor: 'chest', pos: [0, -20, -10], color: 0xecebe6 },
        { shape: 'box', size: [60, 20, 10], anchor: 'hip', pos: [50, -20, -6], color: 0xff6fae },
        { shape: 'box', size: [20, 40, 60], anchor: 'handL', pos: [0, 10, -10], color: 0x6a6a6a },
        { shape: 'box', size: [20, 40, 60], anchor: 'handR', pos: [0, 10, -10], color: 0x6a6a6a }],
      personality: { bobMul: 1.15, swayMul: 1.0, cadenceMul: 1.1, ampMul: 0.95 },
      bubbles: ['🎮', '💗', '🐰', '💥'] },
    // Reinhardt Wilhelm — towering silver plate armor, red crest, rocket-hammer.
    { id: 'overwatch/crusader-knight', label: 'Crusader knight (silver plate armor, red crest)', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 134, headShape: 'sphere', skin: 0xc7c9cc, body: 0xc7c9cc, legColor: 0xa8abb0, shoe: 0x6b6b6c,
        eyes: 'visor', emI: 0.15, steel: true, hands: 'box', limbR: 1.35, armL: 1.1, legL: 1.0, footMul: [1.25, 1.15, 1.25] },
      accessories: [
        { shape: 'box', size: [16, 60, 150], anchor: 'crown', pos: [0, 20, 0], color: 0x8a1f1f },
        { shape: 'box', size: [90, 75, 70], anchor: 'shoulderL', color: 0xc7c9cc },
        { shape: 'box', size: [90, 75, 70], anchor: 'shoulderR', color: 0xc7c9cc },
        { shape: 'cylinder', size: [20, 20, 8], anchor: 'chest', pos: [0, 10, -14], color: 0xd4af37, emissiveIntensity: 0.4 },
        { shape: 'cylinder', size: [20, 20, 60], anchor: 'back', pos: [-40, 0, 20], color: 0x4a4a4a },
        { shape: 'cylinder', size: [20, 20, 60], anchor: 'back', pos: [40, 0, 20], color: 0x4a4a4a },
        { shape: 'cylinder', size: [10, 10, 110], anchor: 'handR', pos: [0, 40, 0], color: 0x4a4a4a },
        { shape: 'box', size: [90, 70, 70], anchor: 'handR', pos: [0, 120, 0], color: 0xb0b3b6 },
        { shape: 'box', size: [70, 100, 30], anchor: 'handL', pos: [0, 20, -20], color: 0xb0b3b6 }],
      personality: { bobMul: 0.55, swayMul: 0.3, cadenceMul: 0.6, ampMul: 1.3 },
      bubbles: ['🛡️', '🔨', '⚡', '👴'] },
    // Widowmaker / Amélie Lacroix — pale blue skin, violet catsuit, sniper rifle.
    { id: 'overwatch/shadow-sniper', label: 'Shadow sniper (pale blue skin, violet catsuit)', rig: 'humanoid',
      humanoid: { sk: 0.98, headR: 120, headShape: 'sphere', skin: 0x8fa8c2, body: 0x5b3f7a, legColor: 0x1c1c1e, shoe: 0x141414,
        eyes: 'almond', emI: 0.15, hands: 'box', limbR: 0.85, armL: 0.95, legL: 1.0 },
      accessories: [
        { shape: 'box', size: [30, 30, 200], anchor: 'crown', pos: [0, 0, 50], rot: [0.3, 0, 0], color: 0x1c1e2e },
        { shape: 'box', size: [60, 45, 50], anchor: 'shoulderL', color: 0x1c1c1e },
        { shape: 'box', size: [30, 38, 20], anchor: 'hip', pos: [70, -12, -8], color: 0x1c1c1e },
        { shape: 'cylinder', size: [24, 24, 50], anchor: 'handL', pos: [0, 10, 0], color: 0x5a5a5c },
        { shape: 'box', size: [24, 24, 300], anchor: 'handR', pos: [0, 60, -20], color: 0x3a3a3c }],
      personality: { bobMul: 0.5, swayMul: 0.4, cadenceMul: 0.85, ampMul: 0.6 },
      bubbles: ['🎯', '🕷️', '💜', '😐'] },
    // Genji Shimada — silver-white armor traced with green energy, back-mounted katana.
    { id: 'overwatch/cyber-ninja', label: 'Cyber ninja (silver armor, green energy lines)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 118, headShape: 'sphere', skin: 0xdcdcd8, body: 0xdcdcd8, legColor: 0xb8b8b4, shoe: 0x2a2a2c,
        eyes: 'redvisor', emI: 0.3, steel: true, hands: 'box', limbR: 0.85, armL: 1.0, legL: 1.05 },
      accessories: [
        // approx: eyes:'redvisor' geometry, canon glow is green — parked eye-color-override gap.
        { shape: 'box', size: [20, 90, 6], anchor: 'chest', pos: [0, 0, -12], color: 0x2ecc71, emissiveIntensity: 0.5 },
        { shape: 'box', size: [10, 60, 6], anchor: 'shoulderL', pos: [0, -30, -8], color: 0x2ecc71, emissiveIntensity: 0.5 },
        { shape: 'box', size: [10, 60, 6], anchor: 'shoulderR', pos: [0, -30, -8], color: 0x2ecc71, emissiveIntensity: 0.5 },
        { shape: 'box', size: [20, 20, 120], anchor: 'crown', pos: [0, 0, 60], rot: [0.3, 0, 0], color: 0x1a1a1a },
        { shape: 'cylinder', size: [12, 12, 300], anchor: 'back', pos: [30, 20, 20], rot: [0, 0, 0.4], color: 0x2e2e30 },
        { shape: 'box', size: [90, 20, 10], anchor: 'chest', pos: [0, 40, -8], color: 0x2a2a2a }],
      personality: { bobMul: 0.5, swayMul: 0.35, cadenceMul: 1.2, ampMul: 0.7 },
      bubbles: ['⚔️', '🍃', '🟢', '🥷'] },
    // Mercy / Angela Ziegler — white-and-gold Valkyrie suit, wings, floating halo, staff.
    { id: 'overwatch/guardian-medic', label: 'Guardian medic (white & gold suit, wings)', rig: 'humanoid',
      humanoid: { sk: 0.95, headR: 116, headShape: 'sphere', skin: 0xe7c3a0, body: 0xf0ece0, legColor: 0xd4af37, shoe: 0xf0ece0,
        eyes: 'almond', emI: 0.1, hands: 'box', limbR: 0.85, armL: 0.95, legL: 0.95 },
      accessories: [
        { shape: 'box', size: [130, 50, 130], anchor: 'crown', pos: [0, 0, 0], color: 0xf0c93d },
        // approx: no ring/torus primitive — the halo is a glowing flattened disc
        { shape: 'cylinder', size: [40, 40, 8], anchor: 'crown', pos: [0, 60, 0], color: 0xffd700, emissiveIntensity: 0.5 },
        { shape: 'box', size: [30, 300, 180], anchor: 'back', pos: [-90, 0, 10], rot: [0, -0.3, 0.2], color: 0xf5f0e6 },
        { shape: 'box', size: [30, 300, 180], anchor: 'back', pos: [90, 0, 10], rot: [0, 0.3, -0.2], color: 0xf5f0e6 },
        { shape: 'box', size: [120, 10, 8], anchor: 'chest', pos: [0, 40, -10], color: 0xd4af37 },
        { shape: 'cylinder', size: [8, 8, 300], anchor: 'handR', pos: [0, 120, 0], color: 0xd4af37 },
        { shape: 'sphere', size: 14, anchor: 'handR', pos: [0, 270, 0], color: 0xffe066, emissiveIntensity: 0.5 }],
      personality: { bobMul: 0.8, swayMul: 0.6, cadenceMul: 0.95, ampMul: 0.75 },
      bubbles: ['😇', '💛', '🩹', '🕊️'] },
    // Roadhog / Mako Rutledge — shirtless brute, pig-snout gas mask, hook & chain.
    { id: 'overwatch/junker-brute', label: 'Junker brute (gas mask, hook & chain)', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 128, headShape: 'box', skin: 0xb0895f, body: 0xb0895f, legColor: 0x6b6b62, shoe: 0x3a2f24,
        eyes: 'slit', emI: 0, hands: 'box', limbR: 1.5, armL: 1.05, legL: 0.9, footMul: [1.2, 1.1, 1.2] },
      posture: { pitch: 0.08 },
      accessories: [
        { shape: 'box', size: [50, 50, 60], anchor: 'face', pos: [0, -20, -30], color: 0x6b6f66 },
        { shape: 'cone', size: [8, 26], anchor: 'face', pos: [-25, -30, -30], rot: [Math.PI, 0, 0], color: 0xd8d0c0 },
        { shape: 'cone', size: [8, 26], anchor: 'face', pos: [25, -30, -30], rot: [Math.PI, 0, 0], color: 0xd8d0c0 },
        { shape: 'cylinder', size: [10, 10, 20], anchor: 'face', pos: [-45, -15, -20], color: 0x3a3a3a },
        { shape: 'cylinder', size: [10, 10, 20], anchor: 'face', pos: [45, -15, -20], color: 0x3a3a3a },
        { shape: 'box', size: [30, 180, 10], anchor: 'chest', pos: [-35, 0, -8], rot: [0, 0, 0.4], color: 0x2a1f18 },
        { shape: 'box', size: [30, 180, 10], anchor: 'chest', pos: [35, 0, -8], rot: [0, 0, -0.4], color: 0x2a1f18 },
        { shape: 'box', size: [50, 30, 50], anchor: 'handL', pos: [0, 20, 0], color: 0x2a1f18 },
        // approx: no curved/hook primitive — a bent cone stands in for the chain-hook
        { shape: 'cone', size: [20, 80], anchor: 'handL', pos: [0, -40, -30], rot: [-1.2, 0, 0], color: 0x5a5a5c },
        { shape: 'box', size: [60, 60, 120], anchor: 'handR', pos: [0, 20, -10], color: 0x3a3a3a }],
      personality: { bobMul: 0.6, swayMul: 0.5, cadenceMul: 0.6, ampMul: 1.1 },
      bubbles: ['🐷', '⛓️', '💀', '😤'] },
    // Winston — genius gorilla, round glasses, white lab-vest, Tesla Cannon.
    { id: 'overwatch/genius-primate', label: 'Genius primate (dark fur, lab vest, glasses)', rig: 'humanoid',
      humanoid: { sk: 1.2, headR: 132, headShape: 'sphere', skin: 0x2b2b2e, body: 0x2b2b2e, legColor: 0x2b2b2e, shoe: 0x2b2b2e,
        eyes: 'dots', emI: 0, hands: 'sphere', limbR: 1.45, armL: 1.4, legL: 0.8, footMul: [1.3, 1.0, 1.3] },
      posture: { pitch: 0.15 },
      accessories: [
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'face', pos: [-30, 4, -12], color: 0x1c1c1c },
        { shape: 'cylinder', size: [16, 16, 6], anchor: 'face', pos: [30, 4, -12], color: 0x1c1c1c },
        { shape: 'box', size: [24, 6, 6], anchor: 'face', pos: [0, 4, -12], color: 0x1c1c1c },
        { shape: 'box', size: [160, 200, 12], anchor: 'chest', pos: [0, -20, -8], color: 0xe8e4da },
        { shape: 'box', size: [180, 120, 150], anchor: 'hip', pos: [0, -20, 0], color: 0x8a7c5a },
        { shape: 'cylinder', size: [20, 20, 50], anchor: 'back', pos: [-40, 0, 20], color: 0x3a3a3c },
        { shape: 'cylinder', size: [20, 20, 50], anchor: 'back', pos: [40, 0, 20], color: 0x3a3a3c },
        { shape: 'box', size: [60, 60, 140], anchor: 'handR', pos: [0, 20, -10], color: 0x5a5a5c }],
      personality: { bobMul: 0.75, swayMul: 0.4, cadenceMul: 0.7, ampMul: 1.3 },
      bubbles: ['🦍', '🔬', '🤓', '⚡'] },
  ],
};

export default pack;

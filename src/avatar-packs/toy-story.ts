// Cartoons ▸ Toy Story — franchise pack (dynamic-import only, default
// loaded:false). Stylized geometric toon homage of the core "toybox" ensemble:
// color + silhouette only, no logos/likenesses. Four humanoid bipeds (incl. Rex,
// a bipedal dino on the humanoid rig) + three quadrupeds (pet:true). No shared
// base — every member is a different toy product. Descriptive-generic labels.
// Source doc: docs/avatars/cartoons/toy-story.md
import type { AvatarPackDef } from '../avatars.js';

const pack: AvatarPackDef = {
  id: 'toy-story', version: 2, label: 'Toy Story',
  path: ['Cartoons', 'Toy Story'], builtin: true, franchise: true,
  avatars: [
    // Woody — pull-string cowboy doll, golden plaid shirt, brown vest + hat, badge.
    { id: 'toy-story/woody', label: 'Cowboy doll (yellow plaid, brown vest)', rig: 'humanoid',
      humanoid: { sk: 1, headR: 126, headShape: 'sphere', limbR: 0.95, skin: 0xe8b48c, body: 0xf0c93c,
        shoe: 0x6b4423, legColor: 0x2b4a7a, emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false },
      accessories: [
        { shape: 'sphere', size: [132, 70, 132], anchor: 'crown', pos: [0, 10, 0], rot: [0.3, 0, 0], color: 0x7a4a26, sphereArc: [0, 6.283, 0, 1.0] }, // hat crown
        { shape: 'cylinder', size: [150, 150, 10], anchor: 'crown', pos: [0, -14, 0], rot: [0.3, 0, 0], color: 0x7a4a26 }, // brim
        { shape: 'box', size: [60, 180, 14], anchor: 'chest', pos: [-70, 10, -12], color: 0x6b4423 }, // vest panel L
        { shape: 'box', size: [60, 180, 14], anchor: 'chest', pos: [70, 10, -12], color: 0x6b4423 }, // vest panel R
        { shape: 'box', size: [16, 16, 6], anchor: 'chest', pos: [-50, 40, -14], color: 0xd4af37 }, // sheriff star badge
        { shape: 'box', size: [70, 30, 14], anchor: 'neck', pos: [0, 0, -10], color: 0xc0392b }, // red bandana
        { shape: 'box', size: [230, 26, 160], anchor: 'hip', pos: [0, 0, 0], color: 0x5a3a1e }, // belt
        { shape: 'box', size: [30, 26, 10], anchor: 'hip', pos: [0, 0, -84], color: 0xc7ccd1 }, // buckle
      ],
      // approx: bandana dot print → solid red per the "fabric prints = dominant solid color" convention.
      personality: { bobMul: 1.0, swayMul: 1.0, cadenceMul: 1.0, ampMul: 1.0 },
      bubbles: ['🤠', '⭐', '🐴', '🔫'] },

    // Buzz Lightyear — space-ranger action figure, white/purple/green suit, wings.
    { id: 'toy-story/buzz', label: 'Space ranger (white/purple/green suit)', rig: 'humanoid',
      humanoid: { sk: 1.02, headR: 128, headShape: 'sphere', limbR: 1.0, skin: 0xe8b48c, body: 0xf2f2ee,
        shoe: 0x3fae49, legColor: 0xf2f2ee, emI: 0.12, hands: 'box', eyes: 'dots', steel: false },
      accessories: [
        { shape: 'sphere', size: [145, 120, 145], anchor: 'crown', pos: [0, 20, 0], rot: [0.4, 0, 0], color: 0x6b3fa0, sphereArc: [0, 6.283, 0, 1.6] }, // purple hood
        { shape: 'box', size: [120, 160, 14], anchor: 'back', pos: [-80, 0, 10], rot: [0, 0.3, 0], color: 0xf2f2ee, animate: { kind: 'flap', speed: 1.2, amp: 0.3 } }, // wing L
        { shape: 'box', size: [120, 160, 14], anchor: 'back', pos: [80, 0, 10], rot: [0, -0.3, 0], color: 0xf2f2ee, animate: { kind: 'flap', speed: 1.2, amp: -0.3 } }, // wing R (mirrored amp)
        { shape: 'box', size: [30, 40, 10], anchor: 'back', pos: [-140, 60, 10], color: 0x3fae49, emissive: 0x3fae49, emissiveIntensity: 0.2 }, // green tip L
        { shape: 'box', size: [30, 40, 10], anchor: 'back', pos: [140, 60, 10], color: 0x3fae49, emissive: 0x3fae49, emissiveIntensity: 0.2 }, // green tip R
        { shape: 'box', size: [80, 70, 10], anchor: 'chest', pos: [0, -10, -12], color: 0x3fae49 }, // control panel
        { shape: 'sphere', size: 8, anchor: 'chest', pos: [0, -10, -18], color: 0xc0392b }, // panel button
        { shape: 'box', size: [36, 30, 36], anchor: 'shoulderL', pos: [0, 20, 0], color: 0x3fae49 }, // shoulder pad L
        { shape: 'box', size: [36, 30, 36], anchor: 'shoulderR', pos: [0, 20, 0], color: 0x3fae49 }, // shoulder pad R
        { shape: 'cone', size: [9, 24], anchor: 'handR', pos: [0, -34, -18], color: 0xd8302a, emissive: 0xd8302a, emissiveIntensity: 0.3 }, // wrist laser
      ],
      personality: { bobMul: 0.9, swayMul: 0.8, cadenceMul: 0.95, ampMul: 0.95 },
      bubbles: ['🚀', '⭐', '🛸', '✨'] },

    // Jessie — yodeling cowgirl doll, red hat + ponytail, white/yellow shirt, chaps.
    { id: 'toy-story/jessie', label: 'Cowgirl doll (red hat, yodeling)', rig: 'humanoid',
      humanoid: { sk: 0.94, headR: 122, headShape: 'sphere', limbR: 0.85, skin: 0xe8b48c, body: 0xf2f2ee,
        shoe: 0x6b4423, legColor: 0x2b4a7a, emI: 0.05, hands: 'sphere', eyes: 'dots', steel: false },
      accessories: [
        { shape: 'sphere', size: [128, 66, 128], anchor: 'crown', pos: [0, 10, 0], rot: [0.3, 0, 0], color: 0xb8341f, sphereArc: [0, 6.283, 0, 1.0] }, // red hat crown
        { shape: 'cylinder', size: [145, 145, 10], anchor: 'crown', pos: [0, -14, 0], rot: [0.3, 0, 0], color: 0xb8341f }, // brim
        { shape: 'cylinder', size: [30, 16, 180], anchor: 'crown', pos: [0, -40, 60], rot: [0.4, 0, 0], color: 0xd94f2b }, // ponytail
        { shape: 'box', size: [26, 16, 26], anchor: 'crown', pos: [0, -120, 80], color: 0xf4d13d }, // ribbon
        { shape: 'box', size: [40, 20, 10], anchor: 'chest', pos: [-50, 60, -10], color: 0xf4d13d }, // yoke L
        { shape: 'box', size: [40, 20, 10], anchor: 'chest', pos: [50, 60, -10], color: 0xf4d13d }, // yoke R
        { shape: 'box', size: [16, 16, 10], anchor: 'hip', pos: [-40, 10, -12], color: 0x241d18 }, // cow-print spot
        { shape: 'box', size: [16, 16, 10], anchor: 'hip', pos: [0, -10, -12], color: 0x241d18 }, // cow-print spot
        { shape: 'box', size: [16, 16, 10], anchor: 'hip', pos: [40, 10, -12], color: 0x241d18 }, // cow-print spot
        { shape: 'box', size: [200, 18, 150], anchor: 'hip', pos: [0, -30, 0], color: 'tint' }, // belt (tint)
      ],
      personality: { bobMul: 1.3, swayMul: 1.2, cadenceMul: 1.2, ampMul: 1.15 },
      bubbles: ['🤠', '🎵', '🐎', '⭐'] },

    // Mr. Potato Head — brown potato body, bowler hat, mustache, pink ears, orange nose.
    { id: 'toy-story/potato', label: 'Spud toy (bowler hat, mustache)', rig: 'humanoid',
      humanoid: { sk: 0.82, headR: 148, headShape: 'oval', limbR: 0.72, skin: 0x9c7a45, body: 0x9c7a45,
        shoe: 0x2b5faa, legColor: 0x9c7a45, emI: 0.03, hands: 'sphere', eyes: 'dots', steel: false },
      accessories: [
        { shape: 'sphere', size: [155, 60, 155], anchor: 'crown', pos: [0, -6, 0], color: 0x161619, sphereArc: [0, 6.283, 0, 1.1] }, // bowler dome
        { shape: 'cylinder', size: [170, 170, 10], anchor: 'crown', pos: [0, -30, 0], color: 0x161619 }, // brim
        { shape: 'sphere', size: [44, 44, 16], anchor: 'head', pos: [-110, 0, 0], color: 0xe8a0b4 }, // pink ear L
        { shape: 'sphere', size: [44, 44, 16], anchor: 'head', pos: [110, 0, 0], color: 0xe8a0b4 }, // pink ear R
        { shape: 'box', size: [40, 10, 8], anchor: 'face', pos: [-30, 30, -8], color: 0x161619 }, // eyebrow L
        { shape: 'box', size: [40, 10, 8], anchor: 'face', pos: [30, 30, -8], color: 0x161619 }, // eyebrow R
        { shape: 'box', size: [70, 14, 6], anchor: 'face', pos: [0, -30, -8], color: 0x161619 }, // mustache
        { shape: 'cone', size: [32, 44], anchor: 'face', pos: [0, -10, -14], rot: [-1.57, 0, 0], color: 0xd9822b }, // orange nose
      ],
      personality: { bobMul: 0.65, swayMul: 0.55, cadenceMul: 0.75, ampMul: 0.65 },
      bubbles: ['🥔', '😠', '🎩', '👃'] },

    // Rex — anxious bipedal T-rex, two-tone green, cream belly, tiny arms.
    { id: 'toy-story/rex', label: 'Nervous dino (green, tiny arms)', rig: 'humanoid',
      humanoid: { sk: 1.1, headR: 138, headShape: 'oval', limbR: 1.3, skin: 0x2f6b34, body: 0x4fae55,
        shoe: 0x2f6b34, legColor: 0x4fae55, armL: 0.55, footMul: [1.4, 0.9, 1.6], emI: 0, hands: 'sphere', eyes: 'dots', steel: false },
      accessories: [
        { shape: 'sphere', size: [120, 180, 10], anchor: 'chest', pos: [0, -20, -12], color: 0xefe6c8 }, // cream belly plate
        { shape: 'cone', size: [6, 14], anchor: 'face', pos: [-24, -40, -10], color: 0xf7f7f2 }, // tooth
        { shape: 'cone', size: [6, 14], anchor: 'face', pos: [0, -42, -12], color: 0xf7f7f2 }, // tooth
        { shape: 'cone', size: [6, 14], anchor: 'face', pos: [24, -40, -10], color: 0xf7f7f2 }, // tooth
        { shape: 'cone', size: [16, 20], anchor: 'head', pos: [-40, 50, -10], color: 0x234f28 }, // brow bump L
        { shape: 'cone', size: [16, 20], anchor: 'head', pos: [40, 50, -10], color: 0x234f28 }, // brow bump R
        { shape: 'cone', size: [40, 140], anchor: 'tailbone', pos: [0, -30, -50], rot: [0.9, 0, 0], color: 0x2f6b34 }, // tail stub
      ],
      // approx: full sweeping counterbalance tail unsupported on the humanoid rig — a tailbone stub only.
      personality: { bobMul: 0.85, swayMul: 1.1, cadenceMul: 0.8, ampMul: 0.9 },
      bubbles: ['🦖', '😰', '🌿', '😬'] },

    // Hamm — ceramic piggy bank, round pink body, flat snout, coin slot, cork.
    { id: 'toy-story/hamm', label: 'Piggy bank (pink, coin slot)', rig: 'quadruped', pet: true,
      quadruped: { sk: 0.62, bodyLen: 420, bodyW: 260, bodyH: 260, legLen: 0.55, headR: 128,
        headScale: [1.05, 1.0, 1.05], neckLen: 0, ears: 'round', tail: 'curl', tailLen: 0.5, snout: 0.35,
        coat: 0xf2b9c4, belly: 0xf9d8e0, earColor: 0xe8899e, snoutColor: 0xe8899e, pawColor: 0xf2b9c4 },
      accessories: [
        { shape: 'cylinder', size: [70, 70, 20], anchor: 'qhead', pos: [0, -6, -60], rot: [1.57, 0, 0], color: 0xe8899e }, // flat snout disc
        { shape: 'sphere', size: 6, anchor: 'qhead', pos: [-16, -6, -70], color: 0x5c3040 }, // nostril
        { shape: 'sphere', size: 6, anchor: 'qhead', pos: [16, -6, -70], color: 0x5c3040 }, // nostril
        { shape: 'box', size: [50, 8, 4], anchor: 'qback', pos: [0, 40, 0], color: 0x241d18 }, // coin slot
        { shape: 'cylinder', size: [20, 20, 14], anchor: 'qrump', pos: [0, -20, 20], rot: [0.6, 0, 0], color: 0xc9a06a }, // cork
      ],
      // approx: cork sits on the true belly; placed at qrump (no underside anchor).
      personality: { bobMul: 0.6, swayMul: 0.9, cadenceMul: 0.7, ampMul: 0.6 },
      bubbles: ['🐷', '💰', '😏', '💵'] },

    // Bullseye — brown rag-doll horse, saddle, dark yarn mane, pink muzzle.
    { id: 'toy-story/bullseye', label: 'Toy horse (brown, saddle)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.15, bodyLen: 780, bodyW: 260, bodyH: 320, legLen: 1.35, headR: 138,
        headScale: [1.0, 1.1, 1.15], neckLen: 160, ears: 'pointy', tail: 'down', tailLen: 1.2, snout: 1.2,
        coat: 0x8a5a34, belly: 0xd9c19a, earColor: 0x8a5a34, snoutColor: 0xe0a0ae, pawColor: 0xf2f0e6, tailTipColor: 0x3d2817 },
      accessories: [
        { shape: 'box', size: [286, 40, 270], anchor: 'qback', pos: [0, 20, 0], color: 0x5c3820 }, // saddle
        { shape: 'cone', size: [16, 40], anchor: 'qback', pos: [-120, 40, 0], color: 0x4a7a4a }, // cactus accent
        { shape: 'cone', size: [16, 40], anchor: 'qback', pos: [120, 40, 0], color: 0x4a7a4a }, // cactus accent
        { shape: 'box', size: [16, 60, 8], anchor: 'qneck', pos: [0, 50, 0], color: 0x3d2817 }, // mane
        { shape: 'box', size: [16, 55, 8], anchor: 'qneck', pos: [0, 50, 40], color: 0x3d2817 }, // mane
        { shape: 'box', size: [16, 55, 8], anchor: 'qneck', pos: [0, 50, -40], color: 0x3d2817 }, // mane
        { shape: 'box', size: [16, 50, 8], anchor: 'qhead', pos: [0, 50, -20], color: 0x3d2817 }, // mane forelock
      ],
      // approx: small upright horse ears → 'pointy' (same placeholder as the pony pack).
      personality: { bobMul: 1.0, swayMul: 0.9, cadenceMul: 1.0, ampMul: 1.1 },
      bubbles: ['🐴', '❤️', '⭐', '💨'] },

    // Slinky Dog — dachshund pull-toy, elongated body, coiled-spring midsection.
    { id: 'toy-story/slinky', label: 'Spring dog (long, coiled middle)', rig: 'quadruped', pet: true,
      quadruped: { sk: 1.0, bodyLen: 1150, bodyW: 190, bodyH: 210, legLen: 0.55, headR: 118,
        headScale: [1.0, 0.95, 1.05], neckLen: 0, ears: 'floppy', tail: 'up', tailLen: 0.9,
        coat: 0xc97a3d, belly: 0xe0a468, earColor: 0x8a4a24, snoutColor: 0xc97a3d, pawColor: 0x8a8a8a },
      accessories: [
        { shape: 'cylinder', size: [105, 105, 18], anchor: 'qback', pos: [0, 0, 60], color: 0xc7ccd1 }, // coil ring
        { shape: 'cylinder', size: [105, 105, 18], anchor: 'qback', pos: [0, 0, 0], color: 0xc7ccd1 }, // coil ring
        { shape: 'cylinder', size: [105, 105, 18], anchor: 'qback', pos: [0, 0, -60], color: 0xc7ccd1 }, // coil ring
        { shape: 'cylinder', size: [80, 80, 16], anchor: 'qneck', pos: [0, 0, 0], color: 0x2e7d4a }, // green collar
        { shape: 'box', size: [80, 16, 60], anchor: 'qhead', pos: [0, 20, -30], color: 0x5c3820 }, // brow plate
        { shape: 'cylinder', size: [24, 24, 8], anchor: 'qrump', pos: [-40, -40, 0], rot: [0, 1.57, 0], color: 0x4a4a4a }, // wheel
        { shape: 'cylinder', size: [24, 24, 8], anchor: 'qrump', pos: [40, -40, 0], rot: [0, 1.57, 0], color: 0x4a4a4a }, // wheel
      ],
      // approx: no helical primitive — three offset metal rings stand in for the coiled spring.
      personality: { bobMul: 1.5, swayMul: 1.2, cadenceMul: 1.1, ampMul: 1.1 },
      bubbles: ['🐕', '🌀', '⭐', '🎾'] },
  ],
};

export default pack;

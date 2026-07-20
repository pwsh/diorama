// Bright-star + constellation catalog (data-only). J2000.0 epoch coordinates
// (right ascension in HOURS, declination in DEGREES, visual magnitude), rounded
// to ~0.001h / 0.01° from standard bright-star references (Hipparcos / Yale
// Bright Star Catalogue). Precession since J2000 (~0.014°/yr → ~0.3° by 2026)
// is INTENTIONALLY ignored — it is far below the ~1° angular resolution at which
// this decorative dome reads, and folding it in would add a per-star rotation
// for no visible gain.
//
// This module is the pure sibling of sky-astro.ts (the ONE import that module
// makes). It ships raw per-constellation star lists + figure line index pairs
// (indices LOCAL to each constellation), then flattens them ONCE at module load
// into a global STARS array + global LINES index pairs, so authoring never has
// to hand-maintain global indices. Stars shared between figures (e.g. Alpheratz
// in Pegasus + Andromeda) are duplicated harmlessly. All magnitudes are ≤ ~3.9
// (near the naked-eye figure limit); fainter connecting stars are omitted so the
// dome stays legible.

export interface RawStar { ra: number; dec: number; mag: number; name?: string }
export interface RawConstellation { name: string; stars: RawStar[]; lines: [number, number][] }

export const CONSTELLATIONS: RawConstellation[] = [
  { name: 'Orion', stars: [
      { ra: 5.9195, dec: 7.4071, mag: 0.42, name: 'Betelgeuse' },
      { ra: 5.2423, dec: -8.2016, mag: 0.18, name: 'Rigel' },
      { ra: 5.4188, dec: 6.3497, mag: 1.64, name: 'Bellatrix' },
      { ra: 5.7959, dec: -9.6696, mag: 2.07, name: 'Saiph' },
      { ra: 5.5334, dec: -0.2991, mag: 2.23, name: 'Mintaka' },
      { ra: 5.6036, dec: -1.2019, mag: 1.69, name: 'Alnilam' },
      { ra: 5.6793, dec: -1.9426, mag: 1.77, name: 'Alnitak' },
      { ra: 5.5850, dec: 9.9342, mag: 3.39, name: 'Meissa' },
      { ra: 5.5924, dec: -5.9099, mag: 2.75, name: 'Hatysa' },
    ], lines: [[0, 2], [0, 6], [2, 4], [4, 5], [5, 6], [6, 3], [4, 1], [0, 7], [5, 8]] },

  { name: 'Ursa Major', stars: [
      { ra: 11.0621, dec: 61.7510, mag: 1.79, name: 'Dubhe' },
      { ra: 11.0307, dec: 56.3826, mag: 2.37, name: 'Merak' },
      { ra: 11.8972, dec: 53.6948, mag: 2.44, name: 'Phecda' },
      { ra: 12.2571, dec: 57.0326, mag: 3.31, name: 'Megrez' },
      { ra: 12.9004, dec: 55.9598, mag: 1.77, name: 'Alioth' },
      { ra: 13.3987, dec: 54.9254, mag: 2.23, name: 'Mizar' },
      { ra: 13.7923, dec: 49.3133, mag: 1.85, name: 'Alkaid' },
    ], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6]] },

  { name: 'Ursa Minor', stars: [
      { ra: 2.5297, dec: 89.2641, mag: 1.98, name: 'Polaris' },
      { ra: 14.8451, dec: 74.1555, mag: 2.08, name: 'Kochab' },
      { ra: 15.3455, dec: 71.8340, mag: 3.05, name: 'Pherkad' },
    ], lines: [[0, 1], [1, 2]] },

  { name: 'Cassiopeia', stars: [
      { ra: 0.1529, dec: 59.1498, mag: 2.28, name: 'Caph' },
      { ra: 0.6751, dec: 56.5373, mag: 2.24, name: 'Schedar' },
      { ra: 0.9451, dec: 60.7167, mag: 2.47, name: 'GammaCas' },
      { ra: 1.4303, dec: 60.2353, mag: 2.68, name: 'Ruchbah' },
      { ra: 1.9066, dec: 63.6701, mag: 3.38, name: 'Segin' },
    ], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },

  { name: 'Cygnus', stars: [
      { ra: 20.6905, dec: 45.2803, mag: 1.25, name: 'Deneb' },
      { ra: 20.3705, dec: 40.2567, mag: 2.23, name: 'Sadr' },
      { ra: 20.7702, dec: 33.9703, mag: 2.48, name: 'Gienah' },
      { ra: 19.7495, dec: 45.1308, mag: 2.87, name: 'DeltaCyg' },
      { ra: 19.5121, dec: 27.9597, mag: 3.05, name: 'Albireo' },
    ], lines: [[0, 1], [1, 4], [3, 1], [1, 2]] },

  { name: 'Lyra', stars: [
      { ra: 18.6156, dec: 38.7837, mag: 0.03, name: 'Vega' },
      { ra: 18.8347, dec: 33.3627, mag: 3.52, name: 'Sheliak' },
      { ra: 18.9824, dec: 32.6896, mag: 3.24, name: 'Sulafat' },
    ], lines: [[0, 1], [1, 2], [2, 0]] },

  { name: 'Aquila', stars: [
      { ra: 19.8464, dec: 8.8683, mag: 0.76, name: 'Altair' },
      { ra: 19.7710, dec: 10.6133, mag: 2.72, name: 'Tarazed' },
      { ra: 19.9219, dec: 6.4068, mag: 3.71, name: 'Alshain' },
      { ra: 19.4247, dec: 3.1148, mag: 3.36, name: 'DeltaAql' },
      { ra: 19.0904, dec: 13.8636, mag: 2.99, name: 'ZetaAql' },
    ], lines: [[1, 0], [0, 2], [0, 3], [0, 4]] },

  { name: 'Taurus', stars: [
      { ra: 4.5987, dec: 16.5093, mag: 0.85, name: 'Aldebaran' },
      { ra: 5.4382, dec: 28.6075, mag: 1.65, name: 'Elnath' },
      { ra: 3.7913, dec: 24.1051, mag: 2.87, name: 'Alcyone' },
      { ra: 4.3299, dec: 15.6276, mag: 3.65, name: 'HyadumI' },
      { ra: 5.6274, dec: 21.1425, mag: 3.00, name: 'ZetaTau' },
      { ra: 4.4776, dec: 19.1804, mag: 3.53, name: 'EpsilonTau' },
    ], lines: [[0, 3], [0, 5], [0, 1], [0, 4], [5, 2]] },

  { name: 'Gemini', stars: [
      { ra: 7.5766, dec: 31.8883, mag: 1.58, name: 'Castor' },
      { ra: 7.7553, dec: 28.0262, mag: 1.14, name: 'Pollux' },
      { ra: 6.6285, dec: 16.3993, mag: 1.93, name: 'Alhena' },
      { ra: 7.3352, dec: 21.9823, mag: 3.53, name: 'Wasat' },
      { ra: 6.7323, dec: 25.1311, mag: 3.06, name: 'Mebsuta' },
      { ra: 6.3828, dec: 22.5137, mag: 2.87, name: 'Tejat' },
    ], lines: [[0, 1], [0, 4], [4, 5], [1, 3], [3, 2]] },

  { name: 'Leo', stars: [
      { ra: 10.1395, dec: 11.9672, mag: 1.35, name: 'Regulus' },
      { ra: 11.8177, dec: 14.5720, mag: 2.14, name: 'Denebola' },
      { ra: 10.3329, dec: 19.8415, mag: 2.08, name: 'Algieba' },
      { ra: 11.2352, dec: 20.5237, mag: 2.56, name: 'Zosma' },
      { ra: 9.7642, dec: 23.7740, mag: 2.98, name: 'EpsilonLeo' },
      { ra: 10.1222, dec: 16.7627, mag: 3.48, name: 'EtaLeo' },
      { ra: 10.2781, dec: 23.4172, mag: 3.44, name: 'Adhafera' },
      { ra: 11.2373, dec: 15.4297, mag: 3.33, name: 'Chort' },
    ], lines: [[0, 5], [5, 2], [2, 6], [6, 4], [2, 3], [3, 1], [1, 7], [7, 0]] },

  { name: 'Scorpius', stars: [
      { ra: 16.4901, dec: -26.4320, mag: 1.06, name: 'Antares' },
      { ra: 17.5601, dec: -37.1038, mag: 1.62, name: 'Shaula' },
      { ra: 17.6220, dec: -42.9978, mag: 1.86, name: 'Sargas' },
      { ra: 16.0055, dec: -22.6217, mag: 2.29, name: 'Dschubba' },
      { ra: 16.0906, dec: -19.8055, mag: 2.56, name: 'Graffias' },
      { ra: 15.9809, dec: -26.1143, mag: 2.89, name: 'PiSco' },
      { ra: 16.8361, dec: -34.2933, mag: 2.29, name: 'EpsilonSco' },
      { ra: 17.7081, dec: -39.0299, mag: 2.39, name: 'KappaSco' },
    ], lines: [[4, 3], [3, 5], [3, 0], [5, 0], [0, 6], [6, 7], [7, 1], [1, 2]] },

  { name: 'Sagittarius', stars: [
      { ra: 18.4029, dec: -34.3846, mag: 1.85, name: 'KausAustralis' },
      { ra: 18.9211, dec: -26.2967, mag: 2.05, name: 'Nunki' },
      { ra: 18.3499, dec: -29.8281, mag: 2.72, name: 'KausMedia' },
      { ra: 18.4661, dec: -25.4217, mag: 2.81, name: 'KausBorealis' },
      { ra: 19.0436, dec: -29.8801, mag: 2.60, name: 'Ascella' },
      { ra: 18.7460, dec: -26.9907, mag: 3.17, name: 'PhiSgr' },
      { ra: 18.0966, dec: -30.4241, mag: 2.99, name: 'Nash' },
    ], lines: [[6, 2], [2, 0], [0, 4], [4, 1], [1, 5], [5, 3], [3, 2]] },

  { name: 'Canis Major', stars: [
      { ra: 6.7525, dec: -16.7161, mag: -1.46, name: 'Sirius' },
      { ra: 6.9770, dec: -28.9721, mag: 1.50, name: 'Adhara' },
      { ra: 7.1399, dec: -26.3932, mag: 1.83, name: 'Wezen' },
      { ra: 6.3783, dec: -17.9559, mag: 1.98, name: 'Mirzam' },
      { ra: 7.4015, dec: -29.3031, mag: 2.45, name: 'Aludra' },
      { ra: 6.3383, dec: -30.0634, mag: 3.02, name: 'Furud' },
    ], lines: [[3, 0], [0, 2], [2, 1], [1, 4], [1, 5]] },

  { name: 'Auriga', stars: [
      { ra: 5.2782, dec: 45.9980, mag: 0.08, name: 'Capella' },
      { ra: 5.9922, dec: 44.9474, mag: 1.90, name: 'Menkalinan' },
      { ra: 5.9953, dec: 37.2126, mag: 2.62, name: 'Mahasim' },
      { ra: 4.9500, dec: 33.1661, mag: 2.69, name: 'Hassaleh' },
      { ra: 5.0328, dec: 43.8233, mag: 2.99, name: 'Almaaz' },
    ], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },

  { name: 'Bootes', stars: [
      { ra: 14.2610, dec: 19.1824, mag: -0.05, name: 'Arcturus' },
      { ra: 14.7498, dec: 27.0742, mag: 2.35, name: 'Izar' },
      { ra: 13.9114, dec: 18.3977, mag: 2.68, name: 'Muphrid' },
      { ra: 14.5342, dec: 38.3082, mag: 3.03, name: 'Seginus' },
      { ra: 15.0320, dec: 40.3906, mag: 3.49, name: 'Nekkar' },
    ], lines: [[0, 1], [1, 4], [4, 3], [3, 0], [0, 2]] },

  { name: 'Pegasus', stars: [
      { ra: 23.0793, dec: 15.2053, mag: 2.49, name: 'Markab' },
      { ra: 23.0629, dec: 28.0828, mag: 2.42, name: 'Scheat' },
      { ra: 0.2206, dec: 15.1836, mag: 2.83, name: 'Algenib' },
      { ra: 0.1398, dec: 29.0906, mag: 2.06, name: 'Alpheratz' },
      { ra: 21.7364, dec: 9.8750, mag: 2.39, name: 'Enif' },
    ], lines: [[0, 1], [1, 3], [3, 2], [2, 0], [0, 4]] },

  { name: 'Andromeda', stars: [
      { ra: 0.1398, dec: 29.0906, mag: 2.06, name: 'AlpheratzA' },
      { ra: 1.1622, dec: 35.6206, mag: 2.05, name: 'Mirach' },
      { ra: 2.0650, dec: 42.3297, mag: 2.10, name: 'Almach' },
      { ra: 0.6556, dec: 30.8611, mag: 3.27, name: 'DeltaAnd' },
    ], lines: [[0, 3], [3, 1], [1, 2]] },

  { name: 'Crux', stars: [
      { ra: 12.4433, dec: -63.0991, mag: 0.77, name: 'Acrux' },
      { ra: 12.7953, dec: -59.6888, mag: 1.25, name: 'Mimosa' },
      { ra: 12.5194, dec: -57.1132, mag: 1.63, name: 'Gacrux' },
      { ra: 12.2525, dec: -58.7488, mag: 2.79, name: 'DeltaCru' },
    ], lines: [[0, 2], [1, 3]] },

  { name: 'Centaurus', stars: [
      { ra: 14.6600, dec: -60.8340, mag: -0.27, name: 'AlphaCen' },
      { ra: 14.0637, dec: -60.3730, mag: 0.61, name: 'Hadar' },
    ], lines: [[0, 1]] },
];

// Bright field stars (no figure lines) that fill otherwise-empty sky. Appended
// after the constellation stars during flatten.
export const FIELD_STARS: RawStar[] = [
  { ra: 1.6286, dec: -57.2367, mag: 0.45, name: 'Achernar' },
  { ra: 22.9608, dec: -29.6222, mag: 1.16, name: 'Fomalhaut' },
  { ra: 13.4199, dec: -11.1613, mag: 0.98, name: 'Spica' },
  { ra: 7.6550, dec: 5.2250, mag: 0.34, name: 'Procyon' },
  { ra: 6.3992, dec: -52.6957, mag: -0.72, name: 'Canopus' },
  { ra: 3.4054, dec: 49.8612, mag: 1.79, name: 'Mirfak' },
  { ra: 3.1361, dec: 40.9556, mag: 2.09, name: 'Algol' },
  { ra: 9.4597, dec: -8.6586, mag: 1.98, name: 'Alphard' },
  { ra: 2.1195, dec: 23.4624, mag: 2.00, name: 'Hamal' },
  { ra: 1.9107, dec: 20.8080, mag: 2.64, name: 'Sheratan' },
  { ra: 0.7264, dec: -17.9866, mag: 2.04, name: 'Diphda' },
  { ra: 17.5822, dec: 12.5601, mag: 2.08, name: 'Rasalhague' },
  { ra: 15.5781, dec: 26.7147, mag: 2.22, name: 'Alphecca' },
  { ra: 17.1729, dec: -15.7250, mag: 2.43, name: 'Sabik' },
  { ra: 3.0380, dec: 4.0897, mag: 2.53, name: 'Menkar' },
  { ra: 15.2831, dec: -9.3829, mag: 2.61, name: 'Zubeneschamali' },
  { ra: 14.8479, dec: -16.0418, mag: 2.75, name: 'Zubenelgenubi' },
  { ra: 21.5257, dec: -5.5712, mag: 2.90, name: 'Sadalsuud' },
  { ra: 22.1372, dec: -46.9610, mag: 1.74, name: 'Alnair' },
  { ra: 12.2634, dec: -17.5419, mag: 2.59, name: 'GienahCorvi' },
  { ra: 12.5736, dec: -23.3965, mag: 2.65, name: 'Kraz' },
  { ra: 12.4973, dec: -16.5153, mag: 2.94, name: 'Algorab' },
  { ra: 20.4275, dec: -56.7351, mag: 1.94, name: 'Peacock' },
  { ra: 16.8110, dec: -69.0277, mag: 1.91, name: 'Atria' },
  { ra: 9.2200, dec: -69.7172, mag: 1.69, name: 'Miaplacidus' },
  { ra: 8.3752, dec: -59.5095, mag: 1.86, name: 'Avior' },
  { ra: 8.7455, dec: -54.7086, mag: 1.75, name: 'Alsephina' },
  { ra: 8.0597, dec: -40.0031, mag: 2.21, name: 'Naos' },
  { ra: 8.1586, dec: -47.3366, mag: 1.78, name: 'Regor' },
  { ra: 9.1332, dec: -43.4326, mag: 2.23, name: 'Suhail' },
  { ra: 17.9434, dec: 51.4889, mag: 2.23, name: 'Eltanin' },
  { ra: 17.5074, dec: 52.3014, mag: 2.79, name: 'Rastaban' },
  { ra: 16.5036, dec: 21.4896, mag: 2.78, name: 'Kornephoros' },
  { ra: 15.7379, dec: 6.4256, mag: 2.63, name: 'Unukalhai' },
  { ra: 12.9337, dec: 38.3186, mag: 2.89, name: 'CorCaroli' },
  { ra: 21.7839, dec: -16.1273, mag: 2.85, name: 'DenebAlgedi' },
  { ra: 22.0964, dec: -0.3199, mag: 2.95, name: 'Sadalmelik' },
  { ra: 22.7169, dec: 30.2214, mag: 2.94, name: 'Matar' },
  { ra: 5.1305, dec: -5.0864, mag: 2.79, name: 'Cursa' },
  { ra: 0.4381, dec: -42.3061, mag: 2.40, name: 'Ankaa' },
  { ra: 5.5470, dec: -17.8221, mag: 2.58, name: 'Arneb' },
  { ra: 20.7702, dec: -12.5445, mag: 2.87, name: 'AlphaCap' },
];

// Nominal per-planet apparent magnitude (a fixed mid-range value — real
// magnitude varies with phase/distance, but a constant is plenty for a
// decorative dome) + render tint.
export const PLANET_INFO: Record<string, { mag: number; tint: number }> = {
  mercury: { mag: 0.0, tint: 0xd8d8e0 },
  venus:   { mag: -4.0, tint: 0xfff6d8 },
  mars:    { mag: 0.7, tint: 0xff8866 },
  jupiter: { mag: -2.2, tint: 0xfff3d0 },
  saturn:  { mag: 0.5, tint: 0xe8d8a0 },
};

// ── Flatten ────────────────────────────────────────────────────────────────
// STARS[i] = [raHours, decDeg, mag]; LINES[k] = [globalI, globalJ];
// STAR_INDEX maps named stars → their FIRST global index (for tests / lookups).
const _stars: number[][] = [];
const _lines: number[][] = [];
const _index: Record<string, number> = {};

for (const c of CONSTELLATIONS) {
  const base = _stars.length;
  for (const s of c.stars) {
    const gi = _stars.length;
    _stars.push([s.ra, s.dec, s.mag]);
    if (s.name && _index[s.name] === undefined) _index[s.name] = gi;
  }
  for (const [a, b] of c.lines) _lines.push([base + a, base + b]);
}
for (const s of FIELD_STARS) {
  const gi = _stars.length;
  _stars.push([s.ra, s.dec, s.mag]);
  if (s.name && _index[s.name] === undefined) _index[s.name] = gi;
}

export const STARS: number[][] = _stars;
export const LINES: number[][] = _lines;
export const STAR_INDEX: Record<string, number> = _index;
export const CONSTELLATION_NAMES: string[] = CONSTELLATIONS.map((c) => c.name);

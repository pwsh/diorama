// Airline identification from an ADS-B callsign — PURE and deterministic.
// ZERO imports: no three.js, no DOM, no network, no Planner. Like flights.ts
// and aircraft-types.ts, this module is shared by BOTH the app graph and the
// lazy renderer chunk (the avatars.ts precedent), so it must never reach for
// either side's dependencies. Every function is a pure transform; none reads
// the clock or Math.random, and none throws — garbage in → null.
//
// Data provenance: docs/research/airline-reference.md, transcribed row for row.
// The ICAO code is the 3-letter prefix that BEGINS an ADS-B/Mode-S flight ident
// (`DAL1234` = Delta 1234); the IATA code is the 2-character ticketing code and
// is NEVER what appears in an ident — it is carried here only for the detail
// card. `callsign` is the ATC telephony word ("SPEEDBIRD" for BAW), which is
// what a listener actually hears, and is what `spokenCallsign` composes with.
//
// ── Colours are APPROXIMATE, and that is stated in the UI ──────────────────
// The reference doc's own note: "Colors are for visual/branding association
// only … treat as approximate; official brand guidelines may differ slightly."
// Where the doc gives a hex it is used verbatim, first colour → `colorPrimary`,
// second → `colorSecondary`. Where the doc gives only colour WORDS ("Blue/
// white") they are mapped through the small conservative table below; a single
// unpaired word sets the primary only. Blank / "—" cells stay undefined, which
// every consumer reads as "no livery information" and falls back to the
// archetype's own paint — never to a guess.
//
// ── Regionals deliberately carry NO colours ────────────────────────────────
// SkyWest, Republic, Envoy and the rest fly in their MAINLINE PARTNER's paint
// while broadcasting their OWN ICAO prefix (reference doc §4). A regional that
// flies for four different majors has no single livery, so inheriting one would
// be a fabrication; `operatesFor` carries the honest answer instead and the
// detail card shows it.

export type AirlineKind =
  | 'mainline'     // US legacy / mainline carrier
  | 'lcc'          // US low-cost / leisure
  | 'regional'     // regional or small scheduled operator (livery often a partner's)
  | 'cargo'        // major cargo carrier
  | 'intl'         // major international carrier
  | 'charter'      // charter / air taxi
  | 'fractional'   // fractional ownership program
  | 'freight'      // smaller regional freight operator
  | 'pia';         // NOT an airline — a privacy pseudo-operator (see below)

export interface AirlineInfo {
  icao: string;              // the 3-letter ADS-B ident prefix (the lookup key)
  name: string;              // full legal / marketing name
  shortName: string;         // compact display name (fuselage titles, labels)
  iata?: string;             // 2-char ticketing code — never seen in an ident
  callsign?: string;         // ATC telephony word ("SPEEDBIRD"), for spokenCallsign
  slogan?: string;
  colorPrimary?: string;     // '#rrggbb', approximate — see the header note
  colorSecondary?: string;
  operatesFor?: string;      // regionals: the mainline brand(s) they fly as
  kind: AirlineKind;
}

// Conservative word → hex table for the doc rows that name colours instead of
// giving values. Deliberately muted mid-tones: these become a LIVERY TINT on a
// toy model, where a saturated primary reads as a toy and a near-black reads as
// a silhouette.
const W = {
  blue: '#1a5fb4', white: '#f2f4f7', red: '#d32f2f', orange: '#f57c00',
  gray: '#9aa0a6', green: '#2e7d32', purple: '#5b2d82', gold: '#d4a017',
  teal: '#00897b', navy: '#002f6c', black: '#1a1d21', magenta: '#c6007e',
  yellow: '#ffd400', vermillion: '#e34234', turquoise: '#00b2a9',
} as const;

// The table. Keys are the ICAO 3-letter prefix, uppercase — the same string the
// lookup extracts from an ident.
export const AIRLINES: Readonly<Record<string, AirlineInfo>> = {
  // ── US mainline / legacy ────────────────────────────────────────────────
  ASA: { icao: 'ASA', name: 'Alaska Airlines', shortName: 'Alaska', iata: 'AS',
    callsign: 'ALASKA', slogan: 'Fly Smart',
    colorPrimary: '#01426a', colorSecondary: '#4eb7b0', kind: 'mainline' },
  HAL: { icao: 'HAL', name: 'Hawaiian Airlines', shortName: 'Hawaiian', iata: 'HA',
    callsign: 'HAWAIIAN', slogan: 'Kahiko heritage branding',
    colorPrimary: '#5b2d82', colorSecondary: W.magenta, kind: 'mainline' },
  AAL: { icao: 'AAL', name: 'American Airlines', shortName: 'American', iata: 'AA',
    callsign: 'AMERICAN', slogan: 'Going for Great',
    colorPrimary: '#c8102e', colorSecondary: '#0078d2', kind: 'mainline' },
  DAL: { icao: 'DAL', name: 'Delta Air Lines', shortName: 'Delta', iata: 'DL',
    callsign: 'DELTA', slogan: 'Keep Climbing',
    colorPrimary: '#c8102e', colorSecondary: '#00285f', kind: 'mainline' },
  UAL: { icao: 'UAL', name: 'United Airlines', shortName: 'United', iata: 'UA',
    callsign: 'UNITED', slogan: 'Good Leads The Way',
    colorPrimary: '#005daa', colorSecondary: '#002244', kind: 'mainline' },
  SWA: { icao: 'SWA', name: 'Southwest Airlines', shortName: 'Southwest', iata: 'WN',
    callsign: 'SOUTHWEST', slogan: 'Low fares. Nothing to hide.',
    colorPrimary: '#304cb2', colorSecondary: '#e31837', kind: 'mainline' },

  // ── US low-cost / leisure ───────────────────────────────────────────────
  JBU: { icao: 'JBU', name: 'JetBlue Airways', shortName: 'JetBlue', iata: 'B6',
    callsign: 'JETBLUE', slogan: 'Come Fly Like the Humans We Are',
    colorPrimary: '#0033a0', colorSecondary: '#00a9e0', kind: 'lcc' },
  NKS: { icao: 'NKS', name: 'Spirit Airlines', shortName: 'Spirit', iata: 'NK',
    callsign: 'SPIRIT WINGS', slogan: 'Less Money, More Go',
    colorPrimary: '#ffed00', colorSecondary: W.black, kind: 'lcc' },
  FFT: { icao: 'FFT', name: 'Frontier Airlines', shortName: 'Frontier', iata: 'F9',
    callsign: 'FRONTIER FLIGHT', slogan: 'Low Fares Done Right',
    colorPrimary: '#00a650', colorSecondary: W.white, kind: 'lcc' },
  AAY: { icao: 'AAY', name: 'Allegiant Air', shortName: 'Allegiant', iata: 'G4',
    callsign: 'ALLEGIANT', slogan: 'Nonstop to Fun',
    colorPrimary: '#f5a623', colorSecondary: '#003c71', kind: 'lcc' },
  SCX: { icao: 'SCX', name: 'Sun Country Airlines', shortName: 'Sun Country', iata: 'SY',
    callsign: 'SUN COUNTRY',
    colorPrimary: '#fdb913', colorSecondary: '#002f6c', kind: 'lcc' },
  MXY: { icao: 'MXY', name: 'Breeze Airways', shortName: 'Breeze', iata: 'MX',
    callsign: 'MOXY', slogan: 'Seriously Nice',
    colorPrimary: '#6d3fc6', colorSecondary: W.teal, kind: 'lcc' },
  VXP: { icao: 'VXP', name: 'Avelo Airlines', shortName: 'Avelo', iata: 'XP',
    callsign: 'AVELO', slogan: 'Travel Should Feel Good',
    colorPrimary: '#ff6900', colorSecondary: '#14213d', kind: 'lcc' },

  // ── US regionals (livery follows the mainline partner — no colours) ──────
  SKW: { icao: 'SKW', name: 'SkyWest Airlines', shortName: 'SkyWest', iata: 'OO',
    callsign: 'SKYWEST', kind: 'regional',
    operatesFor: 'Delta Connection, United Express, American Eagle, Alaska' },
  RPA: { icao: 'RPA', name: 'Republic Airways', shortName: 'Republic', iata: 'YX',
    callsign: 'BRICKYARD', kind: 'regional',
    operatesFor: 'American Eagle, Delta Connection, United Express' },
  ENY: { icao: 'ENY', name: 'Envoy Air', shortName: 'Envoy', iata: 'MQ',
    callsign: 'ENVOY', kind: 'regional', operatesFor: 'American Eagle' },
  JIA: { icao: 'JIA', name: 'PSA Airlines', shortName: 'PSA', iata: 'OH',
    callsign: 'BLUE STREAK', kind: 'regional', operatesFor: 'American Eagle' },
  PDT: { icao: 'PDT', name: 'Piedmont Airlines', shortName: 'Piedmont', iata: 'PT',
    callsign: 'PIEDMONT', kind: 'regional', operatesFor: 'American Eagle' },
  ASH: { icao: 'ASH', name: 'Mesa Airlines', shortName: 'Mesa', iata: 'YV',
    callsign: 'AIR SHUTTLE', kind: 'regional',
    operatesFor: 'American Eagle, United Express' },
  EDV: { icao: 'EDV', name: 'Endeavor Air', shortName: 'Endeavor', iata: '9E',
    callsign: 'ENDEAVOR', kind: 'regional', operatesFor: 'Delta Connection' },
  GJS: { icao: 'GJS', name: 'GoJet Airlines', shortName: 'GoJet', iata: 'G7',
    callsign: 'LINDBERGH', kind: 'regional',
    operatesFor: 'United Express, Delta Connection' },
  AWI: { icao: 'AWI', name: 'Air Wisconsin', shortName: 'Air Wisconsin', iata: 'ZW',
    callsign: 'WISCONSIN', kind: 'regional',
    operatesFor: 'United Express, American Eagle' },
  QXE: { icao: 'QXE', name: 'Horizon Air', shortName: 'Horizon', iata: 'QX',
    callsign: 'HORIZON AIR', kind: 'regional', operatesFor: 'Alaska' },
  UCA: { icao: 'UCA', name: 'CommuteAir', shortName: 'CommuteAir', iata: 'C5',
    callsign: 'COMMUTAIR', kind: 'regional', operatesFor: 'United Express' },
  SIL: { icao: 'SIL', name: 'Silver Airways', shortName: 'Silver', iata: '3M',
    callsign: 'SILVER WINGS', kind: 'regional' },
  VTE: { icao: 'VTE', name: 'Contour Airlines', shortName: 'Contour', iata: 'LF',
    callsign: 'VOLUNTEER', kind: 'regional' },

  // ── US cargo ────────────────────────────────────────────────────────────
  FDX: { icao: 'FDX', name: 'FedEx Express', shortName: 'FedEx', iata: 'FX',
    callsign: 'FEDEX', slogan: 'The World On Time',
    colorPrimary: '#4d148c', colorSecondary: '#ff6600', kind: 'cargo' },
  UPS: { icao: 'UPS', name: 'UPS Airlines', shortName: 'UPS', iata: '5X',
    callsign: 'UPS', slogan: 'What Can Brown Do For You?',
    colorPrimary: '#351c15', colorSecondary: '#ffb500', kind: 'cargo' },
  GTI: { icao: 'GTI', name: 'Atlas Air', shortName: 'Atlas', iata: '5Y',
    callsign: 'GIANT', slogan: 'The World Depends On Us',
    colorPrimary: W.blue, colorSecondary: W.white, kind: 'cargo' },
  CKS: { icao: 'CKS', name: 'Kalitta Air', shortName: 'Kalitta', iata: 'K4',
    callsign: 'CONNIE', colorPrimary: W.red, colorSecondary: W.white, kind: 'cargo' },
  PAC: { icao: 'PAC', name: 'Polar Air Cargo', shortName: 'Polar', iata: 'PO',
    callsign: 'POLAR', colorPrimary: W.blue, colorSecondary: W.orange, kind: 'cargo' },
  AJT: { icao: 'AJT', name: 'Amerijet International', shortName: 'Amerijet', iata: 'M6',
    callsign: 'AMERIJET', colorPrimary: W.blue, colorSecondary: W.red, kind: 'cargo' },
  ABX: { icao: 'ABX', name: 'ABX Air', shortName: 'ABX', iata: 'GB',
    callsign: 'ABEX', colorPrimary: W.blue, kind: 'cargo' },
  WGN: { icao: 'WGN', name: 'Western Global Airlines', shortName: 'Western Global', iata: 'KD',
    callsign: 'WESTERN GLOBAL', colorPrimary: W.blue, colorSecondary: W.gray, kind: 'cargo' },
  NCR: { icao: 'NCR', name: 'National Airlines', shortName: 'National', iata: 'N8',
    callsign: 'NATIONAL CARGO', colorPrimary: W.blue, kind: 'cargo' },
  SOO: { icao: 'SOO', name: 'Southern Air', shortName: 'Southern Air', iata: '9S',
    callsign: 'SOUTHERN AIR', colorPrimary: W.blue, kind: 'cargo' },

  // ── Major international ─────────────────────────────────────────────────
  ACA: { icao: 'ACA', name: 'Air Canada', shortName: 'Air Canada', iata: 'AC',
    callsign: 'AIR CANADA', slogan: 'Fly With Confidence',
    colorPrimary: '#f01428', colorSecondary: W.black, kind: 'intl' },
  JZA: { icao: 'JZA', name: 'Jazz Aviation', shortName: 'Jazz', iata: 'QK',
    callsign: 'JAZZ', kind: 'regional', operatesFor: 'Air Canada Express' },
  AMX: { icao: 'AMX', name: 'Aeroméxico', shortName: 'Aeromexico', iata: 'AM',
    callsign: 'AEROMEXICO', slogan: 'Vamos Tomando el Cielo',
    colorPrimary: '#0a2240', colorSecondary: W.red, kind: 'intl' },
  VOI: { icao: 'VOI', name: 'Volaris', shortName: 'Volaris', iata: 'Y4',
    callsign: 'VOLARIS', slogan: 'Viaja Diferente',
    colorPrimary: '#c6007e', colorSecondary: W.purple, kind: 'intl' },
  CMP: { icao: 'CMP', name: 'Copa Airlines', shortName: 'Copa', iata: 'CM',
    callsign: 'COPA', slogan: 'The Airline of the Americas',
    colorPrimary: W.blue, colorSecondary: W.white, kind: 'intl' },
  AVA: { icao: 'AVA', name: 'Avianca', shortName: 'Avianca', iata: 'AV',
    callsign: 'AVIANCA', slogan: 'Sentimiento Avianca',
    colorPrimary: '#e4032e', colorSecondary: W.white, kind: 'intl' },
  // The doc lists LATAM's IATA as "LA (Chile) / JJ (Brasil)" — the split code
  // predates the merger. `LA` is the surviving primary.
  LAN: { icao: 'LAN', name: 'LATAM Airlines', shortName: 'LATAM', iata: 'LA',
    callsign: 'LAN CHILE', slogan: 'Vuela con Nosotros',
    colorPrimary: '#6e1e33', colorSecondary: W.white, kind: 'intl' },
  BAW: { icao: 'BAW', name: 'British Airways', shortName: 'British Airways', iata: 'BA',
    callsign: 'SPEEDBIRD', slogan: 'To Fly. To Serve.',
    colorPrimary: '#075aaa', colorSecondary: '#eb1e2c', kind: 'intl' },
  VIR: { icao: 'VIR', name: 'Virgin Atlantic', shortName: 'Virgin Atlantic', iata: 'VS',
    callsign: 'VIRGIN', slogan: 'See the World Differently',
    colorPrimary: '#e10a0a', kind: 'intl' },
  DLH: { icao: 'DLH', name: 'Lufthansa', shortName: 'Lufthansa', iata: 'LH',
    callsign: 'LUFTHANSA', slogan: 'Nonstop You',
    colorPrimary: '#05164d', colorSecondary: W.gold, kind: 'intl' },
  AFR: { icao: 'AFR', name: 'Air France', shortName: 'Air France', iata: 'AF',
    callsign: 'AIRFRANS', slogan: 'France Is in the Air',
    colorPrimary: '#002157', colorSecondary: W.red, kind: 'intl' },
  KLM: { icao: 'KLM', name: 'KLM Royal Dutch Airlines', shortName: 'KLM', iata: 'KL',
    callsign: 'KLM', slogan: 'Journeys of Inspiration',
    colorPrimary: '#00a1de', kind: 'intl' },
  SWR: { icao: 'SWR', name: 'Swiss International Air Lines', shortName: 'Swiss', iata: 'LX',
    callsign: 'SWISS', slogan: 'Fly Swiss',
    colorPrimary: '#e30613', colorSecondary: W.white, kind: 'intl' },
  IBE: { icao: 'IBE', name: 'Iberia', shortName: 'Iberia', iata: 'IB',
    callsign: 'IBERIA', slogan: 'Somos Tu Aerolinea',
    colorPrimary: '#d7192d', kind: 'intl' },
  ICE: { icao: 'ICE', name: 'Icelandair', shortName: 'Icelandair', iata: 'FI',
    callsign: 'ICEAIR', slogan: 'Sagas of Iceland',
    colorPrimary: '#003d6b', kind: 'intl' },
  SAS: { icao: 'SAS', name: 'Scandinavian Airlines', shortName: 'SAS', iata: 'SK',
    callsign: 'SCANDINAVIAN', slogan: "It's in Our Nature",
    colorPrimary: '#00195e', kind: 'intl' },
  TAP: { icao: 'TAP', name: 'TAP Air Portugal', shortName: 'TAP', iata: 'TP',
    callsign: 'AIR PORTUGAL', slogan: 'In Love with Portugal',
    colorPrimary: '#de0e30', colorSecondary: W.green, kind: 'intl' },
  THY: { icao: 'THY', name: 'Turkish Airlines', shortName: 'Turkish Airlines', iata: 'TK',
    callsign: 'TURKISH', slogan: 'Widen Your World',
    colorPrimary: '#c50830', colorSecondary: W.white, kind: 'intl' },
  UAE: { icao: 'UAE', name: 'Emirates', shortName: 'Emirates', iata: 'EK',
    callsign: 'EMIRATES', slogan: 'Fly Better',
    colorPrimary: '#d71921', colorSecondary: W.gold, kind: 'intl' },
  QTR: { icao: 'QTR', name: 'Qatar Airways', shortName: 'Qatar Airways', iata: 'QR',
    callsign: 'QATARI', slogan: 'Going Places Together',
    colorPrimary: '#5c0632', colorSecondary: W.gray, kind: 'intl' },
  ETD: { icao: 'ETD', name: 'Etihad Airways', shortName: 'Etihad', iata: 'EY',
    callsign: 'ETIHAD', slogan: 'Choose Well',
    colorPrimary: '#bfa46f', colorSecondary: W.white, kind: 'intl' },
  SIA: { icao: 'SIA', name: 'Singapore Airlines', shortName: 'Singapore Airlines', iata: 'SQ',
    callsign: 'SINGAPORE', slogan: 'A Great Way to Fly',
    colorPrimary: '#f5a623', colorSecondary: W.navy, kind: 'intl' },
  CPA: { icao: 'CPA', name: 'Cathay Pacific', shortName: 'Cathay Pacific', iata: 'CX',
    callsign: 'CATHAY', slogan: 'Life Well Travelled',
    colorPrimary: '#006564', kind: 'intl' },
  JAL: { icao: 'JAL', name: 'Japan Airlines', shortName: 'JAL', iata: 'JL',
    callsign: 'JAPANAIR', slogan: 'A World of Trust',
    colorPrimary: '#c8102e', colorSecondary: W.white, kind: 'intl' },
  ANA: { icao: 'ANA', name: 'All Nippon Airways', shortName: 'ANA', iata: 'NH',
    callsign: 'ALL NIPPON', slogan: 'Inspiration of Japan',
    colorPrimary: '#13448f', kind: 'intl' },
  KAL: { icao: 'KAL', name: 'Korean Air', shortName: 'Korean Air', iata: 'KE',
    callsign: 'KOREANAIR', slogan: 'Excellence in Flight',
    colorPrimary: '#0f4c9f', colorSecondary: W.red, kind: 'intl' },
  CAL: { icao: 'CAL', name: 'China Airlines', shortName: 'China Airlines', iata: 'CI',
    callsign: 'DYNASTY', slogan: 'Deeply Cares',
    colorPrimary: W.red, colorSecondary: W.gray, kind: 'intl' },
  EVA: { icao: 'EVA', name: 'EVA Air', shortName: 'EVA Air', iata: 'BR',
    callsign: 'EVA', slogan: 'Fly Sharp, Fly EVA',
    colorPrimary: '#006241', colorSecondary: W.white, kind: 'intl' },
  CCA: { icao: 'CCA', name: 'Air China', shortName: 'Air China', iata: 'CA',
    callsign: 'AIR CHINA', slogan: 'Fly Real, Fly Kind',
    colorPrimary: '#c8102e', colorSecondary: W.vermillion, kind: 'intl' },
  CES: { icao: 'CES', name: 'China Eastern Airlines', shortName: 'China Eastern', iata: 'MU',
    callsign: 'CHINA EASTERN',
    colorPrimary: W.blue, colorSecondary: W.red, kind: 'intl' },
  CSN: { icao: 'CSN', name: 'China Southern Airlines', shortName: 'China Southern', iata: 'CZ',
    callsign: 'CHINA SOUTHERN', colorPrimary: '#a6093d', kind: 'intl' },
  CHH: { icao: 'CHH', name: 'Hainan Airlines', shortName: 'Hainan Airlines', iata: 'HU',
    callsign: 'HAINAN', colorPrimary: W.blue, colorSecondary: W.red, kind: 'intl' },
  AAR: { icao: 'AAR', name: 'Asiana Airlines', shortName: 'Asiana', iata: 'OZ',
    callsign: 'ASIANA', slogan: 'Beautiful People, Beautiful Flight',
    colorPrimary: '#c8102e', colorSecondary: W.yellow, kind: 'intl' },
  AIC: { icao: 'AIC', name: 'Air India', shortName: 'Air India', iata: 'AI',
    callsign: 'AIRINDIA', slogan: 'Truly Indian',
    colorPrimary: '#e4022d', colorSecondary: W.orange, kind: 'intl' },
  FJI: { icao: 'FJI', name: 'Fiji Airways', shortName: 'Fiji Airways', iata: 'FJ',
    callsign: 'FIJI', slogan: 'Fiji, the Way the World Should Be',
    colorPrimary: W.blue, colorSecondary: W.turquoise, kind: 'intl' },
  EIN: { icao: 'EIN', name: 'Aer Lingus', shortName: 'Aer Lingus', iata: 'EI',
    callsign: 'SHAMROCK', slogan: "Ireland's Airline",
    colorPrimary: '#0f8a5f', colorSecondary: W.white, kind: 'intl' },
  NAX: { icao: 'NAX', name: 'Norwegian Air Shuttle', shortName: 'Norwegian', iata: 'DY',
    callsign: 'NORSHUTTLE', slogan: 'Free Bird',
    colorPrimary: '#d6001c', colorSecondary: W.white, kind: 'intl' },
  AZA: { icao: 'AZA', name: 'Alitalia', shortName: 'Alitalia', iata: 'AZ',
    callsign: 'ALITALIA', slogan: 'Made With Love, Made in Italy',
    colorPrimary: W.green, colorSecondary: W.red, kind: 'intl' },
  WJA: { icao: 'WJA', name: 'WestJet Airlines', shortName: 'WestJet', iata: 'WS',
    callsign: 'WESTJET', slogan: "Owners' Care",
    colorPrimary: '#00b2a9', colorSecondary: W.navy, kind: 'intl' },
  ELY: { icao: 'ELY', name: 'El Al Israel Airlines', shortName: 'El Al', iata: 'LY',
    callsign: 'ELAL', slogan: "It's Not Just an Airline, It's Israel",
    colorPrimary: '#003399', colorSecondary: W.white, kind: 'intl' },

  // ── Smaller US operators (charter / air taxi / regional freight) ─────────
  WSN: { icao: 'WSN', name: 'Advanced Airlines', shortName: 'Advanced', iata: 'AN',
    callsign: 'WINGSPAN', kind: 'charter' },
  USC: { icao: 'USC', name: 'AirNet Express', shortName: 'AirNet',
    callsign: 'STAR CHECK', kind: 'freight' },
  SNC: { icao: 'SNC', name: 'Air Cargo Carriers', shortName: 'Air Cargo Carriers', iata: '2Q',
    callsign: 'NIGHT CARGO', kind: 'freight' },
  WBR: { icao: 'WBR', name: 'Air Choice One', shortName: 'Air Choice One', iata: '3E',
    callsign: 'WEBER', kind: 'regional' },
  ATN: { icao: 'ATN', name: 'Air Transport International', shortName: 'ATI', iata: '8C',
    callsign: 'AIR TRANSPORT', kind: 'freight' },
  AIP: { icao: 'AIP', name: 'Alpine Air Express', shortName: 'Alpine Air', iata: '5A',
    callsign: 'ALPINE AIR', kind: 'freight' },
  AJI: { icao: 'AJI', name: 'Ameristar Jet Charter', shortName: 'Ameristar', iata: '7Z',
    callsign: 'AMERISTAR', kind: 'charter' },
  MGE: { icao: 'MGE', name: 'Asia Pacific Airlines', shortName: 'Asia Pacific', iata: 'P9',
    callsign: 'MAGELLAN', kind: 'freight' },
  BMJ: { icao: 'BMJ', name: 'Bemidji Airlines', shortName: 'Bemidji', iata: 'CH',
    callsign: 'BEMIDJI', kind: 'freight' },
  CPT: { icao: 'CPT', name: 'Corporate Air', shortName: 'Corporate Air',
    callsign: 'AIRSPUR', kind: 'freight' },
  IRO: { icao: 'IRO', name: 'CSA Air', shortName: 'CSA Air',
    callsign: 'IRON AIR', kind: 'regional' },
  DYA: { icao: 'DYA', name: 'Eastern Airlines', shortName: 'Eastern', iata: '2D',
    callsign: 'DYNAMIC AIR', kind: 'charter' },
  MNU: { icao: 'MNU', name: 'Elite Airways', shortName: 'Elite', iata: '7Q',
    callsign: 'MAINER', kind: 'charter' },
  XLS: { icao: 'XLS', name: 'ExcelAire', shortName: 'ExcelAire',
    callsign: 'EXCELAIRE', kind: 'charter' },
  OPT: { icao: 'OPT', name: 'Flight Options', shortName: 'Flight Options',
    callsign: 'OPTIONS', kind: 'fractional' },
  FRG: { icao: 'FRG', name: 'Freight Runners Express', shortName: 'Freight Runners',
    callsign: 'FREIGHT RUNNERS', kind: 'freight' },
  SWQ: { icao: 'SWQ', name: 'IAero Airways', shortName: 'IAero', iata: 'WQ',
    callsign: 'SWIFTFLIGHT', kind: 'charter' },
  CSQ: { icao: 'CSQ', name: 'IBC Airways', shortName: 'IBC', iata: 'II',
    callsign: 'CHASQUI', kind: 'freight' },
  IFL: { icao: 'IFL', name: 'IFL Group', shortName: 'IFL', iata: 'IF',
    callsign: 'EIFFEL', kind: 'freight' },
  KEN: { icao: 'KEN', name: 'Kenmore Air', shortName: 'Kenmore', iata: 'M5',
    callsign: 'KENMORE', kind: 'regional' },
  MRA: { icao: 'MRA', name: 'Martinaire', shortName: 'Martinaire',
    callsign: 'MARTEX', kind: 'freight' },
  MEI: { icao: 'MEI', name: 'Merlin Airways', shortName: 'Merlin',
    callsign: 'AVALON', kind: 'charter' },
  MDC: { icao: 'MDC', name: 'Mid-Atlantic Freight', shortName: 'Mid-Atlantic',
    callsign: 'NIGHT SHIP', kind: 'freight' },
  MTN: { icao: 'MTN', name: 'Mountain Air Cargo', shortName: 'Mountain Air', iata: 'C2',
    callsign: 'MOUNTAIN', kind: 'freight' },
  PXT: { icao: 'PXT', name: 'Pacific Coast Jet', shortName: 'Pacific Coast Jet',
    callsign: 'PACK COAST', kind: 'charter' },
  DCX: { icao: 'DCX', name: 'Pentastar Aviation', shortName: 'Pentastar',
    callsign: 'TANGO', kind: 'charter' },
  CNS: { icao: 'CNS', name: 'PlaneSense', shortName: 'PlaneSense',
    callsign: 'CHRONOS', kind: 'fractional' },
  SGB: { icao: 'SGB', name: 'Songbird Airways', shortName: 'Songbird',
    callsign: 'SONGBIRD', kind: 'charter' },
  URF: { icao: 'URF', name: 'Surf Air', shortName: 'Surf Air',
    callsign: 'SURFAIR', kind: 'charter' },
  GPD: { icao: 'GPD', name: 'Tradewind Aviation', shortName: 'Tradewind', iata: 'TJ',
    callsign: 'GOODSPEED', kind: 'charter' },
  JUS: { icao: 'JUS', name: 'USA Jet Airlines', shortName: 'USA Jet', iata: 'UJ',
    callsign: 'JET USA', kind: 'freight' },
  PCM: { icao: 'PCM', name: 'West Air', shortName: 'West Air',
    callsign: 'PAC VALLEY', kind: 'freight' },
  XOJ: { icao: 'XOJ', name: 'XoJet', shortName: 'XoJet',
    callsign: 'EXOJET', kind: 'charter' },
  CXP: { icao: 'CXP', name: 'Xtra Airways', shortName: 'Xtra',
    callsign: 'CASINO EXPRESS', kind: 'charter' },

  // ── Additional / less-common prefixes ───────────────────────────────────
  DPJ: { icao: 'DPJ', name: 'Delta Private Jets', shortName: 'Delta Private Jets',
    callsign: 'JET CARD', kind: 'fractional' },
  EJA: { icao: 'EJA', name: 'NetJets', shortName: 'NetJets', iata: '1I',
    callsign: 'EXECJET', kind: 'fractional' },
  LXJ: { icao: 'LXJ', name: 'Flexjet', shortName: 'Flexjet',
    callsign: 'FLEXJET', kind: 'fractional' },
  VJT: { icao: 'VJT', name: 'VistaJet', shortName: 'VistaJet',
    callsign: 'VISTA JET', kind: 'charter' },
  OAE: { icao: 'OAE', name: 'Omni Air International', shortName: 'Omni Air', iata: 'X9',
    callsign: 'OMNI-EXPRESS', kind: 'charter' },
  WAL: { icao: 'WAL', name: 'World Atlantic Airlines', shortName: 'World Atlantic', iata: 'K8',
    callsign: 'WORLD ATLANTIC', kind: 'charter' },
  JSX: { icao: 'JSX', name: 'JSX', shortName: 'JSX', iata: 'XE',
    callsign: 'BIGSTRIPE', kind: 'charter' },
  BTQ: { icao: 'BTQ', name: 'Boutique Air', shortName: 'Boutique', iata: '4B',
    callsign: 'BOUTIQUE', kind: 'regional' },
  KAP: { icao: 'KAP', name: 'Cape Air', shortName: 'Cape Air', iata: '9K',
    callsign: 'CAIR', kind: 'regional' },
  AMF: { icao: 'AMF', name: 'Ameriflight', shortName: 'Ameriflight', iata: 'A8',
    callsign: 'AMFLIGHT', kind: 'freight' },
  CFS: { icao: 'CFS', name: 'Empire Airlines', shortName: 'Empire', iata: 'EM',
    callsign: 'EMPIRE', kind: 'freight' },
  WIG: { icao: 'WIG', name: 'Wiggins Airways', shortName: 'Wiggins', iata: 'WG',
    callsign: 'WIGGINS AIRWAYS', kind: 'freight' },
  LYM: { icao: 'LYM', name: 'Key Lime Air', shortName: 'Key Lime', iata: 'KG',
    callsign: 'KEY LIME', kind: 'regional' },
  UJC: { icao: 'UJC', name: 'Ultimate Air Shuttle', shortName: 'Ultimate', iata: 'UE',
    callsign: 'ULTIMATE', kind: 'charter' },
  CSB: { icao: 'CSB', name: '21 Air', shortName: '21 Air', iata: '2I',
    callsign: 'CARGO SOUTH', kind: 'freight' },
  KYE: { icao: 'KYE', name: 'Sky Lease Cargo', shortName: 'Sky Lease', iata: 'GG',
    callsign: 'SKY CUBE', kind: 'freight' },
  NAC: { icao: 'NAC', name: 'Northern Air Cargo', shortName: 'Northern Air', iata: 'NC',
    callsign: 'YUKON', kind: 'freight' },

  // ── Privacy pseudo-operators — NOT airlines ─────────────────────────────
  // A PIA prefix identifies the flight-planning SERVICE that issued a temporary
  // Privacy ICAO Address, not an operator. Painting a livery from one would be
  // the exact opposite of what the aircraft is asking for, so `kind: 'pia'` is
  // a hard tint/identity gate everywhere downstream (see resolveAirlineLivery).
  FFL: { icao: 'FFL', name: 'ForeFlight (privacy address)', shortName: 'ForeFlight',
    callsign: 'FOREFLIGHT', kind: 'pia' },
  DCM: { icao: 'DCM', name: 'FLTPLAN (privacy address)', shortName: 'FLTPLAN',
    callsign: 'DOT COM', kind: 'pia' },
};

// ── Callsign → airline ─────────────────────────────────────────────────────
// An ADS-B ident is `<ICAO3><flight number>` — three letters then a numeric
// flight number, optionally with one or two trailing letters (`DAL1234`,
// `SWA55`, `UAL200A`). The number is REQUIRED: without it a bare three-letter
// ident is far more likely to be a tactical/tail fragment than an airline, and
// a US N-number (`N123AB`) must never be read as the "N?? airline".
const IDENT_RE = /^([A-Z]{3})(\d{1,4})([A-Z]{0,2})$/;

function identParts(cs: string | null | undefined): { icao: string; num: string } | null {
  if (typeof cs !== 'string') return null;
  const m = IDENT_RE.exec(cs.trim().toUpperCase());
  return m ? { icao: m[1], num: m[2] + m[3] } : null;
}

// The airline broadcasting this ident, or null. Never throws.
export function airlineForCallsign(cs: string | null | undefined): AirlineInfo | null {
  const parts = identParts(cs);
  if (!parts) return null;
  return AIRLINES[parts.icao] ?? null;
}

// ── Military & government callsign words (reference doc §"Military & Government") ─
// Unlike an airline prefix these are WORDS with a mission number (`RCH1234`,
// `SAM123`). The doc's own caveat is reproduced in the UI copy: only REACH and
// SAM are reliably persistent — fighter/bomber/tactical words rotate by
// squadron, exercise or even sortie. The ceremonial "…ONE" rows (AIR FORCE ONE,
// MARINE ONE, …) are deliberately NOT here: they are spoken designations, not
// broadcast idents, and matching them would invite a false positive on any
// ident ending in 1.
export interface MilitaryCallsignInfo {
  word: string;       // the canonical word ('REACH')
  desc: string;       // who flies it
  aircraft?: string;  // typical airframes
}

export const MILITARY_CALLSIGN_WORDS: Readonly<Record<string, MilitaryCallsignInfo>> = {
  REACH: { word: 'REACH', desc: 'Air Mobility Command airlift', aircraft: 'C-17, C-5, KC-135, KC-46, C-130' },
  SAM: { word: 'SAM', desc: '89th Airlift Wing "Special Air Mission" — VIP / government transport', aircraft: 'C-32, C-37, C-40' },
  EXEC: { word: 'EXEC', desc: 'Government VIP transport (non-DoD)', aircraft: 'Various VIP jets' },
  CONVOY: { word: 'CONVOY', desc: 'US Navy Reserve logistics air support', aircraft: 'C-40A, C-130' },
  DOOM: { word: 'DOOM', desc: 'Barksdale AFB, 2nd Bomb Wing (rotating tactical callsign)', aircraft: 'B-52' },
  CBP: { word: 'CBP', desc: 'Customs and Border Protection', aircraft: 'AS350, UH-60, DHC-8, P-3' },
  NOAA: { word: 'NOAA', desc: 'NOAA weather / research', aircraft: 'WP-3D, Gulfstream IV' },
  TANKER: { word: 'TANKER', desc: 'US Forest Service / interagency firefighting', aircraft: 'Air tankers' },
  JUMPER: { word: 'JUMPER', desc: 'US Forest Service smokejumper mission', aircraft: 'Smokejumper aircraft' },
  FEMA: { word: 'FEMA', desc: 'Federal Emergency Management Agency support', aircraft: 'Various support aircraft' },
  INTERIOR: { word: 'INTERIOR', desc: 'Department of the Interior — Office of Aircraft Services' },
};

// The abbreviated forms that actually appear in the ident field. `RCH` is the
// one that matters: Air Mobility Command broadcasts `RCH1234`, but the word
// spoken (and printed by most trackers) is REACH — matching only the long form
// would miss the single most common military callsign in civil ADS-B.
const MILITARY_ALIASES: Readonly<Record<string, string>> = {
  RCH: 'REACH',
  CNV: 'CONVOY',      // documented ICAO designator for the Navy logistics word
};

// The word table's keys, LONGEST FIRST, so `CONVOY` is tested before any
// shorter key that happens to be a prefix of it. Built once.
const MIL_KEYS: readonly string[] = [
  ...Object.keys(MILITARY_CALLSIGN_WORDS), ...Object.keys(MILITARY_ALIASES),
].sort((a, b) => b.length - a.length);

// A military / government callsign word, or null. The remainder after the word
// must be a mission number (digits, optionally with a trailing letter) or
// empty — so `NOAA42` and `INTERIOR` both match while `TANKERMAN` does not.
export function militaryCallsignInfo(cs: string | null | undefined): MilitaryCallsignInfo | null {
  if (typeof cs !== 'string') return null;
  const t = cs.trim().toUpperCase();
  if (!t) return null;
  for (const key of MIL_KEYS) {
    if (!t.startsWith(key)) continue;
    const rest = t.slice(key.length);
    if (rest !== '' && !/^\d{1,4}[A-Z]?$/.test(rest)) continue;
    const word = MILITARY_ALIASES[key] ?? key;
    return MILITARY_CALLSIGN_WORDS[word] ?? null;
  }
  return null;
}

// How ATC and the pilots actually say this ident: the telephony word plus the
// numeric part ("DAL1234" → "DELTA 1234"). Null when the ident is not an
// airline ident, or when the resolved airline has no telephony word. `info` is
// an optional already-resolved lookup so a caller holding one need not repeat it.
export function spokenCallsign(cs: string | null | undefined,
                               info?: AirlineInfo | null): string | null {
  const parts = identParts(cs);
  if (!parts) return null;
  const a = info ?? AIRLINES[parts.icao] ?? null;
  if (!a || !a.callsign) return null;
  return `${a.callsign} ${parts.num}`;
}

// ── US military hex heuristic (reference doc §"Hex address block") ─────────
// The whole US is allocated A00000–AFFFFF; military aircraft are commonly
// OBSERVED clustering in AE0000–AFFFFF. That sub-range is a practical pattern
// used by tracking tools, NOT an officially published subdivision — every UI
// surface that reports it must say "heuristic", which is why this function is
// named for what it is.
export const US_MIL_HEX_LO = 0xae0000;
export const US_MIL_HEX_HI = 0xafffff;

export function usMilitaryHexHeuristic(hex: string | null | undefined): boolean {
  if (typeof hex !== 'string') return false;
  const t = hex.trim().toLowerCase().replace(/^0x/, '');
  if (!/^[0-9a-f]{1,6}$/.test(t)) return false;
  const n = parseInt(t, 16);
  return isFinite(n) && n >= US_MIL_HEX_LO && n <= US_MIL_HEX_HI;
}

// ── Livery resolution — the ONE precedence ladder ───────────────────────────
// Which airline colours (if any) an aircraft may be painted with. Pure, so the
// 3D rig tint, the 2D dart fill and the tests all read the identical answer.
//
// Precedence, in order, each an EARLY REFUSAL:
//   1. feature off                      → no livery
//   2. a MILITARY SKIN is being drawn   → no livery (the borrowed silhouette
//      keeps its signature paint — that is the whole point of the skin)
//   3. the MILITARY flag                → no livery (olive-drab wins; an
//      airline prefix on a military airframe is a contract/charter detail, not
//      a paint job)
//   4. identity SUPPRESSED (PIA)        → no livery, no name, nothing
//   5. resolved airline is `kind:'pia'` → no livery (FFL / DCM are privacy
//      services, not operators)
//   6. no colours in the table (regionals) → no livery, archetype paint stands
// `military` and `skin` are plain booleans rather than the renderer's own types
// so this module stays zero-import.
export interface AirlineLivery { primary: string; secondary?: string; }

export function resolveAirlineLivery(
  info: AirlineInfo | null | undefined,
  opts: { enabled?: boolean; military?: boolean; skin?: boolean; suppress?: boolean },
): AirlineLivery | null {
  if (opts.enabled === false) return null;
  if (opts.skin === true) return null;
  if (opts.military === true) return null;
  if (opts.suppress === true) return null;
  if (!info || info.kind === 'pia') return null;
  if (!info.colorPrimary) return null;
  return { primary: info.colorPrimary, secondary: info.colorSecondary };
}

// `FlightsConfig.airlineColors` resolution — ABSENT = ON (the beacons /
// privacyDim / militarySkins idiom). One home so the renderer, the 2D canvas,
// the settings drawer and the tests agree.
export function airlineColorsEnabled(v: boolean | null | undefined): boolean {
  return v !== false;
}

// The airline TEXT an identified aircraft may show, with the PIA gate already
// applied — the shape flights.ts's pure side/banner/label resolvers take as
// their injected lookup (they stay zero-import and never call this module).
// Returns null when there is nothing honest to say.
export interface AirlineText { shortName: string; slogan?: string; name: string; }

export function airlineTextFor(cs: string | null | undefined,
                               suppress = false): AirlineText | null {
  if (suppress) return null;
  const a = airlineForCallsign(cs);
  if (!a || a.kind === 'pia') return null;
  return { shortName: a.shortName, slogan: a.slogan, name: a.name };
}

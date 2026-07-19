// Flag library — pure canvas painters for the yard flagpole fixture.
//
// ZERO three.js / Planner imports (the geometry.ts / weather.ts isolation idiom):
// each painter is a plain `(g, w, h) => void` that fills a `w × h` canvas with a
// simplified geometric rendition of a flag. The 3D renderer wraps a painter's
// output in a CanvasTexture (cached per flag id, disposed in destroy()); the 2D
// canvas reads only the `dominant` hex for a tiny glyph. Nothing else needs
// wiring — see docs/FLAGS.md to add a flag.
//
// Conventions (see docs/FLAGS.md):
//  • The painter owns the WHOLE canvas: always fill the full `w × h` first.
//  • Coordinates are pixels, origin top-left, +x right / +y down. Work in
//    fractions of w/h so any canvas size renders correctly (renderer uses ~5:3).
//  • Deterministic ONLY — never Math.random (textures are cached + must be stable).
//  • `dominant` is the flag's headline color, used to tint the 2D map glyph.
//  • Simplify complex crests/stars/eagles to clean geometric stand-ins; get the
//    proportions and field colors right. Text is fine (open_sign) — it makes an
//    asymmetric flag that proves the non-mirror double-face build.

export type FlagPainter = (g: CanvasRenderingContext2D, w: number, h: number) => void;

export interface FlagPainterEntry {
  label: string;      // human-readable dropdown label
  dominant: string;   // hex — headline color for the 2D glyph tint
  paint: FlagPainter;
}

// ── small helpers (pure) ──────────────────────────────────────────────────
function rect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string): void {
  g.fillStyle = c; g.fillRect(x, y, w, h);
}
function disc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string): void {
  g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
}
// A filled n-point star centered at (cx, cy) with outer radius r (rot in rad).
function star(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string,
              points = 5, rot = -Math.PI / 2): void {
  g.fillStyle = c; g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * 0.42;
    const a = rot + (Math.PI * i) / points;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath(); g.fill();
}
function poly(g: CanvasRenderingContext2D, pts: [number, number][], c: string): void {
  g.fillStyle = c; g.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? g.moveTo(x, y) : g.lineTo(x, y)));
  g.closePath(); g.fill();
}

// ── country flags (simplified) ─────────────────────────────────────────────
const usa: FlagPainter = (g, w, h) => {
  const red = '#b22234', white = '#ffffff', navy = '#3c3b6e';
  for (let i = 0; i < 13; i++) rect(g, 0, (i / 13) * h, w, h / 13 + 1, i % 2 === 0 ? red : white);
  const cw = w * 0.4, ch = (h / 13) * 7;
  rect(g, 0, 0, cw, ch, navy);
  // Star grid → small white dots (readable at texture scale).
  const cols = 6, rows = 5, dr = Math.min(cw / cols, ch / rows) * 0.18;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    disc(g, (cw / cols) * (c + 0.5), (ch / rows) * (r + 0.5), dr, white);
  }
};
const canada: FlagPainter = (g, w, h) => {
  const red = '#d52b1e', white = '#ffffff';
  rect(g, 0, 0, w, h, white);
  rect(g, 0, 0, w / 4, h, red);
  rect(g, (w * 3) / 4, 0, w / 4, h, red);
  // Stylized maple leaf (simple 7-point silhouette).
  const cx = w / 2, top = h * 0.2, bot = h * 0.82, s = w * 0.11;
  poly(g, [
    [cx, top], [cx + s * 0.4, top + (bot - top) * 0.28], [cx + s * 1.2, top + (bot - top) * 0.22],
    [cx + s * 0.75, top + (bot - top) * 0.52], [cx + s * 1.4, top + (bot - top) * 0.6],
    [cx + s * 0.5, top + (bot - top) * 0.72], [cx + s * 0.28, bot],
    [cx - s * 0.28, bot], [cx - s * 0.5, top + (bot - top) * 0.72],
    [cx - s * 1.4, top + (bot - top) * 0.6], [cx - s * 0.75, top + (bot - top) * 0.52],
    [cx - s * 1.2, top + (bot - top) * 0.22], [cx - s * 0.4, top + (bot - top) * 0.28],
  ], red);
};
const uk: FlagPainter = (g, w, h) => {
  const blue = '#012169', white = '#ffffff', red = '#c8102e';
  rect(g, 0, 0, w, h, blue);
  // Diagonals: white St Andrew then thinner red St Patrick.
  const drawDiag = (col: string, lw: number) => {
    g.strokeStyle = col; g.lineWidth = lw; g.beginPath();
    g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
  };
  drawDiag(white, h * 0.3);
  drawDiag(red, h * 0.12);
  // St George cross (white ground + red).
  rect(g, w / 2 - h * 0.19, 0, h * 0.38, h, white);
  rect(g, 0, h / 2 - h * 0.19, w, h * 0.38, white);
  rect(g, w / 2 - h * 0.11, 0, h * 0.22, h, red);
  rect(g, 0, h / 2 - h * 0.11, w, h * 0.22, red);
};
const germany: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w, h / 3 + 1, '#000000');
  rect(g, 0, h / 3, w, h / 3 + 1, '#dd0000');
  rect(g, 0, (h * 2) / 3, w, h / 3 + 1, '#ffce00');
};
const france: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w / 3 + 1, h, '#0055a4');
  rect(g, w / 3, 0, w / 3 + 1, h, '#ffffff');
  rect(g, (w * 2) / 3, 0, w / 3 + 1, h, '#ef4135');
};
const italy: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w / 3 + 1, h, '#009246');
  rect(g, w / 3, 0, w / 3 + 1, h, '#ffffff');
  rect(g, (w * 2) / 3, 0, w / 3 + 1, h, '#ce2b37');
};
const spain: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w, h, '#aa151b');
  rect(g, 0, h / 4, w, h / 2, '#f1bf00');   // wide yellow band (crest simplified away)
};
const mexico: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w / 3 + 1, h, '#006847');
  rect(g, w / 3, 0, w / 3 + 1, h, '#ffffff');
  rect(g, (w * 2) / 3, 0, w / 3 + 1, h, '#ce1126');
  disc(g, w / 2, h / 2, h * 0.12, '#7a5230');  // eagle/cactus emblem → simple disc
};
const japan: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w, h, '#ffffff');
  disc(g, w / 2, h / 2, h * 0.3, '#bc002d');
};
const brazil: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w, h, '#009c3b');
  poly(g, [[w / 2, h * 0.1], [w * 0.9, h / 2], [w / 2, h * 0.9], [w * 0.1, h / 2]], '#ffdf00');
  disc(g, w / 2, h / 2, h * 0.2, '#002776');   // celestial globe (motto skipped)
};

// ── novelty flags ───────────────────────────────────────────────────────────
const jolly_roger: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w, h, '#1a1a1a');
  const cx = w / 2, cy = h * 0.42, white = '#f4f4f4';
  // Crossbones behind the skull.
  g.strokeStyle = white; g.lineWidth = h * 0.06; g.lineCap = 'round';
  const b = h * 0.26;
  g.beginPath(); g.moveTo(cx - b, cy + b * 1.6); g.lineTo(cx + b, cy + b * 2.4);
  g.moveTo(cx + b, cy + b * 1.6); g.lineTo(cx - b, cy + b * 2.4); g.stroke();
  // Skull: round cranium + jaw + eye/nose holes.
  disc(g, cx, cy, h * 0.2, white);
  rect(g, cx - h * 0.11, cy + h * 0.12, h * 0.22, h * 0.12, white);
  disc(g, cx - h * 0.08, cy - h * 0.02, h * 0.05, '#1a1a1a');
  disc(g, cx + h * 0.08, cy - h * 0.02, h * 0.05, '#1a1a1a');
  poly(g, [[cx, cy + h * 0.04], [cx - h * 0.03, cy + h * 0.11], [cx + h * 0.03, cy + h * 0.11]], '#1a1a1a');
};
const checkered: FlagPainter = (g, w, h) => {
  const cols = 8, rows = 5;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    rect(g, (w / cols) * c, (h / rows) * r, w / cols + 1, h / rows + 1,
      (r + c) % 2 === 0 ? '#111111' : '#f4f4f4');
  }
};
const smiley: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w, h, '#ffde34');
  const cx = w / 2, cy = h / 2, dark = '#3a2f00';
  disc(g, cx - w * 0.13, cy - h * 0.12, h * 0.08, dark);
  disc(g, cx + w * 0.13, cy - h * 0.12, h * 0.08, dark);
  g.strokeStyle = dark; g.lineWidth = h * 0.06; g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy + h * 0.02, h * 0.24, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
};
const pride: FlagPainter = (g, w, h) => {
  const cols = ['#e40303', '#ff8c00', '#ffed00', '#008026', '#004dff', '#750787'];
  cols.forEach((c, i) => rect(g, 0, (i / 6) * h, w, h / 6 + 1, c));
};
const ghost: FlagPainter = (g, w, h) => {
  rect(g, 0, 0, w, h, '#3a3f4a');
  const white = '#f2f2f2', cx = w / 2, topR = w * 0.18;
  const top = h * 0.22, bot = h * 0.78, left = cx - topR, right = cx + topR;
  // Rounded dome + straight sides + wavy hem.
  g.fillStyle = white; g.beginPath();
  g.moveTo(left, bot);
  g.lineTo(left, top + topR);
  g.arc(cx, top + topR, topR, Math.PI, 0);   // dome
  g.lineTo(right, bot);
  const waves = 4, ww = (right - left) / waves;
  for (let i = 0; i < waves; i++) {
    const x0 = right - i * ww;
    g.quadraticCurveTo(x0 - ww / 2, bot - h * 0.06, x0 - ww, bot);
  }
  g.closePath(); g.fill();
  disc(g, cx - topR * 0.4, top + topR * 0.9, topR * 0.22, '#2a2e37');
  disc(g, cx + topR * 0.4, top + topR * 0.9, topR * 0.22, '#2a2e37');
};
const open_sign: FlagPainter = (g, w, h) => {
  // Asymmetric by design (text reads L→R) — proves the non-mirror double-face.
  rect(g, 0, 0, w, h, '#d21f28');
  g.strokeStyle = '#ffffff'; g.lineWidth = h * 0.05;
  g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
  g.fillStyle = '#ffffff';
  g.font = `bold ${Math.floor(h * 0.42)}px sans-serif`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('OPEN', w / 2, h / 2);
};

export const FLAG_PAINTERS: Record<string, FlagPainterEntry> = {
  usa:         { label: 'USA',            dominant: '#b22234', paint: usa },
  canada:      { label: 'Canada',         dominant: '#d52b1e', paint: canada },
  uk:          { label: 'United Kingdom', dominant: '#012169', paint: uk },
  germany:     { label: 'Germany',        dominant: '#dd0000', paint: germany },
  france:      { label: 'France',         dominant: '#0055a4', paint: france },
  italy:       { label: 'Italy',          dominant: '#009246', paint: italy },
  spain:       { label: 'Spain',          dominant: '#aa151b', paint: spain },
  mexico:      { label: 'Mexico',         dominant: '#006847', paint: mexico },
  japan:       { label: 'Japan',          dominant: '#bc002d', paint: japan },
  brazil:      { label: 'Brazil',         dominant: '#009c3b', paint: brazil },
  jolly_roger: { label: 'Jolly Roger',    dominant: '#1a1a1a', paint: jolly_roger },
  checkered:   { label: 'Racing check',   dominant: '#111111', paint: checkered },
  smiley:      { label: 'Smiley',         dominant: '#ffde34', paint: smiley },
  pride:       { label: 'Pride',          dominant: '#e40303', paint: pride },
  ghost:       { label: 'Ghost',          dominant: '#3a3f4a', paint: ghost },
  open_sign:   { label: 'OPEN sign',      dominant: '#d21f28', paint: open_sign },
};

export const DEFAULT_FLAG = 'usa';

// Resolve a flag id to its registry entry, falling back to the default (never
// throws — a stale/unknown id renders the default flag).
export function flagEntry(id: string | undefined): FlagPainterEntry {
  return FLAG_PAINTERS[id ?? DEFAULT_FLAG] ?? FLAG_PAINTERS[DEFAULT_FLAG];
}
export function flagDominant(id: string | undefined): string {
  return flagEntry(id).dominant;
}

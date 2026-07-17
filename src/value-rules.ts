// Shared value-display rule engine + formatting (Display & Controls arc).
//
// PURE + deterministic: zero three.js, zero DOM, no `Date.now()` inside any
// exported function — the caller supplies `now` for clock/relative-time modes.
// Importable by geometry consumers, canvas-render, the renderer chunk, AND the
// sidebar. Both InfoCard (value→color) and (DC-B) logical lights consume the
// SAME `evalRules` engine — there is no second rule syntax.
//
// This module is intentionally self-contained (imports nothing) so it can be
// transpiled standalone for the test page (`esbuild --format=esm`, no bundle).

// ── Rule engine ───────────────────────────────────────────────────────────

export type RuleOp =
  | 'lt' | 'lte' | 'gt' | 'gte'   // numeric comparisons
  | 'eq' | 'neq'                  // equality (numeric when both coerce, else string)
  | 'between'                     // numeric, value..value2 inclusive
  | 'contains' | 'regex';         // string ops on the raw state

export interface ValueRule {
  op: RuleOp;
  value: number | string;
  value2?: number;    // upper bound for `between`
  color?: string;     // hex applied when this rule matches
  flash?: boolean;    // pulse the plaque when this rule matches
  label?: string;     // optional override display string when this rule matches
}

export interface RuleHit { color?: string; flash?: boolean; label?: string; }

// Does one rule match the raw state string? Numeric ops coerce via parseFloat
// (NaN → no match); string ops compare the raw state. eq/neq compare
// numerically only when BOTH sides coerce, else as case-sensitive strings.
export function ruleMatches(rule: ValueRule, raw: string): boolean {
  const n = parseFloat(raw);
  const v = typeof rule.value === 'number' ? rule.value : parseFloat(String(rule.value));
  switch (rule.op) {
    case 'lt':  return !isNaN(n) && !isNaN(v) && n < v;
    case 'lte': return !isNaN(n) && !isNaN(v) && n <= v;
    case 'gt':  return !isNaN(n) && !isNaN(v) && n > v;
    case 'gte': return !isNaN(n) && !isNaN(v) && n >= v;
    case 'between': {
      const v2 = rule.value2;
      if (v2 === undefined || isNaN(n) || isNaN(v) || isNaN(v2)) return false;
      const lo = Math.min(v, v2), hi = Math.max(v, v2);
      return n >= lo && n <= hi;
    }
    case 'eq':
      if (!isNaN(n) && !isNaN(v)) return n === v;
      return String(raw) === String(rule.value);
    case 'neq':
      if (!isNaN(n) && !isNaN(v)) return n !== v;
      return String(raw) !== String(rule.value);
    case 'contains':
      return String(raw).toLowerCase().includes(String(rule.value).toLowerCase());
    case 'regex':
      try { return new RegExp(String(rule.value)).test(String(raw)); }
      catch { return false; }
  }
}

// First matching rule wins (array order); returns only the fields that rule
// carries. No match → empty object. Overlap/gap behaviour is documented here so
// it is never silently ambiguous: earlier rules take precedence, gaps fall
// through to {} (the caller's neutral/default color).
export function evalRules(rules: ValueRule[] | undefined, raw: string): RuleHit {
  if (!rules) return {};
  for (const r of rules) {
    if (ruleMatches(r, raw)) {
      const out: RuleHit = {};
      if (r.color !== undefined) out.color = r.color;
      if (r.flash !== undefined) out.flash = r.flash;
      if (r.label !== undefined) out.label = r.label;
      return out;
    }
  }
  return {};
}

// ── Value formatting ──────────────────────────────────────────────────────

export interface HassStateLike {
  state: string;
  attributes: Record<string, unknown>;
  entity_id?: string;
  last_updated?: string;
  last_changed?: string;
}

export interface InfoCardFormat {
  decimals?: number;                 // manual precision override; default heuristic (envValueText-style)
  unit?: string;                     // unit override (replaces the attribute unit); '' + showUnit still hides
  showUnit?: boolean;                // default true; false hides the unit entirely
  prefix?: string;                   // e.g. "$"
  suffix?: string;                   // e.g. " left"
  mapping?: Record<string, string>;  // raw state → display string (e.g. on→Open, home→Home)
  relativeTime?: boolean;            // timestamp state (ISO) → "5 min ago"
}

export interface FormatOpts { imperial?: boolean; now?: Date; }

const UNAVAIL = new Set(['unavailable', 'unknown', 'none', '']);

// Short on/off labels per binary_sensor device_class (our own compact table,
// same tradeoff ENV_KINDS makes — HA's translated strings aren't on the WS API).
const BINARY_LABELS: Record<string, [string, string]> = {
  battery: ['Low', 'OK'], battery_charging: ['Charging', 'Not charging'],
  co: ['CO!', 'Clear'], cold: ['Cold', 'Normal'], connectivity: ['Connected', 'Disconnected'],
  door: ['Open', 'Closed'], garage_door: ['Open', 'Closed'], gas: ['Gas!', 'Clear'],
  heat: ['Hot', 'Normal'], light: ['Light', 'Dark'], lock: ['Unlocked', 'Locked'],
  moisture: ['Wet', 'Dry'], motion: ['Motion', 'Clear'], moving: ['Moving', 'Stopped'],
  occupancy: ['Occupied', 'Clear'], opening: ['Open', 'Closed'], plug: ['Plugged', 'Unplugged'],
  power: ['Power', 'No power'], presence: ['Home', 'Away'], problem: ['Problem', 'OK'],
  running: ['Running', 'Idle'], safety: ['Unsafe', 'Safe'], smoke: ['Smoke!', 'Clear'],
  sound: ['Sound', 'Clear'], tamper: ['Tamper!', 'Clear'], update: ['Update', 'Up-to-date'],
  vibration: ['Vibration', 'Clear'], window: ['Open', 'Closed'],
};

// snake_case / kebab → Title Case, for enum-y state strings (vacuum `returning`
// → `Returning`). A lossy approximation of HA's translated enum labels.
export function titleCase(s: string): string {
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Compact relative-time string from a millisecond delta (now − then).
export function relTimeText(deltaMs: number): string {
  const s = Math.round(deltaMs / 1000);
  if (s < 0) return 'in the future';
  if (s < 45) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 45) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 22) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} d ago`;
}

// "21.4 °C" / "612 ppm" / "Open" / "$4.20" / "—" from an HA state envelope +
// format config. Mirrors envValueText's heuristic, generalized with mapping,
// prefix/suffix, unit override, binary_sensor labels, relative time, and an
// imperial °C→°F conversion. `opts.now` is required for relativeTime.
export function formatEntityValue(
  st: HassStateLike | null, fmt?: InfoCardFormat, opts?: FormatOpts,
): string {
  const f = fmt ?? {};
  const pfx = f.prefix ?? '', sfx = f.suffix ?? '';
  const wrap = (s: string) => `${pfx}${s}${sfx}`;
  if (!st || UNAVAIL.has(st.state)) {
    // A mapping entry for the literal unavailable state still wins.
    const m = f.mapping?.[st?.state ?? ''];
    return m !== undefined ? wrap(m) : '—';
  }
  const raw = st.state;

  // 1) explicit user mapping (highest precedence)
  if (f.mapping && f.mapping[raw] !== undefined) return wrap(f.mapping[raw]);

  // 2) relative-time mode (timestamp entities) — parse ISO in the state
  if (f.relativeTime) {
    const t = Date.parse(raw);
    if (!isNaN(t) && opts?.now) return wrap(relTimeText(opts.now.getTime() - t));
  }

  const n = parseFloat(raw);

  // 3) binary_sensor short labels (only for on/off, only when not numeric)
  if (isNaN(n) && st.entity_id?.startsWith('binary_sensor.')) {
    const dc = String(st.attributes?.device_class ?? '');
    const pair = BINARY_LABELS[dc];
    if (pair && (raw === 'on' || raw === 'off')) return wrap(raw === 'on' ? pair[0] : pair[1]);
    if (raw === 'on' || raw === 'off') return wrap(raw === 'on' ? 'On' : 'Off');
  }

  // 4) non-numeric enum string → Title Case
  if (isNaN(n)) return wrap(titleCase(raw));

  // 5) numeric value (+ unit)
  let val = n;
  let unit = f.unit !== undefined ? f.unit : String(st.attributes?.unit_of_measurement ?? '').trim();
  if (opts?.imperial && (unit === '°C' || unit === 'C')) { val = val * 9 / 5 + 32; unit = '°F'; }
  const dec = f.decimals;
  const num = dec !== undefined
    ? val.toFixed(Math.max(0, Math.min(10, dec)))
    : (Math.abs(val) >= 100 ? Math.round(val).toString() : (Math.round(val * 10) / 10).toString());
  const showUnit = f.showUnit !== false;
  return wrap(showUnit && unit ? `${num} ${unit}` : num);
}

// ── Clock / date (entity-free) ────────────────────────────────────────────
// Token-based (NOT Intl) so output is deterministic regardless of the host
// locale — critical for the headless test page. Tokens read the Date's LOCAL
// getters unless a `timeZone` is supplied (then parts come from Intl).

export type ClockMode = 'clock' | 'date' | 'clock_date';

const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DOWF = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Named presets exposed in the sidebar. Keys are stored on the InfoCard.
export const CLOCK_PRESETS: Record<string, string> = {
  '12h': 'h:mm A',
  '12h_sec': 'h:mm:ss A',
  '24h': 'HH:mm',
  '24h_sec': 'HH:mm:ss',
};
export const DATE_PRESETS: Record<string, string> = {
  medium: 'MMM D, YYYY',
  short: 'M/D/YYYY',
  iso: 'YYYY-MM-DD',
  weekday: 'dddd, MMM D',
  dow: 'dddd',
};

const pad2 = (n: number) => (n < 10 ? '0' + n : '' + n);

interface DateParts { Y: number; Mo: number; D: number; H: number; Mi: number; S: number; dow: number; }

function partsOf(now: Date, timeZone?: string): DateParts {
  if (timeZone) {
    try {
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hour12: false,
      });
      const map: Record<string, string> = {};
      for (const p of dtf.formatToParts(now)) map[p.type] = p.value;
      const H = parseInt(map.hour, 10);
      return {
        Y: parseInt(map.year, 10), Mo: parseInt(map.month, 10) - 1, D: parseInt(map.day, 10),
        H: H === 24 ? 0 : H, Mi: parseInt(map.minute, 10), S: parseInt(map.second, 10),
        dow: Math.max(0, DOW.indexOf(map.weekday)),
      };
    } catch { /* fall through to local */ }
  }
  return {
    Y: now.getFullYear(), Mo: now.getMonth(), D: now.getDate(),
    H: now.getHours(), Mi: now.getMinutes(), S: now.getSeconds(), dow: now.getDay(),
  };
}

// Format a Date by a token pattern. Longer tokens are matched before shorter
// ones so `MMMM`/`MMM`/`MM`/`M` don't collide.
export function formatDateTokens(now: Date, pattern: string, timeZone?: string): string {
  const p = partsOf(now, timeZone);
  const h12 = p.H % 12 === 0 ? 12 : p.H % 12;
  const rep: [string, string][] = [
    ['YYYY', '' + p.Y], ['YY', pad2(p.Y % 100)],
    ['MMMM', MONF[p.Mo]], ['MMM', MON[p.Mo]], ['MM', pad2(p.Mo + 1)], ['M', '' + (p.Mo + 1)],
    ['DD', pad2(p.D)], ['D', '' + p.D],
    ['dddd', DOWF[p.dow]], ['ddd', DOW[p.dow]],
    ['HH', pad2(p.H)], ['H', '' + p.H],
    ['hh', pad2(h12)], ['h', '' + h12],
    ['mm', pad2(p.Mi)], ['m', '' + p.Mi],
    ['ss', pad2(p.S)], ['s', '' + p.S],
    ['A', p.H < 12 ? 'AM' : 'PM'], ['a', p.H < 12 ? 'am' : 'pm'],
  ];
  // Tokenize left-to-right, greedy longest-match, so literal chars pass through.
  let out = '';
  let i = 0;
  outer: while (i < pattern.length) {
    for (const [tok, val] of rep) {
      if (pattern.startsWith(tok, i)) { out += val; i += tok.length; continue outer; }
    }
    out += pattern[i]; i++;
  }
  return out;
}

export interface ClockOpts { clockFormat?: string; dateFormat?: string; timeZone?: string; }

// Resolve a clock/date/clock_date display string for the supplied `now`.
export function formatClock(mode: ClockMode, now: Date, opts?: ClockOpts): string {
  const timePat = CLOCK_PRESETS[opts?.clockFormat ?? '12h'] ?? CLOCK_PRESETS['12h'];
  const datePat = DATE_PRESETS[opts?.dateFormat ?? 'medium'] ?? DATE_PRESETS.medium;
  const tz = opts?.timeZone;
  if (mode === 'clock') return formatDateTokens(now, timePat, tz);
  if (mode === 'date') return formatDateTokens(now, datePat, tz);
  return `${formatDateTokens(now, datePat, tz)}  ${formatDateTokens(now, timePat, tz)}`;
}

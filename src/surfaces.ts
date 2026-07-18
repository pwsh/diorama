// Pure rendering + parsing helpers for the wall-calendar fixture and the TV
// "screen surfaces" (news ticker / weather card). DOM-canvas only — NO three.js
// and NO Planner. Shared by:
//   - three-renderer.ts (paints onto CanvasTextures on the sprite/plane),
//   - canvas-render.ts (2D glyph lines),
//   - the calendar-tv-test.html harness (pixel readback + parse matrices).
// The paint functions receive a canvas + size it themselves so the caller can
// build a CanvasTexture from it directly (the env-sprite / now-playing idiom).
import { CONDITION_GLYPH } from './weather.js';
import type { WeatherNow } from './weather.js';
import type { ForecastRecord } from './ha-client.js';

// ── Calendar ────────────────────────────────────────────────────────────────

export interface CalEvent {
  summary: string;
  start: string;          // ISO date ('2026-07-20', all-day) or datetime ('...T09:00:00')
  end?: string;
  allDay: boolean;
  location?: string;
  calendarId: string;
}

// A calendar event start/end is normally a bare ISO string, but some platform
// shapes wrap it as { date } / { dateTime } — accept both belt-and-braces.
function calDate(v: unknown): string | null {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.dateTime === 'string') return o.dateTime;
    if (typeof o.date === 'string') return o.date;
  }
  return null;
}

// Normalize the `calendar.get_events` (+ return_response) envelope
// ({ response: { <entity_id>: { events: [...] } } }) into a flat, chronologically
// sorted CalEvent[]. Tolerates missing entries / malformed events (skips them).
// Mirrors ha-client.normalizeForecasts. Never throws.
export function normalizeCalendarEvents(raw: unknown, entityIds: string[]): CalEvent[] {
  const resp = (raw as { response?: Record<string, unknown> } | null)?.response
    ?? (raw as Record<string, unknown> | null);   // some callers pass the response map directly
  if (!resp || typeof resp !== 'object') return [];
  const out: CalEvent[] = [];
  for (const id of entityIds) {
    const entry = (resp as Record<string, unknown>)[id] as { events?: unknown } | undefined;
    const evs = entry?.events;
    if (!Array.isArray(evs)) continue;
    for (const e of evs) {
      if (!e || typeof e !== 'object') continue;
      const ev = e as Record<string, unknown>;
      const start = calDate(ev.start);
      if (!start) continue;
      const summary = typeof ev.summary === 'string' && ev.summary.trim() ? ev.summary
        : typeof ev.message === 'string' && ev.message.trim() ? ev.message : '(busy)';
      out.push({
        summary,
        start,
        end: calDate(ev.end) ?? undefined,
        allDay: !start.includes('T'),
        location: typeof ev.location === 'string' ? ev.location : undefined,
        calendarId: id,
      });
    }
  }
  out.sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  return out;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function isSameDay(iso: string, now: Date): boolean {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

// "HH:mm" for a timed event; "All day" for all-day; "Mon 21" for a future day.
export function calTimeLabel(ev: CalEvent, now: Date = new Date()): string {
  if (ev.allDay) return 'All day';
  const d = new Date(ev.start);
  if (isNaN(d.getTime())) return '';
  if (isSameDay(ev.start, now)) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
}

export interface CalRow { time: string; title: string; today: boolean; color: string; }
export interface CalLines { header: string; rows: CalRow[]; empty: boolean; }

// Pure agenda model: today's date header + up to `maxRows` upcoming events with
// their time label, source-calendar color dot, and a `today` flag. Testable
// without a canvas.
export function calendarLines(
  events: CalEvent[], now: Date = new Date(),
  opts: { maxRows?: number; calColors?: Record<string, string> } = {},
): CalLines {
  const maxRows = opts.maxRows ?? 3;
  const header = `${WEEKDAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${now.getDate()}`;
  const rows: CalRow[] = events.slice(0, maxRows).map(ev => ({
    time: calTimeLabel(ev, now),
    title: ev.summary,
    today: isSameDay(ev.start, now),
    color: opts.calColors?.[ev.calendarId] ?? CAL_DEFAULT_DOT,
  }));
  return { header, rows, empty: events.length === 0 };
}

export const CAL_HEADER_COLOR = '#f4b73e';   // amber "today" header accent
export const CAL_TODAY_COLOR = '#ff5252';    // marker for an event happening today
export const CAL_DEFAULT_DOT = '#7fd4ff';

// Paint the wall-calendar plaque onto `cv` (sized by this function). Header band
// in CAL_HEADER_COLOR (the "today highlight"), then up to `maxRows` event rows
// (color dot + time + truncated title); a row that is today gets a
// CAL_TODAY_COLOR left marker + time text. Empty → dim "No events".
export function paintCalendarCanvas(
  cv: HTMLCanvasElement, events: CalEvent[],
  opts: { now?: Date; maxRows?: number; calColors?: Record<string, string>; title?: string } = {},
): void {
  const now = opts.now ?? new Date();
  const maxRows = opts.maxRows ?? 3;
  const model = calendarLines(events, now, { maxRows, calColors: opts.calColors });
  const W = 360, headH = 62, rowH = 46, pad = 14;
  const H = headH + Math.max(1, maxRows) * rowH + pad;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  // Plaque body.
  ctx.fillStyle = 'rgba(12,16,22,0.94)';
  ctx.beginPath(); ctx.roundRect(2, 2, W - 4, H - 4, 16); ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(120,144,156,0.5)'; ctx.stroke();
  // Header band (today accent).
  ctx.save();
  ctx.beginPath(); ctx.roundRect(8, 8, W - 16, headH - 8, 12); ctx.clip();
  ctx.fillStyle = CAL_HEADER_COLOR; ctx.fillRect(8, 8, W - 16, headH - 8);
  ctx.restore();
  ctx.fillStyle = '#1a130a';
  ctx.font = '600 30px system-ui, sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('📅 ' + model.header, 22, 8 + (headH - 8) / 2);
  if (opts.title) {
    ctx.font = '500 18px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(opts.title.slice(0, 16), W - 24, 8 + (headH - 8) / 2);
  }
  // Event rows.
  if (model.empty) {
    ctx.fillStyle = '#78909c';
    ctx.font = '400 24px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('No events', W / 2, headH + rowH / 2);
    return;
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (let i = 0; i < model.rows.length; i++) {
    const r = model.rows[i];
    const y = headH + i * rowH + rowH / 2;
    // Today marker bar (left edge) — the per-event "today" highlight.
    if (r.today) { ctx.fillStyle = CAL_TODAY_COLOR; ctx.fillRect(8, y - rowH / 2 + 4, 6, rowH - 8); }
    // Source-calendar color dot.
    ctx.fillStyle = r.color;
    ctx.beginPath(); ctx.arc(30, y, 7, 0, 2 * Math.PI); ctx.fill();
    // Time.
    ctx.fillStyle = r.today ? CAL_TODAY_COLOR : '#ffd88a';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(r.time, 48, y);
    // Title (truncated).
    let t = r.title;
    if (t.length > 20) t = t.slice(0, 19) + '…';
    ctx.fillStyle = '#eceff1';
    ctx.font = '400 22px system-ui, sans-serif';
    ctx.fillText(t, 150, y);
  }
}

// ── News ticker ───────────────────────────────────────────────────────────

type HassLike = { state?: string; attributes?: Record<string, unknown> } | null | undefined;

function pickStr(o: unknown, keys: string[]): string | null {
  if (!o || typeof o !== 'object') return null;
  const r = o as Record<string, unknown>;
  for (const k of keys) {
    const v = r[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}
function dedupe(a: string[]): string[] {
  const seen = new Set<string>(); const out: string[] = [];
  for (const s of a) { if (!seen.has(s)) { seen.add(s); out.push(s); } }
  return out;
}

// Defensively pull a list of headline strings out of ANY sensor/event entity's
// attributes (feedparser list, event.* single entry, template sensor, …). No
// hard dependency on one integration's schema — reads list-shaped attributes,
// then scalar title/headline/summary, then a meaningful state string. Missing
// attributes are tolerated → []. Mirrors the "generic best-effort" binding the
// research doc §2.2 recommends.
export function parseHeadlines(st: HassLike): string[] {
  if (!st) return [];
  const a = st.attributes ?? {};
  // 1. Known list-shaped attributes.
  const listKeys = ['entries', 'items', 'articles', 'feed', 'headlines', 'news', 'posts'];
  for (const k of listKeys) {
    const v = a[k];
    if (Array.isArray(v) && v.length) {
      const out: string[] = [];
      for (const it of v) {
        if (typeof it === 'string') { if (it.trim()) out.push(it.trim()); }
        else { const t = pickStr(it, ['title', 'headline', 'summary', 'message', 'name', 'description']); if (t) out.push(t); }
      }
      if (out.length) return dedupe(out);
    }
  }
  // 2. Any other array-of-objects attribute with a title-ish field.
  for (const v of Object.values(a)) {
    if (Array.isArray(v) && v.length && v[0] && typeof v[0] === 'object') {
      const out: string[] = [];
      for (const it of v) { const t = pickStr(it, ['title', 'headline', 'summary']); if (t) out.push(t); }
      if (out.length) return dedupe(out);
    }
  }
  // 3. Single scalar headline field.
  const single = pickStr(a, ['title', 'headline', 'summary', 'message']);
  if (single) return [single];
  // 4. Last resort: a meaningful (non-numeric, non-timestamp) state string.
  const s = (st.state ?? '').trim();
  if (s.length > 4 && /\s/.test(s) && isNaN(Number(s)) && !/^\d{4}-\d\d-\d\d/.test(s)
    && s !== 'unknown' && s !== 'unavailable') return [s];
  return [];
}

// Marquee x-offset for a headline of width `textW` scrolling right→left across a
// strip of width `stripW`, wrapping so it re-enters from the right edge. Pure /
// deterministic (the vent/flow scroll-offset idiom). Starts at the right edge.
export function tickerScrollX(elapsedS: number, textW: number, stripW: number, pxPerSec = 70): number {
  const span = textW + stripW;
  if (span <= 0) return 0;
  const d = ((elapsedS * pxPerSec) % span + span) % span;
  return stripW - d;
}

// Which headline to show, rotating every `holdS` seconds through `count`.
export function tickerHeadlineIndex(elapsedS: number, count: number, holdS = 10): number {
  if (count <= 0) return 0;
  return Math.floor(Math.max(0, elapsedS) / holdS) % count;
}

export const NEWS_STRIP_BG = 'rgba(6,10,18,0.9)';

// Paint the news ticker strip onto `cv` (sized W×H). Draws `headline` starting at
// `scrollX` (from tickerScrollX), clipped to the strip. Returns the measured text
// width so the caller can feed it back into tickerScrollX next frame.
export function paintNewsTickerCanvas(
  cv: HTMLCanvasElement, headline: string, scrollX: number,
  opts: { w?: number; h?: number } = {},
): number {
  const W = opts.w ?? 640, H = opts.h ?? 72;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = NEWS_STRIP_BG;
  ctx.fillRect(0, 0, W, H);
  // "LIVE"-ish tag on the left.
  ctx.fillStyle = '#e53935';
  ctx.fillRect(0, 0, 92, H);
  ctx.fillStyle = '#fff';
  ctx.font = '700 30px system-ui, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('📰', 46, H / 2);
  // Scrolling headline (clipped to the strip right of the tag).
  ctx.save();
  ctx.beginPath(); ctx.rect(96, 0, W - 96, H); ctx.clip();
  ctx.font = '500 34px system-ui, sans-serif';
  const tw = ctx.measureText(headline).width;
  ctx.fillStyle = '#f5f7fa';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(headline, 96 + scrollX, H / 2);
  ctx.restore();
  return tw;
}

// ── Weather-on-TV card ──────────────────────────────────────────────────────

export interface WeatherCardModel {
  glyph: string;
  temp: string;
  label: string;
  forecast: { day: string; glyph: string; hi: string; lo: string }[];
}

function cToDisplay(c: number | null | undefined, imperial: boolean): string {
  if (typeof c !== 'number' || !isFinite(c)) return '—';
  const v = imperial ? c * 9 / 5 + 32 : c;
  return `${Math.round(v)}°`;
}

// Pure model for the weather-on-TV card: current glyph + temp + place label plus
// up to `days` forecast entries from the daily forecast cache. Testable without a
// canvas.
export function weatherCardLines(
  now: WeatherNow | null, forecast: ForecastRecord[] | null,
  imperial = false, days = 3,
): WeatherCardModel {
  const glyph = now ? (CONDITION_GLYPH[now.condition] ?? '❓') : '❓';
  const temp = now ? cToDisplay(now.tempC, imperial) : '—';
  const label = now?.label ?? '';
  const fc: WeatherCardModel['forecast'] = [];
  const list = forecast ?? [];
  for (let i = 0; i < list.length && fc.length < days; i++) {
    const r = list[i];
    const d = r.datetime ? new Date(r.datetime) : null;
    const day = d && !isNaN(d.getTime()) ? WEEKDAYS[d.getDay()] : `+${i + 1}`;
    fc.push({
      day,
      glyph: r.condition ? (CONDITION_GLYPH[r.condition as WeatherNow['condition']] ?? '') : '',
      hi: cToDisplay(r.temperature, imperial),
      lo: cToDisplay(r.templow, imperial),
    });
  }
  return { glyph, temp, label, forecast: fc };
}

// Paint the weather-on-TV card onto `cv` (sized by this function). Big glyph +
// temp on the left, place label under it, a small forecast strip on the right.
// Redraw only when the model changes (static between weather pushes).
export function paintWeatherCardCanvas(
  cv: HTMLCanvasElement, now: WeatherNow | null, forecast: ForecastRecord[] | null,
  opts: { imperial?: boolean; days?: number } = {},
): void {
  const m = weatherCardLines(now, forecast, !!opts.imperial, opts.days ?? 3);
  const W = 640, H = 360;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  ctx.clearRect(0, 0, W, H);
  // Screen background (cool gradient-ish flat).
  ctx.fillStyle = 'rgba(10,20,34,0.96)';
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, 18); ctx.fill();
  // Current: glyph + temp.
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '110px system-ui, sans-serif';
  ctx.fillText(m.glyph, 150, 150);
  ctx.fillStyle = '#f5f7fa';
  ctx.font = '600 88px system-ui, sans-serif';
  ctx.fillText(m.temp, 150, 260);
  if (m.label) {
    ctx.fillStyle = '#90caf9';
    ctx.font = '400 30px system-ui, sans-serif';
    ctx.fillText(m.label.slice(0, 18), 150, 322);
  }
  // Forecast strip (right).
  const n = m.forecast.length;
  if (n) {
    const x0 = 320, colW = (W - x0 - 20) / n;
    for (let i = 0; i < n; i++) {
      const fx = x0 + colW * i + colW / 2;
      const fe = m.forecast[i];
      ctx.fillStyle = '#cfd8dc';
      ctx.font = '500 30px system-ui, sans-serif';
      ctx.fillText(fe.day, fx, 90);
      ctx.font = '56px system-ui, sans-serif';
      ctx.fillText(fe.glyph, fx, 170);
      ctx.fillStyle = '#f5f7fa';
      ctx.font = '600 30px system-ui, sans-serif';
      ctx.fillText(fe.hi, fx, 240);
      ctx.fillStyle = '#90a4ae';
      ctx.font = '400 26px system-ui, sans-serif';
      ctx.fillText(fe.lo, fx, 282);
    }
  }
}

// ── TV screen content precedence ────────────────────────────────────────────

export type ScreenMode = 'off' | 'now_playing' | 'news' | 'weather' | 'auto';
export type ScreenContent = 'off' | 'now_playing' | 'news' | 'weather';

// Resolve what a TV screen should display. Rule (research doc §4.2): a bound
// media_player actually presenting media ALWAYS wins (now-playing precedence —
// playing/paused media hides the surface); otherwise, if the TV is powered on,
// fall through to the configured screen mode (news/weather); else nothing.
// 'auto'/'now_playing'/undefined with no media → nothing extra.
export function resolveScreenContent(
  mode: ScreenMode | undefined, hasMedia: boolean, tvOn: boolean,
): ScreenContent {
  if (hasMedia) return 'now_playing';
  if (!tvOn) return 'off';
  if (mode === 'news' || mode === 'weather') return mode;
  return 'off';
}

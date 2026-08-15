// The ONLY file that obtains aircraft/satellite JSON — every fetch() for the
// feature is here, as is the one server-side (HA rest_command) transport. The
// weather.ts isolation pattern. Every function is async, try/catches everything,
// and returns null on ANY failure (bad URL, non-2xx, malformed JSON, offline,
// CORS block). Nothing here ever throws into the poll / RAF / tick path.
//
// App-graph only: never import this from the lazy renderer chunk. Parsing lives
// in the pure, zero-import src/flights.ts — this module returns raw JSON and
// hands it to the normalizer, so the normalizer stays fixture-testable with no
// network mocking.
//
// Third-party network calls happen ONLY when Store.flights.enabled is set (the
// opt-in precedent every network-touching Store field follows).

import { flightProxyVars, resolveFlightSource, sanitizeFlightProxyCommand,
         unwrapRestCommandPayload, type IssNow } from './flights.js';

// A user-supplied receiver URL must be plain http(s) — the neighborhood
// custom-tile-template scheme check, so a pasted `javascript:`/`file:`/`data:`
// URL can never reach fetch().
function httpOk(url: string): boolean {
  try {
    const p = new URL(url).protocol;
    return p === 'http:' || p === 'https:';
  } catch { return false; }
}

async function getJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json() as unknown;
  } catch { return null; }
}

// A LAN receiver's own aircraft.json (dump1090-fa / readsb / tar1090 /
// ultrafeeder). The URL is used VERBATIM — the path is install-dependent and
// there is no canonical one, so guessing would be worse than asking.
//
// Two failure modes the user must fix on the receiver, not here: stock tar1090
// serves NO CORS header on data/aircraft.json (one lighttpd block adds it), and
// a plain-http receiver is blocked as mixed content when the panel itself is
// served over https. Both surface as a plain null.
export async function fetchLocalAircraft(url: string): Promise<unknown | null> {
  if (!url || !httpOk(url)) return null;
  return getJson(url);
}

// airplanes.live — WAS the one keyless cloud ADS-B API sending
// `access-control-allow-origin: *`. As of 2026-08-15 it answers HTTP 403 to
// everyone with: "Please contact us at contact@airplanes.live. Your email MUST
// include a link to your project…" — a POLICY change, not an outage, and a
// browser User-Agent does not change it. Kept selectable (a user granted access
// keeps working, and we must not silently rewrite their stored choice) but no
// longer the default; the settings UI states the 403 up front.
// Documented 1 req/s ceiling; the planner's poll floor (5 s) sits far under it.
// Response is `{ac:[...]}` with per-aircraft fields identical to aircraft.json.
export async function fetchAirplanesLive(
  lat: number, lon: number, radiusNm: number,
): Promise<unknown | null> {
  if (!isFinite(lat) || !isFinite(lon)) return null;
  const r = Math.max(1, Math.min(250, Math.round(isFinite(radiusNm) ? radiusNm : 15)));
  return getJson(
    `https://api.airplanes.live/v2/point/${lat.toFixed(4)}/${lon.toFixed(4)}/${r}`);
}

// ── Server-side (Home Assistant) transport ─────────────────────────────────
// opensky + adsb.lol both answer fine but send no usable CORS header, so the
// BROWSER cannot call them (measured 2026-08-15: curl 200, fetch TypeError from
// a foreign origin). They are fetched by HA itself through a user-defined
// `rest_command`, called with `return_response: true` — the same mechanism
// `weather.get_forecasts` / `calendar.get_events` already use.
//
// This is NOT a fetch site, but it stays here so that "how do we obtain aircraft
// JSON, and with what request parameters" lives in exactly one module. The
// api surface is narrowed structurally so tests can hand in a two-line fake.
export interface FlightProxyApi {
  callServiceWithResponse(
    domain: string, service: string, data: Record<string, unknown>,
  ): Promise<unknown | null>;
}

// Returns the unwrapped aircraft envelope (whatever the provider sent), or null
// on ANY failure — missing api, unconfigured command name, HA error, unknown
// service, non-JSON body. Never throws; the caller decides how to report it.
export async function fetchProxiedAircraft(
  api: FlightProxyApi | null | undefined,
  source: string, command: string | undefined,
  lat: number, lon: number, radiusNm: number,
): Promise<unknown | null> {
  const cmd = sanitizeFlightProxyCommand(command);
  if (!api || typeof api.callServiceWithResponse !== 'function' || !cmd) return null;
  if (!isFinite(lat) || !isFinite(lon)) return null;
  try {
    const raw = await api.callServiceWithResponse(
      'rest_command', cmd, flightProxyVars(resolveFlightSource(source), lat, lon, radiusNm));
    return unwrapRestCommandPayload(raw);
  } catch { return null; }
}

// wheretheiss.at — live ISS sub-point. CORS-open, keyless, ~350 req / 5 min.
// A POSITION feed, not a propagator: it answers "where is it now" and nothing
// else. Units are normalized here (the API reports altitude in km and velocity
// in km/H; timestamp is epoch SECONDS) so IssNow is unambiguous downstream.
export async function fetchIssNow(): Promise<IssNow | null> {
  const j = await getJson('https://api.wheretheiss.at/v1/satellites/25544');
  if (!j || typeof j !== 'object') return null;
  const o = j as Record<string, unknown>;
  const n = (v: unknown): number | null =>
    typeof v === 'number' && isFinite(v) ? v : null;
  const lat = n(o.latitude), lon = n(o.longitude);
  if (lat === null || lon === null) return null;
  const ts = n(o.timestamp);
  return {
    lat, lon,
    altKm: n(o.altitude) ?? 0,
    velKmS: (n(o.velocity) ?? 0) / 3600,
    tsMs: ts !== null ? ts * 1000 : 0,
  };
}

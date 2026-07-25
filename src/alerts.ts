// Alert Center normalization — PURE, deterministic, three.js-FREE (same shape as
// weather.ts / geo.ts). Home Assistant surfaces "things that need a human's
// attention" across several subsystems (persistent notifications, the Repairs
// issue registry, system_log). This module normalizes those into ONE PanelAlert
// shape + resolves the placeable Alert Beacon fixture's state, so both the
// Planner and the UI (and the test harness) agree without touching HA.
//
// Only runtime-erased type imports — bundle the test page with
//   npx esbuild src/alerts.ts --bundle --format=esm --outfile=<harness>/alerts.mod.js
// (matches the weather-test flow; no live HA).
import type { AlertsConfig } from './types.js';

// ── Unified severity (heuristic across sources, see §7 of the research doc) ──
// Repairs has a real 3-level enum; persistent_notification has none (inferred
// from text); system_log uses Python log levels. This 4-level ladder is the
// lowest-common-denominator the badge coloring uses — it is APPROXIMATE.
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
// 'flight' alerts are CLIENT-LOCAL (roadmap P4): the Planner builds them from
// its own polled aircraft/ISS data — there is no HA-side source to collect or
// filter, so they arrive at buildAlertFeed already-built via the `extra` param.
export type AlertSource = 'notification' | 'repair' | 'system' | 'flight';

export const SEVERITY_RANK: Record<AlertSeverity, number> = {
  info: 0, warning: 1, error: 2, critical: 3,
};
export function severityRank(s: AlertSeverity): number { return SEVERITY_RANK[s] ?? 0; }

// Shared 2D/3D/UI palette (mirrors ALARM_STATE_COLORS' shared pattern).
export const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info:     '#42a5f5',
  warning:  '#ffb74d',
  error:    '#ff7043',
  critical: '#ef5350',
};
export function severityColor(s: AlertSeverity): string { return SEVERITY_COLOR[s] ?? '#90a4ae'; }

// ── Raw HA shapes (subset of the WS payloads) ──────────────────────────────
export interface HaNotification {
  notification_id: string;
  title?: string | null;
  message: string;
  created_at?: string;   // ISO or epoch-ish string; passed through as createdAt
}

// One push from persistent_notification/subscribe. `type` is HA's UpdateType
// (current = full snapshot, added/updated/removed = deltas keyed by id).
export interface NotificationsUpdate {
  type: 'current' | 'added' | 'updated' | 'removed';
  notifications: Record<string, HaNotification>;
}

export interface RepairIssue {
  issue_id: string;
  domain: string;
  severity: string;                 // 'critical' | 'error' | 'warning'
  translation_key?: string;
  translation_placeholders?: Record<string, unknown>;
  is_fixable?: boolean;
  issue_domain?: string | null;
  created?: string;
  breaks_in_ha_version?: string | null;
  learn_more_url?: string | null;
  ignored?: boolean;                // derived: dismissed_version present ⇒ ignored
}

// ── One normalized alert (the single shape the topbar drawer + beacon read) ──
export interface PanelAlert {
  id: string;                       // stable per source (`notif:<id>` / `repair:<domain>/<issue>`)
  source: AlertSource;
  severity: AlertSeverity;
  title: string;
  message?: string;
  createdAt?: string;               // ISO/string; sort key + relative-time display
  dismissible: boolean;             // notification.dismiss / repairs.ignore available
  domain?: string;                  // repair only
  issueId?: string;                 // repair only
  notificationId?: string;          // notification only
  learnMoreUrl?: string;            // repair "view in Repairs →" deep-link hint
}

// persistent_notification carries NO severity — infer a conservative one from the
// title/message text. Default 'info' unless a known-bad substring appears. Kept
// intentionally simple + documented-as-approximate (never oversell precision).
const CRIT_RE = /\b(critical|fatal|emergency|corrupt(?:ed|ion)?|danger(?:ous)?)\b/i;
const ERR_RE = /\b(error|failed|failure|unable|not responding|unavailable|crash(?:ed)?)\b/i;
const WARN_RE = /\b(warn(?:ing)?|offline|disconnected|deprecated|expir(?:e|ed|ing)|low battery|update available)\b/i;
export function classifyNotificationSeverity(title?: string | null, message?: string): AlertSeverity {
  const text = `${title ?? ''} ${message ?? ''}`;
  if (CRIT_RE.test(text)) return 'critical';
  if (ERR_RE.test(text)) return 'error';
  if (WARN_RE.test(text)) return 'warning';
  return 'info';
}

// Repairs' 3-level enum → the unified ladder (critical/error/warning map 1:1;
// anything unknown floors to 'warning', matching HA's default issue severity).
export function repairSeverity(s: string | null | undefined): AlertSeverity {
  switch (s) {
    case 'critical': return 'critical';
    case 'error':    return 'error';
    case 'warning':  return 'warning';
    default:         return 'warning';
  }
}

// Human title for a Repairs issue when the integration only supplies a
// translation_key (Diorama has no translation catalog). "<key> (<domain>)".
export function repairTitle(r: RepairIssue): string {
  const key = (r.translation_key || r.issue_id || 'issue').replace(/_/g, ' ');
  return `${key} (${r.domain})`;
}

function severityFloor(cfg?: AlertsConfig): AlertSeverity {
  return cfg?.minRepairSeverity ?? 'warning';
}

// Build the merged, filtered, sorted alert feed. Per-source toggles (default ON
// for notifications + repairs), severity floor applied to repairs (§4.1). Newest
// + most-severe first. Deterministic — no Date/Math.random.
//
// `extra` (optional, back-compatible) carries ALREADY-BUILT client-local alerts —
// today only the flight/ISS notices the Planner computes from its own polled
// data. They are appended VERBATIM: the per-source toggles and the Repairs
// severity floor are HA-source policy and deliberately do NOT apply to them (the
// caller owns their whole lifecycle, including dismissal). They still take part
// in the shared sort.
export function buildAlertFeed(
  notifications: HaNotification[],
  repairs: RepairIssue[],
  cfg?: AlertsConfig,
  extra?: PanelAlert[],
): PanelAlert[] {
  const out: PanelAlert[] = [];
  if (cfg?.showPersistentNotifications !== false) {
    for (const n of notifications) {
      out.push({
        id: `notif:${n.notification_id}`,
        source: 'notification',
        severity: classifyNotificationSeverity(n.title, n.message),
        title: (n.title && n.title.trim()) || 'Notification',
        message: n.message,
        createdAt: n.created_at,
        dismissible: true,
        notificationId: n.notification_id,
      });
    }
  }
  if (cfg?.showRepairs !== false) {
    const floor = severityRank(severityFloor(cfg));
    for (const r of repairs) {
      if (r.ignored) continue;
      const sev = repairSeverity(r.severity);
      if (severityRank(sev) < floor) continue;
      out.push({
        id: `repair:${r.domain}/${r.issue_id}`,
        source: 'repair',
        severity: sev,
        title: repairTitle(r),
        message: r.breaks_in_ha_version
          ? `Breaks in Home Assistant ${r.breaks_in_ha_version}` : undefined,
        createdAt: r.created,
        dismissible: true,          // via repairs/ignore_issue
        domain: r.domain,
        issueId: r.issue_id,
        learnMoreUrl: r.learn_more_url ?? undefined,
      });
    }
  }
  if (extra) for (const a of extra) out.push(a);
  out.sort((a, b) => {
    const d = severityRank(b.severity) - severityRank(a.severity);
    if (d !== 0) return d;
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return (isFinite(tb) ? tb : 0) - (isFinite(ta) ? ta : 0);
  });
  return out;
}

// Worst severity present in a feed (for the bell badge color). null when empty.
export function worstSeverity(feed: PanelAlert[]): AlertSeverity | null {
  let worst: AlertSeverity | null = null;
  for (const a of feed) {
    if (!worst || severityRank(a.severity) > severityRank(worst)) worst = a.severity;
  }
  return worst;
}

// Count of feed items NOT in the client-local "seen" id set (drives the unread
// badge count + the bell pulse). seenIds is a plain Set of PanelAlert.id.
export function unreadCount(feed: PanelAlert[], seenIds: Set<string>): number {
  let n = 0;
  for (const a of feed) if (!seenIds.has(a.id)) n++;
  return n;
}

// Whether the alert center collectors should run at all (opt-out; absent = on).
export function alertCenterEnabled(cfg?: AlertsConfig): boolean {
  return cfg?.enabled !== false;
}

// Whether the topbar bell is visible in a given UI mode. Edit always; kiosk/view
// only when explicitly opted in (§7: Repairs/notification text may be
// instance-specific — don't expose on a shared kiosk screen by default).
export function alertBellVisible(cfg: AlertsConfig | undefined, uiMode: string): boolean {
  if (!alertCenterEnabled(cfg)) return false;
  if (uiMode === 'edit') return true;
  return cfg?.showInKiosk === true;
}

// ── Alert Beacon fixture state resolution (§4.2) ────────────────────────────
// The placeable beacon binds an alert.* / binary_sensor.* (or carries an unbound
// localState). The `alert` domain has a THREE-state quirk (§2.5): idle (clear),
// on (active + UNACKNOWLEDGED), off (active but ACKNOWLEDGED). A plain
// binary_sensor only has on(active)/off(clear). We disambiguate by domain.
export type BeaconState = 'idle' | 'active' | 'ack';

export const ALERT_STATE_COLORS: Record<BeaconState, string> = {
  idle:   '#78909c',   // dim gray — nothing wrong
  active: '#ef5350',   // pulsing red — unacknowledged / alarming
  ack:    '#ffb300',   // steady amber — acknowledged but still active (alert domain)
};

// Resolve a beacon's visual state from a raw HA state string + whether the bound
// entity is an alert.* entity (only there does 'off' mean acknowledged).
export function alertBeaconState(state: string | null | undefined, isAlertDomain: boolean): BeaconState {
  if (state === 'on') return 'active';
  if (isAlertDomain && state === 'off') return 'ack';   // acknowledged, still active
  return 'idle';
}
export function alertBeaconColor(bs: BeaconState): string { return ALERT_STATE_COLORS[bs]; }
// The beacon pulses/erupts only while ACTIVE (unacknowledged). Ack = steady.
export function alertBeaconAlarming(bs: BeaconState): boolean { return bs === 'active'; }
// An entity id is in the alert.* domain (three-state acknowledge semantics).
export function isAlertDomain(entityId: string | null | undefined): boolean {
  return typeof entityId === 'string' && entityId.startsWith('alert.');
}

// ── Alert Beacon geometry defaults (ceiling puck; free placement, no wall snap;
// same silhouette/scale as the Safety Sensor per §3/§4.2) ──────────────────
export const ALERT_BEACON_DEFAULTS = {
  ceilingMm: 2743, discRadiusMm: 120,
};
export function alertBeaconHeight(b: { height?: number }): number {
  return b.height ?? ALERT_BEACON_DEFAULTS.ceilingMm;
}

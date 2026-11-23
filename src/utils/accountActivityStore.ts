/**
 * Personal Account Profile, Visit History, Ticket Sync & Admin Login Audit Log
 * - Syncs with Firebase Realtime Database REST API (with localStorage fallback):
 *   + /users/{uid}/profile.json
 *   + /users/{uid}/visitHistory.json (max 50 latest)
 *   + /users/{uid}/tickets.json
 *   + /adminLogs/loginHistory.json (max 100 latest, F5 deduplicated via sessionStorage)
 */

import {
  FIREBASE_DB_URL,
  isFirebaseDbConfigured,
  sanitizeFirebaseUserKey,
} from './firebaseRestSync';
import { TOUR_ROUTES } from '../data/tours';
import type { IssuedPassRecord } from './adminPlatformStore';

const KEY_USER_PROFILE_PREFIX = 'dau_an_viet_user_profile_v1_';
const KEY_VISIT_HISTORY_PREFIX = 'dau_an_viet_personal_visit_history_v1_';
const KEY_USER_TICKETS_PREFIX = 'dau_an_viet_personal_tickets_v1_';
const KEY_ADMIN_LOGIN_AUDIT = 'dau_an_viet_admin_login_audit_v1';
const SESSION_KEY_LOGIN_RECORDED = 'dau_an_viet_login_audit_session_recorded_v1';
const SESSION_KEY_CURRENT_AUDIT = 'dau_an_viet_current_login_audit_entry_v1';

export const PERSONAL_PROFILE_UPDATED_EVENT = 'dau-an-viet-personal-profile-updated';
export const PERSONAL_VISIT_HISTORY_UPDATED_EVENT = 'dau-an-viet-personal-visit-history-updated';
export const PERSONAL_TICKETS_UPDATED_EVENT = 'dau-an-viet-personal-tickets-updated';
export const LOGIN_AUDIT_UPDATED_EVENT = 'dau-an-viet-login-audit-updated';

const MAX_VISIT_HISTORY_ITEMS = 50;
const MAX_LOGIN_AUDIT_ITEMS = 100;

export interface UserPersonalProfile {
  uid: string;
  displayName: string;
  phone: string;
  email: string;
  role: 'admin' | 'visitor';
  updatedAt: string;
}

export type VisitActivityType = '3d_explore' | 'audio_guide';

export interface UserVisitHistoryEntry {
  id: string;
  siteId: string;
  siteName: string;
  routeId: string;
  routeTitle: string;
  activityType: VisitActivityType;
  visitedAt: string;
}

export interface AdminLoginAuditEntry {
  id: string;
  sessionId: string;
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'visitor';
  authProviderLabel: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceLabel: string;
  os: string;
  browser: string;
  loggedInAt: string;
  formattedTimeVn: string;
  city: string;
  country: string;
  ip: string;
  locationDisplay: string;
  timezone: string;
  usedTimezoneFallback: boolean;
}

function emitWindowEvent(name: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name));
  }
}

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

// ============================================================================
// 1. PERSONAL PROFILE (/users/{uid}/profile)
// ============================================================================
export function loadLocalPersonalProfile(uid: string): UserPersonalProfile | null {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid) return null;
  return readLocalJson<UserPersonalProfile | null>(`${KEY_USER_PROFILE_PREFIX}${safeUid}`, null);
}

export async function savePersonalProfile(
  profile: Omit<UserPersonalProfile, 'updatedAt'> & { updatedAt?: string }
): Promise<{ ok: boolean; syncedFirebase: boolean; profile: UserPersonalProfile }> {
  const safeUid = sanitizeFirebaseUserKey(profile.uid);
  const record: UserPersonalProfile = {
    uid: profile.uid,
    displayName: profile.displayName.trim(),
    phone: profile.phone.trim(),
    email: profile.email.toLowerCase().trim(),
    role: profile.role,
    updatedAt: profile.updatedAt || new Date().toISOString(),
  };

  if (safeUid) {
    writeLocalJson(`${KEY_USER_PROFILE_PREFIX}${safeUid}`, record);
    emitWindowEvent(PERSONAL_PROFILE_UPDATED_EVENT);
  }

  let syncedFirebase = false;
  if (safeUid && isFirebaseDbConfigured() && typeof fetch === 'function') {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/users/${safeUid}/profile.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      syncedFirebase = res.ok;
    } catch {
      syncedFirebase = false;
    }
  }

  return { ok: true, syncedFirebase, profile: record };
}

export async function pullPersonalProfileFromFirebase(
  uid: string
): Promise<UserPersonalProfile | null> {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid) return null;
  const local = loadLocalPersonalProfile(safeUid);
  if (!isFirebaseDbConfigured() || typeof fetch !== 'function') return local;

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/users/${safeUid}/profile.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return local;
    const remote = (await res.json()) as Partial<UserPersonalProfile> | null;
    if (!remote || typeof remote !== 'object') return local;
    const merged: UserPersonalProfile = {
      uid: remote.uid || uid,
      displayName: typeof remote.displayName === 'string' ? remote.displayName : local?.displayName || '',
      phone: typeof remote.phone === 'string' ? remote.phone : local?.phone || '',
      email: typeof remote.email === 'string' ? remote.email : local?.email || '',
      role: remote.role === 'admin' ? 'admin' : local?.role || 'visitor',
      updatedAt: typeof remote.updatedAt === 'string' ? remote.updatedAt : new Date().toISOString(),
    };
    writeLocalJson(`${KEY_USER_PROFILE_PREFIX}${safeUid}`, merged);
    emitWindowEvent(PERSONAL_PROFILE_UPDATED_EVENT);
    return merged;
  } catch {
    return local;
  }
}

// ============================================================================
// 2. PERSONAL VISIT HISTORY TIMELINE (/users/{uid}/visitHistory, MAX 50)
// ============================================================================
export function findRouteForSiteId(siteId: string): { routeId: string; routeTitle: string } {
  const found = TOUR_ROUTES.find((t) => t.sites.includes(siteId));
  if (found) {
    return { routeId: found.id, routeTitle: found.title };
  }
  return { routeId: 'general', routeTitle: 'Di sản Đông Nam Bộ' };
}

export function loadPersonalVisitHistory(uid: string): UserVisitHistoryEntry[] {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid) return [];
  const list = readLocalJson<UserVisitHistoryEntry[]>(`${KEY_VISIT_HISTORY_PREFIX}${safeUid}`, []);
  return Array.isArray(list) ? list : [];
}

export function recordPersonalVisitHistory(params: {
  uid: string;
  siteId: string;
  siteName: string;
  activityType: VisitActivityType;
}): UserVisitHistoryEntry | null {
  const safeUid = sanitizeFirebaseUserKey(params.uid);
  if (!safeUid || !params.siteId) return null;

  const existing = loadPersonalVisitHistory(safeUid);
  const nowMs = Date.now();
  const latest = existing[0];

  // Avoid duplicate noise if the same site & activity was recorded within the last 45 seconds
  if (
    latest &&
    latest.siteId === params.siteId &&
    latest.activityType === params.activityType &&
    nowMs - new Date(latest.visitedAt).getTime() < 45_000
  ) {
    return latest;
  }

  const route = findRouteForSiteId(params.siteId);
  const entry: UserVisitHistoryEntry = {
    id: `visit_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
    siteId: params.siteId,
    siteName: params.siteName,
    routeId: route.routeId,
    routeTitle: route.routeTitle,
    activityType: params.activityType,
    visitedAt: new Date(nowMs).toISOString(),
  };

  const next = [entry, ...existing].slice(0, MAX_VISIT_HISTORY_ITEMS);
  writeLocalJson(`${KEY_VISIT_HISTORY_PREFIX}${safeUid}`, next);
  emitWindowEvent(PERSONAL_VISIT_HISTORY_UPDATED_EVENT);

  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    void fetch(`${FIREBASE_DB_URL}/users/${safeUid}/visitHistory.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    }).catch(() => undefined);
  }

  return entry;
}

export async function pullPersonalVisitHistoryFromFirebase(
  uid: string
): Promise<UserVisitHistoryEntry[]> {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid) return [];
  const local = loadPersonalVisitHistory(safeUid);
  if (!isFirebaseDbConfigured() || typeof fetch !== 'function') return local;

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/users/${safeUid}/visitHistory.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return local;
    const raw = (await res.json()) as unknown;
    const remoteList: UserVisitHistoryEntry[] = Array.isArray(raw)
      ? (raw.filter(Boolean) as UserVisitHistoryEntry[])
      : raw && typeof raw === 'object'
      ? (Object.values(raw as Record<string, UserVisitHistoryEntry>).filter(Boolean) as UserVisitHistoryEntry[])
      : [];

    if (remoteList.length === 0) return local;

    const mergedMap = new Map<string, UserVisitHistoryEntry>();
    for (const item of [...local, ...remoteList]) {
      if (item && item.id) mergedMap.set(item.id, item);
    }
    const merged = Array.from(mergedMap.values())
      .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
      .slice(0, MAX_VISIT_HISTORY_ITEMS);

    writeLocalJson(`${KEY_VISIT_HISTORY_PREFIX}${safeUid}`, merged);
    emitWindowEvent(PERSONAL_VISIT_HISTORY_UPDATED_EVENT);
    return merged;
  } catch {
    return local;
  }
}

export async function clearPersonalVisitHistory(uid: string): Promise<void> {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid) return;
  writeLocalJson(`${KEY_VISIT_HISTORY_PREFIX}${safeUid}`, []);
  emitWindowEvent(PERSONAL_VISIT_HISTORY_UPDATED_EVENT);

  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    try {
      await fetch(`${FIREBASE_DB_URL}/users/${safeUid}/visitHistory.json`, {
        method: 'DELETE',
      });
    } catch {
      // ignore network error
    }
  }
}

// ============================================================================
// 3. PERSONAL TICKETS SYNC (/users/{uid}/tickets)
// ============================================================================
export function syncUserTicketToPersonalFirebaseNode(
  uid: string | undefined,
  pass: IssuedPassRecord
): void {
  if (!uid) return;
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid) return;

  const existing = readLocalJson<IssuedPassRecord[]>(`${KEY_USER_TICKETS_PREFIX}${safeUid}`, []);
  const deduped = [pass, ...existing.filter((p) => p.id !== pass.id && p.code !== pass.code)].slice(0, 100);
  writeLocalJson(`${KEY_USER_TICKETS_PREFIX}${safeUid}`, deduped);
  emitWindowEvent(PERSONAL_TICKETS_UPDATED_EVENT);

  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    void fetch(`${FIREBASE_DB_URL}/users/${safeUid}/tickets.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deduped),
    }).catch(() => undefined);
  }
}

export async function pullPersonalTicketsFromFirebase(
  uid: string
): Promise<IssuedPassRecord[]> {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid) return [];
  const local = readLocalJson<IssuedPassRecord[]>(`${KEY_USER_TICKETS_PREFIX}${safeUid}`, []);
  if (!isFirebaseDbConfigured() || typeof fetch !== 'function') return local;

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/users/${safeUid}/tickets.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return local;
    const raw = (await res.json()) as unknown;
    const remoteList: IssuedPassRecord[] = Array.isArray(raw)
      ? (raw.filter(Boolean) as IssuedPassRecord[])
      : raw && typeof raw === 'object'
      ? (Object.values(raw as Record<string, IssuedPassRecord>).filter(Boolean) as IssuedPassRecord[])
      : [];
    if (remoteList.length === 0) return local;

    const mergedMap = new Map<string, IssuedPassRecord>();
    for (const p of [...local, ...remoteList]) {
      if (p && p.id) mergedMap.set(p.id, p);
    }
    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
    writeLocalJson(`${KEY_USER_TICKETS_PREFIX}${safeUid}`, merged);
    return merged;
  } catch {
    return local;
  }
}

// ============================================================================
// 4. ADMIN LOGIN AUDIT LOG & DEVICE MONITOR (/adminLogs/loginHistory, MAX 100)
// ============================================================================
export function formatVietnamLoginTimestamp(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour12: false,
    }).formatToParts(date);

    const get = (type: string) => parts.find((p) => p.type === type)?.value || '00';
    return `${get('hour')}:${get('minute')}:${get('second')} - ${get('day')}/${get('month')}/${get('year')}`;
  } catch {
    return new Date(isoDate).toLocaleString('vi-VN');
  }
}

export function parseUserAgentDeviceInfo(uaInput?: string): {
  deviceType: 'desktop' | 'mobile' | 'tablet';
  deviceLabel: string;
  os: string;
  browser: string;
} {
  const ua =
    uaInput ??
    (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');
  const lower = ua.toLowerCase();

  // Device type detection
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/ipad|tablet|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|mobile/i.test(ua)) {
    deviceType = 'mobile';
  }

  const deviceLabel =
    deviceType === 'mobile'
      ? 'Điện thoại'
      : deviceType === 'tablet'
      ? 'Máy tính bảng'
      : 'Máy tính';

  // OS detection
  let os = 'Không rõ HĐH';
  if (/iphone|ipad|ipod/i.test(ua)) {
    os = 'iOS';
  } else if (/android/i.test(ua)) {
    os = 'Android';
  } else if (/windows nt/i.test(ua)) {
    os = 'Windows';
  } else if (/mac os x|macintosh/i.test(ua)) {
    os = 'macOS';
  } else if (/cros/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
  }

  // Browser detection (order matters: Cốc Cốc -> Edge -> Opera -> Chrome -> Firefox -> Safari)
  let browser = 'Trình duyệt khác';
  if (lower.includes('coc_coc_browser') || lower.includes('coccoc')) {
    browser = 'Cốc Cốc';
  } else if (lower.includes('edg/') || lower.includes('edga/') || lower.includes('edgios/')) {
    browser = 'Edge';
  } else if (lower.includes('opr/') || lower.includes('opera')) {
    browser = 'Opera';
  } else if (lower.includes('firefox') || lower.includes('fxios')) {
    browser = 'Firefox';
  } else if (lower.includes('chrome') || lower.includes('crios')) {
    browser = 'Chrome';
  } else if (lower.includes('safari')) {
    browser = 'Safari';
  }

  return { deviceType, deviceLabel, os, browser };
}

async function fetchIpLocationFast(timeoutMs = 3000): Promise<{
  city: string;
  country: string;
  ip: string;
  locationDisplay: string;
  timezone: string;
  usedTimezoneFallback: boolean;
}> {
  const systemTz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh'
      : 'Asia/Ho_Chi_Minh';

  const fallback = {
    city: '',
    country: '',
    ip: 'Ẩn / Nội bộ',
    locationDisplay: `Múi giờ ${systemTz}`,
    timezone: systemTz,
    usedTimezoneFallback: true,
  };

  if (typeof fetch !== 'function') return fallback;

  const tryEndpoint = async (
    url: string,
    perCallMs: number
  ): Promise<{ city: string; country: string; ip: string; timezone?: string } | null> => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? window.setTimeout(() => controller.abort(), perCallMs) : null;
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: controller?.signal,
        cache: 'no-store',
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Record<string, unknown>;
      if (!data || data.success === false) return null;
      const ip = typeof data.ip === 'string' ? data.ip.trim() : '';
      const city = typeof data.city === 'string' ? data.city.trim() : '';
      const country =
        typeof data.country === 'string'
          ? data.country.trim()
          : typeof data.country_name === 'string'
          ? data.country_name.trim()
          : '';
      const tz =
        typeof data.timezone === 'string'
          ? data.timezone
          : data.timezone && typeof data.timezone === 'object' && 'id' in data.timezone
          ? String((data.timezone as { id?: unknown }).id || '')
          : undefined;
      if (!city && !country && !ip) return null;
      return { city, country, ip, timezone: tz };
    } catch {
      return null;
    } finally {
      if (timer !== null) window.clearTimeout(timer);
    }
  };

  const startedAt = Date.now();
  const primary = await tryEndpoint('https://ipwho.is/', Math.min(2000, timeoutMs));
  let resolved = primary;
  const remaining = timeoutMs - (Date.now() - startedAt);
  if (!resolved && remaining > 500) {
    resolved = await tryEndpoint('https://ipapi.co/json/', remaining);
  }

  if (!resolved) return fallback;

  const locParts = [resolved.city, resolved.country].filter(Boolean);
  return {
    city: resolved.city,
    country: resolved.country,
    ip: resolved.ip || 'Không xác định',
    locationDisplay: locParts.length > 0 ? locParts.join(', ') : `Múi giờ ${systemTz}`,
    timezone: resolved.timezone || systemTz,
    usedTimezoneFallback: locParts.length === 0,
  };
}

export function loadAdminLoginAuditLogs(): AdminLoginAuditEntry[] {
  const list = readLocalJson<AdminLoginAuditEntry[]>(KEY_ADMIN_LOGIN_AUDIT, []);
  return Array.isArray(list) ? list : [];
}

export function getCurrentSessionLoginAudit(): AdminLoginAuditEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY_CURRENT_AUDIT);
    if (!raw) return null;
    return JSON.parse(raw) as AdminLoginAuditEntry;
  } catch {
    return null;
  }
}

export function clearCurrentSessionLoginAuditMarker(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY_LOGIN_RECORDED);
    window.sessionStorage.removeItem(SESSION_KEY_CURRENT_AUDIT);
  } catch {
    // ignore
  }
}

/**
 * Records a login audit event once per browser session (deduplicated via sessionStorage so F5 never duplicates).
 * Non-blocking: IP lookup runs with max 3s timeout and falls back gracefully to system timezone.
 */
export async function recordLoginAuditIfNewSession(params: {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'visitor';
  authProviderLabel: string;
  forceNewSession?: boolean;
}): Promise<AdminLoginAuditEntry | null> {
  if (typeof window === 'undefined') return null;
  const userKey = `${params.uid}|${params.email.toLowerCase().trim()}`;

  try {
    const prevKey = window.sessionStorage.getItem(SESSION_KEY_LOGIN_RECORDED);
    if (!params.forceNewSession && prevKey === userKey) {
      return getCurrentSessionLoginAudit();
    }
    // Mark immediately before async IP lookup to prevent double triggers during concurrent renders
    window.sessionStorage.setItem(SESSION_KEY_LOGIN_RECORDED, userKey);
  } catch {
    // proceed without sessionStorage if unavailable
  }

  const nowIso = new Date().toISOString();
  const deviceInfo = parseUserAgentDeviceInfo();
  const geo = await fetchIpLocationFast(3000);
  const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  const entry: AdminLoginAuditEntry = {
    id: `login_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sessionId,
    uid: params.uid,
    displayName: params.displayName,
    email: params.email.toLowerCase().trim(),
    role: params.role,
    authProviderLabel: params.authProviderLabel,
    deviceType: deviceInfo.deviceType,
    deviceLabel: deviceInfo.deviceLabel,
    os: deviceInfo.os,
    browser: deviceInfo.browser,
    loggedInAt: nowIso,
    formattedTimeVn: formatVietnamLoginTimestamp(nowIso),
    city: geo.city,
    country: geo.country,
    ip: geo.ip,
    locationDisplay: geo.locationDisplay,
    timezone: geo.timezone,
    usedTimezoneFallback: geo.usedTimezoneFallback,
  };

  try {
    window.sessionStorage.setItem(SESSION_KEY_CURRENT_AUDIT, JSON.stringify(entry));
  } catch {
    // ignore
  }

  // Merge with remote (if available) + local and cap at 100 latest records
  let baseList = loadAdminLoginAuditLogs();
  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/adminLogs/loginHistory.json`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (res.ok) {
        const raw = (await res.json()) as unknown;
        const remoteList: AdminLoginAuditEntry[] = Array.isArray(raw)
          ? (raw.filter(Boolean) as AdminLoginAuditEntry[])
          : raw && typeof raw === 'object'
          ? (Object.values(raw as Record<string, AdminLoginAuditEntry>).filter(Boolean) as AdminLoginAuditEntry[])
          : [];
        if (remoteList.length > 0) {
          const map = new Map<string, AdminLoginAuditEntry>();
          for (const item of [...baseList, ...remoteList]) {
            if (item && item.id) map.set(item.id, item);
          }
          baseList = Array.from(map.values());
        }
      }
    } catch {
      // keep local baseList
    }
  }

  const nextList = [entry, ...baseList.filter((i) => i.id !== entry.id)]
    .sort((a, b) => new Date(b.loggedInAt).getTime() - new Date(a.loggedInAt).getTime())
    .slice(0, MAX_LOGIN_AUDIT_ITEMS);

  writeLocalJson(KEY_ADMIN_LOGIN_AUDIT, nextList);
  emitWindowEvent(LOGIN_AUDIT_UPDATED_EVENT);

  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    void fetch(`${FIREBASE_DB_URL}/adminLogs/loginHistory.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nextList),
    }).catch(() => undefined);
  }

  return entry;
}

export async function pullAdminLoginAuditLogsFromFirebase(): Promise<AdminLoginAuditEntry[]> {
  const local = loadAdminLoginAuditLogs();
  if (!isFirebaseDbConfigured() || typeof fetch !== 'function') return local;

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/adminLogs/loginHistory.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return local;
    const raw = (await res.json()) as unknown;
    const remoteList: AdminLoginAuditEntry[] = Array.isArray(raw)
      ? (raw.filter(Boolean) as AdminLoginAuditEntry[])
      : raw && typeof raw === 'object'
      ? (Object.values(raw as Record<string, AdminLoginAuditEntry>).filter(Boolean) as AdminLoginAuditEntry[])
      : [];
    if (remoteList.length === 0) return local;

    const mergedMap = new Map<string, AdminLoginAuditEntry>();
    for (const item of [...local, ...remoteList]) {
      if (item && item.id) mergedMap.set(item.id, item);
    }
    const merged = Array.from(mergedMap.values())
      .sort((a, b) => new Date(b.loggedInAt).getTime() - new Date(a.loggedInAt).getTime())
      .slice(0, MAX_LOGIN_AUDIT_ITEMS);

    writeLocalJson(KEY_ADMIN_LOGIN_AUDIT, merged);
    emitWindowEvent(LOGIN_AUDIT_UPDATED_EVENT);
    return merged;
  } catch {
    return local;
  }
}

export async function clearAdminLoginAuditLogs(): Promise<void> {
  // Preserve current active session record so the Admin can still see their live session if desired, or clear all old ones
  const current = getCurrentSessionLoginAudit();
  const remaining = current ? [current] : [];
  writeLocalJson(KEY_ADMIN_LOGIN_AUDIT, remaining);
  emitWindowEvent(LOGIN_AUDIT_UPDATED_EVENT);

  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    try {
      await fetch(`${FIREBASE_DB_URL}/adminLogs/loginHistory.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(remaining),
      });
    } catch {
      // ignore
    }
  }
}

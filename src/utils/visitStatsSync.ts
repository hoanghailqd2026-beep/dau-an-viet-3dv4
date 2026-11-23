import { useEffect, useState } from 'react';
import { HERITAGE_SITES } from '../data/heritageSites';
import type { HeritageSite } from '../types/heritage';
import { FIREBASE_DB_URL, isFirebaseDbConfigured } from './firebaseRestSync';
import { loadVisitHistoryLogs } from './serverSyncClient';

export const FIREBASE_VISIT_STATS_ENDPOINT = `${FIREBASE_DB_URL}/dau_an_viet_3d/visit_stats.json`;
export const VISIT_STATS_STORAGE_KEY = 'dau_an_viet_visit_stats_v1';
export const VISIT_STATS_SESSION_KEY = 'dau_an_viet_session_visited_sites_v1';
export const VISIT_STATS_UPDATED_EVENT = 'dau-an-viet-visit-stats-updated';

const MAX_DAILY_BUCKETS = 30;

export interface VisitStatsRecord {
  updatedAt: string;
  lastResetAt: string | null;
  countsByCode: Record<string, number>;
  countsBySiteId: Record<string, number>;
  dailyTotalsByDate: Record<string, number>;
  dailyBySiteId: Record<string, Record<string, number>>;
  sites: Record<
    string,
    {
      code: string;
      siteId: string;
      visitCount: number;
    }
  >;
}

export type TrendDirection = 'up' | 'down' | 'flat';

export interface DailyTrendPoint {
  dateKey: string;
  shortLabel: string;
  actual: number;
  fitted: number;
}

export interface SiteTrendForecastItem {
  code: string;
  site: HeritageSite;
  currentCount: number;
  weekTotal: number;
  projectedNextWeek: number;
  projectedDelta: number;
  slopePerDay: number;
  direction: TrendDirection;
}

export interface VisitTrendForecastSummary {
  dailyPoints: DailyTrendPoint[];
  nextWeekDailyProjection: number[];
  currentWeekTotal: number;
  projectedNextWeekTotal: number;
  projectedDelta: number;
  projectedPercentChange: number;
  slopePerDay: number;
  intercept: number;
  rSquared: number;
  direction: TrendDirection;
  activeDaysCount: number;
  siteForecasts: SiteTrendForecastItem[];
  topRisingSite: SiteTrendForecastItem | null;
  topDecliningSite: SiteTrendForecastItem | null;
}

const ORDERED_SITE_ENTRIES = HERITAGE_SITES.map((site, idx) => ({
  code: String(idx + 1).padStart(2, '0'),
  siteId: site.id,
}));

const CODE_BY_SITE_ID: Record<string, string> = Object.fromEntries(
  ORDERED_SITE_ENTRIES.map((e) => [e.siteId, e.code])
);

const SITE_ID_BY_CODE: Record<string, string> = Object.fromEntries(
  ORDERED_SITE_ENTRIES.map((e) => [e.code, e.siteId])
);

function getDayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getLastNDaysKeys(days: number): string[] {
  const keys: string[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const dt = new Date(base);
    dt.setDate(base.getDate() - offset);
    keys.push(getDayKey(dt));
  }
  return keys;
}

function isValidDateKey(key: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

function pruneDailyMap(map: Record<string, number>): Record<string, number> {
  const entries = Object.entries(map)
    .filter(([k, v]) => isValidDateKey(k) && typeof v === 'number' && Number.isFinite(v) && v > 0)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, MAX_DAILY_BUCKETS);
  return Object.fromEntries(entries.map(([k, v]) => [k, Math.floor(v)]));
}

function normalizeDailyBySiteId(
  raw: Record<string, Record<string, number>> | undefined
): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const entry of ORDERED_SITE_ENTRIES) {
    const siteMap = raw[entry.siteId];
    if (siteMap && typeof siteMap === 'object') {
      const pruned = pruneDailyMap(siteMap);
      if (Object.keys(pruned).length > 0) {
        out[entry.siteId] = pruned;
      }
    }
  }
  return out;
}

function buildNormalizedRecord(
  rawCountsBySiteId: Record<string, number>,
  updatedAt?: string,
  lastResetAt?: string | null,
  rawDailyTotalsByDate?: Record<string, number>,
  rawDailyBySiteId?: Record<string, Record<string, number>>
): VisitStatsRecord {
  const countsByCode: Record<string, number> = {};
  const countsBySiteId: Record<string, number> = {};
  const sites: VisitStatsRecord['sites'] = {};

  for (const entry of ORDERED_SITE_ENTRIES) {
    const raw = rawCountsBySiteId[entry.siteId];
    const safeVal = typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 ? Math.floor(raw) : 0;
    countsByCode[entry.code] = safeVal;
    countsBySiteId[entry.siteId] = safeVal;
    sites[entry.code] = {
      code: entry.code,
      siteId: entry.siteId,
      visitCount: safeVal,
    };
  }

  return {
    updatedAt: updatedAt || new Date().toISOString(),
    lastResetAt: lastResetAt ?? null,
    countsByCode,
    countsBySiteId,
    dailyTotalsByDate: pruneDailyMap(rawDailyTotalsByDate || {}),
    dailyBySiteId: normalizeDailyBySiteId(rawDailyBySiteId),
    sites,
  };
}

function createZeroRecord(lastResetAt: string | null = null): VisitStatsRecord {
  return buildNormalizedRecord({}, new Date().toISOString(), lastResetAt, {}, {});
}

function extractCountsFromUnknownPayload(raw: unknown): {
  countsBySiteId: Record<string, number>;
  dailyTotalsByDate: Record<string, number>;
  dailyBySiteId: Record<string, Record<string, number>>;
  updatedAt?: string;
  lastResetAt?: string | null;
} | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const countsBySiteId: Record<string, number> = {};
  const dailyTotalsByDate: Record<string, number> = {};
  const dailyBySiteId: Record<string, Record<string, number>> = {};

  const applyEntry = (key: string, val: unknown) => {
    const num =
      typeof val === 'number'
        ? val
        : val && typeof val === 'object' && typeof (val as { visitCount?: unknown }).visitCount === 'number'
        ? (val as { visitCount: number }).visitCount
        : null;
    if (num === null || !Number.isFinite(num) || num < 0) return;
    const clean = Math.floor(num);
    if (CODE_BY_SITE_ID[key]) {
      countsBySiteId[key] = Math.max(countsBySiteId[key] || 0, clean);
    } else if (SITE_ID_BY_CODE[key]) {
      const mappedId = SITE_ID_BY_CODE[key];
      countsBySiteId[mappedId] = Math.max(countsBySiteId[mappedId] || 0, clean);
    }
  };

  if (obj.countsBySiteId && typeof obj.countsBySiteId === 'object') {
    for (const [k, v] of Object.entries(obj.countsBySiteId as Record<string, unknown>)) {
      applyEntry(k, v);
    }
  }
  if (obj.countsByCode && typeof obj.countsByCode === 'object') {
    for (const [k, v] of Object.entries(obj.countsByCode as Record<string, unknown>)) {
      applyEntry(k, v);
    }
  }
  if (obj.sites && typeof obj.sites === 'object') {
    for (const [k, v] of Object.entries(obj.sites as Record<string, unknown>)) {
      applyEntry(k, v);
    }
  }
  for (const [k, v] of Object.entries(obj)) {
    if (
      k !== 'updatedAt' &&
      k !== 'lastResetAt' &&
      k !== 'countsBySiteId' &&
      k !== 'countsByCode' &&
      k !== 'sites' &&
      k !== 'dailyTotalsByDate' &&
      k !== 'dailyBySiteId'
    ) {
      applyEntry(k, v);
    }
  }

  if (obj.dailyTotalsByDate && typeof obj.dailyTotalsByDate === 'object') {
    for (const [dateKey, val] of Object.entries(obj.dailyTotalsByDate as Record<string, unknown>)) {
      if (isValidDateKey(dateKey) && typeof val === 'number' && Number.isFinite(val) && val > 0) {
        dailyTotalsByDate[dateKey] = Math.floor(val);
      }
    }
  }

  if (obj.dailyBySiteId && typeof obj.dailyBySiteId === 'object') {
    for (const [siteKey, mapVal] of Object.entries(obj.dailyBySiteId as Record<string, unknown>)) {
      if (!CODE_BY_SITE_ID[siteKey] || !mapVal || typeof mapVal !== 'object') continue;
      const siteDaily: Record<string, number> = {};
      for (const [dateKey, val] of Object.entries(mapVal as Record<string, unknown>)) {
        if (isValidDateKey(dateKey) && typeof val === 'number' && Number.isFinite(val) && val > 0) {
          siteDaily[dateKey] = Math.floor(val);
        }
      }
      if (Object.keys(siteDaily).length > 0) {
        dailyBySiteId[siteKey] = siteDaily;
      }
    }
  }

  return {
    countsBySiteId,
    dailyTotalsByDate,
    dailyBySiteId,
    updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    lastResetAt: typeof obj.lastResetAt === 'string' ? obj.lastResetAt : null,
  };
}

function emitVisitStatsUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(VISIT_STATS_UPDATED_EVENT));
  }
}

export function loadVisitStats(): VisitStatsRecord {
  if (typeof window === 'undefined') return createZeroRecord();
  try {
    const raw = window.localStorage.getItem(VISIT_STATS_STORAGE_KEY);
    if (!raw) {
      const empty = createZeroRecord();
      window.localStorage.setItem(VISIT_STATS_STORAGE_KEY, JSON.stringify(empty));
      return empty;
    }
    const parsed = extractCountsFromUnknownPayload(JSON.parse(raw));
    if (!parsed) return createZeroRecord();
    return buildNormalizedRecord(
      parsed.countsBySiteId,
      parsed.updatedAt,
      parsed.lastResetAt,
      parsed.dailyTotalsByDate,
      parsed.dailyBySiteId
    );
  } catch {
    return createZeroRecord();
  }
}

function saveVisitStatsLocal(record: VisitStatsRecord): void {
  if (typeof window === 'undefined') return;
  try {
    const prev = window.localStorage.getItem(VISIT_STATS_STORAGE_KEY);
    const next = JSON.stringify(record);
    if (prev !== next) {
      window.localStorage.setItem(VISIT_STATS_STORAGE_KEY, next);
      emitVisitStatsUpdated();
    }
  } catch {
    // ignore storage quota errors
  }
}

function hasVisitedInSession(siteId: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.sessionStorage.getItem(VISIT_STATS_SESSION_KEY);
    if (!raw) return false;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.includes(siteId);
  } catch {
    return false;
  }
}

function markVisitedInSession(siteId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.sessionStorage.getItem(VISIT_STATS_SESSION_KEY);
    const list: string[] = raw && Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    if (!list.includes(siteId)) {
      list.push(siteId);
      window.sessionStorage.setItem(VISIT_STATS_SESSION_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}

function clearVisitedSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(VISIT_STATS_SESSION_KEY);
  } catch {
    // ignore
  }
}

function parseIsoMs(iso: string | null | undefined): number {
  if (!iso) return 0;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : 0;
}

function mergeDailyMapsMax(
  a: Record<string, number>,
  b: Record<string, number>
): Record<string, number> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const merged: Record<string, number> = {};
  for (const k of keys) {
    merged[k] = Math.max(a[k] || 0, b[k] || 0);
  }
  return pruneDailyMap(merged);
}

function reconcileStats(local: VisitStatsRecord, remote: VisitStatsRecord): VisitStatsRecord {
  const localResetMs = parseIsoMs(local.lastResetAt);
  const remoteResetMs = parseIsoMs(remote.lastResetAt);

  if (remoteResetMs > localResetMs) {
    return remote;
  }
  if (localResetMs > remoteResetMs) {
    return local;
  }

  const merged: Record<string, number> = {};
  const mergedDailyBySite: Record<string, Record<string, number>> = {};

  for (const entry of ORDERED_SITE_ENTRIES) {
    merged[entry.siteId] = Math.max(
      local.countsBySiteId[entry.siteId] || 0,
      remote.countsBySiteId[entry.siteId] || 0
    );
    const siteDaily = mergeDailyMapsMax(
      local.dailyBySiteId[entry.siteId] || {},
      remote.dailyBySiteId[entry.siteId] || {}
    );
    if (Object.keys(siteDaily).length > 0) {
      mergedDailyBySite[entry.siteId] = siteDaily;
    }
  }

  const mergedDailyTotals = mergeDailyMapsMax(local.dailyTotalsByDate, remote.dailyTotalsByDate);

  const latestUpdate =
    parseIsoMs(remote.updatedAt) > parseIsoMs(local.updatedAt) ? remote.updatedAt : local.updatedAt;
  return buildNormalizedRecord(
    merged,
    latestUpdate,
    local.lastResetAt || remote.lastResetAt,
    mergedDailyTotals,
    mergedDailyBySite
  );
}

let visitStatsQueue: Promise<void> = Promise.resolve();

export async function pullVisitStatsFromFirebase(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) return false;

  try {
    const res = await fetch(FIREBASE_VISIT_STATS_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const raw = await res.json();
    const extracted = extractCountsFromUnknownPayload(raw);
    if (!extracted) return false;

    const remoteRecord = buildNormalizedRecord(
      extracted.countsBySiteId,
      extracted.updatedAt,
      extracted.lastResetAt,
      extracted.dailyTotalsByDate,
      extracted.dailyBySiteId
    );
    const localRecord = loadVisitStats();
    const merged = reconcileStats(localRecord, remoteRecord);
    saveVisitStatsLocal(merged);
    return true;
  } catch {
    return false;
  }
}

async function putVisitStatsToFirebase(record: VisitStatsRecord): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) return false;

  try {
    const res = await fetch(FIREBASE_VISIT_STATS_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Automatically increments visitCount by +1 for a heritage site (max once per browser session per site)
 * and persists both to localStorage and Firebase Realtime Database (`visit_stats.json`).
 */
export function recordHeritageVisitStat(siteId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !siteId || !CODE_BY_SITE_ID[siteId]) {
    return Promise.resolve(false);
  }
  if (hasVisitedInSession(siteId)) {
    return Promise.resolve(false);
  }

  markVisitedInSession(siteId);
  const todayKey = getDayKey();

  const currentLocal = loadVisitStats();
  const nextCounts = {
    ...currentLocal.countsBySiteId,
    [siteId]: (currentLocal.countsBySiteId[siteId] || 0) + 1,
  };
  const nextDailyTotals = {
    ...currentLocal.dailyTotalsByDate,
    [todayKey]: (currentLocal.dailyTotalsByDate[todayKey] || 0) + 1,
  };
  const prevSiteDaily = currentLocal.dailyBySiteId[siteId] || {};
  const nextDailyBySite = {
    ...currentLocal.dailyBySiteId,
    [siteId]: {
      ...prevSiteDaily,
      [todayKey]: (prevSiteDaily[todayKey] || 0) + 1,
    },
  };

  const immediateRecord = buildNormalizedRecord(
    nextCounts,
    new Date().toISOString(),
    currentLocal.lastResetAt,
    nextDailyTotals,
    nextDailyBySite
  );
  saveVisitStatsLocal(immediateRecord);

  let succeeded = true;
  visitStatsQueue = visitStatsQueue.then(async () => {
    if (!isFirebaseDbConfigured()) return;
    try {
      const res = await fetch(FIREBASE_VISIT_STATS_ENDPOINT, {
        method: 'GET',
        cache: 'no-store',
      });
      let baseRecord = currentLocal;
      if (res.ok) {
        const raw = await res.json();
        const extracted = extractCountsFromUnknownPayload(raw);
        if (extracted) {
          const remoteRecord = buildNormalizedRecord(
            extracted.countsBySiteId,
            extracted.updatedAt,
            extracted.lastResetAt,
            extracted.dailyTotalsByDate,
            extracted.dailyBySiteId
          );
          const remoteResetMs = parseIsoMs(remoteRecord.lastResetAt);
          const localResetMs = parseIsoMs(currentLocal.lastResetAt);
          if (remoteResetMs >= localResetMs) {
            baseRecord = remoteRecord;
          }
        }
      }
      const latestLocal = loadVisitStats();
      const reconciledBase = reconcileStats(latestLocal, baseRecord);
      const finalCounts = {
        ...reconciledBase.countsBySiteId,
        [siteId]: Math.max(
          (baseRecord.countsBySiteId[siteId] || 0) + 1,
          latestLocal.countsBySiteId[siteId] || 0
        ),
      };
      const baseSiteDaily = baseRecord.dailyBySiteId[siteId] || {};
      const finalDailyTotals = {
        ...reconciledBase.dailyTotalsByDate,
        [todayKey]: Math.max(
          (baseRecord.dailyTotalsByDate[todayKey] || 0) + 1,
          latestLocal.dailyTotalsByDate[todayKey] || 0
        ),
      };
      const finalDailyBySite = {
        ...reconciledBase.dailyBySiteId,
        [siteId]: {
          ...(reconciledBase.dailyBySiteId[siteId] || {}),
          [todayKey]: Math.max(
            (baseSiteDaily[todayKey] || 0) + 1,
            latestLocal.dailyBySiteId[siteId]?.[todayKey] || 0
          ),
        },
      };

      const finalRecord = buildNormalizedRecord(
        finalCounts,
        new Date().toISOString(),
        reconciledBase.lastResetAt,
        finalDailyTotals,
        finalDailyBySite
      );
      saveVisitStatsLocal(finalRecord);
      const ok = await putVisitStatsToFirebase(finalRecord);
      succeeded = ok;
    } catch {
      succeeded = false;
    }
  });

  return visitStatsQueue.then(() => succeeded);
}

export async function resetAllVisitStatsToZero(): Promise<{
  ok: boolean;
  syncedFirebase: boolean;
}> {
  const nowIso = new Date().toISOString();
  const zeroRecord = createZeroRecord(nowIso);
  clearVisitedSession();
  saveVisitStatsLocal(zeroRecord);
  emitVisitStatsUpdated();

  let syncedFirebase = false;
  visitStatsQueue = visitStatsQueue.then(async () => {
    syncedFirebase = await putVisitStatsToFirebase(zeroRecord);
  });
  await visitStatsQueue;

  return {
    ok: true,
    syncedFirebase,
  };
}

export function useVisitStats(): VisitStatsRecord {
  const [stats, setStats] = useState<VisitStatsRecord>(() => loadVisitStats());

  useEffect(() => {
    const refresh = () => setStats(loadVisitStats());
    const onStorage = (e: StorageEvent) => {
      if (e.key === VISIT_STATS_STORAGE_KEY) refresh();
    };
    window.addEventListener(VISIT_STATS_UPDATED_EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(VISIT_STATS_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return stats;
}

function runOlsLinearRegression(values: number[]): {
  slope: number;
  intercept: number;
  rSquared: number;
  fitted: number[];
  nextWeekProjection: number[];
  projectedNextWeekTotal: number;
} {
  const n = values.length;
  if (n === 0) {
    return {
      slope: 0,
      intercept: 0,
      rSquared: 0,
      fitted: [],
      nextWeekProjection: [],
      projectedNextWeekTotal: 0,
    };
  }

  const meanX = (n - 1) / 2;
  const meanY = values.reduce((acc, v) => acc + v, 0) / n;

  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = i - meanX;
    const dy = values[i] - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }

  const slope = sxx > 0 ? sxy / sxx : 0;
  const intercept = meanY - slope * meanX;

  const fitted = values.map((_, i) => Math.max(0, intercept + slope * i));

  let ssRes = 0;
  for (let i = 0; i < n; i += 1) {
    const pred = intercept + slope * i;
    const diff = values[i] - pred;
    ssRes += diff * diff;
  }
  const rSquared = syy > 0 ? Math.max(0, Math.min(1, 1 - ssRes / syy)) : 0;

  const nextWeekProjection: number[] = [];
  for (let k = n; k < n + 7; k += 1) {
    nextWeekProjection.push(Math.max(0, intercept + slope * k));
  }
  const projectedNextWeekTotal = Math.round(
    nextWeekProjection.reduce((acc, v) => acc + v, 0)
  );

  return {
    slope,
    intercept,
    rSquared,
    fitted,
    nextWeekProjection,
    projectedNextWeekTotal,
  };
}

/**
 * Computes simple OLS linear regression forecast for the next 7 days
 * from Firebase `visit_stats.json` daily series and real visit log history.
 */
export function computeVisitTrendForecast(
  stats: VisitStatsRecord,
  sites: HeritageSite[]
): VisitTrendForecastSummary {
  const dayKeys = getLastNDaysKeys(7);
  const resetMs = parseIsoMs(stats.lastResetAt);

  // Merge real historical VisitHistoryLog timestamps (respecting lastResetAt)
  const logTotalsByDate: Record<string, number> = {};
  const logBySiteByDate: Record<string, Record<string, number>> = {};
  const logs = loadVisitHistoryLogs();
  for (const entry of logs) {
    if (!entry?.timestamp) continue;
    const ms = Date.parse(entry.timestamp);
    if (!Number.isFinite(ms) || (resetMs > 0 && ms < resetMs)) continue;
    const key = getDayKey(new Date(ms));
    logTotalsByDate[key] = (logTotalsByDate[key] || 0) + 1;
    if (entry.siteId) {
      if (!logBySiteByDate[entry.siteId]) logBySiteByDate[entry.siteId] = {};
      logBySiteByDate[entry.siteId][key] = (logBySiteByDate[entry.siteId][key] || 0) + 1;
    }
  }

  const totalRecordedSum = Object.values(stats.countsBySiteId).reduce((a, b) => a + b, 0);
  const hasAnyDatedBucket = Object.keys(stats.dailyTotalsByDate).length > 0;
  const todayKey = dayKeys[dayKeys.length - 1];

  const yValues = dayKeys.map((key) => {
    const statCount = stats.dailyTotalsByDate[key] || 0;
    const logCount = logTotalsByDate[key] || 0;
    let combined = Math.max(statCount, logCount);
    if (!hasAnyDatedBucket && key === todayKey && totalRecordedSum > 0) {
      combined = Math.max(combined, totalRecordedSum);
    }
    return combined;
  });

  const reg = runOlsLinearRegression(yValues);
  const currentWeekTotal = yValues.reduce((a, b) => a + b, 0);
  const projectedDelta = reg.projectedNextWeekTotal - currentWeekTotal;
  const projectedPercentChange =
    currentWeekTotal > 0
      ? Math.round((projectedDelta / currentWeekTotal) * 100)
      : reg.projectedNextWeekTotal > 0
      ? 100
      : 0;

  const direction: TrendDirection =
    reg.slope > 0.05 && projectedDelta > 0
      ? 'up'
      : reg.slope < -0.05 && projectedDelta < 0
      ? 'down'
      : 'flat';

  const dailyPoints: DailyTrendPoint[] = dayKeys.map((dateKey, idx) => ({
    dateKey,
    shortLabel: `${dateKey.slice(8, 10)}/${dateKey.slice(5, 7)}`,
    actual: yValues[idx],
    fitted: Number(reg.fitted[idx].toFixed(2)),
  }));

  const siteForecasts: SiteTrendForecastItem[] = sites.map((site, idx) => {
    const code = String(idx + 1).padStart(2, '0');
    const currentCount = stats.countsBySiteId[site.id] ?? stats.countsByCode[code] ?? 0;
    const siteDailyMap = stats.dailyBySiteId[site.id] || {};
    const siteLogDaily = logBySiteByDate[site.id] || {};
    const hasSiteDated = Object.keys(siteDailyMap).length > 0;

    const siteSeries = dayKeys.map((key) => {
      const val = Math.max(siteDailyMap[key] || 0, siteLogDaily[key] || 0);
      if (!hasSiteDated && key === todayKey && currentCount > 0) {
        return Math.max(val, currentCount);
      }
      return val;
    });

    const siteWeekTotal = siteSeries.reduce((a, b) => a + b, 0);
    const siteReg = runOlsLinearRegression(siteSeries);
    const siteDelta = siteReg.projectedNextWeekTotal - siteWeekTotal;
    const siteDirection: TrendDirection =
      siteReg.slope > 0.03 && siteDelta > 0
        ? 'up'
        : siteReg.slope < -0.03 && siteDelta < 0
        ? 'down'
        : 'flat';

    return {
      code,
      site,
      currentCount,
      weekTotal: siteWeekTotal,
      projectedNextWeek: siteReg.projectedNextWeekTotal,
      projectedDelta: siteDelta,
      slopePerDay: siteReg.slope,
      direction: siteDirection,
    };
  });

  const risingCandidates = siteForecasts
    .filter((item) => item.direction === 'up')
    .sort((a, b) => b.projectedDelta - a.projectedDelta || b.slopePerDay - a.slopePerDay);
  const decliningCandidates = siteForecasts
    .filter((item) => item.direction === 'down')
    .sort((a, b) => a.projectedDelta - b.projectedDelta || a.slopePerDay - b.slopePerDay);

  return {
    dailyPoints,
    nextWeekDailyProjection: reg.nextWeekProjection,
    currentWeekTotal,
    projectedNextWeekTotal: reg.projectedNextWeekTotal,
    projectedDelta,
    projectedPercentChange,
    slopePerDay: reg.slope,
    intercept: reg.intercept,
    rSquared: reg.rSquared,
    direction,
    activeDaysCount: yValues.filter((v) => v > 0).length,
    siteForecasts,
    topRisingSite: risingCandidates[0] || null,
    topDecliningSite: decliningCandidates[0] || null,
  };
}

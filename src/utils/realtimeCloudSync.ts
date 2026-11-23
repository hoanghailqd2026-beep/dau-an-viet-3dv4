/**
 * Multi-Device Realtime Cloud Sync Engine (Firebase Realtime Database + Offline Queue + BroadcastChannel)
 *
 * Syncs per-account cloud state at `/users/{uid}`:
 *   - `/users/{uid}/entitlements` (Plus/Pro/School pass status & unlocked monument/route IDs)
 *   - `/users/{uid}/preferences`  (language, ambient audio mute/volume, 3D graphics quality, last viewed monument)
 *   - `/users/{uid}/onboarding`   (Sử Quan Dấu Ấn tour completion across devices)
 *   - `/users/{uid}/favorites`    (bookmarked monument IDs)
 *
 * Syncs global Admin Studio configurations in real time:
 *   - `/settings/emailConfig`     (EmailJS auto-sender config)
 *   - `/settings/siteSettings`    (Site banner, ambient playlist, 3D lighting)
 *   - `/paymentConfig/vietqr`     (VietQR payment settings)
 *
 * Connection & Offline Resilience:
 *   - Watches Firebase `.info/connected` + browser online/offline events
 *   - Queues offline writes in memory + localStorage and auto-flushes on reconnect
 *   - Stamps every cloud write with `updatedAt: serverTimestamp()` for last-write-wins reconciliation
 *   - Cross-tab instant synchronization via `BroadcastChannel('dau_an_viet_sync')` with echo-loop protection
 */

import { useEffect, useState } from 'react';
import {
  getDatabase,
  onValue,
  ref,
  serverTimestamp,
  update,
  type Database,
  type Unsubscribe,
} from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';
import { firebaseApp } from '../lib/firebaseAuth';
import {
  FIREBASE_DB_URL,
  isFirebaseDbConfigured,
  sanitizeFirebaseUserKey,
} from './firebaseRestSync';
import type { Language } from '../i18n/types';

// ============================================================================
// CONSTANTS & TYPES
// ============================================================================
export const BROADCAST_CHANNEL_NAME = 'dau_an_viet_sync';

const OFFLINE_QUEUE_STORAGE_KEY = 'dau_an_viet_offline_sync_queue_v1';
const GRAPHICS_QUALITY_STORAGE_KEY = 'dau_an_viet_3d_graphics_quality_v1';
const FAVORITES_STORAGE_PREFIX = 'dau_an_viet_user_favorites_v1_';
const LAST_VIEWED_SITE_PREFIX = 'dau_an_viet_last_viewed_site_v1_';

export const CLOUD_SYNC_STATUS_EVENT = 'dau-an-viet-cloud-sync-status-updated';
export const USER_FAVORITES_UPDATED_EVENT = 'dau-an-viet-user-favorites-updated';
export const GRAPHICS_QUALITY_UPDATED_EVENT = 'dau-an-viet-graphics-quality-updated';
export const REMOTE_PREFERENCES_APPLIED_EVENT = 'dau-an-viet-remote-preferences-applied';
export const REMOTE_ONBOARDING_APPLIED_EVENT = 'dau-an-viet-remote-onboarding-applied';
export const REMOTE_LANG_SYNC_EVENT = 'dau-an-viet-remote-lang-sync';
export const REMOTE_AMBIENT_SYNC_EVENT = 'dau-an-viet-remote-ambient-sync';

export type GraphicsQualityLevel = 'high' | 'balanced' | 'eco';

export type CloudSyncDisplayState = 'synced' | 'reconnecting';

export interface CloudSyncStatusSnapshot {
  state: CloudSyncDisplayState;
  rtdbConnected: boolean;
  browserOnline: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  lastError: string | null;
}

export interface CloudUserEntitlements {
  uid: string;
  email: string;
  tier: 'basic' | 'plus' | 'pro' | 'school';
  unlockedSiteIds: string[];
  unlockedRouteIds: string[];
  hasSchoolPackage: boolean;
  schoolName?: string;
  schoolCode?: string;
  activeOrderIds: string[];
  updatedAt?: number | string;
  clientUpdatedAt?: number;
}

export interface CloudUserPreferences {
  language?: Language;
  ambientMuted?: boolean;
  ambientVolume?: number;
  graphicsQuality?: GraphicsQualityLevel;
  lastViewedSiteId?: string;
  updatedAt?: number | string;
  clientUpdatedAt?: number;
}

export interface CloudUserOnboarding {
  done: boolean;
  completedAt?: string;
  updatedAt?: number | string;
  clientUpdatedAt?: number;
}

export interface CloudUserFavoritesNode {
  siteIds: string[];
  updatedAt?: number | string;
  clientUpdatedAt?: number;
}

export interface CloudUserRealtimeNode {
  entitlements?: Partial<CloudUserEntitlements> | null;
  subscriptions?: Partial<CloudUserEntitlements> | null;
  preferences?: Partial<CloudUserPreferences> | null;
  onboarding?: Partial<CloudUserOnboarding> | null;
  welcomeLetterSeen?: boolean | null;
  welcomeLetterSeenAt?: string | null;
  favorites?: string[] | Partial<CloudUserFavoritesNode> | Record<string, boolean> | null;
  updatedAt?: number | string;
}

export type CrossTabEventType =
  | 'AUTH_LOGOUT'
  | 'AUTH_LOGIN'
  | 'LANG_CHANGED'
  | 'ENTITLEMENTS_UPDATED'
  | 'PREFERENCES_UPDATED'
  | 'ONBOARDING_UPDATED'
  | 'WELCOME_LETTER_UPDATED'
  | 'FAVORITES_UPDATED'
  | 'EMAIL_CONFIG_UPDATED'
  | 'SITE_SETTINGS_UPDATED'
  | 'PAYMENT_QR_UPDATED'
  | 'MEDIA_CREDITS_UPDATED';

export interface CrossTabMessage<T = unknown> {
  type: CrossTabEventType;
  senderTabId: string;
  timestamp: number;
  payload?: T;
}

interface OfflineQueuedMutation {
  path: string;
  data: Record<string, unknown>;
  clientUpdatedAt: number;
}

// ============================================================================
// PER-TAB IDENTITY & SAFE HELPERS
// ============================================================================
const TAB_ID = `tab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

function emitWindowEvent<T = unknown>(name: string, detail?: T): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, detail !== undefined ? { detail } : undefined));
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
    // ignore quota errors
  }
}

function extractEpochMs(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const asNum = Number(value);
    if (Number.isFinite(asNum) && asNum > 1_000_000_000_000) {
      return asNum;
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 0;
}

function stripUndefinedFields(input: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined) {
      cleaned[k] = v;
    }
  }
  return cleaned;
}

// ============================================================================
// 1. FIREBASE REALTIME DATABASE INITIALIZATION
// ============================================================================
let cachedRtdb: Database | null | undefined;
let resolvedDatabaseUrl: string | null = null;

function resolveRtdbUrl(): string | null {
  if (resolvedDatabaseUrl !== null) return resolvedDatabaseUrl;

  if (isFirebaseDbConfigured()) {
    resolvedDatabaseUrl = FIREBASE_DB_URL;
    return resolvedDatabaseUrl;
  }

  const configWithDb = firebaseConfig as { databaseURL?: string; projectId?: string };
  if (typeof configWithDb.databaseURL === 'string' && configWithDb.databaseURL.trim()) {
    resolvedDatabaseUrl = configWithDb.databaseURL.trim().replace(/\/+$/, '');
    return resolvedDatabaseUrl;
  }

  if (typeof configWithDb.projectId === 'string' && configWithDb.projectId.trim()) {
    resolvedDatabaseUrl = `https://${configWithDb.projectId.trim()}-default-rtdb.firebaseio.com`;
    return resolvedDatabaseUrl;
  }

  resolvedDatabaseUrl = '';
  return null;
}

export function getRealtimeDb(): Database | null {
  if (cachedRtdb !== undefined) return cachedRtdb;
  if (typeof window === 'undefined') {
    cachedRtdb = null;
    return null;
  }
  const url = resolveRtdbUrl();
  if (!url) {
    cachedRtdb = null;
    return null;
  }
  try {
    cachedRtdb = getDatabase(firebaseApp, url);
    return cachedRtdb;
  } catch {
    cachedRtdb = null;
    return null;
  }
}

// ============================================================================
// 2. CONNECTION STATUS MONITOR (.info/connected + OFFLINE QUEUE)
// ============================================================================
let offlineQueue: OfflineQueuedMutation[] = readLocalJson<OfflineQueuedMutation[]>(
  OFFLINE_QUEUE_STORAGE_KEY,
  []
);
if (!Array.isArray(offlineQueue)) {
  offlineQueue = [];
}

let isFlushingQueue = false;
let connectionWatcherStarted = false;
let rtdbConnectedFlag = false;
let rtdbEverConnected = false;
let fallbackGraceElapsed = false;

let syncStatus: CloudSyncStatusSnapshot = {
  state: typeof navigator !== 'undefined' && navigator.onLine === false ? 'reconnecting' : 'synced',
  rtdbConnected: false,
  browserOnline: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
  pendingCount: offlineQueue.length,
  lastSyncedAt: null,
  lastError: null,
};

function computeDisplayState(
  browserOnline: boolean,
  rtdbConnected: boolean,
  pendingCount: number
): CloudSyncDisplayState {
  if (!browserOnline) return 'reconnecting';
  if (rtdbConnected) {
    return pendingCount > 0 && isFlushingQueue ? 'reconnecting' : 'synced';
  }
  // If an explicit RTDB URL is configured or RTDB previously connected and dropped,
  // accurately report "Đang kết nối lại..." while disconnected.
  if (isFirebaseDbConfigured() || rtdbEverConnected) {
    return 'reconnecting';
  }
  // If no explicit RTDB URL is configured yet and browser is online, wait brief handshake window
  // then treat multi-tab + local sync as synced until RTDB connects.
  if (pendingCount > 0 && !fallbackGraceElapsed) {
    return 'reconnecting';
  }
  return fallbackGraceElapsed ? 'synced' : 'reconnecting';
}

let syncStatusEmitScheduled = false;

function scheduleEmitSyncStatus(): void {
  if (syncStatusEmitScheduled || typeof window === 'undefined') return;
  syncStatusEmitScheduled = true;
  const emit = () => {
    syncStatusEmitScheduled = false;
    emitWindowEvent(CLOUD_SYNC_STATUS_EVENT, syncStatus);
  };
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(emit);
  } else {
    void Promise.resolve().then(emit);
  }
}

function updateSyncStatus(partial: Partial<CloudSyncStatusSnapshot> = {}): void {
  const browserOnline =
    partial.browserOnline !== undefined
      ? partial.browserOnline
      : typeof navigator !== 'undefined'
      ? navigator.onLine !== false
      : true;
  const rtdbConnected =
    partial.rtdbConnected !== undefined ? partial.rtdbConnected : rtdbConnectedFlag;
  const pendingCount =
    partial.pendingCount !== undefined ? partial.pendingCount : offlineQueue.length;

  const nextState =
    partial.state !== undefined
      ? partial.state
      : computeDisplayState(browserOnline, rtdbConnected, pendingCount);

  syncStatus = {
    ...syncStatus,
    ...partial,
    browserOnline,
    rtdbConnected,
    pendingCount,
    state: nextState,
  };
  scheduleEmitSyncStatus();
}

function persistOfflineQueue(): void {
  writeLocalJson(OFFLINE_QUEUE_STORAGE_KEY, offlineQueue.slice(-60));
  updateSyncStatus({ pendingCount: offlineQueue.length });
}

export async function flushOfflineSyncQueue(): Promise<void> {
  if (isFlushingQueue || offlineQueue.length === 0) return;
  const db = getRealtimeDb();
  if (!db) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
  if (!rtdbConnectedFlag) return;

  isFlushingQueue = true;
  updateSyncStatus({ pendingCount: offlineQueue.length });

  const remaining: OfflineQueuedMutation[] = [];
  let flushedAny = false;

  for (const item of [...offlineQueue]) {
    try {
      const payload = stripUndefinedFields({
        ...item.data,
        clientUpdatedAt: item.clientUpdatedAt,
        updatedAt: serverTimestamp(),
      });
      await update(ref(db, item.path), payload);
      flushedAny = true;
    } catch (err) {
      remaining.push(item);
      updateSyncStatus({
        lastError: err instanceof Error ? err.message : 'Network write failed',
      });
    }
  }

  offlineQueue = remaining;
  isFlushingQueue = false;
  persistOfflineQueue();
  updateSyncStatus({
    pendingCount: offlineQueue.length,
    lastSyncedAt: flushedAny ? Date.now() : syncStatus.lastSyncedAt,
    lastError: remaining.length === 0 ? null : syncStatus.lastError,
  });
}

export function enqueueRealtimeCloudWrite(
  path: string,
  data: Record<string, unknown>
): void {
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  if (!cleanPath) return;

  const nowMs = Date.now();
  const cleanData = stripUndefinedFields(data);
  const db = getRealtimeDb();
  const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine !== false;

  if (db && isOnline && rtdbConnectedFlag) {
    const payload = {
      ...cleanData,
      clientUpdatedAt: nowMs,
      updatedAt: serverTimestamp(),
    };
    void update(ref(db, cleanPath), payload)
      .then(() => {
        updateSyncStatus({
          lastSyncedAt: Date.now(),
          lastError: null,
        });
      })
      .catch((err) => {
        addToOfflineQueue(cleanPath, cleanData, nowMs);
        updateSyncStatus({
          lastError: err instanceof Error ? err.message : 'Write queued offline',
        });
      });
    return;
  }

  addToOfflineQueue(cleanPath, cleanData, nowMs);
}

function addToOfflineQueue(
  path: string,
  data: Record<string, unknown>,
  clientUpdatedAt: number
): void {
  const existingIdx = offlineQueue.findIndex((item) => item.path === path);
  if (existingIdx >= 0) {
    const prev = offlineQueue[existingIdx];
    offlineQueue[existingIdx] = {
      path,
      data: { ...prev.data, ...data },
      clientUpdatedAt: Math.max(prev.clientUpdatedAt, clientUpdatedAt),
    };
  } else {
    offlineQueue.push({ path, data, clientUpdatedAt });
  }
  persistOfflineQueue();
}

export function ensureCloudConnectionWatcher(): void {
  if (connectionWatcherStarted || typeof window === 'undefined') return;
  connectionWatcherStarted = true;

  const handleOnline = () => {
    updateSyncStatus({ browserOnline: true });
    if (rtdbConnectedFlag) {
      void flushOfflineSyncQueue();
    }
  };
  const handleOffline = () => {
    updateSyncStatus({ browserOnline: false, state: 'reconnecting' });
  };
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Brief grace timer when RTDB URL is not explicitly configured yet so UI doesn't stay stuck
  window.setTimeout(() => {
    fallbackGraceElapsed = true;
    updateSyncStatus();
  }, 3500);

  const db = getRealtimeDb();
  if (!db) {
    fallbackGraceElapsed = true;
    updateSyncStatus();
    return;
  }

  try {
    const connectedRef = ref(db, '.info/connected');
    onValue(
      connectedRef,
      (snap) => {
        const connected = snap.val() === true;
        rtdbConnectedFlag = connected;
        if (connected) {
          rtdbEverConnected = true;
          updateSyncStatus({
            rtdbConnected: true,
            lastSyncedAt: Date.now(),
            lastError: null,
          });
          void flushOfflineSyncQueue();
        } else {
          updateSyncStatus({
            rtdbConnected: false,
          });
        }
      },
      (err) => {
        rtdbConnectedFlag = false;
        fallbackGraceElapsed = true;
        updateSyncStatus({
          rtdbConnected: false,
          lastError: err?.message || null,
        });
      }
    );
  } catch {
    fallbackGraceElapsed = true;
    updateSyncStatus();
  }
}

export function getCloudSyncStatus(): CloudSyncStatusSnapshot {
  return syncStatus;
}

export function useCloudSyncStatus(): CloudSyncStatusSnapshot {
  const [status, setStatus] = useState<CloudSyncStatusSnapshot>(() => getCloudSyncStatus());

  useEffect(() => {
    ensureCloudConnectionWatcher();
    const syncNow = () => setStatus({ ...getCloudSyncStatus() });
    syncNow();
    window.addEventListener(CLOUD_SYNC_STATUS_EVENT, syncNow);
    return () => {
      window.removeEventListener(CLOUD_SYNC_STATUS_EVENT, syncNow);
    };
  }, []);

  return status;
}

// ============================================================================
// 3. CROSS-TAB BROADCAST CHANNEL (`dau_an_viet_sync`)
// ============================================================================
let sharedBroadcastChannel: BroadcastChannel | null = null;
const crossTabListeners = new Set<(msg: CrossTabMessage) => void>();

function ensureBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!sharedBroadcastChannel) {
    try {
      sharedBroadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      sharedBroadcastChannel.onmessage = (event: MessageEvent<CrossTabMessage>) => {
        const msg = event.data;
        if (!msg || typeof msg !== 'object' || !msg.type) return;
        if (msg.senderTabId === TAB_ID) return; // Echo-loop guard
        for (const listener of crossTabListeners) {
          try {
            listener(msg);
          } catch {
            // keep bus resilient
          }
        }
      };
    } catch {
      sharedBroadcastChannel = null;
    }
  }
  return sharedBroadcastChannel;
}

export function broadcastCrossTabEvent<T = unknown>(
  type: CrossTabEventType,
  payload?: T
): void {
  const ch = ensureBroadcastChannel();
  if (!ch) return;
  try {
    const message: CrossTabMessage<T> = {
      type,
      senderTabId: TAB_ID,
      timestamp: Date.now(),
      payload,
    };
    ch.postMessage(message);
  } catch {
    // ignore postMessage serialization issues
  }
}

export function subscribeCrossTabEvents(
  handler: (msg: CrossTabMessage) => void
): () => void {
  ensureBroadcastChannel();
  crossTabListeners.add(handler);
  return () => {
    crossTabListeners.delete(handler);
  };
}

// ============================================================================
// 4. TIMESTAMP CONFLICT RESOLUTION (LAST-WRITE-WINS GUARD)
// ============================================================================
const lastSectionTimestamps = new Map<string, number>();

function recordLocalWriteTimestamp(sectionKey: string, ts = Date.now()): void {
  const prev = lastSectionTimestamps.get(sectionKey) || 0;
  if (ts > prev) {
    lastSectionTimestamps.set(sectionKey, ts);
  }
}

function shouldAcceptRemoteTimestamp(sectionKey: string, remoteTs: number): boolean {
  const localTs = lastSectionTimestamps.get(sectionKey) || 0;
  if (localTs === 0) {
    if (remoteTs > 0) lastSectionTimestamps.set(sectionKey, remoteTs);
    return true;
  }
  if (remoteTs === 0) {
    // Remote snapshot lacks timestamp; avoid overwriting a known newer local write
    return false;
  }
  if (remoteTs >= localTs) {
    lastSectionTimestamps.set(sectionKey, remoteTs);
    return true;
  }
  return false;
}

// ============================================================================
// 5. LOCAL + CLOUD SYNC WRITERS (PREFERENCES, ONBOARDING, FAVORITES, ENTITLEMENTS)
// ============================================================================
export function loadGraphicsQuality(): GraphicsQualityLevel {
  if (typeof window === 'undefined') return 'high';
  try {
    const raw = window.localStorage.getItem(GRAPHICS_QUALITY_STORAGE_KEY);
    if (raw === 'high' || raw === 'balanced' || raw === 'eco') {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'high';
}

export function saveGraphicsQuality(
  quality: GraphicsQualityLevel,
  uid?: string | null,
  options?: { fromRemote?: boolean }
): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(GRAPHICS_QUALITY_STORAGE_KEY, quality);
    } catch {
      // ignore
    }
  }
  emitWindowEvent(GRAPHICS_QUALITY_UPDATED_EVENT, quality);

  if (!options?.fromRemote) {
    if (uid) {
      syncUserPreferencesToCloud(uid, { graphicsQuality: quality });
    } else {
      broadcastCrossTabEvent('PREFERENCES_UPDATED', { graphicsQuality: quality });
    }
  }
}

export function useGraphicsQuality(uid?: string | null): [
  GraphicsQualityLevel,
  (q: GraphicsQualityLevel) => void
] {
  const [quality, setQualityState] = useState<GraphicsQualityLevel>(() => loadGraphicsQuality());

  useEffect(() => {
    const sync = () => setQualityState(loadGraphicsQuality());
    window.addEventListener(GRAPHICS_QUALITY_UPDATED_EVENT, sync);
    return () => window.removeEventListener(GRAPHICS_QUALITY_UPDATED_EVENT, sync);
  }, []);

  const setQuality = (next: GraphicsQualityLevel) => {
    setQualityState(next);
    saveGraphicsQuality(next, uid);
  };

  return [quality, setQuality];
}

function resolveFavoritesStorageKey(uid?: string | null): string {
  const safe = sanitizeFirebaseUserKey(uid || 'guest') || 'guest';
  return `${FAVORITES_STORAGE_PREFIX}${safe}`;
}

export function loadUserFavorites(uid?: string | null): string[] {
  const list = readLocalJson<unknown>(resolveFavoritesStorageKey(uid), []);
  if (!Array.isArray(list)) return [];
  return Array.from(new Set(list.filter((id): id is string => typeof id === 'string' && Boolean(id))));
}

function writeLocalUserFavorites(uid: string | null | undefined, siteIds: string[]): string[] {
  const clean = Array.from(new Set(siteIds.filter((id) => typeof id === 'string' && Boolean(id))));
  writeLocalJson(resolveFavoritesStorageKey(uid), clean);
  emitWindowEvent(USER_FAVORITES_UPDATED_EVENT, { uid: uid || 'guest', siteIds: clean });
  return clean;
}

export function syncUserFavoritesToCloud(
  uid: string,
  siteIds: string[]
): void {
  const safeUid = sanitizeFirebaseUserKey(uid);
  const clean = writeLocalUserFavorites(uid, siteIds);
  if (!safeUid || safeUid === 'guest') return;

  const nowMs = Date.now();
  recordLocalWriteTimestamp(`favorites:${safeUid}`, nowMs);
  enqueueRealtimeCloudWrite(`users/${safeUid}/favorites`, {
    siteIds: clean,
  });
  broadcastCrossTabEvent('FAVORITES_UPDATED', { uid: safeUid, siteIds: clean, updatedAt: nowMs });
}

export function toggleUserFavoriteSite(uid: string, siteId: string): string[] {
  const current = loadUserFavorites(uid);
  const exists = current.includes(siteId);
  const next = exists ? current.filter((id) => id !== siteId) : [siteId, ...current];
  syncUserFavoritesToCloud(uid, next);
  return next;
}

export function useUserFavorites(uid?: string | null): {
  favoriteSiteIds: string[];
  isFavorite: (siteId: string) => boolean;
  toggleFavorite: (siteId: string) => void;
} {
  const [favoriteSiteIds, setFavoriteSiteIds] = useState<string[]>(() => loadUserFavorites(uid));

  useEffect(() => {
    setFavoriteSiteIds(loadUserFavorites(uid));
    const sync = () => setFavoriteSiteIds(loadUserFavorites(uid));
    window.addEventListener(USER_FAVORITES_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_FAVORITES_UPDATED_EVENT, sync);
  }, [uid]);

  return {
    favoriteSiteIds,
    isFavorite: (siteId: string) => favoriteSiteIds.includes(siteId),
    toggleFavorite: (siteId: string) => {
      if (!uid) return;
      setFavoriteSiteIds(toggleUserFavoriteSite(uid, siteId));
    },
  };
}

export function loadLastViewedSiteId(uid?: string | null): string | null {
  if (typeof window === 'undefined' || !uid) return null;
  const safe = sanitizeFirebaseUserKey(uid);
  if (!safe) return null;
  try {
    return window.localStorage.getItem(`${LAST_VIEWED_SITE_PREFIX}${safe}`);
  } catch {
    return null;
  }
}

export function saveLastViewedSiteIdLocal(uid: string, siteId: string): void {
  if (typeof window === 'undefined' || !uid || !siteId) return;
  const safe = sanitizeFirebaseUserKey(uid);
  if (!safe) return;
  try {
    window.localStorage.setItem(`${LAST_VIEWED_SITE_PREFIX}${safe}`, siteId);
  } catch {
    // ignore
  }
}

export function syncUserPreferencesToCloud(
  uid: string,
  partialPrefs: Partial<CloudUserPreferences>
): void {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid || safeUid === 'guest') return;

  if (partialPrefs.lastViewedSiteId) {
    saveLastViewedSiteIdLocal(uid, partialPrefs.lastViewedSiteId);
  }

  const nowMs = Date.now();
  recordLocalWriteTimestamp(`preferences:${safeUid}`, nowMs);
  const payload = stripUndefinedFields({ ...partialPrefs });
  if (Object.keys(payload).length === 0) return;

  enqueueRealtimeCloudWrite(`users/${safeUid}/preferences`, payload);
  broadcastCrossTabEvent('PREFERENCES_UPDATED', {
    uid: safeUid,
    preferences: payload,
    updatedAt: nowMs,
  });
}

export function syncUserOnboardingToCloud(
  uid: string,
  done: boolean
): void {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid || safeUid === 'guest') return;

  const nowMs = Date.now();
  const completedAt = done ? new Date(nowMs).toISOString() : '';
  recordLocalWriteTimestamp(`onboarding:${safeUid}`, nowMs);
  enqueueRealtimeCloudWrite(`users/${safeUid}/onboarding`, {
    done,
    completedAt,
  });
  broadcastCrossTabEvent('ONBOARDING_UPDATED', {
    uid: safeUid,
    rawUid: uid,
    done,
    completedAt,
    updatedAt: nowMs,
  });
}

export function syncUserWelcomeLetterSeenToCloud(
  uid: string,
  seen: boolean
): void {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid || safeUid === 'guest') return;

  const nowMs = Date.now();
  const seenAt = seen ? new Date(nowMs).toISOString() : '';
  recordLocalWriteTimestamp(`welcomeLetter:${safeUid}`, nowMs);
  enqueueRealtimeCloudWrite(`users/${safeUid}`, {
    welcomeLetterSeen: seen,
    welcomeLetterSeenAt: seenAt,
  });
  broadcastCrossTabEvent('WELCOME_LETTER_UPDATED', {
    uid: safeUid,
    rawUid: uid,
    seen,
    seenAt,
    updatedAt: nowMs,
  });
}

export function syncUserEntitlementsToCloud(
  uid: string,
  entitlements: Omit<CloudUserEntitlements, 'updatedAt' | 'clientUpdatedAt'>
): void {
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid || safeUid === 'guest') return;

  const nowMs = Date.now();
  recordLocalWriteTimestamp(`entitlements:${safeUid}`, nowMs);

  const cleanPayload = stripUndefinedFields({
    uid: entitlements.uid,
    email: entitlements.email,
    tier: entitlements.tier,
    unlockedSiteIds: entitlements.unlockedSiteIds,
    unlockedRouteIds: entitlements.unlockedRouteIds,
    hasSchoolPackage: entitlements.hasSchoolPackage,
    schoolName: entitlements.schoolName,
    schoolCode: entitlements.schoolCode,
    activeOrderIds: entitlements.activeOrderIds,
  });

  // Write to canonical `/users/{uid}/entitlements` AND keep `/users/{uid}/subscriptions` in sync
  enqueueRealtimeCloudWrite(`users/${safeUid}/entitlements`, cleanPayload);
  enqueueRealtimeCloudWrite(`users/${safeUid}/subscriptions`, cleanPayload);

  broadcastCrossTabEvent('ENTITLEMENTS_UPDATED', {
    uid: safeUid,
    rawUid: entitlements.uid,
    email: entitlements.email,
    entitlements: cleanPayload,
    updatedAt: nowMs,
  });
}

export function syncGlobalEmailConfigToCloud(config: Record<string, unknown>): void {
  const nowMs = Date.now();
  recordLocalWriteTimestamp('settings:emailConfig', nowMs);
  enqueueRealtimeCloudWrite('settings/emailConfig', config);
  broadcastCrossTabEvent('EMAIL_CONFIG_UPDATED', { config, updatedAt: nowMs });
}

export function syncGlobalSiteSettingsToCloud(settings: Record<string, unknown>): void {
  const nowMs = Date.now();
  recordLocalWriteTimestamp('settings:siteSettings', nowMs);
  enqueueRealtimeCloudWrite('settings/siteSettings', settings);
  broadcastCrossTabEvent('SITE_SETTINGS_UPDATED', { settings, updatedAt: nowMs });
}

export function syncGlobalPaymentQrToCloud(config: Record<string, unknown>): void {
  const nowMs = Date.now();
  recordLocalWriteTimestamp('paymentConfig:vietqr', nowMs);
  enqueueRealtimeCloudWrite('paymentConfig/vietqr', config);
  broadcastCrossTabEvent('PAYMENT_QR_UPDATED', { config, updatedAt: nowMs });
}

export function syncGlobalMediaCreditsToCloud(payload: Record<string, unknown>): void {
  const nowMs = Date.now();
  recordLocalWriteTimestamp('mediaCredits', nowMs);
  enqueueRealtimeCloudWrite('mediaCredits', payload);
  broadcastCrossTabEvent('MEDIA_CREDITS_UPDATED', { payload, updatedAt: nowMs });
}

// ============================================================================
// 6. PER-ACCOUNT REALTIME LISTENER (`/users/{uid}`) & GLOBAL SETTINGS LISTENERS
// ============================================================================
export interface UserCloudSyncCallbacks {
  onEntitlements?: (entitlements: Partial<CloudUserEntitlements>) => void;
  onPreferences?: (prefs: Partial<CloudUserPreferences>) => void;
  onOnboarding?: (onboarding: CloudUserOnboarding) => void;
  onWelcomeLetterSeen?: (seen: boolean) => void;
  onFavorites?: (siteIds: string[]) => void;
}

export interface GlobalSettingsSyncCallbacks {
  onEmailConfig?: (config: Record<string, unknown>) => void;
  onSiteSettings?: (settings: Record<string, unknown>) => void;
  onPaymentQrConfig?: (config: Record<string, unknown>) => void;
  onMediaCredits?: (payload: Record<string, unknown>) => void;
}

function normalizeFavoritesPayload(
  raw: CloudUserRealtimeNode['favorites']
): { siteIds: string[]; ts: number } | null {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return {
      siteIds: raw.filter((id): id is string => typeof id === 'string' && Boolean(id)),
      ts: 0,
    };
  }
  if (typeof raw === 'object') {
    const asNode = raw as Partial<CloudUserFavoritesNode>;
    if (Array.isArray(asNode.siteIds)) {
      const ts = Math.max(
        extractEpochMs(asNode.updatedAt),
        extractEpochMs(asNode.clientUpdatedAt)
      );
      return {
        siteIds: asNode.siteIds.filter((id): id is string => typeof id === 'string' && Boolean(id)),
        ts,
      };
    }
    const keys = Object.entries(raw as Record<string, unknown>)
      .filter(([k, v]) => v === true && k !== 'updatedAt' && k !== 'clientUpdatedAt')
      .map(([k]) => k);
    if (keys.length > 0) {
      return { siteIds: keys, ts: 0 };
    }
  }
  return null;
}

export function subscribeUserRealtimeCloudSync(
  uid: string,
  callbacks: UserCloudSyncCallbacks
): () => void {
  ensureCloudConnectionWatcher();
  const safeUid = sanitizeFirebaseUserKey(uid);
  if (!safeUid || safeUid === 'guest') {
    return () => {};
  }

  const unsubscribers: Array<() => void> = [];
  const db = getRealtimeDb();

  // 1. Firebase Realtime Database `onValue` listener on `/users/{uid}`
  if (db) {
    try {
      const userNodeRef = ref(db, `users/${safeUid}`);
      const unsubRtdb: Unsubscribe = onValue(
        userNodeRef,
        (snapshot) => {
          updateSyncStatus({ lastSyncedAt: Date.now(), lastError: null });
          const val = snapshot.val() as CloudUserRealtimeNode | null;
          if (!val || typeof val !== 'object') return;

          // A. Entitlements (prefer `/users/{uid}/entitlements`, fallback to `/users/{uid}/subscriptions`)
          const rawEnt = val.entitlements || val.subscriptions;
          if (rawEnt && typeof rawEnt === 'object') {
            const ts = Math.max(
              extractEpochMs(rawEnt.updatedAt),
              extractEpochMs(rawEnt.clientUpdatedAt)
            );
            if (shouldAcceptRemoteTimestamp(`entitlements:${safeUid}`, ts)) {
              callbacks.onEntitlements?.(rawEnt);
            }
          }

          // B. Preferences
          if (val.preferences && typeof val.preferences === 'object') {
            const rawPrefs = val.preferences;
            const ts = Math.max(
              extractEpochMs(rawPrefs.updatedAt),
              extractEpochMs(rawPrefs.clientUpdatedAt)
            );
            if (shouldAcceptRemoteTimestamp(`preferences:${safeUid}`, ts)) {
              if (
                rawPrefs.graphicsQuality === 'high' ||
                rawPrefs.graphicsQuality === 'balanced' ||
                rawPrefs.graphicsQuality === 'eco'
              ) {
                saveGraphicsQuality(rawPrefs.graphicsQuality, uid, { fromRemote: true });
              }
              if (
                rawPrefs.language === 'vi' ||
                rawPrefs.language === 'en' ||
                rawPrefs.language === 'zh'
              ) {
                emitWindowEvent(REMOTE_LANG_SYNC_EVENT, rawPrefs.language);
              }
              if (
                typeof rawPrefs.ambientMuted === 'boolean' ||
                typeof rawPrefs.ambientVolume === 'number'
              ) {
                emitWindowEvent(REMOTE_AMBIENT_SYNC_EVENT, {
                  isMuted: rawPrefs.ambientMuted,
                  volume: rawPrefs.ambientVolume,
                });
              }
              if (typeof rawPrefs.lastViewedSiteId === 'string' && rawPrefs.lastViewedSiteId) {
                saveLastViewedSiteIdLocal(uid, rawPrefs.lastViewedSiteId);
              }
              emitWindowEvent(REMOTE_PREFERENCES_APPLIED_EVENT, rawPrefs);
              callbacks.onPreferences?.(rawPrefs);
            }
          }

          // C. Onboarding (Sử Quan Dấu Ấn)
          if (val.onboarding && typeof val.onboarding === 'object') {
            const rawOnb = val.onboarding;
            const ts = Math.max(
              extractEpochMs(rawOnb.updatedAt),
              extractEpochMs(rawOnb.clientUpdatedAt)
            );
            if (shouldAcceptRemoteTimestamp(`onboarding:${safeUid}`, ts)) {
              const normalized: CloudUserOnboarding = {
                done: Boolean(rawOnb.done),
                completedAt:
                  typeof rawOnb.completedAt === 'string' ? rawOnb.completedAt : undefined,
                updatedAt: rawOnb.updatedAt,
              };
              emitWindowEvent(REMOTE_ONBOARDING_APPLIED_EVENT, { uid, ...normalized });
              callbacks.onOnboarding?.(normalized);
            }
          }

          // C2. Opening Gate Welcome Letter Seen (`/users/{uid}/welcomeLetterSeen`)
          if (typeof val.welcomeLetterSeen === 'boolean') {
            const ts = Math.max(
              extractEpochMs(val.welcomeLetterSeenAt),
              extractEpochMs(val.updatedAt)
            );
            if (shouldAcceptRemoteTimestamp(`welcomeLetter:${safeUid}`, ts)) {
              callbacks.onWelcomeLetterSeen?.(val.welcomeLetterSeen);
            }
          }

          // D. Favorites
          const favParsed = normalizeFavoritesPayload(val.favorites);
          if (favParsed) {
            if (shouldAcceptRemoteTimestamp(`favorites:${safeUid}`, favParsed.ts)) {
              writeLocalUserFavorites(uid, favParsed.siteIds);
              callbacks.onFavorites?.(favParsed.siteIds);
            }
          }
        },
        (err) => {
          updateSyncStatus({ lastError: err?.message || null });
        }
      );
      unsubscribers.push(() => unsubRtdb());
    } catch {
      // keep app resilient if RTDB ref creation fails
    }
  }

  // 2. Cross-tab BroadcastChannel listener for this UID
  const unsubCrossTab = subscribeCrossTabEvents((msg) => {
    const payload = msg.payload as Record<string, unknown> | undefined;
    if (!payload) return;
    const msgUid = typeof payload.uid === 'string' ? payload.uid : '';
    if (msgUid && msgUid !== safeUid) return;

    if (msg.type === 'ENTITLEMENTS_UPDATED' && payload.entitlements) {
      const ts = extractEpochMs(payload.updatedAt);
      if (shouldAcceptRemoteTimestamp(`entitlements:${safeUid}`, ts)) {
        callbacks.onEntitlements?.(payload.entitlements as Partial<CloudUserEntitlements>);
      }
    } else if (msg.type === 'PREFERENCES_UPDATED') {
      const prefs = (payload.preferences || payload) as Partial<CloudUserPreferences>;
      const ts = extractEpochMs(payload.updatedAt);
      if (shouldAcceptRemoteTimestamp(`preferences:${safeUid}`, ts)) {
        if (
          prefs.graphicsQuality === 'high' ||
          prefs.graphicsQuality === 'balanced' ||
          prefs.graphicsQuality === 'eco'
        ) {
          saveGraphicsQuality(prefs.graphicsQuality, uid, { fromRemote: true });
        }
        if (typeof prefs.ambientMuted === 'boolean' || typeof prefs.ambientVolume === 'number') {
          emitWindowEvent(REMOTE_AMBIENT_SYNC_EVENT, {
            isMuted: prefs.ambientMuted,
            volume: prefs.ambientVolume,
          });
        }
        if (typeof prefs.lastViewedSiteId === 'string' && prefs.lastViewedSiteId) {
          saveLastViewedSiteIdLocal(uid, prefs.lastViewedSiteId);
        }
        callbacks.onPreferences?.(prefs);
      }
    } else if (msg.type === 'ONBOARDING_UPDATED') {
      const ts = extractEpochMs(payload.updatedAt);
      if (shouldAcceptRemoteTimestamp(`onboarding:${safeUid}`, ts)) {
        const normalized: CloudUserOnboarding = {
          done: Boolean(payload.done),
          completedAt:
            typeof payload.completedAt === 'string' ? payload.completedAt : undefined,
        };
        emitWindowEvent(REMOTE_ONBOARDING_APPLIED_EVENT, { uid, ...normalized });
        callbacks.onOnboarding?.(normalized);
      }
    } else if (msg.type === 'WELCOME_LETTER_UPDATED') {
      const ts = extractEpochMs(payload.updatedAt);
      if (shouldAcceptRemoteTimestamp(`welcomeLetter:${safeUid}`, ts)) {
        callbacks.onWelcomeLetterSeen?.(Boolean(payload.seen));
      }
    } else if (msg.type === 'FAVORITES_UPDATED' && Array.isArray(payload.siteIds)) {
      const ts = extractEpochMs(payload.updatedAt);
      if (shouldAcceptRemoteTimestamp(`favorites:${safeUid}`, ts)) {
        const clean = writeLocalUserFavorites(uid, payload.siteIds as string[]);
        callbacks.onFavorites?.(clean);
      }
    }
  });
  unsubscribers.push(unsubCrossTab);

  return () => {
    for (const unsub of unsubscribers) {
      try {
        unsub();
      } catch {
        // ignore cleanup error
      }
    }
  };
}

export function subscribeGlobalSettingsRealtimeSync(
  callbacks: GlobalSettingsSyncCallbacks
): () => void {
  ensureCloudConnectionWatcher();
  const unsubscribers: Array<() => void> = [];
  const db = getRealtimeDb();

  if (db) {
    try {
      const emailConfigRef = ref(db, 'settings/emailConfig');
      const unsubEmail = onValue(
        emailConfigRef,
        (snap) => {
          const val = snap.val() as Record<string, unknown> | null;
          if (!val || typeof val !== 'object') return;
          const ts = Math.max(extractEpochMs(val.updatedAt), extractEpochMs(val.clientUpdatedAt));
          if (shouldAcceptRemoteTimestamp('settings:emailConfig', ts)) {
            callbacks.onEmailConfig?.(val);
          }
        },
        () => {
          // ignore permission errors gracefully
        }
      );
      unsubscribers.push(() => unsubEmail());

      const siteSettingsRef = ref(db, 'settings/siteSettings');
      const unsubSite = onValue(
        siteSettingsRef,
        (snap) => {
          const val = snap.val() as Record<string, unknown> | null;
          if (!val || typeof val !== 'object') return;
          const ts = Math.max(extractEpochMs(val.updatedAt), extractEpochMs(val.clientUpdatedAt));
          if (shouldAcceptRemoteTimestamp('settings:siteSettings', ts)) {
            callbacks.onSiteSettings?.(val);
          }
        },
        () => {
          // ignore permission errors gracefully
        }
      );
      unsubscribers.push(() => unsubSite());

      const qrRef = ref(db, 'paymentConfig/vietqr');
      const unsubQr = onValue(
        qrRef,
        (snap) => {
          const val = snap.val() as Record<string, unknown> | null;
          if (!val || typeof val !== 'object') return;
          const ts = Math.max(extractEpochMs(val.updatedAt), extractEpochMs(val.clientUpdatedAt));
          if (shouldAcceptRemoteTimestamp('paymentConfig:vietqr', ts)) {
            callbacks.onPaymentQrConfig?.(val);
          }
        },
        () => {
          // ignore permission errors gracefully
        }
      );
      unsubscribers.push(() => unsubQr());

      const mediaCreditsRef = ref(db, 'mediaCredits');
      const unsubMediaCredits = onValue(
        mediaCreditsRef,
        (snap) => {
          const val = snap.val() as Record<string, unknown> | null;
          if (!val || typeof val !== 'object') return;
          const ts = Math.max(extractEpochMs(val.updatedAt), extractEpochMs(val.clientUpdatedAt));
          if (shouldAcceptRemoteTimestamp('mediaCredits', ts)) {
            callbacks.onMediaCredits?.(val);
          }
        },
        () => {
          // ignore permission errors gracefully
        }
      );
      unsubscribers.push(() => unsubMediaCredits());
    } catch {
      // ignore RTDB init errors
    }
  }

  const unsubCrossTab = subscribeCrossTabEvents((msg) => {
    const payload = msg.payload as Record<string, unknown> | undefined;
    if (!payload) return;
    if (msg.type === 'EMAIL_CONFIG_UPDATED' && payload.config) {
      callbacks.onEmailConfig?.(payload.config as Record<string, unknown>);
    } else if (msg.type === 'SITE_SETTINGS_UPDATED' && payload.settings) {
      callbacks.onSiteSettings?.(payload.settings as Record<string, unknown>);
    } else if (msg.type === 'PAYMENT_QR_UPDATED' && payload.config) {
      callbacks.onPaymentQrConfig?.(payload.config as Record<string, unknown>);
    } else if (msg.type === 'MEDIA_CREDITS_UPDATED' && payload.payload) {
      callbacks.onMediaCredits?.(payload.payload as Record<string, unknown>);
    }
  });
  unsubscribers.push(unsubCrossTab);

  return () => {
    for (const unsub of unsubscribers) {
      try {
        unsub();
      } catch {
        // ignore cleanup error
      }
    }
  };
}

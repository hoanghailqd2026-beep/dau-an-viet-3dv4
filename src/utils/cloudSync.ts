/**
 * Tier 2 — Max-Level 3-Tier Sync Engine & Smart Asset Resolution Chain
 *
 * Architecture:
 *   Tier 1 (Local Vault): IndexedDB (`DauAnViet3D_AssetVault`) for offline-first .glb/.m4a/.mp3 Blobs
 *   Tier 2 (Cloud Sync) : Firebase Storage (binary offload) + Firestore (chunked lightweight metadata)
 *   Tier 3 (Source Code): Static `src/data/bakedAssets.ts` + `public/` assets
 *   Tier 4 (Safe Fallback): Procedural 3D / Multilingual Web Speech API (never crashes or white-screens)
 */

import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  setDoc,
  type Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import { firebaseApp, firebaseAuth } from '../lib/firebaseAuth';
import type { HeritageHotspotFeature, HeritageSite } from '../types/heritage';
import {
  BAKED_ASSETS,
  BAKED_ASSETS_LIST,
  BAKED_ASSETS_VERSION,
  getBakedAudioCandidateUrls,
  getBakedModelCandidateUrls,
} from '../data/bakedAssets';
import { DEFAULT_HERITAGE_SITES } from '../data/heritageData';
import {
  DEFAULT_SITE_PHOTOS_BY_ID,
  normalizeHighResPhotoUrl,
} from '../data/heritagePhotos';
import {
  DEFAULT_HERITAGE_3D_CONFIG,
  HOTSPOTS_3D_STORAGE_KEY,
  TRANSFORMS_3D_STORAGE_KEY,
  loadSaved3DHotspots,
  loadSaved3DTransforms,
} from '../data/heritage3DConfig';
import { AUDIO_GUIDE_SCRIPTS, getCuratedAudioScript } from '../data/audioGuideScripts';
import {
  HERITAGE_VIDEO_KEYS_ORDERED,
  SITE_ID_TO_VIDEO_KEY,
  VIDEO_KEY_TO_SITE_ID,
  loadCustomVideoUrlForHeritage,
  loadLocalVideoFromIndexedDB,
  saveCustomVideoUrlForHeritage,
  saveLocalVideoToIndexedDB,
  type HeritageVideoKey,
} from '../data/heritageFilms';
import {
  getAudioFromVault,
  getImageFromVault,
  getModelFromVault,
  getVideoFromVault,
  listVaultAudioMeta,
  listVaultImagesMeta,
  listVaultModelsMeta,
  listVaultVideosMeta,
  saveAudioBlobToVault,
  saveImageBlobToVault,
  saveModelBlobToVault,
  saveVideoBlobToVault,
  type VaultAssetMeta,
  type VaultResolvedEntry,
} from './assetVault';
import { loadMediaCredits, saveMediaCredits } from './mediaCreditsStore';
import {
  FIREBASE_DB_URL,
  isFirebaseDbConfigured,
  pushHeritageSitesToFirebase,
} from './firebaseRestSync';

// ============================================================================
// CONSTANTS & STORAGE KEYS (UNIFIED 6-CATEGORY CHUNKED CLOUD SYNC ENGINE)
// ============================================================================

export const CHUNK_SIZE = 350 * 1024; // Fixed 350KB Base64 chunk size (safe under Firebase 1MB doc/packet cap)
export const MAX_CHUNKED_FILE_BYTES = 25 * 1024 * 1024; // Up to 25MB per .glb / .m4a / .mp3 / image / .mp4 file
export const CLOUD_SYNC_UPDATED_EVENT = 'dau-an-viet-cloud-sync-engine-updated';
export const CLOUD_ASSETS_MANIFEST_READY_EVENT = 'dau-an-viet-cloud-manifest-ready';
export const CLOUD_DOWNLOAD_PROGRESS_EVENT = 'dau-an-viet-cloud-download-progress';
export const CLOUD_ASSET_ERROR_EVENT = 'dau-an-viet-cloud-asset-error';
export const CLOUD_AUTO_SYNC_TOAST_EVENT = 'dau-an-viet-cloud-auto-sync-toast';

export const CLOUD_MODEL_URLS_KEY = 'dau_an_viet_cloud_model_urls_v1';
export const CLOUD_AUDIO_URLS_KEY = 'dau_an_viet_cloud_audio_urls_v1';
const LOCAL_SYNC_META_KEY = 'dau_an_viet_cloud_sync_meta_v1';
const CUSTOM_RTDB_URL_KEY = 'dau_an_viet_custom_rtdb_url_v1';

// Existing localStorage keys mirrored without circular imports
const KEY_CUSTOM_SITE_PHOTOS = 'heritage_custom_real_photos_v1';
const KEY_PHOTO_CAPTIONS = 'dau_an_viet_photo_captions_v1';
const KEY_CUSTOM_GLB_URLS = 'dau_an_viet_custom_glb_urls_v1';
const KEY_CMS_OVERRIDES = 'dau_an_viet_cms_overrides_v1';
const KEY_HIDDEN_HERITAGES = 'dau_an_viet_hidden_heritages';
const KEY_AUDIO_OVERRIDES = 'dau_an_viet_audio_script_overrides_v1';
const KEY_SITE_SETTINGS = 'dau_an_viet_site_settings_v1';
const KEY_SITE_TRANSLATIONS = 'dau_an_viet_site_translations_v1';
const KEY_VISITOR_REVIEWS = 'dau_an_viet_visitor_reviews';
const KEY_PUBLISHED_QUIZZES = 'dau_an_viet_published_quizzes_v1';
const KEY_QUIZ_DRAFTS = 'dau_an_viet_quiz_drafts_v1';

// Accounts & Roles keys mirrored for unified cross-device sync
const KEY_ACCOUNTS_DB = 'dau_an_viet_accounts_db_v1';
const KEY_USER_CREDENTIALS = 'dau_an_viet_user_credentials_v1';
const KEY_VISITORS_REGISTRY = 'dau_an_viet_visitors_registry_v1';
const KEY_ISSUED_PASSES = 'dau_an_viet_issued_passes_v1';
const KEY_SUBSCRIPTION_TIERS = 'dau_an_viet_subscription_tier_v1';
const KEY_SCHOOL_PACKAGES = 'dau_an_viet_school_packages_v1';
const KEY_TESTER_ALLOWLIST = 'dau_an_viet_tester_allowlist_v1';
const KEY_ADMIN_EMAILS = 'dau_an_viet_admin_emails';
const KEY_LOCKED_ACCOUNTS = 'dau_an_viet_locked_accounts_v1';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  code: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: Array<{ providerId?: string | null; email?: string | null }>;
  };
}

export type CloudSyncHealth =
  | 'synced'
  | 'local_indexeddb_only'
  | 'rules_attention'
  | 'syncing';

export interface SyncTelemetryEntry {
  id: string;
  timestamp: string;
  branch: string;
  action: 'push' | 'pull' | 'storage_upload' | 'probe' | 'chunk_push' | 'chunk_pull';
  status: 'ok' | 'warn' | 'error';
  message: string;
  errorCode?: string;
  errorMessage?: string;
  bytes?: number;
  durationMs?: number;
}

export interface CloudSyncStateSnapshot {
  health: CloudSyncHealth;
  isSyncing: boolean;
  firestoreReady: boolean;
  storageReady: boolean;
  projectId: string;
  databaseId: string;
  storageBucket: string;
  localUpdatedAt: string | null;
  cloudUpdatedAt: string | null;
  lastSyncedAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  conflictStatus: 'in_sync' | 'local_newer' | 'cloud_newer' | 'unknown';
  logs: SyncTelemetryEntry[];
}

export type AssetResolutionTier =
  | 'firebase_cloud'
  | 'indexed_db'
  | 'static_source'
  | 'fallback';

export interface ResolvedSmartAsset {
  siteId: string;
  kind: 'model' | 'audio';
  tier: AssetResolutionTier;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  durationSec?: number;
  updatedAt: string | null;
}

export type ChunkAssetType = 'models' | 'audio' | 'images' | 'videos';
export type UnifiedSyncCategory =
  | 'models'
  | 'audio'
  | 'images'
  | 'videos'
  | 'accounts'
  | 'updates';

export interface UnifiedSyncCategorySelection {
  models: boolean;
  audio: boolean;
  images: boolean;
  videos: boolean;
  accounts: boolean;
  updates: boolean;
}

export interface ChunkedAssetMeta {
  assetType: ChunkAssetType;
  siteId: string;
  fileName: string;
  mimeType: string;
  totalChunks: number;
  totalSize: number;
  updatedAt: string;
  checksum: string;
  /** Exact remote key found on Cloud (supports flexible key lookup without breaking existing data) */
  remoteKey?: string;
  /** Which backend holds this asset's chunks so download hits the exact store */
  transportSource?: 'rtdb' | 'firestore';
}

export interface CloudAssetErrorSnapshot {
  siteId: string;
  assetType: ChunkAssetType;
  code: string;
  message: string;
  occurredAt: string;
}

export interface CloudAutoSyncToastState {
  active: boolean;
  status: 'syncing' | 'ok' | 'error';
  label: string;
  detail?: string;
  percent?: number;
}

export interface ChunkTransferProgress {
  siteId: string;
  siteName?: string;
  assetType: UnifiedSyncCategory;
  phase: 'encoding' | 'uploading' | 'downloading' | 'reassembling' | 'done' | 'error';
  active: boolean;
  currentChunk: number;
  totalChunks: number;
  percent: number;
  label: string;
}

export interface FirebaseHealthCheckResult {
  ok: boolean;
  transport: 'rtdb' | 'firestore';
  endpoint: string;
  latencyMs: number;
  readBackTimestamp?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface BatchChunkSyncItemResult {
  siteId: string;
  siteName: string;
  assetType: UnifiedSyncCategory;
  fileName: string;
  fileSize: number;
  totalChunks: number;
  status: 'ok' | 'skipped' | 'error';
  message: string;
  detailText?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SiteAssetAuditRow {
  siteId: string;
  code: string;
  slug: string;
  officialName: string;
  hasPhotos: boolean;
  photoCount: number;
  photoUrls: [string, string];
  modelTier: AssetResolutionTier;
  modelUrl: string | null;
  modelFileName: string | null;
  directModelUrl: string;
  cloudModelChunks: number;
  recommendedModelPath: string;
  audioTier: AssetResolutionTier;
  audioUrl: string | null;
  audioFileName: string | null;
  directAudioUrl: string;
  cloudAudioChunks: number;
  hasScriptNarration: boolean;
  recommendedAudioPath: string;
  primaryStorageLabelVi: string;
  primaryStorageLabelEn: string;
  primaryStorageLabelZh: string;
}

// ============================================================================
// FIRESTORE & RTDB TRANSPORT INITIALIZATION (100% FREE TIER — NO STORAGE NEEDED)
// ============================================================================

let cachedDb: Firestore | null | undefined;
let cachedStorage: FirebaseStorage | null | undefined;
let connectionProbeStarted = false;

export function getHeritageFirestore(): Firestore | null {
  if (cachedDb !== undefined) return cachedDb;
  try {
    const dbId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
    cachedDb = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);
    return cachedDb;
  } catch {
    cachedDb = null;
    return null;
  }
}

export function getHeritageStorage(): FirebaseStorage | null {
  if (cachedStorage !== undefined) return cachedStorage;
  try {
    const bucket = (firebaseConfig as { storageBucket?: string }).storageBucket;
    if (!bucket || !bucket.trim()) {
      cachedStorage = null;
      return null;
    }
    cachedStorage = getStorage(firebaseApp, `gs://${bucket.replace(/^gs:\/\//, '')}`);
    return cachedStorage;
  } catch {
    cachedStorage = null;
    return null;
  }
}

export function getCustomRtdbUrlOverride(): string {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(CUSTOM_RTDB_URL_KEY) || '').trim().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export function saveCustomRtdbUrlOverride(rawUrl: string): string {
  const cleaned = rawUrl.trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    try {
      if (cleaned) {
        window.localStorage.setItem(CUSTOM_RTDB_URL_KEY, cleaned);
      } else {
        window.localStorage.removeItem(CUSTOM_RTDB_URL_KEY);
      }
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(CLOUD_SYNC_UPDATED_EVENT, { detail: syncState }));
  }
  return cleaned;
}

function resolveConfiguredRtdbUrl(): string | null {
  const customOverride = getCustomRtdbUrlOverride();
  if (/^https?:\/\//i.test(customOverride)) return customOverride;

  const cfgDbUrl = (firebaseConfig as { databaseURL?: string }).databaseURL;
  if (typeof cfgDbUrl === 'string' && /^https?:\/\//i.test(cfgDbUrl.trim())) {
    return cfgDbUrl.trim().replace(/\/+$/, '');
  }

  if (isFirebaseDbConfigured()) {
    return FIREBASE_DB_URL;
  }
  return null;
}

export function getActiveChunkTransport(): {
  mode: 'rtdb' | 'firestore';
  label: string;
  endpoint: string;
} {
  const rtdbUrl = resolveConfiguredRtdbUrl();
  if (rtdbUrl) {
    return {
      mode: 'rtdb',
      label: 'Firebase Realtime Database (Chunked 350KB)',
      endpoint: rtdbUrl,
    };
  }
  const projectId = String((firebaseConfig as { projectId?: string }).projectId || '');
  const dbId = String(
    (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)'
  );
  return {
    mode: 'firestore',
    label: 'Firebase Cloud Database (Chunked 350KB · Free Tier)',
    endpoint: `${projectId} / ${dbId}`,
  };
}

export function extractFirebaseErrorDetails(err: unknown): { code: string; message: string } {
  if (err && typeof err === 'object') {
    const obj = err as { code?: unknown; message?: unknown };
    const code = typeof obj.code === 'string' && obj.code.trim() ? obj.code.trim() : 'unknown';
    const message =
      typeof obj.message === 'string' && obj.message.trim()
        ? obj.message.trim()
        : String(err);
    return { code, message };
  }
  return { code: 'unknown', message: String(err || 'Unknown error') };
}

export function buildFirestoreErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const { code, message } = extractFirebaseErrorDetails(error);
  const currentUser = firebaseAuth.currentUser;
  return {
    error: message,
    code,
    operationType,
    path,
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      tenantId: currentUser?.tenantId ?? null,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
  };
}

// ============================================================================
// LIVE SYNC STATE, DOWNLOAD PROGRESS & TELEMETRY STORE
// ============================================================================

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

interface StoredSyncMeta {
  localUpdatedAt: string | null;
  cloudUpdatedAt: string | null;
  lastSyncedAt: string | null;
}

const persistedMeta = readLocalJson<StoredSyncMeta>(LOCAL_SYNC_META_KEY, {
  localUpdatedAt: null,
  cloudUpdatedAt: null,
  lastSyncedAt: null,
});

let syncState: CloudSyncStateSnapshot = {
  health: 'local_indexeddb_only',
  isSyncing: false,
  firestoreReady: Boolean((firebaseConfig as { projectId?: string }).projectId),
  storageReady: Boolean((firebaseConfig as { projectId?: string }).projectId),
  projectId: String((firebaseConfig as { projectId?: string }).projectId || ''),
  databaseId: String((firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId || '(default)'),
  storageBucket: String((firebaseConfig as { storageBucket?: string }).storageBucket || ''),
  localUpdatedAt: persistedMeta.localUpdatedAt,
  cloudUpdatedAt: persistedMeta.cloudUpdatedAt,
  lastSyncedAt: persistedMeta.lastSyncedAt,
  lastErrorCode: null,
  lastErrorMessage: null,
  conflictStatus: 'unknown',
  logs: [],
};

// Live per-asset chunk download progress, cloud error diagnostics & background auto-sync toast
const activeDownloadProgressMap = new Map<string, ChunkTransferProgress>();
const activeCloudErrorMap = new Map<string, CloudAssetErrorSnapshot>();
let currentAutoSyncToast: CloudAutoSyncToastState = {
  active: false,
  status: 'ok',
  label: '',
};
let autoSyncToastClearTimer: number | null = null;

function setActiveDownloadProgress(progress: ChunkTransferProgress | null, key: string): void {
  if (!progress || !progress.active) {
    activeDownloadProgressMap.delete(key);
  } else {
    activeDownloadProgressMap.set(key, progress);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CLOUD_DOWNLOAD_PROGRESS_EVENT, {
        detail: { key, progress },
      })
    );
  }
}

function setCloudAssetError(
  siteId: string,
  assetType: ChunkAssetType,
  err: { code: string; message: string } | null
): void {
  const key = `${assetType}:${getCanonicalAssetKey(siteId)}`;
  if (!err) {
    activeCloudErrorMap.delete(key);
  } else {
    activeCloudErrorMap.set(key, {
      siteId,
      assetType,
      code: err.code,
      message: err.message,
      occurredAt: new Date().toISOString(),
    });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(CLOUD_ASSET_ERROR_EVENT, {
        detail: { siteId, assetType, error: err },
      })
    );
  }
}

export function getCloudAssetError(
  siteId: string | null | undefined,
  assetType: ChunkAssetType
): CloudAssetErrorSnapshot | null {
  if (!siteId) return null;
  return activeCloudErrorMap.get(`${assetType}:${getCanonicalAssetKey(siteId)}`) || null;
}

export function clearCloudAssetError(siteId: string, assetType: ChunkAssetType): void {
  setCloudAssetError(siteId, assetType, null);
}

export function useCloudAssetError(
  siteId: string | null | undefined,
  assetType: ChunkAssetType
): CloudAssetErrorSnapshot | null {
  const [errState, setErrState] = useState<CloudAssetErrorSnapshot | null>(() =>
    getCloudAssetError(siteId, assetType)
  );

  useEffect(() => {
    const syncErr = () => setErrState(getCloudAssetError(siteId, assetType));
    syncErr();
    window.addEventListener(CLOUD_ASSET_ERROR_EVENT, syncErr);
    return () => window.removeEventListener(CLOUD_ASSET_ERROR_EVENT, syncErr);
  }, [siteId, assetType]);

  return errState;
}

export function emitCloudAutoSyncToast(next: CloudAutoSyncToastState, autoHideMs = 0): void {
  if (typeof window !== 'undefined' && autoSyncToastClearTimer !== null) {
    window.clearTimeout(autoSyncToastClearTimer);
    autoSyncToastClearTimer = null;
  }
  currentAutoSyncToast = next;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLOUD_AUTO_SYNC_TOAST_EVENT, { detail: next }));
    if (autoHideMs > 0) {
      autoSyncToastClearTimer = window.setTimeout(() => {
        currentAutoSyncToast = { active: false, status: 'ok', label: '' };
        window.dispatchEvent(
          new CustomEvent(CLOUD_AUTO_SYNC_TOAST_EVENT, { detail: currentAutoSyncToast })
        );
      }, autoHideMs);
    }
  }
}

export function useCloudAutoSyncToast(): CloudAutoSyncToastState {
  const [toast, setToast] = useState<CloudAutoSyncToastState>(() => currentAutoSyncToast);
  useEffect(() => {
    const syncToast = () => setToast({ ...currentAutoSyncToast });
    syncToast();
    window.addEventListener(CLOUD_AUTO_SYNC_TOAST_EVENT, syncToast);
    return () => window.removeEventListener(CLOUD_AUTO_SYNC_TOAST_EVENT, syncToast);
  }, []);
  return toast;
}

export function getCloudAssetDownloadProgress(
  siteId: string | null | undefined,
  assetType: ChunkAssetType
): ChunkTransferProgress | null {
  if (!siteId) return null;
  const canonical = getCanonicalAssetKey(siteId);
  return (
    activeDownloadProgressMap.get(`${assetType}:${canonical}`) ||
    activeDownloadProgressMap.get(`${assetType}:${siteId}`) ||
    null
  );
}

export function useCloudAssetDownloadProgress(
  siteId: string | null | undefined,
  assetType: ChunkAssetType
): ChunkTransferProgress | null {
  const [progress, setProgress] = useState<ChunkTransferProgress | null>(() =>
    getCloudAssetDownloadProgress(siteId, assetType)
  );

  useEffect(() => {
    const syncProgress = () => {
      setProgress(getCloudAssetDownloadProgress(siteId, assetType));
    };
    syncProgress();
    window.addEventListener(CLOUD_DOWNLOAD_PROGRESS_EVENT, syncProgress);
    return () => {
      window.removeEventListener(CLOUD_DOWNLOAD_PROGRESS_EVENT, syncProgress);
    };
  }, [siteId, assetType]);

  return progress;
}

function computeConflictStatus(
  localIso: string | null,
  cloudIso: string | null
): CloudSyncStateSnapshot['conflictStatus'] {
  if (!localIso && !cloudIso) return 'unknown';
  if (localIso && !cloudIso) return 'local_newer';
  if (!localIso && cloudIso) return 'cloud_newer';
  const localMs = Date.parse(localIso || '');
  const cloudMs = Date.parse(cloudIso || '');
  if (!Number.isFinite(localMs) || !Number.isFinite(cloudMs)) return 'unknown';
  if (Math.abs(localMs - cloudMs) < 1500) return 'in_sync';
  return localMs > cloudMs ? 'local_newer' : 'cloud_newer';
}

function updateSyncState(partial: Partial<CloudSyncStateSnapshot>): void {
  const nextLocal =
    partial.localUpdatedAt !== undefined ? partial.localUpdatedAt : syncState.localUpdatedAt;
  const nextCloud =
    partial.cloudUpdatedAt !== undefined ? partial.cloudUpdatedAt : syncState.cloudUpdatedAt;

  syncState = {
    ...syncState,
    ...partial,
    conflictStatus: computeConflictStatus(nextLocal, nextCloud),
  };

  writeLocalJson(LOCAL_SYNC_META_KEY, {
    localUpdatedAt: syncState.localUpdatedAt,
    cloudUpdatedAt: syncState.cloudUpdatedAt,
    lastSyncedAt: syncState.lastSyncedAt,
  } satisfies StoredSyncMeta);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CLOUD_SYNC_UPDATED_EVENT, { detail: syncState }));
  }
}

function appendSyncLog(entry: Omit<SyncTelemetryEntry, 'id' | 'timestamp'>): void {
  const full: SyncTelemetryEntry = {
    ...entry,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  const nextLogs = [full, ...syncState.logs].slice(0, 120);
  updateSyncState({ logs: nextLogs });
}

export function clearCloudSyncLogs(): void {
  updateSyncState({ logs: [] });
}

export function markLocalAssetsMutated(): void {
  updateSyncState({ localUpdatedAt: new Date().toISOString() });
}

export function getCloudSyncState(): CloudSyncStateSnapshot {
  return syncState;
}

export function useCloudSyncStatus(): CloudSyncStateSnapshot {
  const [snapshot, setSnapshot] = useState<CloudSyncStateSnapshot>(() => getCloudSyncState());

  useEffect(() => {
    const syncNow = () => setSnapshot({ ...getCloudSyncState() });
    syncNow();
    window.addEventListener(CLOUD_SYNC_UPDATED_EVENT, syncNow);
    return () => {
      window.removeEventListener(CLOUD_SYNC_UPDATED_EVENT, syncNow);
    };
  }, []);

  return snapshot;
}

/**
 * Startup connectivity check (`getDocFromServer(doc(db, 'test', 'connection'))`)
 * per Firebase SDK guidelines.
 */
export async function testFirestoreConnection(): Promise<{
  ok: boolean;
  code?: string;
  message?: string;
}> {
  const db = getHeritageFirestore();
  if (!db) {
    updateSyncState({
      firestoreReady: false,
      health: 'local_indexeddb_only',
      lastErrorCode: 'firestore/not-initialized',
      lastErrorMessage: 'Firestore SDK chưa được khởi tạo.',
    });
    return { ok: false, code: 'firestore/not-initialized', message: 'Firestore not initialized' };
  }

  const startedAt = performance.now();
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    updateSyncState({ firestoreReady: true });
    appendSyncLog({
      branch: 'test/connection',
      action: 'probe',
      status: 'ok',
      message: 'Kết nối Firebase Cloud Database thành công.',
      durationMs: Math.round(performance.now() - startedAt),
    });
    return { ok: true };
  } catch (err) {
    const info = buildFirestoreErrorInfo(err, OperationType.GET, 'test/connection');
    const isOffline = info.error.toLowerCase().includes('the client is offline');
    const isPermission =
      info.code.includes('permission-denied') ||
      info.error.toLowerCase().includes('missing or insufficient permissions');

    if (isOffline) {
      console.error('Please check your Firebase configuration.', JSON.stringify(info));
      updateSyncState({
        health: 'local_indexeddb_only',
        lastErrorCode: info.code,
        lastErrorMessage: info.error,
      });
    } else if (isPermission) {
      updateSyncState({
        health: 'rules_attention',
        lastErrorCode: info.code,
        lastErrorMessage: info.error,
      });
    }

    appendSyncLog({
      branch: 'test/connection',
      action: 'probe',
      status: isPermission ? 'warn' : 'error',
      message: isPermission
        ? 'Firebase phản hồi nhưng Rules chưa cấp phép đọc test/connection.'
        : 'Chưa kết nối được Firebase (đang vận hành ở chế độ IndexedDB cục bộ).',
      errorCode: info.code,
      errorMessage: info.error,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return { ok: false, code: info.code, message: info.error };
  }
}

if (typeof window !== 'undefined' && !connectionProbeStarted) {
  connectionProbeStarted = true;
  window.setTimeout(() => {
    void testFirestoreConnection();
  }, 1400);
}

// ============================================================================
// REAL FIREBASE WRITE/READ HEALTH CHECK (`/_healthCheck`)
// ============================================================================

async function getFirebaseAuthIdToken(): Promise<string | null> {
  try {
    const user = firebaseAuth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

async function rtdbRequest<T>(
  rtdbUrl: string,
  path: string,
  method: 'GET' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<T> {
  const token = await getFirebaseAuthIdToken();
  const cleanPath = path.replace(/^\/+/, '');
  const query = token ? `?auth=${encodeURIComponent(token)}` : '';
  const url = `${rtdbUrl}/${cleanPath}.json${query}`;

  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (!res.ok) {
    let errText = `HTTP ${res.status}`;
    try {
      const parsed = (await res.json()) as { error?: string };
      if (parsed?.error) errText = parsed.error;
    } catch {
      // ignore
    }
    const code =
      res.status === 401 || res.status === 403
        ? 'permission-denied'
        : res.status === 404
        ? 'database/not-found'
        : `rtdb/http-${res.status}`;
    const err = new Error(errText) as Error & { code: string };
    err.code = code;
    throw err;
  }

  return (await res.json()) as T;
}

/**
 * Live write + immediate read-back verification against `/_healthCheck`
 * to confirm 100% databaseURL & read/write Rules before batch pushing.
 */
export async function runFirebaseWriteHealthCheck(): Promise<FirebaseHealthCheckResult> {
  const transport = getActiveChunkTransport();
  const startedAt = performance.now();
  const nowIso = new Date().toISOString();
  const checkedBy = firebaseAuth.currentUser?.email || 'unauthenticated-session';

  if (transport.mode === 'rtdb') {
    try {
      await rtdbRequest(transport.endpoint, '_healthCheck', 'PUT', {
        ok: true,
        timestamp: nowIso,
        checkedBy,
        transport: 'rtdb',
      });
      const readBack = await rtdbRequest<{ ok?: boolean; timestamp?: string }>(
        transport.endpoint,
        '_healthCheck',
        'GET'
      );
      const latencyMs = Math.round(performance.now() - startedAt);
      const verified = Boolean(readBack?.ok && readBack?.timestamp === nowIso);

      updateSyncState({
        health: verified ? 'synced' : 'rules_attention',
        lastErrorCode: verified ? null : 'rtdb/readback-mismatch',
        lastErrorMessage: verified ? null : 'Không đọc lại được bản ghi /_healthCheck vừa ghi.',
      });
      appendSyncLog({
        branch: '/_healthCheck',
        action: 'probe',
        status: verified ? 'ok' : 'warn',
        message: verified
          ? `Xác thực ghi & đọc lại /_healthCheck trên Realtime Database thành công (${latencyMs}ms).`
          : 'Ghi thành công nhưng dữ liệu đọc lại từ /_healthCheck không khớp.',
        durationMs: latencyMs,
      });
      return {
        ok: verified,
        transport: 'rtdb',
        endpoint: transport.endpoint,
        latencyMs,
        readBackTimestamp: readBack?.timestamp,
      };
    } catch (err) {
      const { code, message } = extractFirebaseErrorDetails(err);
      const latencyMs = Math.round(performance.now() - startedAt);
      updateSyncState({
        health: 'rules_attention',
        lastErrorCode: code,
        lastErrorMessage: message,
      });
      appendSyncLog({
        branch: '/_healthCheck',
        action: 'probe',
        status: 'error',
        message: 'Kiểm tra quyền ghi /_healthCheck thất bại.',
        errorCode: code,
        errorMessage: message,
        durationMs: latencyMs,
      });
      return {
        ok: false,
        transport: 'rtdb',
        endpoint: transport.endpoint,
        latencyMs,
        errorCode: code,
        errorMessage: message,
      };
    }
  }

  // Free-Tier Firestore path (`_healthCheck/probe`)
  const db = getHeritageFirestore();
  if (!db) {
    return {
      ok: false,
      transport: 'firestore',
      endpoint: transport.endpoint,
      latencyMs: 0,
      errorCode: 'firestore/not-initialized',
      errorMessage: 'Firestore SDK chưa được khởi tạo.',
    };
  }

  try {
    const probeRef = doc(db, '_healthCheck', 'probe');
    await setDoc(probeRef, {
      ok: true,
      timestamp: nowIso,
      checkedBy,
      transport: 'firestore',
    });
    const snap = await getDocFromServer(probeRef);
    const data = snap.exists() ? (snap.data() as { ok?: boolean; timestamp?: string }) : null;
    const latencyMs = Math.round(performance.now() - startedAt);
    const verified = Boolean(data?.ok && data?.timestamp === nowIso);

    updateSyncState({
      health: verified ? 'synced' : 'rules_attention',
      lastErrorCode: verified ? null : 'firestore/readback-mismatch',
      lastErrorMessage: verified ? null : 'Không đọc lại được bản ghi /_healthCheck/probe.',
    });
    appendSyncLog({
      branch: '/_healthCheck/probe',
      action: 'probe',
      status: verified ? 'ok' : 'warn',
      message: verified
        ? `Xác thực quyền ghi & đọc lại /_healthCheck trên Firebase thành công (${latencyMs}ms).`
        : 'Ghi /_healthCheck thành công nhưng dữ liệu đọc lại không khớp.',
      durationMs: latencyMs,
    });
    return {
      ok: verified,
      transport: 'firestore',
      endpoint: transport.endpoint,
      latencyMs,
      readBackTimestamp: data?.timestamp,
    };
  } catch (err) {
    const info = buildFirestoreErrorInfo(err, OperationType.WRITE, '_healthCheck/probe');
    const latencyMs = Math.round(performance.now() - startedAt);
    const hint = !firebaseAuth.currentUser
      ? ' (Bạn chưa đăng nhập Google Admin — vui lòng đăng nhập tài khoản quản trị viên để ghi lên Firebase).'
      : '';
    updateSyncState({
      health: 'rules_attention',
      lastErrorCode: info.code,
      lastErrorMessage: `${info.error}${hint}`,
    });
    appendSyncLog({
      branch: '/_healthCheck/probe',
      action: 'probe',
      status: 'error',
      message: `Kiểm tra quyền ghi /_healthCheck thất bại.${hint}`,
      errorCode: info.code,
      errorMessage: info.error,
      durationMs: latencyMs,
    });
    return {
      ok: false,
      transport: 'firestore',
      endpoint: transport.endpoint,
      latencyMs,
      errorCode: info.code,
      errorMessage: `${info.error}${hint}`,
    };
  }
}

// ============================================================================
// CLOUD URL REGISTRY & DIRECT CDN (GITHUB / JSDELIVR) HELPERS
// ============================================================================

export interface CloudAssetUrlRecord {
  url: string;
  fileName: string;
  fileSize?: number;
  durationSec?: number;
  updatedAt: string;
  storagePath?: string;
}

export function normalizeDirectCdnUrl(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;

  const githubBlobMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^?#]+)([?#].*)?$/i
  );
  if (githubBlobMatch) {
    const [, owner, repo, restPath] = githubBlobMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${restPath}`;
  }

  const githubRawMatch = trimmed.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/raw\/([^?#]+)([?#].*)?$/i
  );
  if (githubRawMatch) {
    const [, owner, repo, restPath] = githubRawMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${restPath}`;
  }

  return trimmed;
}

export function listCloudModelUrls(): Record<string, CloudAssetUrlRecord> {
  return readLocalJson<Record<string, CloudAssetUrlRecord>>(CLOUD_MODEL_URLS_KEY, {});
}

export function saveCloudModelUrl(siteId: string, record: CloudAssetUrlRecord | null): void {
  const map = { ...listCloudModelUrls() };
  if (record && record.url.trim()) {
    map[siteId] = { ...record, url: normalizeDirectCdnUrl(record.url) };
  } else {
    delete map[siteId];
  }
  writeLocalJson(CLOUD_MODEL_URLS_KEY, map);
  markLocalAssetsMutated();
}

export function listCloudAudioUrls(): Record<string, CloudAssetUrlRecord> {
  return readLocalJson<Record<string, CloudAssetUrlRecord>>(CLOUD_AUDIO_URLS_KEY, {});
}

export function saveCloudAudioUrl(siteId: string, record: CloudAssetUrlRecord | null): void {
  const map = { ...listCloudAudioUrls() };
  if (record && record.url.trim()) {
    map[siteId] = { ...record, url: normalizeDirectCdnUrl(record.url) };
  } else {
    delete map[siteId];
  }
  writeLocalJson(CLOUD_AUDIO_URLS_KEY, map);
  markLocalAssetsMutated();
}

export function saveDirectAssetUrl(
  assetType: 'models' | 'audio',
  siteId: string,
  rawUrl: string
): string {
  const normalized = normalizeDirectCdnUrl(rawUrl);
  const nowIso = new Date().toISOString();

  if (assetType === 'models') {
    const customGlb = { ...readLocalJson<Record<string, string>>(KEY_CUSTOM_GLB_URLS, {}) };
    if (normalized) {
      customGlb[siteId] = normalized;
      saveCloudModelUrl(siteId, {
        url: normalized,
        fileName: extractBasename(normalized),
        updatedAt: nowIso,
      });
    } else {
      delete customGlb[siteId];
      saveCloudModelUrl(siteId, null);
    }
    writeLocalJson(KEY_CUSTOM_GLB_URLS, customGlb);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dau-an-viet-glb-models-updated', { detail: { siteId } }));
    }
  } else {
    if (normalized) {
      saveCloudAudioUrl(siteId, {
        url: normalized,
        fileName: extractBasename(normalized),
        updatedAt: nowIso,
      });
    } else {
      saveCloudAudioUrl(siteId, null);
    }
  }

  return normalized;
}

// ============================================================================
// SAFE PAYLOAD CLEANER (BASE64 > 250KB BLOCKER REMOVED — CHUNKED SYNC ENABLED)
// ============================================================================

export function sanitizePayloadForCloud<T>(
  input: T
): { sanitized: T; strippedCount: number; strippedBytes: number } {
  const walk = (val: unknown): unknown => {
    if (val === null || val === undefined) return val;
    if (Array.isArray(val)) return val.map((item) => walk(item));
    if (typeof val === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (v !== undefined) {
          out[k] = walk(v);
        }
      }
      return out;
    }
    return val;
  };

  return {
    sanitized: walk(input) as T,
    strippedCount: 0,
    strippedBytes: 0,
  };
}

function estimateJsonBytes(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return 0;
  }
}

function isNonRetryableFirebaseError(code: string): boolean {
  return (
    code.includes('permission-denied') ||
    code.includes('unauthenticated') ||
    code.includes('unauthorized') ||
    code.includes('invalid-argument') ||
    code.includes('failed-precondition')
  );
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const { code } = extractFirebaseErrorDetails(err);
      if (attempt >= maxAttempts || isNonRetryableFirebaseError(code)) {
        throw err;
      }
      const delayMs = 350 * Math.pow(2, attempt - 1);
      await new Promise((r) => window.setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

// ============================================================================
// CANONICAL ASSET KEYS & FLEXIBLE CLOUD MANIFEST LOOKUP (PRESERVES ALL 3D DATA)
// ============================================================================

function stripDiacriticsLower(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CANONICAL_SITE_LOOKUP = new Map<string, string>();
for (const entry of BAKED_ASSETS_LIST) {
  CANONICAL_SITE_LOOKUP.set(entry.siteId.toLowerCase(), entry.siteId);
  CANONICAL_SITE_LOOKUP.set(entry.code.toLowerCase(), entry.siteId);
  CANONICAL_SITE_LOOKUP.set(String(Number(entry.code)), entry.siteId);
  CANONICAL_SITE_LOOKUP.set(entry.slug.toLowerCase(), entry.siteId);
  CANONICAL_SITE_LOOKUP.set(stripDiacriticsLower(entry.officialName), entry.siteId);
}

/**
 * Shared canonical key helper so Admin upload, Cloud storage, and Guest lookup
 * always resolve to the exact same identifier while still supporting slot suffixes
 * like `HCM-DT-001_0` for images/videos.
 */
export function getCanonicalAssetKey(rawKey: string): string {
  const trimmed = String(rawKey || '').trim();
  if (!trimmed) return '';
  // Preserve slot suffix e.g. `HCM-DT-001_0` or `HCM-DT-001_1`
  const slotMatch = trimmed.match(/^(.+)_(\d+)$/);
  if (slotMatch) {
    const baseCanonical = CANONICAL_SITE_LOOKUP.get(slotMatch[1].toLowerCase()) || slotMatch[1];
    return `${baseCanonical}_${slotMatch[2]}`;
  }
  const direct = CANONICAL_SITE_LOOKUP.get(trimmed.toLowerCase());
  if (direct) return direct;
  const byName = CANONICAL_SITE_LOOKUP.get(stripDiacriticsLower(trimmed));
  if (byName) return byName;
  return trimmed;
}

// ============================================================================
// CHUNKED BASE64 ENGINE (350KB SLICES, UP TO 25MB/FILE, ZERO STORAGE PLAN NEEDED)
// ============================================================================

function computeFastChecksum(text: string): string {
  let hash = 0x811c9dc5;
  const step = text.length > 200_000 ? Math.floor(text.length / 50_000) : 1;
  for (let i = 0; i < text.length; i += step) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv32-${(hash >>> 0).toString(16).padStart(8, '0')}-${text.length}`;
}

function blobToPureBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc dữ liệu tệp sang Base64.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

function stripDataUrlPrefix(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^data:[^;]+;base64,(.*)$/is);
  return match ? match[1] : trimmed;
}

/**
 * Safely convert Firebase RTDB chunk node into an ordered string array whether
 * Firebase returned a dense JSON Array (`[chunk0, chunk1, ...]`) or an indexed
 * Object (`{ "0": chunk0, "1": chunk1, ... }`).
 */
function extractRawChunksList(raw: unknown): string[] {
  if (!raw) return [];
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : typeof raw === 'object'
    ? Object.keys(raw as Record<string, unknown>)
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => (raw as Record<string, unknown>)[k])
    : [];

  const result: string[] = [];
  for (const item of list) {
    if (typeof item === 'string' && item.trim().length > 0) {
      result.push(item);
    } else if (item && typeof item === 'object' && typeof (item as { data?: unknown }).data === 'string') {
      const s = ((item as { data: string }).data || '').trim();
      if (s.length > 0) result.push(s);
    }
  }
  return result;
}

function pureBase64ToBlob(base64: string, mimeType: string, forceGlbMime = false): Blob {
  // Strip any accidental data:...;base64, header and whitespace before decoding
  const stripped = stripDataUrlPrefix(base64);
  const clean = stripped.replace(/\s+/g, '');
  // Decode in safe 512KB Base64 blocks (multiple of 4) to avoid huge single-string memory spikes
  const BLOCK_LEN = 512 * 1024;
  const parts: BlobPart[] = [];

  for (let offset = 0; offset < clean.length; offset += BLOCK_LEN) {
    const slice = clean.slice(offset, offset + BLOCK_LEN);
    const binaryStr = window.atob(slice);
    const buffer = new ArrayBuffer(binaryStr.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    parts.push(buffer);
  }

  const finalMime = forceGlbMime
    ? 'model/gltf-binary'
    : mimeType && mimeType.trim()
    ? mimeType.trim()
    : 'application/octet-stream';

  return new Blob(parts, { type: finalMime });
}

function inferMimeTypeForAsset(
  assetType: ChunkAssetType,
  fileName: string,
  rawType?: string
): string {
  const lower = fileName.toLowerCase();
  if (assetType === 'models') {
    return lower.endsWith('.gltf') ? 'model/gltf+json' : 'model/gltf-binary';
  }
  if (rawType && rawType.trim() && rawType !== 'application/octet-stream') return rawType.trim();
  if (assetType === 'audio') {
    if (lower.endsWith('.m4a')) return 'audio/mp4';
    if (lower.endsWith('.mp3')) return 'audio/mpeg';
    if (lower.endsWith('.wav')) return 'audio/wav';
    if (lower.endsWith('.ogg')) return 'audio/ogg';
    return 'audio/mp4';
  }
  if (assetType === 'images') {
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.avif')) return 'image/avif';
    return 'image/jpeg';
  }
  if (lower.endsWith('.webm')) return 'video/webm';
  return 'video/mp4';
}

function getDefaultExtForAsset(assetType: ChunkAssetType): string {
  if (assetType === 'models') return 'glb';
  if (assetType === 'audio') return 'm4a';
  if (assetType === 'images') return 'jpg';
  return 'mp4';
}

function getFirestoreMetaDocId(assetType: ChunkAssetType, siteId: string): string {
  return `${assetType}__${siteId}`;
}

function getFirestoreChunkDocId(
  assetType: ChunkAssetType,
  siteId: string,
  chunkIndex: number
): string {
  return `${assetType}__${siteId}__${chunkIndex}`;
}

// ============================================================================
// IN-RAM PUBLIC CLOUD MANIFEST PRELOADER (RUNS FOR ALL GUESTS & REMIX COPIES)
// ============================================================================

export interface RamCloudManifest {
  models: Record<string, ChunkedAssetMeta>;
  audio: Record<string, ChunkedAssetMeta>;
  images: Record<string, ChunkedAssetMeta>;
  videos: Record<string, ChunkedAssetMeta>;
  loadedAt: number;
  lastError: { code: string; message: string } | null;
}

const ramCloudManifest: RamCloudManifest = {
  models: {},
  audio: {},
  images: {},
  videos: {},
  loadedAt: 0,
  lastError: null,
};

let inFlightManifestPromise: Promise<RamCloudManifest> | null = null;

// Session cache of single-site cloud metadata checks
const cloudMetaCache = new Map<string, { meta: ChunkedAssetMeta | null; fetchedAt: number }>();
const CLOUD_META_CACHE_TTL_MS = 15_000;

export function invalidateCloudMetaCache(assetType?: ChunkAssetType, siteId?: string): void {
  if (assetType && siteId) {
    cloudMetaCache.delete(`${assetType}:${siteId}`);
    cloudMetaCache.delete(`${assetType}:${getCanonicalAssetKey(siteId)}`);
  } else {
    cloudMetaCache.clear();
    ramCloudManifest.loadedAt = 0;
  }
}

export function getRamCloudManifestSnapshot(): RamCloudManifest {
  return ramCloudManifest;
}

function registerMetaInManifest(meta: ChunkedAssetMeta): void {
  const bucket = ramCloudManifest[meta.assetType];
  const canonical = getCanonicalAssetKey(meta.siteId);
  const existing = bucket[canonical];
  // Prefer newer updatedAt when merging RTDB + Firestore
  if (!existing || Date.parse(meta.updatedAt || '') >= Date.parse(existing.updatedAt || '')) {
    bucket[canonical] = meta;
    if (meta.remoteKey && meta.remoteKey !== canonical) {
      bucket[meta.remoteKey] = meta;
    }
  }
  cloudMetaCache.set(`${meta.assetType}:${canonical}`, { meta, fetchedAt: Date.now() });
  if (meta.remoteKey) {
    cloudMetaCache.set(`${meta.assetType}:${meta.remoteKey}`, { meta, fetchedAt: Date.now() });
  }
}

/**
 * Publicly preload the entire `/cloudAssetsMeta` & `cloud_assets_meta` catalog into RAM
 * on startup (works for unauthenticated guests, Incognito, and Remix copies).
 */
export async function preloadCloudAssetsManifest(forceRefresh = false): Promise<RamCloudManifest> {
  if (!forceRefresh && ramCloudManifest.loadedAt > 0 && Date.now() - ramCloudManifest.loadedAt < 25_000) {
    return ramCloudManifest;
  }
  if (inFlightManifestPromise && !forceRefresh) return inFlightManifestPromise;

  const task = (async () => {
    const nextModels: Record<string, ChunkedAssetMeta> = {};
    const nextAudio: Record<string, ChunkedAssetMeta> = {};
    const nextImages: Record<string, ChunkedAssetMeta> = {};
    const nextVideos: Record<string, ChunkedAssetMeta> = {};
    let lastError: { code: string; message: string } | null = null;
    let anySucceeded = false;

    const assignInto = (meta: ChunkedAssetMeta) => {
      const target =
        meta.assetType === 'models'
          ? nextModels
          : meta.assetType === 'audio'
          ? nextAudio
          : meta.assetType === 'images'
          ? nextImages
          : nextVideos;
      const canonical = getCanonicalAssetKey(meta.siteId);
      const prev = target[canonical];
      if (!prev || Date.parse(meta.updatedAt || '') >= Date.parse(prev.updatedAt || '')) {
        target[canonical] = meta;
      }
      if (meta.remoteKey && meta.remoteKey !== canonical) {
        target[meta.remoteKey] = meta;
      }
      cloudMetaCache.set(`${meta.assetType}:${canonical}`, { meta, fetchedAt: Date.now() });
      if (meta.remoteKey) {
        cloudMetaCache.set(`${meta.assetType}:${meta.remoteKey}`, { meta, fetchedAt: Date.now() });
      }
    };

    // 1. Read Firestore `cloud_assets_meta` publicly (always configured via firebase-applet-config.json)
    const db = getHeritageFirestore();
    if (db) {
      try {
        const snap = await getDocs(collection(db, 'cloud_assets_meta'));
        anySucceeded = true;
        snap.forEach((docSnap) => {
          const raw = docSnap.data() as Partial<ChunkedAssetMeta>;
          const totalChunks = typeof raw.totalChunks === 'number' ? raw.totalChunks : 0;
          if (totalChunks <= 0) return;

          // Support both explicit assetType field and docId prefix (`models__HCM-DT-004`)
          const parts = docSnap.id.split('__');
          const inferredType =
            raw.assetType === 'models' ||
            raw.assetType === 'audio' ||
            raw.assetType === 'images' ||
            raw.assetType === 'videos'
              ? raw.assetType
              : parts[0] === 'audio' || parts[0] === 'images' || parts[0] === 'videos'
              ? (parts[0] as ChunkAssetType)
              : 'models';
          const remoteKey = String(raw.siteId || parts[1] || docSnap.id).trim();
          if (!remoteKey) return;

          const meta: ChunkedAssetMeta = {
            assetType: inferredType,
            siteId: getCanonicalAssetKey(remoteKey),
            remoteKey,
            transportSource: 'firestore',
            fileName: raw.fileName || `${remoteKey}.${getDefaultExtForAsset(inferredType)}`,
            mimeType: raw.mimeType || inferMimeTypeForAsset(inferredType, raw.fileName || ''),
            totalChunks,
            totalSize: typeof raw.totalSize === 'number' ? raw.totalSize : 0,
            updatedAt: raw.updatedAt || new Date().toISOString(),
            checksum: raw.checksum || '',
          };
          assignInto(meta);
        });
      } catch (err) {
        const details = extractFirebaseErrorDetails(err);
        lastError = details;
        console.error('[DauAnViet3D][CloudManifest] Firestore cloud_assets_meta read failed:', details);
      }
    }

    // 2. Also read RTDB `/cloudAssetsMeta` publicly if an RTDB URL is configured
    const rtdbUrl = resolveConfiguredRtdbUrl();
    if (rtdbUrl) {
      try {
        const root = await rtdbRequest<Record<string, Record<string, Partial<ChunkedAssetMeta>>> | null>(
          rtdbUrl,
          'cloudAssetsMeta',
          'GET'
        );
        anySucceeded = true;
        const types: ChunkAssetType[] = ['models', 'audio', 'images', 'videos'];
        for (const assetType of types) {
          const branch = root?.[assetType];
          if (!branch || typeof branch !== 'object') continue;
          for (const [remoteKey, raw] of Object.entries(branch)) {
            if (!raw || typeof raw.totalChunks !== 'number' || raw.totalChunks <= 0) continue;
            const meta: ChunkedAssetMeta = {
              assetType,
              siteId: getCanonicalAssetKey(raw.siteId || remoteKey),
              remoteKey,
              transportSource: 'rtdb',
              fileName: raw.fileName || `${remoteKey}.${getDefaultExtForAsset(assetType)}`,
              mimeType: raw.mimeType || inferMimeTypeForAsset(assetType, raw.fileName || ''),
              totalChunks: raw.totalChunks,
              totalSize: typeof raw.totalSize === 'number' ? raw.totalSize : 0,
              updatedAt: raw.updatedAt || new Date().toISOString(),
              checksum: raw.checksum || '',
            };
            assignInto(meta);
          }
        }
      } catch (err) {
        const details = extractFirebaseErrorDetails(err);
        if (!anySucceeded) lastError = details;
        console.error('[DauAnViet3D][CloudManifest] RTDB /cloudAssetsMeta read failed:', details);
      }
    }

    if (anySucceeded) {
      ramCloudManifest.models = nextModels;
      ramCloudManifest.audio = nextAudio;
      ramCloudManifest.images = nextImages;
      ramCloudManifest.videos = nextVideos;
      ramCloudManifest.loadedAt = Date.now();
      ramCloudManifest.lastError = null;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent(CLOUD_ASSETS_MANIFEST_READY_EVENT, {
            detail: {
              modelsCount: Object.keys(nextModels).length,
              audioCount: Object.keys(nextAudio).length,
              imagesCount: Object.keys(nextImages).length,
              videosCount: Object.keys(nextVideos).length,
            },
          })
        );
      }
    } else if (lastError) {
      ramCloudManifest.lastError = lastError;
    }

    return ramCloudManifest;
  })();

  inFlightManifestPromise = task;
  try {
    return await task;
  } finally {
    inFlightManifestPromise = null;
  }
}

/**
 * Smart flexible lookup for a monument's Cloud asset metadata:
 *   1. Exact & canonical `siteId` (e.g. `HCM-DT-004`)
 *   2. Site `code` (`04`) & `slug` (`04-cho-ben-thanh`)
 *   3. Diacritic-stripped match against `fileName` or monument official name
 * Ensures previously pushed models (e.g. 4 uploaded 3D models) are ALWAYS found.
 */
export function findCloudMetaInRam(
  assetType: ChunkAssetType,
  siteId: string
): ChunkedAssetMeta | null {
  const bucket = ramCloudManifest[assetType];
  if (!bucket) return null;

  const canonical = getCanonicalAssetKey(siteId);
  if (bucket[siteId]) return bucket[siteId];
  if (canonical && bucket[canonical]) return bucket[canonical];

  const baked = BAKED_ASSETS[canonical];
  if (baked) {
    if (bucket[baked.code]) return bucket[baked.code];
    if (bucket[baked.slug]) return bucket[baked.slug];
    if (bucket[String(Number(baked.code))]) return bucket[String(Number(baked.code))];

    const normOfficial = stripDiacriticsLower(baked.officialName);
    const slugTokens = stripDiacriticsLower(baked.slug.replace(/^\d+-/, ''));
    for (const meta of Object.values(bucket)) {
      const normKey = stripDiacriticsLower(meta.remoteKey || meta.siteId);
      const normFile = stripDiacriticsLower(meta.fileName.replace(/\.[^.]+$/, ''));
      if (
        (normOfficial && (normKey.includes(normOfficial) || normFile.includes(normOfficial))) ||
        (slugTokens.length >= 5 && (normKey.includes(slugTokens) || normFile.includes(slugTokens)))
      ) {
        return meta;
      }
    }
  }

  return null;
}

export async function fetchCloudAssetMeta(
  assetType: ChunkAssetType,
  siteId: string,
  bypassCache = false
): Promise<ChunkedAssetMeta | null> {
  const canonical = getCanonicalAssetKey(siteId);
  const cacheKey = `${assetType}:${canonical}`;

  // Ensure the RAM manifest is preloaded at least once (public read, zero auth required)
  if (ramCloudManifest.loadedAt === 0 || bypassCache) {
    await preloadCloudAssetsManifest(bypassCache);
  }

  const fromRam = findCloudMetaInRam(assetType, siteId);
  if (fromRam) return fromRam;

  if (!bypassCache) {
    const cached = cloudMetaCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CLOUD_META_CACHE_TTL_MS) {
      return cached.meta;
    }
  }

  // Fallback direct single-document probe in case a newly uploaded item was not in the last scan
  const transport = getActiveChunkTransport();
  try {
    if (transport.mode === 'rtdb') {
      const raw = await rtdbRequest<Partial<ChunkedAssetMeta> | null>(
        transport.endpoint,
        `cloudAssetsMeta/${assetType}/${canonical}`,
        'GET'
      );
      if (raw && typeof raw.totalChunks === 'number' && raw.totalChunks > 0) {
        const meta: ChunkedAssetMeta = {
          assetType,
          siteId: canonical,
          remoteKey: canonical,
          transportSource: 'rtdb',
          fileName: raw.fileName || `${canonical}.${getDefaultExtForAsset(assetType)}`,
          mimeType: raw.mimeType || inferMimeTypeForAsset(assetType, raw.fileName || ''),
          totalChunks: raw.totalChunks,
          totalSize: raw.totalSize || 0,
          updatedAt: raw.updatedAt || new Date().toISOString(),
          checksum: raw.checksum || '',
        };
        registerMetaInManifest(meta);
        return meta;
      }
      cloudMetaCache.set(cacheKey, { meta: null, fetchedAt: Date.now() });
      return null;
    }

    const db = getHeritageFirestore();
    if (!db) return null;
    const snap = await getDoc(doc(db, 'cloud_assets_meta', getFirestoreMetaDocId(assetType, canonical)));
    if (!snap.exists()) {
      cloudMetaCache.set(cacheKey, { meta: null, fetchedAt: Date.now() });
      return null;
    }
    const raw = snap.data() as Partial<ChunkedAssetMeta>;
    if (typeof raw.totalChunks !== 'number' || raw.totalChunks <= 0) {
      cloudMetaCache.set(cacheKey, { meta: null, fetchedAt: Date.now() });
      return null;
    }
    const meta: ChunkedAssetMeta = {
      assetType,
      siteId: canonical,
      remoteKey: raw.siteId || canonical,
      transportSource: 'firestore',
      fileName: raw.fileName || `${canonical}.${getDefaultExtForAsset(assetType)}`,
      mimeType: raw.mimeType || inferMimeTypeForAsset(assetType, raw.fileName || ''),
      totalChunks: raw.totalChunks,
      totalSize: raw.totalSize || 0,
      updatedAt: raw.updatedAt || new Date().toISOString(),
      checksum: raw.checksum || '',
    };
    registerMetaInManifest(meta);
    return meta;
  } catch (err) {
    const details = extractFirebaseErrorDetails(err);
    console.error(`[DauAnViet3D][CloudMeta] Failed reading ${assetType}/${canonical}:`, details);
    setCloudAssetError(canonical, assetType, details);
    return null;
  }
}

export async function listAllCloudAssetMetas(forceRefresh = false): Promise<{
  models: Record<string, ChunkedAssetMeta>;
  audio: Record<string, ChunkedAssetMeta>;
  images: Record<string, ChunkedAssetMeta>;
  videos: Record<string, ChunkedAssetMeta>;
}> {
  const manifest = await preloadCloudAssetsManifest(forceRefresh);
  // Deduplicate by canonical siteId so counts are accurate
  const dedupe = (map: Record<string, ChunkedAssetMeta>) => {
    const out: Record<string, ChunkedAssetMeta> = {};
    for (const meta of Object.values(map)) {
      const canonical = getCanonicalAssetKey(meta.siteId);
      if (!out[canonical]) out[canonical] = meta;
    }
    return out;
  };
  return {
    models: dedupe(manifest.models),
    audio: dedupe(manifest.audio),
    images: dedupe(manifest.images),
    videos: dedupe(manifest.videos),
  };
}

/**
 * Push a `.glb`/`.gltf`, `.m4a`/`.mp3`, image, or `.mp4`/`.webm` Blob up to 25MB directly
 * to Firebase in fixed 350KB Base64 chunks (`CHUNK_SIZE = 350 * 1024`) with 3x per-chunk retry.
 * Supports Delta Sync (`skipIfMatched: true`) so unchanged files are skipped cleanly.
 */
export async function uploadBlobInChunksToRTDB(
  assetType: ChunkAssetType,
  siteId: string,
  blob: Blob,
  fileName: string,
  options?: {
    siteName?: string;
    skipIfMatched?: boolean;
    onProgress?: (progress: ChunkTransferProgress) => void;
  }
): Promise<{
  ok: boolean;
  skipped?: boolean;
  meta?: ChunkedAssetMeta;
  transport: 'rtdb' | 'firestore';
  errorCode?: string;
  errorMessage?: string;
}> {
  const canonicalKey = getCanonicalAssetKey(siteId);
  const transport = getActiveChunkTransport();
  const safeFileName = (
    fileName.trim() || `${canonicalKey}.${getDefaultExtForAsset(assetType)}`
  ).replace(/[^a-zA-Z0-9._-]+/g, '-');
  const baseSiteId = canonicalKey.replace(/_\d+$/, '');
  const displaySite = options?.siteName || BAKED_ASSETS[baseSiteId]?.officialName || canonicalKey;
  const kindLabel =
    assetType === 'models'
      ? '3D'
      : assetType === 'audio'
      ? 'Ghi âm'
      : assetType === 'images'
      ? 'Hình ảnh'
      : 'Video';

  if (blob.size > MAX_CHUNKED_FILE_BYTES) {
    const advice =
      assetType === 'videos'
        ? 'Hãy dán đường dẫn YouTube / Vimeo / CDN trực tiếp trong mục Video di sản.'
        : 'Hãy dùng ô dán URL trực tiếp (GitHub / jsDelivr CDN).';
    const errMsg = `Tệp "${safeFileName}" (${(blob.size / (1024 * 1024)).toFixed(
      1
    )} MB) vượt giới hạn chia mảnh 25MB. ${advice}`;
    appendSyncLog({
      branch: `/cloudAssetsChunks/${assetType}/${canonicalKey}`,
      action: 'chunk_push',
      status: 'warn',
      message: errMsg,
      errorCode: 'chunk/file-too-large',
      errorMessage: errMsg,
      bytes: blob.size,
    });
    return {
      ok: false,
      transport: transport.mode,
      errorCode: 'chunk/file-too-large',
      errorMessage: errMsg,
    };
  }

  const startedAt = performance.now();
  const mimeType = inferMimeTypeForAsset(assetType, safeFileName, blob.type);

  options?.onProgress?.({
    siteId: canonicalKey,
    siteName: displaySite,
    assetType,
    phase: 'encoding',
    active: true,
    currentChunk: 0,
    totalChunks: 1,
    percent: 2,
    label: `Đang mã hóa ${kindLabel} ${displaySite}...`,
  });

  let base64Str: string;
  try {
    base64Str = await blobToPureBase64(blob);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi đọc tệp Base64.';
    return { ok: false, transport: transport.mode, errorCode: 'chunk/encode-error', errorMessage: msg };
  }

  const totalChunks = Math.max(1, Math.ceil(base64Str.length / CHUNK_SIZE));
  const checksum = computeFastChecksum(base64Str);

  // Delta Sync check: compare checksum + totalSize against Cloud manifest before re-uploading
  if (options?.skipIfMatched) {
    const existingMeta = await fetchCloudAssetMeta(assetType, canonicalKey, false);
    if (
      existingMeta &&
      existingMeta.totalChunks > 0 &&
      existingMeta.totalSize === blob.size &&
      existingMeta.checksum &&
      existingMeta.checksum === checksum
    ) {
      options?.onProgress?.({
        siteId: canonicalKey,
        siteName: displaySite,
        assetType,
        phase: 'done',
        active: false,
        currentChunk: existingMeta.totalChunks,
        totalChunks: existingMeta.totalChunks,
        percent: 100,
        label: `${displaySite}: Đã khớp Cloud (bỏ qua).`,
      });
      return {
        ok: true,
        skipped: true,
        meta: existingMeta,
        transport: existingMeta.transportSource || transport.mode,
      };
    }
  }

  const updatedAt = new Date().toISOString();
  const meta: ChunkedAssetMeta = {
    assetType,
    siteId: canonicalKey,
    remoteKey: canonicalKey,
    transportSource: transport.mode,
    fileName: safeFileName,
    mimeType,
    totalChunks,
    totalSize: blob.size,
    updatedAt,
    checksum,
  };

  try {
    const db = transport.mode === 'firestore' ? getHeritageFirestore() : null;
    if (transport.mode === 'firestore' && !db) {
      throw Object.assign(new Error('Firestore SDK chưa sẵn sàng.'), {
        code: 'firestore/not-initialized',
      });
    }

    // Push chunks sequentially (3x retry per chunk)
    for (let i = 0; i < totalChunks; i++) {
      const slice = base64Str.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const percent = Math.min(98, Math.round(((i + 1) / totalChunks) * 100));

      options?.onProgress?.({
        siteId: canonicalKey,
        siteName: displaySite,
        assetType,
        phase: 'uploading',
        active: true,
        currentChunk: i + 1,
        totalChunks,
        percent,
        label: `Đang đẩy ${kindLabel} ${displaySite}: mảnh ${i + 1}/${totalChunks} (${percent}%)...`,
      });

      await retryWithBackoff(async () => {
        if (transport.mode === 'rtdb') {
          await rtdbRequest(
            transport.endpoint,
            `cloudAssetsChunks/${assetType}/${canonicalKey}/${i}`,
            'PUT',
            slice
          );
        } else if (db) {
          await setDoc(
            doc(db, 'cloud_assets_chunks', getFirestoreChunkDocId(assetType, canonicalKey, i)),
            {
              assetType,
              siteId: canonicalKey,
              chunkIndex: i,
              totalChunks,
              data: slice,
              updatedAt,
            }
          );
        }
      }, 3);
    }

    // Commit manifest metadata ONLY after every chunk succeeded
    const firestoreMetaPayload = {
      assetType: meta.assetType,
      siteId: meta.siteId,
      fileName: meta.fileName,
      mimeType: meta.mimeType,
      totalChunks: meta.totalChunks,
      totalSize: meta.totalSize,
      updatedAt: meta.updatedAt,
      checksum: meta.checksum,
    };

    await retryWithBackoff(async () => {
      if (transport.mode === 'rtdb') {
        await rtdbRequest(
          transport.endpoint,
          `cloudAssetsMeta/${assetType}/${canonicalKey}`,
          'PUT',
          firestoreMetaPayload
        );
      } else if (db) {
        await setDoc(
          doc(db, 'cloud_assets_meta', getFirestoreMetaDocId(assetType, canonicalKey)),
          firestoreMetaPayload
        );
      }
    }, 3);

    // Update lightweight site_models / site_audio pointer in Firestore when available
    if (db && (assetType === 'models' || assetType === 'audio')) {
      const colName = assetType === 'models' ? 'site_models' : 'site_audio';
      await setDoc(
        doc(db, colName, canonicalKey),
        {
          siteId: canonicalKey,
          ...(assetType === 'models'
            ? { modelUrl: `cloud-chunk://models/${canonicalKey}` }
            : { audioUrl: `cloud-chunk://audio/${canonicalKey}` }),
          fileName: safeFileName,
          fileSize: blob.size,
          updatedAt,
        },
        { merge: true }
      ).catch(() => undefined);
    }

    registerMetaInManifest(meta);
    clearCloudAssetError(canonicalKey, assetType);

    updateSyncState({
      health: 'synced',
      lastSyncedAt: updatedAt,
      cloudUpdatedAt: updatedAt,
      lastErrorCode: null,
      lastErrorMessage: null,
    });

    options?.onProgress?.({
      siteId: canonicalKey,
      siteName: displaySite,
      assetType,
      phase: 'done',
      active: false,
      currentChunk: totalChunks,
      totalChunks,
      percent: 100,
      label: `Đã đẩy ${kindLabel} ${displaySite} (${totalChunks} mảnh).`,
    });

    appendSyncLog({
      branch: `/cloudAssetsMeta/${assetType}/${canonicalKey}`,
      action: 'chunk_push',
      status: 'ok',
      message: `Đã đẩy ${kindLabel} ${displaySite} ("${safeFileName}") thành công qua ${totalChunks} mảnh (350KB/mảnh).`,
      bytes: blob.size,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return { ok: true, skipped: false, meta, transport: transport.mode };
  } catch (err) {
    const { code, message } = extractFirebaseErrorDetails(err);
    console.error(`[DauAnViet3D][ChunkPush] Failed pushing ${assetType}/${canonicalKey}:`, err);
    const isPerm =
      code.includes('permission-denied') ||
      code.includes('unauthenticated') ||
      code.includes('unauthorized');

    updateSyncState({
      health: isPerm ? 'rules_attention' : 'local_indexeddb_only',
      lastErrorCode: code,
      lastErrorMessage: message,
    });

    options?.onProgress?.({
      siteId: canonicalKey,
      siteName: displaySite,
      assetType,
      phase: 'error',
      active: false,
      currentChunk: 0,
      totalChunks,
      percent: 0,
      label: `Lỗi đẩy ${kindLabel} ${displaySite} (${code})`,
    });

    appendSyncLog({
      branch: `/cloudAssetsChunks/${assetType}/${canonicalKey}`,
      action: 'chunk_push',
      status: 'error',
      message: `Đẩy chia mảnh ${kindLabel} ${displaySite} thất bại (tệp vẫn an toàn trong IndexedDB cục bộ).`,
      errorCode: code,
      errorMessage: message,
      bytes: blob.size,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return {
      ok: false,
      transport: transport.mode,
      errorCode: code,
      errorMessage: message,
    };
  }
}

// Deduplicate concurrent Cloud chunk downloads per `${assetType}:${canonicalKey}`
const inFlightDownloads = new Map<
  string,
  Promise<{
    ok: boolean;
    entry?: VaultResolvedEntry;
    fromCache?: boolean;
    meta?: ChunkedAssetMeta;
    errorCode?: string;
    errorMessage?: string;
  }>
>();

async function readLocalVaultEntryForType(
  assetType: ChunkAssetType,
  key: string
): Promise<VaultResolvedEntry | null> {
  if (assetType === 'models') return getModelFromVault(key);
  if (assetType === 'audio') return getAudioFromVault(key);
  if (assetType === 'images') return getImageFromVault(key);
  return getVideoFromVault(key);
}

async function persistReassembledBlobToVault(
  assetType: ChunkAssetType,
  canonicalKey: string,
  blob: Blob,
  fileName: string,
  mimeType: string
): Promise<VaultResolvedEntry | null> {
  if (assetType === 'models') {
    return saveModelBlobToVault(canonicalKey, blob, fileName, 'imported');
  }
  if (assetType === 'audio') {
    return saveAudioBlobToVault(canonicalKey, blob, fileName, undefined, 'imported');
  }
  if (assetType === 'images') {
    return saveImageBlobToVault(canonicalKey, blob, fileName, 'imported');
  }
  // Videos: save to primary AssetVault AND mirror into heritage_cinema_videos_idb_v1 so CinemaModal plays immediately
  const saved = await saveVideoBlobToVault(canonicalKey, blob, fileName, 'imported');
  try {
    const baseSiteId = canonicalKey.replace(/_\d+$/, '');
    const videoKey = SITE_ID_TO_VIDEO_KEY[baseSiteId];
    if (videoKey) {
      const videoFile = new File([blob], fileName, { type: mimeType || 'video/mp4' });
      await saveLocalVideoToIndexedDB(videoKey, videoFile);
    }
  } catch (mirrorErr) {
    console.error('[DauAnViet3D][VideoMirror] Failed mirroring downloaded video to Cinema IDB:', mirrorErr);
  }
  return saved;
}

/**
 * Automatically check `/cloudAssetsMeta/{assetType}/{siteId}`, download all 350KB chunks
 * if Cloud has a newer version (or local IndexedDB is empty on a Guest / Remix session),
 * safely convert Array or Object chunks, strip any data URL prefix, reassemble the Blob,
 * verify checksum, and cache immediately in IndexedDB!
 */
export async function downloadBlobFromRTDB(
  assetType: ChunkAssetType,
  siteId: string,
  options?: {
    siteName?: string;
    forceRefresh?: boolean;
    onProgress?: (progress: ChunkTransferProgress) => void;
  }
): Promise<{
  ok: boolean;
  entry?: VaultResolvedEntry;
  fromCache?: boolean;
  meta?: ChunkedAssetMeta;
  errorCode?: string;
  errorMessage?: string;
}> {
  const canonicalKey = getCanonicalAssetKey(siteId);
  const flightKey = `${assetType}:${canonicalKey}`;
  const existingFlight = inFlightDownloads.get(flightKey);
  if (existingFlight) return existingFlight;

  const task = (async () => {
    const startedAt = performance.now();
    const baseSiteId = canonicalKey.replace(/_\d+$/, '');
    const displaySite = options?.siteName || BAKED_ASSETS[baseSiteId]?.officialName || canonicalKey;
    const kindLabel =
      assetType === 'models'
        ? 'mô hình 3D'
        : assetType === 'audio'
        ? 'thuyết minh'
        : assetType === 'images'
        ? 'hình ảnh'
        : 'video tư liệu';

    try {
      clearCloudAssetError(canonicalKey, assetType);
      const cloudMeta = await fetchCloudAssetMeta(assetType, canonicalKey, Boolean(options?.forceRefresh));
      if (!cloudMeta) {
        return {
          ok: false,
          errorCode: 'cloud/not-found',
          errorMessage: 'Chưa có bản ghi chia mảnh trên Cloud.',
        };
      }

      // Compare with local IndexedDB — return instantly in <0.1s if already up to date
      const localEntry = await readLocalVaultEntryForType(assetType, canonicalKey);
      if (localEntry && !options?.forceRefresh) {
        const localMs = Date.parse(localEntry.updatedAt || '');
        const cloudMs = Date.parse(cloudMeta.updatedAt || '');
        if (
          Number.isFinite(localMs) &&
          Number.isFinite(cloudMs) &&
          localMs >= cloudMs &&
          localEntry.fileSize === cloudMeta.totalSize
        ) {
          return { ok: true, entry: localEntry, fromCache: true, meta: cloudMeta };
        }
      }

      const targetTransport = cloudMeta.transportSource || getActiveChunkTransport().mode;
      const rtdbUrl = resolveConfiguredRtdbUrl();
      const db = targetTransport === 'firestore' ? getHeritageFirestore() : null;
      if (targetTransport === 'firestore' && !db) {
        const err = { code: 'firestore/not-initialized', message: 'Firestore SDK chưa sẵn sàng.' };
        setCloudAssetError(canonicalKey, assetType, err);
        return { ok: false, errorCode: err.code, errorMessage: err.message };
      }

      const remoteKey = cloudMeta.remoteKey || cloudMeta.siteId || canonicalKey;
      const totalChunks = cloudMeta.totalChunks;
      let chunks: string[] = [];

      const emitProgress = (progress: ChunkTransferProgress) => {
        setActiveDownloadProgress(progress, flightKey);
        options?.onProgress?.(progress);
      };

      emitProgress({
        siteId: canonicalKey,
        siteName: displaySite,
        assetType,
        phase: 'downloading',
        active: true,
        currentChunk: 0,
        totalChunks,
        percent: 4,
        label: `Đang tải ${kindLabel} ${displaySite} từ Kho Lưu trữ Cloud...`,
      });

      if (targetTransport === 'rtdb' && rtdbUrl) {
        // Fetch per chunk sequentially for accurate live progress, with automatic whole-node Array/Object fallback
        const collected: string[] = [];
        let perChunkFailed = false;
        for (let i = 0; i < totalChunks; i++) {
          try {
            const chunkData = await retryWithBackoff<string>(async () => {
              const val = await rtdbRequest<string | { data?: string } | null>(
                rtdbUrl,
                `cloudAssetsChunks/${assetType}/${remoteKey}/${i}`,
                'GET'
              );
              if (typeof val === 'string' && val.trim().length > 0) return val;
              if (val && typeof val === 'object' && typeof val.data === 'string' && val.data.trim().length > 0) {
                return val.data;
              }
              throw Object.assign(new Error(`Thiếu mảnh dữ liệu #${i}.`), { code: 'chunk/missing' });
            }, 3);
            collected.push(chunkData);
            const percent = Math.min(96, Math.round(((i + 1) / totalChunks) * 94));
            emitProgress({
              siteId: canonicalKey,
              siteName: displaySite,
              assetType,
              phase: 'downloading',
              active: true,
              currentChunk: i + 1,
              totalChunks,
              percent,
              label: `Đang tải ${kindLabel} ${displaySite} từ Kho Lưu trữ Cloud (${percent}%)`,
            });
          } catch (chunkErr) {
            const { code } = extractFirebaseErrorDetails(chunkErr);
            if (isNonRetryableFirebaseError(code)) throw chunkErr;
            perChunkFailed = true;
            break;
          }
        }

        if (perChunkFailed || collected.length < totalChunks) {
          const rawContainer = await rtdbRequest<unknown>(
            rtdbUrl,
            `cloudAssetsChunks/${assetType}/${remoteKey}`,
            'GET'
          );
          chunks = extractRawChunksList(rawContainer);
          if (chunks.length === 0) {
            throw Object.assign(
              new Error(`Không tìm thấy mảnh dữ liệu tại /cloudAssetsChunks/${assetType}/${remoteKey}.`),
              { code: 'chunk/missing' }
            );
          }
        } else {
          chunks = collected;
        }
      } else if (db) {
        chunks = new Array(totalChunks);
        for (let i = 0; i < totalChunks; i++) {
          const chunkData = await retryWithBackoff<string>(async () => {
            const snap = await getDoc(
              doc(db, 'cloud_assets_chunks', getFirestoreChunkDocId(assetType, remoteKey, i))
            );
            if (!snap.exists()) {
              throw Object.assign(new Error(`Thiếu mảnh dữ liệu #${i}.`), { code: 'chunk/missing' });
            }
            const d = snap.data() as { data?: string };
            if (typeof d.data !== 'string' || d.data.trim().length === 0) {
              throw Object.assign(new Error(`Mảnh dữ liệu #${i} rỗng.`), { code: 'chunk/empty' });
            }
            return d.data;
          }, 3);

          chunks[i] = chunkData;
          const percent = Math.min(96, Math.round(((i + 1) / totalChunks) * 94));
          emitProgress({
            siteId: canonicalKey,
            siteName: displaySite,
            assetType,
            phase: 'downloading',
            active: true,
            currentChunk: i + 1,
            totalChunks,
            percent,
            label: `Đang tải ${kindLabel} ${displaySite} từ Kho Lưu trữ Cloud (${percent}%)`,
          });
        }
      } else {
        throw Object.assign(new Error('Chưa kết nối Cloud Database.'), { code: 'cloud/unavailable' });
      }

      emitProgress({
        siteId: canonicalKey,
        siteName: displaySite,
        assetType,
        phase: 'reassembling',
        active: true,
        currentChunk: totalChunks,
        totalChunks,
        percent: 98,
        label: `Đang ghép mảnh & lưu đệm IndexedDB: 98%`,
      });

      const fullBase64 = chunks.filter((c) => typeof c === 'string' && c.length > 0).join('');
      const cleanBase64 = stripDataUrlPrefix(fullBase64);

      if (cloudMeta.checksum) {
        const verifiedChecksum = computeFastChecksum(cleanBase64);
        if (verifiedChecksum !== cloudMeta.checksum && computeFastChecksum(fullBase64) !== cloudMeta.checksum) {
          throw Object.assign(new Error('Mã kiểm toàn vẹn checksum không khớp sau khi ghép mảnh.'), {
            code: 'chunk/checksum-mismatch',
          });
        }
      }

      const isGlb =
        assetType === 'models' && !cloudMeta.fileName.toLowerCase().endsWith('.gltf');
      const reassembledBlob = pureBase64ToBlob(cleanBase64, cloudMeta.mimeType, isGlb);
      const savedEntry = await persistReassembledBlobToVault(
        assetType,
        canonicalKey,
        reassembledBlob,
        cloudMeta.fileName,
        isGlb ? 'model/gltf-binary' : cloudMeta.mimeType
      );

      setActiveDownloadProgress(null, flightKey);
      clearCloudAssetError(canonicalKey, assetType);
      options?.onProgress?.({
        siteId: canonicalKey,
        siteName: displaySite,
        assetType,
        phase: 'done',
        active: false,
        currentChunk: totalChunks,
        totalChunks,
        percent: 100,
        label: `Đã tải & lưu đệm thành công (${totalChunks} mảnh).`,
      });

      appendSyncLog({
        branch: `/cloudAssetsChunks/${assetType}/${remoteKey}`,
        action: 'chunk_pull',
        status: 'ok',
        message: `Đã kéo & ghép ${totalChunks} mảnh cho "${cloudMeta.fileName}" vào IndexedDB cục bộ.`,
        bytes: reassembledBlob.size,
        durationMs: Math.round(performance.now() - startedAt),
      });

      if (typeof window !== 'undefined') {
        if (assetType === 'models') {
          window.dispatchEvent(
            new CustomEvent('dau-an-viet-glb-models-updated', { detail: { siteId: canonicalKey } })
          );
        } else if (assetType === 'images') {
          window.dispatchEvent(new CustomEvent('heritage_custom_photos_changed'));
        }
      }

      return {
        ok: Boolean(savedEntry),
        entry: savedEntry || undefined,
        fromCache: false,
        meta: cloudMeta,
      };
    } catch (err) {
      setActiveDownloadProgress(null, flightKey);
      const { code, message } = extractFirebaseErrorDetails(err);
      console.error(
        `[DauAnViet3D][ChunkPull] Failed downloading/reassembling ${assetType}/${canonicalKey}:`,
        { code, message, err }
      );
      setCloudAssetError(canonicalKey, assetType, { code, message });
      appendSyncLog({
        branch: `/cloudAssetsChunks/${assetType}/${canonicalKey}`,
        action: 'chunk_pull',
        status: 'error',
        message: `Không thể kéo & ghép mảnh ${kindLabel} cho ${displaySite}.`,
        errorCode: code,
        errorMessage: message,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return { ok: false, errorCode: code, errorMessage: message };
    } finally {
      inFlightDownloads.delete(flightKey);
    }
  })();

  inFlightDownloads.set(flightKey, task);
  return task;
}

/**
 * Legacy-compatible binary upload entry point used by glbModelStorage & AudioGuideContext.
 * Step 1: Always saves to Tier 1 IndexedDB Vault (`DauAnViet3D_AssetVault`) offline-first.
 * Step 2: Immediately pushes in 350KB chunks via `uploadBlobInChunksToRTDB` with corner toast.
 */
export async function uploadAssetBinaryToFirebaseStorage(
  kind: ChunkAssetType,
  siteId: string,
  file: File | Blob,
  fileName?: string
): Promise<{
  ok: boolean;
  downloadUrl?: string;
  storagePath?: string;
  errorCode?: string;
  errorMessage?: string;
}> {
  const canonicalKey = getCanonicalAssetKey(siteId);
  const safeFileName = (
    (fileName && fileName.trim()) ||
    (file instanceof File && file.name
      ? file.name
      : `${canonicalKey}.${getDefaultExtForAsset(kind)}`)
  ).replace(/[^a-zA-Z0-9._-]+/g, '-');

  // Step 1: Persist binary into Tier 1 IndexedDB Vault first (Offline-first guarantee)
  if (kind === 'models') {
    await saveModelBlobToVault(canonicalKey, file, safeFileName, 'admin_upload');
  } else if (kind === 'audio') {
    await saveAudioBlobToVault(canonicalKey, file, safeFileName, undefined, 'admin_upload');
  } else if (kind === 'images') {
    await saveImageBlobToVault(canonicalKey, file, safeFileName, 'admin_upload');
  } else {
    await saveVideoBlobToVault(canonicalKey, file, safeFileName, 'admin_upload');
  }
  markLocalAssetsMutated();

  // Step 2: Push via 350KB Chunked Sync Engine with subtle corner auto-sync progress toast
  const baseSiteId = canonicalKey.replace(/_\d+$/, '');
  const siteLabel = BAKED_ASSETS[baseSiteId]?.officialName || canonicalKey;
  const kindLabel =
    kind === 'models' ? 'Mô hình 3D' : kind === 'audio' ? 'Ghi âm' : kind === 'images' ? 'Hình ảnh' : 'Video';

  emitCloudAutoSyncToast({
    active: true,
    status: 'syncing',
    label: `Đang đồng bộ cập nhật mới: ${kindLabel} ${siteLabel}`,
    percent: 5,
  });

  const chunkRes = await uploadBlobInChunksToRTDB(kind, canonicalKey, file, safeFileName, {
    siteName: siteLabel,
    onProgress: (p) => {
      emitCloudAutoSyncToast({
        active: true,
        status: 'syncing',
        label: `Đang đồng bộ cập nhật mới: ${kindLabel} ${siteLabel}`,
        detail: `${p.currentChunk}/${p.totalChunks} mảnh · ${p.percent}%`,
        percent: p.percent,
      });
    },
  });

  if (chunkRes.ok) {
    emitCloudAutoSyncToast(
      {
        active: true,
        status: 'ok',
        label: `Đã đồng bộ Cloud: ${kindLabel} ${siteLabel}`,
        detail: `${chunkRes.meta?.totalChunks || 1} mảnh đã lên Cloud`,
        percent: 100,
      },
      3200
    );
    return {
      ok: true,
      storagePath: `/cloudAssetsMeta/${kind}/${canonicalKey}`,
    };
  }

  emitCloudAutoSyncToast(
    {
      active: true,
      status: 'error',
      label: `Lưu cục bộ (chưa đẩy Cloud): ${kindLabel} ${siteLabel}`,
      detail: chunkRes.errorMessage || chunkRes.errorCode || 'Cần đăng nhập Admin để đẩy Cloud',
    },
    4800
  );

  return {
    ok: false,
    errorCode: chunkRes.errorCode,
    errorMessage: chunkRes.errorMessage,
  };
}

// ============================================================================
// UNIFIED 6-CATEGORY HELPERS: ACCOUNTS, VIDEOS, IMAGES & AUTO-PUSH ON SAVE
// ============================================================================

export function buildAccountsSyncPayload(): {
  payload: Record<string, unknown>;
  accountCount: number;
} {
  const accountsDb = readLocalJson<unknown[]>(KEY_ACCOUNTS_DB, []);
  const credentials = readLocalJson<Record<string, unknown>>(KEY_USER_CREDENTIALS, {});
  const visitors = readLocalJson<unknown[]>(KEY_VISITORS_REGISTRY, []);
  const issuedPasses = readLocalJson<unknown[]>(KEY_ISSUED_PASSES, []);
  const subscriptionTiers = readLocalJson<Record<string, unknown>>(KEY_SUBSCRIPTION_TIERS, {});
  const schoolPackages = readLocalJson<unknown[]>(KEY_SCHOOL_PACKAGES, []);
  const testerAllowlist = readLocalJson<string[]>(KEY_TESTER_ALLOWLIST, []);
  const adminEmails = readLocalJson<string[]>(KEY_ADMIN_EMAILS, []);
  const lockedAccounts = readLocalJson<Record<string, unknown>>(KEY_LOCKED_ACCOUNTS, {});

  const uniqueEmails = new Set<string>();
  if (Array.isArray(accountsDb)) {
    accountsDb.forEach((a) => {
      const email = (a as { email?: string })?.email;
      if (typeof email === 'string' && email.trim()) uniqueEmails.add(email.toLowerCase().trim());
    });
  }
  Object.keys(credentials || {}).forEach((k) => uniqueEmails.add(k.toLowerCase().trim()));
  if (Array.isArray(visitors)) {
    visitors.forEach((v) => {
      const email = (v as { email?: string })?.email;
      if (typeof email === 'string' && email.trim()) uniqueEmails.add(email.toLowerCase().trim());
    });
  }
  if (Array.isArray(adminEmails)) {
    adminEmails.forEach((e) => {
      if (typeof e === 'string' && e.trim()) uniqueEmails.add(e.toLowerCase().trim());
    });
  }

  return {
    accountCount: Math.max(uniqueEmails.size, Array.isArray(accountsDb) ? accountsDb.length : 0, 1),
    payload: {
      accountsDb,
      credentials,
      visitors,
      issuedPasses,
      subscriptionTiers,
      schoolPackages,
      testerAllowlist,
      adminEmails,
      lockedAccounts,
      updatedAt: new Date().toISOString(),
    },
  };
}

export async function pushAccountsBranchToCloud(): Promise<{
  ok: boolean;
  accountCount: number;
  bytes: number;
  errorCode?: string;
  errorMessage?: string;
}> {
  const db = getHeritageFirestore();
  const { payload, accountCount } = buildAccountsSyncPayload();
  const bytes = estimateJsonBytes(payload);
  const nowIso = new Date().toISOString();

  if (!db) {
    return {
      ok: false,
      accountCount,
      bytes,
      errorCode: 'firestore/not-initialized',
      errorMessage: 'Firestore SDK chưa sẵn sàng.',
    };
  }

  try {
    await retryWithBackoff(
      () =>
        setDoc(
          doc(db, 'sync_state', 'accounts'),
          {
            docId: 'accounts',
            data: payload,
            updatedAt: nowIso,
          },
          { merge: true }
        ),
      3
    );
    const rtdbUrl = resolveConfiguredRtdbUrl();
    if (rtdbUrl) {
      await rtdbRequest(rtdbUrl, 'syncState/accounts', 'PUT', payload).catch(() => undefined);
    }
    return { ok: true, accountCount, bytes };
  } catch (err) {
    const info = buildFirestoreErrorInfo(err, OperationType.WRITE, 'sync_state/accounts');
    return { ok: false, accountCount, bytes, errorCode: info.code, errorMessage: info.error };
  }
}

export async function pullAccountsBranchFromCloud(): Promise<{
  ok: boolean;
  accountCount: number;
  errorCode?: string;
  errorMessage?: string;
}> {
  const db = getHeritageFirestore();
  let remotePayload: Record<string, unknown> | null = null;

  try {
    if (db) {
      const snap = await getDoc(doc(db, 'sync_state', 'accounts'));
      if (snap.exists()) {
        const d = snap.data() as { data?: Record<string, unknown> };
        if (d?.data && typeof d.data === 'object') {
          remotePayload = d.data;
        }
      }
    }
    if (!remotePayload) {
      const rtdbUrl = resolveConfiguredRtdbUrl();
      if (rtdbUrl) {
        const rtdbData = await rtdbRequest<Record<string, unknown> | null>(
          rtdbUrl,
          'syncState/accounts',
          'GET'
        ).catch(() => null);
        if (rtdbData && typeof rtdbData === 'object') {
          remotePayload = rtdbData;
        }
      }
    }

    if (!remotePayload) {
      return { ok: true, accountCount: 0 };
    }

    // Merge safely without erasing local admin defaults
    if (Array.isArray(remotePayload.accountsDb) && remotePayload.accountsDb.length > 0) {
      writeLocalJson(KEY_ACCOUNTS_DB, remotePayload.accountsDb);
    }
    if (remotePayload.credentials && typeof remotePayload.credentials === 'object') {
      const mergedCreds = {
        ...readLocalJson<Record<string, unknown>>(KEY_USER_CREDENTIALS, {}),
        ...(remotePayload.credentials as Record<string, unknown>),
      };
      writeLocalJson(KEY_USER_CREDENTIALS, mergedCreds);
    }
    if (Array.isArray(remotePayload.visitors) && remotePayload.visitors.length > 0) {
      writeLocalJson(KEY_VISITORS_REGISTRY, remotePayload.visitors);
    }
    if (Array.isArray(remotePayload.issuedPasses) && remotePayload.issuedPasses.length > 0) {
      writeLocalJson(KEY_ISSUED_PASSES, remotePayload.issuedPasses);
    }
    if (remotePayload.subscriptionTiers && typeof remotePayload.subscriptionTiers === 'object') {
      writeLocalJson(KEY_SUBSCRIPTION_TIERS, {
        ...readLocalJson<Record<string, unknown>>(KEY_SUBSCRIPTION_TIERS, {}),
        ...(remotePayload.subscriptionTiers as Record<string, unknown>),
      });
    }
    if (Array.isArray(remotePayload.schoolPackages) && remotePayload.schoolPackages.length > 0) {
      writeLocalJson(KEY_SCHOOL_PACKAGES, remotePayload.schoolPackages);
    }
    if (Array.isArray(remotePayload.testerAllowlist)) {
      writeLocalJson(KEY_TESTER_ALLOWLIST, remotePayload.testerAllowlist);
    }
    if (Array.isArray(remotePayload.adminEmails) && remotePayload.adminEmails.length > 0) {
      writeLocalJson(KEY_ADMIN_EMAILS, remotePayload.adminEmails);
    }
    if (remotePayload.lockedAccounts && typeof remotePayload.lockedAccounts === 'object') {
      writeLocalJson(KEY_LOCKED_ACCOUNTS, remotePayload.lockedAccounts);
    }

    const { accountCount } = buildAccountsSyncPayload();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dau-an-viet-visitors-updated'));
    }
    return { ok: true, accountCount };
  } catch (err) {
    const { code, message } = extractFirebaseErrorDetails(err);
    return { ok: false, accountCount: 0, errorCode: code, errorMessage: message };
  }
}

export async function pushVideosBranchToCloud(
  sites: HeritageSite[],
  options?: {
    skipIfMatched?: boolean;
    onProgress?: (p: ChunkTransferProgress) => void;
    onItemDone?: (item: BatchChunkSyncItemResult) => void;
  }
): Promise<{
  pushedLinks: number;
  pushedBlobs: number;
  skippedCount: number;
  failedCount: number;
  permissionDenied: boolean;
}> {
  const db = getHeritageFirestore();
  let pushedLinks = 0;
  let pushedBlobs = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let permissionDenied = false;
  const nowIso = new Date().toISOString();

  for (const videoKey of HERITAGE_VIDEO_KEYS_ORDERED) {
    if (permissionDenied) break;
    const siteId = VIDEO_KEY_TO_SITE_ID[videoKey];
    const site = sites.find((s) => s.id === siteId);
    const siteName = site?.officialName || BAKED_ASSETS[siteId]?.officialName || siteId;

    // 1. Custom external video URL (YouTube / Vimeo / direct mp4)
    const customUrl = loadCustomVideoUrlForHeritage(videoKey);
    if (customUrl && db) {
      try {
        await retryWithBackoff(
          () =>
            setDoc(
              doc(db, 'site_videos', siteId),
              {
                siteId,
                videoUrl: customUrl.originalUrl || customUrl.embedUrl,
                kind: customUrl.kind === 'youtube' ? 'youtube' : 'video',
                updatedAt: nowIso,
              },
              { merge: true }
            ),
          3
        );
        pushedLinks += 1;
        options?.onItemDone?.({
          siteId,
          siteName,
          assetType: 'videos',
          fileName: customUrl.kind === 'youtube' ? 'YouTube URL' : extractBasename(customUrl.originalUrl),
          fileSize: 0,
          totalChunks: 1,
          status: 'ok',
          message: 'Đã đồng bộ liên kết Video',
          detailText: customUrl.kind === 'youtube' ? 'Liên kết YouTube' : 'Liên kết Video trực tiếp',
        });
      } catch (err) {
        const { code, message } = extractFirebaseErrorDetails(err);
        failedCount += 1;
        options?.onItemDone?.({
          siteId,
          siteName,
          assetType: 'videos',
          fileName: 'video-link',
          fileSize: 0,
          totalChunks: 0,
          status: 'error',
          message: `${code}: ${message}`,
          errorCode: code,
          errorMessage: message,
        });
        if (isNonRetryableFirebaseError(code)) {
          permissionDenied = true;
          break;
        }
      }
    }

    // 2. Local uploaded video blob (from Cinema IDB or AssetVault) <= 25MB
    const cinemaLocal = await loadLocalVideoFromIndexedDB(videoKey);
    const vaultLocal = await getVideoFromVault(`${siteId}_0`);
    const videoBlob = cinemaLocal?.blob || vaultLocal?.blob || null;
    const videoFileName = cinemaLocal?.fileName || vaultLocal?.fileName || `${siteId}_video.mp4`;

    if (videoBlob) {
      const slotKey = `${siteId}_0`;
      const res = await uploadBlobInChunksToRTDB('videos', slotKey, videoBlob, videoFileName, {
        siteName,
        skipIfMatched: options?.skipIfMatched,
        onProgress: options?.onProgress,
      });
      const sizeMb = (videoBlob.size / (1024 * 1024)).toFixed(1);
      if (res.ok) {
        if (res.skipped) skippedCount += 1;
        else pushedBlobs += 1;
        options?.onItemDone?.({
          siteId: slotKey,
          siteName,
          assetType: 'videos',
          fileName: videoFileName,
          fileSize: videoBlob.size,
          totalChunks: res.meta?.totalChunks || 1,
          status: res.skipped ? 'skipped' : 'ok',
          message: res.skipped
            ? 'Đã khớp Cloud (bỏ qua)'
            : `Đã đẩy Video (${res.meta?.totalChunks || 1} mảnh)`,
          detailText: `${videoFileName} (${sizeMb} MB)`,
        });
      } else {
        failedCount += 1;
        options?.onItemDone?.({
          siteId: slotKey,
          siteName,
          assetType: 'videos',
          fileName: videoFileName,
          fileSize: videoBlob.size,
          totalChunks: 0,
          status: 'error',
          message: res.errorMessage || res.errorCode || 'Đẩy video thất bại',
          detailText: `${videoFileName} (${sizeMb} MB)`,
          errorCode: res.errorCode,
          errorMessage: res.errorMessage,
        });
        if (res.errorCode && isNonRetryableFirebaseError(res.errorCode)) {
          permissionDenied = true;
          break;
        }
      }
    }
  }

  return { pushedLinks, pushedBlobs, skippedCount, failedCount, permissionDenied };
}

export async function pullVideosBranchFromCloud(): Promise<{
  ok: boolean;
  pulledLinks: number;
}> {
  const db = getHeritageFirestore();
  if (!db) return { ok: false, pulledLinks: 0 };
  try {
    const snap = await getDocs(collection(db, 'site_videos'));
    let pulledLinks = 0;
    snap.forEach((docSnap) => {
      const d = docSnap.data() as { siteId?: string; videoUrl?: string };
      const siteId = String(d.siteId || docSnap.id);
      const videoKey = SITE_ID_TO_VIDEO_KEY[siteId] as HeritageVideoKey | undefined;
      if (videoKey && typeof d.videoUrl === 'string' && d.videoUrl.trim()) {
        saveCustomVideoUrlForHeritage(videoKey, d.videoUrl.trim());
        pulledLinks += 1;
      }
    });
    return { ok: true, pulledLinks };
  } catch {
    return { ok: false, pulledLinks: 0 };
  }
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/is);
  if (!m) return null;
  try {
    const mimeType = m[1] || 'image/jpeg';
    const blob = pureBase64ToBlob(m[2], mimeType, false);
    return { blob, mimeType };
  } catch {
    return null;
  }
}

export async function pushUploadedImagesToCloud(
  sites: HeritageSite[],
  options?: {
    skipIfMatched?: boolean;
    onProgress?: (p: ChunkTransferProgress) => void;
    onItemDone?: (item: BatchChunkSyncItemResult) => void;
  }
): Promise<{
  pushedImages: number;
  skippedCount: number;
  failedCount: number;
  permissionDenied: boolean;
}> {
  let pushedImages = 0;
  let skippedCount = 0;
  let failedCount = 0;
  let permissionDenied = false;

  const customPhotos = readLocalJson<Record<string, unknown>>(KEY_CUSTOM_SITE_PHOTOS, {});
  const vaultImages = await listVaultImagesMeta();
  const jobs: Array<{ key: string; siteName: string; blob: Blob; fileName: string }> = [];
  const queuedKeys = new Set<string>();

  // 1. Any local images already in IndexedDB Vault `images` store
  for (const [key, meta] of Object.entries(vaultImages)) {
    const entry = await getImageFromVault(key);
    if (entry?.blob) {
      const baseSiteId = key.replace(/_\d+$/, '');
      const siteName =
        sites.find((s) => s.id === baseSiteId)?.officialName ||
        BAKED_ASSETS[baseSiteId]?.officialName ||
        key;
      jobs.push({ key, siteName, blob: entry.blob, fileName: meta.fileName || `${key}.jpg` });
      queuedKeys.add(key);
    }
  }

  // 2. Any inline data:image/... custom photos saved in localStorage
  for (const site of sites) {
    const raw = customPhotos[site.id];
    const slots: Array<{ slot: number; val: string }> = [];
    if (typeof raw === 'string' && raw.startsWith('data:image/')) {
      slots.push({ slot: 0, val: raw });
    } else if (raw && typeof raw === 'object') {
      const pair = raw as { photo1?: unknown; photo2?: unknown };
      if (typeof pair.photo1 === 'string' && pair.photo1.startsWith('data:image/')) {
        slots.push({ slot: 0, val: pair.photo1 });
      }
      if (typeof pair.photo2 === 'string' && pair.photo2.startsWith('data:image/')) {
        slots.push({ slot: 1, val: pair.photo2 });
      }
    }
    for (const s of slots) {
      const slotKey = `${site.id}_${s.slot}`;
      if (queuedKeys.has(slotKey)) continue;
      const converted = dataUrlToBlob(s.val);
      if (converted) {
        const ext = converted.mimeType.includes('png')
          ? 'png'
          : converted.mimeType.includes('webp')
          ? 'webp'
          : 'jpg';
        jobs.push({
          key: slotKey,
          siteName: `${site.officialName} (Ảnh ${s.slot + 1})`,
          blob: converted.blob,
          fileName: `${slotKey}.${ext}`,
        });
        queuedKeys.add(slotKey);
      }
    }
  }

  for (const job of jobs) {
    if (permissionDenied) break;
    const res = await uploadBlobInChunksToRTDB('images', job.key, job.blob, job.fileName, {
      siteName: job.siteName,
      skipIfMatched: options?.skipIfMatched,
      onProgress: options?.onProgress,
    });
    const sizeKb = `${Math.max(1, Math.round(job.blob.size / 1024))} KB`;
    if (res.ok) {
      if (res.skipped) skippedCount += 1;
      else pushedImages += 1;
      options?.onItemDone?.({
        siteId: job.key,
        siteName: job.siteName,
        assetType: 'images',
        fileName: job.fileName,
        fileSize: job.blob.size,
        totalChunks: res.meta?.totalChunks || 1,
        status: res.skipped ? 'skipped' : 'ok',
        message: res.skipped
          ? 'Đã khớp Cloud (bỏ qua)'
          : `Đã đẩy Ảnh (${res.meta?.totalChunks || 1} mảnh)`,
        detailText: `${job.fileName} (${sizeKb})`,
      });
    } else {
      failedCount += 1;
      options?.onItemDone?.({
        siteId: job.key,
        siteName: job.siteName,
        assetType: 'images',
        fileName: job.fileName,
        fileSize: job.blob.size,
        totalChunks: 0,
        status: 'error',
        message: res.errorMessage || res.errorCode || 'Đẩy ảnh thất bại',
        detailText: `${job.fileName} (${sizeKb})`,
        errorCode: res.errorCode,
        errorMessage: res.errorMessage,
      });
      if (res.errorCode && isNonRetryableFirebaseError(res.errorCode)) {
        permissionDenied = true;
        break;
      }
    }
  }

  return { pushedImages, skippedCount, failedCount, permissionDenied };
}

/**
 * Trigger a silent background Cloud push with the subtle dark-museum corner progress toast
 * whenever Admin saves changes (photos, videos, CMS edits, credits, accounts).
 */
export function autoPushAssetUpdateInBackground(
  label: string,
  task: () => Promise<{ ok: boolean; detail?: string; errorMessage?: string }>
): void {
  if (typeof window === 'undefined') return;
  if (!firebaseAuth.currentUser) return; // Only auto-push when Admin is signed in with Firebase Auth

  emitCloudAutoSyncToast({
    active: true,
    status: 'syncing',
    label: `Đang đồng bộ cập nhật mới: ${label}`,
    percent: 35,
  });

  void task()
    .then((res) => {
      if (res.ok) {
        emitCloudAutoSyncToast(
          {
            active: true,
            status: 'ok',
            label: `Đã đồng bộ Cloud: ${label}`,
            detail: res.detail || 'Dữ liệu đã sẵn sàng cho toàn hệ thống',
            percent: 100,
          },
          3000
        );
      } else {
        emitCloudAutoSyncToast(
          {
            active: true,
            status: 'error',
            label: `Đã lưu cục bộ: ${label}`,
            detail: res.errorMessage || 'Chưa đồng bộ được lên Cloud',
          },
          4200
        );
      }
    })
    .catch((err) => {
      const { message } = extractFirebaseErrorDetails(err);
      emitCloudAutoSyncToast(
        {
          active: true,
          status: 'error',
          label: `Đã lưu cục bộ: ${label}`,
          detail: message,
        },
        4200
      );
    });
}

// ============================================================================
// ONE-CLICK UNIFIED 6-CATEGORY DELTA PUSH & FULL PULL
// ============================================================================

async function fetchStaticFileAsBlobIfAvailable(url: string): Promise<{ blob: Blob; fileName: string } | null> {
  if (!url || !url.startsWith('/')) return null;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok || ct.includes('text/html')) return null;
    const blob = await res.blob();
    if (blob.size < 128) return null;
    return { blob, fileName: extractBasename(url) };
  } catch {
    return null;
  }
}

export const DEFAULT_UNIFIED_CATEGORIES: UnifiedSyncCategorySelection = {
  models: true,
  audio: true,
  images: true,
  videos: true,
  accounts: true,
  updates: true,
};

/**
 * Unified 6-Category Smart Delta Push:
 * - Compares checksum + fileSize before pushing so unchanged assets (like the 4 already-pushed
 *   3D models) are cleanly skipped (`Đã khớp Cloud (bỏ qua)`) unless `forceOverwrite: true`.
 * - Respects selective category checkboxes (3D, Ghi âm, Hình ảnh, Video, Tài khoản, Dữ liệu & Nguồn).
 */
export async function pushUnifiedAssetsToCloud(
  sitesInput?: HeritageSite[],
  options?: {
    categories?: Partial<UnifiedSyncCategorySelection>;
    forceOverwrite?: boolean;
    includeStaticPublicFallback?: boolean;
    onProgress?: (progress: ChunkTransferProgress) => void;
    onItemDone?: (item: BatchChunkSyncItemResult) => void;
  }
): Promise<{
  ok: boolean;
  pushedModels: number;
  pushedAudios: number;
  pushedImages: number;
  pushedVideos: number;
  pushedAccounts: boolean;
  pushedUpdates: boolean;
  skippedCount: number;
  failedCount: number;
  items: BatchChunkSyncItemResult[];
}> {
  const sites =
    sitesInput && sitesInput.length > 0 ? sitesInput : (DEFAULT_HERITAGE_SITES as HeritageSite[]);
  const includeStatic = options?.includeStaticPublicFallback ?? true;
  const skipIfMatched = !options?.forceOverwrite;
  const cats: UnifiedSyncCategorySelection = {
    ...DEFAULT_UNIFIED_CATEGORIES,
    ...(options?.categories || {}),
  };

  updateSyncState({ isSyncing: true, health: 'syncing', lastErrorCode: null, lastErrorMessage: null });

  const items: BatchChunkSyncItemResult[] = [];
  let pushedModels = 0;
  let pushedAudios = 0;
  let pushedImages = 0;
  let pushedVideos = 0;
  let pushedAccounts = false;
  let pushedUpdates = false;
  let skippedCount = 0;
  let failedCount = 0;
  let stopEarlyOnPermission = false;

  const pushItem = (item: BatchChunkSyncItemResult) => {
    items.push(item);
    options?.onItemDone?.(item);
  };

  try {
    // Refresh Cloud manifest once before Delta comparison
    await preloadCloudAssetsManifest(true);

    // 1 & 2. 3D Models + 17 Audio Narrations
    if (cats.models || cats.audio) {
      for (const site of sites) {
        if (stopEarlyOnPermission) break;

        if (cats.models) {
          let modelBlob: Blob | null = null;
          let modelFileName = '';
          const vaultModel = await getModelFromVault(site.id);
          if (vaultModel?.blob) {
            modelBlob = vaultModel.blob;
            modelFileName = vaultModel.fileName;
          } else if (includeStatic) {
            for (const cand of getBakedModelCandidateUrls(site.id)) {
              const fetched = await fetchStaticFileAsBlobIfAvailable(cand);
              if (fetched) {
                modelBlob = fetched.blob;
                modelFileName = fetched.fileName;
                break;
              }
            }
          }

          if (modelBlob) {
            const res = await uploadBlobInChunksToRTDB('models', site.id, modelBlob, modelFileName, {
              siteName: site.officialName,
              skipIfMatched,
              onProgress: options?.onProgress,
            });
            const sizeMb = (modelBlob.size / (1024 * 1024)).toFixed(2);
            const item: BatchChunkSyncItemResult = {
              siteId: site.id,
              siteName: site.officialName,
              assetType: 'models',
              fileName: modelFileName,
              fileSize: modelBlob.size,
              totalChunks: res.meta?.totalChunks || Math.ceil((modelBlob.size * 1.34) / CHUNK_SIZE),
              status: res.ok ? (res.skipped ? 'skipped' : 'ok') : 'error',
              message: res.ok
                ? res.skipped
                  ? 'Đã khớp Cloud (bỏ qua)'
                  : `Đã đẩy 3D (${res.meta?.totalChunks || 1} mảnh)`
                : `${res.errorCode || 'error'}: ${res.errorMessage || 'Ghi thất bại'}`,
              detailText: `${modelFileName} (${sizeMb} MB)`,
              errorCode: res.errorCode,
              errorMessage: res.errorMessage,
            };
            pushItem(item);
            if (res.ok) {
              if (res.skipped) skippedCount += 1;
              else pushedModels += 1;
            } else {
              failedCount += 1;
              if (res.errorCode && isNonRetryableFirebaseError(res.errorCode)) {
                stopEarlyOnPermission = true;
                break;
              }
            }
          }
        }

        if (cats.audio && !stopEarlyOnPermission) {
          let audioBlob: Blob | null = null;
          let audioFileName = '';
          const vaultAudio = await getAudioFromVault(site.id);
          if (vaultAudio?.blob) {
            audioBlob = vaultAudio.blob;
            audioFileName = vaultAudio.fileName;
          } else if (includeStatic) {
            for (const cand of getBakedAudioCandidateUrls(site.id)) {
              const fetched = await fetchStaticFileAsBlobIfAvailable(cand);
              if (fetched) {
                audioBlob = fetched.blob;
                audioFileName = fetched.fileName;
                break;
              }
            }
          }

          if (audioBlob) {
            const res = await uploadBlobInChunksToRTDB('audio', site.id, audioBlob, audioFileName, {
              siteName: site.officialName,
              skipIfMatched,
              onProgress: options?.onProgress,
            });
            const sizeMb = (audioBlob.size / (1024 * 1024)).toFixed(2);
            const item: BatchChunkSyncItemResult = {
              siteId: site.id,
              siteName: site.officialName,
              assetType: 'audio',
              fileName: audioFileName,
              fileSize: audioBlob.size,
              totalChunks: res.meta?.totalChunks || Math.ceil((audioBlob.size * 1.34) / CHUNK_SIZE),
              status: res.ok ? (res.skipped ? 'skipped' : 'ok') : 'error',
              message: res.ok
                ? res.skipped
                  ? 'Đã khớp Cloud (bỏ qua)'
                  : `Đã đẩy Ghi âm (${res.meta?.totalChunks || 1} mảnh)`
                : `${res.errorCode || 'error'}: ${res.errorMessage || 'Ghi thất bại'}`,
              detailText: `${audioFileName} (${sizeMb} MB)`,
              errorCode: res.errorCode,
              errorMessage: res.errorMessage,
            };
            pushItem(item);
            if (res.ok) {
              if (res.skipped) skippedCount += 1;
              else pushedAudios += 1;
            } else {
              failedCount += 1;
              if (res.errorCode && isNonRetryableFirebaseError(res.errorCode)) {
                stopEarlyOnPermission = true;
                break;
              }
            }
          }
        }
      }
    }

    // 3. Images (local uploaded image blobs in 350KB chunks + external URLs via catalog)
    if (cats.images && !stopEarlyOnPermission) {
      const imgRes = await pushUploadedImagesToCloud(sites, {
        skipIfMatched,
        onProgress: options?.onProgress,
        onItemDone: pushItem,
      });
      pushedImages += imgRes.pushedImages;
      skippedCount += imgRes.skippedCount;
      failedCount += imgRes.failedCount;
      if (imgRes.permissionDenied) stopEarlyOnPermission = true;
    }

    // 4. Videos (YouTube/direct URLs + local .mp4/.webm <= 25MB in 350KB chunks)
    if (cats.videos && !stopEarlyOnPermission) {
      const vidRes = await pushVideosBranchToCloud(sites, {
        skipIfMatched,
        onProgress: options?.onProgress,
        onItemDone: pushItem,
      });
      pushedVideos += vidRes.pushedLinks + vidRes.pushedBlobs;
      skippedCount += vidRes.skippedCount;
      failedCount += vidRes.failedCount;
      if (vidRes.permissionDenied) stopEarlyOnPermission = true;
    }

    // 5. Accounts & Permissions (`sync_state/accounts`)
    if (cats.accounts && !stopEarlyOnPermission) {
      const accRes = await pushAccountsBranchToCloud();
      pushedAccounts = accRes.ok;
      pushItem({
        siteId: 'sync-accounts',
        siteName: 'Hệ thống Tài khoản & Phân quyền',
        assetType: 'accounts',
        fileName: 'sync_state/accounts',
        fileSize: accRes.bytes,
        totalChunks: 1,
        status: accRes.ok ? 'ok' : 'error',
        message: accRes.ok
          ? `Đã đồng bộ (${accRes.accountCount} tài khoản)`
          : `${accRes.errorCode || 'error'}: ${accRes.errorMessage || 'Lỗi ghi tài khoản'}`,
        detailText: `${accRes.accountCount} tài khoản & phân quyền`,
        errorCode: accRes.errorCode,
        errorMessage: accRes.errorMessage,
      });
      if (!accRes.ok) {
        failedCount += 1;
        if (accRes.errorCode && isNonRetryableFirebaseError(accRes.errorCode)) {
          stopEarlyOnPermission = true;
        }
      }
    }

    // 6. Updates (17 Sites CMS, 34 Photo URLs, 3D settings, 64+ Media Credits, Global Settings)
    if ((cats.updates || cats.images) && !stopEarlyOnPermission) {
      const dataRes = await forcePushAllToCloud(sites);
      pushedUpdates = dataRes.ok;
      const creditsCount = loadMediaCredits().length;
      pushItem({
        siteId: 'sync-updates',
        siteName: 'Dữ liệu 17 Di tích, 34 Ảnh & Nguồn tư liệu',
        assetType: 'updates',
        fileName: 'heritage_cloud_sync/manifest',
        fileSize: 0,
        totalChunks: dataRes.succeededBranches,
        status: dataRes.ok ? 'ok' : 'error',
        message: dataRes.ok
          ? `Đã đồng bộ (${dataRes.succeededBranches} nhánh · ${creditsCount} tư liệu)`
          : `${dataRes.firstErrorCode || 'error'}: ${dataRes.firstErrorMessage || 'Lỗi ghi dữ liệu'}`,
        detailText: `17 di tích · ${creditsCount} nguồn tư liệu · cấu hình hệ thống`,
        errorCode: dataRes.firstErrorCode,
        errorMessage: dataRes.firstErrorMessage,
      });
      if (!dataRes.ok) failedCount += 1;
    }

    const ok = failedCount === 0 && !stopEarlyOnPermission;
    updateSyncState({
      isSyncing: false,
      health: stopEarlyOnPermission ? 'rules_attention' : ok ? 'synced' : 'local_indexeddb_only',
    });

    return {
      ok,
      pushedModels,
      pushedAudios,
      pushedImages,
      pushedVideos,
      pushedAccounts,
      pushedUpdates,
      skippedCount,
      failedCount,
      items,
    };
  } catch {
    updateSyncState({ isSyncing: false });
    return {
      ok: false,
      pushedModels,
      pushedAudios,
      pushedImages,
      pushedVideos,
      pushedAccounts,
      pushedUpdates,
      skippedCount,
      failedCount: failedCount + 1,
      items,
    };
  }
}

/**
 * Legacy wrapper preserved for backwards compatibility.
 */
export async function pushAllLocalAssetsChunkedToFirebase(
  sitesInput?: HeritageSite[],
  options?: {
    includeStaticPublicFallback?: boolean;
    forceOverwrite?: boolean;
    categories?: Partial<UnifiedSyncCategorySelection>;
    onProgress?: (progress: ChunkTransferProgress) => void;
    onItemDone?: (item: BatchChunkSyncItemResult) => void;
  }
): Promise<{
  ok: boolean;
  pushedModels: number;
  pushedAudios: number;
  skippedCount: number;
  failedCount: number;
  items: BatchChunkSyncItemResult[];
}> {
  const res = await pushUnifiedAssetsToCloud(sitesInput, options);
  return {
    ok: res.ok,
    pushedModels: res.pushedModels,
    pushedAudios: res.pushedAudios,
    skippedCount: res.skippedCount,
    failedCount: res.failedCount,
    items: res.items,
  };
}

/**
 * Unified 6-Category Full Pull:
 * Restores catalog metadata, accounts, video links, and all chunked 3D/Audio/Image/Video
 * files from Firebase Cloud into local IndexedDB & localStorage.
 */
export async function pullUnifiedAssetsFromCloud(
  sitesInput?: HeritageSite[],
  options?: {
    categories?: Partial<UnifiedSyncCategorySelection>;
    forceRefresh?: boolean;
    onProgress?: (progress: ChunkTransferProgress) => void;
    onItemDone?: (item: BatchChunkSyncItemResult) => void;
  }
): Promise<{
  ok: boolean;
  pulledModels: number;
  pulledAudios: number;
  pulledImages: number;
  pulledVideos: number;
  pulledAccounts: number;
  skippedUpToDate: number;
  failedCount: number;
  items: BatchChunkSyncItemResult[];
}> {
  const sites =
    sitesInput && sitesInput.length > 0 ? sitesInput : (DEFAULT_HERITAGE_SITES as HeritageSite[]);
  const siteNameById = Object.fromEntries(sites.map((s) => [s.id, s.officialName]));
  const cats: UnifiedSyncCategorySelection = {
    ...DEFAULT_UNIFIED_CATEGORIES,
    ...(options?.categories || {}),
  };

  updateSyncState({ isSyncing: true, health: 'syncing', lastErrorCode: null, lastErrorMessage: null });

  const items: BatchChunkSyncItemResult[] = [];
  let pulledModels = 0;
  let pulledAudios = 0;
  let pulledImages = 0;
  let pulledVideos = 0;
  let pulledAccounts = 0;
  let skippedUpToDate = 0;
  let failedCount = 0;

  const pushItem = (item: BatchChunkSyncItemResult) => {
    items.push(item);
    options?.onItemDone?.(item);
  };

  try {
    // 1. Pull Accounts & Permissions
    if (cats.accounts) {
      const acc = await pullAccountsBranchFromCloud();
      pulledAccounts = acc.accountCount;
      pushItem({
        siteId: 'pull-accounts',
        siteName: 'Hệ thống Tài khoản & Phân quyền',
        assetType: 'accounts',
        fileName: 'sync_state/accounts',
        fileSize: 0,
        totalChunks: 1,
        status: acc.ok ? (acc.accountCount > 0 ? 'ok' : 'skipped') : 'error',
        message: acc.ok
          ? acc.accountCount > 0
            ? `Đã kéo ${acc.accountCount} tài khoản`
            : 'Chưa có bản ghi tài khoản trên Cloud'
          : `${acc.errorCode || 'error'}: ${acc.errorMessage || 'Tải thất bại'}`,
        detailText: `${acc.accountCount} tài khoản`,
      });
      if (!acc.ok) failedCount += 1;
    }

    // 2. Pull Lightweight Catalog, Photos, 3D configs, Media Credits & Global Settings
    if (cats.updates || cats.images) {
      const catRes = await pullAllFromCloud();
      pushItem({
        siteId: 'pull-updates',
        siteName: 'Dữ liệu 17 Di tích, 34 Ảnh & Nguồn tư liệu',
        assetType: 'updates',
        fileName: 'heritage_cloud_sync/manifest',
        fileSize: 0,
        totalChunks: catRes.pulledSites,
        status: catRes.ok ? 'ok' : 'error',
        message: catRes.ok
          ? `Đã kéo ${catRes.pulledSites} di tích · ${catRes.pulledCredits} nguồn tư liệu`
          : `${catRes.errorCode || 'error'}: ${catRes.errorMessage || 'Tải thất bại'}`,
        detailText: `${catRes.pulledSites} di tích · ${catRes.pulledCredits} tư liệu`,
      });
      if (!catRes.ok) failedCount += 1;
    }

    // 3. Pull Video Links
    if (cats.videos) {
      const vidLinks = await pullVideosBranchFromCloud();
      if (vidLinks.pulledLinks > 0) {
        pulledVideos += vidLinks.pulledLinks;
        pushItem({
          siteId: 'pull-video-links',
          siteName: 'Danh mục Liên kết Video tư liệu',
          assetType: 'videos',
          fileName: 'site_videos/*',
          fileSize: 0,
          totalChunks: vidLinks.pulledLinks,
          status: 'ok',
          message: `Đã kéo ${vidLinks.pulledLinks} liên kết Video`,
          detailText: `${vidLinks.pulledLinks} di tích`,
        });
      }
    }

    // 4. Discover and pull chunked binary assets from Cloud
    const metas = await listAllCloudAssetMetas(true);
    const queue: Array<{ assetType: ChunkAssetType; meta: ChunkedAssetMeta }> = [
      ...(cats.models ? Object.values(metas.models).map((meta) => ({ assetType: 'models' as const, meta })) : []),
      ...(cats.audio ? Object.values(metas.audio).map((meta) => ({ assetType: 'audio' as const, meta })) : []),
      ...(cats.images ? Object.values(metas.images).map((meta) => ({ assetType: 'images' as const, meta })) : []),
      ...(cats.videos ? Object.values(metas.videos).map((meta) => ({ assetType: 'videos' as const, meta })) : []),
    ];

    for (const job of queue) {
      const baseSiteId = job.meta.siteId.replace(/_\d+$/, '');
      const displaySite =
        siteNameById[baseSiteId] || BAKED_ASSETS[baseSiteId]?.officialName || job.meta.siteId;
      const res = await downloadBlobFromRTDB(job.assetType, job.meta.siteId, {
        siteName: displaySite,
        forceRefresh: options?.forceRefresh,
        onProgress: options?.onProgress,
      });

      const sizeText =
        job.meta.totalSize >= 1024 * 1024
          ? `${(job.meta.totalSize / (1024 * 1024)).toFixed(2)} MB`
          : `${Math.max(1, Math.round(job.meta.totalSize / 1024))} KB`;

      pushItem({
        siteId: job.meta.siteId,
        siteName: displaySite,
        assetType: job.assetType,
        fileName: job.meta.fileName,
        fileSize: job.meta.totalSize,
        totalChunks: job.meta.totalChunks,
        status: res.ok ? (res.fromCache ? 'skipped' : 'ok') : 'error',
        message: res.ok
          ? res.fromCache
            ? 'Đã khớp Cloud (bỏ qua)'
            : `Đã tải & lưu đệm IndexedDB (${job.meta.totalChunks} mảnh)`
          : `${res.errorCode || 'error'}: ${res.errorMessage || 'Tải thất bại'}`,
        detailText: `${job.meta.fileName} (${sizeText})`,
        errorCode: res.errorCode,
        errorMessage: res.errorMessage,
      });

      if (res.ok) {
        if (res.fromCache) {
          skippedUpToDate += 1;
        } else if (job.assetType === 'models') {
          pulledModels += 1;
        } else if (job.assetType === 'audio') {
          pulledAudios += 1;
        } else if (job.assetType === 'images') {
          pulledImages += 1;
        } else {
          pulledVideos += 1;
        }
      } else {
        failedCount += 1;
      }
    }

    updateSyncState({
      isSyncing: false,
      health: failedCount === 0 ? 'synced' : 'local_indexeddb_only',
    });

    return {
      ok: failedCount === 0,
      pulledModels,
      pulledAudios,
      pulledImages,
      pulledVideos,
      pulledAccounts,
      skippedUpToDate,
      failedCount,
      items,
    };
  } catch {
    updateSyncState({ isSyncing: false });
    return {
      ok: false,
      pulledModels,
      pulledAudios,
      pulledImages,
      pulledVideos,
      pulledAccounts,
      skippedUpToDate,
      failedCount: failedCount + 1,
      items,
    };
  }
}

/**
 * Legacy wrapper preserved for backwards compatibility.
 */
export async function pullAllCloudAssetsChunkedToLocal(
  sitesInput?: HeritageSite[],
  options?: {
    categories?: Partial<UnifiedSyncCategorySelection>;
    forceRefresh?: boolean;
    onProgress?: (progress: ChunkTransferProgress) => void;
    onItemDone?: (item: BatchChunkSyncItemResult) => void;
  }
): Promise<{
  ok: boolean;
  pulledModels: number;
  pulledAudios: number;
  skippedUpToDate: number;
  failedCount: number;
  items: BatchChunkSyncItemResult[];
}> {
  const res = await pullUnifiedAssetsFromCloud(sitesInput, options);
  return {
    ok: res.ok,
    pulledModels: res.pulledModels,
    pulledAudios: res.pulledAudios,
    skippedUpToDate: res.skippedUpToDate,
    failedCount: res.failedCount,
    items: res.items,
  };
}

// ============================================================================
// PUBLIC AUTO-HYDRATION ON STARTUP (RUNS FOR ALL GUESTS, INCOGNITO & REMIX)
// ============================================================================

let publicHydrationPromise: Promise<void> | null = null;

/**
 * Immediately runs on page load for ALL visitors (including unauthenticated Guests,
 * Incognito windows, and Remix copies) — NEVER gated behind Admin or login checks.
 *   1. Preloads `/cloudAssetsMeta` & `cloud_assets_meta` into RAM so 3D models & audio
 *      know immediately what is available on Cloud.
 *   2. Pulls public accounts registry, site catalog, video links, media credits, and
 *      global settings in parallel without blocking UI rendering.
 */
export function hydratePublicCloudOnStartup(force = false): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (publicHydrationPromise && !force) return publicHydrationPromise;

  const task = (async () => {
    try {
      await Promise.allSettled([
        preloadCloudAssetsManifest(force),
        pullAllFromCloud(),
        pullAccountsBranchFromCloud(),
        pullVideosBranchFromCloud(),
      ]);
    } catch (err) {
      console.error('[DauAnViet3D][PublicHydration] Startup hydration encountered an error:', err);
    }
  })();

  publicHydrationPromise = task;
  return task;
}

// ============================================================================
// CHUNKED ATOMIC PUSH TO FIREBASE (LIGHTWEIGHT METADATA, RETRY x3)
// ============================================================================

export interface ChunkedSyncResult {
  ok: boolean;
  succeededBranches: number;
  failedBranches: number;
  strippedBase64Count: number;
  strippedBase64Bytes: number;
  updatedAt: string;
  firstErrorCode?: string;
  firstErrorMessage?: string;
}

export async function checkCloudSyncVersion(): Promise<{
  cloudUpdatedAt: string | null;
  localUpdatedAt: string | null;
  conflictStatus: CloudSyncStateSnapshot['conflictStatus'];
  errorCode?: string;
  errorMessage?: string;
}> {
  const db = getHeritageFirestore();
  if (!db) {
    return {
      cloudUpdatedAt: syncState.cloudUpdatedAt,
      localUpdatedAt: syncState.localUpdatedAt,
      conflictStatus: syncState.conflictStatus,
    };
  }
  try {
    const snap = await getDocFromServer(doc(db, 'heritage_cloud_sync', 'manifest'));
    const data = snap.exists() ? (snap.data() as { updatedAt?: string }) : null;
    const cloudUpdatedAt = typeof data?.updatedAt === 'string' ? data.updatedAt : null;
    updateSyncState({
      cloudUpdatedAt,
      health: cloudUpdatedAt ? 'synced' : syncState.health,
    });
    return {
      cloudUpdatedAt,
      localUpdatedAt: syncState.localUpdatedAt,
      conflictStatus: getCloudSyncState().conflictStatus,
    };
  } catch (err) {
    const { code, message } = extractFirebaseErrorDetails(err);
    return {
      cloudUpdatedAt: syncState.cloudUpdatedAt,
      localUpdatedAt: syncState.localUpdatedAt,
      conflictStatus: syncState.conflictStatus,
      errorCode: code,
      errorMessage: message,
    };
  }
}

export async function forcePushAllToCloud(
  sitesInput?: HeritageSite[]
): Promise<ChunkedSyncResult> {
  const nowIso = new Date().toISOString();
  const db = getHeritageFirestore();
  const sites = sitesInput && sitesInput.length > 0 ? sitesInput : (DEFAULT_HERITAGE_SITES as HeritageSite[]);

  if (!db) {
    const errMsg = 'Firestore SDK chưa sẵn sàng (kiểm tra firebase-applet-config.json).';
    updateSyncState({
      health: 'local_indexeddb_only',
      isSyncing: false,
      lastErrorCode: 'firestore/not-initialized',
      lastErrorMessage: errMsg,
    });
    appendSyncLog({
      branch: 'heritage_cloud_sync/manifest',
      action: 'push',
      status: 'error',
      message: errMsg,
      errorCode: 'firestore/not-initialized',
      errorMessage: errMsg,
    });
    return {
      ok: false,
      succeededBranches: 0,
      failedBranches: 1,
      strippedBase64Count: 0,
      strippedBase64Bytes: 0,
      updatedAt: nowIso,
      firstErrorCode: 'firestore/not-initialized',
      firstErrorMessage: errMsg,
    };
  }

  updateSyncState({
    isSyncing: true,
    health: 'syncing',
    lastErrorCode: null,
    lastErrorMessage: null,
  });

  const customPhotos = readLocalJson<Record<string, unknown>>(KEY_CUSTOM_SITE_PHOTOS, {});
  const photoCaptions = readLocalJson<Record<string, unknown>>(KEY_PHOTO_CAPTIONS, {});
  const customGlbUrls = readLocalJson<Record<string, string>>(KEY_CUSTOM_GLB_URLS, {});
  const cloudModels = listCloudModelUrls();
  const cloudAudios = listCloudAudioUrls();
  const transforms3D = loadSaved3DTransforms();
  const hotspots3D = loadSaved3DHotspots();
  const cmsOverrides = readLocalJson<Record<string, Record<string, unknown>>>(KEY_CMS_OVERRIDES, {});
  const hiddenIds = readLocalJson<string[]>(KEY_HIDDEN_HERITAGES, []);
  const audioOverrides = readLocalJson<Record<string, Record<string, unknown>>>(KEY_AUDIO_OVERRIDES, {});
  const siteSettings = readLocalJson<Record<string, unknown> | null>(KEY_SITE_SETTINGS, null);
  const siteTranslations = readLocalJson<Record<string, unknown>>(KEY_SITE_TRANSLATIONS, {});
  const mediaCredits = loadMediaCredits();

  let succeededBranches = 0;
  let failedBranches = 0;
  let totalStrippedCount = 0;
  let totalStrippedBytes = 0;
  let firstErrorCode: string | undefined;
  let firstErrorMessage: string | undefined;
  let sawPermissionError = false;

  const pushBranch = async (
    collectionName: string,
    docId: string,
    rawData: Record<string, unknown>
  ): Promise<boolean> => {
    const branchPath = `${collectionName}/${docId}`;
    const startedAt = performance.now();
    const { sanitized, strippedCount, strippedBytes } = sanitizePayloadForCloud(rawData);
    totalStrippedCount += strippedCount;
    totalStrippedBytes += strippedBytes;
    const bytes = estimateJsonBytes(sanitized);

    try {
      await retryWithBackoff(() => setDoc(doc(db, collectionName, docId), sanitized, { merge: true }), 3);
      succeededBranches += 1;
      appendSyncLog({
        branch: branchPath,
        action: 'push',
        status: strippedCount > 0 ? 'warn' : 'ok',
        message:
          strippedCount > 0
            ? `Đồng bộ thành công (đã lọc bỏ ${strippedCount} chuỗi Base64 > 250KB).`
            : 'Đồng bộ nhánh dữ liệu thành công.',
        bytes,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return true;
    } catch (err) {
      failedBranches += 1;
      const info = buildFirestoreErrorInfo(err, OperationType.WRITE, branchPath);
      if (!firstErrorCode) {
        firstErrorCode = info.code;
        firstErrorMessage = info.error;
      }
      if (
        info.code.includes('permission-denied') ||
        info.error.toLowerCase().includes('missing or insufficient permissions')
      ) {
        sawPermissionError = true;
      }
      appendSyncLog({
        branch: branchPath,
        action: 'push',
        status: 'error',
        message: `Ghi thất bại tại nhánh ${branchPath}.`,
        errorCode: info.code,
        errorMessage: info.error,
        bytes,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return false;
    }
  };

  // Run sequentially across independent branches to avoid burst/payload overload
  // Stop early if the very first write fails with permission-denied to keep logs crisp
  const firstSite = sites[0];
  let abortOnPermission = false;

  for (const site of sites) {
    if (abortOnPermission) break;
    const baked = BAKED_ASSETS[site.id];
    const ov = cmsOverrides[site.id] || {};
    const rawPhoto = customPhotos[site.id];
    let p1 = '';
    let p2 = '';
    if (typeof rawPhoto === 'string') {
      p1 = rawPhoto.trim();
    } else if (rawPhoto && typeof rawPhoto === 'object') {
      const pair = rawPhoto as { photo1?: unknown; photo2?: unknown };
      p1 = typeof pair.photo1 === 'string' ? pair.photo1.trim() : '';
      p2 = typeof pair.photo2 === 'string' ? pair.photo2.trim() : '';
    }
    const defPhotos = DEFAULT_SITE_PHOTOS_BY_ID[site.id] || ['', ''];

    // Branch A: sites/{id}
    const okSite = await pushBranch('heritage_sites', site.id, {
      siteId: site.id,
      code: baked?.code || '',
      officialName:
        typeof ov.officialName === 'string' && ov.officialName.trim()
          ? ov.officialName
          : site.officialName,
      photos: [
        normalizeHighResPhotoUrl(p1 || defPhotos[0] || site.photos?.[0] || ''),
        normalizeHighResPhotoUrl(p2 || defPhotos[1] || site.photos?.[1] || ''),
      ],
      captions: photoCaptions[site.id] || null,
      visibility: hiddenIds.includes(site.id) ? 'hidden' : 'published',
      summary: typeof ov.summary === 'string' && ov.summary.trim() ? ov.summary : site.summary,
      chronology:
        typeof ov.chronology === 'string' && ov.chronology.trim()
          ? ov.chronology
          : site.chronology,
      architecturalStyle:
        typeof ov.architecturalStyle === 'string' && ov.architecturalStyle.trim()
          ? ov.architecturalStyle
          : site.architecturalStyle,
      conservationNotes:
        typeof ov.conservationNotes === 'string' && ov.conservationNotes.trim()
          ? ov.conservationNotes
          : site.conservationNotes,
      translations: siteTranslations[site.id] || null,
      updatedAt: nowIso,
    });

    if (!okSite && sawPermissionError && site.id === firstSite?.id) {
      abortOnPermission = true;
      break;
    }

    // Branch B: siteModels/{id}
    const cfg3D = DEFAULT_HERITAGE_3D_CONFIG[site.id];
    const tr = transforms3D[site.id];
    const cloudModel = cloudModels[site.id];
    const resolvedModelUrl =
      cloudModel?.url ||
      customGlbUrls[site.id]?.trim() ||
      baked?.modelUrl ||
      cfg3D?.glbUrl ||
      '';

    await pushBranch('site_models', site.id, {
      siteId: site.id,
      modelUrl: resolvedModelUrl,
      fileName: cloudModel?.fileName || baked?.recommendedModelFileName || `${site.id}.glb`,
      scale: typeof tr?.scale === 'number' ? tr.scale : baked?.modelSettings.scale ?? 1,
      rotationY:
        typeof tr?.rotationY === 'number' ? tr.rotationY : baked?.modelSettings.rotationY ?? 0,
      explosionFactor: baked?.modelSettings.explosionFactor ?? 1.0,
      layerOffsets: baked?.modelSettings.layerOffsets ?? [0, 0.45, 1.0, 1.6],
      hotspots: hotspots3D[site.id] || cfg3D?.hotspots || [],
      updatedAt: nowIso,
    });

    // Branch C: siteAudio/{id}
    const cloudAudio = cloudAudios[site.id];
    const resolvedAudioUrl = cloudAudio?.url || baked?.audioUrl || '';
    await pushBranch('site_audio', site.id, {
      siteId: site.id,
      audioUrl: resolvedAudioUrl,
      fileName: cloudAudio?.fileName || baked?.recommendedAudioFileName || `${site.id}.m4a`,
      durationSec: cloudAudio?.durationSec ?? null,
      scriptOverride: audioOverrides[site.id] || null,
      updatedAt: nowIso,
    });
  }

  if (!abortOnPermission) {
    // Branch D: mediaCredits (split into safe 35-item chunks under Firestore 1MB doc limit)
    const CHUNK_SIZE = 35;
    const totalChunks = Math.max(1, Math.ceil(mediaCredits.length / CHUNK_SIZE));
    for (let i = 0; i < totalChunks; i++) {
      const slice = mediaCredits.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await pushBranch('media_credits', `chunk_${i}`, {
        chunkIndex: i,
        totalChunks,
        items: slice,
        updatedAt: nowIso,
      });
    }

    // Branch E: globalSettings (also includes visitor reviews & quizzes for full cross-device sync)
    await pushBranch('global_settings', 'state', {
      siteSettings: siteSettings || {},
      hiddenHeritageIds: hiddenIds,
      bakedVersion: BAKED_ASSETS_VERSION,
      visitorReviews: readLocalJson<unknown[]>(KEY_VISITOR_REVIEWS, []),
      publishedQuizzes: readLocalJson<unknown[]>(KEY_PUBLISHED_QUIZZES, []),
      quizDrafts: readLocalJson<unknown[]>(KEY_QUIZ_DRAFTS, []),
      updatedAt: nowIso,
    });

    // Branch F: Sync Manifest (updatedAt + lastGlobalSyncAt master marker)
    await pushBranch('heritage_cloud_sync', 'manifest', {
      version: BAKED_ASSETS_VERSION,
      siteCount: sites.length,
      mediaCreditsCount: mediaCredits.length,
      mediaCreditsChunks: totalChunks,
      pushedBy: firebaseAuth.currentUser?.email || 'admin',
      lastGlobalSyncAt: nowIso,
      updatedAt: nowIso,
    });

    // Optional RTDB mirror ONLY if explicitly configured
    if (isFirebaseDbConfigured()) {
      void pushHeritageSitesToFirebase(true).catch(() => undefined);
    }
  }

  const ok = failedBranches === 0 && succeededBranches > 0;
  updateSyncState({
    isSyncing: false,
    health: ok ? 'synced' : sawPermissionError ? 'rules_attention' : 'local_indexeddb_only',
    localUpdatedAt: nowIso,
    ...(ok ? { cloudUpdatedAt: nowIso, lastSyncedAt: nowIso } : {}),
    lastErrorCode: firstErrorCode || null,
    lastErrorMessage: firstErrorMessage || null,
  });

  return {
    ok,
    succeededBranches,
    failedBranches,
    strippedBase64Count: totalStrippedCount,
    strippedBase64Bytes: totalStrippedBytes,
    updatedAt: nowIso,
    firstErrorCode,
    firstErrorMessage,
  };
}

// ============================================================================
// PULL CLOUD TO LOCAL (SAFE MERGE — NEVER WIPES LOCAL INDEXEDDB BLOBS)
// ============================================================================

export async function pullAllFromCloud(): Promise<{
  ok: boolean;
  pulledSites: number;
  pulledModels: number;
  pulledAudios: number;
  pulledCredits: number;
  cloudUpdatedAt: string | null;
  errorCode?: string;
  errorMessage?: string;
}> {
  const db = getHeritageFirestore();
  if (!db) {
    return {
      ok: false,
      pulledSites: 0,
      pulledModels: 0,
      pulledAudios: 0,
      pulledCredits: 0,
      cloudUpdatedAt: null,
      errorCode: 'firestore/not-initialized',
      errorMessage: 'Firestore SDK chưa sẵn sàng.',
    };
  }

  updateSyncState({
    isSyncing: true,
    health: 'syncing',
    lastErrorCode: null,
    lastErrorMessage: null,
  });

  const startedAt = performance.now();
  try {
    const [manifestSnap, sitesSnap, modelsSnap, audioSnap, creditsSnap, settingsSnap] =
      await Promise.all([
        getDoc(doc(db, 'heritage_cloud_sync', 'manifest')),
        getDocs(collection(db, 'heritage_sites')),
        getDocs(collection(db, 'site_models')),
        getDocs(collection(db, 'site_audio')),
        getDocs(collection(db, 'media_credits')),
        getDoc(doc(db, 'global_settings', 'state')),
      ]);

    const manifestData = manifestSnap.exists()
      ? (manifestSnap.data() as { updatedAt?: string })
      : null;
    const cloudUpdatedAt =
      typeof manifestData?.updatedAt === 'string' ? manifestData.updatedAt : null;

    // 1. Apply site metadata + photos
    const nextCustomPhotos = {
      ...readLocalJson<Record<string, unknown>>(KEY_CUSTOM_SITE_PHOTOS, {}),
    };
    const nextCmsOverrides = {
      ...readLocalJson<Record<string, Record<string, unknown>>>(KEY_CMS_OVERRIDES, {}),
    };
    let pulledSites = 0;

    sitesSnap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const siteId = String(data.siteId || docSnap.id);
      if (!siteId) return;
      pulledSites += 1;

      if (Array.isArray(data.photos) && data.photos.length >= 2) {
        const p1 = typeof data.photos[0] === 'string' ? data.photos[0].trim() : '';
        const p2 = typeof data.photos[1] === 'string' ? data.photos[1].trim() : '';
        if (p1 || p2) {
          nextCustomPhotos[siteId] = { photo1: p1, photo2: p2 };
        }
      }
      nextCmsOverrides[siteId] = {
        ...(nextCmsOverrides[siteId] || {}),
        ...(typeof data.officialName === 'string' ? { officialName: data.officialName } : {}),
        ...(typeof data.summary === 'string' ? { summary: data.summary } : {}),
        ...(typeof data.chronology === 'string' ? { chronology: data.chronology } : {}),
        ...(typeof data.architecturalStyle === 'string'
          ? { architecturalStyle: data.architecturalStyle }
          : {}),
        ...(typeof data.conservationNotes === 'string'
          ? { conservationNotes: data.conservationNotes }
          : {}),
      };
    });

    if (pulledSites > 0) {
      writeLocalJson(KEY_CUSTOM_SITE_PHOTOS, nextCustomPhotos);
      writeLocalJson(KEY_CMS_OVERRIDES, nextCmsOverrides);
    }

    // 2. Apply Cloud 3D model URLs + transforms
    const nextCloudModels = { ...listCloudModelUrls() };
    const nextTransforms = { ...loadSaved3DTransforms() };
    const nextHotspots = { ...loadSaved3DHotspots() };
    let pulledModels = 0;

    modelsSnap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const siteId = String(data.siteId || docSnap.id);
      if (!siteId) return;
      pulledModels += 1;

      if (typeof data.modelUrl === 'string' && /^https?:\/\//i.test(data.modelUrl.trim())) {
        nextCloudModels[siteId] = {
          url: data.modelUrl.trim(),
          fileName: String(data.fileName || `${siteId}.glb`),
          updatedAt: String(data.updatedAt || new Date().toISOString()),
        };
      }
      if (typeof data.scale === 'number' && typeof data.rotationY === 'number') {
        nextTransforms[siteId] = {
          scale: data.scale,
          rotationY: data.rotationY,
          updatedAt: String(data.updatedAt || new Date().toISOString()),
        };
      }
      if (Array.isArray(data.hotspots) && data.hotspots.length > 0) {
        nextHotspots[siteId] = data.hotspots as HeritageHotspotFeature[];
      }
    });

    if (pulledModels > 0) {
      writeLocalJson(CLOUD_MODEL_URLS_KEY, nextCloudModels);
      writeLocalJson(TRANSFORMS_3D_STORAGE_KEY, nextTransforms);
      writeLocalJson(HOTSPOTS_3D_STORAGE_KEY, nextHotspots);
    }

    // 3. Apply Cloud Audio URLs + script overrides
    const nextCloudAudios = { ...listCloudAudioUrls() };
    const nextAudioOverrides = {
      ...readLocalJson<Record<string, unknown>>(KEY_AUDIO_OVERRIDES, {}),
    };
    let pulledAudios = 0;

    audioSnap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const siteId = String(data.siteId || docSnap.id);
      if (!siteId) return;
      pulledAudios += 1;

      if (typeof data.audioUrl === 'string' && /^https?:\/\//i.test(data.audioUrl.trim())) {
        nextCloudAudios[siteId] = {
          url: data.audioUrl.trim(),
          fileName: String(data.fileName || `${siteId}.m4a`),
          durationSec: typeof data.durationSec === 'number' ? data.durationSec : undefined,
          updatedAt: String(data.updatedAt || new Date().toISOString()),
        };
      }
      if (data.scriptOverride && typeof data.scriptOverride === 'object') {
        nextAudioOverrides[siteId] = data.scriptOverride;
      }
    });

    if (pulledAudios > 0) {
      writeLocalJson(CLOUD_AUDIO_URLS_KEY, nextCloudAudios);
      writeLocalJson(KEY_AUDIO_OVERRIDES, nextAudioOverrides);
    }

    // 4. Reassemble chunked media credits
    const chunkList: Array<{ idx: number; items: unknown[] }> = [];
    creditsSnap.forEach((docSnap) => {
      const data = docSnap.data() as { chunkIndex?: number; items?: unknown[] };
      if (Array.isArray(data.items)) {
        chunkList.push({
          idx: typeof data.chunkIndex === 'number' ? data.chunkIndex : 0,
          items: data.items,
        });
      }
    });
    chunkList.sort((a, b) => a.idx - b.idx);
    const mergedCredits = chunkList.flatMap((c) => c.items);
    if (mergedCredits.length > 0) {
      saveMediaCredits(mergedCredits as ReturnType<typeof loadMediaCredits>, {
        fromRemote: true,
      });
    }

    // 5. Global settings (+ reviews & quizzes)
    if (settingsSnap.exists()) {
      const sData = settingsSnap.data() as {
        siteSettings?: Record<string, unknown>;
        hiddenHeritageIds?: string[];
        visitorReviews?: unknown[];
        publishedQuizzes?: unknown[];
        quizDrafts?: unknown[];
      };
      if (sData.siteSettings && Object.keys(sData.siteSettings).length > 0) {
        writeLocalJson(KEY_SITE_SETTINGS, sData.siteSettings);
      }
      if (Array.isArray(sData.hiddenHeritageIds)) {
        writeLocalJson(KEY_HIDDEN_HERITAGES, sData.hiddenHeritageIds);
      }
      if (Array.isArray(sData.visitorReviews) && sData.visitorReviews.length > 0) {
        writeLocalJson(KEY_VISITOR_REVIEWS, sData.visitorReviews);
      }
      if (Array.isArray(sData.publishedQuizzes) && sData.publishedQuizzes.length > 0) {
        writeLocalJson(KEY_PUBLISHED_QUIZZES, sData.publishedQuizzes);
      }
      if (Array.isArray(sData.quizDrafts) && sData.quizDrafts.length > 0) {
        writeLocalJson(KEY_QUIZ_DRAFTS, sData.quizDrafts);
      }
    }

    const syncedAt = new Date().toISOString();
    updateSyncState({
      isSyncing: false,
      health: 'synced',
      cloudUpdatedAt: cloudUpdatedAt || syncedAt,
      localUpdatedAt: cloudUpdatedAt || syncedAt,
      lastSyncedAt: syncedAt,
      lastErrorCode: null,
      lastErrorMessage: null,
    });

    appendSyncLog({
      branch: 'heritage_cloud_sync/*',
      action: 'pull',
      status: 'ok',
      message: `Đã kéo Cloud về Local: ${pulledSites} di tích, ${pulledModels} cấu hình 3D, ${pulledAudios} cấu hình thuyết minh, ${mergedCredits.length} nguồn tư liệu.`,
      durationMs: Math.round(performance.now() - startedAt),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dau-an-viet-glb-models-updated'));
      window.dispatchEvent(new CustomEvent('dau-an-viet-cms-updated'));
      window.dispatchEvent(new CustomEvent('heritage_custom_photos_changed'));
      window.dispatchEvent(new CustomEvent('dau-an-viet-3d-config-updated'));
    }

    return {
      ok: true,
      pulledSites,
      pulledModels,
      pulledAudios,
      pulledCredits: mergedCredits.length,
      cloudUpdatedAt,
    };
  } catch (err) {
    const info = buildFirestoreErrorInfo(err, OperationType.GET, 'heritage_cloud_sync/*');
    const isPerm =
      info.code.includes('permission-denied') ||
      info.error.toLowerCase().includes('missing or insufficient permissions');

    updateSyncState({
      isSyncing: false,
      health: isPerm ? 'rules_attention' : 'local_indexeddb_only',
      lastErrorCode: info.code,
      lastErrorMessage: info.error,
    });

    appendSyncLog({
      branch: 'heritage_cloud_sync/*',
      action: 'pull',
      status: 'error',
      message: 'Không thể kéo dữ liệu từ Firebase Cloud.',
      errorCode: info.code,
      errorMessage: info.error,
      durationMs: Math.round(performance.now() - startedAt),
    });

    return {
      ok: false,
      pulledSites: 0,
      pulledModels: 0,
      pulledAudios: 0,
      pulledCredits: 0,
      cloudUpdatedAt: null,
      errorCode: info.code,
      errorMessage: info.error,
    };
  }
}

// ============================================================================
// SMART 4-TIER ASSET RESOLUTION CHAIN (MODELS & AUDIO)
// ============================================================================

const staticHeadProbeCache = new Map<string, boolean>();

export async function probeStaticPublicAsset(urlPath: string): Promise<boolean> {
  if (!urlPath || typeof window === 'undefined') return false;
  if (/^https?:\/\//i.test(urlPath)) return true;
  const cached = staticHeadProbeCache.get(urlPath);
  if (typeof cached === 'boolean') return cached;

  try {
    const res = await fetch(urlPath, { method: 'HEAD', cache: 'no-store' });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const ok = res.ok && !ct.includes('text/html');
    staticHeadProbeCache.set(urlPath, ok);
    return ok;
  } catch {
    staticHeadProbeCache.set(urlPath, false);
    return false;
  }
}

export function invalidateStaticProbeCache(urlPath?: string): void {
  if (urlPath) {
    staticHeadProbeCache.delete(urlPath);
  } else {
    staticHeadProbeCache.clear();
  }
}

function extractBasename(url: string): string {
  try {
    const parsed = new URL(url, 'http://localhost');
    return decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() || url);
  } catch {
    return url.split('/').pop() || url;
  }
}

/**
 * 4-Tier Smart Model Resolution Chain with Auto Cloud-Chunk Pull:
 *   1. Valid Direct CDN / HTTPS URL (GitHub / jsDelivr for >15MB models)
 *   2. Local IndexedDB Vault Blob (`DauAnViet3D_AssetVault` — loads in 0.1s; silently refreshes if Cloud is newer)
 *   3. Chunked Firebase DB auto-pull (`downloadBlobFromRTDB` — streams 350KB chunks into IndexedDB on new devices / Remix)
 *   4. Static baked asset in `public/` (`src/data/bakedAssets.ts`)
 *   5. Safe fallback (`tier: 'fallback'`)
 */
export async function resolveSmartModelAsset(
  siteId: string,
  options?: { autoDownloadFromCloud?: boolean; forceCloudRetry?: boolean }
): Promise<ResolvedSmartAsset> {
  const canonicalId = getCanonicalAssetKey(siteId);
  const autoDownload = options?.autoDownloadFromCloud ?? true;
  const forceCloudRetry = Boolean(options?.forceCloudRetry);

  // Priority 1: Direct HTTPS CDN URL (GitHub / jsDelivr)
  const cloudRec = listCloudModelUrls()[canonicalId] || listCloudModelUrls()[siteId];
  if (cloudRec?.url && /^https?:\/\//i.test(cloudRec.url.trim())) {
    return {
      siteId: canonicalId,
      kind: 'model',
      tier: 'firebase_cloud',
      url: cloudRec.url.trim(),
      fileName: cloudRec.fileName || extractBasename(cloudRec.url),
      fileSize: cloudRec.fileSize ?? null,
      updatedAt: cloudRec.updatedAt || null,
    };
  }

  const customMap = readLocalJson<Record<string, string>>(KEY_CUSTOM_GLB_URLS, {});
  const customUrl = (customMap[canonicalId] || customMap[siteId])?.trim();
  if (customUrl && /^https?:\/\//i.test(customUrl)) {
    return {
      siteId: canonicalId,
      kind: 'model',
      tier: 'firebase_cloud',
      url: customUrl,
      fileName: extractBasename(customUrl),
      fileSize: null,
      updatedAt: null,
    };
  }

  // Priority 2: Local IndexedDB Binary Vault (instant <0.1s load; silent freshness check against Cloud)
  if (!forceCloudRetry) {
    const vaultEntry = await getModelFromVault(canonicalId);
    if (vaultEntry?.objectUrl) {
      if (autoDownload) {
        void fetchCloudAssetMeta('models', canonicalId).then((cloudMeta) => {
          if (!cloudMeta) return;
          const localMs = Date.parse(vaultEntry.updatedAt || '');
          const cloudMs = Date.parse(cloudMeta.updatedAt || '');
          if (
            Number.isFinite(cloudMs) &&
            (!Number.isFinite(localMs) || cloudMs > localMs + 1500)
          ) {
            void downloadBlobFromRTDB('models', canonicalId, { forceRefresh: true });
          }
        });
      }
      return {
        siteId: canonicalId,
        kind: 'model',
        tier: 'indexed_db',
        url: vaultEntry.objectUrl,
        fileName: vaultEntry.fileName,
        fileSize: vaultEntry.fileSize,
        updatedAt: vaultEntry.updatedAt,
      };
    }
  }

  // Priority 3: Automatic Public Chunked Cloud Pull (for Guests, Incognito, and Remix copies)
  if (autoDownload) {
    const cloudMeta = await fetchCloudAssetMeta('models', canonicalId, forceCloudRetry);
    if (cloudMeta && cloudMeta.totalChunks > 0) {
      const pulled = await downloadBlobFromRTDB('models', canonicalId, {
        forceRefresh: forceCloudRetry,
      });
      if (pulled.ok && pulled.entry?.objectUrl) {
        return {
          siteId: canonicalId,
          kind: 'model',
          tier: 'firebase_cloud',
          url: pulled.entry.objectUrl,
          fileName: pulled.entry.fileName,
          fileSize: pulled.entry.fileSize,
          updatedAt: pulled.entry.updatedAt,
        };
      }
    }
  }

  // Priority 4: Static Source Code (`bakedAssets.ts` + `public/`)
  const candidates = Array.from(
    new Set(
      [
        ...(customUrl && customUrl.startsWith('/') ? [customUrl] : []),
        ...getBakedModelCandidateUrls(canonicalId),
      ].filter(Boolean)
    )
  );

  for (const candidate of candidates) {
    const exists = await probeStaticPublicAsset(candidate);
    if (exists) {
      return {
        siteId: canonicalId,
        kind: 'model',
        tier: 'static_source',
        url: candidate,
        fileName: extractBasename(candidate),
        fileSize: null,
        updatedAt: BAKED_ASSETS[canonicalId]?.updatedAt || null,
      };
    }
  }

  // Priority 5: Safe Fallback
  return {
    siteId: canonicalId,
    kind: 'model',
    tier: 'fallback',
    url: null,
    fileName: null,
    fileSize: null,
    updatedAt: null,
  };
}

/**
 * 4-Tier Smart Audio Resolution Chain with Auto Cloud-Chunk Pull:
 *   1. Valid Direct CDN / HTTPS URL (GitHub / jsDelivr)
 *   2. Local IndexedDB Vault Blob (`DauAnViet3D_AssetVault` — instant load; silent freshness check)
 *   3. Chunked Firebase DB auto-pull (`downloadBlobFromRTDB` — caches into IndexedDB automatically)
 *   4. Static baked asset in `public/` (auto-detects `.m4a` and `.mp3`)
 *   5. Safe fallback (Multilingual Web Speech API TTS)
 */
export async function resolveSmartAudioAsset(
  siteId: string,
  options?: { autoDownloadFromCloud?: boolean }
): Promise<ResolvedSmartAsset> {
  const autoDownload = options?.autoDownloadFromCloud ?? true;

  // Priority 1: Direct HTTPS CDN URL
  const cloudRec = listCloudAudioUrls()[siteId];
  if (cloudRec?.url && /^https?:\/\//i.test(cloudRec.url.trim())) {
    return {
      siteId,
      kind: 'audio',
      tier: 'firebase_cloud',
      url: cloudRec.url.trim(),
      fileName: cloudRec.fileName || extractBasename(cloudRec.url),
      fileSize: cloudRec.fileSize ?? null,
      durationSec: cloudRec.durationSec,
      updatedAt: cloudRec.updatedAt || null,
    };
  }

  // Priority 2: Local IndexedDB Binary Vault
  const vaultEntry = await getAudioFromVault(siteId);
  if (vaultEntry?.objectUrl) {
    if (autoDownload) {
      void fetchCloudAssetMeta('audio', siteId).then((cloudMeta) => {
        if (!cloudMeta) return;
        const localMs = Date.parse(vaultEntry.updatedAt || '');
        const cloudMs = Date.parse(cloudMeta.updatedAt || '');
        if (
          Number.isFinite(cloudMs) &&
          (!Number.isFinite(localMs) || cloudMs > localMs + 1500)
        ) {
          void downloadBlobFromRTDB('audio', siteId, { forceRefresh: true });
        }
      });
    }
    return {
      siteId,
      kind: 'audio',
      tier: 'indexed_db',
      url: vaultEntry.objectUrl,
      fileName: vaultEntry.fileName,
      fileSize: vaultEntry.fileSize,
      durationSec: vaultEntry.durationSec,
      updatedAt: vaultEntry.updatedAt,
    };
  }

  // Priority 3: Automatic Chunked Cloud Pull (for new accounts, new devices, or Remix copies)
  if (autoDownload) {
    const cloudMeta = await fetchCloudAssetMeta('audio', siteId);
    if (cloudMeta && cloudMeta.totalChunks > 0) {
      const pulled = await downloadBlobFromRTDB('audio', siteId);
      if (pulled.ok && pulled.entry?.objectUrl) {
        return {
          siteId,
          kind: 'audio',
          tier: 'firebase_cloud',
          url: pulled.entry.objectUrl,
          fileName: pulled.entry.fileName,
          fileSize: pulled.entry.fileSize,
          durationSec: pulled.entry.durationSec,
          updatedAt: pulled.entry.updatedAt,
        };
      }
    }
  }

  // Priority 4: Static Source Code (`public/assets/aistudio/*.m4a`, `public/audio/{slug}.m4a` & `.mp3`)
  const candidates = getBakedAudioCandidateUrls(siteId);
  for (const candidate of candidates) {
    const exists = await probeStaticPublicAsset(candidate);
    if (exists) {
      return {
        siteId,
        kind: 'audio',
        tier: 'static_source',
        url: candidate,
        fileName: extractBasename(candidate),
        fileSize: null,
        updatedAt: BAKED_ASSETS[siteId]?.updatedAt || null,
      };
    }
  }

  // Priority 5: Safe Fallback (Web Speech API)
  return {
    siteId,
    kind: 'audio',
    tier: 'fallback',
    url: null,
    fileName: null,
    fileSize: null,
    updatedAt: null,
  };
}

// ============================================================================
// ASSET INTEGRITY MATRIX (17/17 MONUMENTS AUDIT)
// ============================================================================

function resolvePrimaryStorageLabels(
  modelTier: AssetResolutionTier,
  audioTier: AssetResolutionTier
): { vi: string; en: string; zh: string } {
  const tiers = [modelTier, audioTier];
  if (tiers.includes('firebase_cloud')) {
    return { vi: 'Firebase Cloud', en: 'Firebase Cloud', zh: 'Firebase 云端' };
  }
  if (tiers.includes('indexed_db')) {
    return { vi: 'Cục bộ IndexedDB', en: 'Local IndexedDB', zh: '本地 IndexedDB' };
  }
  if (tiers.includes('static_source')) {
    return { vi: 'Mã nguồn tĩnh', en: 'Static Source Code', zh: '静态源码固化' };
  }
  return { vi: 'Chưa có', en: 'Unassigned', zh: '尚未配置' };
}

export async function auditAll17SitesAssets(
  sitesInput?: HeritageSite[]
): Promise<{
  rows: SiteAssetAuditRow[];
  vaultModels: Record<string, VaultAssetMeta>;
  vaultAudios: Record<string, VaultAssetMeta>;
  cloudModelsMeta: Record<string, ChunkedAssetMeta>;
  cloudAudiosMeta: Record<string, ChunkedAssetMeta>;
}> {
  const sites =
    sitesInput && sitesInput.length > 0 ? sitesInput : (DEFAULT_HERITAGE_SITES as HeritageSite[]);
  const customPhotos = readLocalJson<Record<string, unknown>>(KEY_CUSTOM_SITE_PHOTOS, {});
  const customGlbUrls = readLocalJson<Record<string, string>>(KEY_CUSTOM_GLB_URLS, {});
  const cloudModelUrls = listCloudModelUrls();
  const cloudAudioUrls = listCloudAudioUrls();

  const [vaultModels, vaultAudios, cloudMetas] = await Promise.all([
    listVaultModelsMeta(),
    listVaultAudioMeta(),
    listAllCloudAssetMetas(),
  ]);

  const rows = await Promise.all(
    sites.map(async (site, idx) => {
      const baked = BAKED_ASSETS[site.id];
      const code = baked?.code || String(idx + 1).padStart(2, '0');
      const slug = baked?.slug || `${code}-${site.id.toLowerCase()}`;

      const rawCustomPhoto = customPhotos[site.id];
      let p1 = '';
      let p2 = '';
      if (typeof rawCustomPhoto === 'string') {
        p1 = rawCustomPhoto.trim();
      } else if (rawCustomPhoto && typeof rawCustomPhoto === 'object') {
        const pair = rawCustomPhoto as { photo1?: unknown; photo2?: unknown };
        p1 = typeof pair.photo1 === 'string' ? pair.photo1.trim() : '';
        p2 = typeof pair.photo2 === 'string' ? pair.photo2.trim() : '';
      }
      const defPhotos = DEFAULT_SITE_PHOTOS_BY_ID[site.id] || ['', ''];
      const photo1 = p1 || defPhotos[0] || site.photos?.[0] || '';
      const photo2 = p2 || defPhotos[1] || site.photos?.[1] || '';
      const photoCount = (photo1 ? 1 : 0) + (photo2 ? 1 : 0);

      // Audit without triggering mass background downloads
      const [resolvedModel, resolvedAudio] = await Promise.all([
        resolveSmartModelAsset(site.id, { autoDownloadFromCloud: false }),
        resolveSmartAudioAsset(site.id, { autoDownloadFromCloud: false }),
      ]);

      const cloudModelMeta = cloudMetas.models[site.id];
      const cloudAudioMeta = cloudMetas.audio[site.id];

      const effectiveModelTier: AssetResolutionTier =
        resolvedModel.tier !== 'fallback'
          ? cloudModelMeta && resolvedModel.tier === 'indexed_db'
            ? 'firebase_cloud'
            : resolvedModel.tier
          : cloudModelMeta
          ? 'firebase_cloud'
          : 'fallback';

      const effectiveAudioTier: AssetResolutionTier =
        resolvedAudio.tier !== 'fallback'
          ? cloudAudioMeta && resolvedAudio.tier === 'indexed_db'
            ? 'firebase_cloud'
            : resolvedAudio.tier
          : cloudAudioMeta
          ? 'firebase_cloud'
          : 'fallback';

      const scriptVi = getCuratedAudioScript(site.id, 'vi');
      const hasScriptNarration = Boolean(
        scriptVi && scriptVi.chapters && scriptVi.chapters.length > 0
      );

      const directModelUrl =
        cloudModelUrls[site.id]?.url ||
        (customGlbUrls[site.id] && /^https?:\/\//i.test(customGlbUrls[site.id])
          ? customGlbUrls[site.id]
          : '') ||
        '';
      const directAudioUrl = cloudAudioUrls[site.id]?.url || '';

      const labels = resolvePrimaryStorageLabels(effectiveModelTier, effectiveAudioTier);

      return {
        siteId: site.id,
        code,
        slug,
        officialName: site.officialName,
        hasPhotos: photoCount >= 2,
        photoCount,
        photoUrls: [photo1, photo2] as [string, string],
        modelTier: effectiveModelTier,
        modelUrl: resolvedModel.url,
        modelFileName: resolvedModel.fileName || cloudModelMeta?.fileName || null,
        directModelUrl,
        cloudModelChunks: cloudModelMeta?.totalChunks || 0,
        recommendedModelPath: `public/models/${baked?.recommendedModelFileName || `${slug}.glb`}`,
        audioTier: effectiveAudioTier,
        audioUrl: resolvedAudio.url,
        audioFileName: resolvedAudio.fileName || cloudAudioMeta?.fileName || null,
        directAudioUrl,
        cloudAudioChunks: cloudAudioMeta?.totalChunks || 0,
        hasScriptNarration,
        recommendedAudioPath: `public/audio/${baked?.recommendedAudioFileName || `${slug}.m4a`}`,
        primaryStorageLabelVi: labels.vi,
        primaryStorageLabelEn: labels.en,
        primaryStorageLabelZh: labels.zh,
      } satisfies SiteAssetAuditRow;
    })
  );

  return {
    rows,
    vaultModels,
    vaultAudios,
    cloudModelsMeta: cloudMetas.models,
    cloudAudiosMeta: cloudMetas.audio,
  };
}

// ============================================================================
// SOURCE-CODE BAKER (`bakedAssets.ts` GENERATOR) & `.json` MIGRATION SNAPSHOT
// ============================================================================

export async function generateBakedAssetsTypeScriptCode(
  sitesInput?: HeritageSite[]
): Promise<string> {
  const sites =
    sitesInput && sitesInput.length > 0 ? sitesInput : (DEFAULT_HERITAGE_SITES as HeritageSite[]);
  const { rows } = await auditAll17SitesAssets(sites);
  const transforms3D = loadSaved3DTransforms();
  const mediaCredits = loadMediaCredits();
  const nowIso = new Date().toISOString();

  const entriesPayload = rows.map((row) => {
    const baked = BAKED_ASSETS[row.siteId];
    const tr = transforms3D[row.siteId];
    const scriptVi = getCuratedAudioScript(row.siteId, 'vi') || AUDIO_GUIDE_SCRIPTS[row.siteId]?.vi;

    // Never emit temporary blob: URLs into permanent TypeScript source code;
    // map IndexedDB uploads to their canonical public/models/ and public/audio/ paths.
    const exportModelUrl =
      row.modelTier === 'firebase_cloud' && row.modelUrl
        ? row.modelUrl
        : row.modelTier === 'static_source' && row.modelUrl
        ? row.modelUrl
        : `/${row.recommendedModelPath.replace(/^public\//, '')}`;

    const exportAudioUrl =
      row.audioTier === 'firebase_cloud' && row.audioUrl
        ? row.audioUrl
        : row.audioTier === 'static_source' && row.audioUrl
        ? row.audioUrl
        : `/${row.recommendedAudioPath.replace(/^public\//, '')}`;

    return {
      siteId: row.siteId,
      code: row.code,
      slug: row.slug,
      officialName: row.officialName,
      photos: row.photoUrls,
      modelUrl: exportModelUrl,
      modelFallbackUrls: Array.from(
        new Set([
          `/${row.recommendedModelPath.replace(/^public\//, '')}`,
          ...(baked?.modelFallbackUrls || []),
        ])
      ).filter((u) => u !== exportModelUrl),
      recommendedModelFileName: baked?.recommendedModelFileName || `${row.slug}.glb`,
      audioUrl: exportAudioUrl,
      audioFallbackUrls: Array.from(
        new Set([
          `/${row.recommendedAudioPath.replace(/^public\//, '')}`,
          `/${row.recommendedAudioPath.replace(/^public\//, '').replace(/\.m4a$/i, '.mp3')}`,
        ])
      ).filter((u) => u !== exportAudioUrl),
      recommendedAudioFileName: baked?.recommendedAudioFileName || `${row.slug}.m4a`,
      vietnameseNarrationSummary: scriptVi
        ? {
            folioTitle: scriptVi.folioTitle,
            chapters: scriptVi.chapters.map((c) => ({
              id: c.id,
              roman: c.roman,
              title: c.title,
              durationSec: c.durationSec,
              narration: c.narration,
            })),
          }
        : null,
      modelSettings: {
        position: baked?.modelSettings.position || [0, 0, 0],
        scale: typeof tr?.scale === 'number' ? tr.scale : baked?.modelSettings.scale ?? 1,
        rotationY:
          typeof tr?.rotationY === 'number' ? tr.rotationY : baked?.modelSettings.rotationY ?? 0,
        cameraPos: baked?.modelSettings.cameraPos || [22, 18, 34],
        cameraTarget: baked?.modelSettings.cameraTarget || [0, 6, 0],
        explosionFactor: baked?.modelSettings.explosionFactor ?? 1.0,
        layerOffsets: baked?.modelSettings.layerOffsets ?? [0, 0.45, 1.0, 1.6],
        mode: baked?.modelSettings.mode || 'interactive_3d_museum',
      },
      updatedAt: nowIso,
    };
  });

  const mediaCreditsSummary = mediaCredits.map((c) => ({
    id: c.id,
    siteId: c.siteId,
    category: c.category,
    title: c.title,
    sourceAuthor: c.sourceAuthor,
    licenseNote: c.licenseNote,
    url: c.url || '',
    yearOrPeriod: c.yearOrPeriod || '',
  }));

  return [
    `/**`,
    ` * DAU AN VIET 3D — BAKED STATIC ASSETS SOURCE OF TRUTH`,
    ` * Generated by Admin Studio Source-Code Baker at ${nowIso}`,
    ` * Total Monuments: ${entriesPayload.length} | Catalogued Media Credits: ${mediaCreditsSummary.length}`,
    ` *`,
    ` * Migration Instructions:`,
    ` *   1. Replace src/data/bakedAssets.ts with this file.`,
    ` *   2. Place binary 3D models into public/models/{recommendedModelFileName}.`,
    ` *   3. Place Vietnamese voice recordings into public/audio/{recommendedAudioFileName}.`,
    ` */`,
    ``,
    `import type { Heritage3DModelMode } from './heritage3DConfig';`,
    ``,
    `export interface BakedModelSettings {`,
    `  position: [number, number, number];`,
    `  scale: number;`,
    `  rotationY: number;`,
    `  cameraPos: [number, number, number];`,
    `  cameraTarget: [number, number, number];`,
    `  explosionFactor: number;`,
    `  layerOffsets: [number, number, number, number];`,
    `  mode: Heritage3DModelMode;`,
    `}`,
    ``,
    `export interface BakedAssetEntry {`,
    `  siteId: string;`,
    `  code: string;`,
    `  slug: string;`,
    `  officialName: string;`,
    `  photos?: [string, string];`,
    `  modelUrl: string;`,
    `  modelFallbackUrls: string[];`,
    `  recommendedModelFileName: string;`,
    `  audioUrl: string;`,
    `  audioFallbackUrls: string[];`,
    `  recommendedAudioFileName: string;`,
    `  vietnameseNarrationSummary?: {`,
    `    folioTitle: string;`,
    `    chapters: Array<{ id: string; roman: string; title: string; durationSec: number; narration: string }>;`,
    `  } | null;`,
    `  modelSettings: BakedModelSettings;`,
    `  updatedAt: string;`,
    `}`,
    ``,
    `export const BAKED_ASSETS_VERSION = ${JSON.stringify(`baked-${nowIso.slice(0, 10)}`)};`,
    `export const BAKED_ASSETS_UPDATED_AT = ${JSON.stringify(nowIso)};`,
    ``,
    `export const BAKED_ASSETS_LIST: readonly BakedAssetEntry[] = ${JSON.stringify(entriesPayload, null, 2)};`,
    ``,
    `export const BAKED_ASSETS: Record<string, BakedAssetEntry> = Object.fromEntries(`,
    `  BAKED_ASSETS_LIST.map((entry) => [entry.siteId, entry])`,
    `);`,
    ``,
    `export const BAKED_MEDIA_CREDITS_SNAPSHOT = ${JSON.stringify(mediaCreditsSummary, null, 2)};`,
    ``,
    `export function getBakedAsset(siteId: string): BakedAssetEntry | null {`,
    `  return BAKED_ASSETS[siteId] || null;`,
    `}`,
    ``,
    `export function getBakedModelCandidateUrls(siteId: string): string[] {`,
    `  const entry = BAKED_ASSETS[siteId];`,
    `  if (!entry) return [];`,
    `  return Array.from(new Set([entry.modelUrl, ...entry.modelFallbackUrls].filter(Boolean)));`,
    `}`,
    ``,
    `export function getBakedAudioCandidateUrls(siteId: string): string[] {`,
    `  const entry = BAKED_ASSETS[siteId];`,
    `  if (!entry) return [];`,
    `  return Array.from(new Set([entry.audioUrl, ...entry.audioFallbackUrls].filter(Boolean)));`,
    `}`,
    ``,
  ].join('\n');
}

export interface FullMigrationSnapshot {
  schema: 'dau_an_viet_3d_migration_snapshot_v3';
  exportedAt: string;
  bakedVersion: string;
  siteCount: number;
  cloudModelUrls: Record<string, CloudAssetUrlRecord>;
  cloudAudioUrls: Record<string, CloudAssetUrlRecord>;
  customGlbUrls: Record<string, string>;
  customSitePhotos: Record<string, unknown>;
  photoCaptionOverrides: Record<string, unknown>;
  transforms3D: Record<string, unknown>;
  hotspots3D: Record<string, unknown>;
  cmsOverrides: Record<string, unknown>;
  hiddenHeritageIds: string[];
  audioOverrides: Record<string, unknown>;
  siteTranslationsOverride: Record<string, unknown>;
  siteSettings: Record<string, unknown> | null;
  mediaCredits: ReturnType<typeof loadMediaCredits>;
  expectedPublicFiles: Array<{
    siteId: string;
    code: string;
    officialName: string;
    modelPath: string;
    audioPath: string;
  }>;
}

export function buildFullMigrationSnapshot(sitesInput?: HeritageSite[]): FullMigrationSnapshot {
  const sites =
    sitesInput && sitesInput.length > 0 ? sitesInput : (DEFAULT_HERITAGE_SITES as HeritageSite[]);

  return {
    schema: 'dau_an_viet_3d_migration_snapshot_v3',
    exportedAt: new Date().toISOString(),
    bakedVersion: BAKED_ASSETS_VERSION,
    siteCount: sites.length,
    cloudModelUrls: listCloudModelUrls(),
    cloudAudioUrls: listCloudAudioUrls(),
    customGlbUrls: readLocalJson<Record<string, string>>(KEY_CUSTOM_GLB_URLS, {}),
    customSitePhotos: readLocalJson<Record<string, unknown>>(KEY_CUSTOM_SITE_PHOTOS, {}),
    photoCaptionOverrides: readLocalJson<Record<string, unknown>>(KEY_PHOTO_CAPTIONS, {}),
    transforms3D: loadSaved3DTransforms(),
    hotspots3D: loadSaved3DHotspots(),
    cmsOverrides: readLocalJson<Record<string, unknown>>(KEY_CMS_OVERRIDES, {}),
    hiddenHeritageIds: readLocalJson<string[]>(KEY_HIDDEN_HERITAGES, []),
    audioOverrides: readLocalJson<Record<string, unknown>>(KEY_AUDIO_OVERRIDES, {}),
    siteTranslationsOverride: readLocalJson<Record<string, unknown>>(KEY_SITE_TRANSLATIONS, {}),
    siteSettings: readLocalJson<Record<string, unknown> | null>(KEY_SITE_SETTINGS, null),
    mediaCredits: loadMediaCredits(),
    expectedPublicFiles: BAKED_ASSETS_LIST.map((entry) => ({
      siteId: entry.siteId,
      code: entry.code,
      officialName: entry.officialName,
      modelPath: `public/models/${entry.recommendedModelFileName}`,
      audioPath: `public/audio/${entry.recommendedAudioFileName}`,
    })),
  };
}

export function importFullMigrationSnapshot(rawJsonText: string): {
  ok: boolean;
  restoredSections: string[];
  error?: string;
} {
  try {
    const parsed = JSON.parse(rawJsonText) as Partial<FullMigrationSnapshot>;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, restoredSections: [], error: 'Tệp JSON không đúng định dạng cấu trúc.' };
    }

    const restored: string[] = [];

    if (parsed.cloudModelUrls && typeof parsed.cloudModelUrls === 'object') {
      writeLocalJson(CLOUD_MODEL_URLS_KEY, parsed.cloudModelUrls);
      restored.push('cloudModelUrls');
    }
    if (parsed.cloudAudioUrls && typeof parsed.cloudAudioUrls === 'object') {
      writeLocalJson(CLOUD_AUDIO_URLS_KEY, parsed.cloudAudioUrls);
      restored.push('cloudAudioUrls');
    }
    if (parsed.customGlbUrls && typeof parsed.customGlbUrls === 'object') {
      writeLocalJson(KEY_CUSTOM_GLB_URLS, parsed.customGlbUrls);
      restored.push('customGlbUrls');
    }
    if (parsed.customSitePhotos && typeof parsed.customSitePhotos === 'object') {
      writeLocalJson(KEY_CUSTOM_SITE_PHOTOS, parsed.customSitePhotos);
      restored.push('customSitePhotos');
    }
    if (parsed.photoCaptionOverrides && typeof parsed.photoCaptionOverrides === 'object') {
      writeLocalJson(KEY_PHOTO_CAPTIONS, parsed.photoCaptionOverrides);
      restored.push('photoCaptionOverrides');
    }
    if (parsed.transforms3D && typeof parsed.transforms3D === 'object') {
      writeLocalJson(TRANSFORMS_3D_STORAGE_KEY, parsed.transforms3D);
      restored.push('transforms3D');
    }
    if (parsed.hotspots3D && typeof parsed.hotspots3D === 'object') {
      writeLocalJson(HOTSPOTS_3D_STORAGE_KEY, parsed.hotspots3D);
      restored.push('hotspots3D');
    }
    if (parsed.cmsOverrides && typeof parsed.cmsOverrides === 'object') {
      writeLocalJson(KEY_CMS_OVERRIDES, parsed.cmsOverrides);
      restored.push('cmsOverrides');
    }
    if (Array.isArray(parsed.hiddenHeritageIds)) {
      writeLocalJson(KEY_HIDDEN_HERITAGES, parsed.hiddenHeritageIds);
      restored.push('hiddenHeritageIds');
    }
    if (parsed.audioOverrides && typeof parsed.audioOverrides === 'object') {
      writeLocalJson(KEY_AUDIO_OVERRIDES, parsed.audioOverrides);
      restored.push('audioOverrides');
    }
    if (parsed.siteTranslationsOverride && typeof parsed.siteTranslationsOverride === 'object') {
      writeLocalJson(KEY_SITE_TRANSLATIONS, parsed.siteTranslationsOverride);
      restored.push('siteTranslationsOverride');
    }
    if (parsed.siteSettings && typeof parsed.siteSettings === 'object') {
      writeLocalJson(KEY_SITE_SETTINGS, parsed.siteSettings);
      restored.push('siteSettings');
    }
    if (Array.isArray(parsed.mediaCredits) && parsed.mediaCredits.length > 0) {
      saveMediaCredits(parsed.mediaCredits, { fromRemote: true });
      restored.push('mediaCredits');
    }

    markLocalAssetsMutated();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('dau-an-viet-glb-models-updated'));
      window.dispatchEvent(new CustomEvent('dau-an-viet-cms-updated'));
      window.dispatchEvent(new CustomEvent('heritage_custom_photos_changed'));
      window.dispatchEvent(new CustomEvent('dau-an-viet-3d-config-updated'));
    }

    return { ok: true, restoredSections: restored };
  } catch (err) {
    return {
      ok: false,
      restoredSections: [],
      error: err instanceof Error ? err.message : 'Không thể phân tích tệp JSON di trú.',
    };
  }
}

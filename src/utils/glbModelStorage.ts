import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_HERITAGE_3D_CONFIG } from '../data/heritage3DConfig';
import { BAKED_ASSETS, getBakedModelCandidateUrls } from '../data/bakedAssets';
import { ASSET_VAULT_UPDATED_EVENT, deleteModelFromVault } from './assetVault';
import {
  CLOUD_ASSETS_MANIFEST_READY_EVENT,
  clearCloudAssetError,
  findCloudMetaInRam,
  invalidateCloudMetaCache,
  invalidateStaticProbeCache,
  resolveSmartModelAsset,
  saveCloudModelUrl,
  uploadAssetBinaryToFirebaseStorage,
} from './cloudSync';
import { pushHeritageSitesToFirebase, resolveFirebaseGlbPointer } from './firebaseRestSync';

export const GLB_MODELS_UPDATED_EVENT = 'dau-an-viet-glb-models-updated';

const LEGACY_GLB_IDB_NAME = 'dau_an_viet_glb_db';
const CUSTOM_GLB_URLS_KEY = 'dau_an_viet_custom_glb_urls_v1';
const CUSTOM_GLB_PREFERRED_MODE_KEY = 'dau_an_viet_custom_glb_mode_v1';

export type GlbSourceKind =
  | 'session_temp'
  | 'public_asset'
  | 'remote_url'
  | 'indexed_db'
  | 'none';

export interface StoredGlbMetadata {
  siteId: string;
  fileName: string;
  fileSize: number;
  updatedAt: string;
  publicUrl?: string;
}

export interface ResolvedGlbSource {
  siteId: string;
  kind: GlbSourceKind;
  url: string | null;
  fileName: string | null;
  fileSize: number | null;
  updatedAt: string | null;
  remoteUrl: string;
  hasPublicAsset: boolean;
  publicAssetUrl: string | null;
  expectedPublicPath: string | null;
  hasSessionTempFile?: boolean;
}

export interface SiteGlbBadgeInfo {
  siteId: string;
  kind: 'session_temp' | 'public_asset' | 'remote_url' | 'indexed_db';
  label: string;
  fileSize?: number;
  updatedAt?: string;
}

// Session cache for IndexedDB Object URLs and resolved Firebase GLB pointers
const indexedDbGlbObjectUrlCache = new Map<
  string,
  { url: string; fileName: string; fileSize: number | null; updatedAt: string | null }
>();
const firebaseGlbResolvedUrlCache = new Map<string, string>();

async function readGlbFromIndexedDb(
  siteId: string
): Promise<{ url: string; fileName: string; fileSize: number | null; updatedAt: string | null } | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;
  const cached = indexedDbGlbObjectUrlCache.get(siteId);
  if (cached) return cached;

  try {
    const dbs =
      typeof window.indexedDB.databases === 'function'
        ? await window.indexedDB.databases().catch(() => [])
        : null;
    if (Array.isArray(dbs) && !dbs.some((d) => d.name === LEGACY_GLB_IDB_NAME)) {
      return null;
    }

    return await new Promise((resolve) => {
      const req = window.indexedDB.open(LEGACY_GLB_IDB_NAME);
      req.onerror = () => resolve(null);
      req.onupgradeneeded = (ev) => {
        // Do not create an empty database if it didn't exist before
        try {
          req.transaction?.abort();
        } catch {
          // ignore
        }
        const db = (ev.target as IDBOpenDBRequest).result;
        db?.close();
        resolve(null);
      };
      req.onsuccess = () => {
        const db = req.result;
        const storeNames = Array.from(db.objectStoreNames);
        if (storeNames.length === 0) {
          db.close();
          resolve(null);
          return;
        }
        const preferredStore =
          storeNames.find((n) => /glb|model/i.test(n)) || storeNames[0];
        try {
          const tx = db.transaction(preferredStore, 'readonly');
          const store = tx.objectStore(preferredStore);
          const getReq = store.get(siteId);
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
          getReq.onsuccess = () => {
            const record = getReq.result as
              | Blob
              | ArrayBuffer
              | {
                  blob?: Blob;
                  file?: Blob;
                  buffer?: ArrayBuffer;
                  dataUrl?: string;
                  fileName?: string;
                  fileSize?: number;
                  updatedAt?: string;
                }
              | undefined;
            db.close();
            if (!record) {
              resolve(null);
              return;
            }
            let objectUrl = '';
            let fileName = `${siteId}.glb`;
            let fileSize: number | null = null;
            let updatedAt: string | null = null;

            if (record instanceof Blob) {
              objectUrl = URL.createObjectURL(record);
              fileSize = record.size;
            } else if (record instanceof ArrayBuffer) {
              const blob = new Blob([record], { type: 'model/gltf-binary' });
              objectUrl = URL.createObjectURL(blob);
              fileSize = record.byteLength;
            } else if (typeof record === 'object') {
              const blobSource = record.blob || record.file;
              if (blobSource instanceof Blob) {
                objectUrl = URL.createObjectURL(blobSource);
                fileSize = record.fileSize ?? blobSource.size;
              } else if (record.buffer instanceof ArrayBuffer) {
                const blob = new Blob([record.buffer], { type: 'model/gltf-binary' });
                objectUrl = URL.createObjectURL(blob);
                fileSize = record.fileSize ?? record.buffer.byteLength;
              } else if (typeof record.dataUrl === 'string' && record.dataUrl.trim()) {
                objectUrl = record.dataUrl.trim();
                fileSize = record.fileSize ?? null;
              }
              if (typeof record.fileName === 'string' && record.fileName.trim()) {
                fileName = record.fileName.trim();
              }
              if (typeof record.updatedAt === 'string') {
                updatedAt = record.updatedAt;
              }
            }

            if (!objectUrl) {
              resolve(null);
              return;
            }

            const entry = { url: objectUrl, fileName, fileSize, updatedAt };
            indexedDbGlbObjectUrlCache.set(siteId, entry);
            resolve(entry);
          };
        } catch {
          db.close();
          resolve(null);
        }
      };
    });
  } catch {
    return null;
  }
}

// Browser-RAM-only temporary `.glb` models uploaded by Tester Pro
const sessionTempGlbMap = new Map<
  string,
  { url: string; fileName: string; fileSize: number; updatedAt: string }
>();

// Session cache for HEAD verification of static `public/` `.glb` paths (prevents GLTFLoader crashing on SPA HTML fallbacks)
const publicGlbAvailabilityCache = new Map<string, boolean>();

async function checkPublicAssetExists(urlPath: string): Promise<boolean> {
  if (!urlPath || typeof window === 'undefined') return false;
  const cached = publicGlbAvailabilityCache.get(urlPath);
  if (typeof cached === 'boolean') return cached;
  try {
    const res = await fetch(urlPath, { method: 'HEAD', cache: 'no-store' });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const exists = res.ok && !ct.includes('text/html');
    publicGlbAvailabilityCache.set(urlPath, exists);
    return exists;
  } catch {
    publicGlbAvailabilityCache.set(urlPath, false);
    return false;
  }
}

function invalidatePublicAssetCache(urlPath?: string): void {
  if (urlPath) {
    publicGlbAvailabilityCache.delete(urlPath);
  } else {
    publicGlbAvailabilityCache.clear();
  }
}

export function setSessionTempGlb(siteId: string, file: File): StoredGlbMetadata {
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith('.glb') && !lowerName.endsWith('.gltf')) {
    throw new Error('Vui lòng chọn tệp mô hình 3D định dạng .glb hoặc .gltf');
  }
  const prev = sessionTempGlbMap.get(siteId);
  if (prev?.url) {
    try {
      URL.revokeObjectURL(prev.url);
    } catch {
      // ignore
    }
  }
  const updatedAt = new Date().toISOString();
  const url = URL.createObjectURL(file);
  sessionTempGlbMap.set(siteId, {
    url,
    fileName: file.name,
    fileSize: file.size,
    updatedAt,
  });
  emitGlbUpdated(siteId);
  return {
    siteId,
    fileName: file.name,
    fileSize: file.size,
    updatedAt,
  };
}

export function clearSessionTempGlb(siteId: string): void {
  const prev = sessionTempGlbMap.get(siteId);
  if (prev?.url) {
    try {
      URL.revokeObjectURL(prev.url);
    } catch {
      // ignore
    }
  }
  sessionTempGlbMap.delete(siteId);
  emitGlbUpdated(siteId);
}

export function hasSessionTempGlb(siteId: string): boolean {
  return sessionTempGlbMap.has(siteId);
}

function emitGlbUpdated(siteId?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GLB_MODELS_UPDATED_EVENT, { detail: { siteId } }));
}

export function formatGlbFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Normalize common GitHub / Cloud / Firebase / relative `public/` `.glb` URLs so GLTFLoader can fetch raw binary directly.
 */
export function normalizeExternalGlbUrl(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('/') ||
    /^firebase-glb:\/\//i.test(trimmed) ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

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

function readJsonRecord<T extends Record<string, string>>(key: string): T {
  if (typeof window === 'undefined') return {} as T;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {} as T;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed as T;
  } catch {
    // ignore storage errors
  }
  return {} as T;
}

function writeJsonRecord(key: string, data: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function listCustomGlbUrls(): Record<string, string> {
  return readJsonRecord(CUSTOM_GLB_URLS_KEY);
}

export function getCustomGlbUrl(siteId: string): string {
  const map = listCustomGlbUrls();
  return map[siteId] || '';
}

function getPreferredModes(): Record<string, 'public_asset' | 'remote_url'> {
  return readJsonRecord(CUSTOM_GLB_PREFERRED_MODE_KEY) as Record<
    string,
    'public_asset' | 'remote_url'
  >;
}

function setPreferredMode(siteId: string, mode: 'public_asset' | 'remote_url' | null): void {
  const modes = { ...getPreferredModes() };
  if (mode) {
    modes[siteId] = mode;
  } else {
    delete modes[siteId];
  }
  writeJsonRecord(CUSTOM_GLB_PREFERRED_MODE_KEY, modes);
}

export function saveCustomGlbUrl(siteId: string, rawUrl: string): string {
  const normalized = normalizeExternalGlbUrl(rawUrl);
  const current = { ...listCustomGlbUrls() };
  if (normalized) {
    current[siteId] = normalized;
    setPreferredMode(siteId, normalized.startsWith('/') ? 'public_asset' : 'remote_url');
    if (normalized.startsWith('/')) {
      invalidatePublicAssetCache(normalized);
    }
  } else {
    delete current[siteId];
    setPreferredMode(siteId, null);
  }
  writeJsonRecord(CUSTOM_GLB_URLS_KEY, current);
  emitGlbUpdated(siteId);
  void pushHeritageSitesToFirebase(true);
  return normalized;
}

export function removeCustomGlbUrl(siteId: string): void {
  const current = { ...listCustomGlbUrls() };
  delete current[siteId];
  writeJsonRecord(CUSTOM_GLB_URLS_KEY, current);
  setPreferredMode(siteId, null);
  emitGlbUpdated(siteId);
  void pushHeritageSitesToFirebase(true);
}

/**
 * Upload a `.glb` / `.gltf` file using the 3-Tier Storage Architecture:
 *   - Tier 1: Always store binary Blob in browser IndexedDB Vault (`DauAnViet3D_AssetVault`) first (offline-first).
 *   - Tier 2: Offload binary to Firebase Storage and store only the lightweight HTTPS download URL in Firestore.
 *   - Tier 3 (dev server): Best-effort write to `public/` via `/api/assets/upload-glb` when backend endpoint is present.
 */
export async function uploadGlbToPublicFolder(
  siteId: string,
  file: File
): Promise<StoredGlbMetadata> {
  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith('.glb') && !lowerName.endsWith('.gltf')) {
    throw new Error('Vui lòng chọn tệp mô hình 3D định dạng .glb hoặc .gltf');
  }

  // Tier 1 + Tier 2: Persistent IndexedDB Vault + Firebase Storage offload (never loses file on reload)
  const cloudUpload = await uploadAssetBinaryToFirebaseStorage('models', siteId, file, file.name);
  const nowIso = new Date().toISOString();

  // Tier 3 (best-effort in dev environment): write to public/ via local Express endpoint if available
  let publicUrl: string | undefined;
  let serverFileName = file.name;
  let serverFileSize = file.size;
  let serverUpdatedAt = nowIso;

  try {
    const endpoint = `/api/assets/upload-glb?siteId=${encodeURIComponent(
      siteId
    )}&fileName=${encodeURIComponent(file.name)}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: file,
    });

    if (res.ok) {
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        publicUrl?: string;
        fileName?: string;
        fileSize?: number;
        updatedAt?: string;
      };
      if (payload.ok && payload.publicUrl) {
        publicUrl = payload.publicUrl;
        serverFileName = payload.fileName || file.name;
        serverFileSize = payload.fileSize || file.size;
        serverUpdatedAt = payload.updatedAt || nowIso;

        invalidatePublicAssetCache(payload.publicUrl);
        invalidateStaticProbeCache(payload.publicUrl);
        publicGlbAvailabilityCache.set(payload.publicUrl, true);

        const current = { ...listCustomGlbUrls() };
        current[siteId] = payload.publicUrl;
        writeJsonRecord(CUSTOM_GLB_URLS_KEY, current);
        setPreferredMode(siteId, 'public_asset');
      }
    }
  } catch {
    // Dev backend upload route may not exist in static/production environments — IndexedDB + Cloud Storage still succeeded
  }

  emitGlbUpdated(siteId);
  void pushHeritageSitesToFirebase(true);

  return {
    siteId,
    fileName: serverFileName,
    fileSize: serverFileSize,
    updatedAt: serverUpdatedAt,
    publicUrl: cloudUpload.downloadUrl || publicUrl,
  };
}

export async function clearAllCustomGlbForSite(siteId: string): Promise<void> {
  const currentUrls = { ...listCustomGlbUrls() };
  delete currentUrls[siteId];
  writeJsonRecord(CUSTOM_GLB_URLS_KEY, currentUrls);
  setPreferredMode(siteId, null);
  saveCloudModelUrl(siteId, null);
  await deleteModelFromVault(siteId);
  invalidatePublicAssetCache();
  invalidateStaticProbeCache();
  emitGlbUpdated(siteId);
  void pushHeritageSitesToFirebase(true);
}

function extractFileNameFromPath(u: string): string {
  try {
    if (u.startsWith('data:')) return 'embedded-model.glb';
    const parsed = new URL(u, 'http://localhost');
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    return last || 'model.glb';
  } catch {
    return u.split('/').pop() || 'model.glb';
  }
}

async function resolveRemoteOrFirebaseUrl(rawUrl: string): Promise<string | null> {
  if (/^firebase-glb:\/\//i.test(rawUrl)) {
    const cached = firebaseGlbResolvedUrlCache.get(rawUrl);
    if (cached) return cached;
    const resolved = await resolveFirebaseGlbPointer(rawUrl);
    if (resolved) {
      firebaseGlbResolvedUrlCache.set(rawUrl, resolved);
      return resolved;
    }
    return null;
  }
  return rawUrl;
}

export async function resolveSiteGlbSource(
  siteId: string,
  options?: { autoDownloadFromCloud?: boolean; forceCloudRetry?: boolean }
): Promise<ResolvedGlbSource> {
  const remoteOrCustomUrl = getCustomGlbUrl(siteId);
  const sessionTemp = sessionTempGlbMap.get(siteId);
  const baked = BAKED_ASSETS[siteId];
  const staticCandidates = Array.from(
    new Set(
      [
        ...(DEFAULT_HERITAGE_3D_CONFIG[siteId]?.glbUrl ? [DEFAULT_HERITAGE_3D_CONFIG[siteId].glbUrl.trim()] : []),
        ...getBakedModelCandidateUrls(siteId),
      ].filter(Boolean)
    )
  );
  const primaryStaticPath = baked?.modelUrl || staticCandidates[0] || null;

  // Priority 0: Tester Pro in-memory session preview (RAM-only temporary upload)
  if (sessionTemp && sessionTemp.url) {
    return {
      siteId,
      kind: 'session_temp',
      url: sessionTemp.url,
      fileName: sessionTemp.fileName,
      fileSize: sessionTemp.fileSize,
      updatedAt: sessionTemp.updatedAt,
      remoteUrl: remoteOrCustomUrl,
      hasPublicAsset: Boolean(primaryStaticPath),
      publicAssetUrl: primaryStaticPath,
      expectedPublicPath: primaryStaticPath,
      hasSessionTempFile: true,
    };
  }

  // Legacy firebase-glb:// pointer support if explicitly entered
  if (/^firebase-glb:\/\//i.test(remoteOrCustomUrl.trim())) {
    const resolvedLegacy = await resolveRemoteOrFirebaseUrl(remoteOrCustomUrl.trim());
    if (resolvedLegacy) {
      return {
        siteId,
        kind: 'remote_url',
        url: resolvedLegacy,
        fileName: extractFileNameFromPath(remoteOrCustomUrl),
        fileSize: null,
        updatedAt: remoteOrCustomUrl,
        remoteUrl: remoteOrCustomUrl,
        hasPublicAsset: Boolean(primaryStaticPath),
        publicAssetUrl: primaryStaticPath,
        expectedPublicPath: primaryStaticPath,
      };
    }
  }

  // Direct Baked GitHub CDN .glb (jsDelivr primary -> auto raw.githubusercontent.com fallback in loader)
  const bakedHttpModelUrl =
    baked?.modelUrl && /^https?:\/\//i.test(baked.modelUrl) ? baked.modelUrl : null;

  // Check for explicit Admin overrides (custom URL / IndexedDB upload / Cloud override) without blocking on Cloud downloads
  const smart = await resolveSmartModelAsset(siteId, {
    autoDownloadFromCloud: false,
    forceCloudRetry: options?.forceCloudRetry,
  });
  if (smart.url && smart.tier === 'firebase_cloud') {
    return {
      siteId,
      kind: 'remote_url',
      url: smart.url,
      fileName: smart.fileName || extractFileNameFromPath(smart.url),
      fileSize: smart.fileSize,
      updatedAt: smart.updatedAt,
      remoteUrl: smart.url,
      hasPublicAsset: Boolean(primaryStaticPath),
      publicAssetUrl: primaryStaticPath,
      expectedPublicPath: primaryStaticPath,
    };
  }

  if (smart.url && smart.tier === 'indexed_db') {
    return {
      siteId,
      kind: 'indexed_db',
      url: smart.url,
      fileName: smart.fileName || `${siteId}.glb`,
      fileSize: smart.fileSize,
      updatedAt: smart.updatedAt,
      remoteUrl: remoteOrCustomUrl,
      hasPublicAsset: Boolean(primaryStaticPath),
      publicAssetUrl: primaryStaticPath,
      expectedPublicPath: primaryStaticPath,
    };
  }

  // Always prefer the permanent GitHub CDN .glb locked in src/data/bakedAssets.ts (works on every device & Remix)
  if (bakedHttpModelUrl && baked) {
    return {
      siteId,
      kind: 'public_asset',
      url: bakedHttpModelUrl,
      fileName: baked.modelFileName || extractFileNameFromPath(bakedHttpModelUrl),
      fileSize: null,
      updatedAt: baked.updatedAt || 'source_code',
      remoteUrl: bakedHttpModelUrl,
      hasPublicAsset: true,
      publicAssetUrl: bakedHttpModelUrl,
      expectedPublicPath: bakedHttpModelUrl,
    };
  }

  if (smart.url && smart.tier === 'static_source') {
    return {
      siteId,
      kind: 'public_asset',
      url: smart.url,
      fileName: smart.fileName || extractFileNameFromPath(smart.url),
      fileSize: smart.fileSize,
      updatedAt: smart.updatedAt || 'source_code',
      remoteUrl: remoteOrCustomUrl,
      hasPublicAsset: true,
      publicAssetUrl: smart.url,
      expectedPublicPath: smart.url,
    };
  }

  // Secondary legacy check: read old IndexedDB or direct static candidate if present
  for (const candidate of staticCandidates) {
    if (candidate.startsWith('/')) {
      const exists = await checkPublicAssetExists(candidate);
      if (exists) {
        return {
          siteId,
          kind: 'public_asset',
          url: candidate,
          fileName: extractFileNameFromPath(candidate),
          fileSize: null,
          updatedAt: 'source_code',
          remoteUrl: remoteOrCustomUrl,
          hasPublicAsset: true,
          publicAssetUrl: candidate,
          expectedPublicPath: candidate,
        };
      }
    }
  }

  const idbEntry = await readGlbFromIndexedDb(siteId);
  if (idbEntry?.url) {
    return {
      siteId,
      kind: 'indexed_db',
      url: idbEntry.url,
      fileName: idbEntry.fileName,
      fileSize: idbEntry.fileSize,
      updatedAt: idbEntry.updatedAt,
      remoteUrl: remoteOrCustomUrl,
      hasPublicAsset: false,
      publicAssetUrl: null,
      expectedPublicPath: primaryStaticPath,
    };
  }

  return {
    siteId,
    kind: 'none',
    url: null,
    fileName: null,
    fileSize: null,
    updatedAt: null,
    remoteUrl: remoteOrCustomUrl,
    hasPublicAsset: false,
    publicAssetUrl: null,
    expectedPublicPath: primaryStaticPath,
  };
}

export function switchSiteGlbSourceMode(
  siteId: string,
  mode: 'public_asset' | 'remote_url'
): void {
  setPreferredMode(siteId, mode);
  emitGlbUpdated(siteId);
  void pushHeritageSitesToFirebase(true);
}

/**
 * React hook subscribing to the active `.glb` model source for a single heritage site.
 */
function buildInitialSiteGlbSource(siteId: string | null | undefined): ResolvedGlbSource {
  const baked = siteId ? BAKED_ASSETS[siteId] : null;
  const bakedUrl = baked?.modelUrl && /^https?:\/\//i.test(baked.modelUrl) ? baked.modelUrl : null;
  if (siteId && baked && bakedUrl) {
    return {
      siteId,
      kind: 'public_asset',
      url: bakedUrl,
      fileName: baked.modelFileName || extractFileNameFromPath(bakedUrl),
      fileSize: null,
      updatedAt: baked.updatedAt || 'source_code',
      remoteUrl: getCustomGlbUrl(siteId) || bakedUrl,
      hasPublicAsset: true,
      publicAssetUrl: bakedUrl,
      expectedPublicPath: bakedUrl,
    };
  }
  return {
    siteId: siteId || '',
    kind: 'none',
    url: null,
    fileName: null,
    fileSize: null,
    updatedAt: null,
    remoteUrl: siteId ? getCustomGlbUrl(siteId) : '',
    hasPublicAsset: false,
    publicAssetUrl: null,
    expectedPublicPath: siteId
      ? BAKED_ASSETS[siteId]?.modelUrl || DEFAULT_HERITAGE_3D_CONFIG[siteId]?.glbUrl || null
      : null,
  };
}

export function useSiteGlbSource(siteId: string | null | undefined) {
  const [source, setSource] = useState<ResolvedGlbSource>(() => buildInitialSiteGlbSource(siteId));
  const [loading, setLoading] = useState<boolean>(
    () => Boolean(siteId && !buildInitialSiteGlbSource(siteId).url)
  );

  const load = useCallback(
    async (forceCloudRetry = false) => {
      if (!siteId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      invalidatePublicAssetCache();
      invalidateStaticProbeCache();
      if (forceCloudRetry) {
        clearCloudAssetError(siteId, 'models');
        invalidateCloudMetaCache('models', siteId);
      }
      const resolved = await resolveSiteGlbSource(siteId, {
        autoDownloadFromCloud: true,
        forceCloudRetry,
      });
      setSource(resolved);
      setLoading(false);
    },
    [siteId]
  );

  const retryFromCloud = useCallback(() => load(true), [load]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!siteId) {
        if (active) setLoading(false);
        return;
      }
      const instant = buildInitialSiteGlbSource(siteId);
      if (active) {
        setSource(instant);
        setLoading(!instant.url);
      }
      const resolved = await resolveSiteGlbSource(siteId, { autoDownloadFromCloud: false });
      if (active) {
        setSource(resolved);
        setLoading(false);
      }
    };
    void run();

    const onUpdated = (ev: Event) => {
      const detail = (ev as CustomEvent<{ siteId?: string }>).detail;
      if (!detail?.siteId || detail.siteId === siteId) {
        void run();
      }
    };
    const onVaultOrManifestReady = () => void run();
    const onStorage = (ev: StorageEvent) => {
      if (
        ev.key === CUSTOM_GLB_URLS_KEY ||
        ev.key === CUSTOM_GLB_PREFERRED_MODE_KEY ||
        ev.key === null
      ) {
        void run();
      }
    };
    window.addEventListener(GLB_MODELS_UPDATED_EVENT, onUpdated);
    window.addEventListener(ASSET_VAULT_UPDATED_EVENT, onVaultOrManifestReady);
    window.addEventListener(CLOUD_ASSETS_MANIFEST_READY_EVENT, onVaultOrManifestReady);
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.removeEventListener(GLB_MODELS_UPDATED_EVENT, onUpdated);
      window.removeEventListener(ASSET_VAULT_UPDATED_EVENT, onVaultOrManifestReady);
      window.removeEventListener(CLOUD_ASSETS_MANIFEST_READY_EVENT, onVaultOrManifestReady);
      window.removeEventListener('storage', onStorage);
    };
  }, [siteId]);

  return { source, loading, refresh: () => load(false), retryFromCloud };
}

/**
 * React hook returning a lightweight map of all sites that currently have an active `.glb`
 * (session RAM test, Firebase Cloud manifest/URL, IndexedDB Vault, or verified `public/` asset).
 * Never triggers mass Cloud chunk downloads on startup.
 */
export function useAllCustomGlbMap(): Record<string, SiteGlbBadgeInfo> {
  const [badgeMap, setBadgeMap] = useState<Record<string, SiteGlbBadgeInfo>>({});

  useEffect(() => {
    let active = true;
    const compute = async () => {
      const urlsMap = listCustomGlbUrls();
      const next: Record<string, SiteGlbBadgeInfo> = {};

      const allIds = new Set([
        ...Array.from(sessionTempGlbMap.keys()),
        ...Object.keys(urlsMap),
        ...Object.keys(DEFAULT_HERITAGE_3D_CONFIG),
        ...Object.keys(BAKED_ASSETS),
      ]);

      await Promise.all(
        Array.from(allIds).map(async (id) => {
          const temp = sessionTempGlbMap.get(id);
          if (temp) {
            next[id] = {
              siteId: id,
              kind: 'session_temp',
              label: temp.fileName,
              fileSize: temp.fileSize,
              updatedAt: temp.updatedAt,
            };
            return;
          }
          const resolved = await resolveSiteGlbSource(id, { autoDownloadFromCloud: false });
          if (
            resolved.url &&
            (resolved.kind === 'public_asset' ||
              resolved.kind === 'remote_url' ||
              resolved.kind === 'indexed_db')
          ) {
            next[id] = {
              siteId: id,
              kind: resolved.kind,
              label: resolved.fileName || extractFileNameFromPath(resolved.url),
              fileSize: resolved.fileSize ?? undefined,
              updatedAt: resolved.updatedAt ?? undefined,
            };
            return;
          }
          // Check preloaded RAM Cloud manifest so Cloud-synced models show ready immediately
          const cloudMeta = findCloudMetaInRam('models', id);
          if (cloudMeta && cloudMeta.totalChunks > 0) {
            next[id] = {
              siteId: id,
              kind: 'remote_url',
              label: cloudMeta.fileName,
              fileSize: cloudMeta.totalSize,
              updatedAt: cloudMeta.updatedAt,
            };
          }
        })
      );

      if (active) setBadgeMap(next);
    };

    void compute();
    const onUpdated = () => void compute();
    const onStorage = (ev: StorageEvent) => {
      if (
        ev.key === CUSTOM_GLB_URLS_KEY ||
        ev.key === CUSTOM_GLB_PREFERRED_MODE_KEY ||
        ev.key === null
      ) {
        void compute();
      }
    };
    window.addEventListener(GLB_MODELS_UPDATED_EVENT, onUpdated);
    window.addEventListener(ASSET_VAULT_UPDATED_EVENT, onUpdated);
    window.addEventListener(CLOUD_ASSETS_MANIFEST_READY_EVENT, onUpdated);
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.removeEventListener(GLB_MODELS_UPDATED_EVENT, onUpdated);
      window.removeEventListener(ASSET_VAULT_UPDATED_EVENT, onUpdated);
      window.removeEventListener(CLOUD_ASSETS_MANIFEST_READY_EVENT, onUpdated);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return badgeMap;
}

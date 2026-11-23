/**
 * Tier 1 — Persistent Browser IndexedDB Binary Vault (`DauAnViet3D_AssetVault`)
 *
 * Replaces fragile RAM Object URLs and 5MB-capped localStorage for binary 3D models
 * (.glb / .gltf) and voice narration recordings (.m4a / .mp3 / .wav / .ogg).
 * Works completely offline-first and survives page reloads seamlessly.
 */

export const ASSET_VAULT_DB_NAME = 'DauAnViet3D_AssetVault';
export const ASSET_VAULT_DB_VERSION = 2;
export const ASSET_VAULT_MODELS_STORE = 'models';
export const ASSET_VAULT_AUDIO_STORE = 'audio';
export const ASSET_VAULT_IMAGES_STORE = 'images';
export const ASSET_VAULT_VIDEOS_STORE = 'videos';
export const ASSET_VAULT_UPDATED_EVENT = 'dau-an-viet-asset-vault-updated';

const LEGACY_GLB_IDB_NAME = 'dau_an_viet_glb_db';

export type VaultAssetKind = 'model' | 'audio' | 'image' | 'video';

export interface VaultBinaryRecord {
  siteId: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  durationSec?: number;
  updatedAt: string;
  source: 'admin_upload' | 'imported' | 'legacy';
}

export interface VaultResolvedEntry {
  siteId: string;
  kind: VaultAssetKind;
  objectUrl: string;
  blob: Blob;
  fileName: string;
  mimeType: string;
  fileSize: number;
  durationSec?: number;
  updatedAt: string;
  source: 'admin_upload' | 'imported' | 'legacy';
}

export interface VaultAssetMeta {
  siteId: string;
  kind: VaultAssetKind;
  fileName: string;
  mimeType: string;
  fileSize: number;
  durationSec?: number;
  updatedAt: string;
  source: 'admin_upload' | 'imported' | 'legacy';
}

export interface VaultStorageStats {
  modelCount: number;
  audioCount: number;
  imageCount: number;
  videoCount: number;
  modelBytes: number;
  audioBytes: number;
  imageBytes: number;
  videoBytes: number;
  totalBytes: number;
}

const modelObjectUrlCache = new Map<string, VaultResolvedEntry>();
const audioObjectUrlCache = new Map<string, VaultResolvedEntry>();
const imageObjectUrlCache = new Map<string, VaultResolvedEntry>();
const videoObjectUrlCache = new Map<string, VaultResolvedEntry>();

let dbOpenPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDbSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function emitVaultUpdated(kind: VaultAssetKind, siteId?: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(ASSET_VAULT_UPDATED_EVENT, {
      detail: { kind, siteId },
    })
  );
}

function openVaultDatabase(): Promise<IDBDatabase | null> {
  if (!isIndexedDbSupported()) return Promise.resolve(null);
  if (dbOpenPromise) return dbOpenPromise;

  dbOpenPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(ASSET_VAULT_DB_NAME, ASSET_VAULT_DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(ASSET_VAULT_MODELS_STORE)) {
          db.createObjectStore(ASSET_VAULT_MODELS_STORE, { keyPath: 'siteId' });
        }
        if (!db.objectStoreNames.contains(ASSET_VAULT_AUDIO_STORE)) {
          db.createObjectStore(ASSET_VAULT_AUDIO_STORE, { keyPath: 'siteId' });
        }
        if (!db.objectStoreNames.contains(ASSET_VAULT_IMAGES_STORE)) {
          db.createObjectStore(ASSET_VAULT_IMAGES_STORE, { keyPath: 'siteId' });
        }
        if (!db.objectStoreNames.contains(ASSET_VAULT_VIDEOS_STORE)) {
          db.createObjectStore(ASSET_VAULT_VIDEOS_STORE, { keyPath: 'siteId' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbOpenPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbOpenPromise = null;
        resolve(null);
      };
    } catch {
      dbOpenPromise = null;
      resolve(null);
    }
  });

  return dbOpenPromise;
}

function inferMimeType(kind: VaultAssetKind, fileName: string, fallback?: string): string {
  if (fallback && fallback.trim() && fallback !== 'application/octet-stream') return fallback.trim();
  const lower = fileName.toLowerCase();
  if (kind === 'model') {
    return lower.endsWith('.gltf') ? 'model/gltf+json' : 'model/gltf-binary';
  }
  if (kind === 'image') {
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
  }
  if (kind === 'video') {
    if (lower.endsWith('.webm')) return 'video/webm';
    if (lower.endsWith('.ogv') || lower.endsWith('.ogg')) return 'video/ogg';
    return 'video/mp4';
  }
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/mp4';
}

function revokeCachedEntry(cache: Map<string, VaultResolvedEntry>, siteId: string): void {
  const prev = cache.get(siteId);
  if (prev?.objectUrl && prev.objectUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(prev.objectUrl);
    } catch {
      // ignore revoke errors
    }
  }
  cache.delete(siteId);
}

async function putRecord(storeName: string, record: VaultBinaryRecord): Promise<boolean> {
  const db = await openVaultDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onerror = () => resolve(false);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function getRecord(storeName: string, siteId: string): Promise<VaultBinaryRecord | null> {
  const db = await openVaultDatabase();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(siteId);
      req.onsuccess = () => {
        const result = req.result as VaultBinaryRecord | undefined;
        resolve(result && result.blob instanceof Blob ? result : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function deleteRecord(storeName: string, siteId: string): Promise<boolean> {
  const db = await openVaultDatabase();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(siteId);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

async function listAllMetaFromStore(
  storeName: string,
  kind: VaultAssetKind
): Promise<Record<string, VaultAssetMeta>> {
  const db = await openVaultDatabase();
  if (!db) return {};

  return new Promise((resolve) => {
    const out: Record<string, VaultAssetMeta> = {};
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.openCursor();

      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor) {
          resolve(out);
          return;
        }
        const rec = cursor.value as Partial<VaultBinaryRecord> | undefined;
        if (rec?.siteId && rec.blob instanceof Blob) {
          out[rec.siteId] = {
            siteId: rec.siteId,
            kind,
            fileName: rec.fileName || `${rec.siteId}.${kind === 'model' ? 'glb' : 'm4a'}`,
            mimeType: rec.mimeType || inferMimeType(kind, rec.fileName || ''),
            fileSize: typeof rec.fileSize === 'number' ? rec.fileSize : rec.blob.size,
            durationSec: typeof rec.durationSec === 'number' ? rec.durationSec : undefined,
            updatedAt: rec.updatedAt || new Date().toISOString(),
            source: rec.source || 'admin_upload',
          };
        }
        cursor.continue();
      };

      req.onerror = () => resolve(out);
    } catch {
      resolve(out);
    }
  });
}

/**
 * Read-only fallback for legacy `dau_an_viet_glb_db` so existing cached models are never lost.
 */
async function readLegacyGlbRecord(siteId: string): Promise<VaultBinaryRecord | null> {
  if (!isIndexedDbSupported()) return null;
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
        try {
          req.transaction?.abort();
        } catch {
          // ignore
        }
        (ev.target as IDBOpenDBRequest).result?.close();
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
        const targetStore = storeNames.find((n) => /glb|model/i.test(n)) || storeNames[0];
        try {
          const tx = db.transaction(targetStore, 'readonly');
          const getReq = tx.objectStore(targetStore).get(siteId);
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
          getReq.onsuccess = () => {
            const raw = getReq.result as
              | Blob
              | ArrayBuffer
              | {
                  blob?: Blob;
                  file?: Blob;
                  buffer?: ArrayBuffer;
                  fileName?: string;
                  fileSize?: number;
                  updatedAt?: string;
                }
              | undefined;
            db.close();
            if (!raw) {
              resolve(null);
              return;
            }
            let blob: Blob | null = null;
            let fileName = `${siteId}.glb`;
            let updatedAt = new Date().toISOString();

            if (raw instanceof Blob) {
              blob = raw;
            } else if (raw instanceof ArrayBuffer) {
              blob = new Blob([raw], { type: 'model/gltf-binary' });
            } else if (typeof raw === 'object') {
              if (raw.blob instanceof Blob) blob = raw.blob;
              else if (raw.file instanceof Blob) blob = raw.file;
              else if (raw.buffer instanceof ArrayBuffer) {
                blob = new Blob([raw.buffer], { type: 'model/gltf-binary' });
              }
              if (typeof raw.fileName === 'string' && raw.fileName.trim()) {
                fileName = raw.fileName.trim();
              }
              if (typeof raw.updatedAt === 'string' && raw.updatedAt.trim()) {
                updatedAt = raw.updatedAt.trim();
              }
            }

            if (!blob) {
              resolve(null);
              return;
            }

            resolve({
              siteId,
              blob,
              fileName,
              mimeType: blob.type || 'model/gltf-binary',
              fileSize: blob.size,
              updatedAt,
              source: 'legacy',
            });
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

// ============================================================================
// PUBLIC API — 3D MODELS (.glb / .gltf)
// ============================================================================

export async function saveModelBlobToVault(
  siteId: string,
  fileOrBlob: File | Blob,
  fileName?: string,
  source: VaultBinaryRecord['source'] = 'admin_upload'
): Promise<VaultResolvedEntry> {
  const resolvedName =
    (fileName && fileName.trim()) ||
    (fileOrBlob instanceof File && fileOrBlob.name ? fileOrBlob.name : `${siteId}.glb`);
  const mimeType = inferMimeType('model', resolvedName, fileOrBlob.type);
  const updatedAt = new Date().toISOString();

  const record: VaultBinaryRecord = {
    siteId,
    blob: fileOrBlob,
    fileName: resolvedName,
    mimeType,
    fileSize: fileOrBlob.size,
    updatedAt,
    source,
  };

  await putRecord(ASSET_VAULT_MODELS_STORE, record);

  revokeCachedEntry(modelObjectUrlCache, siteId);
  const objectUrl = URL.createObjectURL(fileOrBlob);
  const entry: VaultResolvedEntry = {
    siteId,
    kind: 'model',
    objectUrl,
    blob: fileOrBlob,
    fileName: resolvedName,
    mimeType,
    fileSize: fileOrBlob.size,
    updatedAt,
    source,
  };
  modelObjectUrlCache.set(siteId, entry);
  emitVaultUpdated('model', siteId);
  return entry;
}

export async function getModelFromVault(siteId: string): Promise<VaultResolvedEntry | null> {
  if (!siteId) return null;
  const cached = modelObjectUrlCache.get(siteId);
  if (cached) return cached;

  let record = await getRecord(ASSET_VAULT_MODELS_STORE, siteId);
  if (!record) {
    record = await readLegacyGlbRecord(siteId);
  }
  if (!record) return null;

  const objectUrl = URL.createObjectURL(record.blob);
  const entry: VaultResolvedEntry = {
    siteId,
    kind: 'model',
    objectUrl,
    blob: record.blob,
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    updatedAt: record.updatedAt,
    source: record.source,
  };
  modelObjectUrlCache.set(siteId, entry);
  return entry;
}

export async function deleteModelFromVault(siteId: string): Promise<void> {
  revokeCachedEntry(modelObjectUrlCache, siteId);
  await deleteRecord(ASSET_VAULT_MODELS_STORE, siteId);
  emitVaultUpdated('model', siteId);
}

export async function listVaultModelsMeta(): Promise<Record<string, VaultAssetMeta>> {
  return listAllMetaFromStore(ASSET_VAULT_MODELS_STORE, 'model');
}

// ============================================================================
// PUBLIC API — AUDIO NARRATIONS (.m4a / .mp3 / .wav / .ogg)
// ============================================================================

export async function saveAudioBlobToVault(
  siteId: string,
  fileOrBlob: File | Blob,
  fileName?: string,
  durationSec?: number,
  source: VaultBinaryRecord['source'] = 'admin_upload'
): Promise<VaultResolvedEntry> {
  const resolvedName =
    (fileName && fileName.trim()) ||
    (fileOrBlob instanceof File && fileOrBlob.name ? fileOrBlob.name : `${siteId}.m4a`);
  const mimeType = inferMimeType('audio', resolvedName, fileOrBlob.type);
  const updatedAt = new Date().toISOString();

  const record: VaultBinaryRecord = {
    siteId,
    blob: fileOrBlob,
    fileName: resolvedName,
    mimeType,
    fileSize: fileOrBlob.size,
    durationSec,
    updatedAt,
    source,
  };

  await putRecord(ASSET_VAULT_AUDIO_STORE, record);

  revokeCachedEntry(audioObjectUrlCache, siteId);
  const objectUrl = URL.createObjectURL(fileOrBlob);
  const entry: VaultResolvedEntry = {
    siteId,
    kind: 'audio',
    objectUrl,
    blob: fileOrBlob,
    fileName: resolvedName,
    mimeType,
    fileSize: fileOrBlob.size,
    durationSec,
    updatedAt,
    source,
  };
  audioObjectUrlCache.set(siteId, entry);
  emitVaultUpdated('audio', siteId);
  return entry;
}

export async function getAudioFromVault(siteId: string): Promise<VaultResolvedEntry | null> {
  if (!siteId) return null;
  const cached = audioObjectUrlCache.get(siteId);
  if (cached) return cached;

  const record = await getRecord(ASSET_VAULT_AUDIO_STORE, siteId);
  if (!record) return null;

  const objectUrl = URL.createObjectURL(record.blob);
  const entry: VaultResolvedEntry = {
    siteId,
    kind: 'audio',
    objectUrl,
    blob: record.blob,
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    durationSec: record.durationSec,
    updatedAt: record.updatedAt,
    source: record.source,
  };
  audioObjectUrlCache.set(siteId, entry);
  return entry;
}

export async function updateAudioDurationInVault(
  siteId: string,
  durationSec: number
): Promise<void> {
  if (!siteId || !Number.isFinite(durationSec) || durationSec <= 0) return;
  const existing = await getRecord(ASSET_VAULT_AUDIO_STORE, siteId);
  if (!existing) return;
  if (typeof existing.durationSec === 'number' && Math.abs(existing.durationSec - durationSec) < 0.5) {
    return;
  }
  await putRecord(ASSET_VAULT_AUDIO_STORE, {
    ...existing,
    durationSec,
  });
  const cached = audioObjectUrlCache.get(siteId);
  if (cached) {
    audioObjectUrlCache.set(siteId, { ...cached, durationSec });
  }
}

export async function deleteAudioFromVault(siteId: string): Promise<void> {
  revokeCachedEntry(audioObjectUrlCache, siteId);
  await deleteRecord(ASSET_VAULT_AUDIO_STORE, siteId);
  emitVaultUpdated('audio', siteId);
}

export async function listVaultAudioMeta(): Promise<Record<string, VaultAssetMeta>> {
  return listAllMetaFromStore(ASSET_VAULT_AUDIO_STORE, 'audio');
}

// ============================================================================
// PUBLIC API — UPLOADED IMAGES & SHORT VIDEOS (KEYED BY `${siteId}_${slotIndex}`)
// ============================================================================

export async function saveImageBlobToVault(
  assetKey: string,
  fileOrBlob: File | Blob,
  fileName?: string,
  source: VaultBinaryRecord['source'] = 'admin_upload'
): Promise<VaultResolvedEntry> {
  const resolvedName =
    (fileName && fileName.trim()) ||
    (fileOrBlob instanceof File && fileOrBlob.name ? fileOrBlob.name : `${assetKey}.jpg`);
  const mimeType = inferMimeType('image', resolvedName, fileOrBlob.type);
  const updatedAt = new Date().toISOString();

  const record: VaultBinaryRecord = {
    siteId: assetKey,
    blob: fileOrBlob,
    fileName: resolvedName,
    mimeType,
    fileSize: fileOrBlob.size,
    updatedAt,
    source,
  };

  await putRecord(ASSET_VAULT_IMAGES_STORE, record);
  revokeCachedEntry(imageObjectUrlCache, assetKey);
  const objectUrl = URL.createObjectURL(fileOrBlob);
  const entry: VaultResolvedEntry = {
    siteId: assetKey,
    kind: 'image',
    objectUrl,
    blob: fileOrBlob,
    fileName: resolvedName,
    mimeType,
    fileSize: fileOrBlob.size,
    updatedAt,
    source,
  };
  imageObjectUrlCache.set(assetKey, entry);
  emitVaultUpdated('image', assetKey);
  return entry;
}

export async function getImageFromVault(assetKey: string): Promise<VaultResolvedEntry | null> {
  if (!assetKey) return null;
  const cached = imageObjectUrlCache.get(assetKey);
  if (cached) return cached;

  const record = await getRecord(ASSET_VAULT_IMAGES_STORE, assetKey);
  if (!record) return null;

  const objectUrl = URL.createObjectURL(record.blob);
  const entry: VaultResolvedEntry = {
    siteId: assetKey,
    kind: 'image',
    objectUrl,
    blob: record.blob,
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    updatedAt: record.updatedAt,
    source: record.source,
  };
  imageObjectUrlCache.set(assetKey, entry);
  return entry;
}

export async function deleteImageFromVault(assetKey: string): Promise<void> {
  revokeCachedEntry(imageObjectUrlCache, assetKey);
  await deleteRecord(ASSET_VAULT_IMAGES_STORE, assetKey);
  emitVaultUpdated('image', assetKey);
}

export async function listVaultImagesMeta(): Promise<Record<string, VaultAssetMeta>> {
  return listAllMetaFromStore(ASSET_VAULT_IMAGES_STORE, 'image');
}

export async function saveVideoBlobToVault(
  assetKey: string,
  fileOrBlob: File | Blob,
  fileName?: string,
  source: VaultBinaryRecord['source'] = 'admin_upload'
): Promise<VaultResolvedEntry> {
  const resolvedName =
    (fileName && fileName.trim()) ||
    (fileOrBlob instanceof File && fileOrBlob.name ? fileOrBlob.name : `${assetKey}.mp4`);
  const mimeType = inferMimeType('video', resolvedName, fileOrBlob.type);
  const updatedAt = new Date().toISOString();

  const record: VaultBinaryRecord = {
    siteId: assetKey,
    blob: fileOrBlob,
    fileName: resolvedName,
    mimeType,
    fileSize: fileOrBlob.size,
    updatedAt,
    source,
  };

  await putRecord(ASSET_VAULT_VIDEOS_STORE, record);
  revokeCachedEntry(videoObjectUrlCache, assetKey);
  const objectUrl = URL.createObjectURL(fileOrBlob);
  const entry: VaultResolvedEntry = {
    siteId: assetKey,
    kind: 'video',
    objectUrl,
    blob: fileOrBlob,
    fileName: resolvedName,
    mimeType,
    fileSize: fileOrBlob.size,
    updatedAt,
    source,
  };
  videoObjectUrlCache.set(assetKey, entry);
  emitVaultUpdated('video', assetKey);
  return entry;
}

export async function getVideoFromVault(assetKey: string): Promise<VaultResolvedEntry | null> {
  if (!assetKey) return null;
  const cached = videoObjectUrlCache.get(assetKey);
  if (cached) return cached;

  const record = await getRecord(ASSET_VAULT_VIDEOS_STORE, assetKey);
  if (!record) return null;

  const objectUrl = URL.createObjectURL(record.blob);
  const entry: VaultResolvedEntry = {
    siteId: assetKey,
    kind: 'video',
    objectUrl,
    blob: record.blob,
    fileName: record.fileName,
    mimeType: record.mimeType,
    fileSize: record.fileSize,
    updatedAt: record.updatedAt,
    source: record.source,
  };
  videoObjectUrlCache.set(assetKey, entry);
  return entry;
}

export async function deleteVideoFromVault(assetKey: string): Promise<void> {
  revokeCachedEntry(videoObjectUrlCache, assetKey);
  await deleteRecord(ASSET_VAULT_VIDEOS_STORE, assetKey);
  emitVaultUpdated('video', assetKey);
}

export async function listVaultVideosMeta(): Promise<Record<string, VaultAssetMeta>> {
  return listAllMetaFromStore(ASSET_VAULT_VIDEOS_STORE, 'video');
}

export async function getVaultStorageStats(): Promise<VaultStorageStats> {
  const [models, audios, images, videos] = await Promise.all([
    listVaultModelsMeta(),
    listVaultAudioMeta(),
    listVaultImagesMeta(),
    listVaultVideosMeta(),
  ]);
  const modelList = Object.values(models);
  const audioList = Object.values(audios);
  const imageList = Object.values(images);
  const videoList = Object.values(videos);
  const modelBytes = modelList.reduce((acc, item) => acc + (item.fileSize || 0), 0);
  const audioBytes = audioList.reduce((acc, item) => acc + (item.fileSize || 0), 0);
  const imageBytes = imageList.reduce((acc, item) => acc + (item.fileSize || 0), 0);
  const videoBytes = videoList.reduce((acc, item) => acc + (item.fileSize || 0), 0);
  return {
    modelCount: modelList.length,
    audioCount: audioList.length,
    imageCount: imageList.length,
    videoCount: videoList.length,
    modelBytes,
    audioBytes,
    imageBytes,
    videoBytes,
    totalBytes: modelBytes + audioBytes + imageBytes + videoBytes,
  };
}

export function formatVaultBytes(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

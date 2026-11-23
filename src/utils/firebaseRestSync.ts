import { useEffect, useState } from 'react';
import type { HeritageSite, HeritageHotspotFeature } from '../types/heritage.ts';
import { DEFAULT_HERITAGE_SITES } from '../data/heritageSites.ts';
import {
  DEFAULT_SITE_PHOTOS_BY_ID,
  DEFAULT_SITE_PHOTO_CAPTIONS,
  normalizeHighResPhotoUrl,
  sanitizeCustomSitePhotosMap,
} from '../data/heritagePhotos.ts';
import {
  DEFAULT_HERITAGE_3D_CONFIG,
  HOTSPOTS_3D_STORAGE_KEY,
  TRANSFORMS_3D_STORAGE_KEY,
  type Heritage3DTransform,
} from '../data/heritage3DConfig.ts';

/**
 * Hằng số cấu hình Firebase Realtime Database REST API (không dùng SDK ngoài).
 * Dán trực tiếp URL Firebase Realtime Database của bạn vào chuỗi bên dưới
 * (ví dụ: https://dau-an-viet-3d-default-rtdb.asia-southeast1.firebasedatabase.app).
 */
export const RAW_FIREBASE_DB_URL = '[DÁN_LINK_FIREBASE_REALTIME_DATABASE_VÀO_ĐÂY]';

const ENV_FIREBASE_URL =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  typeof import.meta.env.VITE_FIREBASE_DB_URL === 'string'
    ? import.meta.env.VITE_FIREBASE_DB_URL.trim()
    : '';

export const FIREBASE_DB_URL = (ENV_FIREBASE_URL || RAW_FIREBASE_DB_URL).replace(/\/+$/, '');

export const FIREBASE_ACCOUNTS_ENDPOINT = `${FIREBASE_DB_URL}/dau_an_viet_3d/accounts.json`;
export const FIREBASE_HERITAGE_SITES_ENDPOINT = `${FIREBASE_DB_URL}/dau_an_viet_3d/heritage_sites.json`;
export const FIREBASE_USERS_ROOT_ENDPOINT = `${FIREBASE_DB_URL}/dau_an_viet_3d/users`;
export const FIREBASE_FEEDBACKS_ROOT_ENDPOINT = `${FIREBASE_DB_URL}/feedbacks`;
export const FIREBASE_FEEDBACKS_ENDPOINT = `${FIREBASE_DB_URL}/feedbacks.json`;
export const FIREBASE_SUPPORT_TICKETS_ROOT_ENDPOINT = `${FIREBASE_DB_URL}/support_tickets`;
export const FIREBASE_SUPPORT_TICKETS_ENDPOINT = `${FIREBASE_DB_URL}/support_tickets.json`;

export function isFirebaseDbConfigured(): boolean {
  return (
    Boolean(FIREBASE_DB_URL) &&
    !FIREBASE_DB_URL.includes('[DÁN_LINK_FIREBASE_REALTIME_DATABASE_VÀO_ĐÂY]') &&
    /^https?:\/\//i.test(FIREBASE_DB_URL)
  );
}

// LocalStorage keys mirrored across store modules (zero circular imports)
const KEY_ACCOUNTS_DB = 'dau_an_viet_accounts_db_v1';
const KEY_USER_CREDENTIALS = 'dau_an_viet_user_credentials_v1';
const KEY_VISITORS_REGISTRY = 'dau_an_viet_visitors_registry_v1';
const KEY_ISSUED_PASSES = 'dau_an_viet_issued_passes_v1';
const KEY_SUBSCRIPTION_TIERS = 'dau_an_viet_subscription_tier_v1';
const KEY_SCHOOL_PACKAGES = 'dau_an_viet_school_packages_v1';
const KEY_TESTER_ALLOWLIST = 'dau_an_viet_tester_allowlist_v1';
const KEY_ADMIN_EMAILS = 'dau_an_viet_admin_emails';
const KEY_LOCKED_ACCOUNTS = 'dau_an_viet_locked_accounts_v1';
const KEY_AUTH_SESSION = 'dau_an_viet_auth_session';
const KEY_USER_TIER_SIMPLE = 'userTier';
const KEY_PASSPORT_PREFIX = 'dauanviet_passport_stamps_v2_';
const KEY_USER_EDTECH_PREFIX = 'dau_an_viet_user_edtech_v1_';

const KEY_CUSTOM_SITE_PHOTOS = 'heritage_custom_real_photos_v1';
const KEY_PHOTO_CAPTIONS = 'dau_an_viet_photo_captions_v1';
const KEY_CUSTOM_GLB_URLS = 'dau_an_viet_custom_glb_urls_v1';
const KEY_CUSTOM_GLB_MODE = 'dau_an_viet_custom_glb_mode_v1';
const KEY_CMS_OVERRIDES = 'dau_an_viet_cms_overrides_v1';
const KEY_HIDDEN_HERITAGES = 'dau_an_viet_hidden_heritages';
const KEY_SITE_TRANSLATIONS = 'dau_an_viet_site_translations_v1';
const KEY_AUDIO_OVERRIDES = 'dau_an_viet_audio_script_overrides_v1';
const KEY_PUBLISHED_QUIZZES = 'dau_an_viet_published_quizzes_v1';
const KEY_QUIZ_DRAFTS = 'dau_an_viet_quiz_drafts_v1';
const KEY_SITE_SETTINGS = 'dau_an_viet_site_settings_v1';
const KEY_VISITOR_REVIEWS = 'dau_an_viet_visitor_reviews';
const KEY_SUPPORT_TICKETS = 'dau_an_viet_support_tickets';

// Events emitted after hydration
const EVT_ACCOUNTS_DB = 'dau-an-viet-accounts-db-updated';
const EVT_VISITORS = 'dau-an-viet-visitors-updated';
const EVT_PASSES = 'dau-an-viet-passes-updated';
const EVT_SUBSCRIPTION_TIER = 'dau-an-viet-subscription-tier-updated';
const EVT_TESTER_ALLOWLIST = 'dau-an-viet-tester-allowlist-updated';
const EVT_ADMIN_EMAILS = 'dau-an-viet-admin-emails-updated';
const EVT_LOCKS = 'dau-an-viet-account-locks-updated';
const EVT_PASSPORT = 'heritage-passport-updated';
const EVT_CUSTOM_PHOTOS = 'heritage_custom_photos_changed';
const EVT_PHOTO_CAPTIONS = 'dau_an_viet_photo_captions_updated';
const EVT_GLB_MODELS = 'dau-an-viet-glb-models-updated';
const EVT_3D_CONFIG = 'dau-an-viet-3d-config-updated';
const EVT_CMS = 'dau-an-viet-cms-updated';
const EVT_QUIZZES = 'dau-an-viet-quizzes-updated';
const EVT_REVIEWS = 'dau-an-viet-reviews-updated';
const EVT_SUPPORT_TICKETS = 'dau-an-viet-support-tickets-updated';

export const FIREBASE_SYNC_STATUS_EVENT = 'dau-an-viet-firebase-sync-status';

export type FirebaseSyncState = 'synced' | 'syncing' | 'offline' | 'unconfigured';

export interface FirebaseSyncStatusSnapshot {
  state: FirebaseSyncState;
  configured: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}

let currentSyncStatus: FirebaseSyncStatusSnapshot = {
  state: isFirebaseDbConfigured() ? 'synced' : 'unconfigured',
  configured: isFirebaseDbConfigured(),
  lastSyncedAt: null,
  lastError: null,
};

function setFirebaseSyncStatus(partial: Partial<FirebaseSyncStatusSnapshot>): void {
  currentSyncStatus = {
    ...currentSyncStatus,
    ...partial,
    configured: isFirebaseDbConfigured(),
  };
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(FIREBASE_SYNC_STATUS_EVENT, { detail: currentSyncStatus })
    );
  }
}

export function getFirebaseSyncStatus(): FirebaseSyncStatusSnapshot {
  return currentSyncStatus;
}

export function useFirebaseSyncStatus(): FirebaseSyncStatusSnapshot {
  const [status, setStatus] = useState<FirebaseSyncStatusSnapshot>(() => getFirebaseSyncStatus());

  useEffect(() => {
    const syncNow = () => setStatus({ ...getFirebaseSyncStatus() });
    syncNow();
    window.addEventListener(FIREBASE_SYNC_STATUS_EVENT, syncNow);
    return () => {
      window.removeEventListener(FIREBASE_SYNC_STATUS_EVENT, syncNow);
    };
  }, []);

  return status;
}

function readJsonSafe<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonIfChanged(key: string, nextValue: unknown): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = JSON.stringify(nextValue);
    const prev = window.localStorage.getItem(key);
    if (prev === serialized) return false;
    window.localStorage.setItem(key, serialized);
    return true;
  } catch {
    return false;
  }
}

function emitEvent(name: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name));
  }
}

export interface FirebaseAccountsBranchPayload {
  updatedAt: string;
  accountsDb: Array<Record<string, unknown>>;
  userCredentials: Record<string, Record<string, unknown>>;
  visitors: Array<Record<string, unknown>>;
  issuedPasses: Array<Record<string, unknown>>;
  subscriptionTiers: Record<string, Record<string, unknown>>;
  schoolPackages: Record<string, Record<string, unknown>>;
  testerAllowlistEmails: string[];
  secondaryAdminEmails: string[];
  lockedAccounts: Record<string, Record<string, unknown>>;
  passportStamps: Record<string, Record<string, unknown>>;
  userEdTechStates: Record<string, Record<string, unknown>>;
}

export interface FirebaseHeritageSiteSnapshot {
  id: string;
  officialName: string;
  photos: [string, string];
  captions: {
    vi: [string, string];
    en: [string, string];
    zh: [string, string];
  };
  glbUrl: string;
  scale: number;
  rotationY: number;
  hotspots: HeritageHotspotFeature[];
  visibility: 'published' | 'hidden';
  summary: string;
  chronology: string;
  architecturalStyle: string;
  conservationNotes: string;
}

export interface FirebaseHeritageSitesBranchPayload {
  updatedAt: string;
  sites: FirebaseHeritageSiteSnapshot[];
  customSitePhotos: Record<string, unknown>;
  photoCaptionOverrides: Record<string, unknown>;
  customGlbUrls: Record<string, string>;
  customGlbModes: Record<string, string>;
  transforms3D: Record<string, Heritage3DTransform>;
  hotspotsBySite: Record<string, HeritageHotspotFeature[]>;
  cmsOverrides: Record<string, Record<string, unknown>>;
  hiddenHeritageIds: string[];
  siteTranslationsOverride: Record<string, unknown>;
  audioOverrides: Record<string, unknown>;
  publishedQuizzes: Record<string, unknown>;
  quizDrafts: Record<string, unknown>;
  siteSettings: Record<string, unknown> | null;
}

export function buildFirebaseAccountsPayload(): FirebaseAccountsBranchPayload {
  const rawAccountsDb = readJsonSafe<Array<Record<string, unknown>>>(KEY_ACCOUNTS_DB, []);
  const userCredentials = readJsonSafe<Record<string, Record<string, unknown>>>(
    KEY_USER_CREDENTIALS,
    {}
  );
  const visitors = readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITORS_REGISTRY, []);
  const issuedPasses = readJsonSafe<Array<Record<string, unknown>>>(KEY_ISSUED_PASSES, []);
  const subscriptionTiers = readJsonSafe<Record<string, Record<string, unknown>>>(
    KEY_SUBSCRIPTION_TIERS,
    {}
  );
  const schoolPackages = readJsonSafe<Record<string, Record<string, unknown>>>(
    KEY_SCHOOL_PACKAGES,
    {}
  );
  const testerAllowlistEmails = readJsonSafe<string[]>(KEY_TESTER_ALLOWLIST, []);
  const secondaryAdminEmails = readJsonSafe<string[]>(KEY_ADMIN_EMAILS, []);
  const lockedAccounts = readJsonSafe<Record<string, Record<string, unknown>>>(
    KEY_LOCKED_ACCOUNTS,
    {}
  );

  const passportStamps: Record<string, Record<string, unknown>> = {};
  const userEdTechStates: Record<string, Record<string, unknown>> = {};

  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const k = window.localStorage.key(i);
        if (!k) continue;
        if (k.startsWith(KEY_PASSPORT_PREFIX)) {
          const scope = k.slice(KEY_PASSPORT_PREFIX.length);
          const val = readJsonSafe<Record<string, unknown> | null>(k, null);
          if (scope && val) passportStamps[scope] = val;
        } else if (k.startsWith(KEY_USER_EDTECH_PREFIX)) {
          const scope = k.slice(KEY_USER_EDTECH_PREFIX.length);
          const val = readJsonSafe<Record<string, unknown> | null>(k, null);
          if (scope && val) userEdTechStates[scope] = val;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  // Enrich ACCOUNTS_DB with credentials, QR passes, school package & 0/17 exploration progress
  const credValues = Object.values(userCredentials);
  const testerSet = new Set(
    testerAllowlistEmails.map((e) => String(e || '').toLowerCase().trim()).filter(Boolean)
  );
  const adminSet = new Set(
    secondaryAdminEmails.map((e) => String(e || '').toLowerCase().trim()).filter(Boolean)
  );

  const enrichedMap = new Map<string, Record<string, unknown>>();
  const upsertEnriched = (item: Record<string, unknown>) => {
    const email = String(item.email || '').toLowerCase().trim();
    const uid = String(item.userId || item.id || '').trim();
    const key = email || uid;
    if (!key) return;
    const prev = enrichedMap.get(key) || {};
    const matchedCred = credValues.find(
      (c) =>
        (uid && c?.userId === uid) ||
        (email &&
          (String(c?.email || '').toLowerCase().trim() === email ||
            String(c?.identifier || '').toLowerCase().trim() === email))
    );
    const matchedVisitor = visitors.find(
      (v) =>
        (uid && v?.userId === uid) ||
        (email && String(v?.maskedContact || '').toLowerCase().trim() === email)
    );
    const scope = email || uid;
    const stamps = passportStamps[scope] || (uid ? passportStamps[uid] : undefined) || {};
    const exploredFromVis = Array.isArray(matchedVisitor?.exploredSiteIds)
      ? (matchedVisitor.exploredSiteIds as string[])
      : [];
    const exploredIds = Array.from(
      new Set([...exploredFromVis, ...Object.keys(stamps)])
    );
    const userPasses = issuedPasses.filter((p) => {
      const pEmail = String(p?.ownerEmail || '').toLowerCase().trim();
      return (email && pEmail === email) || (uid && p?.ownerUserId === uid);
    });
    const isAdminAcc =
      Boolean(item.isPrimaryAdmin || prev.isPrimaryAdmin) ||
      email === 'bivsmoon2023@gmail.com' ||
      adminSet.has(email) ||
      item.role === 'admin';
    const isTesterAcc =
      isAdminAcc ||
      testerSet.has(email) ||
      Boolean(item.isBetaTester ?? matchedVisitor?.isBetaTester ?? prev.isBetaTester);
    const hasSchoolPkg = Boolean(
      item.hasSchoolPackage ||
        prev.hasSchoolPackage ||
        schoolPackages[scope]?.active ||
        (uid && schoolPackages[uid]?.active) ||
        userPasses.some((p) => p?.status !== 'revoked' && p?.kind === 'b2b_school')
    );

    const subEntry = subscriptionTiers[scope] || (uid ? subscriptionTiers[uid] : undefined);
    let userTier = String(item.userTier || prev.userTier || 'free');
    if (isAdminAcc) userTier = 'pro';
    else if (subEntry?.tier === 'vip_49k') userTier = 'pro';
    else if (subEntry?.tier === 'route_19k' && userTier === 'free') userTier = 'plus';

    enrichedMap.set(key, {
      ...prev,
      ...item,
      id: uid || email,
      userId: uid || email,
      email: email || uid,
      name: item.name || item.displayName || matchedCred?.displayName || matchedVisitor?.displayName || email,
      displayName:
        item.displayName || item.name || matchedCred?.displayName || matchedVisitor?.displayName || email,
      provider: item.provider || matchedCred?.provider || matchedVisitor?.provider || 'google',
      ...(matchedCred?.password ? { password: matchedCred.password } : {}),
      ...(matchedCred?.passwordHash ? { passwordHash: matchedCred.passwordHash } : {}),
      ...(matchedCred?.salt ? { salt: matchedCred.salt } : {}),
      role: isAdminAcc ? 'admin' : 'visitor',
      isPrimaryAdmin: Boolean(
        item.isPrimaryAdmin || prev.isPrimaryAdmin || email === 'bivsmoon2023@gmail.com'
      ),
      isBetaTester: isTesterAcc,
      userTier,
      hasSchoolPackage: hasSchoolPkg,
      exploredSiteIds: exploredIds,
      exploredProgress: `${Math.min(17, exploredIds.length)}/17`,
      completedRouteIds: Array.isArray(matchedVisitor?.completedRouteIds)
        ? matchedVisitor.completedRouteIds
        : [],
      ticketsCount: userPasses.length,
      issuedPasses: userPasses,
    });
  };

  rawAccountsDb.forEach(upsertEnriched);
  credValues.forEach((c) => {
    if (c && typeof c === 'object') upsertEnriched(c);
  });

  return {
    updatedAt: new Date().toISOString(),
    accountsDb: Array.from(enrichedMap.values()),
    userCredentials,
    visitors,
    issuedPasses,
    subscriptionTiers,
    schoolPackages,
    testerAllowlistEmails,
    secondaryAdminEmails,
    lockedAccounts,
    passportStamps,
    userEdTechStates,
  };
}

export function buildFirebaseHeritageSitesPayload(): FirebaseHeritageSitesBranchPayload {
  const rawCustomPhotos = readJsonSafe<Record<string, unknown>>(KEY_CUSTOM_SITE_PHOTOS, {});
  const { cleaned: customSitePhotos } = sanitizeCustomSitePhotosMap(rawCustomPhotos);
  const photoCaptionOverrides = readJsonSafe<Record<string, unknown>>(KEY_PHOTO_CAPTIONS, {});
  const customGlbUrls = readJsonSafe<Record<string, string>>(KEY_CUSTOM_GLB_URLS, {});
  const customGlbModes = readJsonSafe<Record<string, string>>(KEY_CUSTOM_GLB_MODE, {});
  const transforms3D = readJsonSafe<Record<string, Heritage3DTransform>>(
    TRANSFORMS_3D_STORAGE_KEY,
    {}
  );
  const savedHotspots = readJsonSafe<Record<string, HeritageHotspotFeature[]>>(
    HOTSPOTS_3D_STORAGE_KEY,
    {}
  );
  const cmsOverrides = readJsonSafe<Record<string, Record<string, unknown>>>(
    KEY_CMS_OVERRIDES,
    {}
  );
  const hiddenHeritageIds = readJsonSafe<string[]>(KEY_HIDDEN_HERITAGES, []);
  const siteTranslationsOverride = readJsonSafe<Record<string, unknown>>(
    KEY_SITE_TRANSLATIONS,
    {}
  );
  const audioOverrides = readJsonSafe<Record<string, unknown>>(KEY_AUDIO_OVERRIDES, {});
  const publishedQuizzes = readJsonSafe<Record<string, unknown>>(KEY_PUBLISHED_QUIZZES, {});
  const quizDrafts = readJsonSafe<Record<string, unknown>>(KEY_QUIZ_DRAFTS, {});
  const siteSettings = readJsonSafe<Record<string, unknown> | null>(KEY_SITE_SETTINGS, null);

  const hiddenSet = new Set(hiddenHeritageIds);
  const hotspotsBySite: Record<string, HeritageHotspotFeature[]> = {};

  const sites: FirebaseHeritageSiteSnapshot[] = (DEFAULT_HERITAGE_SITES as HeritageSite[]).map(
    (site) => {
      const ov = cmsOverrides[site.id] || {};
      const rawCustom = customSitePhotos[site.id];
      let custom1 = '';
      let custom2 = '';
      if (typeof rawCustom === 'string') {
        custom1 = rawCustom.trim();
      } else if (rawCustom && typeof rawCustom === 'object') {
        const pair = rawCustom as { photo1?: unknown; photo2?: unknown };
        custom1 = typeof pair.photo1 === 'string' ? pair.photo1.trim() : '';
        custom2 = typeof pair.photo2 === 'string' ? pair.photo2.trim() : '';
      }
      const defPhotos = DEFAULT_SITE_PHOTOS_BY_ID[site.id] || ['', ''];
      const photos: [string, string] = [
        normalizeHighResPhotoUrl(custom1 || defPhotos[0] || site.photos?.[0] || ''),
        normalizeHighResPhotoUrl(custom2 || defPhotos[1] || site.photos?.[1] || ''),
      ];

      const defCap = DEFAULT_SITE_PHOTO_CAPTIONS[site.id] || {
        vi: [`Ảnh chụp thực tế 01 · ${site.officialName}`, `Ảnh chụp thực tế 02 · ${site.officialName}`],
        en: [`Archival photograph 01 · ${site.officialName}`, `Archival photograph 02 · ${site.officialName}`],
        zh: [`实景档案照片 01 · ${site.officialName}`, `实景档案照片 02 · ${site.officialName}`],
      };
      const capOv = photoCaptionOverrides[site.id] as
        | {
            slot0?: { vi?: string; en?: string; zh?: string };
            slot1?: { vi?: string; en?: string; zh?: string };
          }
        | undefined;
      const captions = {
        vi: [
          capOv?.slot0?.vi?.trim() || defCap.vi[0],
          capOv?.slot1?.vi?.trim() || defCap.vi[1],
        ] as [string, string],
        en: [
          capOv?.slot0?.en?.trim() || defCap.en[0],
          capOv?.slot1?.en?.trim() || defCap.en[1],
        ] as [string, string],
        zh: [
          capOv?.slot0?.zh?.trim() || defCap.zh[0],
          capOv?.slot1?.zh?.trim() || defCap.zh[1],
        ] as [string, string],
      };

      const cfg3D = DEFAULT_HERITAGE_3D_CONFIG[site.id];
      const tr = transforms3D[site.id];
      const siteHotspots =
        Array.isArray(savedHotspots[site.id]) && savedHotspots[site.id].length > 0
          ? savedHotspots[site.id]
          : cfg3D?.hotspots || [];
      hotspotsBySite[site.id] = siteHotspots;

      return {
        id: site.id,
        officialName:
          typeof ov.officialName === 'string' && ov.officialName.trim()
            ? ov.officialName
            : site.officialName,
        photos,
        captions,
        glbUrl: customGlbUrls[site.id]?.trim() || cfg3D?.glbUrl || site.model3DUrl || '',
        scale:
          typeof tr?.scale === 'number' && Number.isFinite(tr.scale)
            ? tr.scale
            : cfg3D?.scale ?? 1,
        rotationY:
          typeof tr?.rotationY === 'number' && Number.isFinite(tr.rotationY)
            ? tr.rotationY
            : cfg3D?.rotationY ?? 0,
        hotspots: siteHotspots,
        visibility:
          hiddenSet.has(site.id) || ov.visibility === 'hidden' || ov.isHidden === true
            ? 'hidden'
            : 'published',
        summary:
          typeof ov.summary === 'string' && ov.summary.trim() ? ov.summary : site.summary,
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
      };
    }
  );

  return {
    updatedAt: new Date().toISOString(),
    sites,
    customSitePhotos,
    photoCaptionOverrides,
    customGlbUrls,
    customGlbModes,
    transforms3D,
    hotspotsBySite,
    cmsOverrides,
    hiddenHeritageIds,
    siteTranslationsOverride,
    audioOverrides,
    publishedQuizzes,
    quizDrafts,
    siteSettings,
  };
}

let lastAppliedAccountsAt = '';
let lastAppliedHeritageAt = '';

export function applyFirebaseAccountsPayload(
  remote: Partial<FirebaseAccountsBranchPayload> | null | undefined,
  forceOverwrite = false
): boolean {
  if (typeof window === 'undefined' || !remote || typeof remote !== 'object') return false;
  if (!forceOverwrite && remote.updatedAt && remote.updatedAt === lastAppliedAccountsAt) {
    return false;
  }
  if (remote.updatedAt) {
    lastAppliedAccountsAt = remote.updatedAt;
  }

  let accountsDbChanged = false;
  let visitorsChanged = false;
  let passesChanged = false;
  let tiersChanged = false;
  let testersChanged = false;
  let adminsChanged = false;
  let locksChanged = false;
  let passportChanged = false;

  if (Array.isArray(remote.accountsDb)) {
    if (writeJsonIfChanged(KEY_ACCOUNTS_DB, remote.accountsDb)) {
      accountsDbChanged = true;
    }
  }

  // Hydrate credentials (merging from remote.userCredentials AND any credential fields inside accountsDb)
  const localCreds = readJsonSafe<Record<string, Record<string, unknown>>>(
    KEY_USER_CREDENTIALS,
    {}
  );
  const nextCreds: Record<string, Record<string, unknown>> =
    remote.userCredentials && typeof remote.userCredentials === 'object'
      ? { ...localCreds, ...remote.userCredentials }
      : { ...localCreds };

  if (Array.isArray(remote.accountsDb)) {
    remote.accountsDb.forEach((acc) => {
      if (!acc || typeof acc !== 'object') return;
      const email = String(acc.email || '').toLowerCase().trim();
      const provider = acc.provider === 'facebook' ? 'facebook' : 'google';
      const uid = String(acc.userId || acc.id || email).trim();
      if (!email || (!acc.passwordHash && !acc.password)) return;
      const credKey = `${provider}:${email}`;
      const existingCred = nextCreds[credKey];
      if (
        !existingCred ||
        String(acc.updatedAt || '') >= String(existingCred.updatedAt || '')
      ) {
        nextCreds[credKey] = {
          ...(existingCred || {}),
          userId: uid,
          provider,
          identifier: email,
          email,
          displayName: String(acc.displayName || acc.name || email),
          salt: typeof acc.salt === 'string' ? acc.salt : existingCred?.salt || '',
          passwordHash:
            typeof acc.passwordHash === 'string'
              ? acc.passwordHash
              : existingCred?.passwordHash || '',
          password:
            typeof acc.password === 'string' ? acc.password : existingCred?.password || '',
          createdAt: String(acc.createdAt || existingCred?.createdAt || new Date().toISOString()),
          updatedAt: String(acc.updatedAt || new Date().toISOString()),
        };
      }
    });
  }
  if (Object.keys(nextCreds).length > 0 && writeJsonIfChanged(KEY_USER_CREDENTIALS, nextCreds)) {
    visitorsChanged = true;
  }

  if (Array.isArray(remote.visitors)) {
    if (writeJsonIfChanged(KEY_VISITORS_REGISTRY, remote.visitors)) {
      visitorsChanged = true;
    }
  }
  if (Array.isArray(remote.issuedPasses)) {
    if (writeJsonIfChanged(KEY_ISSUED_PASSES, remote.issuedPasses)) {
      passesChanged = true;
    }
  }
  if (remote.subscriptionTiers && typeof remote.subscriptionTiers === 'object') {
    if (writeJsonIfChanged(KEY_SUBSCRIPTION_TIERS, remote.subscriptionTiers)) {
      tiersChanged = true;
    }
  }
  if (remote.schoolPackages && typeof remote.schoolPackages === 'object') {
    if (writeJsonIfChanged(KEY_SCHOOL_PACKAGES, remote.schoolPackages)) {
      tiersChanged = true;
      accountsDbChanged = true;
    }
  }
  if (Array.isArray(remote.testerAllowlistEmails)) {
    if (writeJsonIfChanged(KEY_TESTER_ALLOWLIST, remote.testerAllowlistEmails)) {
      testersChanged = true;
    }
  }
  if (Array.isArray(remote.secondaryAdminEmails)) {
    if (writeJsonIfChanged(KEY_ADMIN_EMAILS, remote.secondaryAdminEmails)) {
      adminsChanged = true;
    }
  }
  if (remote.lockedAccounts && typeof remote.lockedAccounts === 'object') {
    if (writeJsonIfChanged(KEY_LOCKED_ACCOUNTS, remote.lockedAccounts)) {
      locksChanged = true;
    }
  }
  if (remote.passportStamps && typeof remote.passportStamps === 'object') {
    Object.entries(remote.passportStamps).forEach(([scope, stampMap]) => {
      if (!scope || !stampMap || typeof stampMap !== 'object') return;
      if (writeJsonIfChanged(`${KEY_PASSPORT_PREFIX}${scope}`, stampMap)) {
        passportChanged = true;
      }
    });
  }
  if (remote.userEdTechStates && typeof remote.userEdTechStates === 'object') {
    Object.entries(remote.userEdTechStates).forEach(([scope, st]) => {
      if (!scope || !st || typeof st !== 'object') return;
      writeJsonIfChanged(`${KEY_USER_EDTECH_PREFIX}${scope}`, st);
    });
  }

  // Keep current active user's simple userTier key aligned with synced Firebase state
  try {
    const rawSession = window.localStorage.getItem(KEY_AUTH_SESSION);
    if (rawSession) {
      const sess = JSON.parse(rawSession) as { email?: string; userId?: string } | null;
      const sessEmail = (sess?.email || '').toLowerCase().trim();
      const matchedAcc = Array.isArray(remote.accountsDb)
        ? remote.accountsDb.find(
            (a) =>
              (sessEmail && String(a?.email || '').toLowerCase().trim() === sessEmail) ||
              (sess?.userId && a?.userId === sess.userId)
          )
        : undefined;
      if (
        matchedAcc &&
        (matchedAcc.userTier === 'free' ||
          matchedAcc.userTier === 'plus' ||
          matchedAcc.userTier === 'pro')
      ) {
        window.localStorage.setItem(KEY_USER_TIER_SIMPLE, String(matchedAcc.userTier));
      }
    }
  } catch {
    // ignore
  }

  if (accountsDbChanged) emitEvent(EVT_ACCOUNTS_DB);
  if (visitorsChanged) emitEvent(EVT_VISITORS);
  if (passesChanged) emitEvent(EVT_PASSES);
  if (tiersChanged) emitEvent(EVT_SUBSCRIPTION_TIER);
  if (testersChanged) emitEvent(EVT_TESTER_ALLOWLIST);
  if (adminsChanged) emitEvent(EVT_ADMIN_EMAILS);
  if (locksChanged) emitEvent(EVT_LOCKS);
  if (passportChanged) emitEvent(EVT_PASSPORT);

  return (
    accountsDbChanged ||
    visitorsChanged ||
    passesChanged ||
    tiersChanged ||
    testersChanged ||
    adminsChanged ||
    locksChanged ||
    passportChanged
  );
}

export function applyFirebaseHeritageSitesPayload(
  remote: Partial<FirebaseHeritageSitesBranchPayload> | null | undefined,
  forceOverwrite = false
): boolean {
  if (typeof window === 'undefined' || !remote || typeof remote !== 'object') return false;
  if (!forceOverwrite && remote.updatedAt && remote.updatedAt === lastAppliedHeritageAt) {
    return false;
  }
  if (remote.updatedAt) {
    lastAppliedHeritageAt = remote.updatedAt;
  }

  let photosChanged = false;
  let captionsChanged = false;
  let glbChanged = false;
  let config3DChanged = false;
  let cmsChanged = false;
  let quizzesChanged = false;

  let sanitizedRemoteLegacyPhotos = false;
  if (remote.customSitePhotos && typeof remote.customSitePhotos === 'object') {
    const { cleaned, changed: legacyStripped } = sanitizeCustomSitePhotosMap(
      remote.customSitePhotos
    );
    sanitizedRemoteLegacyPhotos = legacyStripped;
    if (writeJsonIfChanged(KEY_CUSTOM_SITE_PHOTOS, cleaned)) {
      photosChanged = true;
    }
  }
  if (remote.photoCaptionOverrides && typeof remote.photoCaptionOverrides === 'object') {
    if (writeJsonIfChanged(KEY_PHOTO_CAPTIONS, remote.photoCaptionOverrides)) {
      captionsChanged = true;
    }
  }
  if (remote.customGlbUrls && typeof remote.customGlbUrls === 'object') {
    if (writeJsonIfChanged(KEY_CUSTOM_GLB_URLS, remote.customGlbUrls)) {
      glbChanged = true;
    }
  }
  if (remote.customGlbModes && typeof remote.customGlbModes === 'object') {
    if (writeJsonIfChanged(KEY_CUSTOM_GLB_MODE, remote.customGlbModes)) {
      glbChanged = true;
    }
  }
  if (remote.transforms3D && typeof remote.transforms3D === 'object') {
    if (writeJsonIfChanged(TRANSFORMS_3D_STORAGE_KEY, remote.transforms3D)) {
      config3DChanged = true;
    }
  }
  if (remote.hotspotsBySite && typeof remote.hotspotsBySite === 'object') {
    if (writeJsonIfChanged(HOTSPOTS_3D_STORAGE_KEY, remote.hotspotsBySite)) {
      config3DChanged = true;
    }
  }
  if (remote.cmsOverrides && typeof remote.cmsOverrides === 'object') {
    if (writeJsonIfChanged(KEY_CMS_OVERRIDES, remote.cmsOverrides)) {
      cmsChanged = true;
    }
  }
  if (Array.isArray(remote.hiddenHeritageIds)) {
    if (writeJsonIfChanged(KEY_HIDDEN_HERITAGES, remote.hiddenHeritageIds)) {
      cmsChanged = true;
    }
  }
  if (remote.siteTranslationsOverride && typeof remote.siteTranslationsOverride === 'object') {
    if (writeJsonIfChanged(KEY_SITE_TRANSLATIONS, remote.siteTranslationsOverride)) {
      cmsChanged = true;
    }
  }
  if (remote.audioOverrides && typeof remote.audioOverrides === 'object') {
    if (writeJsonIfChanged(KEY_AUDIO_OVERRIDES, remote.audioOverrides)) {
      cmsChanged = true;
    }
  }
  if (remote.publishedQuizzes && typeof remote.publishedQuizzes === 'object') {
    if (writeJsonIfChanged(KEY_PUBLISHED_QUIZZES, remote.publishedQuizzes)) {
      quizzesChanged = true;
    }
  }
  if (remote.quizDrafts && typeof remote.quizDrafts === 'object') {
    writeJsonIfChanged(KEY_QUIZ_DRAFTS, remote.quizDrafts);
  }
  if (remote.siteSettings && typeof remote.siteSettings === 'object') {
    if (writeJsonIfChanged(KEY_SITE_SETTINGS, remote.siteSettings)) {
      cmsChanged = true;
    }
  }

  // Fallback: if remote.sites contains direct transforms/glbUrl/hotspots when override maps are omitted
  if (Array.isArray(remote.sites) && remote.sites.length > 0 && !remote.transforms3D) {
    const derivedTransforms: Record<string, Heritage3DTransform> = {};
    remote.sites.forEach((s) => {
      if (s?.id && typeof s.scale === 'number' && typeof s.rotationY === 'number') {
        derivedTransforms[s.id] = { scale: s.scale, rotationY: s.rotationY };
      }
    });
    if (
      Object.keys(derivedTransforms).length > 0 &&
      writeJsonIfChanged(TRANSFORMS_3D_STORAGE_KEY, derivedTransforms)
    ) {
      config3DChanged = true;
    }
  }

  if (photosChanged) emitEvent(EVT_CUSTOM_PHOTOS);
  if (captionsChanged) emitEvent(EVT_PHOTO_CAPTIONS);
  if (glbChanged) emitEvent(EVT_GLB_MODELS);
  if (config3DChanged) emitEvent(EVT_3D_CONFIG);
  if (cmsChanged) emitEvent(EVT_CMS);
  if (quizzesChanged) emitEvent(EVT_QUIZZES);

  // If Firebase contained outdated/blurry custom photo URLs, overwrite Firebase with the clean HD dataset
  if (sanitizedRemoteLegacyPhotos) {
    void pushHeritageSitesToFirebase(false);
  }

  return (
    photosChanged ||
    captionsChanged ||
    glbChanged ||
    config3DChanged ||
    cmsChanged ||
    quizzesChanged
  );
}

let inFlightAccountsPull: Promise<boolean> | null = null;
let inFlightCombinedPull: Promise<boolean> | null = null;
let heritagePushDebounceTimer: number | null = null;

export async function pullAccountsFromFirebase(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({ state: 'unconfigured', lastError: null });
    return false;
  }
  if (inFlightAccountsPull) return inFlightAccountsPull;

  inFlightAccountsPull = (async () => {
    try {
      const res = await fetch(FIREBASE_ACCOUNTS_ENDPOINT, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) {
        setFirebaseSyncStatus({ state: 'offline', lastError: `HTTP ${res.status}` });
        return false;
      }
      const data = (await res.json()) as Partial<FirebaseAccountsBranchPayload> | null;
      if (data && typeof data === 'object') {
        applyFirebaseAccountsPayload(data);
      }
      setFirebaseSyncStatus({
        state: 'synced',
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
      });
      return true;
    } catch {
      setFirebaseSyncStatus({ state: 'offline', lastError: 'Network error' });
      return false;
    } finally {
      inFlightAccountsPull = null;
    }
  })();

  return inFlightAccountsPull;
}

export async function pullHeritageSitesFromFirebase(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({ state: 'unconfigured', lastError: null });
    return false;
  }
  try {
    const res = await fetch(FIREBASE_HERITAGE_SITES_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) {
      setFirebaseSyncStatus({ state: 'offline', lastError: `HTTP ${res.status}` });
      return false;
    }
    const data = (await res.json()) as Partial<FirebaseHeritageSitesBranchPayload> | null;
    if (data && typeof data === 'object') {
      applyFirebaseHeritageSitesPayload(data);
    }
    setFirebaseSyncStatus({
      state: 'synced',
      lastSyncedAt: new Date().toISOString(),
      lastError: null,
    });
    return true;
  } catch {
    setFirebaseSyncStatus({ state: 'offline', lastError: 'Network error' });
    return false;
  }
}

export async function pullFromFirebaseRealtimeDb(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({ state: 'unconfigured', lastError: null });
    return false;
  }
  if (inFlightCombinedPull) return inFlightCombinedPull;

  inFlightCombinedPull = (async () => {
    setFirebaseSyncStatus({ state: 'syncing', lastError: null });
    try {
      const [accOk, sitesOk] = await Promise.all([
        pullAccountsFromFirebase(),
        pullHeritageSitesFromFirebase(),
        pullAmbientPlaylistFromFirebase(),
        pullFeedbacksFromFirebase(),
        pullSupportTicketsFromFirebase(),
        pullEmailConfigSnapshotFromFirebase(),
      ]);
      const anyOk = accOk || sitesOk;
      setFirebaseSyncStatus({
        state: anyOk ? 'synced' : 'offline',
        ...(anyOk ? { lastSyncedAt: new Date().toISOString(), lastError: null } : {}),
      });
      return anyOk;
    } catch {
      setFirebaseSyncStatus({ state: 'offline', lastError: 'Sync failed' });
      return false;
    } finally {
      inFlightCombinedPull = null;
    }
  })();

  return inFlightCombinedPull;
}

export async function pushAccountsToFirebase(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({ state: 'unconfigured' });
    return false;
  }

  setFirebaseSyncStatus({ state: 'syncing', lastError: null });
  try {
    const payload = buildFirebaseAccountsPayload();
    lastAppliedAccountsAt = payload.updatedAt;
    const res = await fetch(FIREBASE_ACCOUNTS_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setFirebaseSyncStatus({ state: 'offline', lastError: `HTTP ${res.status}` });
      return false;
    }
    setFirebaseSyncStatus({
      state: 'synced',
      lastSyncedAt: payload.updatedAt,
      lastError: null,
    });
    return true;
  } catch {
    setFirebaseSyncStatus({ state: 'offline', lastError: 'Network error' });
    return false;
  }
}

async function executeHeritageSitesPut(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({ state: 'unconfigured' });
    return false;
  }

  setFirebaseSyncStatus({ state: 'syncing', lastError: null });
  try {
    const payload = buildFirebaseHeritageSitesPayload();
    lastAppliedHeritageAt = payload.updatedAt;
    const res = await fetch(FIREBASE_HERITAGE_SITES_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setFirebaseSyncStatus({ state: 'offline', lastError: `HTTP ${res.status}` });
      return false;
    }
    setFirebaseSyncStatus({
      state: 'synced',
      lastSyncedAt: payload.updatedAt,
      lastError: null,
    });
    return true;
  } catch {
    setFirebaseSyncStatus({ state: 'offline', lastError: 'Network error' });
    return false;
  }
}

export function pushHeritageSitesToFirebase(immediate = true): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (heritagePushDebounceTimer !== null) {
    window.clearTimeout(heritagePushDebounceTimer);
    heritagePushDebounceTimer = null;
  }
  if (immediate) {
    return executeHeritageSitesPut();
  }
  return new Promise((resolve) => {
    heritagePushDebounceTimer = window.setTimeout(() => {
      heritagePushDebounceTimer = null;
      void executeHeritageSitesPut().then(resolve);
    }, 450);
  });
}

export async function pushAllCurrentDataToFirebase(): Promise<{
  ok: boolean;
  unconfigured?: boolean;
  error?: string;
}> {
  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({
      state: 'unconfigured',
      lastError: 'Chưa gắn đường dẫn Firebase Realtime Database',
    });
    return {
      ok: false,
      unconfigured: true,
      error:
        'Vui lòng dán URL Firebase Realtime Database vào hằng số FIREBASE_DB_URL trong src/utils/firebaseRestSync.ts (hoặc biến VITE_FIREBASE_DB_URL).',
    };
  }

  setFirebaseSyncStatus({ state: 'syncing', lastError: null });
  try {
    const [accOk, sitesOk] = await Promise.all([
      pushAccountsToFirebase(),
      pushHeritageSitesToFirebase(true),
    ]);
    if (accOk && sitesOk) {
      setFirebaseSyncStatus({
        state: 'synced',
        lastSyncedAt: new Date().toISOString(),
        lastError: null,
      });
      return { ok: true };
    }
    setFirebaseSyncStatus({
      state: 'offline',
      lastError: 'Không thể ghi đầy đủ dữ liệu lên Firebase',
    });
    return {
      ok: false,
      error: 'Không thể ghi đầy đủ lên Firebase. Kiểm tra kết nối mạng hoặc Rules (.read/.write).',
    };
  } catch (err) {
    setFirebaseSyncStatus({ state: 'offline', lastError: 'Lỗi kết nối Firebase' });
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Lỗi kết nối Firebase Realtime Database.',
    };
  }
}

export interface FirebaseUserProfileRecord {
  uid: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'admin' | 'tester' | 'visitor';
  isPrimaryAdmin: boolean;
  isBetaTester: boolean;
  userTier: 'free' | 'plus' | 'pro';
  hasSchoolPackage: boolean;
  authMethod: 'oauth_sdk' | 'password_verified' | 'judge_quick_access';
  lastLoginAt: string;
  updatedAt: string;
}

export function sanitizeFirebaseUserKey(uidOrEmail: string): string {
  return uidOrEmail.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function syncUserProfileToFirebaseRealtimeDb(
  profile: Omit<FirebaseUserProfileRecord, 'updatedAt'> & { updatedAt?: string }
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  const safeKey = sanitizeFirebaseUserKey(profile.uid || profile.email);
  if (!safeKey) return false;

  const updatedAt = profile.updatedAt || new Date().toISOString();
  const payload: FirebaseUserProfileRecord = {
    uid: profile.uid,
    userId: profile.userId,
    email: profile.email.toLowerCase().trim(),
    displayName: profile.displayName,
    ...(profile.photoURL ? { photoURL: profile.photoURL } : {}),
    role: profile.role,
    isPrimaryAdmin: profile.isPrimaryAdmin,
    isBetaTester: profile.isBetaTester,
    userTier: profile.userTier,
    hasSchoolPackage: profile.hasSchoolPackage,
    authMethod: profile.authMethod,
    lastLoginAt: profile.lastLoginAt,
    updatedAt,
  };

  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({ state: 'unconfigured', lastError: null });
    return false;
  }

  setFirebaseSyncStatus({ state: 'syncing', lastError: null });
  try {
    const endpoint = `${FIREBASE_USERS_ROOT_ENDPOINT}/${safeKey}.json`;
    const [userRes] = await Promise.all([
      fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      pushAccountsToFirebase(),
    ]);

    if (!userRes.ok) {
      setFirebaseSyncStatus({ state: 'offline', lastError: `HTTP ${userRes.status}` });
      return false;
    }

    setFirebaseSyncStatus({
      state: 'synced',
      lastSyncedAt: updatedAt,
      lastError: null,
    });
    return true;
  } catch {
    setFirebaseSyncStatus({ state: 'offline', lastError: 'Network error' });
    return false;
  }
}

export async function pullUserProfileFromFirebaseRealtimeDb(
  uidOrEmail: string
): Promise<FirebaseUserProfileRecord | null> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
  if (!isFirebaseDbConfigured()) return null;
  const safeKey = sanitizeFirebaseUserKey(uidOrEmail);
  if (!safeKey) return null;

  try {
    const res = await fetch(`${FIREBASE_USERS_ROOT_ENDPOINT}/${safeKey}.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<FirebaseUserProfileRecord> | null;
    if (!data || typeof data !== 'object' || !data.email) return null;
    return data as FirebaseUserProfileRecord;
  } catch {
    return null;
  }
}

export interface FirebaseDirectoryUserSummary {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'tester' | 'visitor';
  isBetaTester?: boolean;
  updatedAt?: string;
}

/**
 * Writes `/users/{uid}/role` (e.g. "tester" | "visitor" | "admin") directly to Firebase Realtime Database
 * alongside `/dau_an_viet_3d/users/{uid}` so both UID-keyed and email-keyed lookups resolve reliably.
 */
export async function syncUserRoleToFirebaseRealtimeDb(params: {
  uid?: string;
  email?: string;
  role: 'admin' | 'tester' | 'visitor';
  displayName?: string;
}): Promise<{ ok: boolean; syncedFirebase: boolean; pathKey: string }> {
  const normEmail = (params.email || '').toLowerCase().trim();
  const primaryKey = sanitizeFirebaseUserKey(params.uid || normEmail);
  const emailKey = normEmail ? sanitizeFirebaseUserKey(normEmail) : '';
  if (!primaryKey) {
    return { ok: false, syncedFirebase: false, pathKey: '' };
  }

  if (typeof window === 'undefined' || typeof fetch !== 'function' || !isFirebaseDbConfigured()) {
    return { ok: true, syncedFirebase: false, pathKey: primaryKey };
  }

  const nowIso = new Date().toISOString();
  const patchPayload: Record<string, unknown> = {
    role: params.role,
    isBetaTester: params.role === 'tester',
    updatedAt: nowIso,
    ...(params.uid ? { uid: params.uid } : {}),
    ...(normEmail ? { email: normEmail } : {}),
    ...(params.displayName ? { displayName: params.displayName } : {}),
  };

  const keysToSync = Array.from(new Set([primaryKey, emailKey].filter(Boolean)));

  try {
    const requests: Promise<Response>[] = [];
    for (const key of keysToSync) {
      requests.push(
        fetch(`${FIREBASE_DB_URL}/users/${key}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchPayload),
        }),
        fetch(`${FIREBASE_USERS_ROOT_ENDPOINT}/${key}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patchPayload),
        })
      );
    }
    const results = await Promise.all(requests);
    const syncedFirebase = results.some((r) => r.ok);
    return { ok: true, syncedFirebase, pathKey: primaryKey };
  } catch {
    return { ok: true, syncedFirebase: false, pathKey: primaryKey };
  }
}

export async function pullUserRoleFromFirebaseRealtimeDb(
  uidOrEmail: string
): Promise<'admin' | 'tester' | 'visitor' | null> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
  if (!isFirebaseDbConfigured()) return null;
  const safeKey = sanitizeFirebaseUserKey(uidOrEmail);
  if (!safeKey) return null;

  const endpoints = [
    `${FIREBASE_DB_URL}/users/${safeKey}/role.json`,
    `${FIREBASE_USERS_ROOT_ENDPOINT}/${safeKey}/role.json`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!res.ok) continue;
      const val = (await res.json()) as unknown;
      if (val === 'admin' || val === 'tester' || val === 'visitor') {
        return val;
      }
    } catch {
      // try next endpoint
    }
  }
  return null;
}

export async function pullAllUsersFromFirebaseRealtimeDb(): Promise<
  FirebaseDirectoryUserSummary[]
> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return [];
  if (!isFirebaseDbConfigured()) return [];

  const endpoints = [
    `${FIREBASE_DB_URL}/users.json`,
    `${FIREBASE_USERS_ROOT_ENDPOINT}.json`,
  ];

  const byEmailOrKey = new Map<string, FirebaseDirectoryUserSummary>();

  await Promise.all(
    endpoints.map(async (url) => {
      try {
        const res = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!res.ok) return;
        const raw = (await res.json()) as Record<string, Record<string, unknown>> | null;
        if (!raw || typeof raw !== 'object') return;
        for (const [key, item] of Object.entries(raw)) {
          if (!item || typeof item !== 'object') continue;
          const email = typeof item.email === 'string' ? item.email.toLowerCase().trim() : '';
          const uid = typeof item.uid === 'string' && item.uid.trim() ? item.uid.trim() : key;
          const displayName =
            typeof item.displayName === 'string' && item.displayName.trim()
              ? item.displayName.trim()
              : email || uid;
          const rawRole = item.role;
          const role: 'admin' | 'tester' | 'visitor' =
            rawRole === 'admin'
              ? 'admin'
              : rawRole === 'tester' || Boolean(item.isBetaTester)
              ? 'tester'
              : 'visitor';
          const mapKey = email || uid;
          const existing = byEmailOrKey.get(mapKey);
          if (!existing) {
            byEmailOrKey.set(mapKey, {
              uid,
              email,
              displayName,
              role,
              isBetaTester: role === 'tester' || Boolean(item.isBetaTester),
              updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : undefined,
            });
          } else {
            const mergedRole: 'admin' | 'tester' | 'visitor' =
              existing.role === 'admin' || role === 'admin'
                ? 'admin'
                : existing.role === 'tester' || role === 'tester'
                ? 'tester'
                : 'visitor';
            byEmailOrKey.set(mapKey, {
              uid: existing.uid && !existing.uid.includes('_') ? existing.uid : uid,
              email: existing.email || email,
              displayName: existing.displayName || displayName,
              role: mergedRole,
              isBetaTester: mergedRole === 'tester',
              updatedAt: existing.updatedAt || (typeof item.updatedAt === 'string' ? item.updatedAt : undefined),
            });
          }
        }
      } catch {
        // ignore network error per branch
      }
    })
  );

  return Array.from(byEmailOrKey.values()).filter((u) => Boolean(u.email || u.uid));
}

/**
 * Resolves `firebase-glb://<keyOrPath>` pointers stored in heritage config or Firebase RTDB
 * into a loadable Blob URL or HTTPS URL for GLTFLoader.
 */
export async function resolveFirebaseGlbPointer(pointerUrl: string): Promise<string | null> {
  const trimmed = pointerUrl.trim();
  if (!/^firebase-glb:\/\//i.test(trimmed)) return null;
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
  if (!isFirebaseDbConfigured()) return null;

  const rawPath = trimmed.replace(/^firebase-glb:\/\//i, '').replace(/^\/+/, '');
  if (!rawPath) return null;

  const cleanPath = rawPath.replace(/\.json$/i, '');
  const candidateEndpoints = [
    `${FIREBASE_DB_URL}/dau_an_viet_3d/glb_assets/${cleanPath}.json`,
    `${FIREBASE_DB_URL}/dau_an_viet_3d/glb_models/${cleanPath}.json`,
    `${FIREBASE_DB_URL}/${cleanPath}.json`,
  ];

  for (const endpoint of candidateEndpoints) {
    try {
      const res = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (!res.ok) continue;
      const payload = (await res.json()) as
        | string
        | { dataUrl?: unknown; base64?: unknown; url?: unknown; content?: unknown }
        | null;
      if (!payload) continue;

      if (typeof payload === 'string') {
        if (payload.startsWith('data:') || /^https?:\/\//i.test(payload) || payload.startsWith('/')) {
          return payload;
        }
        if (payload.length > 64) {
          return `data:model/gltf-binary;base64,${payload}`;
        }
      } else if (typeof payload === 'object') {
        if (typeof payload.dataUrl === 'string' && payload.dataUrl.trim()) {
          return payload.dataUrl.trim();
        }
        if (typeof payload.url === 'string' && payload.url.trim()) {
          return payload.url.trim();
        }
        const b64 =
          typeof payload.base64 === 'string'
            ? payload.base64.trim()
            : typeof payload.content === 'string'
            ? payload.content.trim()
            : '';
        if (b64) {
          return b64.startsWith('data:') ? b64 : `data:model/gltf-binary;base64,${b64}`;
        }
      }
    } catch {
      // try next candidate path
    }
  }
  return null;
}

export interface FirebaseAmbientAudioAsset {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  updatedAt: string;
}

export interface FirebaseAmbientPlaylistRecord {
  updatedAt: string;
  enabled: boolean;
  playlist: Array<Record<string, unknown>>;
}

export const FIREBASE_AMBIENT_AUDIO_ENDPOINT = `${FIREBASE_DB_URL}/dau_an_viet_3d/ambient_audio.json`;
export const FIREBASE_AMBIENT_ASSETS_ROOT_ENDPOINT = `${FIREBASE_DB_URL}/dau_an_viet_3d/ambient_audio_assets`;
export const FIREBASE_AMBIENT_PLAYLIST_ENDPOINT = `${FIREBASE_DB_URL}/dau_an_viet_3d/ambient_playlist.json`;

function sanitizeAmbientAssetKey(trackId: string): string {
  return trackId.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'default';
}

export async function pushAmbientTrackAssetToFirebase(
  trackId: string,
  asset: Omit<FirebaseAmbientAudioAsset, 'updatedAt'> & { updatedAt?: string }
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({ state: 'unconfigured', lastError: null });
    return false;
  }

  const safeKey = sanitizeAmbientAssetKey(trackId);
  const updatedAt = asset.updatedAt || new Date().toISOString();
  const payload: FirebaseAmbientAudioAsset = {
    dataUrl: asset.dataUrl,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    updatedAt,
  };

  setFirebaseSyncStatus({ state: 'syncing', lastError: null });
  try {
    const endpoint =
      safeKey === 'default'
        ? FIREBASE_AMBIENT_AUDIO_ENDPOINT
        : `${FIREBASE_AMBIENT_ASSETS_ROOT_ENDPOINT}/${safeKey}.json`;
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setFirebaseSyncStatus({ state: 'offline', lastError: `HTTP ${res.status}` });
      return false;
    }
    setFirebaseSyncStatus({
      state: 'synced',
      lastSyncedAt: updatedAt,
      lastError: null,
    });
    return true;
  } catch {
    setFirebaseSyncStatus({ state: 'offline', lastError: 'Network error' });
    return false;
  }
}

export async function pullAmbientTrackAssetFromFirebase(
  trackId: string
): Promise<FirebaseAmbientAudioAsset | null> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return null;
  if (!isFirebaseDbConfigured()) return null;

  const safeKey = sanitizeAmbientAssetKey(trackId);
  const endpoint =
    safeKey === 'default'
      ? FIREBASE_AMBIENT_AUDIO_ENDPOINT
      : `${FIREBASE_AMBIENT_ASSETS_ROOT_ENDPOINT}/${safeKey}.json`;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<FirebaseAmbientAudioAsset> | null;
    if (!data || typeof data !== 'object' || typeof data.dataUrl !== 'string' || !data.dataUrl.trim()) {
      return null;
    }
    return {
      dataUrl: data.dataUrl,
      fileName: typeof data.fileName === 'string' ? data.fileName : `${safeKey}.mp3`,
      mimeType: typeof data.mimeType === 'string' ? data.mimeType : 'audio/mpeg',
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function deleteAmbientTrackAssetInFirebase(trackId: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) return false;
  const safeKey = sanitizeAmbientAssetKey(trackId);
  const endpoint =
    safeKey === 'default'
      ? FIREBASE_AMBIENT_AUDIO_ENDPOINT
      : `${FIREBASE_AMBIENT_ASSETS_ROOT_ENDPOINT}/${safeKey}.json`;
  try {
    const res = await fetch(endpoint, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pushAmbientPlaylistToFirebase(
  playlist: Array<Record<string, unknown>>,
  enabled = true
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) {
    setFirebaseSyncStatus({ state: 'unconfigured', lastError: null });
    return false;
  }

  const updatedAt = new Date().toISOString();
  const payload: FirebaseAmbientPlaylistRecord = {
    updatedAt,
    enabled,
    playlist,
  };

  setFirebaseSyncStatus({ state: 'syncing', lastError: null });
  try {
    const res = await fetch(FIREBASE_AMBIENT_PLAYLIST_ENDPOINT, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      setFirebaseSyncStatus({ state: 'offline', lastError: `HTTP ${res.status}` });
      return false;
    }
    setFirebaseSyncStatus({
      state: 'synced',
      lastSyncedAt: updatedAt,
      lastError: null,
    });
    return true;
  } catch {
    setFirebaseSyncStatus({ state: 'offline', lastError: 'Network error' });
    return false;
  }
}

export async function pullAmbientPlaylistFromFirebase(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) return false;

  try {
    const res = await fetch(FIREBASE_AMBIENT_PLAYLIST_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const data = (await res.json()) as Partial<FirebaseAmbientPlaylistRecord> | null;
    if (!data || typeof data !== 'object' || !Array.isArray(data.playlist)) return false;

    const currentSettings = readJsonSafe<Record<string, unknown>>(KEY_SITE_SETTINGS, {});
    const mergedSettings = {
      ...currentSettings,
      ...(typeof data.enabled === 'boolean' ? { ambientAudioEnabled: data.enabled } : {}),
      ambientPlaylist: data.playlist,
      ambientAudioUpdatedAt:
        typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
    };
    if (writeJsonIfChanged(KEY_SITE_SETTINGS, mergedSettings)) {
      emitEvent(EVT_CMS);
    }
    return true;
  } catch {
    return false;
  }
}

export async function pushAmbientAudioAssetToFirebase(
  asset: Omit<FirebaseAmbientAudioAsset, 'updatedAt'> & { updatedAt?: string }
): Promise<boolean> {
  return pushAmbientTrackAssetToFirebase('default', asset);
}

export async function pullAmbientAudioAssetFromFirebase(): Promise<FirebaseAmbientAudioAsset | null> {
  return pullAmbientTrackAssetFromFirebase('default');
}

export async function clearAmbientAudioAssetInFirebase(): Promise<boolean> {
  return deleteAmbientTrackAssetInFirebase('default');
}

export interface FirebaseAuthSessionIdentity {
  uid: string;
  userId: string;
  userEmail: string;
  userName: string;
}

export function getCurrentAuthSessionSnapshot(): FirebaseAuthSessionIdentity | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY_AUTH_SESSION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      firebaseUid?: unknown;
      userId?: unknown;
      id?: unknown;
      email?: unknown;
      displayName?: unknown;
    } | null;
    if (!parsed || typeof parsed !== 'object') return null;
    const userId =
      typeof parsed.userId === 'string' && parsed.userId.trim()
        ? parsed.userId.trim()
        : typeof parsed.id === 'string' && parsed.id.trim()
        ? parsed.id.trim()
        : '';
    const firebaseUid =
      typeof parsed.firebaseUid === 'string' && parsed.firebaseUid.trim()
        ? parsed.firebaseUid.trim()
        : '';
    const uid = firebaseUid || userId;
    if (!uid || uid.startsWith('guest_')) return null;
    return {
      uid,
      userId: userId || uid,
      userEmail: typeof parsed.email === 'string' ? parsed.email.trim() : '',
      userName: typeof parsed.displayName === 'string' ? parsed.displayName.trim() : '',
    };
  } catch {
    return null;
  }
}

export async function pushFeedbackToFirebase(
  feedback: Record<string, unknown> & { id: string }
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  const authSession = getCurrentAuthSessionSnapshot();
  if (!authSession) return false;
  if (!isFirebaseDbConfigured()) return false;
  const safeId = sanitizeFirebaseUserKey(feedback.id);
  if (!safeId) return false;

  const payload = {
    ...feedback,
    uid:
      typeof feedback.uid === 'string' && feedback.uid.trim()
        ? feedback.uid.trim()
        : authSession.uid,
    userEmail:
      typeof feedback.userEmail === 'string' && feedback.userEmail.trim()
        ? feedback.userEmail.trim()
        : authSession.userEmail,
    userName:
      typeof feedback.userName === 'string' && feedback.userName.trim()
        ? feedback.userName.trim()
        : authSession.userName,
  };

  try {
    const res = await fetch(`${FIREBASE_FEEDBACKS_ROOT_ENDPOINT}/${safeId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pullFeedbacksFromFirebase(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) return false;

  try {
    const res = await fetch(FIREBASE_FEEDBACKS_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const raw = (await res.json()) as Record<string, Record<string, unknown>> | null;
    if (!raw || typeof raw !== 'object') return true;

    const remoteList = Object.values(raw).filter(
      (item): item is Record<string, unknown> & { id: string; createdAt?: string } =>
        Boolean(item && typeof item === 'object' && typeof item.id === 'string')
    );
    if (remoteList.length === 0) return true;

    const localList = readJsonSafe<Array<Record<string, unknown> & { id: string; createdAt?: string }>>(
      KEY_VISITOR_REVIEWS,
      []
    );
    const mergedById = new Map<string, Record<string, unknown> & { id: string; createdAt?: string }>();
    for (const item of localList) {
      if (item && typeof item.id === 'string') mergedById.set(item.id, item);
    }
    for (const remote of remoteList) {
      const existing = mergedById.get(remote.id);
      mergedById.set(remote.id, existing ? { ...existing, ...remote } : remote);
    }
    const sorted = Array.from(mergedById.values()).sort((a, b) => {
      const ta = typeof a.createdAt === 'string' ? Date.parse(a.createdAt) : 0;
      const tb = typeof b.createdAt === 'string' ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });

    if (writeJsonIfChanged(KEY_VISITOR_REVIEWS, sorted)) {
      emitEvent(EVT_REVIEWS);
    }
    return true;
  } catch {
    return false;
  }
}

export async function pushSupportTicketToFirebase(
  ticket: Record<string, unknown> & { id: string }
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  const authSession = getCurrentAuthSessionSnapshot();
  if (!authSession) return false;
  if (!isFirebaseDbConfigured()) return false;
  const safeId = sanitizeFirebaseUserKey(ticket.id);
  if (!safeId) return false;

  const payload = {
    ...ticket,
    uid:
      typeof ticket.uid === 'string' && ticket.uid.trim()
        ? ticket.uid.trim()
        : authSession.uid,
    userEmail:
      typeof ticket.userEmail === 'string' && ticket.userEmail.trim()
        ? ticket.userEmail.trim()
        : authSession.userEmail,
    userName:
      typeof ticket.userName === 'string' && ticket.userName.trim()
        ? ticket.userName.trim()
        : authSession.userName,
  };

  try {
    const res = await fetch(`${FIREBASE_SUPPORT_TICKETS_ROOT_ENDPOINT}/${safeId}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteSupportTicketInFirebase(ticketId: string): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) return false;
  const safeId = sanitizeFirebaseUserKey(ticketId);
  if (!safeId) return false;

  try {
    const res = await fetch(`${FIREBASE_SUPPORT_TICKETS_ROOT_ENDPOINT}/${safeId}.json`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function pullSupportTicketsFromFirebase(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) return false;

  try {
    const res = await fetch(FIREBASE_SUPPORT_TICKETS_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const raw = (await res.json()) as Record<string, Record<string, unknown>> | null;
    if (!raw || typeof raw !== 'object') return true;

    const remoteList = Object.values(raw).filter(
      (item): item is Record<string, unknown> & { id: string; createdAt?: string; updatedAt?: string } =>
        Boolean(item && typeof item === 'object' && typeof item.id === 'string')
    );
    if (remoteList.length === 0) return true;

    const localList = readJsonSafe<
      Array<Record<string, unknown> & { id: string; createdAt?: string; updatedAt?: string }>
    >(KEY_SUPPORT_TICKETS, []);

    const mergedById = new Map<
      string,
      Record<string, unknown> & { id: string; createdAt?: string; updatedAt?: string }
    >();
    for (const item of localList) {
      if (item && typeof item.id === 'string') mergedById.set(item.id, item);
    }
    for (const remote of remoteList) {
      const existing = mergedById.get(remote.id);
      if (!existing) {
        mergedById.set(remote.id, remote);
      } else {
        const remoteTime = Date.parse(String(remote.updatedAt || remote.createdAt || '')) || 0;
        const localTime = Date.parse(String(existing.updatedAt || existing.createdAt || '')) || 0;
        mergedById.set(
          remote.id,
          remoteTime >= localTime ? { ...existing, ...remote } : { ...remote, ...existing }
        );
      }
    }

    const sorted = Array.from(mergedById.values()).sort((a, b) => {
      const ta = Date.parse(String(a.updatedAt || a.createdAt || '')) || 0;
      const tb = Date.parse(String(b.updatedAt || b.createdAt || '')) || 0;
      return tb - ta;
    });

    if (writeJsonIfChanged(KEY_SUPPORT_TICKETS, sorted)) {
      emitEvent(EVT_SUPPORT_TICKETS);
    }
    return true;
  } catch {
    return false;
  }
}

async function pullEmailConfigSnapshotFromFirebase(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (!isFirebaseDbConfigured()) return false;

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/settings/emailConfig.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return false;
    const raw = (await res.json()) as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') return true;
    const normalized = {
      enabled: Boolean(raw.enabled),
      serviceId:
        typeof raw.serviceId === 'string' && raw.serviceId.trim()
          ? raw.serviceId.trim()
          : 'service_h3htk56',
      templateId: typeof raw.templateId === 'string' ? raw.templateId.trim() : '',
      publicKey: typeof raw.publicKey === 'string' ? raw.publicKey.trim() : '',
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    };
    if (writeJsonIfChanged('dau_an_viet_emailjs_config_v1', normalized)) {
      emitEvent('dau-an-viet-emailjs-config-updated');
    }
    return true;
  } catch {
    return false;
  }
}

import {
  pullAccountsFromFirebase,
  pullFromFirebaseRealtimeDb,
  pushAccountsToFirebase,
  pushHeritageSitesToFirebase,
} from './firebaseRestSync';
import { sanitizeCustomSitePhotosMap } from '../data/heritagePhotos';

export interface VisitHistoryLogEntry {
  id: string;
  timestamp: string;
  action: 'visit' | 'open_3d' | 'open_dossier';
  actionLabel: string;
  siteId?: string;
  siteName?: string;
  deviceType: 'Máy tính' | 'Điện thoại';
  visitorLabel?: string;
}

export const ANALYTICS_UPDATED_EVENT = 'dau-an-viet-analytics-updated';
export const ADMIN_EMAILS_UPDATED_EVENT = 'dau-an-viet-admin-emails-updated';
export const TESTER_ALLOWLIST_UPDATED_EVENT = 'dau-an-viet-tester-allowlist-updated';
export const VISIT_HISTORY_STORAGE_KEY = 'dau_an_viet_visit_history_v1';
const VISIT_COUNTED_SESSION_KEY = 'dau_an_viet_visit_counted_v1';

export const CLOUD_API_URL =
  import.meta.env.VITE_EMAIL_WEBHOOK_URL ||
  'https://script.google.com/macros/s/AKfycbz-kalyvxbR891WF3sd5w3dDnUAQx2KEY6JXvBavf0By2w_tT0Jq4AYSPrguY6nn3-lAg/exec';

// Storage keys mirrored with adminPlatformStore & heritagePassport
const KEY_ADMIN_EMAILS = 'dau_an_viet_admin_emails';
const KEY_TESTER_ALLOWLIST = 'dau_an_viet_tester_allowlist_v1';
const KEY_ADMIN_PASSWORD_HASH = 'dau_an_viet_admin_password_hash_v1';
const KEY_USER_CREDENTIALS = 'dau_an_viet_user_credentials_v1';
const KEY_VISITORS_REGISTRY = 'dau_an_viet_visitors_registry_v1';
const KEY_LOCKED_ACCOUNTS = 'dau_an_viet_locked_accounts_v1';
const KEY_ISSUED_PASSES = 'dau_an_viet_issued_passes_v1';
const KEY_ANALYTICS = 'dau_an_viet_analytics_v1';
const KEY_AUDIT_LOGS = 'dau_an_viet_audit_logs_v1';
const KEY_CMS_OVERRIDES = 'dau_an_viet_cms_overrides_v1';
const KEY_AUDIO_OVERRIDES = 'dau_an_viet_audio_script_overrides_v1';
const KEY_SITE_SETTINGS = 'dau_an_viet_site_settings_v1';
const KEY_USER_EDTECH_PREFIX = 'dau_an_viet_user_edtech_v1_';
const KEY_VISITOR_REVIEWS = 'dau_an_viet_visitor_reviews';
const KEY_HIDDEN_HERITAGES = 'dau_an_viet_hidden_heritages';
const KEY_SITE_TRANSLATIONS = 'dau_an_viet_site_translations_v1';
const KEY_QUIZ_DRAFTS = 'dau_an_viet_quiz_drafts_v1';
const KEY_PUBLISHED_QUIZZES = 'dau_an_viet_published_quizzes_v1';
const KEY_EMERGENCY_LOCKDOWN = 'dau_an_viet_emergency_lockdown';
const KEY_SECURITY_LOGS = 'dau_an_viet_security_logs_v1';
const KEY_SUPPORT_TICKETS = 'dau_an_viet_support_tickets';
const KEY_AI_AUTOPILOT = 'dau_an_viet_ai_autopilot';
const KEY_AI_OUTBOX = 'dau_an_viet_ai_outbox_v1';
const KEY_AI_SHIELD = 'dau_an_viet_ai_shield_v1';
const KEY_HYDROGEN_CORES = 'dau_an_viet_hydrogen_cores_v4';
const KEY_HYDROGEN_BRIEFING = 'dau_an_viet_hydrogen_briefing_v4';
const KEY_HYDROGEN_CMDS = 'dau_an_viet_hydrogen_cmd_logs_v4';
const KEY_PASSPORT_PREFIX = 'dauanviet_passport_stamps_v2_';
const KEY_CUSTOM_SITE_PHOTOS = 'heritage_custom_real_photos_v1';
const KEY_PHOTO_CAPTIONS = 'dau_an_viet_photo_captions_v1';
const KEY_CUSTOM_GLB_URLS = 'dau_an_viet_custom_glb_urls_v1';
const KEY_ACCOUNTS_DB = 'dau_an_viet_accounts_db_v1';
const KEY_SUBSCRIPTION_TIERS = 'dau_an_viet_subscription_tier_v1';
const KEY_SCHOOL_PACKAGES = 'dau_an_viet_school_packages_v1';
const KEY_USER_TIER_SIMPLE = 'userTier';

// Event names mirrored with adminPlatformStore & heritagePassport
const EVT_CMS = 'dau-an-viet-cms-updated';
const EVT_PASSES = 'dau-an-viet-passes-updated';
const EVT_VISITORS = 'dau-an-viet-visitors-updated';
const EVT_REVIEWS = 'dau-an-viet-reviews-updated';
const EVT_QUIZZES = 'dau-an-viet-quizzes-updated';
const EVT_EMERGENCY = 'dau-an-viet-emergency-lockdown-updated';
const EVT_SECURITY = 'dau-an-viet-security-logs-updated';
const EVT_SUPPORT = 'dau-an-viet-support-tickets-updated';
const EVT_AI_AUTOPILOT = 'dau-an-viet-ai-autopilot-updated';
const EVT_AI_OUTBOX = 'dau-an-viet-ai-outbox-updated';
const EVT_AI_SHIELD = 'dau-an-viet-ai-shield-updated';
const EVT_HYDROGEN = 'dau-an-viet-hydrogen-cores-updated';
const EVT_LOCKS = 'dau-an-viet-account-locks-updated';
const EVT_PASSPORT = 'heritage-passport-updated';
const EVT_CUSTOM_PHOTOS = 'heritage_custom_photos_changed';
const EVT_PHOTO_CAPTIONS = 'dau_an_viet_photo_captions_updated';
const EVT_SUBSCRIPTION_TIER = 'dau-an-viet-subscription-tier-updated';
const EVT_GLB_MODELS = 'dau-an-viet-glb-models-updated';
const EVT_ACCOUNTS_DB = 'dau-an-viet-accounts-db-updated';

export interface ServerSyncPayload {
  updatedAt?: string;
  adminPasswordHash?: string;
  adminPasswordUpdatedAt?: string;
  secondaryAdminEmails?: string[];
  secondaryAdminEmailsUpdatedAt?: string;
  testerAllowlistEmails?: string[];
  testerAllowlistUpdatedAt?: string;
  userCredentials?: Record<string, unknown>;
  users?: Array<Record<string, unknown>>;
  visitors?: Array<Record<string, unknown>>;
  lockedAccounts?: Record<string, unknown>;
  lockedAccountsUpdatedAt?: string;
  issuedPasses?: Array<Record<string, unknown>>;
  userEdTechStates?: Record<string, Record<string, unknown>>;
  passportStamps?: Record<string, Record<string, unknown>>;
  supportTickets?: Array<Record<string, unknown>>;
  visitorReviews?: Array<Record<string, unknown>>;
  hiddenHeritageIds?: string[];
  hiddenHeritageUpdatedAt?: string;
  cmsOverrides?: Record<string, Record<string, unknown>>;
  cmsDeletedSiteIds?: Record<string, string>;
  siteTranslationsOverride?: Record<string, unknown>;
  quizDrafts?: Record<string, unknown>;
  publishedQuizzes?: Record<string, unknown>;
  audioOverrides?: Record<string, unknown>;
  customSitePhotos?: Record<string, unknown>;
  customSitePhotosUpdatedAt?: string;
  photoCaptionOverrides?: Record<string, unknown>;
  customGlbUrls?: Record<string, string>;
  accountsDb?: Array<Record<string, unknown>>;
  subscriptionTiers?: Record<string, unknown>;
  schoolPackages?: Record<string, unknown>;
  siteSettings?: Record<string, unknown> | null;
  siteSettingsUpdatedAt?: string;
  emergencyLockdown?: Record<string, unknown> | null;
  emergencyLockdownUpdatedAt?: string;
  auditLogs?: Array<Record<string, unknown>>;
  securityAlerts?: Array<Record<string, unknown>>;
  aiOutbox?: Array<Record<string, unknown>>;
  aiShield?: Record<string, unknown> | null;
  aiAutopilotEnabled?: boolean | null;
  hydrogenCores?: Record<string, unknown> | null;
  hydrogenBriefing?: Record<string, unknown> | null;
  hydrogenCmdLogs?: Array<Record<string, unknown>>;
  totalVisits?: number;
  siteVisits?: Record<string, number>;
  analytics?: {
    totalVisitors: number;
    interactions3D: number;
    audioPlays: number;
    routesCompleted?: number;
    siteViews: Record<string, number>;
    techUsage?: {
      explodedXray: number;
      map1815: number;
      flycamVideo: number;
      audioAi: number;
    };
    lastUpdatedAt: string;
  };
  visitHistoryLogs?: VisitHistoryLogEntry[];
}

export function detectClientDeviceType(): 'Máy tính' | 'Điện thoại' {
  if (typeof window === 'undefined') return 'Máy tính';
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
  const isMobile =
    window.innerWidth < 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isMobile ? 'Điện thoại' : 'Máy tính';
}

export function loadVisitHistoryLogs(): VisitHistoryLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(VISIT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
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

function emitEvent(name: string): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name));
  }
}

let lastAppliedServerUpdatedAt = '';
let inFlightPullPromise: Promise<boolean> | null = null;

export function applyServerSyncStateToLocal(state: ServerSyncPayload | null | undefined): void {
  if (typeof window === 'undefined' || !state || typeof state !== 'object') return;
  if (state.updatedAt && state.updatedAt === lastAppliedServerUpdatedAt) {
    return;
  }
  lastAppliedServerUpdatedAt = state.updatedAt || '';

  let cmsChanged = false;
  let visitorsChanged = false;
  let passesChanged = false;
  let reviewsChanged = false;
  let quizzesChanged = false;
  let emergencyChanged = false;
  let securityChanged = false;
  let supportChanged = false;
  let analyticsChanged = false;
  let locksChanged = false;
  let adminsChanged = false;
  let testersChanged = false;
  let passportChanged = false;
  let customPhotosChanged = false;
  let photoCaptionsChanged = false;
  let glbUrlsChanged = false;
  let accountsDbChanged = false;
  let subscriptionTiersChanged = false;

  if (typeof state.adminPasswordHash === 'string' && state.adminPasswordHash.length >= 24) {
    try {
      const prev = window.localStorage.getItem(KEY_ADMIN_PASSWORD_HASH);
      if (prev !== state.adminPasswordHash) {
        window.localStorage.setItem(KEY_ADMIN_PASSWORD_HASH, state.adminPasswordHash);
      }
    } catch {
      // ignore
    }
  }

  if (Array.isArray(state.secondaryAdminEmails)) {
    adminsChanged = writeJsonIfChanged(KEY_ADMIN_EMAILS, state.secondaryAdminEmails);
  }
  if (Array.isArray(state.testerAllowlistEmails)) {
    testersChanged = writeJsonIfChanged(KEY_TESTER_ALLOWLIST, state.testerAllowlistEmails);
  }

  if (state.userCredentials && typeof state.userCredentials === 'object') {
    const localCreds = readJsonSafe<Record<string, Record<string, unknown>>>(KEY_USER_CREDENTIALS, {});
    const mergedCreds: Record<string, Record<string, unknown>> = { ...localCreds };
    Object.entries(state.userCredentials).forEach(([key, val]) => {
      if (!val || typeof val !== 'object') return;
      const incoming = val as Record<string, unknown>;
      const prev = mergedCreds[key];
      if (!prev || String(incoming.updatedAt || '') >= String(prev.updatedAt || '')) {
        mergedCreds[key] = incoming;
      }
    });
    if (writeJsonIfChanged(KEY_USER_CREDENTIALS, mergedCreds)) {
      visitorsChanged = true;
    }
  }

  if (Array.isArray(state.users) && state.users.length > 0) {
    if (applyCloudUsersToLocal(state.users, false)) {
      visitorsChanged = true;
      passesChanged = true;
    }
  }

  if (Array.isArray(state.visitors) && state.visitors.length > 0) {
    const localVisitors = readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITORS_REGISTRY, []);
    const map = new Map<string, Record<string, unknown>>();
    [...localVisitors, ...state.visitors].forEach((v) => {
      const uid = typeof v?.userId === 'string' ? v.userId : '';
      if (!uid) return;
      const prev = map.get(uid);
      if (!prev) {
        map.set(uid, v);
        return;
      }
      const pSites = Array.isArray(prev.exploredSiteIds) ? (prev.exploredSiteIds as string[]) : [];
      const nSites = Array.isArray(v.exploredSiteIds) ? (v.exploredSiteIds as string[]) : [];
      const pRoutes = Array.isArray(prev.completedRouteIds) ? (prev.completedRouteIds as string[]) : [];
      const nRoutes = Array.isArray(v.completedRouteIds) ? (v.completedRouteIds as string[]) : [];
      const newer = String(v.lastLoginAt || '') >= String(prev.lastLoginAt || '') ? v : prev;
      const older = String(v.lastLoginAt || '') >= String(prev.lastLoginAt || '') ? prev : v;
      map.set(uid, {
        ...older,
        ...newer,
        loginCount: Math.max(Number(prev.loginCount || 1), Number(v.loginCount || 1)),
        exploredSiteIds: Array.from(new Set([...pSites, ...nSites])),
        completedRouteIds: Array.from(new Set([...pRoutes, ...nRoutes])),
      });
    });
    const mergedVisitors = Array.from(map.values()).sort((a, b) =>
      String(b.lastLoginAt || '').localeCompare(String(a.lastLoginAt || ''))
    );
    if (writeJsonIfChanged(KEY_VISITORS_REGISTRY, mergedVisitors)) {
      visitorsChanged = true;
    }
  }

  if (state.lockedAccounts && typeof state.lockedAccounts === 'object') {
    const localLocks = readJsonSafe<Record<string, Record<string, unknown>>>(KEY_LOCKED_ACCOUNTS, {});
    const mergedLocks: Record<string, Record<string, unknown>> = { ...localLocks };
    Object.entries(state.lockedAccounts).forEach(([uid, rec]) => {
      if (!rec || typeof rec !== 'object') return;
      const incoming = rec as Record<string, unknown>;
      const prev = mergedLocks[uid];
      const prevTime = String(prev?.updatedAt || prev?.lockedAt || '');
      const nextTime = String(incoming.updatedAt || incoming.lockedAt || '');
      if (!prev || nextTime >= prevTime) {
        mergedLocks[uid] = incoming;
      }
    });
    if (writeJsonIfChanged(KEY_LOCKED_ACCOUNTS, mergedLocks)) {
      locksChanged = true;
      visitorsChanged = true;
    }
  }

  if (Array.isArray(state.issuedPasses) && state.issuedPasses.length > 0) {
    const localPasses = readJsonSafe<Array<Record<string, unknown>>>(KEY_ISSUED_PASSES, []);
    const map = new Map<string, Record<string, unknown>>();
    [...localPasses, ...state.issuedPasses].forEach((p) => {
      if (typeof p?.id === 'string') {
        const prev = map.get(p.id);
        if (!prev || String(p.updatedAt || '') >= String(prev.updatedAt || '')) {
          map.set(p.id, p);
        }
      }
    });
    const merged = Array.from(map.values()).sort((a, b) =>
      String(b.issuedAt || '').localeCompare(String(a.issuedAt || ''))
    );
    if (writeJsonIfChanged(KEY_ISSUED_PASSES, merged)) {
      passesChanged = true;
    }
  }

  if (state.userEdTechStates && typeof state.userEdTechStates === 'object') {
    Object.entries(state.userEdTechStates).forEach(([scope, st]) => {
      if (!scope || !st || typeof st !== 'object') return;
      const key = `${KEY_USER_EDTECH_PREFIX}${scope}`;
      const prev = readJsonSafe<Record<string, unknown> | null>(key, null);
      const nextVal = prev
        ? {
            ...prev,
            ...st,
            ticketIssued: Boolean(prev.ticketIssued || st.ticketIssued),
            quizSubmitted: Boolean(prev.quizSubmitted || st.quizSubmitted),
            ticketPassId: st.ticketPassId || prev.ticketPassId,
            certPassId: st.certPassId || prev.certPassId,
            topicSubmittedMap: {
              ...((prev.topicSubmittedMap as Record<string, unknown>) || {}),
              ...((st.topicSubmittedMap as Record<string, unknown>) || {}),
            },
            topicCertIds: {
              ...((prev.topicCertIds as Record<string, unknown>) || {}),
              ...((st.topicCertIds as Record<string, unknown>) || {}),
            },
          }
        : st;
      writeJsonIfChanged(key, nextVal);
    });
  }

  if (state.passportStamps && typeof state.passportStamps === 'object') {
    Object.entries(state.passportStamps).forEach(([scope, stampMap]) => {
      if (!scope || !stampMap || typeof stampMap !== 'object') return;
      const key = `${KEY_PASSPORT_PREFIX}${scope}`;
      const prev = readJsonSafe<Record<string, unknown>>(key, {});
      if (writeJsonIfChanged(key, { ...prev, ...stampMap })) {
        passportChanged = true;
      }
    });
  }

  if (Array.isArray(state.supportTickets) && state.supportTickets.length > 0) {
    const localTickets = readJsonSafe<Array<Record<string, unknown>>>(KEY_SUPPORT_TICKETS, []);
    const map = new Map<string, Record<string, unknown>>();
    [...localTickets, ...state.supportTickets].forEach((t) => {
      if (typeof t?.id !== 'string') return;
      const prev = map.get(t.id);
      if (!prev) {
        map.set(t.id, t);
        return;
      }
      const prevMsgs = Array.isArray(prev.messages) ? (prev.messages as Array<Record<string, unknown>>) : [];
      const nextMsgs = Array.isArray(t.messages) ? (t.messages as Array<Record<string, unknown>>) : [];
      const mMap = new Map<string, Record<string, unknown>>();
      [...prevMsgs, ...nextMsgs].forEach((m) => {
        if (typeof m?.id === 'string') mMap.set(m.id, m);
      });
      const mergedMsgs = Array.from(mMap.values()).sort((a, b) =>
        String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
      );
      const newer = String(t.updatedAt || '') >= String(prev.updatedAt || '') ? t : prev;
      const older = String(t.updatedAt || '') >= String(prev.updatedAt || '') ? prev : t;
      map.set(t.id, {
        ...older,
        ...newer,
        ownerEmail: newer.ownerEmail || older.ownerEmail,
        messages: mergedMsgs.length > 0 ? mergedMsgs : newer.messages || older.messages,
      });
    });
    const mergedTickets = Array.from(map.values()).sort((a, b) =>
      String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))
    );
    if (writeJsonIfChanged(KEY_SUPPORT_TICKETS, mergedTickets)) {
      supportChanged = true;
    }
  }

  if (Array.isArray(state.visitorReviews) && state.visitorReviews.length > 0) {
    const localReviews = readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITOR_REVIEWS, []);
    const map = new Map<string, Record<string, unknown>>();
    [...localReviews, ...state.visitorReviews].forEach((r) => {
      if (typeof r?.id !== 'string') return;
      const prev = map.get(r.id);
      if (!prev) {
        map.set(r.id, r);
        return;
      }
      if (r.adminReply && !prev.adminReply) {
        map.set(r.id, r);
      } else if (prev.adminReply && !r.adminReply) {
        map.set(r.id, prev);
      } else {
        map.set(
          r.id,
          String(r.adminRepliedAt || r.createdAt || '') >=
            String(prev.adminRepliedAt || prev.createdAt || '')
            ? r
            : prev
        );
      }
    });
    const mergedReviews = Array.from(map.values()).sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );
    if (writeJsonIfChanged(KEY_VISITOR_REVIEWS, mergedReviews)) {
      reviewsChanged = true;
    }
  }

  if (Array.isArray(state.hiddenHeritageIds)) {
    if (writeJsonIfChanged(KEY_HIDDEN_HERITAGES, state.hiddenHeritageIds)) {
      cmsChanged = true;
    }
  }

  if (state.cmsOverrides && typeof state.cmsOverrides === 'object') {
    if (writeJsonIfChanged(KEY_CMS_OVERRIDES, state.cmsOverrides)) {
      cmsChanged = true;
    }
  }

  if (state.siteTranslationsOverride && typeof state.siteTranslationsOverride === 'object') {
    const prev = readJsonSafe<Record<string, unknown>>(KEY_SITE_TRANSLATIONS, {});
    if (writeJsonIfChanged(KEY_SITE_TRANSLATIONS, { ...prev, ...state.siteTranslationsOverride })) {
      cmsChanged = true;
    }
  }

  if (state.quizDrafts && typeof state.quizDrafts === 'object') {
    const prev = readJsonSafe<Record<string, unknown>>(KEY_QUIZ_DRAFTS, {});
    writeJsonIfChanged(KEY_QUIZ_DRAFTS, { ...prev, ...state.quizDrafts });
  }

  if (state.publishedQuizzes && typeof state.publishedQuizzes === 'object') {
    const prev = readJsonSafe<Record<string, unknown>>(KEY_PUBLISHED_QUIZZES, {});
    if (writeJsonIfChanged(KEY_PUBLISHED_QUIZZES, { ...prev, ...state.publishedQuizzes })) {
      quizzesChanged = true;
    }
  }

  if (state.audioOverrides && typeof state.audioOverrides === 'object') {
    const prev = readJsonSafe<Record<string, unknown>>(KEY_AUDIO_OVERRIDES, {});
    if (writeJsonIfChanged(KEY_AUDIO_OVERRIDES, { ...prev, ...state.audioOverrides })) {
      cmsChanged = true;
    }
  }

  if (state.customSitePhotos && typeof state.customSitePhotos === 'object') {
    const { cleaned: sanitizedIncoming } = sanitizeCustomSitePhotosMap(state.customSitePhotos);
    const localPhotos = readJsonSafe<Record<string, unknown>>(KEY_CUSTOM_SITE_PHOTOS, {});
    const { cleaned: mergedPhotos } = sanitizeCustomSitePhotosMap(localPhotos);
    Object.entries(sanitizedIncoming).forEach(([siteId, incoming]) => {
      if (incoming === undefined || incoming === null) return;
      const prev = mergedPhotos[siteId];
      if (typeof incoming === 'object') {
        const inObj = incoming as Record<string, unknown>;
        const prevTime =
          prev && typeof prev === 'object'
            ? String((prev as Record<string, unknown>).updatedAt || '')
            : '';
        const nextTime = String(inObj.updatedAt || '');
        if (!prev || typeof prev === 'string' || !prevTime || nextTime >= prevTime) {
          mergedPhotos[siteId] = inObj;
        }
      }
    });
    if (writeJsonIfChanged(KEY_CUSTOM_SITE_PHOTOS, mergedPhotos)) {
      customPhotosChanged = true;
    }
  }

  if (state.photoCaptionOverrides && typeof state.photoCaptionOverrides === 'object') {
    const localCaps = readJsonSafe<Record<string, unknown>>(KEY_PHOTO_CAPTIONS, {});
    const mergedCaps: Record<string, unknown> = { ...localCaps };
    Object.entries(state.photoCaptionOverrides).forEach(([siteId, incoming]) => {
      if (!incoming || typeof incoming !== 'object') return;
      const inObj = incoming as Record<string, unknown>;
      const prev = mergedCaps[siteId];
      const prevTime =
        prev && typeof prev === 'object'
          ? String((prev as Record<string, unknown>).updatedAt || '')
          : '';
      const nextTime = String(inObj.updatedAt || '');
      if (!prev || !prevTime || nextTime >= prevTime) {
        mergedCaps[siteId] = inObj;
      }
    });
    if (writeJsonIfChanged(KEY_PHOTO_CAPTIONS, mergedCaps)) {
      photoCaptionsChanged = true;
    }
  }

  if (state.customGlbUrls && typeof state.customGlbUrls === 'object') {
    const localGlbs = readJsonSafe<Record<string, string>>(KEY_CUSTOM_GLB_URLS, {});
    const mergedGlbs = { ...localGlbs, ...state.customGlbUrls };
    if (writeJsonIfChanged(KEY_CUSTOM_GLB_URLS, mergedGlbs)) {
      glbUrlsChanged = true;
    }
  }

  if (Array.isArray(state.accountsDb) && state.accountsDb.length > 0) {
    const localAccounts = readJsonSafe<Array<Record<string, unknown>>>(KEY_ACCOUNTS_DB, []);
    const map = new Map<string, Record<string, unknown>>();
    [...localAccounts, ...state.accountsDb].forEach((acc) => {
      const k =
        (typeof acc?.email === 'string' && acc.email.toLowerCase().trim()) ||
        (typeof acc?.id === 'string' && acc.id) ||
        '';
      if (!k) return;
      const prev = map.get(k);
      if (!prev || String(acc.updatedAt || acc.createdAt || '') >= String(prev.updatedAt || prev.createdAt || '')) {
        map.set(k, { ...(prev || {}), ...acc });
      }
    });
    const mergedAccounts = Array.from(map.values()).sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
    );
    if (writeJsonIfChanged(KEY_ACCOUNTS_DB, mergedAccounts)) {
      accountsDbChanged = true;
      visitorsChanged = true;
    }
  }

  if (state.subscriptionTiers && typeof state.subscriptionTiers === 'object') {
    const localTiers = readJsonSafe<Record<string, Record<string, unknown>>>(KEY_SUBSCRIPTION_TIERS, {});
    const mergedTiers: Record<string, Record<string, unknown>> = { ...localTiers };
    Object.entries(state.subscriptionTiers).forEach(([scope, val]) => {
      if (!val || typeof val !== 'object') return;
      const incoming = val as Record<string, unknown>;
      const prev = mergedTiers[scope];
      if (!prev || String(incoming.updatedAt || '') >= String(prev.updatedAt || '')) {
        mergedTiers[scope] = incoming;
      }
    });
    if (writeJsonIfChanged(KEY_SUBSCRIPTION_TIERS, mergedTiers)) {
      subscriptionTiersChanged = true;
    }
  }

  if (state.schoolPackages && typeof state.schoolPackages === 'object') {
    const localSchoolPkgs = readJsonSafe<Record<string, Record<string, unknown>>>(KEY_SCHOOL_PACKAGES, {});
    const mergedSchoolPkgs: Record<string, Record<string, unknown>> = { ...localSchoolPkgs };
    Object.entries(state.schoolPackages).forEach(([scope, val]) => {
      if (!val || typeof val !== 'object') return;
      const incoming = val as Record<string, unknown>;
      const prev = mergedSchoolPkgs[scope];
      if (!prev || String(incoming.updatedAt || '') >= String(prev.updatedAt || '')) {
        mergedSchoolPkgs[scope] = incoming;
      }
    });
    if (writeJsonIfChanged(KEY_SCHOOL_PACKAGES, mergedSchoolPkgs)) {
      subscriptionTiersChanged = true;
      accountsDbChanged = true;
    }
  }

  if (state.siteSettings && typeof state.siteSettings === 'object') {
    if (writeJsonIfChanged(KEY_SITE_SETTINGS, state.siteSettings)) {
      cmsChanged = true;
    }
  }

  if (state.emergencyLockdown && typeof state.emergencyLockdown === 'object') {
    if (writeJsonIfChanged(KEY_EMERGENCY_LOCKDOWN, state.emergencyLockdown)) {
      emergencyChanged = true;
    }
  }

  if (Array.isArray(state.auditLogs) && state.auditLogs.length > 0) {
    const localLogs = readJsonSafe<Array<Record<string, unknown>>>(KEY_AUDIT_LOGS, []);
    const map = new Map<string, Record<string, unknown>>();
    [...localLogs, ...state.auditLogs].forEach((item) => {
      if (typeof item?.id === 'string') map.set(item.id, item);
    });
    const merged = Array.from(map.values())
      .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
      .slice(0, 60);
    writeJsonIfChanged(KEY_AUDIT_LOGS, merged);
  }

  if (Array.isArray(state.securityAlerts) && state.securityAlerts.length > 0) {
    const localSec = readJsonSafe<Array<Record<string, unknown>>>(KEY_SECURITY_LOGS, []);
    const map = new Map<string, Record<string, unknown>>();
    [...localSec, ...state.securityAlerts].forEach((item) => {
      if (typeof item?.id === 'string') map.set(item.id, item);
    });
    const merged = Array.from(map.values())
      .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
      .slice(0, 80);
    if (writeJsonIfChanged(KEY_SECURITY_LOGS, merged)) {
      securityChanged = true;
    }
  }

  if (Array.isArray(state.aiOutbox) && state.aiOutbox.length > 0) {
    const localOutbox = readJsonSafe<Array<Record<string, unknown>>>(KEY_AI_OUTBOX, []);
    const map = new Map<string, Record<string, unknown>>();
    [...localOutbox, ...state.aiOutbox].forEach((item) => {
      if (typeof item?.id === 'string') map.set(item.id, item);
    });
    const merged = Array.from(map.values())
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      .slice(0, 100);
    if (writeJsonIfChanged(KEY_AI_OUTBOX, merged)) {
      emitEvent(EVT_AI_OUTBOX);
    }
  }

  if (state.aiShield && typeof state.aiShield === 'object') {
    if (writeJsonIfChanged(KEY_AI_SHIELD, state.aiShield)) {
      emitEvent(EVT_AI_SHIELD);
    }
  }

  if (typeof state.aiAutopilotEnabled === 'boolean') {
    try {
      const nextVal = state.aiAutopilotEnabled ? 'true' : 'false';
      if (window.localStorage.getItem(KEY_AI_AUTOPILOT) !== nextVal) {
        window.localStorage.setItem(KEY_AI_AUTOPILOT, nextVal);
        emitEvent(EVT_AI_AUTOPILOT);
      }
    } catch {
      // ignore
    }
  }

  if (state.hydrogenCores && typeof state.hydrogenCores === 'object') {
    if (writeJsonIfChanged(KEY_HYDROGEN_CORES, state.hydrogenCores)) {
      emitEvent(EVT_HYDROGEN);
    }
  }
  if (state.hydrogenBriefing && typeof state.hydrogenBriefing === 'object') {
    writeJsonIfChanged(KEY_HYDROGEN_BRIEFING, state.hydrogenBriefing);
  }
  if (Array.isArray(state.hydrogenCmdLogs) && state.hydrogenCmdLogs.length > 0) {
    writeJsonIfChanged(KEY_HYDROGEN_CMDS, state.hydrogenCmdLogs);
  }

  // Merge analytics & counters cleanly with Math.max
  if (state.analytics || typeof state.totalVisits === 'number' || state.siteVisits) {
    const localAnalytics = readJsonSafe<Record<string, unknown>>(KEY_ANALYTICS, {});
    const localViews =
      (localAnalytics.siteViews && typeof localAnalytics.siteViews === 'object'
        ? (localAnalytics.siteViews as Record<string, number>)
        : {}) || {};
    const srvViews = {
      ...(state.analytics?.siteViews || {}),
      ...(state.siteVisits || {}),
    };
    const mergedViews: Record<string, number> = { ...localViews };
    Object.entries(srvViews).forEach(([k, v]) => {
      if (typeof v === 'number' && Number.isFinite(v)) {
        mergedViews[k] = Math.max(mergedViews[k] || 0, v);
      }
    });

    const localTech =
      (localAnalytics.techUsage && typeof localAnalytics.techUsage === 'object'
        ? (localAnalytics.techUsage as Record<string, number>)
        : {}) || {};
    const srvTech = state.analytics?.techUsage;
    const nextAnalytics = {
      totalVisitors: Math.max(
        Number(localAnalytics.totalVisitors || 0),
        Number(state.totalVisits || 0),
        Number(state.analytics?.totalVisitors || 0)
      ),
      interactions3D: Math.max(
        Number(localAnalytics.interactions3D || 0),
        Number(state.analytics?.interactions3D || 0)
      ),
      audioPlays: Math.max(
        Number(localAnalytics.audioPlays || 0),
        Number(state.analytics?.audioPlays || 0)
      ),
      routesCompleted: Math.max(
        Number(localAnalytics.routesCompleted || 0),
        Number(state.analytics?.routesCompleted || 0)
      ),
      siteViews: mergedViews,
      techUsage: {
        explodedXray: Math.max(Number(localTech.explodedXray || 0), Number(srvTech?.explodedXray || 0)),
        map1815: Math.max(Number(localTech.map1815 || 0), Number(srvTech?.map1815 || 0)),
        flycamVideo: Math.max(Number(localTech.flycamVideo || 0), Number(srvTech?.flycamVideo || 0)),
        audioAi: Math.max(Number(localTech.audioAi || 0), Number(srvTech?.audioAi || 0)),
      },
      lastUpdatedAt:
        state.analytics?.lastUpdatedAt ||
        (typeof localAnalytics.lastUpdatedAt === 'string'
          ? localAnalytics.lastUpdatedAt
          : new Date().toISOString()),
    };

    if (writeJsonIfChanged(KEY_ANALYTICS, nextAnalytics)) {
      analyticsChanged = true;
      visitorsChanged = true;
    }
  }

  if (Array.isArray(state.visitHistoryLogs)) {
    const localHistory = loadVisitHistoryLogs();
    const map = new Map<string, VisitHistoryLogEntry>();
    [...localHistory, ...state.visitHistoryLogs].forEach((entry) => {
      if (entry?.id) map.set(entry.id, entry);
    });
    const mergedLogs = Array.from(map.values())
      .sort((a, b) => String(b.timestamp || '').localeCompare(String(a.timestamp || '')))
      .slice(0, 120);
    if (writeJsonIfChanged(VISIT_HISTORY_STORAGE_KEY, mergedLogs)) {
      analyticsChanged = true;
    }
  }

  if (cmsChanged) emitEvent(EVT_CMS);
  if (visitorsChanged) emitEvent(EVT_VISITORS);
  if (passesChanged) emitEvent(EVT_PASSES);
  if (reviewsChanged) emitEvent(EVT_REVIEWS);
  if (quizzesChanged) emitEvent(EVT_QUIZZES);
  if (emergencyChanged) emitEvent(EVT_EMERGENCY);
  if (securityChanged) emitEvent(EVT_SECURITY);
  if (supportChanged) emitEvent(EVT_SUPPORT);
  if (locksChanged) emitEvent(EVT_LOCKS);
  if (adminsChanged) emitEvent(ADMIN_EMAILS_UPDATED_EVENT);
  if (testersChanged) emitEvent(TESTER_ALLOWLIST_UPDATED_EVENT);
  if (analyticsChanged) emitEvent(ANALYTICS_UPDATED_EVENT);
  if (passportChanged) emitEvent(EVT_PASSPORT);
  if (customPhotosChanged) emitEvent(EVT_CUSTOM_PHOTOS);
  if (photoCaptionsChanged) emitEvent(EVT_PHOTO_CAPTIONS);
  if (glbUrlsChanged) emitEvent(EVT_GLB_MODELS);
  if (accountsDbChanged) emitEvent(EVT_ACCOUNTS_DB);
  if (subscriptionTiersChanged) emitEvent(EVT_SUBSCRIPTION_TIER);
}

export function applyCloudUsersToLocal(
  rawUsers: unknown[],
  emitEvents = true
): boolean {
  if (typeof window === 'undefined' || !Array.isArray(rawUsers) || rawUsers.length === 0) {
    return false;
  }

  let anyChanged = false;
  let passesChanged = false;
  let adminsChanged = false;
  const nowIso = new Date().toISOString();

  const localCreds = readJsonSafe<Record<string, Record<string, unknown>>>(KEY_USER_CREDENTIALS, {});
  const mergedCreds: Record<string, Record<string, unknown>> = { ...localCreds };

  const localVisitors = readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITORS_REGISTRY, []);
  const visitorMap = new Map<string, Record<string, unknown>>();
  localVisitors.forEach((v) => {
    if (typeof v?.userId === 'string' && v.userId) {
      visitorMap.set(v.userId, v);
    }
  });

  const localPasses = readJsonSafe<Array<Record<string, unknown>>>(KEY_ISSUED_PASSES, []);
  const passMap = new Map<string, Record<string, unknown>>();
  localPasses.forEach((p) => {
    if (typeof p?.id === 'string' && p.id) {
      passMap.set(p.id, p);
    }
  });

  const secondaryAdmins = new Set<string>(
    readJsonSafe<string[]>(KEY_ADMIN_EMAILS, []).map((e) => String(e || '').toLowerCase().trim()).filter(Boolean)
  );

  for (const item of rawUsers) {
    if (!item || typeof item !== 'object') continue;
    const u = item as Record<string, unknown>;

    const provider: 'google' | 'facebook' = u.provider === 'facebook' ? 'facebook' : 'google';
    const emailRaw = typeof u.email === 'string' ? u.email.toLowerCase().trim() : '';
    const identifierRaw = (
      typeof u.accountIdentifier === 'string' && u.accountIdentifier.trim()
        ? u.accountIdentifier
        : typeof u.identifier === 'string' && u.identifier.trim()
        ? u.identifier
        : typeof u.username === 'string' && u.username.trim()
        ? u.username
        : emailRaw ||
          (typeof u.displayName === 'string' ? u.displayName : '') ||
          (typeof u.name === 'string' ? u.name : '')
    )
      .toLowerCase()
      .trim();

    if (!identifierRaw && !emailRaw && !u.userId && !u.id) continue;

    const normKey = identifierRaw || emailRaw || String(u.userId || u.id || '').toLowerCase().trim();
    const uid =
      (typeof u.userId === 'string' && u.userId.trim()) ||
      (typeof u.id === 'string' && u.id.trim()) ||
      `u_${provider.slice(0, 2)}_${normKey}`;

    const displayName = (
      (typeof u.displayName === 'string' && u.displayName.trim()
        ? u.displayName
        : typeof u.name === 'string' && u.name.trim()
        ? u.name
        : typeof u.fullName === 'string' && u.fullName.trim()
        ? u.fullName
        : emailRaw || normKey || 'Du khách') as string
    ).trim();

    const isPrimaryAdmin = Boolean(
      u.isPrimaryAdmin || normKey === 'bivsmoon2023@gmail.com' || emailRaw === 'bivsmoon2023@gmail.com'
    );
    const role: 'admin' | 'visitor' =
      isPrimaryAdmin || u.role === 'admin' ? 'admin' : 'visitor';

    if (role === 'admin' && !isPrimaryAdmin && emailRaw && emailRaw.includes('@')) {
      secondaryAdmins.add(emailRaw);
    }

    const createdAt =
      (typeof u.createdAt === 'string' && u.createdAt) ||
      (typeof u.firstLoginAt === 'string' && u.firstLoginAt) ||
      nowIso;
    const lastLoginAt =
      (typeof u.lastLoginAt === 'string' && u.lastLoginAt) ||
      (typeof u.updatedAt === 'string' && u.updatedAt) ||
      createdAt;

    const password = typeof u.password === 'string' ? u.password : '';
    const passwordHash = typeof u.passwordHash === 'string' ? u.passwordHash : '';
    const salt = typeof u.salt === 'string' ? u.salt : '';

    if (normKey) {
      const credKey = `${provider}:${normKey}`;
      const prevCred = mergedCreds[credKey];
      mergedCreds[credKey] = {
        ...(prevCred || {}),
        userId: uid,
        provider,
        identifier: normKey,
        email: emailRaw || normKey,
        displayName,
        salt: salt || (typeof prevCred?.salt === 'string' ? prevCred.salt : ''),
        passwordHash:
          passwordHash || (typeof prevCred?.passwordHash === 'string' ? prevCred.passwordHash : ''),
        password: password || (typeof prevCred?.password === 'string' ? prevCred.password : ''),
        createdAt: (typeof prevCred?.createdAt === 'string' && prevCred.createdAt) || createdAt,
        updatedAt: lastLoginAt,
      };
      if (emailRaw && emailRaw !== normKey) {
        mergedCreds[`${provider}:${emailRaw}`] = mergedCreds[credKey];
      }
    }

    const prevVis = visitorMap.get(uid);
    const prevSites = Array.isArray(prevVis?.exploredSiteIds)
      ? (prevVis.exploredSiteIds as string[])
      : [];
    const nextSites = Array.isArray(u.exploredSiteIds) ? (u.exploredSiteIds as string[]) : [];
    const prevRoutes = Array.isArray(prevVis?.completedRouteIds)
      ? (prevVis.completedRouteIds as string[])
      : [];
    const nextRoutes = Array.isArray(u.completedRouteIds) ? (u.completedRouteIds as string[]) : [];

    visitorMap.set(uid, {
      ...(prevVis || {}),
      userId: uid,
      provider,
      displayName: displayName || (typeof prevVis?.displayName === 'string' ? prevVis.displayName : 'Du khách'),
      maskedContact:
        (typeof u.maskedContact === 'string' && u.maskedContact) ||
        emailRaw ||
        normKey ||
        displayName,
      contactRaw: emailRaw || normKey,
      role,
      isPrimaryAdmin,
      isBetaTester: role === 'admin' ? true : Boolean(u.isBetaTester ?? prevVis?.isBetaTester),
      isLocked: Boolean(u.isLocked ?? prevVis?.isLocked),
      loginCount: Math.max(
        Number(prevVis?.loginCount || 1),
        Number(u.loginCount || 1)
      ),
      firstLoginAt: (typeof prevVis?.firstLoginAt === 'string' && prevVis.firstLoginAt) || createdAt,
      lastLoginAt:
        String(lastLoginAt) >= String(prevVis?.lastLoginAt || '')
          ? lastLoginAt
          : prevVis?.lastLoginAt || lastLoginAt,
      exploredSiteIds: Array.from(new Set([...prevSites, ...nextSites])),
      completedRouteIds: Array.from(new Set([...prevRoutes, ...nextRoutes])),
    });

    const rawPassesList = Array.isArray(u.issuedPasses)
      ? u.issuedPasses
      : Array.isArray(u.tickets)
      ? u.tickets
      : [];
    for (let idx = 0; idx < rawPassesList.length; idx += 1) {
      const rp = rawPassesList[idx];
      if (typeof rp === 'string' && rp.trim()) {
        const code = rp.trim();
        const pid = `pass_cloud_${uid}_${code}`;
        if (!passMap.has(pid)) {
          passMap.set(pid, {
            id: pid,
            code,
            kind: 'vip_ticket',
            ownerUserId: uid,
            ownerEmail: emailRaw || normKey,
            ownerName: displayName,
            ownerContactMasked: emailRaw || normKey || displayName,
            provider,
            label: 'Vé tham quan Bảo tàng Số 3D',
            amountLabel: 'Miễn phí',
            status: 'active',
            issuedAt: createdAt,
            updatedAt: lastLoginAt,
          });
        }
      } else if (rp && typeof rp === 'object') {
        const pObj = rp as Record<string, unknown>;
        const pid =
          (typeof pObj.id === 'string' && pObj.id) ||
          `pass_cloud_${uid}_${typeof pObj.code === 'string' ? pObj.code : idx}`;
        const prevPass = passMap.get(pid);
        if (!prevPass || String(pObj.updatedAt || '') >= String(prevPass.updatedAt || '')) {
          passMap.set(pid, {
            ...pObj,
            id: pid,
            ownerUserId: (typeof pObj.ownerUserId === 'string' && pObj.ownerUserId) || uid,
            ownerEmail:
              (typeof pObj.ownerEmail === 'string' && pObj.ownerEmail.toLowerCase().trim()) ||
              emailRaw ||
              normKey,
            ownerName: (typeof pObj.ownerName === 'string' && pObj.ownerName) || displayName,
            status: pObj.status || 'active',
            issuedAt: pObj.issuedAt || createdAt,
            updatedAt: pObj.updatedAt || lastLoginAt,
          });
        }
      }
    }

    const scope = emailRaw || normKey || uid;
    if (u.edtechState && typeof u.edtechState === 'object' && scope) {
      const edKey = `${KEY_USER_EDTECH_PREFIX}${scope}`;
      const prevEd = readJsonSafe<Record<string, unknown> | null>(edKey, null);
      const nextEd = prevEd
        ? {
            ...prevEd,
            ...(u.edtechState as Record<string, unknown>),
            ticketIssued: Boolean(
              prevEd.ticketIssued || (u.edtechState as Record<string, unknown>).ticketIssued
            ),
            quizSubmitted: Boolean(
              prevEd.quizSubmitted || (u.edtechState as Record<string, unknown>).quizSubmitted
            ),
          }
        : (u.edtechState as Record<string, unknown>);
      writeJsonIfChanged(edKey, nextEd);
    }

    if (u.passportStamps && typeof u.passportStamps === 'object' && scope) {
      const stKey = `${KEY_PASSPORT_PREFIX}${scope}`;
      const prevSt = readJsonSafe<Record<string, unknown>>(stKey, {});
      writeJsonIfChanged(stKey, {
        ...prevSt,
        ...(u.passportStamps as Record<string, unknown>),
      });
    }
  }

  if (writeJsonIfChanged(KEY_USER_CREDENTIALS, mergedCreds)) {
    anyChanged = true;
  }

  const mergedVisitors = Array.from(visitorMap.values()).sort((a, b) =>
    String(b.lastLoginAt || '').localeCompare(String(a.lastLoginAt || ''))
  );
  if (writeJsonIfChanged(KEY_VISITORS_REGISTRY, mergedVisitors)) {
    anyChanged = true;
  }

  if (passMap.size > 0) {
    const mergedPasses = Array.from(passMap.values()).sort((a, b) =>
      String(b.issuedAt || '').localeCompare(String(a.issuedAt || ''))
    );
    if (writeJsonIfChanged(KEY_ISSUED_PASSES, mergedPasses)) {
      anyChanged = true;
      passesChanged = true;
    }
  }

  if (secondaryAdmins.size > 0) {
    if (writeJsonIfChanged(KEY_ADMIN_EMAILS, Array.from(secondaryAdmins))) {
      adminsChanged = true;
    }
  }

  if (emitEvents) {
    if (anyChanged) emitEvent(EVT_VISITORS);
    if (passesChanged) emitEvent(EVT_PASSES);
    if (adminsChanged) emitEvent(ADMIN_EMAILS_UPDATED_EVENT);
  }

  return anyChanged || passesChanged;
}

function extractCloudUsersFromResponse(parsed: unknown): Array<Record<string, unknown>> {
  if (!parsed) return [];
  if (Array.isArray(parsed)) {
    return parsed.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'));
  }
  if (typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.users)) {
      return obj.users.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'));
    }
    if (Array.isArray(obj.data)) {
      return obj.data.filter((x): x is Record<string, unknown> => Boolean(x && typeof x === 'object'));
    }
    if (obj.data && typeof obj.data === 'object') {
      const dataObj = obj.data as Record<string, unknown>;
      if (Array.isArray(dataObj.users)) {
        return dataObj.users.filter((x): x is Record<string, unknown> =>
          Boolean(x && typeof x === 'object')
        );
      }
    }
    if (obj.state && typeof obj.state === 'object') {
      const stateObj = obj.state as Record<string, unknown>;
      if (Array.isArray(stateObj.users)) {
        return stateObj.users.filter((x): x is Record<string, unknown> =>
          Boolean(x && typeof x === 'object')
        );
      }
    }
  }
  return [];
}

export async function fetchUsersFromCloudApi(): Promise<Array<Record<string, unknown>>> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return [];

  const collectedUsers: Array<Record<string, unknown>> = [];

  const fetchCloudPromise = (async () => {
    try {
      const res = await fetch(CLOUD_API_URL, {
        method: 'GET',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const text = await res.text();
      if (!text || !text.trim()) return;
      const trimmed = text.trim();
      if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return;
      const parsed = JSON.parse(trimmed) as unknown;
      const cloudUsers = extractCloudUsersFromResponse(parsed);
      if (cloudUsers.length > 0) {
        collectedUsers.push(...cloudUsers);
      }
      if (parsed && typeof parsed === 'object' && 'state' in (parsed as Record<string, unknown>)) {
        applyServerSyncStateToLocal((parsed as { state?: ServerSyncPayload }).state);
      }
    } catch {
      // ignore CORS/network fallback
    }
  })();

  const fetchLocalServerPromise = (async () => {
    try {
      const res = await fetch('/api/sync/state', {
        method: 'GET',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) return;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;
      const json = (await res.json()) as {
        ok?: boolean;
        users?: Array<Record<string, unknown>>;
        state?: ServerSyncPayload;
      };
      if (Array.isArray(json?.users) && json.users.length > 0) {
        collectedUsers.push(...json.users);
      }
      if (json?.ok && json.state) {
        if (Array.isArray(json.state.users) && json.state.users.length > 0) {
          collectedUsers.push(...json.state.users);
        }
        applyServerSyncStateToLocal(json.state);
      }
    } catch {
      // ignore
    }
  })();

  await Promise.allSettled([
    fetchCloudPromise,
    fetchLocalServerPromise,
    pullAccountsFromFirebase(),
  ]);

  if (collectedUsers.length > 0) {
    const appliedFromCloud = applyCloudUsersToLocal(collectedUsers, true);
    // Also mirror any newly fetched cloud users to local server state so all preview tabs have them
    void pushSyncPatchToServer(
      {
        visitors: readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITORS_REGISTRY, []),
        userCredentials: readJsonSafe<Record<string, unknown>>(KEY_USER_CREDENTIALS, {}),
        issuedPasses: readJsonSafe<Array<Record<string, unknown>>>(KEY_ISSUED_PASSES, []),
      },
      { skipFirebase: !appliedFromCloud }
    );
  }

  return collectedUsers;
}

export async function syncUserToCloudApi(userPayload: Record<string, unknown>): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function' || !userPayload) {
    return false;
  }

  const bodyStr = JSON.stringify({
    action: 'sync_user',
    user: userPayload,
  });

  const postToCloud = fetch(CLOUD_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: bodyStr,
  }).catch(() => null);

  const postToLocalServer = fetch('/api/sync/state', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: bodyStr,
  })
    .then(async (res) => {
      if (!res.ok) return;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) return;
      const json = (await res.json()) as { ok?: boolean; state?: ServerSyncPayload };
      if (json?.ok && json.state) {
        applyServerSyncStateToLocal(json.state);
      }
    })
    .catch(() => null);

  await Promise.allSettled([postToCloud, postToLocalServer, pushAccountsToFirebase()]);
  return true;
}

export async function syncStateFromServer(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  if (inFlightPullPromise) return inFlightPullPromise;

  inFlightPullPromise = (async () => {
    try {
      const [usersRes, firebaseRes] = await Promise.allSettled([
        fetchUsersFromCloudApi(),
        pullFromFirebaseRealtimeDb(),
      ]);
      const usersOk = usersRes.status === 'fulfilled';
      const firebaseOk = firebaseRes.status === 'fulfilled' && Boolean(firebaseRes.value);
      return usersOk || firebaseOk;
    } catch {
      return false;
    } finally {
      inFlightPullPromise = null;
    }
  })();

  return inFlightPullPromise;
}

const FIREBASE_ACCOUNT_PATCH_KEYS: Array<keyof ServerSyncPayload> = [
  'accountsDb',
  'userCredentials',
  'users',
  'visitors',
  'issuedPasses',
  'subscriptionTiers',
  'schoolPackages',
  'testerAllowlistEmails',
  'secondaryAdminEmails',
  'lockedAccounts',
  'passportStamps',
  'userEdTechStates',
];

const FIREBASE_HERITAGE_PATCH_KEYS: Array<keyof ServerSyncPayload> = [
  'cmsOverrides',
  'cmsDeletedSiteIds',
  'hiddenHeritageIds',
  'customSitePhotos',
  'photoCaptionOverrides',
  'customGlbUrls',
  'siteTranslationsOverride',
  'audioOverrides',
  'publishedQuizzes',
  'quizDrafts',
  'siteSettings',
];

export async function pushSyncPatchToServer(
  patch: Partial<ServerSyncPayload>,
  options?: { skipFirebase?: boolean }
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;

  let firebaseSynced = false;
  if (!options?.skipFirebase && patch && typeof patch === 'object') {
    const shouldPushAccounts = FIREBASE_ACCOUNT_PATCH_KEYS.some((k) => patch[k] !== undefined);
    const shouldPushHeritage = FIREBASE_HERITAGE_PATCH_KEYS.some((k) => patch[k] !== undefined);
    if (shouldPushAccounts) {
      void pushAccountsToFirebase();
      firebaseSynced = true;
    }
    if (shouldPushHeritage) {
      void pushHeritageSitesToFirebase(true);
      firebaseSynced = true;
    }
  }

  try {
    const res = await fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'merge_state',
        patch,
      }),
    });
    if (!res.ok) return firebaseSynced;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return firebaseSynced;
    const json = (await res.json()) as { ok?: boolean; state?: ServerSyncPayload };
    if (json?.ok && json.state) {
      applyServerSyncStateToLocal(json.state);
      return true;
    }
    return firebaseSynced;
  } catch {
    return firebaseSynced;
  }
}

export async function pushCustomSitePhotosToCloud(
  customSitePhotos: Record<string, unknown>
): Promise<boolean> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return false;
  const nowIso = new Date().toISOString();
  const payload = {
    action: 'merge_state',
    customSitePhotos,
    customSitePhotosUpdatedAt: nowIso,
    patch: {
      customSitePhotos,
      customSitePhotosUpdatedAt: nowIso,
    },
  };
  const bodyStr = JSON.stringify(payload);

  const postToCloud = fetch(CLOUD_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: bodyStr,
  }).catch(() => null);

  const postToLocalServer = pushSyncPatchToServer({
    customSitePhotos,
    customSitePhotosUpdatedAt: nowIso,
  }).catch(() => false);

  await Promise.allSettled([postToCloud, postToLocalServer]);
  return true;
}

function appendLocalVisitHistoryEntry(entry: VisitHistoryLogEntry): void {
  if (typeof window === 'undefined') return;
  const current = loadVisitHistoryLogs();
  const next = [entry, ...current].slice(0, 120);
  writeJsonIfChanged(VISIT_HISTORY_STORAGE_KEY, next);
}

export async function recordServerVisit(visitorLabel?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    if (window.sessionStorage.getItem(VISIT_COUNTED_SESSION_KEY) === '1') {
      return;
    }
    window.sessionStorage.setItem(VISIT_COUNTED_SESSION_KEY, '1');
  } catch {
    // proceed
  }

  const deviceType = detectClientDeviceType();
  const nowIso = new Date().toISOString();

  // Optimistic local increment so offline mode also updates once per session
  const localAnalytics = readJsonSafe<Record<string, unknown>>(KEY_ANALYTICS, {});
  const nextLocalTotal = Math.max(342, Number(localAnalytics.totalVisitors || 342)) + 1;
  writeJsonIfChanged(KEY_ANALYTICS, {
    ...localAnalytics,
    totalVisitors: nextLocalTotal,
    lastUpdatedAt: nowIso,
  });
  appendLocalVisitHistoryEntry({
    id: `vh_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowIso,
    action: 'visit',
    actionLabel: 'Truy cập trang web',
    deviceType,
    ...(visitorLabel ? { visitorLabel } : {}),
  });
  emitEvent(ANALYTICS_UPDATED_EVENT);
  emitEvent(EVT_VISITORS);

  if (typeof fetch !== 'function') return;
  try {
    const res = await fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'increment_visit',
        deviceType,
        visitorLabel,
      }),
    });
    if (!res.ok) return;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return;
    const json = (await res.json()) as { ok?: boolean; state?: ServerSyncPayload };
    if (json?.ok && json.state) {
      applyServerSyncStateToLocal(json.state);
    }
  } catch {
    // Keep optimistic local counter safely on network error
  }
}

export async function recordServerSiteView(
  siteId: string,
  siteName: string,
  source: 'open_3d' | 'open_dossier',
  visitorLabel?: string
): Promise<void> {
  if (typeof window === 'undefined' || !siteId) return;
  const deviceType = detectClientDeviceType();
  const nowIso = new Date().toISOString();

  const localAnalytics = readJsonSafe<Record<string, unknown>>(KEY_ANALYTICS, {});
  const prevViews =
    (localAnalytics.siteViews && typeof localAnalytics.siteViews === 'object'
      ? (localAnalytics.siteViews as Record<string, number>)
      : {}) || {};
  const nextCount = (prevViews[siteId] || 0) + 1;
  writeJsonIfChanged(KEY_ANALYTICS, {
    ...localAnalytics,
    interactions3D:
      source === 'open_3d'
        ? Number(localAnalytics.interactions3D || 518) + 1
        : Number(localAnalytics.interactions3D || 518),
    siteViews: {
      ...prevViews,
      [siteId]: nextCount,
    },
    lastUpdatedAt: nowIso,
  });
  appendLocalVisitHistoryEntry({
    id: `vh_local_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: nowIso,
    action: source,
    actionLabel: source === 'open_3d' ? 'Mở Không gian 3D' : 'Xem Hồ sơ Di sản',
    siteId,
    siteName,
    deviceType,
    ...(visitorLabel ? { visitorLabel } : {}),
  });
  emitEvent(ANALYTICS_UPDATED_EVENT);
  emitEvent(EVT_VISITORS);

  if (typeof fetch !== 'function') return;
  try {
    const res = await fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'increment_site_view',
        siteId,
        siteName,
        source,
        deviceType,
        visitorLabel,
      }),
    });
    if (!res.ok) return;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return;
    const json = (await res.json()) as { ok?: boolean; state?: ServerSyncPayload };
    if (json?.ok && json.state) {
      applyServerSyncStateToLocal(json.state);
    }
  } catch {
    // Keep optimistic local counter safely
  }
}

export async function pushInteractionToServer(kind: string, siteId?: string): Promise<void> {
  if (typeof window === 'undefined' || typeof fetch !== 'function') return;
  try {
    const res = await fetch('/api/sync/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_interaction',
        kind,
        siteId,
      }),
    });
    if (!res.ok) return;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return;
    const json = (await res.json()) as { ok?: boolean; state?: ServerSyncPayload };
    if (json?.ok && json.state) {
      applyServerSyncStateToLocal(json.state);
    }
  } catch {
    // ignore offline error
  }
}

/**
 * Called once on app bootstrap after initial syncStateFromServer():
 * uploads any existing local accounts, tickets, reviews, or progress to server
 * without overwriting server-side counters or newer admin configs.
 */
export async function syncLocalBootstrapSnapshotToServer(): Promise<void> {
  if (typeof window === 'undefined') return;
  const userCredentials = readJsonSafe<Record<string, unknown>>(KEY_USER_CREDENTIALS, {});
  const visitors = readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITORS_REGISTRY, []);
  const issuedPasses = readJsonSafe<Array<Record<string, unknown>>>(KEY_ISSUED_PASSES, []);
  const supportTickets = readJsonSafe<Array<Record<string, unknown>>>(KEY_SUPPORT_TICKETS, []);
  const visitorReviews = readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITOR_REVIEWS, []);
  const customSitePhotos = readJsonSafe<Record<string, unknown>>(KEY_CUSTOM_SITE_PHOTOS, {});
  const photoCaptionOverrides = readJsonSafe<Record<string, unknown>>(KEY_PHOTO_CAPTIONS, {});
  const customGlbUrls = readJsonSafe<Record<string, string>>(KEY_CUSTOM_GLB_URLS, {});
  const accountsDb = readJsonSafe<Array<Record<string, unknown>>>(KEY_ACCOUNTS_DB, []);
  const subscriptionTiers = readJsonSafe<Record<string, unknown>>(KEY_SUBSCRIPTION_TIERS, {});
  const schoolPackages = readJsonSafe<Record<string, unknown>>(KEY_SCHOOL_PACKAGES, {});

  const userEdTechStates: Record<string, Record<string, unknown>> = {};
  const passportStamps: Record<string, Record<string, unknown>> = {};
  try {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(KEY_USER_EDTECH_PREFIX)) {
        const scope = k.slice(KEY_USER_EDTECH_PREFIX.length);
        const val = readJsonSafe<Record<string, unknown> | null>(k, null);
        if (scope && val) userEdTechStates[scope] = val;
      } else if (k.startsWith(KEY_PASSPORT_PREFIX)) {
        const scope = k.slice(KEY_PASSPORT_PREFIX.length);
        const val = readJsonSafe<Record<string, unknown> | null>(k, null);
        if (scope && val) passportStamps[scope] = val;
      }
    }
  } catch {
    // ignore storage iteration error
  }

  const hasAnyLocalData =
    Object.keys(userCredentials).length > 0 ||
    visitors.length > 0 ||
    accountsDb.length > 0 ||
    Object.keys(subscriptionTiers).length > 0 ||
    Object.keys(schoolPackages).length > 0 ||
    issuedPasses.length > 0 ||
    supportTickets.length > 0 ||
    visitorReviews.length > 0 ||
    Object.keys(customSitePhotos).length > 0 ||
    Object.keys(photoCaptionOverrides).length > 0 ||
    Object.keys(customGlbUrls).length > 0 ||
    Object.keys(userEdTechStates).length > 0 ||
    Object.keys(passportStamps).length > 0;

  if (!hasAnyLocalData) return;

  await pushSyncPatchToServer(
    {
      userCredentials,
      visitors,
      ...(accountsDb.length > 0 ? { accountsDb } : {}),
      ...(Object.keys(subscriptionTiers).length > 0 ? { subscriptionTiers } : {}),
      ...(Object.keys(schoolPackages).length > 0 ? { schoolPackages } : {}),
      issuedPasses,
      supportTickets,
      visitorReviews,
      ...(Object.keys(customSitePhotos).length > 0 ? { customSitePhotos } : {}),
      ...(Object.keys(photoCaptionOverrides).length > 0 ? { photoCaptionOverrides } : {}),
      ...(Object.keys(customGlbUrls).length > 0 ? { customGlbUrls } : {}),
      userEdTechStates,
      passportStamps,
    },
    { skipFirebase: true }
  );
}

// ============================================================================
// ACCOUNT TRANSFER CODE ("MÃ ĐỒNG BỘ TÀI KHOẢN LIÊN THIẾT BỊ") — CROSS-DEVICE INSTANT RESTORE
// ============================================================================
const TRANSFER_CODE_PREFIX = 'DAV3D-';
const LEGACY_TRANSFER_CODE_PREFIX = 'DAV3D1-';

export interface AccountTransferUserProfile {
  id: string;
  userId: string;
  provider: 'google' | 'facebook';
  email: string;
  displayName: string;
  role: 'admin' | 'visitor';
  isPrimaryAdmin: boolean;
  isBetaTester?: boolean;
  userTier?: 'free' | 'plus' | 'pro';
  hasSchoolPackage?: boolean;
  authMethod: 'password_verified' | 'oauth_sdk' | 'judge_quick_access';
}

interface AccountTransferBundle {
  v: 1;
  exportedAt: string;
  u: AccountTransferUserProfile;
  c?: { key: string; val: Record<string, unknown> } | null;
  ah?: string;
  vis?: Record<string, unknown> | null;
  p?: Array<Record<string, unknown>>;
  ed?: { scope: string; val: Record<string, unknown> } | null;
  st?: { scope: string; val: Record<string, unknown> } | null;
  tk?: Array<Record<string, unknown>>;
  tr?: 'free' | 'plus' | 'pro';
  sp?: boolean;
}

function encodeUtf8Base64Url(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeUtf8Base64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((encoded.length + 3) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function buildAccountTransferCode(user: AccountTransferUserProfile): string {
  if (typeof window === 'undefined') return '';
  const normEmail = (user.email || '').toLowerCase().trim();
  const scope = normEmail || user.userId;

  const credsMap = readJsonSafe<Record<string, Record<string, unknown>>>(KEY_USER_CREDENTIALS, {});
  const credEntry = Object.entries(credsMap).find(
    ([, val]) => val && val.userId === user.userId
  );

  let adminHash: string | undefined;
  if (user.isPrimaryAdmin) {
    try {
      const rawHash = window.localStorage.getItem(KEY_ADMIN_PASSWORD_HASH) || '';
      if (rawHash.length >= 24) adminHash = rawHash;
    } catch {
      // ignore
    }
  }

  const visitors = readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITORS_REGISTRY, []);
  const visitorRec = visitors.find((v) => v?.userId === user.userId) || null;

  const allPasses = readJsonSafe<Array<Record<string, unknown>>>(KEY_ISSUED_PASSES, []);
  const userPasses = allPasses.filter((p) => {
    const pEmail = typeof p?.ownerEmail === 'string' ? p.ownerEmail.toLowerCase().trim() : '';
    if (normEmail) {
      if (pEmail) return pEmail === normEmail;
      return p?.ownerUserId === user.userId;
    }
    return !pEmail && p?.ownerUserId === user.userId;
  });

  const edtechVal =
    readJsonSafe<Record<string, unknown> | null>(`${KEY_USER_EDTECH_PREFIX}${scope}`, null) ||
    (normEmail && user.userId
      ? readJsonSafe<Record<string, unknown> | null>(`${KEY_USER_EDTECH_PREFIX}${user.userId}`, null)
      : null);

  const stampsVal =
    readJsonSafe<Record<string, unknown> | null>(`${KEY_PASSPORT_PREFIX}${scope}`, null) ||
    (normEmail && user.userId
      ? readJsonSafe<Record<string, unknown> | null>(`${KEY_PASSPORT_PREFIX}${user.userId}`, null)
      : null);

  const allTickets = readJsonSafe<Array<Record<string, unknown>>>(KEY_SUPPORT_TICKETS, []);
  const userTickets = allTickets
    .filter((t) => {
      const tEmail = typeof t?.ownerEmail === 'string' ? t.ownerEmail.toLowerCase().trim() : '';
      if (normEmail) {
        if (tEmail) return tEmail === normEmail;
        return t?.senderUserId === user.userId;
      }
      return !tEmail && t?.senderUserId === user.userId;
    })
    .slice(0, 12);

  // Resolve account tier from subscription map, user passes, or ACCOUNTS_DB
  const subMap = readJsonSafe<Record<string, { tier?: string }>>(KEY_SUBSCRIPTION_TIERS, {});
  const storedSubTier = subMap[scope]?.tier;
  let resolvedUserTier: 'free' | 'plus' | 'pro' = user.userTier || 'free';
  if (storedSubTier === 'vip_49k' || storedSubTier === 'pro') resolvedUserTier = 'pro';
  else if (storedSubTier === 'route_19k' || storedSubTier === 'plus') resolvedUserTier = 'plus';
  if (resolvedUserTier === 'free') {
    for (const p of userPasses) {
      if (p?.status === 'revoked') continue;
      if (p?.kind === 'vip_ticket' || p?.kind === 'b2b_school') {
        resolvedUserTier = 'pro';
        break;
      }
      if (p?.kind === 'route_ticket') resolvedUserTier = 'plus';
    }
  }

  const schoolPkgMap = readJsonSafe<Record<string, { active?: boolean }>>(KEY_SCHOOL_PACKAGES, {});
  const localAccs = readJsonSafe<Array<Record<string, unknown>>>(KEY_ACCOUNTS_DB, []);
  const matchedAcc = localAccs.find(
    (a) =>
      (normEmail && String(a?.email || '').toLowerCase().trim() === normEmail) ||
      (user.userId && a?.userId === user.userId)
  );
  const resolvedSchoolPackage = Boolean(
    user.hasSchoolPackage ||
      schoolPkgMap[scope]?.active ||
      (normEmail && schoolPkgMap[normEmail]?.active) ||
      (user.userId && schoolPkgMap[user.userId]?.active) ||
      matchedAcc?.hasSchoolPackage ||
      userPasses.some((p) => p?.status !== 'revoked' && p?.kind === 'b2b_school')
  );

  const bundle: AccountTransferBundle = {
    v: 1,
    exportedAt: new Date().toISOString(),
    u: {
      id: user.id || user.userId,
      userId: user.userId,
      provider: user.provider,
      email: normEmail,
      displayName: user.displayName,
      role: user.role,
      isPrimaryAdmin: user.isPrimaryAdmin,
      isBetaTester: user.isBetaTester,
      userTier: resolvedUserTier,
      hasSchoolPackage: resolvedSchoolPackage,
      authMethod: user.authMethod,
    },
    tr: resolvedUserTier,
    sp: resolvedSchoolPackage,
    ...(credEntry ? { c: { key: credEntry[0], val: credEntry[1] } } : {}),
    ...(adminHash ? { ah: adminHash } : {}),
    ...(visitorRec ? { vis: visitorRec } : {}),
    ...(userPasses.length > 0 ? { p: userPasses } : {}),
    ...(edtechVal ? { ed: { scope, val: edtechVal } } : {}),
    ...(stampsVal ? { st: { scope, val: stampsVal } } : {}),
    ...(userTickets.length > 0 ? { tk: userTickets } : {}),
  };

  return `${TRANSFER_CODE_PREFIX}${encodeUtf8Base64Url(JSON.stringify(bundle))}`;
}

export async function restoreAccountFromTransferCode(rawCode: string): Promise<{
  ok: boolean;
  error?: string;
  user?: AccountTransferUserProfile;
}> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'Môi trường không hỗ trợ khôi phục mã đồng bộ tài khoản.' };
  }
  const cleaned = (rawCode || '').trim().replace(/\s+/g, '');
  let matchedPrefix = '';
  if (cleaned.startsWith(TRANSFER_CODE_PREFIX)) {
    matchedPrefix = TRANSFER_CODE_PREFIX;
  } else if (cleaned.startsWith(LEGACY_TRANSFER_CODE_PREFIX)) {
    matchedPrefix = LEGACY_TRANSFER_CODE_PREFIX;
  } else {
    return {
      ok: false,
      error:
        'Mã đồng bộ tài khoản không đúng định dạng (mã hợp lệ phải bắt đầu bằng "DAV3D-").',
    };
  }

  let bundle: AccountTransferBundle;
  try {
    const jsonText = decodeUtf8Base64Url(cleaned.slice(matchedPrefix.length));
    bundle = JSON.parse(jsonText) as AccountTransferBundle;
  } catch {
    return {
      ok: false,
      error: 'Không thể giải mã chuỗi đồng bộ tài khoản. Vui lòng kiểm tra và sao chép lại đầy đủ mã.',
    };
  }

  if (
    !bundle ||
    bundle.v !== 1 ||
    !bundle.u ||
    !bundle.u.userId ||
    (bundle.u.provider !== 'google' && bundle.u.provider !== 'facebook') ||
    !bundle.u.displayName
  ) {
    return {
      ok: false,
      error: 'Dữ liệu bên trong mã chuyển thiết bị không hợp lệ hoặc đã bị thiếu.',
    };
  }

  const targetUser = bundle.u;
  const locks = readJsonSafe<Record<string, { locked?: boolean }>>(KEY_LOCKED_ACCOUNTS, {});
  if (!targetUser.isPrimaryAdmin && locks[targetUser.userId]?.locked) {
    return {
      ok: false,
      error: 'Tài khoản này đang bị tạm khóa bởi Quản trị viên nên không thể khôi phục.',
    };
  }

  const normEmail = (targetUser.email || '').toLowerCase().trim();
  const scope = normEmail || targetUser.userId;

  const patchToPush: Partial<ServerSyncPayload> = {};

  if (bundle.c && bundle.c.key && bundle.c.val && typeof bundle.c.val === 'object') {
    const credsMap = readJsonSafe<Record<string, Record<string, unknown>>>(KEY_USER_CREDENTIALS, {});
    credsMap[bundle.c.key] = bundle.c.val;
    writeJsonIfChanged(KEY_USER_CREDENTIALS, credsMap);
    patchToPush.userCredentials = { [bundle.c.key]: bundle.c.val };
  }

  if (targetUser.isPrimaryAdmin && typeof bundle.ah === 'string' && bundle.ah.length >= 24) {
    try {
      window.localStorage.setItem(KEY_ADMIN_PASSWORD_HASH, bundle.ah);
      patchToPush.adminPasswordHash = bundle.ah;
      patchToPush.adminPasswordUpdatedAt = bundle.exportedAt || new Date().toISOString();
    } catch {
      // ignore
    }
  }

  const nowIso = new Date().toISOString();
  const localVisitors = readJsonSafe<Array<Record<string, unknown>>>(KEY_VISITORS_REGISTRY, []);
  const existingVis = localVisitors.find((v) => v?.userId === targetUser.userId);
  const incomingVis: Record<string, unknown> = bundle.vis || {
    userId: targetUser.userId,
    provider: targetUser.provider,
    displayName: targetUser.displayName,
    maskedContact: normEmail || targetUser.displayName,
    role: targetUser.role,
    isPrimaryAdmin: targetUser.isPrimaryAdmin,
    loginCount: 1,
    firstLoginAt: nowIso,
    lastLoginAt: nowIso,
    exploredSiteIds: [],
    completedRouteIds: [],
  };
  const mergedVisitor: Record<string, unknown> = existingVis
    ? {
        ...existingVis,
        ...incomingVis,
        loginCount: Math.max(Number(existingVis.loginCount || 1), Number(incomingVis.loginCount || 1)),
        lastLoginAt: nowIso,
        exploredSiteIds: Array.from(
          new Set([
            ...(Array.isArray(existingVis.exploredSiteIds) ? (existingVis.exploredSiteIds as string[]) : []),
            ...(Array.isArray(incomingVis.exploredSiteIds) ? (incomingVis.exploredSiteIds as string[]) : []),
          ])
        ),
        completedRouteIds: Array.from(
          new Set([
            ...(Array.isArray(existingVis.completedRouteIds) ? (existingVis.completedRouteIds as string[]) : []),
            ...(Array.isArray(incomingVis.completedRouteIds) ? (incomingVis.completedRouteIds as string[]) : []),
          ])
        ),
      }
    : { ...incomingVis, lastLoginAt: nowIso };
  const nextVisitors = [
    mergedVisitor,
    ...localVisitors.filter((v) => v?.userId !== targetUser.userId),
  ];
  writeJsonIfChanged(KEY_VISITORS_REGISTRY, nextVisitors);
  patchToPush.visitors = [mergedVisitor];

  if (Array.isArray(bundle.p) && bundle.p.length > 0) {
    const localPasses = readJsonSafe<Array<Record<string, unknown>>>(KEY_ISSUED_PASSES, []);
    const passMap = new Map<string, Record<string, unknown>>();
    [...localPasses, ...bundle.p].forEach((p) => {
      if (typeof p?.id === 'string') {
        const prev = passMap.get(p.id);
        if (!prev || String(p.updatedAt || '') >= String(prev.updatedAt || '')) {
          passMap.set(p.id, p);
        }
      }
    });
    const mergedPasses = Array.from(passMap.values()).sort((a, b) =>
      String(b.issuedAt || '').localeCompare(String(a.issuedAt || ''))
    );
    writeJsonIfChanged(KEY_ISSUED_PASSES, mergedPasses);
    patchToPush.issuedPasses = bundle.p;
    emitEvent(EVT_PASSES);
  }

  if (bundle.ed && bundle.ed.val && typeof bundle.ed.val === 'object') {
    const targetScope = bundle.ed.scope || scope;
    const edKey = `${KEY_USER_EDTECH_PREFIX}${targetScope}`;
    const prevEd = readJsonSafe<Record<string, unknown> | null>(edKey, null);
    const mergedEd = prevEd
      ? {
          ...prevEd,
          ...bundle.ed.val,
          ticketIssued: Boolean(prevEd.ticketIssued || bundle.ed.val.ticketIssued),
          quizSubmitted: Boolean(prevEd.quizSubmitted || bundle.ed.val.quizSubmitted),
          ticketPassId: bundle.ed.val.ticketPassId || prevEd.ticketPassId,
          certPassId: bundle.ed.val.certPassId || prevEd.certPassId,
          topicSubmittedMap: {
            ...((prevEd.topicSubmittedMap as Record<string, unknown>) || {}),
            ...((bundle.ed.val.topicSubmittedMap as Record<string, unknown>) || {}),
          },
          topicCertIds: {
            ...((prevEd.topicCertIds as Record<string, unknown>) || {}),
            ...((bundle.ed.val.topicCertIds as Record<string, unknown>) || {}),
          },
        }
      : bundle.ed.val;
    writeJsonIfChanged(edKey, mergedEd);
    patchToPush.userEdTechStates = { [targetScope]: mergedEd };
  }

  if (bundle.st && bundle.st.val && typeof bundle.st.val === 'object') {
    const targetScope = bundle.st.scope || scope;
    const stKey = `${KEY_PASSPORT_PREFIX}${targetScope}`;
    const prevSt = readJsonSafe<Record<string, unknown>>(stKey, {});
    const mergedSt = { ...prevSt, ...bundle.st.val };
    writeJsonIfChanged(stKey, mergedSt);
    patchToPush.passportStamps = { [targetScope]: mergedSt };
    emitEvent(EVT_PASSPORT);
  }

  if (Array.isArray(bundle.tk) && bundle.tk.length > 0) {
    const localTickets = readJsonSafe<Array<Record<string, unknown>>>(KEY_SUPPORT_TICKETS, []);
    const tkMap = new Map<string, Record<string, unknown>>();
    [...localTickets, ...bundle.tk].forEach((t) => {
      if (typeof t?.id === 'string') {
        const prev = tkMap.get(t.id);
        if (!prev || String(t.updatedAt || '') >= String(prev.updatedAt || '')) {
          tkMap.set(t.id, t);
        }
      }
    });
    const mergedTickets = Array.from(tkMap.values()).sort((a, b) =>
      String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))
    );
    writeJsonIfChanged(KEY_SUPPORT_TICKETS, mergedTickets);
    patchToPush.supportTickets = bundle.tk;
    emitEvent(EVT_SUPPORT);
  }

  // Restore tier (`userTier`, `subscriptionTiers`, and `ACCOUNTS_DB`)
  let restoredTier: 'free' | 'plus' | 'pro' = bundle.tr || targetUser.userTier || 'free';
  if (restoredTier === 'free' && Array.isArray(bundle.p)) {
    for (const p of bundle.p) {
      if (p?.status === 'revoked') continue;
      if (p?.kind === 'vip_ticket' || p?.kind === 'b2b_school') {
        restoredTier = 'pro';
        break;
      }
      if (p?.kind === 'route_ticket') restoredTier = 'plus';
    }
  }
  const mappedSubTier =
    restoredTier === 'pro' ? 'vip_49k' : restoredTier === 'plus' ? 'route_19k' : 'free';

  const subMap = readJsonSafe<Record<string, { tier: string; updatedAt: string }>>(
    KEY_SUBSCRIPTION_TIERS,
    {}
  );
  subMap[scope] = { tier: mappedSubTier, updatedAt: nowIso };
  writeJsonIfChanged(KEY_SUBSCRIPTION_TIERS, subMap);
  try {
    window.localStorage.setItem(KEY_USER_TIER_SIMPLE, restoredTier);
  } catch {
    // ignore
  }
  patchToPush.subscriptionTiers = { [scope]: subMap[scope] };

  const restoredHasSchoolPkg = Boolean(
    bundle.sp ||
      targetUser.hasSchoolPackage ||
      (Array.isArray(bundle.p) &&
        bundle.p.some((p) => p?.status !== 'revoked' && p?.kind === 'b2b_school'))
  );

  if (restoredHasSchoolPkg) {
    const spMap = readJsonSafe<Record<string, { active: boolean; updatedAt: string }>>(
      KEY_SCHOOL_PACKAGES,
      {}
    );
    spMap[scope] = { active: true, updatedAt: nowIso };
    writeJsonIfChanged(KEY_SCHOOL_PACKAGES, spMap);
    patchToPush.schoolPackages = { [scope]: spMap[scope] };
  }

  const localAccounts = readJsonSafe<Array<Record<string, unknown>>>(KEY_ACCOUNTS_DB, []);
  const accEmail = normEmail || targetUser.userId;
  const restoredAccRecord: Record<string, unknown> = {
    id: targetUser.userId,
    userId: targetUser.userId,
    name: targetUser.displayName,
    displayName: targetUser.displayName,
    email: accEmail,
    provider: targetUser.provider,
    role: targetUser.role,
    isPrimaryAdmin: targetUser.isPrimaryAdmin,
    isBetaTester: Boolean(targetUser.isBetaTester),
    userTier: restoredTier,
    hasSchoolPackage: restoredHasSchoolPkg,
    createdAt:
      (typeof mergedVisitor.firstLoginAt === 'string' && mergedVisitor.firstLoginAt) || nowIso,
    updatedAt: nowIso,
    lastLoginAt: nowIso,
  };
  const nextAccounts = [
    restoredAccRecord,
    ...localAccounts.filter(
      (a) =>
        String(a?.email || '').toLowerCase().trim() !== accEmail &&
        String(a?.userId || '') !== targetUser.userId
    ),
  ];
  writeJsonIfChanged(KEY_ACCOUNTS_DB, nextAccounts);
  patchToPush.accountsDb = [restoredAccRecord];

  emitEvent(EVT_SUBSCRIPTION_TIER);
  emitEvent(EVT_ACCOUNTS_DB);
  emitEvent(EVT_VISITORS);
  void pushSyncPatchToServer(patchToPush);

  return {
    ok: true,
    user: { ...targetUser, userTier: restoredTier, hasSchoolPackage: restoredHasSchoolPkg },
  };
}

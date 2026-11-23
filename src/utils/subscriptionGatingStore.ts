/**
 * Subscription & 4-Tier Permission Gating Engine + Dual-Region Orders & VietQR Config
 * Syncs with Firebase Realtime Database REST API + localStorage fallback:
 *  - /users/{uid}/subscriptions.json
 *  - /orders/{orderId}.json (and /orders.json)
 *  - /paymentConfig/vietqr.json
 */

import { useEffect, useMemo, useState } from 'react';
import {
  FIREBASE_DB_URL,
  isFirebaseDbConfigured,
  sanitizeFirebaseUserKey,
} from './firebaseRestSync';
import {
  PASSES_UPDATED_EVENT,
  SUBSCRIPTION_TIER_UPDATED_EVENT,
  activateUserSchoolPackage,
  getUserIssuedPasses,
  getUserSubscriptionTier,
  hasUserSchoolPackage,
  recordIssuedPass,
  setUserSubscriptionTier,
  type IssuedPassRecord,
} from './adminPlatformStore';
import { TOUR_ROUTES } from '../data/tours';
import { DEFAULT_HERITAGE_SITES } from '../data/heritageSites';
import { useAuth } from '../contexts/AuthContext';
import {
  pushSuQuanPurchaseNotice,
  sendOrderThankYouEmail,
  updateSuQuanNoticeEmailSent,
  type EmailSendResult,
} from './emailAutoSender';
import {
  syncGlobalPaymentQrToCloud,
  syncUserEntitlementsToCloud,
  type CloudUserEntitlements,
} from './realtimeCloudSync';

export type SubscriptionPlanLevel = 'basic' | 'plus' | 'pro' | 'school';
export type AdminPreviewRole = 'guest' | 'admin' | 'tester' | 'basic' | 'plus' | 'pro' | 'school';
export type PaymentRegion = 'vn_vietqr' | 'intl_usd';
export type PaymentMethodType = 'vietqr' | 'apple_pay' | 'google_pay' | 'paypal' | 'card';

export interface UserSubscriptionRecord {
  uid: string;
  email: string;
  tier: SubscriptionPlanLevel;
  unlockedSiteIds: string[];
  unlockedRouteIds: string[];
  hasSchoolPackage: boolean;
  schoolName?: string;
  schoolCode?: string;
  activeOrderIds: string[];
  updatedAt: string;
}

export interface PaymentOrderRecord {
  orderId: string;
  uid: string;
  email: string;
  customerName: string;
  planTier: 'plus' | 'pro' | 'school';
  plusScopeType?: 'site' | 'route';
  scopeLabel: string;
  siteIds: string[];
  routeIds: string[];
  region: PaymentRegion;
  paymentMethod: PaymentMethodType;
  paymentMethodLabel: string;
  amountVnd: number;
  amountUsd: number;
  amountDisplay: string;
  transferMemo?: string;
  schoolName?: string;
  schoolCode?: string;
  planName?: string;
  emailSent?: boolean;
  emailSentAt?: string;
  status: 'completed';
  createdAt: string;
}

export interface PaymentQrConfig {
  qrImageDataUrl: string | null;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchNote?: string;
  updatedAt: string;
}

export type GatedFeatureKey =
  | '3d_explode'
  | '3d_xray'
  | '3d_interior'
  | 'audio_guide'
  | 'ai_advanced'
  | 'ai_hydrogen'
  | 'ai_daily_limit'
  | 'journey_stamp'
  | 'digital_certificate'
  | 'school_edtech';

export interface UpgradePromptDetail {
  featureKey: GatedFeatureKey;
  featureLabel?: string;
  siteId?: string;
  siteName?: string;
  requiredPlan: 'plus_or_pro' | 'pro' | 'school';
  isPlusScopeMismatch?: boolean;
  currentRole?: AdminPreviewRole;
}

export interface PlanCheckoutRequest {
  planTier: 'plus' | 'pro' | 'school';
  siteId?: string;
  routeId?: string;
  plusScopeType?: 'site' | 'route';
  schoolName?: string;
  schoolProvince?: string;
}

export interface SitePermissionEvaluation {
  effectiveRole: AdminPreviewRole;
  isActualAdmin: boolean;
  isPreviewingNonAdmin: boolean;
  canViewDossiersAndMap: boolean;
  canUse3DOriginal: boolean;
  canUse3DAdvanced: boolean;
  canUseAudioGuide: boolean;
  canUseAdvancedAi: boolean;
  canUseGemini35Flash: boolean;
  canUseGemini4Hydrogen: boolean;
  canSeeGemini4Argon: boolean;
  canUseGemini4Argon: boolean;
  basicAiDailyLimit: number;
  canUseJourneyStampAndCert: boolean;
  canUseSchoolEdTech: boolean;
  isPlusScopeLockedForSite: boolean;
  unlockedSiteIds: string[];
  unlockedRouteIds: string[];
  recommendedUpgradePlan: 'plus_or_pro' | 'pro' | 'school';
}

export const PLAN_PRICING = {
  basic: { vnd: 0, usd: 0, vndLabel: '0đ', usdLabel: '$0.00 USD' },
  plus: { vnd: 19_000, usd: 1, vndLabel: '19.000đ', usdLabel: '$1.00 USD' },
  pro: { vnd: 49_000, usd: 2, vndLabel: '49.000đ', usdLabel: '$2.00 USD' },
  school: { vnd: 5_000_000, usd: 199, vndLabel: '5.000.000đ', usdLabel: '$199.00 USD' },
} as const;

const KEY_USER_SUB_PREFIX = 'dau_an_viet_user_sub_v2_';
const KEY_PAYMENT_ORDERS = 'dau_an_viet_payment_orders_v2';
const KEY_PAYMENT_QR_CONFIG = 'dau_an_viet_payment_qr_config_v2';
const SESSION_KEY_ADMIN_PREVIEW = 'dau_an_viet_admin_preview_role_v2';

export const SUBSCRIPTION_GATING_UPDATED_EVENT = 'dau-an-viet-subscription-gating-updated';
export const ADMIN_PREVIEW_ROLE_UPDATED_EVENT = 'dau-an-viet-admin-preview-role-updated';
export const PAYMENT_ORDERS_UPDATED_EVENT = 'dau-an-viet-payment-orders-updated';
export const PAYMENT_QR_CONFIG_UPDATED_EVENT = 'dau-an-viet-payment-qr-config-updated';
export const OPEN_UPGRADE_PROMPT_EVENT = 'dau-an-viet-open-upgrade-prompt';
export const OPEN_PLAN_CHECKOUT_EVENT = 'dau-an-viet-open-plan-checkout';
export const NAVIGATE_TO_PRICING_PLAN_EVENT = 'dau-an-viet-navigate-to-pricing-plan';

// Default Plus preview scope when Admin tests "Plus 19k": Tuyến 01 (Dinh Độc Lập & Nhà thờ Chính tòa Đức Bà Sài Gòn)
export const ADMIN_PREVIEW_PLUS_DEFAULT_ROUTE_ID = 'TOUR-01';
export const ADMIN_PREVIEW_PLUS_DEFAULT_SITE_IDS = ['HCM-DT-001', 'HCM-DT-005'];

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

export function getRouteSiteIds(routeId: string): string[] {
  const found = TOUR_ROUTES.find((r) => r.id === routeId);
  return found ? [...found.sites] : [];
}

export function expandUnlockedSitesFromRoutes(siteIds: string[], routeIds: string[]): string[] {
  const set = new Set<string>(siteIds.filter(Boolean));
  for (const rid of routeIds) {
    for (const sid of getRouteSiteIds(rid)) {
      set.add(sid);
    }
  }
  return Array.from(set);
}

export function getSiteNameById(siteId: string): string {
  const found = DEFAULT_HERITAGE_SITES.find((s) => s.id === siteId);
  return found?.officialName || siteId;
}

// ============================================================================
// 1. ADMIN ROLE PREVIEW SWITCHER (sessionStorage)
// ============================================================================
export function getAdminPreviewRole(): AdminPreviewRole {
  if (typeof window === 'undefined') return 'admin';
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY_ADMIN_PREVIEW);
    if (
      raw === 'guest' ||
      raw === 'admin' ||
      raw === 'tester' ||
      raw === 'basic' ||
      raw === 'plus' ||
      raw === 'pro' ||
      raw === 'school'
    ) {
      return raw;
    }
  } catch {
    // ignore
  }
  return 'admin';
}

export function setAdminPreviewRole(role: AdminPreviewRole): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(SESSION_KEY_ADMIN_PREVIEW, role);
  } catch {
    // ignore
  }
  emitWindowEvent(ADMIN_PREVIEW_ROLE_UPDATED_EVENT, role);
}

export function useAdminPreviewRole(): [AdminPreviewRole, (role: AdminPreviewRole) => void] {
  const [role, setRoleState] = useState<AdminPreviewRole>(() => getAdminPreviewRole());

  useEffect(() => {
    const sync = () => setRoleState(getAdminPreviewRole());
    window.addEventListener(ADMIN_PREVIEW_ROLE_UPDATED_EVENT, sync);
    return () => window.removeEventListener(ADMIN_PREVIEW_ROLE_UPDATED_EVENT, sync);
  }, []);

  return [role, setAdminPreviewRole];
}

// ============================================================================
// 2. USER SUBSCRIPTION RECORD (/users/{uid}/subscriptions + localStorage)
// ============================================================================
function resolveSubStorageKey(uid?: string, email?: string): string {
  const safe = sanitizeFirebaseUserKey(uid || (email || '').toLowerCase().trim() || 'guest');
  return `${KEY_USER_SUB_PREFIX}${safe || 'guest'}`;
}

export function loadLocalUserSubscription(
  uid?: string,
  email?: string
): UserSubscriptionRecord {
  const normEmail = (email || '').toLowerCase().trim();
  const effectiveUid = uid || normEmail || 'guest';
  const defaultRecord: UserSubscriptionRecord = {
    uid: effectiveUid,
    email: normEmail,
    tier: 'basic',
    unlockedSiteIds: [],
    unlockedRouteIds: [],
    hasSchoolPackage: false,
    activeOrderIds: [],
    updatedAt: '',
  };

  if (typeof window === 'undefined') return defaultRecord;

  // Check primary uid key, then email key
  const storedByUid = uid
    ? readLocalJson<Partial<UserSubscriptionRecord> | null>(resolveSubStorageKey(uid), null)
    : null;
  const storedByEmail = normEmail
    ? readLocalJson<Partial<UserSubscriptionRecord> | null>(
        resolveSubStorageKey(undefined, normEmail),
        null
      )
    : null;
  const stored = storedByUid || storedByEmail;

  // Merge with legacy adminPlatformStore passes/tier/schoolPackage so prior purchases & admin grants remain respected
  const legacyTier = getUserSubscriptionTier(uid, normEmail);
  const legacySchool = hasUserSchoolPackage(uid, normEmail);
  const legacyPasses = getUserIssuedPasses(uid, normEmail).filter((p) => p.status !== 'revoked');

  const routeIds = new Set<string>(
    Array.isArray(stored?.unlockedRouteIds) ? stored.unlockedRouteIds : []
  );
  const siteIds = new Set<string>(
    Array.isArray(stored?.unlockedSiteIds) ? stored.unlockedSiteIds : []
  );

  for (const pass of legacyPasses) {
    if (pass.kind === 'route_ticket' && pass.routeId) {
      if (pass.routeId.startsWith('site:')) {
        siteIds.add(pass.routeId.slice(5));
      } else {
        routeIds.add(pass.routeId);
      }
    }
  }

  const hasSchool = Boolean(stored?.hasSchoolPackage || legacySchool);
  let tier: SubscriptionPlanLevel = 'basic';
  if (hasSchool || stored?.tier === 'school') {
    tier = 'school';
  } else if (stored?.tier === 'pro' || legacyTier === 'vip_49k') {
    tier = 'pro';
  } else if (
    stored?.tier === 'plus' ||
    legacyTier === 'route_19k' ||
    siteIds.size > 0 ||
    routeIds.size > 0
  ) {
    tier = 'plus';
  }

  return {
    uid: effectiveUid,
    email: normEmail,
    tier,
    unlockedSiteIds: expandUnlockedSitesFromRoutes(Array.from(siteIds), Array.from(routeIds)),
    unlockedRouteIds: Array.from(routeIds),
    hasSchoolPackage: hasSchool,
    schoolName: stored?.schoolName,
    schoolCode: stored?.schoolCode,
    activeOrderIds: Array.isArray(stored?.activeOrderIds) ? stored.activeOrderIds : [],
    updatedAt: stored?.updatedAt || '',
  };
}

export async function saveUserSubscription(
  record: UserSubscriptionRecord
): Promise<{ ok: boolean; syncedFirebase: boolean }> {
  const safeUid = sanitizeFirebaseUserKey(record.uid || record.email || 'guest');
  const normEmail = record.email.toLowerCase().trim();
  const payload: UserSubscriptionRecord = {
    ...record,
    email: normEmail,
    unlockedSiteIds: expandUnlockedSitesFromRoutes(
      record.unlockedSiteIds,
      record.unlockedRouteIds
    ),
    updatedAt: record.updatedAt || new Date().toISOString(),
  };

  if (safeUid && safeUid !== 'guest') {
    writeLocalJson(resolveSubStorageKey(record.uid), payload);
    if (normEmail) {
      writeLocalJson(resolveSubStorageKey(undefined, normEmail), payload);
    }
  } else {
    writeLocalJson(resolveSubStorageKey('guest'), payload);
  }
  emitWindowEvent(SUBSCRIPTION_GATING_UPDATED_EVENT);

  if (safeUid && safeUid !== 'guest') {
    syncUserEntitlementsToCloud(safeUid, {
      uid: payload.uid,
      email: payload.email,
      tier: payload.tier,
      unlockedSiteIds: payload.unlockedSiteIds,
      unlockedRouteIds: payload.unlockedRouteIds,
      hasSchoolPackage: payload.hasSchoolPackage,
      schoolName: payload.schoolName,
      schoolCode: payload.schoolCode,
      activeOrderIds: payload.activeOrderIds,
    });
  }

  let syncedFirebase = false;
  if (
    safeUid &&
    safeUid !== 'guest' &&
    isFirebaseDbConfigured() &&
    typeof fetch === 'function'
  ) {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/users/${safeUid}/subscriptions.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      syncedFirebase = res.ok;
    } catch {
      syncedFirebase = false;
    }
  }

  return { ok: true, syncedFirebase };
}

/**
 * Applies a real-time cloud or cross-tab entitlements snapshot to local state without
 * re-writing to Firebase RTDB (prevents infinite echo loops).
 */
export function applyRemoteUserSubscriptionSnapshot(
  uid: string | undefined,
  email: string | undefined,
  remote: Partial<CloudUserEntitlements> | null | undefined
): UserSubscriptionRecord | null {
  if (!remote || typeof remote !== 'object') return null;
  const local = loadLocalUserSubscription(uid, email);

  const remoteRoutes = Array.isArray(remote.unlockedRouteIds) ? remote.unlockedRouteIds : [];
  const remoteSites = Array.isArray(remote.unlockedSiteIds) ? remote.unlockedSiteIds : [];
  const remoteTier: SubscriptionPlanLevel =
    remote.tier === 'school' ||
    remote.tier === 'pro' ||
    remote.tier === 'plus' ||
    remote.tier === 'basic'
      ? remote.tier
      : local.tier;

  const hasSchool = Boolean(remote.hasSchoolPackage ?? (remoteTier === 'school'));
  const resolvedTier: SubscriptionPlanLevel = hasSchool ? 'school' : remoteTier;

  const mergedRoutes = Array.from(new Set([...remoteRoutes]));
  const mergedSites = expandUnlockedSitesFromRoutes([...remoteSites], mergedRoutes);

  const next: UserSubscriptionRecord = {
    uid: remote.uid || local.uid,
    email: (remote.email || local.email || '').toLowerCase().trim(),
    tier: resolvedTier,
    unlockedSiteIds: mergedSites,
    unlockedRouteIds: mergedRoutes,
    hasSchoolPackage: hasSchool,
    schoolName: remote.schoolName ?? local.schoolName,
    schoolCode: remote.schoolCode ?? local.schoolCode,
    activeOrderIds: Array.isArray(remote.activeOrderIds)
      ? Array.from(new Set(remote.activeOrderIds))
      : local.activeOrderIds,
    updatedAt:
      typeof remote.updatedAt === 'string'
        ? remote.updatedAt
        : typeof remote.updatedAt === 'number'
        ? new Date(remote.updatedAt).toISOString()
        : new Date().toISOString(),
  };

  if (uid) {
    writeLocalJson(resolveSubStorageKey(uid), next);
  }
  if (next.email) {
    writeLocalJson(resolveSubStorageKey(undefined, next.email), next);
  }
  emitWindowEvent(SUBSCRIPTION_GATING_UPDATED_EVENT);
  return next;
}

export async function pullUserSubscriptionFromFirebase(
  uid?: string,
  email?: string
): Promise<UserSubscriptionRecord> {
  const local = loadLocalUserSubscription(uid, email);
  const safeUid = sanitizeFirebaseUserKey(uid || email || '');
  if (!safeUid || safeUid === 'guest' || !isFirebaseDbConfigured() || typeof fetch !== 'function') {
    return local;
  }

  try {
    const res = await fetch(`${FIREBASE_DB_URL}/users/${safeUid}/subscriptions.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return local;
    const remote = (await res.json()) as Partial<UserSubscriptionRecord> | null;
    if (!remote || typeof remote !== 'object') return local;

    const mergedRoutes = Array.from(
      new Set([
        ...local.unlockedRouteIds,
        ...(Array.isArray(remote.unlockedRouteIds) ? remote.unlockedRouteIds : []),
      ])
    );
    const mergedSites = expandUnlockedSitesFromRoutes(
      [
        ...local.unlockedSiteIds,
        ...(Array.isArray(remote.unlockedSiteIds) ? remote.unlockedSiteIds : []),
      ],
      mergedRoutes
    );
    const hasSchool = Boolean(local.hasSchoolPackage || remote.hasSchoolPackage);
    const tierRank: Record<SubscriptionPlanLevel, number> = {
      basic: 0,
      plus: 1,
      pro: 2,
      school: 3,
    };
    const remoteTier: SubscriptionPlanLevel =
      remote.tier === 'school' ||
      remote.tier === 'pro' ||
      remote.tier === 'plus' ||
      remote.tier === 'basic'
        ? remote.tier
        : 'basic';
    let highestTier: SubscriptionPlanLevel =
      tierRank[remoteTier] > tierRank[local.tier] ? remoteTier : local.tier;
    if (hasSchool) highestTier = 'school';

    const merged: UserSubscriptionRecord = {
      uid: remote.uid || local.uid,
      email: (remote.email || local.email || '').toLowerCase().trim(),
      tier: highestTier,
      unlockedSiteIds: mergedSites,
      unlockedRouteIds: mergedRoutes,
      hasSchoolPackage: hasSchool,
      schoolName: remote.schoolName || local.schoolName,
      schoolCode: remote.schoolCode || local.schoolCode,
      activeOrderIds: Array.from(
        new Set([
          ...local.activeOrderIds,
          ...(Array.isArray(remote.activeOrderIds) ? remote.activeOrderIds : []),
        ])
      ),
      updatedAt: remote.updatedAt || local.updatedAt || new Date().toISOString(),
    };

    writeLocalJson(resolveSubStorageKey(uid), merged);
    if (merged.email) {
      writeLocalJson(resolveSubStorageKey(undefined, merged.email), merged);
    }
    emitWindowEvent(SUBSCRIPTION_GATING_UPDATED_EVENT);
    return merged;
  } catch {
    return local;
  }
}

// ============================================================================
// 3. VIETQR PAYMENT CONFIG (/paymentConfig/vietqr + localStorage)
// ============================================================================
const DEFAULT_PAYMENT_QR_CONFIG: PaymentQrConfig = {
  qrImageDataUrl: null,
  bankName: 'Ngân hàng TMCP Quân Đội (MB Bank)',
  accountNumber: '090920268888',
  accountHolder: 'DU AN DAU AN VIET 3D',
  branchNote: 'VietQR Napas 247 · Xác nhận tự động tức thì',
  updatedAt: '',
};

export function loadPaymentQrConfig(): PaymentQrConfig {
  const stored = readLocalJson<Partial<PaymentQrConfig> | null>(KEY_PAYMENT_QR_CONFIG, null);
  if (!stored || typeof stored !== 'object') {
    return { ...DEFAULT_PAYMENT_QR_CONFIG };
  }
  return {
    qrImageDataUrl:
      typeof stored.qrImageDataUrl === 'string' && stored.qrImageDataUrl.trim()
        ? stored.qrImageDataUrl
        : null,
    bankName:
      typeof stored.bankName === 'string' && stored.bankName.trim()
        ? stored.bankName
        : DEFAULT_PAYMENT_QR_CONFIG.bankName,
    accountNumber:
      typeof stored.accountNumber === 'string' && stored.accountNumber.trim()
        ? stored.accountNumber
        : DEFAULT_PAYMENT_QR_CONFIG.accountNumber,
    accountHolder:
      typeof stored.accountHolder === 'string' && stored.accountHolder.trim()
        ? stored.accountHolder
        : DEFAULT_PAYMENT_QR_CONFIG.accountHolder,
    branchNote:
      typeof stored.branchNote === 'string'
        ? stored.branchNote
        : DEFAULT_PAYMENT_QR_CONFIG.branchNote,
    updatedAt: typeof stored.updatedAt === 'string' ? stored.updatedAt : '',
  };
}

export async function savePaymentQrConfig(
  nextPartial: Partial<PaymentQrConfig>
): Promise<{ ok: boolean; syncedFirebase: boolean; config: PaymentQrConfig }> {
  const current = loadPaymentQrConfig();
  const next: PaymentQrConfig = {
    ...current,
    ...nextPartial,
    updatedAt: new Date().toISOString(),
  };
  writeLocalJson(KEY_PAYMENT_QR_CONFIG, next);
  emitWindowEvent(PAYMENT_QR_CONFIG_UPDATED_EVENT);
  syncGlobalPaymentQrToCloud(next as unknown as Record<string, unknown>);

  let syncedFirebase = false;
  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/paymentConfig/vietqr.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      syncedFirebase = res.ok;
    } catch {
      syncedFirebase = false;
    }
  }
  return { ok: true, syncedFirebase, config: next };
}

export function applyRemotePaymentQrConfigSnapshot(
  remote: Partial<PaymentQrConfig> | null | undefined
): PaymentQrConfig | null {
  if (!remote || typeof remote !== 'object') return null;
  const local = loadPaymentQrConfig();
  const merged: PaymentQrConfig = {
    ...local,
    ...remote,
    qrImageDataUrl:
      remote.qrImageDataUrl === null
        ? null
        : typeof remote.qrImageDataUrl === 'string'
        ? remote.qrImageDataUrl
        : local.qrImageDataUrl,
    updatedAt:
      typeof remote.updatedAt === 'string'
        ? remote.updatedAt
        : typeof remote.updatedAt === 'number'
        ? new Date(remote.updatedAt).toISOString()
        : local.updatedAt,
  };
  writeLocalJson(KEY_PAYMENT_QR_CONFIG, merged);
  emitWindowEvent(PAYMENT_QR_CONFIG_UPDATED_EVENT);
  return merged;
}

export async function pullPaymentQrConfigFromFirebase(): Promise<PaymentQrConfig> {
  const local = loadPaymentQrConfig();
  if (!isFirebaseDbConfigured() || typeof fetch !== 'function') return local;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/paymentConfig/vietqr.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return local;
    const remote = (await res.json()) as Partial<PaymentQrConfig> | null;
    if (!remote || typeof remote !== 'object') return local;
    const merged: PaymentQrConfig = {
      ...local,
      ...remote,
      qrImageDataUrl:
        remote.qrImageDataUrl === null
          ? null
          : typeof remote.qrImageDataUrl === 'string'
          ? remote.qrImageDataUrl
          : local.qrImageDataUrl,
    };
    writeLocalJson(KEY_PAYMENT_QR_CONFIG, merged);
    emitWindowEvent(PAYMENT_QR_CONFIG_UPDATED_EVENT);
    return merged;
  } catch {
    return local;
  }
}

// ============================================================================
// 4. PAYMENT ORDERS LEDGER (/orders/{orderId} + localStorage)
// ============================================================================
export function loadPaymentOrders(): PaymentOrderRecord[] {
  const list = readLocalJson<PaymentOrderRecord[]>(KEY_PAYMENT_ORDERS, []);
  if (!Array.isArray(list)) return [];
  return [...list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function recordPaymentOrder(
  order: PaymentOrderRecord
): Promise<{ ok: boolean; syncedFirebase: boolean }> {
  const current = loadPaymentOrders();
  const next = [order, ...current.filter((o) => o.orderId !== order.orderId)].slice(0, 300);
  writeLocalJson(KEY_PAYMENT_ORDERS, next);
  emitWindowEvent(PAYMENT_ORDERS_UPDATED_EVENT);

  let syncedFirebase = false;
  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    try {
      const safeOrderId = sanitizeFirebaseUserKey(order.orderId);
      const res = await fetch(`${FIREBASE_DB_URL}/orders/${safeOrderId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      syncedFirebase = res.ok;
    } catch {
      syncedFirebase = false;
    }
  }
  return { ok: true, syncedFirebase };
}

export async function updatePaymentOrderEmailStatus(
  orderId: string,
  emailSent: boolean
): Promise<{ ok: boolean; syncedFirebase: boolean }> {
  const current = loadPaymentOrders();
  const nowIso = new Date().toISOString();
  let updatedOrder: PaymentOrderRecord | null = null;
  const next = current.map((o) => {
    if (o.orderId !== orderId) return o;
    updatedOrder = {
      ...o,
      emailSent,
      ...(emailSent ? { emailSentAt: nowIso } : {}),
    };
    return updatedOrder;
  });
  writeLocalJson(KEY_PAYMENT_ORDERS, next);
  emitWindowEvent(PAYMENT_ORDERS_UPDATED_EVENT);
  updateSuQuanNoticeEmailSent(orderId, emailSent);

  let syncedFirebase = false;
  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    try {
      const safeOrderId = sanitizeFirebaseUserKey(orderId);
      const res = await fetch(`${FIREBASE_DB_URL}/orders/${safeOrderId}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailSent,
          ...(emailSent ? { emailSentAt: nowIso } : {}),
        }),
      });
      syncedFirebase = res.ok;
    } catch {
      syncedFirebase = false;
    }
  }
  return { ok: Boolean(updatedOrder), syncedFirebase };
}

export function getPlanDisplayName(planTier: 'plus' | 'pro' | 'school'): string {
  if (planTier === 'school') return 'Gói Học Liệu Trường Học';
  if (planTier === 'pro') return 'Gói Pro Toàn Diện 17 Di tích';
  return 'Gói Plus Di Sản';
}

export async function pullPaymentOrdersFromFirebase(): Promise<PaymentOrderRecord[]> {
  const local = loadPaymentOrders();
  if (!isFirebaseDbConfigured() || typeof fetch !== 'function') return local;
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/orders.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return local;
    const raw = (await res.json()) as unknown;
    const remoteList: PaymentOrderRecord[] = Array.isArray(raw)
      ? (raw.filter(Boolean) as PaymentOrderRecord[])
      : raw && typeof raw === 'object'
      ? (Object.values(raw as Record<string, PaymentOrderRecord>).filter(
          Boolean
        ) as PaymentOrderRecord[])
      : [];
    if (remoteList.length === 0) return local;

    const map = new Map<string, PaymentOrderRecord>();
    for (const item of [...local, ...remoteList]) {
      if (item && item.orderId) map.set(item.orderId, item);
    }
    const merged = Array.from(map.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 300);
    writeLocalJson(KEY_PAYMENT_ORDERS, merged);
    emitWindowEvent(PAYMENT_ORDERS_UPDATED_EVENT);
    return merged;
  } catch {
    return local;
  }
}

// ============================================================================
// 5. UNIFIED PLAN PURCHASE COMPLETION (VietQR VNĐ & Global USD)
// ============================================================================
export function generateTransferMemo(planTier: 'plus' | 'pro' | 'school'): string {
  const tag = planTier === 'school' ? 'EDU' : planTier === 'pro' ? 'PRO' : 'PLUS';
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DAV ${tag} ${rand}`;
}

export function generateSchoolActivationCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const suffix =
    chars[Math.floor(Math.random() * chars.length)] +
    chars[Math.floor(Math.random() * chars.length)];
  return `EDU-DAV-${num}-${suffix}`;
}

export async function completePlanPurchase(params: {
  uid: string;
  userId: string;
  email: string;
  displayName: string;
  provider?: 'google' | 'facebook';
  planTier: 'plus' | 'pro' | 'school';
  plusScopeType?: 'site' | 'route';
  siteIds?: string[];
  routeIds?: string[];
  scopeLabel: string;
  region: PaymentRegion;
  paymentMethod: PaymentMethodType;
  paymentMethodLabel: string;
  transferMemo?: string;
  schoolName?: string;
  schoolProvince?: string;
}): Promise<{
  order: PaymentOrderRecord;
  pass: IssuedPassRecord;
  subscription: UserSubscriptionRecord;
  emailResult: EmailSendResult;
}> {
  const nowIso = new Date().toISOString();
  const pricing = PLAN_PRICING[params.planTier];
  const amountDisplay = params.region === 'intl_usd' ? pricing.usdLabel : pricing.vndLabel;
  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  const schoolCode =
    params.planTier === 'school' ? generateSchoolActivationCode() : undefined;
  const planName = getPlanDisplayName(params.planTier);

  const purchasedRouteIds = (params.routeIds || []).filter(Boolean);
  const purchasedSiteIds = expandUnlockedSitesFromRoutes(
    (params.siteIds || []).filter(Boolean),
    purchasedRouteIds
  );

  // 1. Save Order to /orders/{orderId}
  const order: PaymentOrderRecord = {
    orderId,
    uid: params.uid,
    email: params.email.toLowerCase().trim(),
    customerName: params.displayName,
    planTier: params.planTier,
    planName,
    plusScopeType: params.plusScopeType,
    scopeLabel: params.scopeLabel,
    siteIds: purchasedSiteIds,
    routeIds: purchasedRouteIds,
    region: params.region,
    paymentMethod: params.paymentMethod,
    paymentMethodLabel: params.paymentMethodLabel,
    amountVnd: pricing.vnd,
    amountUsd: pricing.usd,
    amountDisplay,
    transferMemo: params.transferMemo,
    schoolName: params.schoolName,
    schoolCode,
    emailSent: false,
    status: 'completed',
    createdAt: nowIso,
  };
  await recordPaymentOrder(order);

  // 2. Update /users/{uid}/subscriptions
  const prevSub = loadLocalUserSubscription(params.uid, params.email);
  const nextRouteIds = Array.from(new Set([...prevSub.unlockedRouteIds, ...purchasedRouteIds]));
  const nextSiteIds = expandUnlockedSitesFromRoutes(
    [...prevSub.unlockedSiteIds, ...purchasedSiteIds],
    nextRouteIds
  );
  const hasSchool = prevSub.hasSchoolPackage || params.planTier === 'school';
  const tierRank: Record<SubscriptionPlanLevel, number> = {
    basic: 0,
    plus: 1,
    pro: 2,
    school: 3,
  };
  let nextTier: SubscriptionPlanLevel =
    tierRank[params.planTier] > tierRank[prevSub.tier] ? params.planTier : prevSub.tier;
  if (hasSchool) nextTier = 'school';

  const updatedSub: UserSubscriptionRecord = {
    uid: params.uid,
    email: params.email.toLowerCase().trim(),
    tier: nextTier,
    unlockedSiteIds: nextSiteIds,
    unlockedRouteIds: nextRouteIds,
    hasSchoolPackage: hasSchool,
    schoolName: params.schoolName || prevSub.schoolName,
    schoolCode: schoolCode || prevSub.schoolCode,
    activeOrderIds: [orderId, ...prevSub.activeOrderIds.filter((id) => id !== orderId)],
    updatedAt: nowIso,
  };
  await saveUserSubscription(updatedSub);

  // 3. Synchronize with legacy adminPlatformStore & issue QR ticket into /users/{uid}/tickets
  const passKind: IssuedPassRecord['kind'] =
    params.planTier === 'school'
      ? 'b2b_school'
      : params.planTier === 'pro'
      ? 'vip_ticket'
      : 'route_ticket';

  const passRouteId =
    params.planTier === 'plus'
      ? purchasedRouteIds[0] || (purchasedSiteIds[0] ? `site:${purchasedSiteIds[0]}` : undefined)
      : params.planTier === 'pro'
      ? 'all-17'
      : 'school-edtech';

  const passCode =
    schoolCode ||
    `DAV-${params.planTier.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const pass = recordIssuedPass({
    code: passCode,
    kind: passKind,
    ownerUserId: params.userId || params.uid,
    ownerEmail: params.email,
    ownerName: params.displayName,
    ownerContactMasked: params.email,
    provider: params.provider || 'google',
    routeId: passRouteId,
    routeTitle: params.scopeLabel,
    label:
      params.planTier === 'school'
        ? `Gói Học Liệu Trường Học · ${params.schoolName || params.scopeLabel}`
        : params.planTier === 'pro'
        ? `Vé Pro Toàn Diện 17 Di tích (${params.paymentMethodLabel})`
        : `Vé Plus · ${params.scopeLabel} (${params.paymentMethodLabel})`,
    amountLabel: amountDisplay,
    status: 'active',
  });

  if (params.planTier === 'school') {
    activateUserSchoolPackage({
      userId: params.userId || params.uid,
      userEmail: params.email,
      schoolName: params.schoolName,
      province: params.schoolProvince,
    });
    setUserSubscriptionTier(params.userId || params.uid, params.email, 'vip_49k');
  } else if (params.planTier === 'pro') {
    setUserSubscriptionTier(params.userId || params.uid, params.email, 'vip_49k');
  } else {
    const curLegacy = getUserSubscriptionTier(params.userId || params.uid, params.email);
    if (curLegacy === 'free') {
      setUserSubscriptionTier(params.userId || params.uid, params.email, 'route_19k');
    }
  }

  // 4. Auto-send Thank-You Gmail via EmailJS if Admin toggle is enabled in /settings/emailConfig
  const cleanRecipientEmail = params.email.trim();
  const emailScope =
    params.planTier === 'pro' || params.planTier === 'school'
      ? 'Toàn bộ 17 di tích'
      : params.scopeLabel;
  const emailResult = await sendOrderThankYouEmail(
    {
      toEmail: cleanRecipientEmail,
      customerName: params.displayName || 'Quý khách',
      planName,
      scope: emailScope,
      orderCode: orderId,
      amount: amountDisplay,
    },
    { requireEnabled: true }
  );

  if (emailResult.ok) {
    order.emailSent = true;
    order.emailSentAt = new Date().toISOString();
    await updatePaymentOrderEmailStatus(orderId, true);
  }

  // 5. Push confirmation message into Chatbot "Sử Quan Dấu Ấn" + unread dot indicator
  pushSuQuanPurchaseNotice({
    orderId,
    orderCode: orderId,
    userId: params.userId || params.uid,
    toEmail: cleanRecipientEmail,
    customerName: params.displayName || 'Quý khách',
    planName,
    scope: emailScope,
    amount: amountDisplay,
    emailSent: emailResult.ok,
    createdAt: nowIso,
  });

  emitWindowEvent(SUBSCRIPTION_GATING_UPDATED_EVENT);
  return { order, pass, subscription: updatedSub, emailResult };
}

// ============================================================================
// 6. PERMISSION MATRIX EVALUATOR (4 LEVELS + ADMIN PREVIEW)
// ============================================================================
export function evaluateSitePermissions(params: {
  isAdmin: boolean;
  isTesterPro?: boolean;
  subscription: UserSubscriptionRecord;
  previewRole: AdminPreviewRole;
  siteId?: string;
}): SitePermissionEvaluation {
  const { isAdmin, isTesterPro, subscription, previewRole, siteId } = params;
  const isPreviewingNonAdmin = isAdmin && previewRole !== 'admin';

  // Determine effective role
  let effectiveRole: AdminPreviewRole = 'basic';
  if (isAdmin) {
    effectiveRole = previewRole;
  } else if (isTesterPro) {
    effectiveRole = 'tester';
  } else if (subscription.hasSchoolPackage || subscription.tier === 'school') {
    effectiveRole = 'school';
  } else if (subscription.tier === 'pro') {
    effectiveRole = 'pro';
  } else if (subscription.tier === 'plus') {
    effectiveRole = 'plus';
  } else {
    effectiveRole = 'basic';
  }

  // Effective unlocked sites/routes for Plus
  let unlockedSiteIds = subscription.unlockedSiteIds;
  let unlockedRouteIds = subscription.unlockedRouteIds;
  if (
    isPreviewingNonAdmin &&
    effectiveRole === 'plus' &&
    (unlockedSiteIds.length === 0 || unlockedSiteIds.length >= DEFAULT_HERITAGE_SITES.length)
  ) {
    unlockedRouteIds = [ADMIN_PREVIEW_PLUS_DEFAULT_ROUTE_ID];
    unlockedSiteIds = [...ADMIN_PREVIEW_PLUS_DEFAULT_SITE_IDS];
  }

  if (effectiveRole === 'admin') {
    return {
      effectiveRole: 'admin',
      isActualAdmin: isAdmin,
      isPreviewingNonAdmin: false,
      canViewDossiersAndMap: true,
      canUse3DOriginal: true,
      canUse3DAdvanced: true,
      canUseAudioGuide: true,
      canUseAdvancedAi: true,
      canUseGemini35Flash: true,
      canUseGemini4Hydrogen: true,
      canSeeGemini4Argon: true,
      canUseGemini4Argon: true,
      basicAiDailyLimit: 5,
      canUseJourneyStampAndCert: true,
      canUseSchoolEdTech: true,
      isPlusScopeLockedForSite: false,
      unlockedSiteIds: DEFAULT_HERITAGE_SITES.map((s) => s.id),
      unlockedRouteIds: TOUR_ROUTES.map((r) => r.id),
      recommendedUpgradePlan: 'pro',
    };
  }

  if (effectiveRole === 'tester') {
    return {
      effectiveRole: 'tester',
      isActualAdmin: isAdmin,
      isPreviewingNonAdmin,
      canViewDossiersAndMap: true,
      canUse3DOriginal: true,
      canUse3DAdvanced: true,
      canUseAudioGuide: true,
      canUseAdvancedAi: true,
      canUseGemini35Flash: true,
      canUseGemini4Hydrogen: true,
      canSeeGemini4Argon: true,
      canUseGemini4Argon: false,
      basicAiDailyLimit: 5,
      canUseJourneyStampAndCert: true,
      canUseSchoolEdTech: true,
      isPlusScopeLockedForSite: false,
      unlockedSiteIds: DEFAULT_HERITAGE_SITES.map((s) => s.id),
      unlockedRouteIds: TOUR_ROUTES.map((r) => r.id),
      recommendedUpgradePlan: 'pro',
    };
  }

  if (effectiveRole === 'school') {
    return {
      effectiveRole: 'school',
      isActualAdmin: isAdmin,
      isPreviewingNonAdmin,
      canViewDossiersAndMap: true,
      canUse3DOriginal: true,
      canUse3DAdvanced: true,
      canUseAudioGuide: true,
      canUseAdvancedAi: true,
      canUseGemini35Flash: true,
      canUseGemini4Hydrogen: true,
      canSeeGemini4Argon: false,
      canUseGemini4Argon: false,
      basicAiDailyLimit: 5,
      canUseJourneyStampAndCert: true,
      canUseSchoolEdTech: true,
      isPlusScopeLockedForSite: false,
      unlockedSiteIds: DEFAULT_HERITAGE_SITES.map((s) => s.id),
      unlockedRouteIds: TOUR_ROUTES.map((r) => r.id),
      recommendedUpgradePlan: 'school',
    };
  }

  if (effectiveRole === 'pro') {
    return {
      effectiveRole: 'pro',
      isActualAdmin: isAdmin,
      isPreviewingNonAdmin,
      canViewDossiersAndMap: true,
      canUse3DOriginal: true,
      canUse3DAdvanced: true,
      canUseAudioGuide: true,
      canUseAdvancedAi: true,
      canUseGemini35Flash: true,
      canUseGemini4Hydrogen: true,
      canSeeGemini4Argon: false,
      canUseGemini4Argon: false,
      basicAiDailyLimit: 5,
      canUseJourneyStampAndCert: true,
      canUseSchoolEdTech: false,
      isPlusScopeLockedForSite: false,
      unlockedSiteIds: DEFAULT_HERITAGE_SITES.map((s) => s.id),
      unlockedRouteIds: TOUR_ROUTES.map((r) => r.id),
      recommendedUpgradePlan: 'school',
    };
  }

  if (effectiveRole === 'plus') {
    // If siteId is provided, verify it is within purchased Plus sites/routes.
    // If siteId is omitted (global check), treat as unlocked if user has at least 1 Plus site.
    const siteUnlocked = siteId
      ? unlockedSiteIds.includes(siteId)
      : unlockedSiteIds.length > 0;
    return {
      effectiveRole: 'plus',
      isActualAdmin: isAdmin,
      isPreviewingNonAdmin,
      canViewDossiersAndMap: true,
      canUse3DOriginal: true,
      canUse3DAdvanced: siteUnlocked,
      canUseAudioGuide: siteUnlocked,
      canUseAdvancedAi: siteUnlocked,
      canUseGemini35Flash: siteUnlocked,
      canUseGemini4Hydrogen: false,
      canSeeGemini4Argon: false,
      canUseGemini4Argon: false,
      basicAiDailyLimit: 5,
      canUseJourneyStampAndCert: siteUnlocked,
      canUseSchoolEdTech: false,
      isPlusScopeLockedForSite: Boolean(siteId && !siteUnlocked),
      unlockedSiteIds,
      unlockedRouteIds,
      recommendedUpgradePlan: siteId && !siteUnlocked ? 'pro' : 'plus_or_pro',
    };
  }

  // Level 0: Basic (0đ) or Unauthenticated Guest preview
  return {
    effectiveRole: effectiveRole === 'guest' ? 'guest' : 'basic',
    isActualAdmin: isAdmin,
    isPreviewingNonAdmin,
    canViewDossiersAndMap: true,
    canUse3DOriginal: true,
    canUse3DAdvanced: false,
    canUseAudioGuide: false,
    canUseAdvancedAi: false,
    canUseGemini35Flash: false,
    canUseGemini4Hydrogen: false,
    canSeeGemini4Argon: false,
    canUseGemini4Argon: false,
    basicAiDailyLimit: 5,
    canUseJourneyStampAndCert: false,
    canUseSchoolEdTech: false,
    isPlusScopeLockedForSite: false,
    unlockedSiteIds: [],
    unlockedRouteIds: [],
    recommendedUpgradePlan: 'plus_or_pro',
  };
}

// ============================================================================
// 7. GLOBAL EVENT DISPATCHERS FOR UPGRADE MODAL & DIRECT CHECKOUT
// ============================================================================
export function openUpgradePrompt(detail: UpgradePromptDetail): void {
  emitWindowEvent<UpgradePromptDetail>(OPEN_UPGRADE_PROMPT_EVENT, detail);
}

let pendingCheckoutRequestAfterAuth: PlanCheckoutRequest | null = null;

export function setPendingCheckoutRequest(req: PlanCheckoutRequest | null): void {
  pendingCheckoutRequestAfterAuth = req;
}

export function consumePendingCheckoutRequest(): PlanCheckoutRequest | null {
  const req = pendingCheckoutRequestAfterAuth;
  pendingCheckoutRequestAfterAuth = null;
  return req;
}

export function openPlanCheckoutModal(detail: PlanCheckoutRequest): void {
  emitWindowEvent<PlanCheckoutRequest>(OPEN_PLAN_CHECKOUT_EVENT, detail);
}

export function navigateToPricingPlan(detail: PlanCheckoutRequest): void {
  emitWindowEvent<PlanCheckoutRequest>(NAVIGATE_TO_PRICING_PLAN_EVENT, detail);
}

// ============================================================================
// 8. REACT HOOK: useSubscriptionPermissions(siteId?)
// ============================================================================
export function useSubscriptionPermissions(siteId?: string): {
  permissions: SitePermissionEvaluation;
  subscription: UserSubscriptionRecord;
  previewRole: AdminPreviewRole;
  setPreviewRole: (role: AdminPreviewRole) => void;
  refreshSubscription: () => void;
} {
  const { user, isAdmin, isTesterPro } = useAuth();
  const [previewRole, setPreviewRole] = useAdminPreviewRole();
  const [revision, setRevision] = useState(0);

  const uid = user?.firebaseUid || user?.userId;
  const email = user?.email;

  useEffect(() => {
    const bump = () => setRevision((r) => r + 1);
    window.addEventListener(SUBSCRIPTION_GATING_UPDATED_EVENT, bump);
    window.addEventListener(PASSES_UPDATED_EVENT, bump);
    window.addEventListener(SUBSCRIPTION_TIER_UPDATED_EVENT, bump);
    window.addEventListener(ADMIN_PREVIEW_ROLE_UPDATED_EVENT, bump);
    return () => {
      window.removeEventListener(SUBSCRIPTION_GATING_UPDATED_EVENT, bump);
      window.removeEventListener(PASSES_UPDATED_EVENT, bump);
      window.removeEventListener(SUBSCRIPTION_TIER_UPDATED_EVENT, bump);
      window.removeEventListener(ADMIN_PREVIEW_ROLE_UPDATED_EVENT, bump);
    };
  }, []);

  // Hydrate subscription from Firebase RTDB when signed-in user changes
  useEffect(() => {
    if (!uid && !email) return;
    void pullUserSubscriptionFromFirebase(uid, email);
  }, [uid, email]);

  const subscription = useMemo(
    () => loadLocalUserSubscription(uid, email),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, email, revision]
  );

  const permissions = useMemo(
    () =>
      evaluateSitePermissions({
        isAdmin,
        isTesterPro,
        subscription,
        previewRole,
        siteId,
      }),
    [isAdmin, isTesterPro, subscription, previewRole, siteId]
  );

  return {
    permissions,
    subscription,
    previewRole,
    setPreviewRole,
    refreshSubscription: () => setRevision((r) => r + 1),
  };
}

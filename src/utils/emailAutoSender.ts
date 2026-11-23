/**
 * EmailJS Automated Thank-You Gmail Service & Sử Quan Dấu Ấn Purchase Notification Bus
 * - Stores Admin EmailJS config in Firebase Realtime Database at `/settings/emailConfig.json`
 * - Sends transactional thank-you emails via pure fetch POST to https://api.emailjs.com/api/v1.0/email/send
 * - Broadcasts purchase confirmation messages to Chatbot "Sử Quan Dấu Ấn" with unread dot state
 */

import { FIREBASE_DB_URL, isFirebaseDbConfigured } from './firebaseRestSync';
import { syncGlobalEmailConfigToCloud } from './realtimeCloudSync';

export const DEFAULT_EMAILJS_SERVICE_ID = 'service_h3htk56';
export const EMAILJS_SEND_ENDPOINT = 'https://api.emailjs.com/api/v1.0/email/send';

export const EMAIL_CONFIG_STORAGE_KEY = 'dau_an_viet_emailjs_config_v1';
export const EMAIL_CONFIG_UPDATED_EVENT = 'dau-an-viet-emailjs-config-updated';

export const SU_QUAN_PURCHASE_NOTICES_STORAGE_KEY = 'dau_an_viet_suquan_purchase_notices_v1';
export const SU_QUAN_PURCHASE_NOTICE_EVENT = 'dau-an-viet-suquan-purchase-notice';
export const SU_QUAN_NOTICE_READ_EVENT = 'dau-an-viet-suquan-notice-read';

export interface EmailJsConfig {
  enabled: boolean;
  serviceId: string;
  templateId: string;
  publicKey: string;
  updatedAt: string;
}

export interface EmailThankYouPayload {
  toEmail: string;
  customerName?: string;
  planName: string;
  scope: string;
  orderCode: string;
  amount: string;
}

export interface EmailSendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

export interface SuQuanPurchaseNotice {
  id: string;
  orderId: string;
  orderCode: string;
  userId?: string;
  toEmail: string;
  customerName: string;
  planName: string;
  scope: string;
  amount: string;
  emailSent: boolean;
  createdAt: string;
  read: boolean;
}

const DEFAULT_EMAIL_CONFIG: EmailJsConfig = {
  enabled: false,
  serviceId: DEFAULT_EMAILJS_SERVICE_ID,
  templateId: '',
  publicKey: '',
  updatedAt: '',
};

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
    // ignore storage quota errors
  }
}

export function normalizeEmailJsConfig(
  raw?: Partial<EmailJsConfig> | null
): EmailJsConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_EMAIL_CONFIG };
  }
  return {
    enabled: Boolean(raw.enabled),
    serviceId:
      typeof raw.serviceId === 'string' && raw.serviceId.trim()
        ? raw.serviceId.trim()
        : DEFAULT_EMAILJS_SERVICE_ID,
    templateId: typeof raw.templateId === 'string' ? raw.templateId.trim() : '',
    publicKey: typeof raw.publicKey === 'string' ? raw.publicKey.trim() : '',
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
}

export function loadEmailJsConfig(): EmailJsConfig {
  const stored = readLocalJson<Partial<EmailJsConfig> | null>(EMAIL_CONFIG_STORAGE_KEY, null);
  return normalizeEmailJsConfig(stored);
}

export async function pullEmailJsConfigFromFirebase(): Promise<EmailJsConfig> {
  const local = loadEmailJsConfig();
  if (!isFirebaseDbConfigured() || typeof fetch !== 'function') {
    return local;
  }
  try {
    const res = await fetch(`${FIREBASE_DB_URL}/settings/emailConfig.json`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) return local;
    const remote = (await res.json()) as Partial<EmailJsConfig> | null;
    if (!remote || typeof remote !== 'object') {
      return local;
    }
    const normalized = normalizeEmailJsConfig({
      ...local,
      ...remote,
      serviceId:
        typeof remote.serviceId === 'string' && remote.serviceId.trim()
          ? remote.serviceId.trim()
          : local.serviceId || DEFAULT_EMAILJS_SERVICE_ID,
    });
    writeLocalJson(EMAIL_CONFIG_STORAGE_KEY, normalized);
    emitWindowEvent(EMAIL_CONFIG_UPDATED_EVENT, normalized);
    return normalized;
  } catch {
    return local;
  }
}

export async function saveEmailJsConfig(
  partial: Partial<EmailJsConfig>
): Promise<{ ok: boolean; syncedFirebase: boolean; config: EmailJsConfig }> {
  const current = loadEmailJsConfig();
  const next: EmailJsConfig = {
    enabled: typeof partial.enabled === 'boolean' ? partial.enabled : current.enabled,
    serviceId:
      typeof partial.serviceId === 'string'
        ? partial.serviceId.trim() || DEFAULT_EMAILJS_SERVICE_ID
        : current.serviceId || DEFAULT_EMAILJS_SERVICE_ID,
    templateId:
      typeof partial.templateId === 'string' ? partial.templateId.trim() : current.templateId,
    publicKey:
      typeof partial.publicKey === 'string' ? partial.publicKey.trim() : current.publicKey,
    updatedAt: new Date().toISOString(),
  };

  writeLocalJson(EMAIL_CONFIG_STORAGE_KEY, next);
  emitWindowEvent(EMAIL_CONFIG_UPDATED_EVENT, next);
  syncGlobalEmailConfigToCloud(next as unknown as Record<string, unknown>);

  let syncedFirebase = false;
  if (isFirebaseDbConfigured() && typeof fetch === 'function') {
    try {
      const res = await fetch(`${FIREBASE_DB_URL}/settings/emailConfig.json`, {
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

export function applyRemoteEmailJsConfigSnapshot(
  remote: Partial<EmailJsConfig> | Record<string, unknown> | null | undefined
): EmailJsConfig | null {
  if (!remote || typeof remote !== 'object') return null;
  const local = loadEmailJsConfig();
  const r = remote as Partial<EmailJsConfig> & { updatedAt?: string | number };
  const normalized = normalizeEmailJsConfig({
    ...local,
    ...r,
    serviceId:
      typeof r.serviceId === 'string' && r.serviceId.trim()
        ? r.serviceId.trim()
        : local.serviceId || DEFAULT_EMAILJS_SERVICE_ID,
    updatedAt:
      typeof r.updatedAt === 'string'
        ? r.updatedAt
        : typeof r.updatedAt === 'number'
        ? new Date(r.updatedAt).toISOString()
        : local.updatedAt,
  });
  writeLocalJson(EMAIL_CONFIG_STORAGE_KEY, normalized);
  emitWindowEvent(EMAIL_CONFIG_UPDATED_EVENT, normalized);
  return normalized;
}

export async function sendEmailViaEmailJs(
  config: Pick<EmailJsConfig, 'serviceId' | 'templateId' | 'publicKey'>,
  payload: EmailThankYouPayload
): Promise<EmailSendResult> {
  const serviceId = config.serviceId.trim();
  const templateId = config.templateId.trim();
  const publicKey = config.publicKey.trim();
  const toEmail = payload.toEmail.trim();

  if (!serviceId || !templateId || !publicKey) {
    return {
      ok: false,
      skipped: true,
      error: 'Thiếu thông số EmailJS (Service ID, Template ID hoặc Public Key).',
    };
  }

  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return {
      ok: false,
      skipped: true,
      error: 'Địa chỉ Gmail nhận thư chưa hợp lệ.',
    };
  }

  if (typeof fetch !== 'function') {
    return {
      ok: false,
      error: 'Môi trường hiện tại không hỗ trợ gửi yêu cầu mạng.',
    };
  }

  try {
    const res = await fetch(EMAILJS_SEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_email: toEmail,
          customer_name: payload.customerName?.trim() || 'Quý khách',
          plan_name: payload.planName,
          scope: payload.scope,
          order_code: payload.orderCode,
          amount: payload.amount,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return {
        ok: false,
        error: detail
          ? `EmailJS từ chối gửi thư (${res.status}): ${detail}`
          : `EmailJS trả về lỗi HTTP ${res.status}. Kiểm tra lại Service ID, Template ID và Public Key.`,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Không thể kết nối EmailJS API: ${err.message}`
          : 'Không thể kết nối EmailJS API. Vui lòng kiểm tra kết nối mạng.',
    };
  }
}

export async function sendOrderThankYouEmail(
  payload: EmailThankYouPayload,
  options?: { requireEnabled?: boolean }
): Promise<EmailSendResult> {
  const requireEnabled = options?.requireEnabled ?? true;
  const config = await pullEmailJsConfigFromFirebase();

  if (requireEnabled && !config.enabled) {
    return {
      ok: false,
      skipped: true,
      error: 'Chức năng tự động gửi thư cảm ơn Gmail đang tắt trong Admin Studio.',
    };
  }

  if (!config.serviceId || !config.templateId || !config.publicKey) {
    return {
      ok: false,
      skipped: true,
      error:
        'Chưa cấu hình đầy đủ Service ID, Template ID hoặc Public Key EmailJS trong Admin Studio.',
    };
  }

  return sendEmailViaEmailJs(config, payload);
}

// ============================================================================
// SỬ QUAN DẤU ẤN — PURCHASE CONFIRMATION NOTIFICATION STORE
// ============================================================================
export function loadSuQuanPurchaseNotices(
  email?: string,
  userId?: string
): SuQuanPurchaseNotice[] {
  const all = readLocalJson<SuQuanPurchaseNotice[]>(SU_QUAN_PURCHASE_NOTICES_STORAGE_KEY, []);
  if (!Array.isArray(all)) return [];
  const normEmail = (email || '').toLowerCase().trim();
  return all
    .filter((item) => {
      if (!item || typeof item !== 'object') return false;
      if (!normEmail && !userId) return true;
      const itemEmail = (item.toEmail || '').toLowerCase().trim();
      if (userId && item.userId && item.userId === userId) return true;
      if (normEmail && itemEmail && itemEmail === normEmail) return true;
      return !item.userId;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function pushSuQuanPurchaseNotice(
  notice: Omit<SuQuanPurchaseNotice, 'id' | 'read' | 'createdAt'> & {
    createdAt?: string;
  }
): SuQuanPurchaseNotice {
  const current = readLocalJson<SuQuanPurchaseNotice[]>(SU_QUAN_PURCHASE_NOTICES_STORAGE_KEY, []);
  const created: SuQuanPurchaseNotice = {
    ...notice,
    id: `sq_order_${notice.orderId}_${Date.now()}`,
    createdAt: notice.createdAt || new Date().toISOString(),
    read: false,
  };
  const deduped = [created, ...current.filter((item) => item.orderId !== notice.orderId)].slice(
    0,
    20
  );
  writeLocalJson(SU_QUAN_PURCHASE_NOTICES_STORAGE_KEY, deduped);
  emitWindowEvent(SU_QUAN_PURCHASE_NOTICE_EVENT, created);
  return created;
}

export function updateSuQuanNoticeEmailSent(orderId: string, emailSent: boolean): void {
  const current = readLocalJson<SuQuanPurchaseNotice[]>(SU_QUAN_PURCHASE_NOTICES_STORAGE_KEY, []);
  if (!Array.isArray(current) || current.length === 0) return;
  let changed = false;
  const next = current.map((item) => {
    if (item.orderId !== orderId) return item;
    changed = true;
    return { ...item, emailSent };
  });
  if (changed) {
    writeLocalJson(SU_QUAN_PURCHASE_NOTICES_STORAGE_KEY, next);
    emitWindowEvent(SU_QUAN_PURCHASE_NOTICE_EVENT);
  }
}

export function hasUnreadSuQuanPurchaseNotice(email?: string, userId?: string): boolean {
  return loadSuQuanPurchaseNotices(email, userId).some((item) => !item.read);
}

export function markSuQuanPurchaseNoticesRead(): void {
  const current = readLocalJson<SuQuanPurchaseNotice[]>(SU_QUAN_PURCHASE_NOTICES_STORAGE_KEY, []);
  if (!Array.isArray(current) || current.length === 0) return;
  let changed = false;
  const next = current.map((item) => {
    if (item.read) return item;
    changed = true;
    return { ...item, read: true };
  });
  if (changed) {
    writeLocalJson(SU_QUAN_PURCHASE_NOTICES_STORAGE_KEY, next);
    emitWindowEvent(SU_QUAN_NOTICE_READ_EVENT);
  }
}

export function formatSuQuanThankYouMessage(notice: {
  planName: string;
  orderCode: string;
  toEmail: string;
}): string {
  return `Sử Quan xin trân trọng cảm ơn quý khách đã đồng hành cùng Dấu Ấn Việt 3D! Gói ${notice.planName} đã được kích hoạt và thư tri ân kèm mã vé điện tử ${notice.orderCode} đã được gửi tới Gmail ${notice.toEmail}.`;
}

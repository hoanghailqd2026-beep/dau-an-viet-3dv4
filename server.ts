import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '5mb' }));
app.use(express.text({ type: 'text/*', limit: '5mb' }));

import { HERITAGE_SITES } from './src/data/heritageSites.ts';

// ============================================================================
// CENTRALIZED MULTI-DEVICE SYNC STORAGE (.data/dau-an-viet-sync-state.json)
// ============================================================================
interface VisitHistoryLogEntryServer {
  id: string;
  timestamp: string;
  action: 'visit' | 'open_3d' | 'open_dossier';
  actionLabel: string;
  siteId?: string;
  siteName?: string;
  deviceType: 'Máy tính' | 'Điện thoại';
  visitorLabel?: string;
}

interface ServerAnalyticsState {
  totalVisitors: number;
  interactions3D: number;
  audioPlays: number;
  routesCompleted: number;
  siteViews: Record<string, number>;
  techUsage: {
    explodedXray: number;
    map1815: number;
    flycamVideo: number;
    audioAi: number;
  };
  lastUpdatedAt: string;
}

interface ServerSyncState {
  version: number;
  updatedAt: string;
  adminPasswordHash: string;
  adminPasswordUpdatedAt: string;
  secondaryAdminEmails: string[];
  secondaryAdminEmailsUpdatedAt: string;
  testerAllowlistEmails: string[];
  testerAllowlistUpdatedAt: string;
  userCredentials: Record<string, Record<string, unknown>>;
  users: Array<Record<string, unknown>>;
  visitors: Array<Record<string, unknown>>;
  lockedAccounts: Record<string, Record<string, unknown>>;
  lockedAccountsUpdatedAt?: string;
  issuedPasses: Array<Record<string, unknown>>;
  userEdTechStates: Record<string, Record<string, unknown>>;
  passportStamps: Record<string, Record<string, Record<string, unknown>>>;
  supportTickets: Array<Record<string, unknown>>;
  visitorReviews: Array<Record<string, unknown>>;
  hiddenHeritageIds: string[];
  hiddenHeritageUpdatedAt: string;
  cmsOverrides: Record<string, Record<string, unknown>>;
  cmsDeletedSiteIds: Record<string, string>;
  siteTranslationsOverride: Record<string, Record<string, unknown>>;
  quizDrafts: Record<string, unknown[]>;
  publishedQuizzes: Record<string, Record<string, unknown>>;
  audioOverrides: Record<string, Record<string, unknown>>;
  customSitePhotos: Record<string, unknown>;
  customSitePhotosUpdatedAt: string;
  photoCaptionOverrides: Record<string, unknown>;
  customGlbUrls: Record<string, string>;
  accountsDb: Array<Record<string, unknown>>;
  subscriptionTiers: Record<string, unknown>;
  schoolPackages: Record<string, unknown>;
  siteSettings: Record<string, unknown> | null;
  siteSettingsUpdatedAt: string;
  emergencyLockdown: Record<string, unknown> | null;
  emergencyLockdownUpdatedAt: string;
  auditLogs: Array<Record<string, unknown>>;
  securityAlerts: Array<Record<string, unknown>>;
  aiOutbox: Array<Record<string, unknown>>;
  aiShield: Record<string, unknown> | null;
  aiAutopilotEnabled: boolean | null;
  hydrogenCores: Record<string, unknown> | null;
  hydrogenBriefing: Record<string, unknown> | null;
  hydrogenCmdLogs: Array<Record<string, unknown>>;
  totalVisits: number;
  siteVisits: Record<string, number>;
  analytics: ServerAnalyticsState;
  visitHistoryLogs: VisitHistoryLogEntryServer[];
}

const SYNC_DATA_DIR = path.resolve(__dirname, '.data');
const SYNC_DATA_FILE = path.join(SYNC_DATA_DIR, 'dau-an-viet-sync-state.json');

function buildDefaultServerSyncState(): ServerSyncState {
  const nowIso = new Date().toISOString();
  const siteVisits: Record<string, number> = {};
  HERITAGE_SITES.forEach((site, idx) => {
    siteVisits[site.id] = Math.max(12, 68 - idx * 3);
  });
  return {
    version: 1,
    updatedAt: nowIso,
    adminPasswordHash: '',
    adminPasswordUpdatedAt: '',
    secondaryAdminEmails: [],
    secondaryAdminEmailsUpdatedAt: '',
    testerAllowlistEmails: [],
    testerAllowlistUpdatedAt: '',
    userCredentials: {},
    users: [],
    visitors: [],
    lockedAccounts: {},
    lockedAccountsUpdatedAt: '',
    issuedPasses: [],
    userEdTechStates: {},
    passportStamps: {},
    supportTickets: [],
    visitorReviews: [],
    hiddenHeritageIds: [],
    hiddenHeritageUpdatedAt: '',
    cmsOverrides: {},
    cmsDeletedSiteIds: {},
    siteTranslationsOverride: {},
    quizDrafts: {},
    publishedQuizzes: {},
    audioOverrides: {},
    customSitePhotos: {},
    customSitePhotosUpdatedAt: '',
    photoCaptionOverrides: {},
    customGlbUrls: {},
    accountsDb: [],
    subscriptionTiers: {},
    schoolPackages: {},
    siteSettings: null,
    siteSettingsUpdatedAt: '',
    emergencyLockdown: null,
    emergencyLockdownUpdatedAt: '',
    auditLogs: [],
    securityAlerts: [],
    aiOutbox: [],
    aiShield: null,
    aiAutopilotEnabled: null,
    hydrogenCores: null,
    hydrogenBriefing: null,
    hydrogenCmdLogs: [],
    totalVisits: 342,
    siteVisits,
    analytics: {
      totalVisitors: 342,
      interactions3D: 518,
      audioPlays: 274,
      routesCompleted: 86,
      siteViews: { ...siteVisits },
      techUsage: {
        explodedXray: 214,
        map1815: 168,
        flycamVideo: 145,
        audioAi: 274,
      },
      lastUpdatedAt: nowIso,
    },
    visitHistoryLogs: [],
  };
}

let inMemorySyncState: ServerSyncState | null = null;

function normalizeServerSyncState(raw: Partial<ServerSyncState> | null | undefined): ServerSyncState {
  const base = buildDefaultServerSyncState();
  if (!raw || typeof raw !== 'object') return base;

  const mergedSiteVisits: Record<string, number> = { ...base.siteVisits };
  if (raw.siteVisits && typeof raw.siteVisits === 'object') {
    Object.entries(raw.siteVisits).forEach(([k, v]) => {
      if (typeof v === 'number' && Number.isFinite(v)) {
        mergedSiteVisits[k] = Math.max(mergedSiteVisits[k] || 0, v);
      }
    });
  }
  if (raw.analytics?.siteViews && typeof raw.analytics.siteViews === 'object') {
    Object.entries(raw.analytics.siteViews).forEach(([k, v]) => {
      if (typeof v === 'number' && Number.isFinite(v)) {
        mergedSiteVisits[k] = Math.max(mergedSiteVisits[k] || 0, v);
      }
    });
  }

  const totalVisits = Math.max(
    base.totalVisits,
    typeof raw.totalVisits === 'number' ? raw.totalVisits : 0,
    typeof raw.analytics?.totalVisitors === 'number' ? raw.analytics.totalVisitors : 0
  );

  const tech = raw.analytics?.techUsage;
  return {
    ...base,
    ...raw,
    adminPasswordHash: typeof raw.adminPasswordHash === 'string' ? raw.adminPasswordHash : '',
    adminPasswordUpdatedAt:
      typeof raw.adminPasswordUpdatedAt === 'string' ? raw.adminPasswordUpdatedAt : '',
    secondaryAdminEmails: Array.isArray(raw.secondaryAdminEmails)
      ? raw.secondaryAdminEmails.filter((x): x is string => typeof x === 'string')
      : [],
    secondaryAdminEmailsUpdatedAt:
      typeof raw.secondaryAdminEmailsUpdatedAt === 'string'
        ? raw.secondaryAdminEmailsUpdatedAt
        : '',
    testerAllowlistEmails: Array.isArray(raw.testerAllowlistEmails)
      ? raw.testerAllowlistEmails.filter((x): x is string => typeof x === 'string')
      : [],
    testerAllowlistUpdatedAt:
      typeof raw.testerAllowlistUpdatedAt === 'string'
        ? raw.testerAllowlistUpdatedAt
        : '',
    userCredentials:
      raw.userCredentials && typeof raw.userCredentials === 'object' ? raw.userCredentials : {},
    users: Array.isArray(raw.users) ? raw.users : [],
    visitors: Array.isArray(raw.visitors) ? raw.visitors : [],
    lockedAccounts:
      raw.lockedAccounts && typeof raw.lockedAccounts === 'object' ? raw.lockedAccounts : {},
    lockedAccountsUpdatedAt:
      typeof raw.lockedAccountsUpdatedAt === 'string' ? raw.lockedAccountsUpdatedAt : '',
    issuedPasses: Array.isArray(raw.issuedPasses) ? raw.issuedPasses : [],
    userEdTechStates:
      raw.userEdTechStates && typeof raw.userEdTechStates === 'object' ? raw.userEdTechStates : {},
    passportStamps:
      raw.passportStamps && typeof raw.passportStamps === 'object' ? raw.passportStamps : {},
    supportTickets: Array.isArray(raw.supportTickets) ? raw.supportTickets : [],
    visitorReviews: Array.isArray(raw.visitorReviews) ? raw.visitorReviews : [],
    hiddenHeritageIds: Array.isArray(raw.hiddenHeritageIds)
      ? raw.hiddenHeritageIds.filter((x): x is string => typeof x === 'string')
      : [],
    hiddenHeritageUpdatedAt:
      typeof raw.hiddenHeritageUpdatedAt === 'string' ? raw.hiddenHeritageUpdatedAt : '',
    cmsOverrides: raw.cmsOverrides && typeof raw.cmsOverrides === 'object' ? raw.cmsOverrides : {},
    cmsDeletedSiteIds:
      raw.cmsDeletedSiteIds && typeof raw.cmsDeletedSiteIds === 'object' ? raw.cmsDeletedSiteIds : {},
    siteTranslationsOverride:
      raw.siteTranslationsOverride && typeof raw.siteTranslationsOverride === 'object'
        ? raw.siteTranslationsOverride
        : {},
    quizDrafts: raw.quizDrafts && typeof raw.quizDrafts === 'object' ? raw.quizDrafts : {},
    publishedQuizzes:
      raw.publishedQuizzes && typeof raw.publishedQuizzes === 'object' ? raw.publishedQuizzes : {},
    audioOverrides:
      raw.audioOverrides && typeof raw.audioOverrides === 'object' ? raw.audioOverrides : {},
    customSitePhotos:
      raw.customSitePhotos && typeof raw.customSitePhotos === 'object' ? raw.customSitePhotos : {},
    customSitePhotosUpdatedAt:
      typeof raw.customSitePhotosUpdatedAt === 'string' ? raw.customSitePhotosUpdatedAt : '',
    photoCaptionOverrides:
      raw.photoCaptionOverrides && typeof raw.photoCaptionOverrides === 'object'
        ? raw.photoCaptionOverrides
        : {},
    customGlbUrls:
      raw.customGlbUrls && typeof raw.customGlbUrls === 'object'
        ? (raw.customGlbUrls as Record<string, string>)
        : {},
    accountsDb: Array.isArray(raw.accountsDb) ? raw.accountsDb : [],
    subscriptionTiers:
      raw.subscriptionTiers && typeof raw.subscriptionTiers === 'object'
        ? raw.subscriptionTiers
        : {},
    schoolPackages:
      raw.schoolPackages && typeof raw.schoolPackages === 'object' ? raw.schoolPackages : {},
    siteSettings: raw.siteSettings && typeof raw.siteSettings === 'object' ? raw.siteSettings : null,
    siteSettingsUpdatedAt:
      typeof raw.siteSettingsUpdatedAt === 'string' ? raw.siteSettingsUpdatedAt : '',
    emergencyLockdown:
      raw.emergencyLockdown && typeof raw.emergencyLockdown === 'object'
        ? raw.emergencyLockdown
        : null,
    emergencyLockdownUpdatedAt:
      typeof raw.emergencyLockdownUpdatedAt === 'string' ? raw.emergencyLockdownUpdatedAt : '',
    auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : [],
    securityAlerts: Array.isArray(raw.securityAlerts) ? raw.securityAlerts : [],
    aiOutbox: Array.isArray(raw.aiOutbox) ? raw.aiOutbox : [],
    aiShield: raw.aiShield && typeof raw.aiShield === 'object' ? raw.aiShield : null,
    aiAutopilotEnabled:
      typeof raw.aiAutopilotEnabled === 'boolean' ? raw.aiAutopilotEnabled : null,
    hydrogenCores:
      raw.hydrogenCores && typeof raw.hydrogenCores === 'object' ? raw.hydrogenCores : null,
    hydrogenBriefing:
      raw.hydrogenBriefing && typeof raw.hydrogenBriefing === 'object' ? raw.hydrogenBriefing : null,
    hydrogenCmdLogs: Array.isArray(raw.hydrogenCmdLogs) ? raw.hydrogenCmdLogs : [],
    totalVisits,
    siteVisits: mergedSiteVisits,
    analytics: {
      totalVisitors: totalVisits,
      interactions3D: Math.max(
        base.analytics.interactions3D,
        typeof raw.analytics?.interactions3D === 'number' ? raw.analytics.interactions3D : 0
      ),
      audioPlays: Math.max(
        base.analytics.audioPlays,
        typeof raw.analytics?.audioPlays === 'number' ? raw.analytics.audioPlays : 0
      ),
      routesCompleted: Math.max(
        base.analytics.routesCompleted,
        typeof raw.analytics?.routesCompleted === 'number' ? raw.analytics.routesCompleted : 0
      ),
      siteViews: mergedSiteVisits,
      techUsage: {
        explodedXray: Math.max(
          base.analytics.techUsage.explodedXray,
          typeof tech?.explodedXray === 'number' ? tech.explodedXray : 0
        ),
        map1815: Math.max(
          base.analytics.techUsage.map1815,
          typeof tech?.map1815 === 'number' ? tech.map1815 : 0
        ),
        flycamVideo: Math.max(
          base.analytics.techUsage.flycamVideo,
          typeof tech?.flycamVideo === 'number' ? tech.flycamVideo : 0
        ),
        audioAi: Math.max(
          base.analytics.techUsage.audioAi,
          typeof tech?.audioAi === 'number' ? tech.audioAi : 0
        ),
      },
      lastUpdatedAt:
        typeof raw.analytics?.lastUpdatedAt === 'string'
          ? raw.analytics.lastUpdatedAt
          : base.analytics.lastUpdatedAt,
    },
    visitHistoryLogs: Array.isArray(raw.visitHistoryLogs) ? raw.visitHistoryLogs : [],
  };
}

function readServerSyncState(): ServerSyncState {
  if (inMemorySyncState) {
    return inMemorySyncState;
  }
  try {
    if (!fs.existsSync(SYNC_DATA_DIR)) {
      fs.mkdirSync(SYNC_DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(SYNC_DATA_FILE)) {
      const content = fs.readFileSync(SYNC_DATA_FILE, 'utf-8');
      if (content.trim()) {
        inMemorySyncState = normalizeServerSyncState(JSON.parse(content));
        return inMemorySyncState;
      }
    }
  } catch (err) {
    console.warn('[SyncStore] Failed reading sync file, initializing defaults:', err);
  }
  const initial = buildDefaultServerSyncState();
  writeServerSyncState(initial);
  return initial;
}

function writeServerSyncState(nextState: ServerSyncState): void {
  nextState.updatedAt = new Date().toISOString();
  inMemorySyncState = nextState;
  try {
    if (!fs.existsSync(SYNC_DATA_DIR)) {
      fs.mkdirSync(SYNC_DATA_DIR, { recursive: true });
    }
    const tmpFile = `${SYNC_DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(nextState, null, 2), 'utf-8');
    fs.renameSync(tmpFile, SYNC_DATA_FILE);
  } catch (err) {
    try {
      fs.writeFileSync(SYNC_DATA_FILE, JSON.stringify(nextState, null, 2), 'utf-8');
    } catch {
      console.warn('[SyncStore] Unable to persist sync state to disk:', err);
    }
  }
}

function mergeArrayByKey<T extends Record<string, unknown>>(
  existing: T[],
  incoming: T[],
  keyField: string,
  sortField?: string,
  maxItems?: number
): T[] {
  const map = new Map<string, T>();
  existing.forEach((item) => {
    const key = typeof item?.[keyField] === 'string' ? (item[keyField] as string) : '';
    if (key) map.set(key, item);
  });
  incoming.forEach((item) => {
    const key = typeof item?.[keyField] === 'string' ? (item[keyField] as string) : '';
    if (!key) return;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, item);
      return;
    }
    const prevTime = String(prev.updatedAt || prev.lastLoginAt || prev.createdAt || prev.timestamp || '');
    const nextTime = String(item.updatedAt || item.lastLoginAt || item.createdAt || item.timestamp || '');
    if (!prevTime || nextTime >= prevTime) {
      map.set(key, { ...prev, ...item });
    } else {
      map.set(key, { ...item, ...prev });
    }
  });
  const result = Array.from(map.values());
  if (sortField) {
    result.sort((a, b) => String(b[sortField] || '').localeCompare(String(a[sortField] || '')));
  }
  return maxItems ? result.slice(0, maxItems) : result;
}

function mergeVisitorsList(
  existing: Array<Record<string, unknown>>,
  incoming: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  existing.forEach((v) => {
    if (typeof v?.userId === 'string') map.set(v.userId, v);
  });
  incoming.forEach((v) => {
    const uid = typeof v?.userId === 'string' ? v.userId : '';
    if (!uid) return;
    const prev = map.get(uid);
    if (!prev) {
      map.set(uid, v);
      return;
    }
    const prevSites = Array.isArray(prev.exploredSiteIds) ? (prev.exploredSiteIds as string[]) : [];
    const nextSites = Array.isArray(v.exploredSiteIds) ? (v.exploredSiteIds as string[]) : [];
    const prevRoutes = Array.isArray(prev.completedRouteIds) ? (prev.completedRouteIds as string[]) : [];
    const nextRoutes = Array.isArray(v.completedRouteIds) ? (v.completedRouteIds as string[]) : [];
    const prevLoginCount = typeof prev.loginCount === 'number' ? prev.loginCount : 1;
    const nextLoginCount = typeof v.loginCount === 'number' ? v.loginCount : 1;
    const prevLast = String(prev.lastLoginAt || '');
    const nextLast = String(v.lastLoginAt || '');
    const newer = nextLast >= prevLast ? v : prev;
    const older = nextLast >= prevLast ? prev : v;

    map.set(uid, {
      ...older,
      ...newer,
      loginCount: Math.max(prevLoginCount, nextLoginCount),
      exploredSiteIds: Array.from(new Set([...prevSites, ...nextSites])),
      completedRouteIds: Array.from(new Set([...prevRoutes, ...nextRoutes])),
    });
  });
  return Array.from(map.values()).sort((a, b) =>
    String(b.lastLoginAt || '').localeCompare(String(a.lastLoginAt || ''))
  );
}

function mergeSupportTicketsList(
  existing: Array<Record<string, unknown>>,
  incoming: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const map = new Map<string, Record<string, unknown>>();
  existing.forEach((t) => {
    if (typeof t?.id === 'string') map.set(t.id, t);
  });
  incoming.forEach((t) => {
    const id = typeof t?.id === 'string' ? t.id : '';
    if (!id) return;
    const prev = map.get(id);
    if (!prev) {
      map.set(id, t);
      return;
    }
    const prevMsgs = Array.isArray(prev.messages)
      ? (prev.messages as Array<Record<string, unknown>>)
      : [];
    const nextMsgs = Array.isArray(t.messages)
      ? (t.messages as Array<Record<string, unknown>>)
      : [];
    const mergedMsgsMap = new Map<string, Record<string, unknown>>();
    [...prevMsgs, ...nextMsgs].forEach((m) => {
      if (typeof m?.id === 'string') mergedMsgsMap.set(m.id, m);
    });
    const mergedMsgs = Array.from(mergedMsgsMap.values()).sort((a, b) =>
      String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    );

    const prevTime = String(prev.updatedAt || prev.createdAt || '');
    const nextTime = String(t.updatedAt || t.createdAt || '');
    const newer = nextTime >= prevTime ? t : prev;
    const older = nextTime >= prevTime ? prev : t;

    map.set(id, {
      ...older,
      ...newer,
      ownerEmail: newer.ownerEmail || older.ownerEmail,
      messages: mergedMsgs.length > 0 ? mergedMsgs : newer.messages || older.messages,
    });
  });
  return Array.from(map.values()).sort((a, b) =>
    String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || ''))
  );
}

function cleanDeviceLabel(raw: unknown): 'Máy tính' | 'Điện thoại' {
  return raw === 'Điện thoại' ? 'Điện thoại' : 'Máy tính';
}

app.get('/api/sync/state', (_req, res) => {
  const state = readServerSyncState();
  res.json({ ok: true, users: state.users || [], state });
});

app.post('/api/sync/state', (req, res) => {
  try {
    const rawBody = req.body;
    const body: Record<string, unknown> =
      typeof rawBody === 'string' && rawBody.trim()
        ? (JSON.parse(rawBody) as Record<string, unknown>)
        : rawBody && typeof rawBody === 'object'
        ? (rawBody as Record<string, unknown>)
        : {};
    const current = readServerSyncState();
    const nowIso = new Date().toISOString();
    const action = typeof body?.action === 'string' ? body.action : 'merge_state';

    if (action === 'sync_user' && body.user && typeof body.user === 'object') {
      const incomingUser = body.user as Record<string, unknown>;
      const providerRaw = incomingUser.provider === 'facebook' ? 'facebook' : 'google';
      const emailRaw =
        typeof incomingUser.email === 'string' ? incomingUser.email.toLowerCase().trim() : '';
      const identifierRaw = (
        typeof incomingUser.accountIdentifier === 'string' && incomingUser.accountIdentifier.trim()
          ? incomingUser.accountIdentifier
          : emailRaw ||
            (typeof incomingUser.displayName === 'string' ? incomingUser.displayName : '') ||
            (typeof incomingUser.name === 'string' ? incomingUser.name : '')
      )
        .toLowerCase()
        .trim();
      const uid =
        (typeof incomingUser.userId === 'string' && incomingUser.userId.trim()) ||
        (typeof incomingUser.id === 'string' && incomingUser.id.trim()) ||
        `u_${providerRaw.slice(0, 2)}_${identifierRaw || Date.now()}`;
      const displayName =
        (typeof incomingUser.displayName === 'string' && incomingUser.displayName.trim()) ||
        (typeof incomingUser.name === 'string' && incomingUser.name.trim()) ||
        emailRaw ||
        identifierRaw ||
        'Du khách';

      const normalizedUser: Record<string, unknown> = {
        ...incomingUser,
        id: uid,
        userId: uid,
        provider: providerRaw,
        email: emailRaw || identifierRaw,
        accountIdentifier: identifierRaw || emailRaw,
        name: displayName,
        displayName,
        updatedAt: nowIso,
      };

      const existingUsers = Array.isArray(current.users) ? current.users : [];
      const userMap = new Map<string, Record<string, unknown>>();
      existingUsers.forEach((u) => {
        const k =
          (typeof u?.userId === 'string' && u.userId) ||
          (typeof u?.id === 'string' && u.id) ||
          (typeof u?.email === 'string' && u.email.toLowerCase().trim()) ||
          '';
        if (k) userMap.set(k, u);
      });
      const prevUser =
        userMap.get(uid) ||
        (identifierRaw
          ? Array.from(userMap.values()).find(
              (u) =>
                String(u?.accountIdentifier || u?.email || '')
                  .toLowerCase()
                  .trim() === identifierRaw
            )
          : undefined);
      const mergedUser: Record<string, unknown> = prevUser
        ? {
            ...prevUser,
            ...normalizedUser,
            password: normalizedUser.password || prevUser.password,
            passwordHash: normalizedUser.passwordHash || prevUser.passwordHash,
            salt: normalizedUser.salt || prevUser.salt,
            tickets: Array.isArray(normalizedUser.tickets)
              ? normalizedUser.tickets
              : prevUser.tickets || [],
            issuedPasses: Array.isArray(normalizedUser.issuedPasses)
              ? normalizedUser.issuedPasses
              : prevUser.issuedPasses || [],
          }
        : normalizedUser;
      userMap.set(uid, mergedUser);

      const nextCreds = { ...current.userCredentials };
      if (identifierRaw && (mergedUser.passwordHash || mergedUser.password)) {
        const credKey = `${providerRaw}:${identifierRaw}`;
        nextCreds[credKey] = {
          userId: uid,
          provider: providerRaw,
          identifier: identifierRaw,
          email: emailRaw || identifierRaw,
          displayName,
          salt: typeof mergedUser.salt === 'string' ? mergedUser.salt : '',
          passwordHash: typeof mergedUser.passwordHash === 'string' ? mergedUser.passwordHash : '',
          password: typeof mergedUser.password === 'string' ? mergedUser.password : '',
          createdAt: typeof mergedUser.createdAt === 'string' ? mergedUser.createdAt : nowIso,
          updatedAt: nowIso,
        };
      }

      const visitorEntry: Record<string, unknown> = {
        userId: uid,
        provider: providerRaw,
        displayName,
        maskedContact: emailRaw || identifierRaw || displayName,
        contactRaw: emailRaw || identifierRaw,
        role: mergedUser.role === 'admin' ? 'admin' : 'visitor',
        isPrimaryAdmin: Boolean(mergedUser.isPrimaryAdmin),
        isLocked: Boolean(mergedUser.isLocked),
        loginCount: Number(mergedUser.loginCount || 1),
        firstLoginAt: typeof mergedUser.createdAt === 'string' ? mergedUser.createdAt : nowIso,
        lastLoginAt: typeof mergedUser.lastLoginAt === 'string' ? mergedUser.lastLoginAt : nowIso,
        exploredSiteIds: Array.isArray(mergedUser.exploredSiteIds) ? mergedUser.exploredSiteIds : [],
        completedRouteIds: Array.isArray(mergedUser.completedRouteIds)
          ? mergedUser.completedRouteIds
          : [],
      };
      const nextVisitors = mergeVisitorsList(current.visitors, [visitorEntry]);

      const incomingPasses = Array.isArray(mergedUser.issuedPasses)
        ? (mergedUser.issuedPasses as Array<Record<string, unknown>>)
        : Array.isArray(mergedUser.tickets)
        ? (mergedUser.tickets as Array<Record<string, unknown>>)
        : [];
      const nextPasses =
        incomingPasses.length > 0
          ? mergeArrayByKey(current.issuedPasses, incomingPasses, 'id', 'issuedAt')
          : current.issuedPasses;

      const nextEdTech = { ...current.userEdTechStates };
      const scope = emailRaw || identifierRaw || uid;
      if (mergedUser.edtechState && typeof mergedUser.edtechState === 'object' && scope) {
        nextEdTech[scope] = {
          ...(nextEdTech[scope] || {}),
          ...(mergedUser.edtechState as Record<string, unknown>),
        };
      }

      const next: ServerSyncState = {
        ...current,
        users: Array.from(userMap.values()),
        userCredentials: nextCreds,
        visitors: nextVisitors,
        issuedPasses: nextPasses,
        userEdTechStates: nextEdTech,
      };
      writeServerSyncState(next);
      res.json({ ok: true, users: next.users, state: next });
      return;
    }

    if (action === 'increment_visit') {
      const deviceType = cleanDeviceLabel(body.deviceType);
      const visitorLabel =
        typeof body.visitorLabel === 'string' && body.visitorLabel.trim()
          ? body.visitorLabel.trim().slice(0, 60)
          : undefined;
      const nextTotal = Math.max(342, current.totalVisits || current.analytics.totalVisitors || 342) + 1;
      const logEntry: VisitHistoryLogEntryServer = {
        id: `vh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowIso,
        action: 'visit',
        actionLabel: 'Truy cập trang web',
        deviceType,
        ...(visitorLabel ? { visitorLabel } : {}),
      };
      const next: ServerSyncState = {
        ...current,
        totalVisits: nextTotal,
        analytics: {
          ...current.analytics,
          totalVisitors: nextTotal,
          lastUpdatedAt: nowIso,
        },
        visitHistoryLogs: [logEntry, ...(current.visitHistoryLogs || [])].slice(0, 120),
      };
      writeServerSyncState(next);
      res.json({ ok: true, state: next });
      return;
    }

    if (action === 'increment_site_view') {
      const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';
      if (!siteId) {
        res.status(400).json({ ok: false, error: 'Thiếu mã di tích (siteId).' });
        return;
      }
      const matchedSite = HERITAGE_SITES.find((s) => s.id === siteId);
      const siteName =
        (typeof body.siteName === 'string' && body.siteName.trim()) ||
        matchedSite?.officialName ||
        siteId;
      const source = body.source === 'open_3d' ? 'open_3d' : 'open_dossier';
      const deviceType = cleanDeviceLabel(body.deviceType);
      const visitorLabel =
        typeof body.visitorLabel === 'string' && body.visitorLabel.trim()
          ? body.visitorLabel.trim().slice(0, 60)
          : undefined;

      const prevViews = current.siteVisits[siteId] ?? current.analytics.siteViews[siteId] ?? 0;
      const nextViews = prevViews + 1;
      const nextSiteVisits = {
        ...current.siteVisits,
        [siteId]: nextViews,
      };
      const logEntry: VisitHistoryLogEntryServer = {
        id: `vh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowIso,
        action: source,
        actionLabel: source === 'open_3d' ? 'Mở Không gian 3D' : 'Xem Hồ sơ Di sản',
        siteId,
        siteName,
        deviceType,
        ...(visitorLabel ? { visitorLabel } : {}),
      };
      const next: ServerSyncState = {
        ...current,
        siteVisits: nextSiteVisits,
        analytics: {
          ...current.analytics,
          interactions3D:
            source === 'open_3d'
              ? (current.analytics.interactions3D || 0) + 1
              : current.analytics.interactions3D || 0,
          siteViews: nextSiteVisits,
          lastUpdatedAt: nowIso,
        },
        visitHistoryLogs: [logEntry, ...(current.visitHistoryLogs || [])].slice(0, 120),
      };
      writeServerSyncState(next);
      res.json({ ok: true, state: next });
      return;
    }

    if (action === 'track_interaction') {
      const kind = typeof body.kind === 'string' ? body.kind : '';
      const siteId = typeof body.siteId === 'string' ? body.siteId.trim() : '';
      const nextSiteVisits = { ...current.siteVisits };
      if (siteId && kind === 'site_view') {
        nextSiteVisits[siteId] = (nextSiteVisits[siteId] ?? 0) + 1;
      }
      const prevTech = current.analytics.techUsage;
      const next: ServerSyncState = {
        ...current,
        siteVisits: nextSiteVisits,
        analytics: {
          ...current.analytics,
          interactions3D:
            kind === '3d' || kind === 'tech_3d_xray'
              ? current.analytics.interactions3D + 1
              : current.analytics.interactions3D,
          audioPlays:
            kind === 'audio' ? current.analytics.audioPlays + 1 : current.analytics.audioPlays,
          routesCompleted:
            kind === 'route_complete'
              ? (current.analytics.routesCompleted || 0) + 1
              : current.analytics.routesCompleted || 0,
          siteViews: nextSiteVisits,
          techUsage: {
            explodedXray:
              kind === 'tech_3d_xray' ? prevTech.explodedXray + 1 : prevTech.explodedXray,
            map1815: kind === 'tech_map_1815' ? prevTech.map1815 + 1 : prevTech.map1815,
            flycamVideo:
              kind === 'tech_flycam' ? prevTech.flycamVideo + 1 : prevTech.flycamVideo,
            audioAi:
              kind === 'audio' || kind === 'tech_audio_ai'
                ? prevTech.audioAi + 1
                : prevTech.audioAi,
          },
          lastUpdatedAt: nowIso,
        },
      };
      writeServerSyncState(next);
      res.json({ ok: true, state: next });
      return;
    }

    // Default: merge_state
    const patch = (
      body?.patch && typeof body.patch === 'object' ? body.patch : body
    ) as Partial<ServerSyncState>;

    const next = { ...current };

    if (
      typeof patch.adminPasswordHash === 'string' &&
      patch.adminPasswordHash.length >= 24 &&
      (!current.adminPasswordHash ||
        (typeof patch.adminPasswordUpdatedAt === 'string' &&
          patch.adminPasswordUpdatedAt >= (current.adminPasswordUpdatedAt || '')))
    ) {
      next.adminPasswordHash = patch.adminPasswordHash;
      next.adminPasswordUpdatedAt = patch.adminPasswordUpdatedAt || nowIso;
    }

    if (
      Array.isArray(patch.secondaryAdminEmails) &&
      (!current.secondaryAdminEmailsUpdatedAt ||
        (typeof patch.secondaryAdminEmailsUpdatedAt === 'string' &&
          patch.secondaryAdminEmailsUpdatedAt >= current.secondaryAdminEmailsUpdatedAt))
    ) {
      next.secondaryAdminEmails = Array.from(
        new Set(patch.secondaryAdminEmails.filter((x): x is string => typeof x === 'string'))
      );
      next.secondaryAdminEmailsUpdatedAt = patch.secondaryAdminEmailsUpdatedAt || nowIso;
    }

    if (
      Array.isArray(patch.testerAllowlistEmails) &&
      (!current.testerAllowlistUpdatedAt ||
        (typeof patch.testerAllowlistUpdatedAt === 'string' &&
          patch.testerAllowlistUpdatedAt >= current.testerAllowlistUpdatedAt))
    ) {
      next.testerAllowlistEmails = Array.from(
        new Set(
          patch.testerAllowlistEmails
            .filter((x): x is string => typeof x === 'string')
            .map((x) => x.toLowerCase().trim())
            .filter(Boolean)
        )
      );
      next.testerAllowlistUpdatedAt = patch.testerAllowlistUpdatedAt || nowIso;
    }

    if (patch.userCredentials && typeof patch.userCredentials === 'object') {
      const mergedCreds = { ...current.userCredentials };
      Object.entries(patch.userCredentials).forEach(([k, val]) => {
        if (!val || typeof val !== 'object') return;
        const prev = mergedCreds[k];
        if (!prev || String(val.updatedAt || '') >= String(prev.updatedAt || '')) {
          mergedCreds[k] = val;
        }
      });
      next.userCredentials = mergedCreds;
    }

    if (Array.isArray(patch.visitors)) {
      next.visitors = mergeVisitorsList(current.visitors, patch.visitors);
    }

    if (patch.lockedAccounts && typeof patch.lockedAccounts === 'object') {
      const mergedLocks = { ...current.lockedAccounts };
      Object.entries(patch.lockedAccounts).forEach(([uid, rec]) => {
        if (!rec || typeof rec !== 'object') return;
        const prev = mergedLocks[uid];
        const prevTime = String(prev?.updatedAt || prev?.lockedAt || '');
        const nextTime = String(rec.updatedAt || rec.lockedAt || '');
        if (!prev || nextTime >= prevTime) {
          mergedLocks[uid] = rec;
        }
      });
      next.lockedAccounts = mergedLocks;
      next.lockedAccountsUpdatedAt = patch.lockedAccountsUpdatedAt || nowIso;
    }

    if (Array.isArray(patch.issuedPasses)) {
      next.issuedPasses = mergeArrayByKey(
        current.issuedPasses,
        patch.issuedPasses,
        'id',
        'issuedAt'
      );
    }

    if (patch.userEdTechStates && typeof patch.userEdTechStates === 'object') {
      const mergedEdTech = { ...current.userEdTechStates };
      Object.entries(patch.userEdTechStates).forEach(([scope, st]) => {
        if (!st || typeof st !== 'object') return;
        const prev = mergedEdTech[scope];
        if (!prev) {
          mergedEdTech[scope] = st;
          return;
        }
        const prevTime = String(prev.updatedAt || '');
        const nextTime = String(st.updatedAt || '');
        const newer = nextTime >= prevTime ? st : prev;
        const older = nextTime >= prevTime ? prev : st;
        mergedEdTech[scope] = {
          ...older,
          ...newer,
          ticketIssued: Boolean(prev.ticketIssued || st.ticketIssued),
          quizSubmitted: Boolean(prev.quizSubmitted || st.quizSubmitted),
          ticketPassId: newer.ticketPassId || older.ticketPassId,
          certPassId: newer.certPassId || older.certPassId,
          topicSubmittedMap: {
            ...((older.topicSubmittedMap as Record<string, unknown>) || {}),
            ...((newer.topicSubmittedMap as Record<string, unknown>) || {}),
          },
          topicCertIds: {
            ...((older.topicCertIds as Record<string, unknown>) || {}),
            ...((newer.topicCertIds as Record<string, unknown>) || {}),
          },
        };
      });
      next.userEdTechStates = mergedEdTech;
    }

    if (patch.passportStamps && typeof patch.passportStamps === 'object') {
      const mergedPassports = { ...current.passportStamps };
      Object.entries(patch.passportStamps).forEach(([scope, map]) => {
        if (!map || typeof map !== 'object') return;
        mergedPassports[scope] = {
          ...(mergedPassports[scope] || {}),
          ...map,
        };
      });
      next.passportStamps = mergedPassports;
    }

    if (Array.isArray(patch.supportTickets)) {
      next.supportTickets = mergeSupportTicketsList(current.supportTickets, patch.supportTickets);
    }

    if (Array.isArray(patch.visitorReviews)) {
      next.visitorReviews = mergeArrayByKey(
        current.visitorReviews,
        patch.visitorReviews,
        'id',
        'createdAt'
      );
    }

    if (
      Array.isArray(patch.hiddenHeritageIds) &&
      (!current.hiddenHeritageUpdatedAt ||
        (typeof patch.hiddenHeritageUpdatedAt === 'string' &&
          patch.hiddenHeritageUpdatedAt >= current.hiddenHeritageUpdatedAt))
    ) {
      next.hiddenHeritageIds = Array.from(
        new Set(patch.hiddenHeritageIds.filter((x): x is string => typeof x === 'string'))
      );
      next.hiddenHeritageUpdatedAt = patch.hiddenHeritageUpdatedAt || nowIso;
    }

    if (patch.cmsDeletedSiteIds && typeof patch.cmsDeletedSiteIds === 'object') {
      next.cmsDeletedSiteIds = { ...current.cmsDeletedSiteIds, ...patch.cmsDeletedSiteIds };
    }

    if (patch.cmsOverrides && typeof patch.cmsOverrides === 'object') {
      const mergedCms = { ...current.cmsOverrides };
      Object.entries(patch.cmsOverrides).forEach(([siteId, ov]) => {
        if (ov && typeof ov === 'object') {
          mergedCms[siteId] = { ...(mergedCms[siteId] || {}), ...ov };
        }
      });
      // Apply explicit deletions if newer
      Object.entries(next.cmsDeletedSiteIds || {}).forEach(([siteId, delAt]) => {
        const ovUpdatedAt = String((mergedCms[siteId] as Record<string, unknown>)?.updatedAt || '');
        if (delAt && (!ovUpdatedAt || delAt >= ovUpdatedAt)) {
          delete mergedCms[siteId];
        }
      });
      next.cmsOverrides = mergedCms;
    }

    if (patch.siteTranslationsOverride && typeof patch.siteTranslationsOverride === 'object') {
      next.siteTranslationsOverride = {
        ...current.siteTranslationsOverride,
        ...patch.siteTranslationsOverride,
      };
    }
    if (patch.quizDrafts && typeof patch.quizDrafts === 'object') {
      next.quizDrafts = { ...current.quizDrafts, ...patch.quizDrafts };
    }
    if (patch.publishedQuizzes && typeof patch.publishedQuizzes === 'object') {
      next.publishedQuizzes = { ...current.publishedQuizzes, ...patch.publishedQuizzes };
    }
    if (patch.audioOverrides && typeof patch.audioOverrides === 'object') {
      next.audioOverrides = { ...current.audioOverrides, ...patch.audioOverrides };
    }

    if (patch.customSitePhotos && typeof patch.customSitePhotos === 'object') {
      const mergedPhotos: Record<string, unknown> = { ...current.customSitePhotos };
      Object.entries(patch.customSitePhotos).forEach(([siteId, incoming]) => {
        if (incoming === undefined || incoming === null) return;
        const prev = mergedPhotos[siteId];
        if (typeof incoming === 'string') {
          if (!prev || typeof prev === 'string') {
            mergedPhotos[siteId] = incoming;
          }
          return;
        }
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
      next.customSitePhotos = mergedPhotos;
      next.customSitePhotosUpdatedAt =
        typeof patch.customSitePhotosUpdatedAt === 'string'
          ? patch.customSitePhotosUpdatedAt
          : nowIso;
    }

    if (patch.photoCaptionOverrides && typeof patch.photoCaptionOverrides === 'object') {
      const mergedCaptions: Record<string, unknown> = { ...current.photoCaptionOverrides };
      Object.entries(patch.photoCaptionOverrides).forEach(([siteId, incoming]) => {
        if (!incoming || typeof incoming !== 'object') return;
        const prev = mergedCaptions[siteId];
        const prevTime =
          prev && typeof prev === 'object'
            ? String((prev as Record<string, unknown>).updatedAt || '')
            : '';
        const nextTime = String((incoming as Record<string, unknown>).updatedAt || '');
        if (!prev || !prevTime || nextTime >= prevTime) {
          mergedCaptions[siteId] = incoming;
        }
      });
      next.photoCaptionOverrides = mergedCaptions;
    }

    if (patch.customGlbUrls && typeof patch.customGlbUrls === 'object') {
      next.customGlbUrls = {
        ...current.customGlbUrls,
        ...patch.customGlbUrls,
      };
    }

    if (Array.isArray(patch.accountsDb)) {
      next.accountsDb = mergeArrayByKey(
        current.accountsDb,
        patch.accountsDb,
        'email',
        'createdAt'
      );
    }

    if (patch.subscriptionTiers && typeof patch.subscriptionTiers === 'object') {
      const mergedTiers = { ...current.subscriptionTiers };
      Object.entries(patch.subscriptionTiers).forEach(([scope, val]) => {
        if (!val || typeof val !== 'object') return;
        const incoming = val as Record<string, unknown>;
        const prev = mergedTiers[scope] as Record<string, unknown> | undefined;
        if (!prev || String(incoming.updatedAt || '') >= String(prev.updatedAt || '')) {
          mergedTiers[scope] = incoming;
        }
      });
      next.subscriptionTiers = mergedTiers;
    }

    if (patch.schoolPackages && typeof patch.schoolPackages === 'object') {
      const mergedSchoolPkgs = { ...current.schoolPackages };
      Object.entries(patch.schoolPackages).forEach(([scope, val]) => {
        if (!val || typeof val !== 'object') return;
        const incoming = val as Record<string, unknown>;
        const prev = mergedSchoolPkgs[scope] as Record<string, unknown> | undefined;
        if (!prev || String(incoming.updatedAt || '') >= String(prev.updatedAt || '')) {
          mergedSchoolPkgs[scope] = incoming;
        }
      });
      next.schoolPackages = mergedSchoolPkgs;
    }

    if (
      patch.siteSettings &&
      typeof patch.siteSettings === 'object' &&
      (!current.siteSettingsUpdatedAt ||
        (typeof patch.siteSettingsUpdatedAt === 'string' &&
          patch.siteSettingsUpdatedAt >= current.siteSettingsUpdatedAt))
    ) {
      next.siteSettings = patch.siteSettings;
      next.siteSettingsUpdatedAt = patch.siteSettingsUpdatedAt || nowIso;
    }

    if (
      patch.emergencyLockdown &&
      typeof patch.emergencyLockdown === 'object' &&
      (!current.emergencyLockdownUpdatedAt ||
        (typeof patch.emergencyLockdownUpdatedAt === 'string' &&
          patch.emergencyLockdownUpdatedAt >= current.emergencyLockdownUpdatedAt))
    ) {
      next.emergencyLockdown = patch.emergencyLockdown;
      next.emergencyLockdownUpdatedAt = patch.emergencyLockdownUpdatedAt || nowIso;
    }

    if (Array.isArray(patch.auditLogs)) {
      next.auditLogs = mergeArrayByKey(current.auditLogs, patch.auditLogs, 'id', 'timestamp', 60);
    }
    if (Array.isArray(patch.securityAlerts)) {
      next.securityAlerts = mergeArrayByKey(
        current.securityAlerts,
        patch.securityAlerts,
        'id',
        'timestamp',
        80
      );
    }
    if (Array.isArray(patch.aiOutbox)) {
      next.aiOutbox = mergeArrayByKey(current.aiOutbox, patch.aiOutbox, 'id', 'createdAt', 100);
    }
    if (patch.aiShield && typeof patch.aiShield === 'object') {
      next.aiShield = patch.aiShield;
    }
    if (typeof patch.aiAutopilotEnabled === 'boolean') {
      next.aiAutopilotEnabled = patch.aiAutopilotEnabled;
    }
    if (patch.hydrogenCores && typeof patch.hydrogenCores === 'object') {
      next.hydrogenCores = patch.hydrogenCores;
    }
    if (patch.hydrogenBriefing && typeof patch.hydrogenBriefing === 'object') {
      next.hydrogenBriefing = patch.hydrogenBriefing;
    }
    if (Array.isArray(patch.hydrogenCmdLogs)) {
      next.hydrogenCmdLogs = mergeArrayByKey(
        current.hydrogenCmdLogs,
        patch.hydrogenCmdLogs,
        'id',
        'timestamp',
        30
      );
    }

    // Reconcile counters cleanly with Math.max so they never regress
    const pTotal = Math.max(
      current.totalVisits,
      typeof patch.totalVisits === 'number' ? patch.totalVisits : 0,
      typeof patch.analytics?.totalVisitors === 'number' ? patch.analytics.totalVisitors : 0
    );
    const mergedSiteVisits = { ...current.siteVisits };
    if (patch.siteVisits && typeof patch.siteVisits === 'object') {
      Object.entries(patch.siteVisits).forEach(([k, v]) => {
        if (typeof v === 'number' && Number.isFinite(v)) {
          mergedSiteVisits[k] = Math.max(mergedSiteVisits[k] || 0, v);
        }
      });
    }
    if (patch.analytics?.siteViews && typeof patch.analytics.siteViews === 'object') {
      Object.entries(patch.analytics.siteViews).forEach(([k, v]) => {
        if (typeof v === 'number' && Number.isFinite(v)) {
          mergedSiteVisits[k] = Math.max(mergedSiteVisits[k] || 0, v);
        }
      });
    }
    next.totalVisits = pTotal;
    next.siteVisits = mergedSiteVisits;
    next.analytics = {
      totalVisitors: pTotal,
      interactions3D: Math.max(
        current.analytics.interactions3D,
        typeof patch.analytics?.interactions3D === 'number' ? patch.analytics.interactions3D : 0
      ),
      audioPlays: Math.max(
        current.analytics.audioPlays,
        typeof patch.analytics?.audioPlays === 'number' ? patch.analytics.audioPlays : 0
      ),
      routesCompleted: Math.max(
        current.analytics.routesCompleted,
        typeof patch.analytics?.routesCompleted === 'number' ? patch.analytics.routesCompleted : 0
      ),
      siteViews: mergedSiteVisits,
      techUsage: {
        explodedXray: Math.max(
          current.analytics.techUsage.explodedXray,
          typeof patch.analytics?.techUsage?.explodedXray === 'number'
            ? patch.analytics.techUsage.explodedXray
            : 0
        ),
        map1815: Math.max(
          current.analytics.techUsage.map1815,
          typeof patch.analytics?.techUsage?.map1815 === 'number'
            ? patch.analytics.techUsage.map1815
            : 0
        ),
        flycamVideo: Math.max(
          current.analytics.techUsage.flycamVideo,
          typeof patch.analytics?.techUsage?.flycamVideo === 'number'
            ? patch.analytics.techUsage.flycamVideo
            : 0
        ),
        audioAi: Math.max(
          current.analytics.techUsage.audioAi,
          typeof patch.analytics?.techUsage?.audioAi === 'number'
            ? patch.analytics.techUsage.audioAi
            : 0
        ),
      },
      lastUpdatedAt: nowIso,
    };

    writeServerSyncState(next);
    res.json({ ok: true, state: next });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync state error';
    res.status(500).json({ ok: false, error: msg });
  }
});

function getSafeGeminiApiKey(): string {
  const viteEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as { env?: Record<string, string | undefined> }).env
      : undefined;
  if (viteEnv?.VITE_GEMINI_API_KEY) {
    return viteEnv.VITE_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined') {
    return (
      process.env?.GEMINI_API_KEY ||
      process.env?.VITE_GEMINI_API_KEY ||
      process.env?.API_KEY ||
      ''
    );
  }
  return '';
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = getSafeGeminiApiKey();
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SMART_GEMINI_FLASH_MODELS = [
  'gemini-4-hydrogen',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-2.5-flash',
] as const;

const modelCooldownUntil = new Map<string, number>();

function isGemini4Model(modelName: string): boolean {
  return (
    modelName.startsWith('gemini-4-') ||
    modelName === 'gemini-4-hydrogen' ||
    modelName === 'gemini-4-argon' ||
    modelName === 'gemini-4-carbon'
  );
}

function recordModelFailureCooldown(modelName: string, errMsg: string): void {
  const now = Date.now();
  if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
    const match = errMsg.match(/retry in\s+([0-9.]+)s/i) || errMsg.match(/"retryDelay"\s*:\s*"([0-9.]+)s"/i);
    const delaySec = match ? Math.max(15, Math.ceil(Number(match[1]))) : 60;
    modelCooldownUntil.set(modelName, now + delaySec * 1000);
  } else if (errMsg.includes('404') || errMsg.includes('NOT_FOUND')) {
    modelCooldownUntil.set(modelName, now + 10 * 60 * 1000);
  }
}

const APP_FUNCTIONAL_MAP_CONTEXT = `SƠ ĐỒ CHỨC NĂNG & NÚT BẤM THỰC TẾ CỦA ỨNG DỤNG "DẤU ẤN VIỆT 3D":
1. Tab "Khám phá": Danh sách 17 di tích lịch sử – kiến trúc Đông Nam Bộ (TP.HCM – Bình Dương – Bà Rịa Vũng Tàu) và khu vực gợi ý 3 tuyến tham quan thông minh (Lộ trình Di sản Trung tâm Sài Gòn, Hành trình Địa đạo & Chiến khu Lòng đất, Tuyến Kiến trúc Cổ Nam Bộ).
2. Tab "Không gian 3D": Khung mô hình 3D tương tác — hỗ trợ xoay 360°, phóng to/thu nhỏ, nút chuyển chế độ "Bóc tách kiến trúc", chế độ "X-Ray", chuyển đổi ánh sáng "Studio / Ban ngày / Hoàng hôn / Đêm", và cửa sổ "Hướng dẫn viên Di sản AI" (3 vai: Kiến trúc sư, Nhân chứng thời cuộc, Nhà thông sử + Tour 3D tự động + Giải mã Kiến trúc).
3. Tab "Bản đồ & Tuyến": Bản đồ GIS chuẩn tọa độ VN-2000/WGS84, tích hợp nút bật "Thấu kính Bản đồ Lịch sử 1815" để đối chiếu địa danh Thành Gia Định xưa – đô thị hôm nay và xem tuyến di chuyển liên vùng.
4. Tab "Hồ sơ Di sản": Tư liệu sử học, niên đại, kiến trúc sư, vật liệu, nội quy tham quan và nút mở "Video Tư liệu Flycam" (có tab Kho Wikimedia Commons dự phòng).
5. Tab "Vé & Học liệu": Đăng ký đặt vé tham quan số mã QR và làm bài trắc nghiệm lịch sử (đạt từ 80% nhận Chứng nhận học liệu số); xem lại vé & chứng nhận đã cấp ở mục "Vé & Hành trình của tôi" tại góc phải thanh tiêu đề.
6. Tab "Thuyết minh": Thanh phát giọng đọc Audio đa ngôn ngữ (VI | EN | ZH) kèm phụ đề đồng bộ (du khách nhấn nút Phát/Play để kích hoạt âm thanh).
7. Nút "(?)" trên thanh tiêu đề: Mở "Trung tâm Hỗ trợ Du khách" gồm 3 tab ("Hướng dẫn nhanh & FAQ", "Gửi yêu cầu hỗ trợ", "Phiếu hỗ trợ của tôi") để hỏi đáp sử liệu, hướng dẫn thao tác hoặc chuyển tiếp gặp trực tiếp Quản trị viên.`;

function buildFull17SitesKnowledgeContext(focusedSiteId?: string | null): string {
  const lines = HERITAGE_SITES.map((s, idx) => {
    const milestonesText = (s.milestones || [])
      .slice(0, 4)
      .map((m) => `${m.year}: ${m.event}`)
      .join(' | ');
    const focusMarker = focusedSiteId && s.id === focusedSiteId ? ' [ĐANG ĐƯỢC XEM/CHỌN]' : '';
    return `${idx + 1}. [${s.id}] ${s.officialName}${s.folkName ? ` (${s.folkName})` : ''}${focusMarker}
   - Địa điểm: ${s.address.houseNumber} ${s.address.street}, ${s.address.ward}, ${s.address.district}, ${s.address.city}
   - Niên đại / Năm xây dựng: ${s.chronology} (khởi đầu: ${s.commencementYear < 0 ? `khoảng ${Math.abs(s.commencementYear)} TCN` : s.commencementYear})
   - Kiến trúc sư / Chủ thể kiến tạo: ${s.architect}
   - Phong cách kiến trúc: ${s.architecturalStyle}
   - Vật liệu chính: ${(s.materials || []).join(', ')}
   - Tóm tắt & Giá trị lịch sử: ${s.summary}${milestonesText ? ` | Mốc lịch sử: ${milestonesText}` : ''}
   - Mở cửa & Giá vé: ${s.openingHours} · ${s.ticketPrices}`;
  }).join('\n');

  return `KHO SỬ LIỆU CHÍNH THỨC CỦA 17 DI TÍCH ĐÔNG NAM BỘ (TP.HCM – BÌNH DƯƠNG – BÀ RỊA VŨNG TÀU):
${lines}`;
}

async function callSmartGeminiFlashRouter(params: {
  contents: unknown;
  systemInstruction: string;
  preferredModel?: string;
  responseMimeType?: string;
  responseSchema?: unknown;
  temperature?: number;
}): Promise<{ text: string; modelUsed: string }> {
  const apiKey = getSafeGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  const ai = getGeminiClient();
  const pref = (params.preferredModel || '').trim();
  let allCandidates: string[];
  if (pref === 'gemini-2.5-flash') {
    // Free tier strictly stays on Gemini 2.5 Flash
    allCandidates = ['gemini-2.5-flash'];
  } else if (pref === 'gemini-3.5-flash') {
    // 19k tier tries Gemini 3.5 Flash first and falls back only to 2.5 Flash (never escalates to 4 Hydrogen)
    allCandidates = ['gemini-3.5-flash', 'gemini-2.5-flash'];
  } else {
    const normalizedPreferred =
      pref && pref !== 'gemini-flash-latest' ? [pref] : [];
    allCandidates = Array.from(
      new Set([...normalizedPreferred, ...SMART_GEMINI_FLASH_MODELS])
    );
  }
  const now = Date.now();
  const activeCandidates = allCandidates.filter(
    (m) => (modelCooldownUntil.get(m) || 0) <= now
  );
  const candidateModels = activeCandidates.length > 0 ? activeCandidates : allCandidates;

  let lastError: unknown = null;

  for (const modelName of candidateModels) {
    try {
      const config: Record<string, unknown> = {
        systemInstruction: params.systemInstruction,
      };
      if (!isGemini4Model(modelName)) {
        config.temperature = typeof params.temperature === 'number' ? params.temperature : 0.3;
      }
      if (params.responseMimeType) {
        config.responseMimeType = params.responseMimeType;
      }
      if (params.responseSchema) {
        config.responseSchema = params.responseSchema;
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents as Parameters<typeof ai.models.generateContent>[0]['contents'],
        config,
      });

      const text = (response.text || '').trim();
      if (text) {
        modelCooldownUntil.delete(modelName);
        return { text, modelUsed: modelName };
      }
    } catch (err: unknown) {
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      recordModelFailureCooldown(modelName, errMsg);
      continue;
    }
  }

  throw lastError || new Error('GEMINI_ROUTER_EXHAUSTED');
}

interface HotspotContextItem {
  index: number;
  tag: string;
  name: string;
  description: string;
}

interface HeritageChatRequestBody {
  message: string;
  model?: string;
  systemInstruction?: string;
  lang?: 'vi' | 'en' | 'zh';
  persona: 'Architect' | 'Eyewitness' | 'Polymath' | 'Historian' | 'Witness' | 'expert' | 'witness';
  monument: {
    id: string;
    code?: string;
    officialName: string;
    district: string;
    architecturalStyle: string;
    constructionPeriod: string;
    architectOrBuilder: string;
    historicalEvents: string[];
    summary: string;
  };
  roleplayIdentity?: {
    name: string;
    title: string;
    intro: string;
  };
  hotspots: HotspotContextItem[];
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}

function buildSystemInstruction(body: HeritageChatRequestBody): string {
  const { monument, persona, hotspots, roleplayIdentity } = body;
  const isArchitect = persona === 'Architect';
  const isEyewitness = persona === 'Eyewitness' || persona === 'Witness' || persona === 'witness';

  const hotspotLines = hotspots
    .map(
      (h) =>
        `  * [${h.tag}] -> Trạm ${h.index}: "${h.name}" (${h.description})`
    )
    .join('\n');

  const personaInstruction = isArchitect
    ? `CHẾ ĐỘ NHÂN VẬT 1: 🏛️ KIẾN TRÚC SƯ / NGHỆ NHÂN (ARCHITECT / MASTER ARTISAN).
- Bạn phải xưng "tôi" và nhập vai trọn vẹn vào tác giả/nghệ nhân kiến tạo công trình: **${
        roleplayIdentity?.name || monument.architectOrBuilder
      }** (${roleplayIdentity?.title || 'Kiến trúc sư / Nghệ nhân di sản'}).
- Bối cảnh: ${
        roleplayIdentity?.intro ||
        `Tôi là người trực tiếp phác thảo và kiến tạo ${monument.officialName}.`
      }
- Trọng tâm: Phân tích sâu sắc kết cấu chịu lực, vật liệu (gạch Marseille, gỗ lim, đá ong laterite, thép tiền chế...), tỷ lệ hình học, giải pháp thông gió nhiệt đới và triết lý thẩm mỹ của chính mình.`
    : isEyewitness
    ? `CHẾ ĐỘ NHÂN VẬT 2: 🕯️ NHÂN CHỨNG THỜI CUỘC (HISTORICAL EYEWITNESS).
- Bạn phải xưng "tôi" và nhập vai vào nhân chứng lịch sử đang sống ngay trong thời kỳ biến động tại công trình: **${
        roleplayIdentity?.name || monument.architectOrBuilder
      }** (${roleplayIdentity?.title || 'Nhân chứng lịch sử tại di tích'}).
- Bối cảnh: ${
        roleplayIdentity?.intro ||
        `Tôi đã trực tiếp chứng kiến những sự kiện lịch sử sống động nhất tại ${monument.officialName}.`
      }
- Trọng tâm: Giọng văn giàu cảm xúc chân thực của người trong cuộc, kể lại không khí thời cuộc, ký ức âm thanh - ánh sáng và số phận con người gắn với từng góc kiến trúc.`
    : `CHẾ ĐỘ NHÂN VẬT 3: 📜 NHÀ THÔNG SỬ (POLYMATH HISTORIAN — TRÍCH NGUỒN).
- Bạn đóng vai là một Giáo sư Thông sử & Chuyên gia Đối sánh Kiến trúc Toàn cầu của Dấu Ấn Việt 3D.
- Trọng tâm: Đặt di tích Đông Nam Bộ này vào dòng chảy lịch sử Việt Nam và thế giới cùng thời kỳ (Cách mạng Công nghiệp Pháp, Phong trào Đông Dương, Chiến tranh Lạnh, Thương mại Ấn Độ Dương - Biển Đông cổ), phân tích sắc bén liên kết vùng TP.HCM – Bình Dương – Bà Rịa Vũng Tàu.
- BẮT BUỘC: Cuối câu trả lời PHẢI có dòng trích dẫn rõ ràng bắt đầu bằng \`Nguồn tham khảo:\`.`;

  return `Bạn là "Hướng dẫn viên Di sản AI (Không gian 3D)" của Dấu Ấn Việt 3D — nền tảng Bảo tàng Số & Giải phẫu Di sản 3D Liên vùng (TP.HCM - Bình Dương - Bà Rịa Vũng Tàu).

${personaInstruction}

====================================================================
THÔNG TIN DI TÍCH DU KHÁCH ĐANG MỞ TRÊN MÀN HÌNH 3D:
====================================================================
- Mã định danh: ${monument.id} (${monument.code || ''})
- Tên di tích: ${monument.officialName}
- Khu vực: ${monument.district}
- Phong cách kiến trúc: ${monument.architecturalStyle}
- Niên đại xây dựng: ${monument.constructionPeriod}
- Tác giả / Kiến trúc sư / Chủ thể kiến tạo: ${monument.architectOrBuilder}
- Sự kiện lịch sử tiêu biểu: ${(monument.historicalEvents || []).join('; ')}
- Tóm tắt hồ sơ di sản: ${monument.summary}

====================================================================
DANH SÁCH ĐIỂM NHẤN KIẾN TRÚC 3D (HOTSPOTS) CỦA DI TÍCH NÀY:
====================================================================
${hotspotLines || '  * [ACTION:HOTSPOT_1] -> Toàn cảnh công trình'}

====================================================================
QUY TẮC NỘI DUNG, GỢI Ý TƯƠNG TÁC & TRÍCH DẪN SỬ LIỆU:
====================================================================
1. Giải đáp chuyên sâu về lịch sử, kiến trúc, niên đại, vật liệu của công trình du khách đang mở và đối chiếu liên vùng Đông Nam Bộ (kết hợp dữ liệu 17 di tích trong cơ sở tri thức).
2. Khi phù hợp, gợi ý cho du khách trải nghiệm đúng tính năng tương tác liên quan (*X-Ray*, *Bóc tách kiến trúc*, *Bản đồ 1815* trong tab *Bản đồ & Tuyến*, hoặc ánh sáng *Studio / Ban ngày / Hoàng hôn / Đêm*).
3. Trình bày súc tích, dễ đọc (khoảng 110 - 210 từ), chia ý rõ ràng, bám sát sử liệu chuẩn xác.
4. Đối với chế độ 📜 Nhà Thông Sử (Polymath), LUÔN LUÔN kết thúc phần nội dung bằng dòng trích dẫn nguồn sử liệu uy tín theo đúng định dạng: \`Nguồn tham khảo: ...\` (ví dụ: *Nguồn tham khảo: Gia Định thành thông chí (Trịnh Hoài Đức), Lịch sử khẩn hoang miền Nam (Sơn Nam), Lưu trữ Quốc gia Hải ngoại Pháp (ANOM), Hồ sơ Di tích Quốc gia - Cục Di sản Văn hóa*).

====================================================================
QUY TẮC ĐIỀU KHIỂN CAMERA & CHẾ ĐỘ 3D TỰ ĐỘNG (AI SPATIAL ACTION TRIGGERS):
====================================================================
Khi người dùng yêu cầu xem một bộ phận cụ thể, bật chế độ hiển thị, hoặc khi câu trả lời của bạn đang phân tích trực tiếp một bộ phận/kết cấu của mô hình 3D, HÃY ĐÍNH KÈM thẻ lệnh điều khiển ở CUỐI CÙNG của câu trả lời theo đúng cú pháp sau:
- Bay camera & rọi đèn Spotlight đến Điểm nhấn kiến trúc tương ứng:
  + \`[ACTION:HOTSPOT_1]\` .. \`[ACTION:HOTSPOT_6]\`
- Chuyển chế độ hiển thị mô hình 3D:
  + \`[ACTION:MODE_XRAY]\`, \`[ACTION:MODE_WIREFRAME]\`, \`[ACTION:MODE_TEXTURED]\`
- Kích hoạt chạy Tour 3D tự động cùng Nhân chứng:
  + \`[ACTION:START_TOUR]\`

${buildFull17SitesKnowledgeContext(monument.id)}

${APP_FUNCTIONAL_MAP_CONTEXT}`;
}

function buildServerSideHeritageChatFallback(body: HeritageChatRequestBody): string {
  const { monument, persona, hotspots, roleplayIdentity } = body;
  const firstHotspot = hotspots?.[0];
  const hotspotTag = firstHotspot ? `[${firstHotspot.tag}]` : '[ACTION:HOTSPOT_1]';
  const eventsText =
    monument.historicalEvents && monument.historicalEvents.length > 0
      ? monument.historicalEvents.slice(0, 3).join('; ')
      : monument.constructionPeriod;

  if (persona === 'Architect') {
    return `Tôi là **${roleplayIdentity?.name || monument.architectOrBuilder}**. Khi kiến tạo **${monument.officialName}** (${monument.constructionPeriod}) tại ${monument.district}, tôi đặc biệt chú trọng sự giao hòa giữa phong cách **${monument.architecturalStyle}** và điều kiện khí hậu nhiệt đới phương Nam.\n\n${monument.summary}\n\nBạn có thể bật chế độ **Bóc tách kiến trúc** hoặc **X-Ray** ngay trên khung 3D để quan sát rõ hơn hệ kết cấu chịu lực của công trình. ${hotspotTag}`;
  }

  if (persona === 'Eyewitness' || persona === 'Witness' || persona === 'witness') {
    return `Tôi vẫn nhớ như in những năm tháng lịch sử tại **${monument.officialName}** (${monument.constructionPeriod}). Từng bức tường, hành lang nơi đây đều chứng kiến các cột mốc không thể nào quên: ${eventsText}.\n\n${monument.summary}\n\nHãy xoay mô hình 3D hoặc bật **Thuyết minh** để cảm nhận trọn vẹn nhịp đập lịch sử của di tích. ${hotspotTag}`;
  }

  return `Dưới góc độ thông sử và đối sánh kiến trúc vùng Đông Nam Bộ, **${monument.officialName}** (${monument.constructionPeriod}, tọa lạc tại ${monument.district}) là minh chứng tiêu biểu của phong cách **${monument.architecturalStyle}** do **${monument.architectOrBuilder}** định hình.\n\n${monument.summary}\n\nCác mốc sự kiện trọng đại gắn với di tích gồm: ${eventsText}. Bạn có thể đối chiếu thêm vị trí địa chiến lược của công trình trên **Thấu kính Bản đồ Lịch sử 1815** tại tab *Bản đồ & Tuyến*.\n\nNguồn tham khảo: Hồ sơ Di tích Quốc gia - Cục Di sản Văn hóa, Gia Định thành thông chí (Trịnh Hoài Đức), Lịch sử khẩn hoang miền Nam (Sơn Nam). ${hotspotTag}`;
}

function buildArgonServerFallbackNote(monumentName: string): string {
  return `\n\n[Phân tích chuyên sâu lõi Gemini 4 Argon]: Đối chiếu kết cấu chịu lực, vật liệu chế tác và bối cảnh thông sử Đông Nam Bộ – thế giới của **${monumentName}**; khuyến nghị bật **Bóc tách kiến trúc 3D** hoặc **X-Ray** để kiểm tra chi tiết từng phân tầng kết cấu. [ACTION:MODE_XRAY]`;
}

app.post('/api/gemini/heritage-chat', async (req, res) => {
  try {
    const body = req.body as HeritageChatRequestBody;
    if (!body || !body.message || !body.monument) {
      res.status(400).json({ error: 'Thiếu dữ liệu câu hỏi hoặc thông tin di tích.' });
      return;
    }

    const isArgonModel = body.model === 'gemini-4-argon';
    const argonDirective = isArgonModel
      ? `

CHẾ ĐỘ LÕI TỐI CAO GEMINI 4 ARGON (ĐỘC QUYỀN QUẢN TRỊ VIÊN):
- Tổng hợp đối sánh thông sử đa chiều (đặt di tích Đông Nam Bộ trong dòng chảy lịch sử Việt Nam và thế giới cùng thời kỳ).
- Phân tích sâu kỹ thuật kết cấu, cơ học vật liệu (gạch Marseille, gỗ lim, đá ong laterite, vôi hàu, kết cấu thép...) và giải pháp vi khí hậu nhiệt đới.
- LUÔN nêu rõ nguồn sử liệu tham khảo uy tín (VD: Gia Định thành thông chí, Đại Nam nhất thống chí, ANOM, Cục Di sản Văn hóa).
- Đính kèm chỉ dẫn quan sát Bóc tách 3D / X-Ray ([ACTION:MODE_XRAY], [ACTION:HOTSPOT_1]..[ACTION:HOTSPOT_6]) nhắm tới cấu kiện kiến trúc trọng tâm.`
      : '';

    const baseInstruction =
      body.systemInstruction && body.systemInstruction.trim()
        ? `${body.systemInstruction.trim()}${argonDirective}

CHỈ DẪN CHUYÊN MÔN BỔ SUNG (ĐIỂM CHẠM 3D):
- Giải đáp chuyên sâu về lịch sử, kiến trúc, niên đại của công trình đang mở và chủ động gợi ý tính năng tương tác phù hợp như X-Ray, Bóc tách kiến trúc, hoặc đối chiếu Thấu kính Bản đồ Lịch sử 1815 (tại tab Bản đồ & Tuyến).

${buildFull17SitesKnowledgeContext(body.monument.id)}

${APP_FUNCTIONAL_MAP_CONTEXT}`
        : `${buildSystemInstruction(body)}${argonDirective}`;

    const historyContents = (body.history || []).slice(-6).map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    }));

    const contents = [
      ...historyContents,
      {
        role: 'user',
        parts: [{ text: body.message }],
      },
    ];

    try {
      const result = await callSmartGeminiFlashRouter({
        contents,
        systemInstruction: baseInstruction,
        preferredModel: body.model,
        temperature: 0.3,
      });

      res.json({
        text: result.text,
        modelUsed: result.modelUsed,
      });
    } catch {
      const baseFallback = buildServerSideHeritageChatFallback(body);
      res.json({
        text: isArgonModel
          ? `${baseFallback}${buildArgonServerFallbackNote(body.monument.officialName)}`
          : baseFallback,
        modelUsed: isArgonModel ? 'gemini-4-argon-archive-fallback' : 'scholarly-archive-fallback',
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi kết nối Gemini API';
    res.status(500).json({
      error: message,
    });
  }
});

interface CuratorAssistRequestBody {
  action: 'translate' | 'quiz';
  site: {
    id: string;
    officialName: string;
    chronology?: string;
    district?: string;
    architecturalStyle?: string;
    summary: string;
  };
}

function buildCuratorAssistServerFallback(body: CuratorAssistRequestBody): Record<string, unknown> {
  const { action, site } = body;
  const fullSite = HERITAGE_SITES.find((s) => s.id === site.id);
  const district = site.district || fullSite?.address.district || 'Đông Nam Bộ';
  const chronology = site.chronology || fullSite?.chronology || 'Thế kỷ XIX - XX';
  const style = site.architecturalStyle || fullSite?.architecturalStyle || 'Di sản kiến trúc Đông Nam Bộ';
  const architect = fullSite?.architect || 'Các kiến trúc sư & nghệ nhân đương thời';

  if (action === 'translate') {
    return {
      summaryVi: site.summary,
      officialNameEn: `${site.officialName}`,
      architecturalStyleEn: style,
      summaryEn: `${site.officialName} (${chronology}) is a landmark heritage monument located in ${district}, exemplifying ${style}. ${site.summary}`,
      officialNameZh: `${site.officialName}`,
      architecturalStyleZh: style,
      summaryZh: `${site.officialName}（年代：${chronology}）位于${district}，是展现${style}的代表性历史文化遗迹。`,
    };
  }

  return {
    questions: [
      {
        question: `Di tích "${site.officialName}" tọa lạc tại khu vực nào và mang niên đại lịch sử nào?`,
        options: [
          `A. Tại ${district}, niên đại ${chronology}`,
          'B. Tại cố đô Hoa Lư (Ninh Bình), thế kỷ X',
          'C. Tại phố cổ Hội An (Quảng Nam), thế kỷ XVI',
          'D. Tại cao nguyên đá Đồng Văn, thế kỷ XVIII',
        ],
        correctIndex: 0,
        explanation: `${site.officialName} tọa lạc tại ${district} với niên đại ${chronology}.`,
      },
      {
        question: `Phong cách kiến trúc chủ đạo của công trình "${site.officialName}" là gì?`,
        options: [
          'A. Kiến trúc Gothic Bắc Âu thời Trung cổ',
          `B. ${style}`,
          'C. Kiến trúc Baroque Tây Ban Nha thế kỷ XVII',
          'D. Kiến trúc công nghiệp hậu hiện đại thế kỷ XXI',
        ],
        correctIndex: 1,
        explanation: `Công trình mang đậm dấu ấn phong cách ${style}, gắn với ${architect}.`,
      },
      {
        question: `Giá trị lịch sử – văn hóa nổi bật của "${site.officialName}" trong hệ thống 17 di tích Đông Nam Bộ là gì?`,
        options: [
          'A. Chỉ là phế tích giả định không còn dấu vết thực địa',
          'B. Công trình thương mại mới xây dựng sau năm 2020',
          `C. ${site.summary.slice(0, 125)}${site.summary.length > 125 ? '...' : ''}`,
          'D. Pháo đài phòng thủ băng giá vùng Bắc Cực',
        ],
        correctIndex: 2,
        explanation: site.summary,
      },
    ],
  };
}

app.post('/api/gemini/curator-assist', async (req, res) => {
  try {
    const body = req.body as CuratorAssistRequestBody;
    if (!body || !body.action || !body.site || !body.site.officialName) {
      res.status(400).json({ error: 'Thiếu dữ liệu di tích hoặc loại tác vụ AI.' });
      return;
    }

    const { action, site } = body;

    const systemInstruction = `${
      action === 'translate'
        ? 'Bạn là Chuyên gia Giám tuyển Bảo tàng & Biên dịch Di sản học thuật đa ngôn ngữ (Tiếng Việt, English, 中文) tại Bảo tàng Số Dấu Ấn Việt 3D. Hãy biên soạn cô đọng, chuẩn xác thuật ngữ kiến trúc - lịch sử Đông Nam Bộ, văn phong trang trọng, bám sát kho sử liệu 17 di tích.'
        : 'Bạn là Giáo sư Sử học & Chuyên gia Thiết kế Học liệu Số GDPT 2018 tại Bảo tàng Số Dấu Ấn Việt 3D. Hãy biên soạn bộ 3 câu hỏi trắc nghiệm lịch sử - kiến trúc - địa chất chính xác 100%, bám sát tư liệu di tích, có 4 lựa chọn rõ ràng và phần giải thích ngắn gọn sâu sắc.'
    }

${buildFull17SitesKnowledgeContext(site.id)}

${APP_FUNCTIONAL_MAP_CONTEXT}`;

    const prompt =
      action === 'translate'
        ? `Hãy biên soạn và dịch hồ sơ tóm tắt di tích sau sang Tiếng Việt học thuật (chỉn chu, giàu giá trị di sản), Tiếng Anh (English) và Tiếng Trung (简体中文):
- Mã di tích: ${site.id}
- Tên chính thức: ${site.officialName}
- Niên đại: ${site.chronology || 'Đang cập nhật'}
- Khu vực: ${site.district || 'Đông Nam Bộ'}
- Phong cách kiến trúc: ${site.architecturalStyle || 'Di sản kiến trúc'}
- Nội dung tiếng Việt hiện tại: ${site.summary}`
        : `Dựa trên hồ sơ lịch sử - kiến trúc thực tế của di tích dưới đây, hãy tạo đúng 3 câu hỏi trắc nghiệm lịch sử/kiến trúc bằng Tiếng Việt dành cho học sinh và du khách tham quan bảo tàng số:
- Mã di tích: ${site.id}
- Tên di tích: ${site.officialName}
- Niên đại: ${site.chronology || 'Đang cập nhật'}
- Khu vực: ${site.district || 'Đông Nam Bộ'}
- Phong cách kiến trúc: ${site.architecturalStyle || ''}
- Tóm tắt hồ sơ: ${site.summary}
Mỗi câu hỏi có đúng 4 đáp án (bắt đầu bằng A., B., C., D.), chỉ số correctIndex (0..3) và lời giải thích ngắn gọn.`;

    const responseSchema =
      action === 'translate'
        ? {
            type: Type.OBJECT,
            properties: {
              summaryVi: { type: Type.STRING },
              summaryEn: { type: Type.STRING },
              summaryZh: { type: Type.STRING },
              officialNameEn: { type: Type.STRING },
              officialNameZh: { type: Type.STRING },
              architecturalStyleEn: { type: Type.STRING },
              architecturalStyleZh: { type: Type.STRING },
            },
            required: [
              'summaryVi',
              'summaryEn',
              'summaryZh',
              'officialNameEn',
              'officialNameZh',
              'architecturalStyleEn',
              'architecturalStyleZh',
            ],
          }
        : {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: ['question', 'options', 'correctIndex', 'explanation'],
                },
              },
            },
            required: ['questions'],
          };

    try {
      const result = await callSmartGeminiFlashRouter({
        contents: prompt,
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.3,
      });

      const parsed = JSON.parse(result.text);
      res.json({
        data: parsed,
        modelUsed: result.modelUsed,
      });
    } catch {
      res.json({
        data: buildCuratorAssistServerFallback(body),
        modelUsed: 'scholarly-curator-fallback',
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi Gemini AI Curator';
    res.status(500).json({ error: message });
  }
});

interface SupportReplyRequestBody {
  message: string;
  history?: Array<{ role: 'visitor' | 'assistant'; text: string }>;
  category?: string;
  categoryLabel?: string;
  relatedSite?: {
    id: string;
    officialName: string;
    district?: string;
    chronology?: string;
    architecturalStyle?: string;
    summary?: string;
  } | null;
  allSitesSummary?: string;
  senderName?: string;
  ownerEmail?: string;
  supportTier?: string;
  fastTrack?: boolean;
}

app.post('/api/gemini/support-reply', async (req, res) => {
  try {
    const body = req.body as SupportReplyRequestBody;
    if (!body || !body.message || !body.message.trim()) {
      res.status(400).json({ error: 'Thiếu nội dung câu hỏi hỗ trợ của du khách.' });
      return;
    }

    const historyText = (body.history || [])
      .slice(-8)
      .map((turn) => `${turn.role === 'visitor' ? 'Du khách' : 'Trợ lý'}: ${turn.text}`)
      .join('\n');

    const siteInfo = body.relatedSite
      ? `Di tích đang liên quan: ${body.relatedSite.officialName} (${body.relatedSite.id}, ${body.relatedSite.district || ''}, niên đại ${body.relatedSite.chronology || ''}).`
      : 'Chưa chọn di tích cụ thể trong biểu mẫu.';

    const isFastTrack =
      Boolean(body.fastTrack) ||
      body.supportTier === 'vip_fast_track' ||
      body.supportTier === 'tester_report' ||
      body.supportTier === 'admin';
    const supportModel =
      body.supportTier === 'admin'
        ? 'gemini-4-argon'
        : isFastTrack
        ? 'gemini-4-hydrogen'
        : body.supportTier === 'standard_19k'
        ? 'gemini-3.5-flash'
        : 'gemini-2.5-flash';

    const fastTrackDirective = isFastTrack
      ? '\n6. CHẾ ĐỘ HỖ TRỢ ƯU TIÊN NHANH (FAST-TRACK): Du khách thuộc gói Cao cấp / Tester Pro — hãy giải đáp sâu sắc, chuẩn xác, nêu rõ bước xử lý triệt để ngay trong phản hồi này.'
      : '';

    const systemInstruction = `Bạn là Trợ lý Hỗ trợ Du khách chuyên nghiệp của Bảo tàng Số "Dấu Ấn Việt 3D".

KỶ LUẬT PHẢN HỒI BẮT BUỘC:
1. TRẢ LỜI THẲNG VÀO CÂU HỎI NGAY CÂU ĐẦU TIÊN, súc tích trong **3 đến 5 câu** tiếng Việt tự nhiên, lịch sự.
   - TUYỆT ĐỐI KHÔNG chào hỏi dài dòng hay xả hướng dẫn chung chung ngoài nội dung khách hỏi.
2. KHI KHÁCH HỎI VỀ SỬ LIỆU / KIẾN TRÚC / ĐỊA ĐIỂM / GIÁ VÉ / GIỜ MỞ CỬA:
   - Trích dẫn chính xác số liệu, niên đại, kiến trúc sư, vật liệu từ Kho Sử liệu 17 Di tích Đông Nam Bộ dưới đây. Không suy diễn ngoài sử liệu.
3. KHI KHÁCH HỎI CÁCH DÙNG WEB HOẶC BÁO LỖI KỸ THUẬT:
   - Chỉ rõ từng bước theo đúng tên tab và nút bấm thật trên web trong Sơ đồ Chức năng dưới đây (ví dụ: tab "Khám phá", "Không gian 3D", "Bóc tách kiến trúc", "X-Ray", "Studio / Ban ngày / Hoàng hôn / Đêm", "Bản đồ & Tuyến", "Thấu kính Bản đồ Lịch sử 1815", "Hồ sơ Di sản", "Video Tư liệu Flycam", "Vé & Học liệu", "Thuyết minh", nút "(?)").
4. KHI KHÁCH HỎI VIỆC NGOÀI CHUYÊN MÔN (ngoài bảo tàng, lịch sử Đông Nam Bộ hoặc cách dùng web):
   - Từ chối lịch sự trong đúng 1 câu và mời khách đặt câu hỏi về 17 di tích.
5. KHI KHÁCH YÊU CẦU GẶP NGƯỜI THẬT / ADMIN (ví dụ: "gặp admin", "liên hệ quản trị viên", "liên hệ ban quản lý", "gặp người thật", "khiếu nại", ...):
   - Đặt \`escalateToAdmin: true\`, \`priority: "Cao"\`.
   - Phần \`reply\` xác nhận ngắn gọn trong đúng 2 câu: báo đã chuyển phiếu sang trạng thái "Chờ Quản trị viên phản hồi" và đã gửi thông báo ưu tiên tới Ban Quản lý (bivsmoon2023@gmail.com).${fastTrackDirective}

${buildFull17SitesKnowledgeContext(body.relatedSite?.id)}

${APP_FUNCTIONAL_MAP_CONTEXT}`;

    const prompt = `Hồ sơ du khách: ${body.senderName || 'Du khách'}${body.ownerEmail ? ` (${body.ownerEmail})` : ''}
Gói hỗ trợ: ${body.supportTier || 'standard_19k'}
Nhóm vấn đề: ${body.categoryLabel || body.category || 'Chung'}
${siteInfo}
${historyText ? `Lịch sử hội thoại của riêng du khách này:\n${historyText}\n` : ''}
Câu hỏi mới nhất của du khách: "${body.message.trim()}"`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        escalateToAdmin: { type: Type.BOOLEAN },
        priority: { type: Type.STRING },
        reply: { type: Type.STRING },
      },
      required: ['escalateToAdmin', 'priority', 'reply'],
    };

    try {
      const result = await callSmartGeminiFlashRouter({
        contents: prompt,
        systemInstruction,
        preferredModel: supportModel,
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.3,
      });

      const parsed = JSON.parse(result.text);
      res.json({
        escalateToAdmin: Boolean(parsed.escalateToAdmin),
        priority: parsed.priority === 'Cao' || parsed.priority === 'Trung bình' ? parsed.priority : 'Thông thường',
        reply: String(parsed.reply || '').trim(),
        modelUsed: result.modelUsed,
      });
    } catch {
      const qLower = body.message.toLowerCase();
      const wantsAdmin = /gặp admin|quản trị viên|ban quản lý|người thật|khiếu nại/i.test(qLower);
      const matched =
        (body.relatedSite?.id ? HERITAGE_SITES.find((s) => s.id === body.relatedSite?.id) : null) ||
        HERITAGE_SITES[0];
      const fallbackReply = wantsAdmin
        ? `Phiếu hỗ trợ của bạn đã được chuyển sang trạng thái "Chờ Quản trị viên phản hồi". Ban Quản lý (bivsmoon2023@gmail.com) đã nhận được thông báo ưu tiên và sẽ phản hồi trực tiếp tại đây.`
        : `${matched.officialName} (${matched.chronology}) tọa lạc tại ${matched.address.houseNumber} ${matched.address.street}, ${matched.address.district}, mang phong cách ${matched.architecturalStyle} (${matched.openingHours} · ${matched.ticketPrices}). Bạn có thể mở tab "Không gian 3D" để xoay 360°, bật "Bóc tách kiến trúc" / "X-Ray", hoặc vào tab "Hồ sơ Di sản" và "Vé & Học liệu" để tra cứu chi tiết.`;
      res.json({
        escalateToAdmin: wantsAdmin,
        priority: wantsAdmin ? 'Cao' : 'Thông thường',
        reply: fallbackReply,
        modelUsed: 'scholarly-support-fallback',
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi Gemini AI Support';
    res.status(500).json({ error: message });
  }
});

interface AdminSupportDraftRequestBody {
  ticketCode: string;
  senderName: string;
  ownerEmail?: string;
  categoryLabel: string;
  description: string;
  relatedSiteId?: string;
  relatedSiteName?: string;
  history?: Array<{ role: 'visitor' | 'assistant' | 'admin'; text: string }>;
}

app.post('/api/gemini/admin-support-draft', async (req, res) => {
  try {
    const body = req.body as AdminSupportDraftRequestBody;
    if (!body || !body.description) {
      res.status(400).json({ error: 'Thiếu nội dung phiếu hỗ trợ cần soạn thảo.' });
      return;
    }

    const historyText = (body.history || [])
      .slice(-8)
      .map((turn) => {
        const who = turn.role === 'visitor' ? 'Du khách' : turn.role === 'admin' ? 'Quản trị viên' : 'Trợ lý';
        return `${who}: ${turn.text}`;
      })
      .join('\n');

    const systemInstruction = `Bạn là Lõi 02 — Chăm sóc & Phản hồi Du khách hỗ trợ Quản trị viên trong Admin Studio của Bảo tàng Số "Dấu Ấn Việt 3D".
Nhiệm vụ: Soạn thảo bản nháp câu trả lời trang trọng, chuẩn xác thay mặt Ban Quản lý Bảo tàng gửi tới du khách.
Yêu cầu:
- Trả lời thẳng vào vấn đề của du khách ngay câu đầu tiên, độ dài 3–5 câu súc tích.
- Lồng ghép chính xác dữ kiện lịch sử, kiến trúc, niên đại, giờ mở cửa hoặc thao tác nút bấm thực tế của di tích liên quan (nếu có).
- Xưng hô "Ban Quản lý Dấu Ấn Việt 3D" và gọi tên du khách lịch sự.

${buildFull17SitesKnowledgeContext(body.relatedSiteId)}

${APP_FUNCTIONAL_MAP_CONTEXT}`;

    const prompt = `Phiếu hỗ trợ: ${body.ticketCode}
Du khách: ${body.senderName}${body.ownerEmail ? ` (ownerEmail: ${body.ownerEmail})` : ''}
Nhóm vấn đề: ${body.categoryLabel}
Di tích liên quan: ${body.relatedSiteName || body.relatedSiteId || 'Chung toàn hệ thống'}
Nội dung yêu cầu ban đầu: "${body.description}"
${historyText ? `Lịch sử trao đổi gần nhất:\n${historyText}` : ''}`;

    try {
      const result = await callSmartGeminiFlashRouter({
        contents: prompt,
        systemInstruction,
        temperature: 0.3,
      });

      res.json({
        draft: result.text,
        modelUsed: result.modelUsed,
      });
    } catch {
      const siteLabel = body.relatedSiteName || 'hệ thống Bảo tàng Số Dấu Ấn Việt 3D';
      res.json({
        draft: `Chào bạn ${body.senderName || 'Du khách'}, Ban Quản lý Dấu Ấn Việt 3D đã tiếp nhận phiếu ${body.ticketCode} về "${body.categoryLabel}" liên quan đến ${siteLabel}. Chúng tôi đã kiểm tra dữ liệu vận hành và cập nhật hướng dẫn chi tiết trên hệ thống để bạn thuận tiện tra cứu. Nếu cần hỗ trợ thêm trong quá trình trải nghiệm Không gian 3D hoặc Vé & Học liệu, bạn vui lòng phản hồi trực tiếp tại phiếu này.`,
        modelUsed: 'scholarly-admin-draft-fallback',
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi Gemini AI Admin Draft';
    res.status(500).json({ error: message });
  }
});

interface ReviewReplyRequestBody {
  visitorName: string;
  rating: number;
  favoriteSiteName?: string;
  tags?: string[];
  comment: string;
}

app.post('/api/gemini/review-reply', async (req, res) => {
  try {
    const body = req.body as ReviewReplyRequestBody;
    if (!body || !body.comment) {
      res.status(400).json({ error: 'Thiếu nội dung đánh giá của du khách.' });
      return;
    }

    const matchedSite = body.favoriteSiteName
      ? HERITAGE_SITES.find((s) =>
          s.officialName.toLowerCase().includes(body.favoriteSiteName!.toLowerCase()) ||
          body.favoriteSiteName!.toLowerCase().includes(s.officialName.toLowerCase())
        )
      : undefined;

    const systemInstruction = `Bạn là Lõi 02 — Trợ lý Vận hành Chăm sóc Du khách trong Admin Studio của Bảo tàng Số "Dấu Ấn Việt 3D".
Hãy viết lời cảm ơn & phản hồi **cá nhân hóa** bằng tiếng Việt tự nhiên, chân thành, súc tích (**2 đến 4 câu**), nhắc đúng ý nhận xét cụ thể, tính năng web hoặc nét đặc sắc lịch sử – kiến trúc của di tích mà du khách đã chia sẻ (tuyệt đối không dùng văn mẫu sáo rỗng). Nếu du khách chấm <= 3 sao hoặc góp ý lỗi, hãy xin lỗi chân thành và nêu rõ hướng kiểm tra/khắc phục theo đúng sơ đồ web.

${buildFull17SitesKnowledgeContext(matchedSite?.id)}

${APP_FUNCTIONAL_MAP_CONTEXT}`;

    const prompt = `Hồ sơ đánh giá của du khách:
- Tên du khách: ${body.visitorName || 'Du khách'}
- Số sao: ${body.rating}/5
- Di tích ấn tượng: ${body.favoriteSiteName || 'Không chỉ định'}
- Thẻ cảm nhận: ${(body.tags || []).join(', ') || 'Không có'}
- Nội dung góp ý: "${body.comment}"`;

    try {
      const result = await callSmartGeminiFlashRouter({
        contents: prompt,
        systemInstruction,
        temperature: 0.3,
      });

      res.json({ reply: result.text, modelUsed: result.modelUsed });
    } catch {
      const siteTitle = body.favoriteSiteName || matchedSite?.officialName || 'Bảo tàng Số Dấu Ấn Việt 3D';
      const replyText =
        body.rating >= 4
          ? `Chân thành cảm ơn ${body.visitorName || 'bạn'} đã dành tặng ${body.rating}★ sau khi trải nghiệm ${siteTitle}. Chia sẻ của bạn là nguồn động lực lớn để Ban Quản lý Dấu Ấn Việt 3D tiếp tục hoàn thiện 17 mô hình 3D và kho sử liệu Đông Nam Bộ.`
          : `Xin cảm ơn ${body.visitorName || 'bạn'} đã thẳng thắn góp ý (${body.rating}★) về ${siteTitle}. Ban Quản lý Dấu Ấn Việt 3D đã ghi nhận phản hồi của bạn và chuyển bộ phận kỹ thuật kiểm tra, tối ưu ngay.`;
      res.json({ reply: replyText, modelUsed: 'scholarly-review-fallback' });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi Gemini AI Review Reply';
    res.status(500).json({ error: message });
  }
});

const PUBLIC_ROOT_DIR = path.resolve(__dirname, 'public');
const HERITAGE_DATA_TS_FILE = path.resolve(__dirname, 'src', 'data', 'heritageData.ts');

const CANONICAL_GLB_FILENAMES: Record<string, string> = {
  'HCM-DT-001': 'dinhdoclap.glb',
  'BRVT-DT-001': 'dinh-bao-dai.glb',
};

function sanitizeSiteIdToken(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '');
}

function updateHeritageDataSourceFile(
  siteId: string,
  patch: { glbUrl?: string; photoSlot?: 0 | 1; photoUrl?: string }
): void {
  try {
    if (!fs.existsSync(HERITAGE_DATA_TS_FILE)) return;
    const raw = fs.readFileSync(HERITAGE_DATA_TS_FILE, 'utf-8');
    const marker = 'export const DEFAULT_HERITAGE_SITES: HeritageSite[] = ';
    const idx = raw.indexOf(marker);
    const tailMarker = ';\n\nexport const HERITAGE_SITES:';
    const endIdx = raw.lastIndexOf(tailMarker);
    if (idx === -1 || endIdx === -1) return;

    const sites = JSON.parse(raw.slice(idx + marker.length, endIdx)) as Array<Record<string, any>>;
    const target = sites.find((s) => s && s.id === siteId);
    if (!target) return;

    if (typeof patch.glbUrl === 'string') {
      target.model3DUrl = patch.glbUrl;
      if (target.config3D && typeof target.config3D === 'object') {
        target.config3D.glbUrl = patch.glbUrl;
      }
    }

    if (typeof patch.photoSlot === 'number' && typeof patch.photoUrl === 'string') {
      const photos = Array.isArray(target.photos) ? [...target.photos] : ['', ''];
      photos[patch.photoSlot] = patch.photoUrl;
      target.photos = photos;
    }

    const updated =
      raw.slice(0, idx + marker.length) + JSON.stringify(sites, null, 2) + raw.slice(endIdx);
    const tmpFile = `${HERITAGE_DATA_TS_FILE}.tmp`;
    fs.writeFileSync(tmpFile, updated, 'utf-8');
    fs.renameSync(tmpFile, HERITAGE_DATA_TS_FILE);
  } catch (err) {
    console.warn('[Assets] Could not update src/data/heritageData.ts:', err);
  }
}

app.post(
  '/api/assets/upload-glb',
  express.raw({ type: '*/*', limit: '250mb' }),
  (req, res) => {
    try {
      const siteId = sanitizeSiteIdToken(String(req.query.siteId || ''));
      const rawFileName = String(req.query.fileName || '');
      const rawBody = req.body;
      if (!siteId || !Buffer.isBuffer(rawBody) || rawBody.length === 0) {
        res.status(400).json({ error: 'Thiếu siteId hoặc dữ liệu nhị phân tệp .glb.' });
        return;
      }

      const cleanedBase = path
        .basename(rawFileName || `${siteId}.glb`)
        .replace(/[^a-zA-Z0-9._-]/g, '-');
      const lowerExt = path.extname(cleanedBase).toLowerCase();
      if (lowerExt !== '.glb' && lowerExt !== '.gltf') {
        res.status(400).json({ error: 'Chỉ chấp nhận tệp mô hình 3D .glb hoặc .gltf.' });
        return;
      }

      const targetFileName =
        CANONICAL_GLB_FILENAMES[siteId] && rawFileName.toLowerCase().endsWith('.glb')
          ? CANONICAL_GLB_FILENAMES[siteId]
          : cleanedBase;

      if (!fs.existsSync(PUBLIC_ROOT_DIR)) {
        fs.mkdirSync(PUBLIC_ROOT_DIR, { recursive: true });
      }
      const targetPath = path.join(PUBLIC_ROOT_DIR, targetFileName);
      fs.writeFileSync(targetPath, rawBody);

      const publicUrl = `/${targetFileName}`;
      updateHeritageDataSourceFile(siteId, { glbUrl: publicUrl });

      const state = readServerSyncState();
      state.customGlbUrls = {
        ...state.customGlbUrls,
        [siteId]: publicUrl,
      };
      writeServerSyncState(state);

      res.json({
        ok: true,
        siteId,
        publicUrl,
        fileName: targetFileName,
        fileSize: rawBody.length,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lỗi lưu tệp .glb vào public/';
      res.status(500).json({ error: message });
    }
  }
);

app.post(
  '/api/assets/upload-image',
  express.raw({ type: '*/*', limit: '30mb' }),
  (req, res) => {
    try {
      const siteId = sanitizeSiteIdToken(String(req.query.siteId || ''));
      const slotRaw = Number(req.query.slot);
      const slot: 0 | 1 = slotRaw === 1 ? 1 : 0;
      const extRaw = String(req.query.ext || 'jpg')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const ext = extRaw === 'png' || extRaw === 'webp' ? extRaw : 'jpg';
      const rawBody = req.body;

      if (!siteId || !Buffer.isBuffer(rawBody) || rawBody.length === 0) {
        res.status(400).json({ error: 'Thiếu siteId hoặc dữ liệu ảnh tải lên.' });
        return;
      }

      const heritageImagesDir = path.join(PUBLIC_ROOT_DIR, 'images', 'heritage');
      if (!fs.existsSync(heritageImagesDir)) {
        fs.mkdirSync(heritageImagesDir, { recursive: true });
      }

      const fileName = `${siteId}-${slot + 1}.${ext}`;
      const targetPath = path.join(heritageImagesDir, fileName);
      fs.writeFileSync(targetPath, rawBody);

      const publicUrl = `/images/heritage/${fileName}`;
      updateHeritageDataSourceFile(siteId, { photoSlot: slot, photoUrl: publicUrl });

      const state = readServerSyncState();
      const prevPair =
        state.customSitePhotos &&
        typeof state.customSitePhotos[siteId] === 'object' &&
        state.customSitePhotos[siteId] !== null
          ? (state.customSitePhotos[siteId] as Record<string, string>)
          : {};
      state.customSitePhotos = {
        ...state.customSitePhotos,
        [siteId]: {
          ...prevPair,
          [slot === 0 ? 'photo1' : 'photo2']: publicUrl,
          updatedAt: new Date().toISOString(),
        },
      };
      state.customSitePhotosUpdatedAt = new Date().toISOString();
      writeServerSyncState(state);

      res.json({
        ok: true,
        siteId,
        slot,
        publicUrl,
        fileName,
        fileSize: rawBody.length,
        updatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Lỗi lưu tệp ảnh vào public/images/heritage/';
      res.status(500).json({ error: message });
    }
  }
);

async function startServer() {
  if (fs.existsSync(PUBLIC_ROOT_DIR)) {
    app.use(express.static(PUBLIC_ROOT_DIR));
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

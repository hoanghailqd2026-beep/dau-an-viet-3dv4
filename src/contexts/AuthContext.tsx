import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  PRIMARY_ADMIN_EMAIL,
  ADMIN_EMAILS_STORAGE_KEY,
  ADMIN_EMAILS_UPDATED_EVENT,
  AUTH_SESSION_STORAGE_KEY,
  ACCOUNT_LOCKS_STORAGE_KEY,
  ACCOUNT_LOCKS_UPDATED_EVENT,
  authenticateWithPassword,
  changeAdminPasswordHash,
  changeLocalUserAccountPassword,
  updateLocalUserDisplayName,
  deriveStableUserId,
  ensureAdminPasswordHashSeeded,
  fetchUsersFromCloudApi,
  hasRegisteredUserPassword,
  isAccountIdentifierLocked,
  isUserAccountLocked,
  pushSyncPatchToServer,
  registerOAuthVerifiedSession,
  registerQuickJudgeSession,
  restoreAccountFromTransferCode,
  syncLocalBootstrapSnapshotToServer,
  syncStateFromServer,
  appendAuditLog,
  resetLoginShieldStatus,
  getVisitorRecord,
  VISITORS_UPDATED_EVENT,
  PASSES_UPDATED_EVENT,
  TESTER_ALLOWLIST_UPDATED_EVENT,
  SUBSCRIPTION_TIER_UPDATED_EVENT,
  UserEntitlementsSnapshot,
  UserAccountTier,
  getEffectiveUserEntitlements,
  isEmailTesterAllowlisted,
  setLocalTesterModeEnabled,
  persistSimpleUserTier,
  ACCOUNTS_DB_UPDATED_EVENT,
  SUBSCRIPTION_TIER_STORAGE_KEY,
  upsertAccountDbRecord,
} from '../utils/adminPlatformStore';
import {
  signInWithFirebaseGoogle,
  signOutFirebaseAuth,
  onFirebaseAuthUserChanged,
  updateFirebaseDisplayName,
  updateFirebaseEmailPassword,
  getCurrentFirebaseProviderIds,
  type FirebaseSignedInProfile,
  type SupportedAuthLanguage,
} from '../lib/firebaseAuth';
import {
  syncUserProfileToFirebaseRealtimeDb,
  pullUserProfileFromFirebaseRealtimeDb,
  pullUserRoleFromFirebaseRealtimeDb,
  pushAccountsToFirebase,
} from '../utils/firebaseRestSync';
import {
  clearCurrentSessionLoginAuditMarker,
  recordLoginAuditIfNewSession,
  savePersonalProfile,
} from '../utils/accountActivityStore';
import {
  broadcastCrossTabEvent,
  subscribeCrossTabEvents,
} from '../utils/realtimeCloudSync';
import { clearAllGateLetterSessionFlags } from '../components/guide/MuseumOpeningGateLetter';

export { PRIMARY_ADMIN_EMAIL, ADMIN_EMAILS_STORAGE_KEY, AUTH_SESSION_STORAGE_KEY };

export type AuthProviderType = 'google' | 'facebook';
export type UserRole = 'admin' | 'visitor';
export type TesterActivationSource = 'allowlist' | 'beta' | null;

export interface AuthUser {
  id: string;
  userId: string;
  firebaseUid?: string;
  provider: AuthProviderType;
  email: string;
  displayName: string;
  avatarInitials: string;
  photoURL?: string;
  role: UserRole;
  isPrimaryAdmin: boolean;
  isBetaTester: boolean;
  loggedInAt: string;
  authMethod: 'password_verified' | 'oauth_sdk' | 'judge_quick_access';
}

export interface AuthLoginResult {
  ok: boolean;
  error?: string;
  user?: AuthUser;
  isNewAccount?: boolean;
}

export interface OpenAuthModalOptions {
  prompt?: string;
  onSuccess?: (user: AuthUser) => void;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPrimaryAdmin: boolean;
  isTesterPro: boolean;
  testerModeSource: TesterActivationSource;
  userTier: UserAccountTier;
  entitlements: UserEntitlementsSnapshot;
  refreshEntitlements: () => void;
  primaryAdminEmail: string;
  secondaryAdminEmails: string[];
  isAuthModalOpen: boolean;
  authGatePrompt: string | null;
  openAuthModal: (options?: OpenAuthModalOptions | unknown) => void;
  closeAuthModal: () => void;
  checkAccountPasswordExists: (provider: AuthProviderType, identifier: string) => boolean;
  loginWithGoogle: (
    emailInput: string,
    passwordInput: string,
    displayNameInput?: string
  ) => Promise<AuthLoginResult>;
  loginWithFacebook: (
    accountNameInput: string,
    passwordInput: string,
    emailInput?: string
  ) => Promise<AuthLoginResult>;
  completeOAuthLogin: (params: {
    provider: AuthProviderType;
    identifier: string;
    email?: string;
    displayName: string;
  }) => Promise<AuthLoginResult>;
  signInWithFirebaseGoogleAccount: (lang?: SupportedAuthLanguage) => Promise<AuthLoginResult>;
  loginAsJudge: () => Promise<AuthLoginResult>;
  loginWithTransferCode: (transferCode: string) => Promise<AuthLoginResult>;
  changeAdminPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  updateUserProfile: (params: {
    displayName: string;
    phone: string;
  }) => Promise<{ ok: boolean; syncedFirebase?: boolean; error?: string }>;
  changeUserPassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  addAdminEmail: (emailInput: string) => { ok: boolean; error?: string };
  removeAdminEmail: (emailInput: string) => { ok: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function normalizeEmail(value: string): string {
  return value.toLowerCase().trim();
}

function isValidEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function deriveInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'DA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function deriveDisplayNameFromEmail(email: string): string {
  const local = email.split('@')[0] || 'Khách tham quan';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return email;
  return cleaned
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function readSecondaryAdminEmailsFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ADMIN_EMAILS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const unique = new Set<string>();
    for (const item of parsed) {
      if (typeof item === 'string') {
        const norm = normalizeEmail(item);
        if (norm && norm !== PRIMARY_ADMIN_EMAIL && isValidEmailFormat(norm)) {
          unique.add(norm);
        }
      }
    }
    return Array.from(unique);
  } catch {
    return [];
  }
}

function writeSecondaryAdminEmailsToStorage(emails: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ADMIN_EMAILS_STORAGE_KEY, JSON.stringify(emails));
  } catch {
    // ignore storage quota errors
  }
}

function resolveUserRole(
  provider: AuthProviderType,
  normalizedEmail: string,
  secondaryAdminEmails: string[]
): { role: UserRole; isPrimaryAdmin: boolean } {
  if (provider !== 'google' || !normalizedEmail) {
    return { role: 'visitor', isPrimaryAdmin: false };
  }
  if (normalizedEmail === PRIMARY_ADMIN_EMAIL) {
    return { role: 'admin', isPrimaryAdmin: true };
  }
  if (secondaryAdminEmails.includes(normalizedEmail)) {
    return { role: 'admin', isPrimaryAdmin: false };
  }
  return { role: 'visitor', isPrimaryAdmin: false };
}

function readPersistedSession(secondaryAdminEmails: string[]): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser> | null;
    if (!parsed || (parsed.provider !== 'google' && parsed.provider !== 'facebook')) {
      return null;
    }
    // Enforce that legacy unverified sessions cannot bypass SHA-256 verification
    if (
      !parsed.userId ||
      (parsed.authMethod !== 'password_verified' &&
        parsed.authMethod !== 'oauth_sdk' &&
        parsed.authMethod !== 'judge_quick_access')
    ) {
      return null;
    }
    const normalizedEmail = typeof parsed.email === 'string' ? normalizeEmail(parsed.email) : '';
    const displayName =
      typeof parsed.displayName === 'string' && parsed.displayName.trim()
        ? parsed.displayName.trim()
        : deriveDisplayNameFromEmail(normalizedEmail || 'Du khách');

    const { role, isPrimaryAdmin } = resolveUserRole(
      parsed.provider,
      normalizedEmail,
      secondaryAdminEmails
    );

    if (!isPrimaryAdmin && normalizedEmail !== PRIMARY_ADMIN_EMAIL && isUserAccountLocked(parsed.userId)) {
      return null;
    }

    const visitorRec = getVisitorRecord(parsed.userId);
    const isBetaTester =
      role === 'admin' || Boolean(visitorRec?.isBetaTester ?? parsed.isBetaTester);

    return {
      id: typeof parsed.id === 'string' && parsed.id ? parsed.id : parsed.userId,
      userId: parsed.userId,
      firebaseUid: typeof parsed.firebaseUid === 'string' ? parsed.firebaseUid : undefined,
      provider: parsed.provider,
      email: normalizedEmail,
      displayName,
      avatarInitials: deriveInitials(displayName),
      photoURL: typeof parsed.photoURL === 'string' && parsed.photoURL ? parsed.photoURL : undefined,
      role,
      isPrimaryAdmin,
      isBetaTester,
      loggedInAt:
        typeof parsed.loggedInAt === 'string' ? parsed.loggedInAt : new Date().toISOString(),
      authMethod: parsed.authMethod,
    };
  } catch {
    return null;
  }
}

function writePersistedSession(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!user) {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } else {
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore storage quota errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [secondaryAdminEmails, setSecondaryAdminEmails] = useState<string[]>(() =>
    readSecondaryAdminEmailsFromStorage()
  );
  const [user, setUser] = useState<AuthUser | null>(() =>
    readPersistedSession(readSecondaryAdminEmailsFromStorage())
  );
  const [entitlementRevision, setEntitlementRevision] = useState<number>(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authGatePrompt, setAuthGatePrompt] = useState<string | null>(null);
  const pendingAuthActionRef = useRef<((loggedInUser: AuthUser) => void) | null>(null);
  const userRef = useRef<AuthUser | null>(user);
  const manualLogoutRef = useRef<boolean>(false);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Seed default Admin SHA-256 digest cleanly on startup and clear any visitor tester-mode toggle
  useEffect(() => {
    void ensureAdminPasswordHashSeeded();
    setLocalTesterModeEnabled(false);
  }, []);

  // Sync permission changes across tabs or when secondary admin list changes
  useEffect(() => {
    setUser((prev) => {
      if (!prev) return null;
      if (prev.authMethod === 'judge_quick_access') return prev;
      const { role, isPrimaryAdmin } = resolveUserRole(
        prev.provider,
        prev.email,
        secondaryAdminEmails
      );
      if (prev.role === role && prev.isPrimaryAdmin === isPrimaryAdmin) {
        return prev;
      }
      const updated: AuthUser = { ...prev, role, isPrimaryAdmin };
      writePersistedSession(updated);
      return updated;
    });
  }, [secondaryAdminEmails]);

  useEffect(() => {
    const syncAccountLockState = () => {
      setUser((prev) => {
        if (!prev || prev.isPrimaryAdmin || prev.email === PRIMARY_ADMIN_EMAIL) return prev;
        if (isUserAccountLocked(prev.userId)) {
          writePersistedSession(null);
          return null;
        }
        return prev;
      });
    };
    const syncBetaTesterFromRegistry = () => {
      setUser((prev) => {
        if (!prev) return prev;
        if (prev.authMethod === 'judge_quick_access') return prev;
        const visitorRec = getVisitorRecord(prev.userId);
        const nextBeta = prev.role === 'admin' || Boolean(visitorRec?.isBetaTester);
        if (prev.isBetaTester === nextBeta) return prev;
        const updated: AuthUser = { ...prev, isBetaTester: nextBeta };
        writePersistedSession(updated);
        return updated;
      });
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ADMIN_EMAILS_STORAGE_KEY) {
        const nextAdmins = readSecondaryAdminEmailsFromStorage();
        setSecondaryAdminEmails(nextAdmins);
      } else if (e.key === AUTH_SESSION_STORAGE_KEY) {
        const currentAdmins = readSecondaryAdminEmailsFromStorage();
        setUser(readPersistedSession(currentAdmins));
      } else if (e.key === ACCOUNT_LOCKS_STORAGE_KEY) {
        syncAccountLockState();
      } else if (e.key === 'dau_an_viet_visitors_registry_v1') {
        syncBetaTesterFromRegistry();
      } else if (
        e.key === SUBSCRIPTION_TIER_STORAGE_KEY ||
        e.key === 'dau_an_viet_accounts_db_v1'
      ) {
        setEntitlementRevision((r) => r + 1);
      }
    };
    const bumpEntitlements = () => setEntitlementRevision((r) => r + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener(ACCOUNT_LOCKS_UPDATED_EVENT, syncAccountLockState);
    window.addEventListener(VISITORS_UPDATED_EVENT, syncBetaTesterFromRegistry);
    window.addEventListener(PASSES_UPDATED_EVENT, bumpEntitlements);
    window.addEventListener(TESTER_ALLOWLIST_UPDATED_EVENT, bumpEntitlements);
    window.addEventListener(SUBSCRIPTION_TIER_UPDATED_EVENT, bumpEntitlements);
    window.addEventListener(ACCOUNTS_DB_UPDATED_EVENT, bumpEntitlements);
    const syncAdminsFromServer = () => {
      setSecondaryAdminEmails(readSecondaryAdminEmailsFromStorage());
    };
    window.addEventListener(ADMIN_EMAILS_UPDATED_EVENT, syncAdminsFromServer);

    // Instant cross-tab AUTH_LOGOUT / AUTH_LOGIN via BroadcastChannel('dau_an_viet_sync')
    const unsubCrossTabAuth = subscribeCrossTabEvents((msg) => {
      if (msg.type === 'AUTH_LOGOUT') {
        manualLogoutRef.current = true;
        clearCurrentSessionLoginAuditMarker();
        clearAllGateLetterSessionFlags();
        setUser(null);
        writePersistedSession(null);
        persistSimpleUserTier('free');
        void signOutFirebaseAuth().finally(() => {
          manualLogoutRef.current = false;
        });
      } else if (msg.type === 'AUTH_LOGIN') {
        const currentAdmins = readSecondaryAdminEmailsFromStorage();
        const restored = readPersistedSession(currentAdmins);
        if (restored) {
          setUser(restored);
        }
      }
    });

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ACCOUNT_LOCKS_UPDATED_EVENT, syncAccountLockState);
      window.removeEventListener(VISITORS_UPDATED_EVENT, syncBetaTesterFromRegistry);
      window.removeEventListener(PASSES_UPDATED_EVENT, bumpEntitlements);
      window.removeEventListener(TESTER_ALLOWLIST_UPDATED_EVENT, bumpEntitlements);
      window.removeEventListener(SUBSCRIPTION_TIER_UPDATED_EVENT, bumpEntitlements);
      window.removeEventListener(ACCOUNTS_DB_UPDATED_EVENT, bumpEntitlements);
      window.removeEventListener(ADMIN_EMAILS_UPDATED_EVENT, syncAdminsFromServer);
      unsubCrossTabAuth();
    };
  }, []);

  const openAuthModal = useCallback((options?: OpenAuthModalOptions | unknown) => {
    void syncStateFromServer();
    if (
      options &&
      typeof options === 'object' &&
      !('nativeEvent' in options) &&
      ('prompt' in options || 'onSuccess' in options)
    ) {
      const opts = options as OpenAuthModalOptions;
      setAuthGatePrompt(opts.prompt || null);
      pendingAuthActionRef.current = opts.onSuccess || null;
    } else {
      setAuthGatePrompt(null);
      pendingAuthActionRef.current = null;
    }
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthGatePrompt(null);
    pendingAuthActionRef.current = null;
  }, []);

  const resolveAuthProviderLabel = useCallback((u: AuthUser): string => {
    const fbProviders = getCurrentFirebaseProviderIds();
    if (u.authMethod === 'oauth_sdk' || fbProviders.includes('google.com')) {
      return u.provider === 'facebook' ? 'Facebook OAuth' : 'Google Gmail';
    }
    if (u.authMethod === 'judge_quick_access') {
      return 'Truy cập Ban Giám Khảo';
    }
    if (u.provider === 'facebook') {
      return 'Facebook & Mật khẩu';
    }
    return 'Email & Mật khẩu';
  }, []);

  const finalizeAuthenticatedUser = useCallback(
    (nextUser: AuthUser) => {
      setUser(nextUser);
      writePersistedSession(nextUser);
      broadcastCrossTabEvent('AUTH_LOGIN', { userId: nextUser.userId });
      setIsAuthModalOpen(false);
      setAuthGatePrompt(null);
      void recordLoginAuditIfNewSession({
        uid: nextUser.firebaseUid || nextUser.userId,
        displayName: nextUser.displayName,
        email: nextUser.email,
        role: nextUser.role,
        authProviderLabel: resolveAuthProviderLabel(nextUser),
        forceNewSession: true,
      });
      const pendingCb = pendingAuthActionRef.current;
      pendingAuthActionRef.current = null;
      if (pendingCb) {
        pendingCb(nextUser);
      }
    },
    [resolveAuthProviderLabel]
  );

  // Ensure an existing restored session records once per browser tab session (never duplicated on F5)
  useEffect(() => {
    if (!user) return;
    void recordLoginAuditIfNewSession({
      uid: user.firebaseUid || user.userId,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      authProviderLabel: resolveAuthProviderLabel(user),
      forceNewSession: false,
    });
  }, [user, resolveAuthProviderLabel]);

  const checkAccountPasswordExists = useCallback(
    (provider: AuthProviderType, identifier: string): boolean => {
      return hasRegisteredUserPassword(provider, identifier);
    },
    []
  );

  const loginWithGoogle = useCallback(
    async (
      emailInput: string,
      passwordInput: string,
      displayNameInput?: string
    ): Promise<AuthLoginResult> => {
      const normalized = normalizeEmail(emailInput);
      if (!normalized || normalized.length < 2) {
        return {
          ok: false,
          error: 'Vui lòng nhập Email hoặc Tên tài khoản của bạn.',
        };
      }

      // Fetch latest users from CLOUD_API_URL first so cross-device accounts, tickets & roles are restored
      await fetchUsersFromCloudApi();
      const latestSecondaryAdmins = readSecondaryAdminEmailsFromStorage();
      setSecondaryAdminEmails(latestSecondaryAdmins);

      const fallbackDisplayName =
        displayNameInput?.trim() ||
        (normalized === PRIMARY_ADMIN_EMAIL
          ? 'Quản trị viên Dấu Ấn Việt'
          : deriveDisplayNameFromEmail(normalized));

      const { role, isPrimaryAdmin } = resolveUserRole(
        'google',
        normalized,
        latestSecondaryAdmins
      );

      const authRes = await authenticateWithPassword({
        provider: 'google',
        identifier: normalized,
        email: normalized,
        displayName: fallbackDisplayName,
        password: passwordInput,
        role,
        isPrimaryAdmin,
      });

      if (!authRes.ok || !authRes.userId) {
        return {
          ok: false,
          error: authRes.error || 'Mật khẩu tài khoản không chính xác.',
        };
      }

      resetLoginShieldStatus();

      const resolvedDisplayName =
        displayNameInput?.trim() || authRes.displayName || fallbackDisplayName;
      const resolvedRole: UserRole =
        isPrimaryAdmin || authRes.role === 'admin' || role === 'admin' ? 'admin' : 'visitor';

      const visitorRec = getVisitorRecord(authRes.userId);
      const nextUser: AuthUser = {
        id: authRes.userId,
        userId: authRes.userId,
        provider: 'google',
        email: normalized,
        displayName: resolvedDisplayName,
        avatarInitials: deriveInitials(resolvedDisplayName),
        role: resolvedRole,
        isPrimaryAdmin,
        isBetaTester: resolvedRole === 'admin' || Boolean(visitorRec?.isBetaTester),
        loggedInAt: new Date().toISOString(),
        authMethod: 'password_verified',
      };

      finalizeAuthenticatedUser(nextUser);

      if (resolvedRole === 'admin') {
        appendAuditLog({
          adminEmail: normalized,
          action: isPrimaryAdmin ? 'Đăng nhập Super Admin' : 'Đăng nhập Quản trị viên',
          detail: 'Xác thực thành công qua cổng SHA-256 Admin Portal',
        });
      }

      return { ok: true, user: nextUser, isNewAccount: authRes.isNewAccount };
    },
    [secondaryAdminEmails, finalizeAuthenticatedUser]
  );

  const loginWithFacebook = useCallback(
    async (
      accountNameInput: string,
      passwordInput: string,
      emailInput?: string
    ): Promise<AuthLoginResult> => {
      const trimmedName = accountNameInput.trim();
      const normalizedOptionalEmail = emailInput ? normalizeEmail(emailInput) : '';
      const identifier = normalizedOptionalEmail || trimmedName.toLowerCase();

      if (identifier.length < 2) {
        return {
          ok: false,
          error: 'Vui lòng nhập Tên tài khoản hoặc Email của bạn.',
        };
      }

      // Fetch latest users from CLOUD_API_URL first so cross-device accounts & tickets are restored
      await fetchUsersFromCloudApi();

      const fallbackDisplayName =
        trimmedName || deriveDisplayNameFromEmail(normalizedOptionalEmail || identifier);

      const authRes = await authenticateWithPassword({
        provider: 'facebook',
        identifier,
        email: normalizedOptionalEmail || identifier,
        displayName: fallbackDisplayName,
        password: passwordInput,
        role: 'visitor',
        isPrimaryAdmin: false,
      });

      if (!authRes.ok || !authRes.userId) {
        return {
          ok: false,
          error: authRes.error || 'Mật khẩu tài khoản không chính xác.',
        };
      }

      resetLoginShieldStatus();

      const resolvedDisplayName =
        trimmedName || authRes.displayName || fallbackDisplayName;

      const visitorRec = getVisitorRecord(authRes.userId);
      const resolvedFbRole: UserRole = authRes.role === 'admin' ? 'admin' : 'visitor';
      const nextUser: AuthUser = {
        id: authRes.userId,
        userId: authRes.userId,
        provider: 'facebook',
        email: normalizedOptionalEmail || identifier,
        displayName: resolvedDisplayName,
        avatarInitials: deriveInitials(resolvedDisplayName),
        role: resolvedFbRole,
        isPrimaryAdmin: false,
        isBetaTester: resolvedFbRole === 'admin' || Boolean(visitorRec?.isBetaTester),
        loggedInAt: new Date().toISOString(),
        authMethod: 'password_verified',
      };

      finalizeAuthenticatedUser(nextUser);
      return { ok: true, user: nextUser, isNewAccount: authRes.isNewAccount };
    },
    [finalizeAuthenticatedUser]
  );

  const completeOAuthLogin = useCallback(
    async (params: {
      provider: AuthProviderType;
      identifier: string;
      email?: string;
      displayName: string;
    }): Promise<AuthLoginResult> => {
      await syncStateFromServer();
      const latestSecondaryAdmins = readSecondaryAdminEmailsFromStorage();
      setSecondaryAdminEmails(latestSecondaryAdmins);
      const normalizedEmail = params.email ? normalizeEmail(params.email) : '';
      const { role, isPrimaryAdmin } = resolveUserRole(
        params.provider,
        normalizedEmail,
        latestSecondaryAdmins
      );
      if (
        !isPrimaryAdmin &&
        normalizedEmail !== PRIMARY_ADMIN_EMAIL &&
        (await isAccountIdentifierLocked(params.provider, params.identifier))
      ) {
        return {
          ok: false,
          error: `Tài khoản này đang bị tạm khóa bởi Quản trị viên. Vui lòng liên hệ Ban Quản lý (${PRIMARY_ADMIN_EMAIL}) để được hỗ trợ mở khóa.`,
        };
      }
      const userId =
        (await registerOAuthVerifiedSession({
          provider: params.provider,
          identifier: params.identifier,
          email: normalizedEmail,
          displayName: params.displayName,
          role,
          isPrimaryAdmin,
        })) || (await deriveStableUserId(params.provider, params.identifier));

      const visitorRec = getVisitorRecord(userId);
      const nextUser: AuthUser = {
        id: userId,
        userId,
        provider: params.provider,
        email: normalizedEmail,
        displayName: params.displayName,
        avatarInitials: deriveInitials(params.displayName),
        role,
        isPrimaryAdmin,
        isBetaTester: role === 'admin' || Boolean(visitorRec?.isBetaTester),
        loggedInAt: new Date().toISOString(),
        authMethod: 'oauth_sdk',
      };

      finalizeAuthenticatedUser(nextUser);
      void pushAccountsToFirebase();
      return { ok: true, user: nextUser };
    },
    [finalizeAuthenticatedUser]
  );

  const hydrateFirebaseGoogleProfile = useCallback(
    async (
      profile: FirebaseSignedInProfile,
      options?: { silentRestore?: boolean }
    ): Promise<AuthLoginResult> => {
      await syncStateFromServer();
      const normalizedEmail = normalizeEmail(profile.email);
      const remoteProfile =
        (await pullUserProfileFromFirebaseRealtimeDb(profile.uid)) ||
        (await pullUserProfileFromFirebaseRealtimeDb(normalizedEmail));
      const remoteExplicitRole =
        (await pullUserRoleFromFirebaseRealtimeDb(profile.uid)) ||
        (await pullUserRoleFromFirebaseRealtimeDb(normalizedEmail));

      const latestSecondaryAdmins = readSecondaryAdminEmailsFromStorage();
      setSecondaryAdminEmails(latestSecondaryAdmins);

      const baseRole = resolveUserRole(
        'google',
        normalizedEmail,
        latestSecondaryAdmins
      );
      const isRemoteAdmin = remoteProfile?.role === 'admin' || remoteExplicitRole === 'admin';
      const role: UserRole =
        baseRole.role === 'admin' || isRemoteAdmin ? 'admin' : 'visitor';
      const isPrimaryAdmin =
        baseRole.isPrimaryAdmin || normalizedEmail === PRIMARY_ADMIN_EMAIL;

      if (
        !isPrimaryAdmin &&
        normalizedEmail !== PRIMARY_ADMIN_EMAIL &&
        (await isAccountIdentifierLocked('google', normalizedEmail))
      ) {
        void signOutFirebaseAuth();
        return {
          ok: false,
          error: `Tài khoản này đang bị tạm khóa bởi Quản trị viên. Vui lòng liên hệ Ban Quản lý (${PRIMARY_ADMIN_EMAIL}) để được hỗ trợ mở khóa.`,
        };
      }

      const userId =
        (await registerOAuthVerifiedSession({
          provider: 'google',
          identifier: normalizedEmail,
          email: normalizedEmail,
          displayName: profile.displayName,
          role,
          isPrimaryAdmin,
        })) || (await deriveStableUserId('google', normalizedEmail));

      resetLoginShieldStatus();
      const nowIso = new Date().toISOString();
      const visitorRec = getVisitorRecord(userId);
      const isTesterCandidate =
        role === 'admin' ||
        remoteExplicitRole === 'tester' ||
        remoteProfile?.role === 'tester' ||
        isEmailTesterAllowlisted(normalizedEmail) ||
        Boolean(visitorRec?.isBetaTester ?? remoteProfile?.isBetaTester);

      upsertAccountDbRecord({
        id: userId,
        userId,
        firebaseUid: profile.uid,
        name: profile.displayName,
        displayName: profile.displayName,
        email: normalizedEmail,
        photoURL: profile.photoURL,
        provider: 'google',
        role,
        isPrimaryAdmin,
        isBetaTester: isTesterCandidate,
        userTier: role === 'admin' ? 'pro' : remoteProfile?.userTier,
        hasSchoolPackage: remoteProfile?.hasSchoolPackage,
        lastLoginAt: nowIso,
      });

      const resolvedEnts = getEffectiveUserEntitlements({
        userId,
        userEmail: normalizedEmail,
        isAdmin: role === 'admin',
        isTesterPro: role !== 'admin' && isTesterCandidate,
      });

      const nextUser: AuthUser = {
        id: userId,
        userId,
        firebaseUid: profile.uid,
        provider: 'google',
        email: normalizedEmail,
        displayName: profile.displayName,
        avatarInitials: deriveInitials(profile.displayName),
        photoURL: profile.photoURL,
        role,
        isPrimaryAdmin,
        isBetaTester: isTesterCandidate,
        loggedInAt: nowIso,
        authMethod: 'oauth_sdk',
      };

      void syncUserProfileToFirebaseRealtimeDb({
        uid: profile.uid,
        userId,
        email: normalizedEmail,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        role: role === 'admin' ? 'admin' : isTesterCandidate ? 'tester' : 'visitor',
        isPrimaryAdmin,
        isBetaTester: isTesterCandidate,
        userTier: resolvedEnts.userTier,
        hasSchoolPackage: resolvedEnts.hasSchoolPackage,
        authMethod: 'oauth_sdk',
        lastLoginAt: nowIso,
      });

      if (options?.silentRestore) {
        const active = userRef.current;
        if (
          active &&
          (active.authMethod === 'judge_quick_access' ||
            active.authMethod === 'password_verified')
        ) {
          return { ok: true, user: active };
        }
        setUser(nextUser);
        writePersistedSession(nextUser);
      } else {
        finalizeAuthenticatedUser(nextUser);
        if (role === 'admin') {
          appendAuditLog({
            adminEmail: normalizedEmail,
            action: isPrimaryAdmin
              ? 'Đăng nhập Super Admin (Google)'
              : 'Đăng nhập Quản trị viên (Google)',
            detail: 'Xác thực thành công qua Firebase Google Sign-In',
          });
        }
      }

      return { ok: true, user: nextUser };
    },
    [finalizeAuthenticatedUser]
  );

  const signInWithFirebaseGoogleAccount = useCallback(
    async (lang?: SupportedAuthLanguage): Promise<AuthLoginResult> => {
      manualLogoutRef.current = false;
      let resolvedLang: SupportedAuthLanguage = lang || 'vi';
      if (!lang && typeof window !== 'undefined') {
        try {
          const saved = window.localStorage.getItem('saigon_heritage_language_v1');
          if (saved === 'en' || saved === 'zh' || saved === 'vi') {
            resolvedLang = saved;
          }
        } catch {
          // ignore
        }
      }
      const res = await signInWithFirebaseGoogle(resolvedLang);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
      return hydrateFirebaseGoogleProfile(res.profile, { silentRestore: false });
    },
    [hydrateFirebaseGoogleProfile]
  );

  useEffect(() => {
    const unsubscribe = onFirebaseAuthUserChanged((fbProfile) => {
      if (!fbProfile || manualLogoutRef.current) return;
      const active = userRef.current;
      if (
        active &&
        (active.authMethod === 'judge_quick_access' ||
          active.authMethod === 'password_verified')
      ) {
        return;
      }
      if (active && active.email === normalizeEmail(fbProfile.email)) {
        if (
          active.photoURL !== fbProfile.photoURL ||
          active.firebaseUid !== fbProfile.uid ||
          active.displayName !== fbProfile.displayName
        ) {
          const refreshed: AuthUser = {
            ...active,
            firebaseUid: fbProfile.uid,
            photoURL: fbProfile.photoURL || active.photoURL,
            displayName: fbProfile.displayName || active.displayName,
            avatarInitials: deriveInitials(fbProfile.displayName || active.displayName),
          };
          setUser(refreshed);
          writePersistedSession(refreshed);
        }
        return;
      }
      if (!active) {
        void hydrateFirebaseGoogleProfile(fbProfile, { silentRestore: true });
      }
    });
    return () => unsubscribe();
  }, [hydrateFirebaseGoogleProfile]);

  const loginAsJudge = useCallback(async (): Promise<AuthLoginResult> => {
    const userId = registerQuickJudgeSession();
    const nextUser: AuthUser = {
      id: userId,
      userId,
      provider: 'google',
      email: 'giamkhao@dauanviet3d.vn',
      displayName: 'Ban Giám Khảo',
      avatarInitials: 'GK',
      role: 'visitor',
      isPrimaryAdmin: false,
      isBetaTester: false,
      loggedInAt: new Date().toISOString(),
      authMethod: 'judge_quick_access',
    };
    finalizeAuthenticatedUser(nextUser);
    return { ok: true, user: nextUser };
  }, [finalizeAuthenticatedUser]);

  const loginWithTransferCode = useCallback(
    async (transferCode: string): Promise<AuthLoginResult> => {
      await syncStateFromServer();
      const restored = await restoreAccountFromTransferCode(transferCode);
      if (!restored.ok || !restored.user) {
        return {
          ok: false,
          error: restored.error || 'Không thể khôi phục tài khoản từ mã chuyển thiết bị.',
        };
      }

      const latestAdmins = readSecondaryAdminEmailsFromStorage();
      setSecondaryAdminEmails(latestAdmins);
      const normEmail = normalizeEmail(restored.user.email || '');
      const resolvedRole = resolveUserRole(restored.user.provider, normEmail, latestAdmins);

      if (
        !resolvedRole.isPrimaryAdmin &&
        normEmail !== PRIMARY_ADMIN_EMAIL &&
        isUserAccountLocked(restored.user.userId)
      ) {
        return {
          ok: false,
          error: `Tài khoản này đang bị tạm khóa bởi Quản trị viên. Vui lòng liên hệ Ban Quản lý (${PRIMARY_ADMIN_EMAIL}).`,
        };
      }

      const visitorRec = getVisitorRecord(restored.user.userId);
      const nextUser: AuthUser = {
        id: restored.user.id || restored.user.userId,
        userId: restored.user.userId,
        provider: restored.user.provider,
        email: normEmail,
        displayName: restored.user.displayName,
        avatarInitials: deriveInitials(restored.user.displayName),
        role: resolvedRole.role,
        isPrimaryAdmin: resolvedRole.isPrimaryAdmin,
        isBetaTester:
          resolvedRole.role === 'admin' ||
          Boolean(visitorRec?.isBetaTester ?? restored.user.isBetaTester),
        loggedInAt: new Date().toISOString(),
        authMethod: restored.user.authMethod || 'password_verified',
      };

      finalizeAuthenticatedUser(nextUser);
      void syncLocalBootstrapSnapshotToServer();
      return { ok: true, user: nextUser };
    },
    [finalizeAuthenticatedUser]
  );

  const changeAdminPassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user || user.role !== 'admin') {
        return { ok: false, error: 'Chỉ Quản trị viên mới có quyền đổi mật khẩu hệ thống.' };
      }
      const res = await changeAdminPasswordHash(currentPassword, newPassword);
      if (res.ok) {
        appendAuditLog({
          adminEmail: user.email,
          action: 'Cập nhật mật khẩu Quản trị viên',
          detail: 'Mã hóa lại hàm băm SHA-256 cho tài khoản Super Admin',
        });
      }
      return res;
    },
    [user]
  );

  const updateUserProfile = useCallback(
    async (params: {
      displayName: string;
      phone: string;
    }): Promise<{ ok: boolean; syncedFirebase?: boolean; error?: string }> => {
      if (!user) {
        return { ok: false, error: 'Bạn cần đăng nhập để cập nhật hồ sơ.' };
      }
      const trimmedName = params.displayName.trim();
      if (trimmedName.length < 2) {
        return { ok: false, error: 'Tên hiển thị cần có tối thiểu 2 ký tự.' };
      }
      const trimmedPhone = params.phone.trim();
      if (trimmedPhone && !/^[0-9+\-\s().]{8,18}$/.test(trimmedPhone)) {
        return { ok: false, error: 'Số điện thoại liên hệ chưa đúng định dạng.' };
      }

      // 1. Update Firebase Auth displayName if signed in via Firebase Auth
      const fbRes = await updateFirebaseDisplayName(trimmedName);
      if (!fbRes.ok && fbRes.error) {
        return { ok: false, error: fbRes.error };
      }

      // 2. Sync to /users/{uid}/profile on Firebase Realtime Database + localStorage
      const uid = user.firebaseUid || user.userId;
      const profileRes = await savePersonalProfile({
        uid,
        displayName: trimmedName,
        phone: trimmedPhone,
        email: user.email,
        role: user.role,
      });

      // 3. Update local session & account registries
      updateLocalUserDisplayName(user.userId, user.email, trimmedName);
      const updatedUser: AuthUser = {
        ...user,
        displayName: trimmedName,
        avatarInitials: deriveInitials(trimmedName),
      };
      setUser(updatedUser);
      writePersistedSession(updatedUser);
      void pushAccountsToFirebase();

      return { ok: true, syncedFirebase: profileRes.syncedFirebase || fbRes.syncedAuth };
    },
    [user]
  );

  const changeUserPassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!user) {
        return { ok: false, error: 'Bạn cần đăng nhập để đổi mật khẩu.' };
      }
      if (!currentPassword.trim()) {
        return { ok: false, error: 'Vui lòng nhập mật khẩu hiện tại.' };
      }
      if (newPassword.trim().length < 6) {
        return { ok: false, error: 'Mật khẩu mới cần có tối thiểu 6 ký tự.' };
      }

      // Try Firebase Auth reauthenticateWithCredential + updatePassword first if user has password provider
      const fbPassRes = await updateFirebaseEmailPassword(currentPassword, newPassword, 'vi');
      if (fbPassRes.usedFirebaseAuth) {
        return { ok: fbPassRes.ok, error: fbPassRes.error };
      }

      // Fallback to local SHA-256 account password store (Email/Password accounts & Primary Admin)
      const localRes = await changeLocalUserAccountPassword({
        provider: user.provider,
        identifier: user.email || user.displayName,
        currentPassword,
        newPassword,
      });
      if (localRes.ok && user.role === 'admin') {
        appendAuditLog({
          adminEmail: user.email,
          action: 'Cập nhật mật khẩu Tài khoản',
          detail: 'Đổi mật khẩu thành công từ Trung tâm Tài khoản cá nhân',
        });
      }
      return localRes;
    },
    [user]
  );

  const logout = useCallback(() => {
    manualLogoutRef.current = true;
    clearCurrentSessionLoginAuditMarker();
    clearAllGateLetterSessionFlags();
    setUser(null);
    writePersistedSession(null);
    persistSimpleUserTier('free');
    broadcastCrossTabEvent('AUTH_LOGOUT');
    void signOutFirebaseAuth().finally(() => {
      manualLogoutRef.current = false;
    });
  }, []);

  const addAdminEmail = useCallback(
    (emailInput: string): { ok: boolean; error?: string } => {
      if (!user || user.role !== 'admin') {
        return { ok: false, error: 'Bạn không có quyền thực hiện thao tác quản trị này.' };
      }

      const normalized = normalizeEmail(emailInput);
      if (!normalized || !isValidEmailFormat(normalized)) {
        return { ok: false, error: 'Địa chỉ email không hợp lệ.' };
      }
      if (normalized === PRIMARY_ADMIN_EMAIL) {
        return { ok: false, error: `${PRIMARY_ADMIN_EMAIL} đã là Quản trị viên gốc.` };
      }
      if (secondaryAdminEmails.includes(normalized)) {
        return { ok: false, error: 'Email này đã có quyền Quản trị viên.' };
      }

      const nextList = [...secondaryAdminEmails, normalized];
      setSecondaryAdminEmails(nextList);
      writeSecondaryAdminEmailsToStorage(nextList);
      void pushSyncPatchToServer({
        secondaryAdminEmails: nextList,
        secondaryAdminEmailsUpdatedAt: new Date().toISOString(),
      });
      appendAuditLog({
        adminEmail: user.email,
        action: 'Cấp quyền Đồng Quản trị viên',
        detail: `Thêm ${normalized} vào danh sách Admin Studio`,
      });
      return { ok: true };
    },
    [user, secondaryAdminEmails]
  );

  const removeAdminEmail = useCallback(
    (emailInput: string): { ok: boolean; error?: string } => {
      if (!user || user.role !== 'admin') {
        return { ok: false, error: 'Bạn không có quyền thực hiện thao tác quản trị này.' };
      }

      const normalized = normalizeEmail(emailInput);
      if (normalized === PRIMARY_ADMIN_EMAIL) {
        return { ok: false, error: 'Không thể thu hồi quyền của Quản trị viên gốc.' };
      }

      const nextList = secondaryAdminEmails.filter((item) => item !== normalized);
      setSecondaryAdminEmails(nextList);
      writeSecondaryAdminEmailsToStorage(nextList);
      void pushSyncPatchToServer({
        secondaryAdminEmails: nextList,
        secondaryAdminEmailsUpdatedAt: new Date().toISOString(),
      });
      appendAuditLog({
        adminEmail: user.email,
        action: 'Thu hồi quyền Đồng Quản trị viên',
        detail: `Gỡ quyền Admin đối với ${normalized}`,
      });
      return { ok: true };
    },
    [user, secondaryAdminEmails]
  );

  const refreshEntitlements = useCallback(() => {
    setEntitlementRevision((r) => r + 1);
  }, []);

  const isAdmin = user?.role === 'admin';
  const [remoteFirebaseRole, setRemoteFirebaseRole] = useState<'admin' | 'tester' | 'visitor' | null>(null);

  useEffect(() => {
    let active = true;
    const uidKey = user?.firebaseUid || user?.userId;
    const emailKey = user?.email?.toLowerCase().trim();
    if (!uidKey && !emailKey) {
      setRemoteFirebaseRole(null);
      return;
    }
    void (async () => {
      const resolved =
        (uidKey ? await pullUserRoleFromFirebaseRealtimeDb(uidKey) : null) ||
        (emailKey ? await pullUserRoleFromFirebaseRealtimeDb(emailKey) : null);
      if (active) {
        setRemoteFirebaseRole(resolved);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.firebaseUid, user?.userId, user?.email, entitlementRevision]);

  const { isTesterPro, testerModeSource } = useMemo<{
    isTesterPro: boolean;
    testerModeSource: TesterActivationSource;
  }>(() => {
    if (isAdmin) {
      return { isTesterPro: false, testerModeSource: null };
    }
    if (remoteFirebaseRole === 'tester') {
      return { isTesterPro: true, testerModeSource: 'allowlist' };
    }
    if (user?.email && isEmailTesterAllowlisted(user.email)) {
      return { isTesterPro: true, testerModeSource: 'allowlist' };
    }
    if (user?.isBetaTester) {
      return { isTesterPro: true, testerModeSource: 'beta' };
    }
    return { isTesterPro: false, testerModeSource: null };
  }, [isAdmin, user, remoteFirebaseRole, entitlementRevision]);

  const entitlements = useMemo<UserEntitlementsSnapshot>(
    () =>
      getEffectiveUserEntitlements({
        userId: user?.userId,
        userEmail: user?.email,
        isAdmin,
        isTesterPro,
      }),
    [user?.userId, user?.email, isAdmin, isTesterPro, entitlementRevision]
  );

  useEffect(() => {
    persistSimpleUserTier(user ? entitlements.userTier : 'free');
  }, [user, entitlements.userTier]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAdmin,
      isPrimaryAdmin: Boolean(user?.isPrimaryAdmin),
      isTesterPro,
      testerModeSource,
      userTier: entitlements.userTier,
      entitlements,
      refreshEntitlements,
      primaryAdminEmail: PRIMARY_ADMIN_EMAIL,
      secondaryAdminEmails,
      isAuthModalOpen,
      authGatePrompt,
      openAuthModal,
      closeAuthModal,
      checkAccountPasswordExists,
      loginWithGoogle,
      loginWithFacebook,
      completeOAuthLogin,
      signInWithFirebaseGoogleAccount,
      loginAsJudge,
      loginWithTransferCode,
      changeAdminPassword,
      updateUserProfile,
      changeUserPassword,
      logout,
      addAdminEmail,
      removeAdminEmail,
    }),
    [
      user,
      isAdmin,
      isTesterPro,
      testerModeSource,
      entitlements,
      refreshEntitlements,
      secondaryAdminEmails,
      isAuthModalOpen,
      authGatePrompt,
      openAuthModal,
      closeAuthModal,
      checkAccountPasswordExists,
      loginWithGoogle,
      loginWithFacebook,
      completeOAuthLogin,
      signInWithFirebaseGoogleAccount,
      loginAsJudge,
      loginWithTransferCode,
      changeAdminPassword,
      updateUserProfile,
      changeUserPassword,
      logout,
      addAdminEmail,
      removeAdminEmail,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

import { useEffect, useState } from 'react';

export interface PassportStampRecord {
  siteId: string;
  siteName: string;
  secretTitle: string;
  stampCode: string;
  unlockedAt: string;
  attempts: number;
}

const PASSPORT_STORAGE_PREFIX = 'dauanviet_passport_stamps_v2_';
const AUTH_SESSION_STORAGE_KEY = 'dau_an_viet_auth_session';
const PASSPORT_EVENT = 'heritage-passport-updated';

import { pushSyncPatchToServer } from './serverSyncClient';

export function resolveActivePassportScope(explicitScope?: string): string {
  if (explicitScope && explicitScope.trim()) {
    return explicitScope.trim().toLowerCase();
  }
  if (typeof window === 'undefined') return 'guest';
  try {
    const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (rawSession) {
      const parsed = JSON.parse(rawSession) as { email?: string; userId?: string } | null;
      const normEmail = (parsed?.email || '').trim().toLowerCase();
      if (normEmail) return normEmail;
      if (parsed?.userId) return parsed.userId.trim().toLowerCase();
    }
  } catch {
    // ignore parse error
  }
  return 'guest';
}

function getPassportStorageKey(explicitScope?: string): string {
  return `${PASSPORT_STORAGE_PREFIX}${resolveActivePassportScope(explicitScope)}`;
}

export function getUnlockedPassportStamps(
  explicitScope?: string
): Record<string, PassportStampRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(getPassportStorageKey(explicitScope));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PassportStampRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function isSiteStampUnlocked(siteId: string, explicitScope?: string): boolean {
  const map = getUnlockedPassportStamps(explicitScope);
  return Boolean(map[siteId]);
}

export function unlockPassportStamp(
  record: Omit<PassportStampRecord, 'unlockedAt'>,
  explicitScope?: string
): Record<string, PassportStampRecord> {
  const scope = resolveActivePassportScope(explicitScope);
  const scopeKey = `${PASSPORT_STORAGE_PREFIX}${scope}`;
  const current = getUnlockedPassportStamps(explicitScope);
  const next: Record<string, PassportStampRecord> = {
    ...current,
    [record.siteId]: {
      ...record,
      unlockedAt: new Date().toISOString(),
    },
  };
  try {
    window.localStorage.setItem(scopeKey, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(PASSPORT_EVENT, { detail: next }));
  } catch {
    // ignore storage quota errors
  }
  void pushSyncPatchToServer({
    passportStamps: {
      [scope]: next,
    },
  });
  return next;
}

export function restorePassportStampsForScope(
  explicitScope: string,
  incomingStamps: Record<string, PassportStampRecord>
): Record<string, PassportStampRecord> {
  const scope = resolveActivePassportScope(explicitScope);
  const scopeKey = `${PASSPORT_STORAGE_PREFIX}${scope}`;
  const current = getUnlockedPassportStamps(explicitScope);
  const next = { ...current, ...incomingStamps };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(scopeKey, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(PASSPORT_EVENT, { detail: next }));
    } catch {
      // ignore
    }
  }
  return next;
}

export function useHeritagePassportStamps(
  explicitScope?: string
): Record<string, PassportStampRecord> {
  const [stamps, setStamps] = useState<Record<string, PassportStampRecord>>(() =>
    getUnlockedPassportStamps(explicitScope)
  );

  useEffect(() => {
    const handleUpdate = () => {
      setStamps(getUnlockedPassportStamps(explicitScope));
    };
    handleUpdate();
    window.addEventListener(PASSPORT_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(PASSPORT_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [explicitScope]);

  return stamps;
}



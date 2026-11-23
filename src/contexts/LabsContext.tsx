import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

export const LABS_SETTINGS_STORAGE_KEY = 'dau_an_viet_labs_settings_v1';
export const LABS_PLATFORM_CONFIG_KEY = 'dau_an_viet_labs_platform_v1';
export const LABS_PLATFORM_UPDATED_EVENT = 'dau-an-viet-labs-platform-updated';

export interface LabsSettingsState {
  goldenHour3D: boolean;
  wireframeOverlay: boolean;
  aiLabsEnabled: boolean;
  quickNotesWidget: boolean;
}

export interface LabsFeatureMetaItem {
  key: keyof LabsSettingsState;
  number: string;
  title: string;
  description: string;
  titleEn: string;
  descriptionEn: string;
  titleZh: string;
  descriptionZh: string;
}

export const LABS_FEATURES_META: LabsFeatureMetaItem[] = [
  {
    key: 'goldenHour3D',
    number: '01',
    title: 'Ánh sáng Giờ Vàng (Golden Hour 3D)',
    description:
      'Chuyển ánh sáng trên không gian 3D sang sắc hoàng hôn ấm áp (#FFB86C) và đổ bóng chiều tà.',
    titleEn: 'Golden Hour 3D Lighting',
    descriptionEn:
      'Shift the 3D spatial lighting to warm sunset tones (#FFB86C) with long evening shadows.',
    titleZh: '黄金时刻 3D 光照 (Golden Hour 3D)',
    descriptionZh:
      '将 3D 空间切换为温暖的黄昏色调 (#FFB86C) 并投射傍晚长影。',
  },
  {
    key: 'wireframeOverlay',
    number: '02',
    title: 'Chế độ Lưới Kỹ thuật (Architectural Wireframe)',
    description:
      'Phủ thêm lớp lưới đa giác kiến trúc mảnh lên bề mặt mô hình 3D để quan sát kết cấu dựng hình.',
    titleEn: 'Architectural Wireframe Overlay',
    descriptionEn:
      'Overlay a fine polygonal technical mesh onto 3D surfaces to inspect structural geometry.',
    titleZh: '建筑工程线框模式 (Architectural Wireframe)',
    descriptionZh:
      '在 3D 模型表面叠加精细多边形网格，以便观察建筑几何结构。',
  },
  {
    key: 'aiLabsEnabled',
    number: '03',
    title: 'Sử Quan Dấu Ấn — Phiên bản Labs (Điều khiển 3D & Góc nhìn nhân chứng)',
    description:
      'Mở khóa chế độ Labs · Thử nghiệm trong Sử Quan Dấu Ấn với lệnh điều phối 3D ngôn ngữ tự nhiên và góc nhìn nhân chứng lịch sử.',
    titleEn: 'Royal Historiographer — Labs Edition (3D Control & Witness Perspective)',
    descriptionEn:
      'Unlock Labs · Experimental mode in the Royal Historiographer with natural-language 3D viewport commands and historical witness personas.',
    titleZh: '史官讲解 — Labs 实验版（3D 操控与历史亲历视角）',
    descriptionZh:
      '解锁史官讲解中的 Labs 实验模式，支持自然语言控制 3D 视角与建筑师/亲历者角色切换。',
  },
  {
    key: 'quickNotesWidget',
    number: '04',
    title: 'Thẻ Ghi chú Thẩm định Nhanh (Gửi báo lỗi trực tiếp về Admin Studio)',
    description:
      'Hiển thị nút gọn "Ghi chú Labs" ở góc dưới trái màn hình để ghi nhận xét, báo lỗi trực tiếp về Admin Studio.',
    titleEn: 'Quick Evaluation Note Card (Direct Feedback to Admin Studio)',
    descriptionEn:
      'Display a compact "Labs Notes" button at the bottom-left corner to send observations or bug reports directly to Admin Studio.',
    titleZh: '快速评审笔记卡片（直接向管理工作台提交反馈与问题）',
    descriptionZh:
      '在屏幕左下角显示精简的“Labs 笔记”按钮，可直接将功能建议或故障反馈发送至 Admin Studio。',
  },
];

const DEFAULT_LABS_SETTINGS: LabsSettingsState = {
  goldenHour3D: false,
  wireframeOverlay: false,
  aiLabsEnabled: true,
  quickNotesWidget: false,
};

interface StoredPlatformLabsConfig {
  settings: LabsSettingsState;
  changedAt: Partial<Record<keyof LabsSettingsState, number>>;
}

interface StoredUserLabsOverrides {
  values: Partial<LabsSettingsState>;
  changedAt: Partial<Record<keyof LabsSettingsState, number>>;
}

const LABS_KEYS: Array<keyof LabsSettingsState> = [
  'goldenHour3D',
  'wireframeOverlay',
  'aiLabsEnabled',
  'quickNotesWidget',
];

function normalizeLabsSettings(raw: Partial<LabsSettingsState> | null | undefined): LabsSettingsState {
  if (!raw || typeof raw !== 'object') return DEFAULT_LABS_SETTINGS;
  return {
    goldenHour3D: Boolean(raw.goldenHour3D),
    wireframeOverlay: Boolean(raw.wireframeOverlay),
    aiLabsEnabled: raw.aiLabsEnabled !== undefined ? Boolean(raw.aiLabsEnabled) : true,
    quickNotesWidget: Boolean(raw.quickNotesWidget),
  };
}

function readPlatformLabsConfig(): StoredPlatformLabsConfig {
  if (typeof window === 'undefined') {
    return { settings: DEFAULT_LABS_SETTINGS, changedAt: {} };
  }
  try {
    const raw = window.localStorage.getItem(LABS_PLATFORM_CONFIG_KEY);
    if (!raw) return { settings: DEFAULT_LABS_SETTINGS, changedAt: {} };
    const parsed = JSON.parse(raw) as Partial<StoredPlatformLabsConfig> & Partial<LabsSettingsState>;
    if (!parsed || typeof parsed !== 'object') {
      return { settings: DEFAULT_LABS_SETTINGS, changedAt: {} };
    }
    if (parsed.settings && typeof parsed.settings === 'object') {
      return {
        settings: normalizeLabsSettings(parsed.settings),
        changedAt: parsed.changedAt && typeof parsed.changedAt === 'object' ? parsed.changedAt : {},
      };
    }
    return {
      settings: normalizeLabsSettings(parsed),
      changedAt: {},
    };
  } catch {
    return { settings: DEFAULT_LABS_SETTINGS, changedAt: {} };
  }
}

function writePlatformLabsConfig(config: StoredPlatformLabsConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LABS_PLATFORM_CONFIG_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event(LABS_PLATFORM_UPDATED_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

function readUserLabsOverrides(scopeKey: string): StoredUserLabsOverrides {
  if (typeof window === 'undefined') return { values: {}, changedAt: {} };
  try {
    const raw = window.localStorage.getItem(`${LABS_SETTINGS_STORAGE_KEY}:${scopeKey}`);
    if (!raw) return { values: {}, changedAt: {} };
    const parsed = JSON.parse(raw) as Partial<StoredUserLabsOverrides> & Partial<LabsSettingsState>;
    if (!parsed || typeof parsed !== 'object') return { values: {}, changedAt: {} };
    if (parsed.values && typeof parsed.values === 'object') {
      return {
        values: parsed.values,
        changedAt: parsed.changedAt && typeof parsed.changedAt === 'object' ? parsed.changedAt : {},
      };
    }
    // Migrate legacy flat structure without overriding newer Admin platform switches
    return {
      values: normalizeLabsSettings(parsed),
      changedAt: {},
    };
  } catch {
    return { values: {}, changedAt: {} };
  }
}

function writeUserLabsOverrides(scopeKey: string, next: StoredUserLabsOverrides): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${LABS_SETTINGS_STORAGE_KEY}:${scopeKey}`, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

function resolveEffectiveLabsSettings(scopeKey: string, isAdmin: boolean): LabsSettingsState {
  const platform = readPlatformLabsConfig();
  if (isAdmin) {
    return platform.settings;
  }
  const userOverrides = readUserLabsOverrides(scopeKey);
  const resolved: LabsSettingsState = { ...platform.settings };
  LABS_KEYS.forEach((key) => {
    const userTs = userOverrides.changedAt[key] ?? 0;
    const platformTs = platform.changedAt[key] ?? 0;
    if (userTs > platformTs && userOverrides.values[key] !== undefined) {
      resolved[key] = Boolean(userOverrides.values[key]);
    } else if (platformTs === 0 && userTs === 0 && userOverrides.values[key] !== undefined) {
      // Legacy stored preference when admin hasn't explicitly configured platform config yet
      resolved[key] = Boolean(userOverrides.values[key]);
    }
  });
  return resolved;
}

interface LabsContextType {
  hasLabsAccess: boolean;
  settings: LabsSettingsState;
  effectiveGoldenHour3D: boolean;
  effectiveWireframeOverlay: boolean;
  effectiveAiLabsEnabled: boolean;
  effectiveQuickNotesWidget: boolean;
  setGoldenHour3D: (enabled: boolean) => void;
  setWireframeOverlay: (enabled: boolean) => void;
  setAiLabsEnabled: (enabled: boolean) => void;
  setQuickNotesWidget: (enabled: boolean) => void;
  toggleLabsFeature: (key: keyof LabsSettingsState) => void;
  isLabsModalOpen: boolean;
  openLabsModal: () => void;
  closeLabsModal: () => void;
  isQuickNoteOpen: boolean;
  openQuickNote: () => void;
  closeQuickNote: () => void;
}

const LabsContext = createContext<LabsContextType | null>(null);

export const LabsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const isAdminUser = user?.role === 'admin';
  const hasLabsAccess = Boolean(user && (isAdminUser || user.isBetaTester));
  const scopeKey = user?.userId || 'guest';

  const [settings, setSettings] = useState<LabsSettingsState>(() =>
    resolveEffectiveLabsSettings(scopeKey, isAdminUser)
  );
  const [isLabsModalOpen, setIsLabsModalOpen] = useState<boolean>(false);
  const [isQuickNoteOpen, setIsQuickNoteOpen] = useState<boolean>(false);

  useEffect(() => {
    setSettings(resolveEffectiveLabsSettings(scopeKey, isAdminUser));
    if (!hasLabsAccess) {
      setIsLabsModalOpen(false);
      setIsQuickNoteOpen(false);
    }
  }, [scopeKey, isAdminUser, hasLabsAccess]);

  useEffect(() => {
    const syncFromPlatform = () => {
      setSettings(resolveEffectiveLabsSettings(scopeKey, isAdminUser));
    };
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === LABS_PLATFORM_CONFIG_KEY ||
        e.key === `${LABS_SETTINGS_STORAGE_KEY}:${scopeKey}`
      ) {
        syncFromPlatform();
      }
    };
    window.addEventListener(LABS_PLATFORM_UPDATED_EVENT, syncFromPlatform);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(LABS_PLATFORM_UPDATED_EVENT, syncFromPlatform);
      window.removeEventListener('storage', onStorage);
    };
  }, [scopeKey, isAdminUser]);

  const updateSetting = useCallback(
    (key: keyof LabsSettingsState, value: boolean) => {
      if (!hasLabsAccess) return;
      const now = Date.now();
      setSettings((prev) => {
        const next: LabsSettingsState = { ...prev, [key]: value };
        if (isAdminUser) {
          const currentPlatform = readPlatformLabsConfig();
          writePlatformLabsConfig({
            settings: { ...currentPlatform.settings, [key]: value },
            changedAt: { ...currentPlatform.changedAt, [key]: now },
          });
        } else {
          const currentUser = readUserLabsOverrides(scopeKey);
          writeUserLabsOverrides(scopeKey, {
            values: { ...currentUser.values, [key]: value },
            changedAt: { ...currentUser.changedAt, [key]: now },
          });
        }
        return next;
      });
    },
    [hasLabsAccess, isAdminUser, scopeKey]
  );

  const toggleLabsFeature = useCallback(
    (key: keyof LabsSettingsState) => {
      if (!hasLabsAccess) return;
      const now = Date.now();
      setSettings((prev) => {
        const nextVal = !prev[key];
        const next: LabsSettingsState = { ...prev, [key]: nextVal };
        if (isAdminUser) {
          const currentPlatform = readPlatformLabsConfig();
          writePlatformLabsConfig({
            settings: { ...currentPlatform.settings, [key]: nextVal },
            changedAt: { ...currentPlatform.changedAt, [key]: now },
          });
        } else {
          const currentUser = readUserLabsOverrides(scopeKey);
          writeUserLabsOverrides(scopeKey, {
            values: { ...currentUser.values, [key]: nextVal },
            changedAt: { ...currentUser.changedAt, [key]: now },
          });
        }
        return next;
      });
    },
    [hasLabsAccess, isAdminUser, scopeKey]
  );

  const setGoldenHour3D = useCallback(
    (enabled: boolean) => updateSetting('goldenHour3D', enabled),
    [updateSetting]
  );
  const setWireframeOverlay = useCallback(
    (enabled: boolean) => updateSetting('wireframeOverlay', enabled),
    [updateSetting]
  );
  const setAiLabsEnabled = useCallback(
    (enabled: boolean) => updateSetting('aiLabsEnabled', enabled),
    [updateSetting]
  );
  const setQuickNotesWidget = useCallback(
    (enabled: boolean) => updateSetting('quickNotesWidget', enabled),
    [updateSetting]
  );

  const openLabsModal = useCallback(() => {
    if (!hasLabsAccess) return;
    setIsLabsModalOpen(true);
  }, [hasLabsAccess]);

  const closeLabsModal = useCallback(() => {
    setIsLabsModalOpen(false);
  }, []);

  const openQuickNote = useCallback(() => {
    if (!hasLabsAccess) return;
    setIsQuickNoteOpen(true);
  }, [hasLabsAccess]);

  const closeQuickNote = useCallback(() => {
    setIsQuickNoteOpen(false);
  }, []);

  const value = useMemo<LabsContextType>(
    () => ({
      hasLabsAccess,
      settings,
      effectiveGoldenHour3D: hasLabsAccess && settings.goldenHour3D,
      effectiveWireframeOverlay: hasLabsAccess && settings.wireframeOverlay,
      effectiveAiLabsEnabled: hasLabsAccess && settings.aiLabsEnabled,
      effectiveQuickNotesWidget: hasLabsAccess && settings.quickNotesWidget,
      setGoldenHour3D,
      setWireframeOverlay,
      setAiLabsEnabled,
      setQuickNotesWidget,
      toggleLabsFeature,
      isLabsModalOpen,
      openLabsModal,
      closeLabsModal,
      isQuickNoteOpen,
      openQuickNote,
      closeQuickNote,
    }),
    [
      hasLabsAccess,
      settings,
      setGoldenHour3D,
      setWireframeOverlay,
      setAiLabsEnabled,
      setQuickNotesWidget,
      toggleLabsFeature,
      isLabsModalOpen,
      openLabsModal,
      closeLabsModal,
      isQuickNoteOpen,
      openQuickNote,
      closeQuickNote,
    ]
  );

  return <LabsContext.Provider value={value}>{children}</LabsContext.Provider>;
};

export function useLabs(): LabsContextType {
  const ctx = useContext(LabsContext);
  if (!ctx) {
    throw new Error('useLabs must be used within a LabsProvider');
  }
  return ctx;
}

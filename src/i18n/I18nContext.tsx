import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Language } from './types';
import viDict from './locales/vi.json';
import enDict from './locales/en.json';
import zhDict from './locales/zh.json';
import {
  getLocalizedSite,
  getLocalizedTour,
  HERITAGE_GLOSSARY,
  formatDistrict,
  removeVietnameseTones,
} from './glossary';
import { HeritageSite, TourRoute } from '../types/heritage';
import {
  REMOTE_LANG_SYNC_EVENT,
  broadcastCrossTabEvent,
  subscribeCrossTabEvents,
} from '../utils/realtimeCloudSync';

interface I18nContextType {
  lang: Language;
  setLang: (newLang: Language) => void;
  toggleLang: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatNumber: (value: number) => string;
  formatDate: (dateStr: string) => string;
  formatDuration: (hours: number | string) => string;
  formatDistrictName: (districtVi: string) => string;
  getLocalizedSite: (site: HeritageSite) => ReturnType<typeof getLocalizedSite>;
  getLocalizedTour: (tour: TourRoute) => ReturnType<typeof getLocalizedTour>;
  removeTones: typeof removeVietnameseTones;
  glossary: typeof HERITAGE_GLOSSARY;
}

const STORAGE_KEY = 'saigon_heritage_language_v1';

const dictionaries: Record<Language, Record<string, any>> = {
  vi: viDict,
  en: enDict,
  zh: zhDict,
};

const I18nContext = createContext<I18nContextType | null>(null);

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'vi';

  // 1. URL search params takes precedence (?lang=en, ?lang=vi, ?lang=zh)
  try {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang')?.toLowerCase();
    if (urlLang === 'vi' || urlLang === 'en' || urlLang === 'zh') {
      return urlLang;
    }
  } catch {
    // Ignore URL parse error
  }

  // 2. Local storage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'vi' || saved === 'en' || saved === 'zh') {
      return saved;
    }
  } catch {
    // Ignore storage error
  }

  // 3. Browser language
  try {
    const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    if (browserLang.startsWith('en')) {
      return 'en';
    }
  } catch {
    // Ignore navigator error
  }

  return 'vi';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);
  const [announcement, setAnnouncement] = useState<string>('');
  const [cmsVersion, setCmsVersion] = useState<number>(0);

  useEffect(() => {
    const onCmsUpdated = () => setCmsVersion((v) => v + 1);
    window.addEventListener('dau-an-viet-cms-updated', onCmsUpdated);
    return () => window.removeEventListener('dau-an-viet-cms-updated', onCmsUpdated);
  }, []);

  const updateDocumentMeta = useCallback((currentLang: Language) => {
    try {
      document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : currentLang;

      const dict = dictionaries[currentLang];
      if (dict?.app?.title) {
        document.title = dict.app.title;
      }
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && dict?.app?.metaDescription) {
        metaDesc.setAttribute('content', dict.app.metaDescription);
      }
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && dict?.app?.title) {
        ogTitle.setAttribute('content', dict.app.title);
      }
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && dict?.app?.metaDescription) {
        ogDesc.setAttribute('content', dict.app.metaDescription);
      }
      const twTitle = document.querySelector('meta[name="twitter:title"]');
      if (twTitle && dict?.app?.title) {
        twTitle.setAttribute('content', dict.app.title);
      }
    } catch {
      // Ignore DOM errors
    }
  }, []);

  const applyLangLocally = useCallback(
    (newLang: Language) => {
      setLangState((prev) => (prev === newLang ? prev : newLang));
      try {
        localStorage.setItem(STORAGE_KEY, newLang);

        // Update URL query string without reloading the page and maintaining scroll/history
        const url = new URL(window.location.href);
        url.searchParams.set('lang', newLang);
        window.history.replaceState({}, '', url.toString());

        updateDocumentMeta(newLang);

        // Screen reader announcement
        const announcementMsg =
          newLang === 'en'
            ? 'Language changed to English'
            : newLang === 'zh'
            ? '已切换至中文'
            : 'Đã chuyển sang Tiếng Việt';
        setAnnouncement(announcementMsg);
      } catch {
        // Ignore storage/DOM errors
      }
    },
    [updateDocumentMeta]
  );

  const setLang = useCallback(
    (newLang: Language) => {
      applyLangLocally(newLang);
      broadcastCrossTabEvent('LANG_CHANGED', { lang: newLang });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('dau-an-viet-local-lang-changed', { detail: newLang })
        );
      }
    },
    [applyLangLocally]
  );

  // Instant cross-tab & cross-device language synchronization (echo-safe)
  useEffect(() => {
    const unsubCrossTab = subscribeCrossTabEvents((msg) => {
      if (msg.type !== 'LANG_CHANGED') return;
      const incoming = (msg.payload as { lang?: unknown } | undefined)?.lang;
      if (incoming === 'vi' || incoming === 'en' || incoming === 'zh') {
        applyLangLocally(incoming);
      }
    });
    const onRemoteLang = (ev: Event) => {
      const incoming = (ev as CustomEvent<unknown>).detail;
      if (incoming === 'vi' || incoming === 'en' || incoming === 'zh') {
        applyLangLocally(incoming);
      }
    };
    window.addEventListener(REMOTE_LANG_SYNC_EVENT, onRemoteLang);
    return () => {
      unsubCrossTab();
      window.removeEventListener(REMOTE_LANG_SYNC_EVENT, onRemoteLang);
    };
  }, [applyLangLocally]);

  const toggleLang = useCallback(() => {
    setLang(lang === 'vi' ? 'en' : lang === 'en' ? 'zh' : 'vi');
  }, [lang, setLang]);

  // Synchronize document metadata on initial mount
  useEffect(() => {
    updateDocumentMeta(lang);
  }, [lang, updateDocumentMeta]);

  // Nested translation helper: t('nav.showcase') or t('search.resultsFound', { count: 3 })
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[lang] || dictionaries.vi;
      const keys = key.split('.');
      let current: any = dict;

      for (const k of keys) {
        if (current && typeof current === 'object' && k in current) {
          current = current[k];
        } else {
          // Fallback to Vietnamese dictionary
          let fallback: any = dictionaries.vi;
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in fallback) {
              fallback = fallback[fbKey];
            } else {
              fallback = undefined;
              break;
            }
          }
          current = fallback ?? key;
          break;
        }
      }

      if (typeof current !== 'string') {
        return key;
      }

      if (params) {
        return Object.entries(params).reduce((str, [paramKey, val]) => {
          return str.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(val));
        }, current);
      }

      return current;
    },
    [lang]
  );

  const formatNumber = useCallback(
    (value: number): string => {
      try {
        return new Intl.NumberFormat(
          lang === 'vi' ? 'vi-VN' : lang === 'zh' ? 'zh-CN' : 'en-US'
        ).format(value);
      } catch {
        return String(value);
      }
    },
    [lang]
  );

  // Format historical date strings like "5/6/1911", "30/4/1975", "1911-06-05"
  const formatDate = useCallback(
    (dateStr: string): string => {
      if (!dateStr) return '';
      try {
        // Check for DD/MM/YYYY pattern (e.g., 5/6/1911 or 30/4/1975)
        const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dmyMatch) {
          const day = parseInt(dmyMatch[1], 10);
          const month = parseInt(dmyMatch[2], 10);
          const year = parseInt(dmyMatch[3], 10);

          if (lang === 'vi') {
            return `${day}/${month}/${year}`;
          }
          if (lang === 'zh') {
            return `${year}年${month}月${day}日`;
          }

          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          const monthName = monthNames[month - 1] || `${month}`;
          return `${monthName} ${day}, ${year}`;
        }

        // Standard ISO or parsable Date
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;

        if (lang === 'vi') {
          return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
          }).format(date);
        }
        if (lang === 'zh') {
          return new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(date);
        }

        return new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date);
      } catch {
        return dateStr;
      }
    },
    [lang]
  );

  // Format duration strings like "3.5" or "3.5 giờ" -> "3.5 hours" / "3.5 小时"
  const formatDuration = useCallback(
    (duration: number | string): string => {
      if (!duration) return '';
      const str = String(duration);
      const match = str.match(/([\d.]+)/);
      if (match) {
        const num = parseFloat(match[1]);
        if (lang === 'vi') {
          return `${num} giờ`;
        }
        if (lang === 'zh') {
          return `${num} 小时`;
        }
        return `${num} ${num === 1 ? 'hour' : 'hours'}`;
      }
      return str;
    },
    [lang]
  );

  const formatDistrictName = useCallback(
    (districtVi: string) => formatDistrict(districtVi, lang),
    [lang]
  );

  const localizedSiteHelper = useCallback(
    (site: HeritageSite) => getLocalizedSite(site, lang),
    [lang, cmsVersion]
  );

  const localizedTourHelper = useCallback(
    (tour: TourRoute) => getLocalizedTour(tour, lang),
    [lang]
  );

  const contextValue = useMemo<I18nContextType>(
    () => ({
      lang,
      setLang,
      toggleLang,
      t,
      formatNumber,
      formatDate,
      formatDuration,
      formatDistrictName,
      getLocalizedSite: localizedSiteHelper,
      getLocalizedTour: localizedTourHelper,
      removeTones: removeVietnameseTones,
      glossary: HERITAGE_GLOSSARY,
    }),
    [
      lang,
      setLang,
      toggleLang,
      t,
      formatNumber,
      formatDate,
      formatDuration,
      formatDistrictName,
      localizedSiteHelper,
      localizedTourHelper,
    ]
  );

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
      {/* Screen reader live region */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {announcement}
      </div>
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

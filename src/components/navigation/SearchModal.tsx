import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  MapPin,
  Building,
  Box,
  Navigation,
  Clock,
  Trash2,
  ArrowRight,
  Sparkles,
  BookOpen,
  ChevronDown,
  Map,
} from 'lucide-react';
import { HeritageSite } from '../../types/heritage';
import { HERITAGE_SITES } from '../../data/heritageSites';
import { TOUR_ROUTES } from '../../data/tours';
import { ActiveNavTab } from './TopBar';
import { useI18n } from '../../i18n/I18nContext';
import {
  SITE_TRANSLATIONS,
  SITE_TRANSLATIONS_ZH,
  TOUR_TRANSLATIONS,
  TOUR_TRANSLATIONS_ZH,
} from '../../i18n/glossary';
import {
  useHeritageRealPhotos,
  resolveSitePhotos,
} from '../../utils/wikimediaPhotoService';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { HeritageOptionSearchSelect } from '../common/HeritageSiteSearchSelect';

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateView: (view: ActiveNavTab) => void;
  onSelectSite?: (site: HeritageSite) => void;
  onSelectTour?: (tourId: string) => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

type FilterCategory = 'all' | 'monument' | 'architecture' | 'scenic' | 'tours' | '3d';

interface SearchResultItem {
  id: string;
  type: 'site' | 'tour' | 'shortcut';
  title: string;
  subtitle?: string;
  category: string;
  district?: string;
  ranking?: string;
  imageUrl?: string;
  has3D?: boolean;
  rawSite?: HeritageSite;
  rawTourId?: string;
  shortcutView?: ActiveNavTab;
}

// Accent-folding normalization for Vietnamese text search ("nha rong" matches "Nhà Rồng")
function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

// Highlight matching characters in string based on search query
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim() || !text) return <span>{text}</span>;

  const normalizedText = removeVietnameseTones(text);
  const normalizedQuery = removeVietnameseTones(query);
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) return <span>{text}</span>;

  const before = text.slice(0, matchIndex);
  const match = text.slice(matchIndex, matchIndex + query.length);
  const after = text.slice(matchIndex + query.length);

  return (
    <span>
      {before}
      <mark className="bg-[#C9A46A]/35 text-[#171817] font-bold underline decoration-[#A94F3D] decoration-2 underline-offset-2 px-0.5 rounded-xs">
        {match}
      </mark>
      {after}
    </span>
  );
}

const DEFAULT_RECENT_SEARCHES = [
  'Bến Nhà Rồng',
  'Dinh Độc Lập',
  'Bưu điện Trung tâm',
  'Chợ Bến Thành',
];

const POPULAR_SUGGESTIONS = [
  'Bến Nhà Rồng',
  'Dinh Độc Lập',
  'Nhà hát Thành phố',
  'Bưu điện Trung tâm',
  'Địa đạo Củ Chi',
  'Tổ đình Giác Lâm',
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateView,
  onSelectSite,
  onSelectTour,
  triggerRef,
}) => {
  const { lang, t, formatDistrictName, getLocalizedSite, getLocalizedTour } = useI18n();
  const { customPhotosMap, wikimediaCacheMap } = useHeritageRealPhotos();
  const liveSites = useMemo(
    () =>
      HERITAGE_SITES.map((s) => ({
        ...s,
        photos: resolveSitePhotos(s, customPhotosMap, wikimediaCacheMap),
      })),
    [customPhotosMap, wikimediaCacheMap]
  );
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [isDebouncing, setIsDebouncing] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [failedThumbMap, setFailedThumbMap] = useState<Record<string, boolean>>({});
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('saigon_heritage_recent_searches');
      return saved ? JSON.parse(saved) : DEFAULT_RECENT_SEARCHES;
    } catch {
      return DEFAULT_RECENT_SEARCHES;
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  // Detect Mac OS for ⌘K vs Ctrl+K
  const isMac = useMemo(() => {
    if (typeof window === 'undefined' || !window.navigator) return false;
    return /Mac|iPod|iPhone|iPad/.test(window.navigator.userAgent);
  }, []);

  // Debounce search query 150ms
  useEffect(() => {
    if (query !== debouncedQuery) {
      setIsDebouncing(true);
      const timer = setTimeout(() => {
        setDebouncedQuery(query);
        setIsDebouncing(false);
        setSelectedIndex(0);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setIsDebouncing(false);
    }
  }, [query, debouncedQuery]);

  // Focus trap & autofocus
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timeoutId = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => {
        clearTimeout(timeoutId);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      // Restore focus to trigger
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    }
  }, [isOpen, triggerRef]);

  // Unique list of districts from HERITAGE_SITES
  const districtsList = useMemo(() => {
    const set = new Set<string>();
    HERITAGE_SITES.forEach((s) => set.add(s.address.district));
    return Array.from(set).sort();
  }, []);

  // Save recent search
  const addRecentSearch = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const updated = [trimmed, ...prev.filter((t) => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('saigon_heritage_recent_searches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Clear all recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('saigon_heritage_recent_searches');
    } catch {}
  }, []);

  // Filtered Results Calculation
  const groupedResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return { sites: [], tours: [], allItems: [] };
    }

    const nQuery = removeVietnameseTones(debouncedQuery);

    // 1. Heritage sites matching (Multilingual Vietnamese, English & Chinese matching)
    let matchedSites = liveSites.filter((site) => {
      // Category filter check
      if (activeFilter === 'monument' && site.type !== 'History') return false;
      if (activeFilter === 'architecture' && site.type !== 'Architecture') return false;
      if (activeFilter === 'scenic' && site.type !== 'Archaeology' && site.type !== 'Scenic') return false;
      if (activeFilter === '3d' && !site.has3D) return false;
      if (activeFilter === 'tours') return false;

      // District filter check
      if (selectedDistrict !== 'all' && site.address.district !== selectedDistrict) return false;

      // Search match check (Vietnamese, English, and Chinese fields)
      const nOfficial = removeVietnameseTones(site.officialName);
      const nFolk = removeVietnameseTones(site.folkName || '');
      const nCode = removeVietnameseTones(site.identifierCode);
      const nStreet = removeVietnameseTones(site.address.street);
      const nDistrict = removeVietnameseTones(site.address.district);
      const nArchitect = removeVietnameseTones(site.architect);
      const nSummary = removeVietnameseTones(site.summary);
      const nStyle = removeVietnameseTones(site.architecturalStyle);

      const enData = SITE_TRANSLATIONS[site.id];
      const nEnOfficial = enData?.officialName ? removeVietnameseTones(enData.officialName) : '';
      const nEnFolk = enData?.folkName ? removeVietnameseTones(enData.folkName) : '';
      const nEnArchitect = enData?.architect ? removeVietnameseTones(enData.architect) : '';
      const nEnSummary = enData?.summary ? removeVietnameseTones(enData.summary) : '';

      const zhData = SITE_TRANSLATIONS_ZH[site.id];
      const nZhOfficial = zhData?.officialName ? removeVietnameseTones(zhData.officialName) : '';
      const nZhFolk = zhData?.folkName ? removeVietnameseTones(zhData.folkName) : '';
      const nZhSummary = zhData?.summary ? removeVietnameseTones(zhData.summary) : '';

      return (
        nOfficial.includes(nQuery) ||
        nFolk.includes(nQuery) ||
        nCode.includes(nQuery) ||
        nStreet.includes(nQuery) ||
        nDistrict.includes(nQuery) ||
        nArchitect.includes(nQuery) ||
        nSummary.includes(nQuery) ||
        nStyle.includes(nQuery) ||
        nEnOfficial.includes(nQuery) ||
        nEnFolk.includes(nQuery) ||
        nEnArchitect.includes(nQuery) ||
        nEnSummary.includes(nQuery) ||
        nZhOfficial.includes(nQuery) ||
        nZhFolk.includes(nQuery) ||
        nZhSummary.includes(nQuery)
      );
    });

    // 2. Tours matching (Multilingual)
    let matchedTours = TOUR_ROUTES.filter((tour) => {
      if (activeFilter === 'monument' || activeFilter === 'architecture' || activeFilter === 'scenic' || activeFilter === '3d') {
        return false;
      }
      const nTitle = removeVietnameseTones(tour.title);
      const nSub = removeVietnameseTones(tour.subtitle);
      const nDesc = removeVietnameseTones(tour.description);
      const nTheme = removeVietnameseTones(tour.theme);

      const enTourData = TOUR_TRANSLATIONS[tour.id];
      const nEnTitle = enTourData?.title ? removeVietnameseTones(enTourData.title) : '';
      const nEnSub = enTourData?.subtitle ? removeVietnameseTones(enTourData.subtitle) : '';
      const nEnDesc = enTourData?.description ? removeVietnameseTones(enTourData.description) : '';

      const zhTourData = TOUR_TRANSLATIONS_ZH[tour.id];
      const nZhTitle = zhTourData?.title ? removeVietnameseTones(zhTourData.title) : '';
      const nZhSub = zhTourData?.subtitle ? removeVietnameseTones(zhTourData.subtitle) : '';
      const nZhDesc = zhTourData?.description ? removeVietnameseTones(zhTourData.description) : '';

      return (
        nTitle.includes(nQuery) ||
        nSub.includes(nQuery) ||
        nDesc.includes(nQuery) ||
        nTheme.includes(nQuery) ||
        nEnTitle.includes(nQuery) ||
        nEnSub.includes(nQuery) ||
        nEnDesc.includes(nQuery) ||
        nZhTitle.includes(nQuery) ||
        nZhSub.includes(nQuery) ||
        nZhDesc.includes(nQuery)
      );
    });

    // Flattened items for keyboard indexing
    const allItems: SearchResultItem[] = [];

    matchedSites.forEach((site) => {
      const loc = getLocalizedSite(site);
      allItems.push({
        id: site.id,
        type: 'site',
        title: loc.officialName,
        subtitle: loc.folkName || loc.address.street,
        category: t(`types.${site.type}`),
        district: site.address.district,
        ranking: t(`rankings.${site.rankingLevel}`),
        imageUrl: site.photos[0],
        has3D: site.has3D,
        rawSite: site,
      });
    });

    matchedTours.forEach((tour) => {
      const loc = getLocalizedTour(tour);
      allItems.push({
        id: tour.id,
        type: 'tour',
        title: loc.title,
        subtitle: `${loc.estimatedDuration} • ${tour.distanceKm} km • ${tour.sites.length} ${t('common.stops')}`,
        category: t('tours.header'),
        rawTourId: tour.id,
      });
    });

    return {
      sites: matchedSites,
      tours: matchedTours,
      allItems,
    };
  }, [debouncedQuery, activeFilter, selectedDistrict, getLocalizedSite, getLocalizedTour, t, liveSites]);

  // Featured Sites for Untyped state (4-5 authentic landmarks)
  const featuredSites = useMemo(() => {
    return liveSites.filter((s) =>
      ['HCM-DT-007', 'HCM-DT-001', 'HCM-DT-003', 'HCM-DT-004', 'HCM-DT-005'].includes(s.id)
    ).slice(0, 5);
  }, [liveSites]);

  // Handle Item Selection
  const handleSelectItem = useCallback((item: SearchResultItem) => {
    if (item.type === 'site' && item.rawSite) {
      addRecentSearch(item.rawSite.officialName);
      if (onSelectSite) {
        onSelectSite(item.rawSite);
      } else {
        onNavigateView('map');
      }
      onClose();
    } else if (item.type === 'tour') {
      addRecentSearch(item.title);
      if (onSelectTour && item.rawTourId) {
        onSelectTour(item.rawTourId);
      }
      onNavigateView('tours');
      onClose();
    } else if (item.type === 'shortcut' && item.shortcutView) {
      onNavigateView(item.shortcutView);
      onClose();
    }
  }, [addRecentSearch, onSelectSite, onSelectTour, onNavigateView, onClose]);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    const itemsCount = groupedResults.allItems.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (itemsCount > 0) {
        setSelectedIndex((prev) => (prev + 1) % itemsCount);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (itemsCount > 0) {
        setSelectedIndex((prev) => (prev - 1 + itemsCount) % itemsCount);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (itemsCount > 0 && groupedResults.allItems[selectedIndex]) {
        handleSelectItem(groupedResults.allItems[selectedIndex]);
      } else if (query.trim()) {
        addRecentSearch(query);
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const activeEl = document.getElementById(`search-result-item-${selectedIndex}`);
    if (activeEl && resultsListRef.current) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const filterChips = [
    { id: 'all' as const, label: t('search.filterAll') },
    { id: 'monument' as const, label: t('search.filterMonument') },
    { id: 'architecture' as const, label: t('search.filterArchitecture') },
    { id: 'scenic' as const, label: t('search.filterScenic') },
    { id: 'tours' as const, label: t('search.filterTours') },
    { id: '3d' as const, label: t('search.filter3D') },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('search.title')}
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#171817]/65 backdrop-blur-[6px] animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalContainerRef}
        className="search-modal-container relative w-full sm:max-w-[640px] sm:mt-[12vh] h-[100svh] sm:h-auto sm:max-h-[78vh] bg-[#F4EFE4] sm:rounded-2xl border-0 sm:border sm:border-[#171817]/20 shadow-2xl flex flex-col overflow-hidden text-[#171817]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#171817]/15 bg-[#EDE4D0] pt-[max(env(safe-area-inset-top),14px)] sm:pt-4">
          <Search className="w-5 h-5 text-[#A94F3D] shrink-0" aria-hidden="true" />

          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={true}
            aria-controls="search-results-list"
            aria-autocomplete="list"
            aria-activedescendant={
              groupedResults.allItems.length > 0 ? `search-result-item-${selectedIndex}` : undefined
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent text-[17px] sm:text-[18px] font-sans text-[#171817] placeholder-[#171817]/50 focus:outline-none leading-normal min-w-0"
          />

          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <kbd className="px-2 py-0.5 text-[11px] font-sans font-medium bg-[#F4EFE4] text-[#171817] border border-[#171817]/18 rounded-md select-none">
              {isMac ? '⌘K' : 'Ctrl+K'}
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[11px] font-sans text-[#171817]/70 bg-[#F4EFE4] border border-[#171817]/15 rounded-md select-none">
              ESC
            </kbd>
          </div>

          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0 rounded-lg flex items-center justify-center text-[#171817]/70 hover:text-[#171817] hover:bg-[#171817]/10 active:scale-95 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A94F3D]"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#EDE4D0]/70 border-b border-[#171817]/12 overflow-x-auto flex-nowrap heritage-scrollbar scroll-smooth touch-pan-x">
          {filterChips.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => {
                  setActiveFilter(filter.id);
                  setSelectedIndex(0);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer border select-none ${
                  isActive
                    ? 'bg-[#A94F3D] text-[#D8C9A9] font-semibold border-[#A94F3D]'
                    : 'bg-[#F4EFE4] text-[#171817]/80 border-[#171817]/15 hover:border-[#171817]/35 hover:text-[#171817]'
                }`}
              >
                {filter.label}
              </button>
            );
          })}

          <div className="shrink-0 ml-1 min-w-[155px] max-w-[210px]">
            <HeritageOptionSearchSelect
              value={selectedDistrict}
              defaultValue="all"
              onChange={(nextVal) => {
                setSelectedDistrict(nextVal);
                setSelectedIndex(0);
              }}
              size="xs"
              tone="dark"
              ariaLabel={t('catalog.filterDistrict')}
              options={[
                { value: 'all', label: t('search.allDistricts') },
                ...districtsList.map((district) => ({
                  value: district,
                  label: formatDistrictName(district),
                })),
              ]}
            />
          </div>
        </div>

        <div
          ref={resultsListRef}
          role="listbox"
          id="search-results-list"
          aria-label="Danh sách kết quả tìm kiếm"
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-6 text-left"
        >
          {isDebouncing && (
            <div className="space-y-3" aria-busy="true" aria-label="Đang tìm kiếm...">
              <div className="h-3 w-32 bg-[#171817]/10 rounded animate-pulse" />
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-3 rounded-xl bg-[#EDE4D0] border border-[#171817]/12 flex items-center gap-3.5 animate-pulse"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#171817]/10 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-[#171817]/10 rounded" />
                    <div className="h-3 w-1/2 bg-[#171817]/8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isDebouncing && !debouncedQuery.trim() && (
            <>
              {recentSearches.length > 0 && (
                <section aria-labelledby="heading-recent-searches" className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2
                      id="heading-recent-searches"
                      className="text-xs font-sans font-semibold text-[#A94F3D]"
                    >
                      {t('search.recentSearches')}
                    </h2>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[11px] text-[#171817]/65 hover:text-[#171817] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{t('search.clearHistory')}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => {
                          setQuery(term);
                          inputRef.current?.focus();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE4D0] hover:bg-[#C9A46A]/35 border border-[#171817]/15 hover:border-[#A94F3D] text-xs sm:text-sm text-[#171817] transition-all cursor-pointer"
                      >
                        <Clock className="w-3 h-3 text-[#A94F3D]" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section aria-labelledby="heading-featured-sites" className="space-y-2.5">
                <h2
                  id="heading-featured-sites"
                  className="text-xs font-sans font-semibold text-[#A94F3D]"
                >
                  {t('showcase.featuredTitle', { defaultValue: 'Featured Monuments' })}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {featuredSites.map((site) => {
                    const loc = getLocalizedSite(site);
                    return (
                      <button
                        key={site.id}
                        onClick={() =>
                          handleSelectItem({
                            id: site.id,
                            type: 'site',
                            title: loc.officialName,
                            category: t(`types.${site.type}`),
                            rawSite: site,
                          })
                        }
                        className="p-2.5 rounded-xl bg-[#EDE4D0] hover:bg-[#D8C9A9] border border-[#171817]/15 hover:border-[#A94F3D] transition-all flex items-center gap-3 text-left cursor-pointer group"
                      >
                        <div className="w-20 aspect-video rounded-lg overflow-hidden shrink-0 bg-[#171817] border border-[#171817]/15">
                          {site.photos?.[0] && !failedThumbMap[site.id] ? (
                            <HeritageSmoothImage
                              src={site.photos[0]}
                              alt={loc.officialName}
                              waitTone="dark"
                              onError={() =>
                                setFailedThumbMap((prev) => ({ ...prev, [site.id]: true }))
                              }
                              className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                            />
                          ) : (
                            <HeritageTypographicPlate site={site} variant="compact" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[#171817] truncate">
                            {loc.officialName}
                          </div>
                          <div className="text-xs text-[#171817]/70 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#A94F3D]" />
                            <span>{formatDistrictName(site.address.district)}</span>
                            <span className="text-[#171817]/25">•</span>
                            <span className="text-[#47796D] font-medium truncate">
                              {site.rankingLevel === 'Special National'
                                ? (lang === 'en' ? 'Special National' : 'Đặc biệt')
                                : (lang === 'en' ? 'National' : 'Quốc gia')}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section aria-labelledby="heading-shortcuts" className="space-y-2.5">
                <h2
                  id="heading-shortcuts"
                  className="text-xs font-sans font-semibold text-[#A94F3D]"
                >
                  {t('search.shortcuts')}
                </h2>

                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  {[
                    {
                      label: t('nav.map'),
                      icon: Map,
                      view: 'map' as ActiveNavTab,
                      desc: t('map.spatialAnalysis'),
                    },
                    {
                      label: t('nav.catalog'),
                      icon: BookOpen,
                      view: 'catalog' as ActiveNavTab,
                      desc: t('catalog.subtitle'),
                    },
                    {
                      label: t('nav.3d'),
                      icon: Box,
                      view: '3d' as ActiveNavTab,
                      desc: t('3d.subHeader'),
                    },
                    {
                      label: t('nav.tours'),
                      icon: Navigation,
                      view: 'tours' as ActiveNavTab,
                      desc: t('tours.subHeader'),
                    },
                  ].map((shortcut) => {
                    const Icon = shortcut.icon;
                    return (
                      <button
                        key={shortcut.view}
                        onClick={() => {
                          onNavigateView(shortcut.view);
                          onClose();
                        }}
                        className="p-3 rounded-xl bg-[#EDE4D0] hover:bg-[#D8C9A9] border border-[#171817]/15 hover:border-[#47796D] text-left flex flex-col gap-1 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 font-medium text-[#171817]">
                          <Icon className="w-4 h-4 text-[#47796D] shrink-0" />
                          <span className="truncate">{shortcut.label}</span>
                        </div>
                        <span className="text-[11px] text-[#171817]/70 truncate pl-6">
                          {shortcut.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {!isDebouncing && debouncedQuery.trim() && groupedResults.allItems.length > 0 && (
            <div className="space-y-5">
              {groupedResults.sites.length > 0 && (
                <section aria-labelledby="heading-result-sites" className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-sans font-semibold text-[#A94F3D]">
                    <span id="heading-result-sites">{t('search.resultsSites')}</span>
                    <span className="text-[#171817]/70 font-normal tabular-nums">
                      {t('search.resultsFound', { count: groupedResults.sites.length })}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {groupedResults.allItems
                      .map((item, index) => ({ item, index }))
                      .filter(({ item }) => item.type === 'site')
                      .map(({ item, index }) => {
                        const isSelected = selectedIndex === index;
                        return (
                          <div
                            key={item.id}
                            id={`search-result-item-${index}`}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelectItem(item)}
                            className={`p-2.5 sm:p-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer border ${
                              isSelected
                                ? 'bg-[#C9A46A]/35 border-[#A94F3D] text-[#171817]'
                                : 'bg-[#EDE4D0] border-[#171817]/15 hover:bg-[#D8C9A9] text-[#171817]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {item.imageUrl && !failedThumbMap[item.id] ? (
                                <HeritageSmoothImage
                                  src={item.imageUrl}
                                  alt=""
                                  waitTone="dark"
                                  onError={() =>
                                    setFailedThumbMap((prev) => ({ ...prev, [item.id]: true }))
                                  }
                                  className="w-20 aspect-video rounded-lg object-cover border border-[#171817]/15 shrink-0"
                                />
                              ) : item.rawSite ? (
                                <div className="w-20 aspect-video rounded-lg overflow-hidden shrink-0">
                                  <HeritageTypographicPlate site={item.rawSite} variant="compact" />
                                </div>
                              ) : (
                                <div className="w-20 aspect-video rounded-lg bg-[#D8C9A9] border border-[#171817]/15 flex items-center justify-center shrink-0">
                                  <Building className="w-5 h-5 text-[#A94F3D]" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1 text-left">
                                <div className="text-sm sm:text-[15px] font-semibold text-[#171817] truncate leading-tight">
                                  <HighlightMatch text={item.title} query={debouncedQuery} />
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-[#171817]/70">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-[#A94F3D]" />
                                    <span>{item.district ? formatDistrictName(item.district) : ''}</span>
                                  </span>
                                  <span className="text-[#171817]/25">•</span>
                                  <span className="text-[#47796D] font-medium">{item.ranking}</span>
                                  {item.has3D && (
                                    <>
                                      <span className="text-[#171817]/25">•</span>
                                      <span className="inline-flex items-center gap-0.5 text-[10.5px] font-sans font-semibold px-1.5 py-0.2 rounded bg-[#C9A46A] text-[#171817] border border-[#171817]/18">
                                        3D LiDAR
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[#171817] px-2.5 py-1 rounded-md bg-[#F4EFE4] border border-[#171817]/20 hover:bg-[#A94F3D] hover:text-[#D8C9A9] transition-colors">
                                <span>{t('catalog.viewOnMap')}</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}

              {groupedResults.tours.length > 0 && (
                <section aria-labelledby="heading-result-tours" className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-sans font-semibold text-[#47796D]">
                    <span id="heading-result-tours">{t('search.resultsTours')}</span>
                    <span className="text-[#171817]/70 font-normal tabular-nums">
                      {groupedResults.tours.length} {t('nav.tours')}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {groupedResults.allItems
                      .map((item, index) => ({ item, index }))
                      .filter(({ item }) => item.type === 'tour')
                      .map(({ item, index }) => {
                        const isSelected = selectedIndex === index;
                        return (
                          <div
                            key={item.id}
                            id={`search-result-item-${index}`}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelectItem(item)}
                            className={`p-3 rounded-xl transition-all flex items-center justify-between gap-3 cursor-pointer border ${
                              isSelected
                                ? 'bg-[#47796D]/25 border-[#47796D] text-[#171817]'
                                : 'bg-[#EDE4D0] border-[#171817]/15 hover:bg-[#D8C9A9] text-[#171817]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-[#47796D] text-[#171817] flex items-center justify-center shrink-0">
                                <Navigation className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <div className="text-sm font-semibold truncate text-[#171817]">
                                  <HighlightMatch text={item.title} query={debouncedQuery} />
                                </div>
                                <div className="text-xs text-[#171817]/70 truncate mt-0.5">
                                  {item.subtitle}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-[#47796D] font-semibold flex items-center gap-1 shrink-0">
                              <span>{t('search.exploreTour')}</span>
                              <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}
            </div>
          )}

          {!isDebouncing && debouncedQuery.trim() && groupedResults.allItems.length === 0 && (
            <div className="py-8 sm:py-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#EDE4D0] border border-[#171817]/15 flex items-center justify-center text-[#A94F3D]">
                <Search className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-medium text-[#171817]">
                  {t('search.noResults')} &ldquo;{debouncedQuery}&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-[#171817]/70 max-w-sm mx-auto">
                  {t('search.noResultsSub')}
                </p>
              </div>

              <div className="pt-2">
                <div className="text-xs font-sans font-medium text-[#A94F3D] mb-2">
                  {t('search.popularSuggestions')}
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {POPULAR_SUGGESTIONS.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => {
                        setQuery(sug);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-1 rounded-full bg-[#EDE4D0] hover:bg-[#C9A46A] border border-[#171817]/15 text-xs text-[#171817] transition-colors cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => {
                    onNavigateView('map');
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#A94F3D] text-[#D8C9A9] font-semibold text-xs hover:bg-[#171817] transition-colors cursor-pointer"
                >
                  <Map className="w-4 h-4" />
                  <span>{t('search.viewOnMap')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:flex shrink-0 items-center justify-between px-5 py-2.5 bg-[#EDE4D0] border-t border-[#171817]/15 text-[11px] font-sans text-[#171817]/70 tabular-nums">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#F4EFE4] text-[#171817] border border-[#171817]/18">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-[#F4EFE4] text-[#171817] border border-[#171817]/18">↓</kbd>
              <span>{lang === 'en' ? 'Navigate' : 'Di chuyển'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#F4EFE4] text-[#171817] border border-[#171817]/18">↵</kbd>
              <span>{lang === 'en' ? 'Select' : 'Chọn mở'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-[#F4EFE4] text-[#171817] border border-[#171817]/18">ESC</kbd>
              <span>{t('common.close')}</span>
            </span>
          </div>

          <span className="text-[#A94F3D] font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#A94F3D]" />
            <span>{lang === 'en' ? 'HCMC GIS Heritage Search' : 'Hệ thống tìm kiếm GIS TP.HCM'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

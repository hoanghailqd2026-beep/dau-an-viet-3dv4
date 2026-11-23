import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Landmark, Search, X } from 'lucide-react';
import type { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import {
  CustomPhotosMap,
  resolveSitePhotoSlots,
  WikimediaCacheMap,
} from '../../utils/wikimediaPhotoService';
import {
  getHeritageRegionChipLabel,
  getHeritageRegionGroup,
  getHeritageSubtitle,
  HeritageRegionFilter,
  matchesHeritageSiteQuery,
} from '../../utils/heritageSearch';

const REGION_FILTERS: HeritageRegionFilter[] = ['all', 'HCM', 'BD', 'BRVT'];

export interface HeritageSiteListPanelProps {
  sites: HeritageSite[];
  /** Optional full canonical list used to preserve consistent 01..17 numbering */
  canonicalSites?: HeritageSite[];
  selectedSiteId?: string | null;
  onSelectSite: (site: HeritageSite) => void;
  /** Controlled external search query (if omitted, uses internal query state) */
  searchQuery?: string;
  onSearchQueryChange?: (val: string) => void;
  /** Show compact search input right below panel heading */
  showInternalSearch?: boolean;
  /** Show region quick-filter pills (Tất cả, TP.HCM, Bình Dương, Bà Rịa - Vũng Tàu) */
  showRegionFilters?: boolean;
  /** Optional controlled region filter */
  regionFilter?: HeritageRegionFilter;
  onRegionFilterChange?: (region: HeritageRegionFilter) => void;
  /** Custom uppercase heading prefix (defaults to KẾT QUẢ TÌM KIẾM DI TÍCH) */
  headingLabel?: string;
  onClose?: () => void;
  customPhotosMap?: CustomPhotosMap;
  wikimediaCacheMap?: WikimediaCacheMap;
  hiddenSiteIds?: string[];
  canPreviewHidden?: boolean;
  maxListHeightClass?: string;
  className?: string;
  autoFocusSearch?: boolean;
}

export const HeritageSiteListPanel: React.FC<HeritageSiteListPanelProps> = ({
  sites,
  canonicalSites,
  selectedSiteId,
  onSelectSite,
  searchQuery: controlledQuery,
  onSearchQueryChange,
  showInternalSearch = false,
  showRegionFilters = true,
  regionFilter: controlledRegion,
  onRegionFilterChange,
  headingLabel,
  onClose,
  customPhotosMap,
  wikimediaCacheMap,
  hiddenSiteIds = [],
  canPreviewHidden = false,
  maxListHeightClass = 'max-h-[300px]',
  className = '',
  autoFocusSearch = false,
}) => {
  const { lang, getLocalizedSite, formatDistrictName } = useI18n();
  const [internalQuery, setInternalQuery] = useState('');
  const [internalRegion, setInternalRegion] = useState<HeritageRegionFilter>('all');
  const [failedThumbIds, setFailedThumbIds] = useState<Record<string, boolean>>({});
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const query = controlledQuery !== undefined ? controlledQuery : internalQuery;
  const setQuery = (next: string) => {
    if (onSearchQueryChange) onSearchQueryChange(next);
    else setInternalQuery(next);
  };

  const region = controlledRegion !== undefined ? controlledRegion : internalRegion;
  const setRegion = (next: HeritageRegionFilter) => {
    if (onRegionFilterChange) onRegionFilterChange(next);
    else setInternalRegion(next);
  };

  useEffect(() => {
    if (autoFocusSearch && showInternalSearch) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
  }, [autoFocusSearch, showInternalSearch]);

  const canonicalIndexMap = useMemo(() => {
    const base = canonicalSites && canonicalSites.length > 0 ? canonicalSites : sites;
    const map = new Map<string, number>();
    base.forEach((s, i) => map.set(s.id, i));
    return map;
  }, [canonicalSites, sites]);

  const filteredItems = useMemo(() => {
    return sites
      .map((site, fallbackIdx) => {
        const canonicalIndex = canonicalIndexMap.get(site.id) ?? fallbackIdx;
        return { site, canonicalIndex };
      })
      .filter(({ site, canonicalIndex }) => {
        if (region !== 'all' && getHeritageRegionGroup(site) !== region) {
          return false;
        }
        const loc = getLocalizedSite(site);
        return matchesHeritageSiteQuery({
          site,
          canonicalIndex,
          rawQuery: query,
          localizedName: loc.officialName,
          localizedFolkName: loc.folkName,
          localizedSummary: loc.summary,
        });
      });
  }, [sites, canonicalIndexMap, region, query, getLocalizedSite]);

  const resolvedHeading =
    headingLabel ||
    (lang === 'en'
      ? 'MONUMENT SEARCH RESULTS'
      : lang === 'zh'
      ? '遗迹检索结果'
      : 'KẾT QUẢ TÌM KIẾM DI TÍCH');

  return (
    <div
      role="listbox"
      aria-label={`${resolvedHeading} (${filteredItems.length})`}
      className={`rounded-xl bg-[#171817] border border-[#C9A46A]/35 shadow-2xl overflow-hidden text-[#D8C9A9] z-50 ${className}`}
    >
      {/* Header + Quick Search + Region Chips */}
      <div className="px-3 pt-2.5 pb-2 bg-[#171817] border-b border-[#C9A46A]/22 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-[#C9A46A] truncate tabular-nums">
            {resolvedHeading} ({filteredItems.length})
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'en' ? 'Close' : lang === 'zh' ? '关闭' : 'Đóng'}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[#D8C9A9]/65 hover:text-[#C9A46A] hover:bg-[#222321] transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.6} />
            </button>
          )}
        </div>

        {showInternalSearch && (
          <div className="relative flex items-center rounded-lg bg-[#222321] border border-[#C9A46A]/28 focus-within:border-[#C9A46A] transition-colors">
            <Search
              className="w-3.5 h-3.5 text-[#C9A46A]/80 absolute left-2.5 pointer-events-none"
              strokeWidth={1.6}
            />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'Filter by name, number (01–17), district...'
                  : lang === 'zh'
                  ? '按名称、编号 (01–17) 或区域筛选...'
                  : 'Lọc nhanh tên di tích, số 01–17, quận...'
              }
              className="w-full pl-8 pr-7 py-1.5 bg-transparent text-xs text-[#D8C9A9] placeholder:text-[#D8C9A9]/45 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={lang === 'en' ? 'Clear' : lang === 'zh' ? '清除' : 'Xóa từ khóa'}
                className="absolute right-2 text-[#D8C9A9]/65 hover:text-[#C9A46A] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" strokeWidth={1.6} />
              </button>
            )}
          </div>
        )}

        {showRegionFilters && (
          <div className="flex flex-wrap items-center gap-1">
            {REGION_FILTERS.map((regKey) => {
              const active = region === regKey;
              return (
                <button
                  key={regKey}
                  type="button"
                  onClick={() => setRegion(regKey)}
                  className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium transition-colors cursor-pointer border whitespace-nowrap ${
                    active
                      ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817] font-semibold'
                      : 'bg-[#222321] border-[#C9A46A]/20 text-[#D8C9A9]/75 hover:text-[#D8C9A9] hover:border-[#C9A46A]/50'
                  }`}
                >
                  {getHeritageRegionChipLabel(regKey, lang)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results List */}
      <div
        className={`${maxListHeightClass} overflow-y-auto modal-scrollbar p-1.5 space-y-1 bg-[#171817]`}
      >
        {filteredItems.length > 0 ? (
          filteredItems.map(({ site, canonicalIndex }) => {
            const isSelected = selectedSiteId === site.id;
            const locS = getLocalizedSite(site);
            const cleanName = locS.officialName.split(/\s*[（(]/)[0];
            const numCode = String(canonicalIndex + 1).padStart(2, '0');
            const subtitle = getHeritageSubtitle(site, formatDistrictName, lang);

            const resolvedThumb =
              customPhotosMap && wikimediaCacheMap
                ? resolveSitePhotoSlots(site.id, customPhotosMap, wikimediaCacheMap).slots[0] ||
                  site.photos?.[0] ||
                  ''
                : site.photos?.[0] || '';
            const showThumb = Boolean(resolvedThumb && !failedThumbIds[site.id]);
            const isHidden = hiddenSiteIds.includes(site.id);

            return (
              <button
                key={`heritage-res-${site.id}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelectSite(site)}
                className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2.5 border transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-[#C9A46A]/50 bg-[#C9A46A]/12'
                    : 'border-transparent hover:border-[#C9A46A]/50 hover:bg-[#C9A46A]/12'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-9 h-9 rounded-full overflow-hidden border border-[#C9A46A]/30 bg-[#222321] flex items-center justify-center shrink-0">
                    {showThumb ? (
                      <img
                        src={resolvedThumb}
                        alt={cleanName}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedThumbIds((prev) =>
                            prev[site.id] ? prev : { ...prev, [site.id]: true }
                          )
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Landmark className="w-4 h-4 text-[#C9A46A]" strokeWidth={1.6} />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="tabular-nums text-xs font-semibold text-[#C9A46A] shrink-0">
                        {numCode}
                      </span>
                      <span className="text-xs sm:text-[13px] font-semibold text-[#D8C9A9] truncate">
                        {cleanName}
                      </span>
                      {isHidden && canPreviewHidden && (
                        <span className="px-1.5 py-0.5 rounded bg-[#222321] border border-[#C9A46A]/50 text-[#C9A46A] text-[9px] font-semibold shrink-0">
                          {lang === 'en' ? 'Hidden' : lang === 'zh' ? '隐藏' : 'Đang ẩn'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#D8C9A9]/60 truncate mt-0.5">
                      {subtitle}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" strokeWidth={2} />
                )}
              </button>
            );
          })
        ) : (
          <div className="px-4 py-6 text-center text-xs text-[#D8C9A9]/65">
            {lang === 'en'
              ? 'No monuments match this search keyword'
              : lang === 'zh'
              ? '未找到符合该关键词的遗迹'
              : 'Không tìm thấy di tích phù hợp với từ khóa này'}
          </div>
        )}
      </div>
    </div>
  );
};

/* ============================================================================
   HERITAGE SEARCH COMBOBOX (Search input + opaque #171817 museum dropdown)
============================================================================ */
export interface HeritageSearchComboboxProps {
  sites: HeritageSite[];
  canonicalSites?: HeritageSite[];
  selectedSiteId?: string | null;
  value: string;
  onChange: (val: string) => void;
  onSelectSite: (site: HeritageSite) => void;
  placeholder?: string;
  /** Input visual tone: 'light' on parchment surfaces, 'dark' on obsidian surfaces */
  tone?: 'light' | 'dark';
  headingLabel?: string;
  regionFilter?: HeritageRegionFilter;
  onRegionFilterChange?: (region: HeritageRegionFilter) => void;
  showRegionFilters?: boolean;
  customPhotosMap?: CustomPhotosMap;
  wikimediaCacheMap?: WikimediaCacheMap;
  hiddenSiteIds?: string[];
  canPreviewHidden?: boolean;
  dropdownAlign?: 'left' | 'right';
  dropdownWidthClass?: string;
  inputClassName?: string;
  className?: string;
}

export const HeritageSearchCombobox: React.FC<HeritageSearchComboboxProps> = ({
  sites,
  canonicalSites,
  selectedSiteId,
  value,
  onChange,
  onSelectSite,
  placeholder,
  tone = 'light',
  headingLabel,
  regionFilter,
  onRegionFilterChange,
  showRegionFilters = true,
  customPhotosMap,
  wikimediaCacheMap,
  hiddenSiteIds,
  canPreviewHidden,
  dropdownAlign = 'left',
  dropdownWidthClass = 'w-full min-w-[280px]',
  inputClassName = '',
  className = '',
}) => {
  const { lang } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const resolvedPlaceholder =
    placeholder ||
    (lang === 'en'
      ? 'Search 17 monuments, number (01–17), district...'
      : lang === 'zh'
      ? '搜索 17 处遗迹、编号或区域...'
      : 'Tìm kiếm 17 di tích, mã số 01–17, địa danh...');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`relative flex items-center rounded-full border transition-colors ${
          tone === 'dark'
            ? 'bg-[#222321] border-[#C9A46A]/28 focus-within:border-[#C9A46A]'
            : 'bg-[#F4EFE4] border-[#171817]/20 focus-within:border-[#A94F3D]'
        }`}
      >
        <Search
          className={`w-4 h-4 absolute left-3.5 pointer-events-none ${
            tone === 'dark' ? 'text-[#C9A46A]' : 'text-[#171817]/60'
          }`}
          strokeWidth={1.6}
        />
        <input
          type="text"
          value={value}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          placeholder={resolvedPlaceholder}
          className={`w-full pl-10 pr-9 py-2 bg-transparent text-xs sm:text-sm focus:outline-none ${
            tone === 'dark'
              ? 'text-[#D8C9A9] placeholder:text-[#D8C9A9]/45'
              : 'text-[#171817] placeholder:text-[#171817]/50'
          } ${inputClassName}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
            }}
            aria-label={lang === 'en' ? 'Clear search' : lang === 'zh' ? '清除搜索' : 'Xóa từ khóa'}
            className={`absolute right-3 transition-colors cursor-pointer ${
              tone === 'dark'
                ? 'text-[#D8C9A9]/65 hover:text-[#C9A46A]'
                : 'text-[#171817]/60 hover:text-[#A94F3D]'
            }`}
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.6} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 ${
            dropdownAlign === 'right' ? 'right-0' : 'left-0'
          } ${dropdownWidthClass}`}
        >
          <HeritageSiteListPanel
            sites={sites}
            canonicalSites={canonicalSites}
            selectedSiteId={selectedSiteId}
            searchQuery={value}
            onSearchQueryChange={onChange}
            showInternalSearch={false}
            showRegionFilters={showRegionFilters}
            regionFilter={regionFilter}
            onRegionFilterChange={onRegionFilterChange}
            headingLabel={headingLabel}
            customPhotosMap={customPhotosMap}
            wikimediaCacheMap={wikimediaCacheMap}
            hiddenSiteIds={hiddenSiteIds}
            canPreviewHidden={canPreviewHidden}
            onClose={() => setIsOpen(false)}
            onSelectSite={(site) => {
              onSelectSite(site);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   HERITAGE SITE PICKER DROPDOWN (Replaces native <select> for 17 sites)
============================================================================ */
export interface HeritageSitePickerDropdownProps {
  sites: HeritageSite[];
  selectedSiteId: string;
  onSelectSite: (site: HeritageSite) => void;
  headingLabel?: string;
  placement?: 'bottom' | 'top';
  align?: 'left' | 'right';
  triggerClassName?: string;
  dropdownWidthClass?: string;
  ariaLabel?: string;
}

export const HeritageSitePickerDropdown: React.FC<HeritageSitePickerDropdownProps> = ({
  sites,
  selectedSiteId,
  onSelectSite,
  headingLabel,
  placement = 'bottom',
  align = 'left',
  triggerClassName = '',
  dropdownWidthClass = 'w-full min-w-[290px]',
  ariaLabel,
}) => {
  const { lang, getLocalizedSite, formatDistrictName } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedIndex = Math.max(
    0,
    sites.findIndex((s) => s.id === selectedSiteId)
  );
  const selectedSite = sites[selectedIndex] || sites[0];

  useEffect(() => {
    setThumbFailed(false);
  }, [selectedSite?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  if (!selectedSite) return null;

  const locSelected = getLocalizedSite(selectedSite);
  const cleanName = locSelected.officialName.split(/\s*[（(]/)[0];
  const numCode = String(selectedIndex + 1).padStart(2, '0');
  const subtitle = getHeritageSubtitle(selectedSite, formatDistrictName, lang);
  const thumbUrl = selectedSite.photos?.[0] || '';

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || cleanName}
        className={`w-full rounded-xl bg-[#171817] border border-[#C9A46A]/35 hover:border-[#C9A46A] px-3 py-2 text-left flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-7 h-7 rounded-full overflow-hidden border border-[#C9A46A]/35 bg-[#222321] flex items-center justify-center shrink-0">
            {thumbUrl && !thumbFailed ? (
              <img
                src={thumbUrl}
                alt={cleanName}
                referrerPolicy="no-referrer"
                onError={() => setThumbFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <Landmark className="w-3.5 h-3.5 text-[#C9A46A]" strokeWidth={1.6} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="tabular-nums text-[11px] font-semibold text-[#C9A46A] shrink-0">
                {numCode}
              </span>
              <span className="text-xs font-semibold text-[#D8C9A9] truncate">{cleanName}</span>
            </div>
            <div className="text-[10.5px] text-[#D8C9A9]/60 truncate">{subtitle}</div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#C9A46A] shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          strokeWidth={1.6}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${align === 'right' ? 'right-0' : 'left-0'} ${dropdownWidthClass} z-50`}
        >
          <HeritageSiteListPanel
            sites={sites}
            selectedSiteId={selectedSite.id}
            showInternalSearch
            autoFocusSearch
            showRegionFilters
            headingLabel={
              headingLabel ||
              (lang === 'en'
                ? 'SELECT HERITAGE MONUMENT'
                : lang === 'zh'
                ? '选择历史遗迹'
                : 'CHỌN DI TÍCH LỊCH SỬ')
            }
            onClose={() => setIsOpen(false)}
            onSelectSite={(site) => {
              onSelectSite(site);
              setIsOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

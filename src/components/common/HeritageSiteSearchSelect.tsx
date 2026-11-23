import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Landmark, Search, X } from 'lucide-react';
import type { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import { SITE_ID_TO_VIDEO_KEY } from '../../data/heritageFilms';
import {
  getHeritageSubtitle,
  matchesHeritageSiteQuery,
  normalizeHeritageSearchText,
} from '../../utils/heritageSearch';

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
  openUpward: boolean;
}

function useFloatingDropdownPosition(
  triggerRef: React.RefObject<HTMLDivElement | null>,
  isOpen: boolean
): DropdownPosition | null {
  const [pos, setPos] = useState<DropdownPosition | null>(null);

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;
    const estimatedHeight = Math.min(viewportH * 0.48, 280);
    const spaceBelow = viewportH - rect.bottom - 10;
    const spaceAbove = rect.top - 10;
    const openUpward = spaceBelow < Math.min(200, estimatedHeight) && spaceAbove > spaceBelow;
    const width = Math.min(Math.max(rect.width, 220), viewportW - 16);
    const maxLeft = Math.max(8, viewportW - width - 8);
    const left = Math.min(Math.max(8, rect.left), maxLeft);

    setPos({
      top: openUpward ? Math.max(8, rect.top - 6) : rect.bottom + 6,
      left,
      width,
      openUpward,
    });
  }, [triggerRef]);

  useEffect(() => {
    if (!isOpen) return;
    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, true);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos, true);
    };
  }, [isOpen, updatePos]);

  return pos;
}

/* ============================================================================
 * 1. HERITAGE SITE SEARCHABLE COMBOBOX (HeritageSiteSearchSelect)
 *    Replaces native <select> for the 17 Southeast Vietnam monuments + ALL.
 * ============================================================================ */

export interface HeritageSiteSearchSelectProps {
  sites: HeritageSite[];
  value: string;
  onChange: (nextValue: string) => void;
  includeAllOption?: boolean;
  allOptionValue?: string;
  allOptionLabel?: string;
  placeholder?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md';
  variant?: 'dark' | 'editorial_paper';
  className?: string;
}

interface SiteOptionRow {
  value: string;
  code: string;
  label: string;
  subtitle?: string;
  isAll?: boolean;
}

export const HeritageSiteSearchSelect: React.FC<HeritageSiteSearchSelectProps> = ({
  sites,
  value,
  onChange,
  includeAllOption = true,
  allOptionValue = 'ALL',
  allOptionLabel,
  placeholder,
  ariaLabel,
  size = 'md',
  variant = 'dark',
  className = '',
}) => {
  const { lang, getLocalizedSite, formatDistrictName } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const floatingPos = useFloatingDropdownPosition(containerRef, isOpen);

  const resolvedAllLabel = useMemo(() => {
    if (allOptionLabel) return allOptionLabel;
    if (lang === 'en') return `All ${sites.length} Heritage Sites & Archives`;
    if (lang === 'zh') return `全部${sites.length}处遗迹与综合档案`;
    return `Tất cả ${sites.length} di tích & Lưu trữ chung`;
  }, [allOptionLabel, lang, sites.length]);

  const resolvedPlaceholder = useMemo(() => {
    if (placeholder) return placeholder;
    if (lang === 'en') return 'Type monument name, 01–17, Vung Tau, Cu Chi...';
    if (lang === 'zh') return '输入遗迹名称、编号 01–17 或地区...';
    return 'Gõ tên di tích, mã 01–17, Vũng Tàu, Củ Chi...';
  }, [placeholder, lang]);

  const resolvedAriaLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    if (lang === 'en') return 'Search and select heritage monument';
    if (lang === 'zh') return '搜索并选择文化遗产';
    return 'Tìm kiếm và chọn di tích';
  }, [ariaLabel, lang]);

  const siteRows = useMemo(() => {
    return sites.map((site, idx) => {
      const loc = getLocalizedSite(site);
      const code = SITE_ID_TO_VIDEO_KEY[site.id] || String(idx + 1).padStart(2, '0');
      const subtitle = getHeritageSubtitle(site, formatDistrictName, lang);
      return {
        site,
        idx,
        code,
        loc,
        subtitle,
      };
    });
  }, [sites, getLocalizedSite, formatDistrictName, lang]);

  const selectedRow = useMemo(() => {
    if (includeAllOption && value === allOptionValue) {
      return {
        value: allOptionValue,
        code: 'ALL',
        label: resolvedAllLabel,
        isAll: true,
      } as SiteOptionRow;
    }
    const found = siteRows.find((r) => r.site.id === value);
    if (!found) {
      return {
        value: allOptionValue,
        code: 'ALL',
        label: resolvedAllLabel,
        isAll: true,
      } as SiteOptionRow;
    }
    return {
      value: found.site.id,
      code: found.code,
      label: `${found.code} · ${found.loc.officialName}`,
      subtitle: found.subtitle,
      isAll: false,
    } as SiteOptionRow;
  }, [includeAllOption, value, allOptionValue, resolvedAllLabel, siteRows]);

  const filteredOptions = useMemo<SiteOptionRow[]>(() => {
    const trimmed = query.trim();
    const qNorm = normalizeHeritageSearchText(trimmed);
    const list: SiteOptionRow[] = [];

    if (includeAllOption) {
      const allHaystack = normalizeHeritageSearchText(
        `${resolvedAllLabel} tat ca all luu tru chung 17 di tich`
      );
      if (!qNorm || allHaystack.includes(qNorm)) {
        list.push({
          value: allOptionValue,
          code: 'ALL',
          label: resolvedAllLabel,
          isAll: true,
        });
      }
    }

    for (const row of siteRows) {
      const matched =
        !trimmed ||
        matchesHeritageSiteQuery({
          site: row.site,
          canonicalIndex: row.idx,
          rawQuery: trimmed,
          localizedName: row.loc.officialName,
          localizedFolkName: row.loc.folkName,
          localizedSummary: row.loc.summary,
        });
      if (matched) {
        list.push({
          value: row.site.id,
          code: row.code,
          label: row.loc.officialName,
          subtitle: row.subtitle,
          isAll: false,
        });
      }
    }

    return list;
  }, [query, includeAllOption, allOptionValue, resolvedAllLabel, siteRows]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setIsTyping(false);
      setQuery('');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setIsTyping(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  const handleSelectOption = (opt: SiteOptionRow) => {
    onChange(opt.value);
    setIsOpen(false);
    setIsTyping(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery('');
    setIsTyping(false);
    if (includeAllOption) {
      onChange(allOptionValue);
    }
    setIsOpen(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) =>
        filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setHighlightedIndex((prev) =>
        filteredOptions.length > 0
          ? (prev - 1 + filteredOptions.length) % filteredOptions.length
          : 0
      );
    } else if (e.key === 'Enter') {
      if (isOpen && filteredOptions[highlightedIndex]) {
        e.preventDefault();
        handleSelectOption(filteredOptions[highlightedIndex]);
      }
    }
  };

  const showClearBtn =
    Boolean(query.trim()) || (includeAllOption && value !== allOptionValue);

  const isPaper = variant === 'editorial_paper';
  const heightCls = size === 'sm' ? 'h-8 text-[11.5px]' : isPaper ? 'h-9 text-[13px]' : 'h-9 text-xs';
  const inputDisplayValue = isTyping ? query : selectedRow.label;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className={
          isPaper
            ? `relative flex items-center w-full ${heightCls} bg-transparent border-b transition-colors ${
                isOpen
                  ? 'border-[#A94F3D]'
                  : 'border-[#171817]/30 hover:border-[#171817]/55 focus-within:border-[#A94F3D]'
              }`
            : `relative flex items-center w-full ${heightCls} rounded-xl bg-[#171817] border transition-colors ${
                isOpen
                  ? 'border-[#C9A46A] shadow-[0_0_0_1px_rgba(201,164,106,0.28)]'
                  : 'border-[#C9A46A]/45 hover:border-[#C9A46A]/75'
              }`
        }
      >
        <span
          className={
            isPaper
              ? 'pr-2 flex items-center justify-center text-[#A94F3D]/85 pointer-events-none shrink-0'
              : 'pl-3 pr-1.5 flex items-center justify-center text-[#C9A46A] pointer-events-none shrink-0'
          }
        >
          {isTyping ? (
            <Search className="w-3.5 h-3.5" strokeWidth={isPaper ? 1.5 : 1.8} />
          ) : (
            <Landmark className="w-3.5 h-3.5" strokeWidth={isPaper ? 1.5 : 1.7} />
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-label={resolvedAriaLabel}
          value={inputDisplayValue}
          placeholder={resolvedPlaceholder}
          onFocus={() => {
            setIsOpen(true);
            setIsTyping(true);
            setQuery('');
          }}
          onClick={() => {
            if (!isOpen) {
              setIsOpen(true);
              setIsTyping(true);
              setQuery('');
            }
          }}
          onChange={(e) => {
            setIsTyping(true);
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleInputKeyDown}
          className={
            isPaper
              ? `flex-1 min-w-0 h-full bg-transparent text-[#171817] placeholder:text-[#171817]/45 focus:outline-none truncate pr-1 ${
                  !isTyping && value !== allOptionValue ? 'font-medium text-[#171817]' : ''
                }`
              : `flex-1 min-w-0 h-full bg-transparent text-[#F7F3EB] placeholder:text-[#D8C9A9]/45 focus:outline-none truncate pr-1 ${
                  !isTyping && value !== allOptionValue ? 'font-medium text-[#F7F3EB]' : ''
                }`
          }
        />

        {showClearBtn && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={
              lang === 'en'
                ? 'Clear monument filter'
                : lang === 'zh'
                ? '清除遗迹筛选'
                : 'Xóa lọc di tích'
            }
            className={
              isPaper
                ? 'w-6 h-6 mr-0.5 flex items-center justify-center text-[#171817]/50 hover:text-[#A94F3D] transition-colors cursor-pointer shrink-0'
                : 'w-6 h-6 mr-0.5 rounded-full flex items-center justify-center text-[#D8C9A9]/70 hover:text-[#C9A46A] hover:bg-[#C9A46A]/12 transition-colors cursor-pointer shrink-0'
            }
          >
            <X className="w-3.5 h-3.5" strokeWidth={isPaper ? 1.6 : 1.9} />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setIsTyping(false);
              setQuery('');
            } else {
              setIsOpen(true);
              setIsTyping(true);
              setQuery('');
              inputRef.current?.focus();
            }
          }}
          aria-label={
            lang === 'en'
              ? 'Toggle monument list'
              : lang === 'zh'
              ? '展开或收起遗迹列表'
              : 'Mở danh sách di tích'
          }
          className={
            isPaper
              ? 'pl-1 h-full flex items-center justify-center text-[#171817]/55 hover:text-[#A94F3D] cursor-pointer shrink-0'
              : 'pr-2.5 pl-1 h-full flex items-center justify-center text-[#C9A46A]/85 hover:text-[#C9A46A] cursor-pointer shrink-0'
          }
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            strokeWidth={isPaper ? 1.6 : 1.9}
          />
        </button>
      </div>

      {isOpen &&
        floatingPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label={resolvedAriaLabel}
            style={{
              position: 'fixed',
              top: floatingPos.openUpward ? undefined : floatingPos.top,
              bottom: floatingPos.openUpward
                ? Math.max(8, window.innerHeight - floatingPos.top)
                : undefined,
              left: floatingPos.left,
              width: floatingPos.width,
            }}
            className={
              isPaper
                ? 'z-[1600] bg-[#F4EFE6] border border-[#171817]/25 rounded-[4px] shadow-[0_18px_48px_rgba(23,24,23,0.18)] overflow-hidden text-[#171817]'
                : 'z-[1600] bg-[#1C1D1B]/98 backdrop-blur-md border border-[#C9A46A]/45 rounded-xl shadow-2xl overflow-hidden text-[#D8C9A9]'
            }
          >
            {/* Compact Status Bar */}
            <div
              className={
                isPaper
                  ? 'px-3 py-1.5 border-b border-[#171817]/12 bg-[#ECE5D7]/80 flex items-center justify-between gap-2 text-[10px]'
                  : 'px-3 py-1.5 border-b border-[#C9A46A]/18 bg-[#171817]/90 flex items-center justify-between gap-2 text-[10.5px]'
              }
            >
              <span
                className={
                  isPaper
                    ? 'text-[#A94F3D] font-medium tracking-[0.14em] uppercase'
                    : 'text-[#C9A46A] font-semibold tracking-wide uppercase'
                }
              >
                {lang === 'en'
                  ? `Select Heritage Site (${filteredOptions.filter((o) => !o.isAll).length}/${sites.length})`
                  : lang === 'zh'
                  ? `选择文化遗产 (${filteredOptions.filter((o) => !o.isAll).length}/${sites.length})`
                  : `Chọn di tích (${filteredOptions.filter((o) => !o.isAll).length}/${sites.length})`}
              </span>
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className={
                    isPaper
                      ? 'text-[#171817]/60 hover:text-[#A94F3D] cursor-pointer'
                      : 'text-[#D8C9A9]/70 hover:text-[#C9A46A] cursor-pointer'
                  }
                >
                  {lang === 'en' ? 'Clear' : lang === 'zh' ? '清空' : 'Xóa từ khóa'}
                </button>
              )}
            </div>

            <div
              className={
                isPaper
                  ? 'max-h-[48vh] sm:max-h-64 overflow-y-auto heritage-scrollbar divide-y divide-[#171817]/[0.07]'
                  : 'max-h-[48vh] sm:max-h-64 overflow-y-auto heritage-scrollbar p-1.5 space-y-0.5'
              }
            >
              {filteredOptions.length === 0 ? (
                <div className="py-6 px-3 text-center space-y-1.5">
                  <p
                    className={`text-xs font-medium ${
                      isPaper ? 'text-[#171817]' : 'text-[#F7F3EB]'
                    }`}
                  >
                    {lang === 'en'
                      ? 'No matching heritage sites found.'
                      : lang === 'zh'
                      ? '未找到匹配的遗迹。'
                      : 'Không tìm thấy di tích phù hợp.'}
                  </p>
                  <p
                    className={`text-[11px] ${
                      isPaper ? 'text-[#171817]/55' : 'text-[#D8C9A9]/65'
                    }`}
                  >
                    {lang === 'en'
                      ? 'Try searching by number (01–17) or area such as Vung Tau, Cu Chi.'
                      : lang === 'zh'
                      ? '请尝试输入编号 (01–17) 或地名（如头顿、古芝）。'
                      : 'Thử nhập mã số (01–17) hoặc địa danh như Vũng Tàu, Củ Chi, Long Sơn.'}
                  </p>
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectOption(opt);
                      }}
                      className={
                        isPaper
                          ? `w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#A94F3D]/[0.09] text-[#A94F3D] font-medium'
                                : isHighlighted
                                ? 'bg-[#171817]/[0.05] text-[#171817]'
                                : 'text-[#171817]/85 hover:bg-[#171817]/[0.05] hover:text-[#171817]'
                            }`
                          : `w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#C9A46A]/20 text-[#C9A46A] font-semibold'
                                : isHighlighted
                                ? 'bg-[#C9A46A]/10 text-[#F7F3EB]'
                                : 'text-[#D8C9A9] hover:bg-[#C9A46A]/10 hover:text-[#F7F3EB]'
                            }`
                      }
                    >
                      <div className="min-w-0 flex items-center gap-2.5 flex-1">
                        <span
                          className={
                            isPaper
                              ? `shrink-0 w-7 font-mono text-[10.5px] tabular-nums ${
                                  isSelected ? 'text-[#A94F3D] font-semibold' : 'text-[#171817]/45'
                                }`
                              : `shrink-0 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold tabular-nums leading-none ${
                                  isSelected
                                    ? 'border-[#C9A46A]/70 bg-[#C9A46A]/20 text-[#C9A46A]'
                                    : 'border-[#C9A46A]/40 bg-[#171817] text-[#C9A46A]/90'
                                }`
                          }
                        >
                          {opt.isAll
                            ? lang === 'en'
                              ? 'ALL'
                              : lang === 'zh'
                              ? '全部'
                              : '17'
                            : opt.code}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs leading-snug truncate">{opt.label}</div>
                          {opt.subtitle && (
                            <div
                              className={`text-[10.5px] leading-tight truncate mt-0.5 ${
                                isPaper
                                  ? isSelected
                                    ? 'text-[#A94F3D]/75'
                                    : 'text-[#171817]/50'
                                  : isSelected
                                  ? 'text-[#C9A46A]/80'
                                  : 'text-[#D8C9A9]/55'
                              }`}
                            >
                              {opt.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isPaper ? 'text-[#A94F3D]' : 'text-[#C9A46A]'
                          }`}
                          strokeWidth={2}
                        />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

/* ============================================================================
 * 2. GENERIC MUSEUM SEARCHABLE / CUSTOM SELECT (HeritageOptionSearchSelect)
 *    Replaces native <select> for District, Category, Media Type, Routes, etc.
 * ============================================================================ */

export interface HeritageSelectOption {
  value: string;
  label: string;
  badge?: string;
  subtitle?: string;
}

export interface HeritageOptionSearchSelectProps {
  options: HeritageSelectOption[];
  value: string;
  onChange: (nextValue: string) => void;
  defaultValue?: string;
  searchable?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  size?: 'xs' | 'sm' | 'md';
  tone?: 'dark' | 'parchment';
  className?: string;
}

export const HeritageOptionSearchSelect: React.FC<HeritageOptionSearchSelectProps> = ({
  options,
  value,
  onChange,
  defaultValue,
  searchable = true,
  placeholder,
  ariaLabel,
  size = 'md',
  tone = 'dark',
  className = '',
}) => {
  const { lang } = useI18n();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const floatingPos = useFloatingDropdownPosition(containerRef, isOpen);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value) || options[0],
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const qNorm = normalizeHeritageSearchText(query);
    if (!qNorm) return options;
    return options.filter((opt) =>
      normalizeHeritageSearchText(
        `${opt.badge || ''} ${opt.label} ${opt.subtitle || ''}`
      ).includes(qNorm)
    );
  }, [options, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        containerRef.current?.contains(target) ||
        dropdownRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setIsTyping(false);
      setQuery('');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        setIsTyping(false);
        setQuery('');
        inputRef.current?.blur();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen]);

  const handleSelect = (opt: HeritageSelectOption) => {
    onChange(opt.value);
    setIsOpen(false);
    setIsTyping(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const canClear =
    Boolean(query.trim()) ||
    (defaultValue !== undefined && value !== defaultValue);

  const sizeClasses =
    size === 'xs'
      ? 'h-7 text-[11px] rounded-lg'
      : size === 'sm'
      ? 'h-8 text-[11.5px] rounded-xl'
      : 'h-9 text-xs rounded-xl';

  const triggerToneClasses =
    tone === 'parchment'
      ? isOpen
        ? 'bg-[#171817] text-[#F7F3EB] border-[#C9A46A]'
        : 'bg-[#EDE4D0] text-[#171817] border-[#171817]/25 hover:border-[#A94F3D]/65'
      : isOpen
      ? 'bg-[#171817] text-[#F7F3EB] border-[#C9A46A] shadow-[0_0_0_1px_rgba(201,164,106,0.28)]'
      : 'bg-[#171817] text-[#F7F3EB] border-[#C9A46A]/45 hover:border-[#C9A46A]/75';

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className={`relative flex items-center w-full border transition-colors ${sizeClasses} ${triggerToneClasses}`}
      >
        {searchable ? (
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isOpen}
            aria-label={ariaLabel}
            value={isTyping ? query : selectedOption?.label || ''}
            placeholder={
              placeholder ||
              (lang === 'en' ? 'Search...' : lang === 'zh' ? '搜索...' : 'Gõ để lọc...')
            }
            onFocus={() => {
              setIsOpen(true);
              setIsTyping(true);
              setQuery('');
            }}
            onClick={() => {
              if (!isOpen) {
                setIsOpen(true);
                setIsTyping(true);
                setQuery('');
              }
            }}
            onChange={(e) => {
              setIsTyping(true);
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                  filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : 0
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedIndex((prev) =>
                  filteredOptions.length > 0
                    ? (prev - 1 + filteredOptions.length) % filteredOptions.length
                    : 0
                );
              } else if (e.key === 'Enter' && isOpen && filteredOptions[highlightedIndex]) {
                e.preventDefault();
                handleSelect(filteredOptions[highlightedIndex]);
              }
            }}
            className={`flex-1 min-w-0 h-full bg-transparent pl-2.5 pr-1 focus:outline-none truncate ${
              tone === 'parchment' && !isOpen
                ? 'text-[#171817] placeholder:text-[#171817]/50'
                : 'text-[#F7F3EB] placeholder:text-[#D8C9A9]/45'
            }`}
          />
        ) : (
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={ariaLabel}
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex-1 min-w-0 h-full text-left pl-2.5 pr-1 truncate cursor-pointer focus:outline-none"
          >
            {selectedOption?.label || ''}
          </button>
        )}

        {canClear && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setQuery('');
              setIsTyping(false);
              if (defaultValue !== undefined) onChange(defaultValue);
              setIsOpen(false);
            }}
            aria-label={lang === 'en' ? 'Reset' : lang === 'zh' ? '重置' : 'Xóa lọc'}
            className="w-5 h-5 mr-0.5 rounded-full flex items-center justify-center text-current opacity-65 hover:opacity-100 hover:text-[#C9A46A] cursor-pointer shrink-0"
          >
            <X className="w-3 h-3" strokeWidth={2} />
          </button>
        )}

        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            if (isOpen) {
              setIsOpen(false);
              setIsTyping(false);
              setQuery('');
            } else {
              setIsOpen(true);
              if (searchable) {
                setIsTyping(true);
                setQuery('');
                inputRef.current?.focus();
              }
            }
          }}
          className="pr-2 pl-0.5 h-full flex items-center justify-center text-[#C9A46A] cursor-pointer shrink-0"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            strokeWidth={1.9}
          />
        </button>
      </div>

      {isOpen &&
        floatingPos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: 'fixed',
              top: floatingPos.openUpward ? undefined : floatingPos.top,
              bottom: floatingPos.openUpward
                ? Math.max(8, window.innerHeight - floatingPos.top)
                : undefined,
              left: floatingPos.left,
              width: floatingPos.width,
            }}
            className="z-[1600] bg-[#1C1D1B]/98 backdrop-blur-md border border-[#C9A46A]/45 rounded-xl shadow-2xl overflow-hidden text-[#D8C9A9]"
          >
            <div className="max-h-[48vh] sm:max-h-64 overflow-y-auto heritage-scrollbar p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-4 px-3 text-center text-xs text-[#D8C9A9]/70">
                  {lang === 'en'
                    ? 'No matching options found.'
                    : lang === 'zh'
                    ? '未找到匹配选项。'
                    : 'Không có mục nào phù hợp.'}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value;
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(opt);
                      }}
                      className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#C9A46A]/20 text-[#C9A46A] font-semibold'
                          : isHighlighted
                          ? 'bg-[#C9A46A]/10 text-[#F7F3EB]'
                          : 'text-[#D8C9A9] hover:bg-[#C9A46A]/10 hover:text-[#F7F3EB]'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2 flex-1">
                        {opt.badge && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-md border border-[#C9A46A]/40 bg-[#171817] text-[#C9A46A] text-[10px] font-semibold tabular-nums leading-none">
                            {opt.badge}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-xs leading-snug truncate">{opt.label}</div>
                          {opt.subtitle && (
                            <div className="text-[10.5px] text-[#D8C9A9]/55 truncate mt-0.5">
                              {opt.subtitle}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#C9A46A] shrink-0" strokeWidth={2.2} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

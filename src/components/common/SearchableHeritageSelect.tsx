import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';

export interface SearchableHeritageOption {
  value: string;
  label: string;
  searchNorm: string;
}

interface SearchableHeritageSelectProps {
  id?: string;
  sites: HeritageSite[];
  value: string;
  onChange: (value: string) => void;
  includeSystemAllOption?: boolean;
  systemAllLabel?: string;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Normalize Vietnamese text for accent-insensitive, case-insensitive instant filtering.
 * Example: "01. Dinh Độc Lập" -> "01. dinh doc lap"
 */
function normalizeVietnameseSearch(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

export const SearchableHeritageSelect: React.FC<SearchableHeritageSelectProps> = ({
  id,
  sites,
  value,
  onChange,
  includeSystemAllOption = true,
  systemAllLabel,
  placeholder,
  ariaLabel,
  className = '',
}) => {
  const { lang, getLocalizedSite } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const resolvedSystemAllLabel =
    systemAllLabel ||
    (lang === 'en'
      ? 'General / Entire Digital Museum'
      : lang === 'zh'
      ? '不指定具体遗迹 / 整个系统'
      : 'Không chọn cụ thể / Toàn hệ thống');

  const resolvedPlaceholder =
    placeholder ||
    (lang === 'en'
      ? 'Search by number or monument name...'
      : lang === 'zh'
      ? '按编号或遗迹名称搜索...'
      : 'Tìm theo số thứ tự hoặc tên di tích...');

  const noResultText =
    lang === 'en'
      ? 'No matching monument found'
      : lang === 'zh'
      ? '未找到匹配的遗迹'
      : 'Không tìm thấy di tích phù hợp';

  const options = useMemo<SearchableHeritageOption[]>(() => {
    const list: SearchableHeritageOption[] = [];
    if (includeSystemAllOption) {
      list.push({
        value: '',
        label: resolvedSystemAllLabel,
        searchNorm: normalizeVietnameseSearch(
          `${resolvedSystemAllLabel} khong chon cu the toan he thong chung 00`
        ),
      });
    }
    sites.forEach((site, idx) => {
      const loc = getLocalizedSite(site);
      const orderNum = String(idx + 1).padStart(2, '0');
      const label = `${orderNum}. ${loc.officialName}`;
      list.push({
        value: site.id,
        label,
        searchNorm: normalizeVietnameseSearch(
          `${orderNum} ${idx + 1} ${loc.officialName} ${site.officialName} ${site.address?.district || ''} ${site.id}`
        ),
      });
    });
    return list;
  }, [sites, includeSystemAllOption, resolvedSystemAllLabel, getLocalizedSite]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || options[0];
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const normQuery = normalizeVietnameseSearch(query);
    if (!normQuery) return options;
    const tokens = normQuery.split(/\s+/).filter(Boolean);
    return options.filter((opt) => tokens.every((tok) => opt.searchNorm.includes(tok)));
  }, [options, query]);

  // Smart upward/downward placement & focus search input when opened
  useEffect(() => {
    if (!isOpen) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      setOpenUpward(spaceBelow < 290 && spaceAbove > spaceBelow);
    }
    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // Close on outside click or Escape (capture phase so parent modal stays open)
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscKey, true);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscKey, true);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      if (prev) setQuery('');
      return !prev;
    });
  };

  const handleSelect = (nextValue: string) => {
    onChange(nextValue);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || selectedOption?.label}
        onClick={handleToggle}
        className={`w-full h-10 px-3.5 rounded-xl bg-[#171817] border text-left text-xs sm:text-sm text-[#F7F3EB] flex items-center justify-between gap-2.5 transition-colors cursor-pointer focus:outline-none ${
          isOpen
            ? 'border-[#C9A46A] ring-1 ring-[#C9A46A]/30'
            : 'border-[#C9A46A]/35 hover:border-[#C9A46A]/65'
        }`}
      >
        <span className="truncate">{selectedOption?.label || resolvedSystemAllLabel}</span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="#C9A46A"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        >
          <path d="M5.5 7.75L10 12.25L14.5 7.75" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-[110] rounded-xl bg-[#1C1D1B] border border-[#C9A46A]/40 shadow-2xl overflow-hidden ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {/* Integrated Search Input */}
          <div className="relative flex items-center bg-[#171817] border-b border-[#C9A46A]/25 px-3 py-2">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="#C9A46A"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4 shrink-0 mr-2 opacity-85"
              aria-hidden="true"
            >
              <circle cx="9" cy="9" r="5.75" />
              <path d="M13.5 13.5L17 17" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={resolvedPlaceholder}
              className="w-full bg-transparent text-xs sm:text-sm text-[#F7F3EB] placeholder:text-[#D8C9A9]/45 focus:outline-none pr-6"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Xóa từ khóa tìm kiếm"
                className="absolute right-2.5 w-5 h-5 rounded-full hover:bg-[#C9A46A]/15 text-[#D8C9A9]/70 hover:text-[#F7F3EB] flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  className="w-3 h-3"
                  aria-hidden="true"
                >
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            )}
          </div>

          {/* Scrollable Option List */}
          <ul
            role="listbox"
            className="max-h-60 overflow-y-auto py-1.5 px-1.5 space-y-0.5 ar-modal-scrollbar"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-[#D8C9A9]/60">
                {noResultText}
              </li>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <li key={opt.value || '__all__'} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-3 py-2 rounded-lg text-left text-xs sm:text-[13px] flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#C9A46A]/20 text-[#C9A46A] font-medium'
                          : 'text-[#D8C9A9] hover:bg-[#C9A46A]/15 hover:text-[#F7F3EB]'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <svg
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="#C9A46A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-3.5 h-3.5 shrink-0"
                          aria-hidden="true"
                        >
                          <path d="M3.2 8.4l3.1 3.1 6.5-6.8" />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HeritageSite } from '../../types/heritage';
import { HERITAGE_SITES } from '../../data/heritageSites';
import { DEFAULT_SITE_PHOTOS_BY_ID } from '../../data/heritagePhotos';
import { useI18n } from '../../i18n/I18nContext';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { DragScrollRow } from '../common/DragScrollRow';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { CascadeRevealCard } from '../common/CascadeRevealCard';
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  X,
  FileText,
  HelpCircle,
  Play,
  Pause,
  Layers,
  List,
  Box,
  RotateCcw,
} from 'lucide-react';

export interface HistoricalTimelineProps {
  sites?: HeritageSite[];
  hiddenSiteIds?: string[];
  onSelectSiteById: (siteId: string) => void;
  onOpen3DById: (siteId: string) => void;
}

type RegionKey = 'hcm' | 'cuchi_ven' | 'binhduong' | 'brvt';
type ThemeKey = 'all' | 'architecture' | 'history' | 'culture' | 'resistance';
type ViewMode = '3d' | 'flat';

const TIMELINE_GUIDE_STORAGE_KEY = 'dau_an_timeline_guide_dismissed_v1';

interface RegionLaneMeta {
  key: RegionKey;
  index: number;
  color: string;
  textColor: string;
  subTextColor: string;
  borderColor: string;
  name: { vi: string; en: string; zh: string };
  sub: { vi: string; en: string; zh: string };
}

const REGION_LANES: readonly RegionLaneMeta[] = [
  {
    key: 'hcm',
    index: 0,
    color: '#A94F3D',
    textColor: '#D8C9A9',
    subTextColor: 'rgba(216, 201, 169, 0.85)',
    borderColor: 'rgba(216, 201, 169, 0.55)',
    name: {
      vi: 'TP. Hồ Chí Minh',
      en: 'Ho Chi Minh City',
      zh: '胡志明市',
    },
    sub: {
      vi: 'Sài Gòn – Gia Định',
      en: 'Saigon – Gia Dinh',
      zh: '西贡 – 嘉定',
    },
  },
  {
    key: 'cuchi_ven',
    index: 1,
    color: '#47796D',
    textColor: '#D8C9A9',
    subTextColor: 'rgba(216, 201, 169, 0.85)',
    borderColor: 'rgba(216, 201, 169, 0.55)',
    name: {
      vi: 'Củ Chi & Vùng Ven',
      en: 'Cu Chi & Suburban',
      zh: '古芝与近郊',
    },
    sub: {
      vi: 'Căn cứ & Địa đạo',
      en: 'Bases & Tunnels',
      zh: '基地与地道',
    },
  },
  {
    key: 'binhduong',
    index: 2,
    color: '#526D8B',
    textColor: '#D8C9A9',
    subTextColor: 'rgba(216, 201, 169, 0.85)',
    borderColor: 'rgba(216, 201, 169, 0.55)',
    name: {
      vi: 'Bình Dương',
      en: 'Binh Duong',
      zh: '平阳省',
    },
    sub: {
      vi: 'Thủ Dầu Một – Bến Cát',
      en: 'Thu Dau Mot – Ben Cat',
      zh: '土龙木 – 边吉',
    },
  },
  {
    key: 'brvt',
    index: 3,
    color: '#C9A46A',
    textColor: '#171817',
    subTextColor: 'rgba(23, 24, 23, 0.80)',
    borderColor: 'rgba(23, 24, 23, 0.45)',
    name: {
      vi: 'Bà Rịa – Vũng Tàu',
      en: 'Ba Ria – Vung Tau',
      zh: '巴地 – 头顿',
    },
    sub: {
      vi: 'Biển đảo & Di tích',
      en: 'Coastal & Monuments',
      zh: '海岛与历史遗迹',
    },
  },
] as const;

interface ThemeOption {
  key: ThemeKey;
  color: string;
  label: { vi: string; en: string; zh: string };
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    key: 'all',
    color: '#D8C9A9',
    label: {
      vi: 'Tất cả chủ đề',
      en: 'All Themes',
      zh: '全部主题',
    },
  },
  {
    key: 'architecture',
    color: '#A94F3D',
    label: {
      vi: 'Kiến trúc & Đô thị',
      en: 'Architecture & Urban',
      zh: '建筑与城市',
    },
  },
  {
    key: 'history',
    color: '#47796D',
    label: {
      vi: 'Lịch sử & Quyền lực',
      en: 'History & Power',
      zh: '历史与权力',
    },
  },
  {
    key: 'culture',
    color: '#526D8B',
    label: {
      vi: 'Văn hóa & Tín ngưỡng',
      en: 'Culture & Faith',
      zh: '文化与信仰',
    },
  },
  {
    key: 'resistance',
    color: '#C9A46A',
    label: {
      vi: 'Kháng chiến & Ký ức',
      en: 'Resistance & Memory',
      zh: '抗战与记忆',
    },
  },
] as const;

interface ScrollableThemeFilterBarProps {
  lang: 'vi' | 'en' | 'zh';
  selectedTheme: ThemeKey;
  themeCounts: Record<ThemeKey, number>;
  onSelectTheme: (key: ThemeKey) => void;
  showEyeIcon?: boolean;
  keyPrefix: string;
}

const ScrollableThemeFilterBar: React.FC<ScrollableThemeFilterBarProps> = ({
  lang,
  selectedTheme,
  themeCounts,
  onSelectTheme,
  showEyeIcon = false,
  keyPrefix,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    isDown: boolean;
    startX: number;
    scrollLeft: number;
    didDrag: boolean;
  }>({ isDown: false, startX: 0, scrollLeft: 0, didDrag: false });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollMetrics, setScrollMetrics] = useState<{
    hasOverflow: boolean;
    thumbWidthPct: number;
    thumbLeftPct: number;
  }>({ hasOverflow: false, thumbWidthPct: 100, thumbLeftPct: 0 });

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const hasOverflow = maxScroll > 4;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
    if (hasOverflow && el.scrollWidth > 0) {
      const thumbWidthPct = Math.max(22, Math.min(85, (el.clientWidth / el.scrollWidth) * 100));
      const progress = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
      const thumbLeftPct = progress * (100 - thumbWidthPct);
      setScrollMetrics({ hasOverflow: true, thumbWidthPct, thumbLeftPct });
    } else {
      setScrollMetrics({ hasOverflow: false, thumbWidthPct: 100, thumbLeftPct: 0 });
    }
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const onResize = () => updateScrollState();
    window.addEventListener('resize', onResize);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => updateScrollState());
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      ro?.disconnect();
    };
  }, [updateScrollState, lang]);

  const handleScrollBy = (delta: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    dragStateRef.current = {
      isDown: true,
      startX: e.pageX,
      scrollLeft: el.scrollLeft,
      didDrag: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !dragStateRef.current.isDown) return;
    const dx = e.pageX - dragStateRef.current.startX;
    if (Math.abs(dx) > 4) {
      dragStateRef.current.didDrag = true;
      e.preventDefault();
      el.scrollLeft = dragStateRef.current.scrollLeft - dx;
    }
  };

  const handleMouseEnd = () => {
    dragStateRef.current.isDown = false;
    window.setTimeout(() => {
      dragStateRef.current.didDrag = false;
    }, 0);
  };

  return (
    <div className="relative w-full min-w-0">
      <div className="relative flex items-center gap-1.5 min-w-0">
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScrollBy(-180)}
            aria-label={
              lang === 'en' ? 'Scroll themes left' : lang === 'zh' ? '向左滚动主题' : 'Cuộn chủ đề sang trái'
            }
            className="w-7 h-7 rounded-full bg-[#1C1D1B] border border-[#C9A46A]/40 hover:border-[#C9A46A] text-[#C9A46A] flex items-center justify-center shrink-0 shadow-md transition-colors cursor-pointer z-10"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        )}

        <div className="relative flex-1 min-w-0">
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseEnd}
            onMouseLeave={handleMouseEnd}
            className="flex items-center gap-2 overflow-x-auto flex-nowrap scroll-smooth touch-pan-x pb-1.5 heritage-scrollbar cursor-grab active:cursor-grabbing select-none"
          >
            {showEyeIcon && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C9A46A] shrink-0 pr-0.5">
                <Eye className="w-3.5 h-3.5" strokeWidth={1.6} />
              </span>
            )}
            {THEME_OPTIONS.map((opt) => {
              const active = selectedTheme === opt.key;
              return (
                <button
                  key={`${keyPrefix}-${opt.key}`}
                  type="button"
                  onClick={() => {
                    if (dragStateRef.current.didDrag) return;
                    onSelectTheme(opt.key);
                  }}
                  className={`shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817] font-semibold shadow-sm'
                      : 'bg-[#1C1D1B] border-[#C9A46A]/35 text-[#D8C9A9]/85 hover:border-[#C9A46A]/70 hover:text-[#D8C9A9]'
                  }`}
                >
                  <span>{opt.label[lang]}</span>
                  <span
                    className={`font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full leading-none ${
                      active
                        ? 'bg-[#171817]/15 text-[#171817] font-bold'
                        : 'bg-[#C9A46A]/15 text-[#C9A46A]'
                    }`}
                  >
                    {themeCounts[opt.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Subtle right-edge fade when more categories exist off-screen */}
          {canScrollRight && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-1.5 right-0 w-9 bg-gradient-to-l from-[#171817] via-[#171817]/80 to-transparent"
            />
          )}
        </div>

        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScrollBy(180)}
            aria-label={
              lang === 'en' ? 'Scroll themes right' : lang === 'zh' ? '向右滚动主题' : 'Cuộn chủ đề sang phải'
            }
            className="w-7 h-7 rounded-full bg-[#1C1D1B] border border-[#C9A46A]/40 hover:border-[#C9A46A] text-[#C9A46A] flex items-center justify-center shrink-0 shadow-md transition-colors cursor-pointer z-10"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Subtle ultra-thin bronze-gold horizontal indicator bar (always visible on mobile touch devices) */}
      {scrollMetrics.hasOverflow && (
        <div
          aria-hidden="true"
          className="mt-1 h-1 w-full rounded-full bg-[#C9A46A]/10 overflow-hidden relative"
        >
          <div
            style={{
              width: `${scrollMetrics.thumbWidthPct}%`,
              left: `${scrollMetrics.thumbLeftPct}%`,
            }}
            className="absolute top-0 bottom-0 rounded-full bg-[#C9A46A]/35 transition-[left,width] duration-100"
          />
        </div>
      )}
    </div>
  );
};

const THEME_SITE_MAP: Record<Exclude<ThemeKey, 'all'>, ReadonlySet<string>> = {
  architecture: new Set([
    'HCM-DT-001',
    'HCM-DT-002',
    'HCM-DT-003',
    'HCM-DT-004',
    'HCM-DT-005',
    'HCM-DT-006',
    'BRVT-DT-001',
    'BD-DT-001',
  ]),
  history: new Set([
    'HCM-DT-001',
    'HCM-DT-006',
    'HCM-DT-007',
    'HCM-DT-008',
    'BRVT-DT-001',
  ]),
  culture: new Set([
    'HCM-DT-005',
    'HCM-DT-008',
    'HCM-DT-010',
    'HCM-DT-011',
    'HCM-DT-012',
    'BD-DT-001',
    'BRVT-DT-002',
  ]),
  resistance: new Set([
    'HCM-DT-001',
    'HCM-DT-007',
    'HCM-DT-009',
    'BD-DT-002',
    'BRVT-DT-003',
  ]),
};

interface YearTick {
  year: number;
  u: number;
  label: string;
  eraRange: [number, number];
}

const YEAR_TICKS: readonly YearTick[] = [
  { year: 2026, u: 0.0, label: '2026', eraRange: [1976, 2026] },
  { year: 1975, u: 0.16, label: '1975', eraRange: [1955, 1975] },
  { year: 1945, u: 0.32, label: '1945', eraRange: [1920, 1954] },
  { year: 1900, u: 0.48, label: '1900', eraRange: [1885, 1919] },
  { year: 1859, u: 0.64, label: '1859', eraRange: [1830, 1884] },
  { year: 1790, u: 0.8, label: '1790', eraRange: [1730, 1829] },
  { year: 1698, u: 1.0, label: '1698', eraRange: [-1000, 1729] },
] as const;

// Ascending chronological order for milestones
const MILESTONES_ASC: readonly YearTick[] = [...YEAR_TICKS].reverse();

// SVG Virtual Coordinate Space (60fps Pure React + SVG)
// Balanced centrally in the open stage left of the 220px CHỦ ĐỀ DI SẢN panel
const SVG_W = 1000;
const SVG_H = 560;
const VP_X = 425;
const Y_HORIZON = 28;
const Y_BOTTOM = 532;
const HORIZON_SCALE = 0.36;
const LANE_BOUNDARIES_BOTTOM = [70, 247.5, 425, 602.5, 780] as const;
const LANE_CENTERS_BOTTOM = [158.75, 336.25, 513.75, 691.25] as const;

// Subtle horizontal spread inside lanes with dense years so zero nodes collide
const SITE_LANE_JITTER: Record<string, number> = {
  'HCM-DT-011': -0.18, // 1744 Giác Lâm
  'HCM-DT-012': 0.2, // 1820 Nghĩa An
  'HCM-DT-008': -0.2, // 1848 Lăng Ông
  'HCM-DT-007': 0.22, // 1863 Bến Nhà Rồng
  'HCM-DT-005': -0.24, // 1877 Đức Bà
  'HCM-DT-003': 0.24, // 1886 Bưu điện
  'HCM-DT-002': -0.16, // 1898 Nhà hát
  'HCM-DT-004': 0.22, // 1912 Chợ Bến Thành
  'HCM-DT-006': -0.22, // 1926 Bảo tàng Lịch sử
  'HCM-DT-001': 0.16, // 1962 Dinh Độc Lập
  'HCM-DT-010': -0.12, // -300 Giồng Cá Vồ
  'HCM-DT-009': 0.1, // 1948 Địa đạo Củ Chi
  'BD-DT-001': -0.12, // 1889 Nhà cổ Trần Công Vàng
  'BD-DT-002': 0.14, // 1948 Địa đạo Tam Giác Sắt
  'BRVT-DT-001': -0.18, // 1898 Bạch Dinh
  'BRVT-DT-002': 0.2, // 1910 Nhà Lớn Long Sơn
  'BRVT-DT-003': -0.06, // 1948 Địa đạo Long Phước
};

const MIN_DEPTH_OFFSET = -0.34;
const MAX_DEPTH_OFFSET = 0.56;

function getRegionForSite(site: HeritageSite): RegionLaneMeta {
  const city = site.address.city || '';
  const district = site.address.district || '';
  if (city.includes('Bà Rịa')) return REGION_LANES[3];
  if (city.includes('Bình Dương')) return REGION_LANES[2];
  if (
    district.includes('Củ Chi') ||
    district.includes('Cần Giờ') ||
    site.id === 'HCM-DT-009' ||
    site.id === 'HCM-DT-010'
  ) {
    return REGION_LANES[1];
  }
  return REGION_LANES[0];
}

function siteMatchesTheme(site: HeritageSite, theme: ThemeKey): boolean {
  if (theme === 'all') return true;
  const set = THEME_SITE_MAP[theme];
  if (set.has(site.id)) return true;
  if (theme === 'architecture' && site.type === 'Architecture') return true;
  if (theme === 'history' && site.type === 'History') return true;
  if (theme === 'culture' && (site.type === 'Archaeology' || site.type === 'Scenic')) return true;
  return false;
}

function getPrimaryThemeForSite(site: HeritageSite): ThemeOption {
  if (siteMatchesTheme(site, 'resistance')) return THEME_OPTIONS[4];
  if (siteMatchesTheme(site, 'culture') && !siteMatchesTheme(site, 'architecture')) {
    return THEME_OPTIONS[3];
  }
  if (siteMatchesTheme(site, 'history') && !siteMatchesTheme(site, 'architecture')) {
    return THEME_OPTIONS[2];
  }
  if (siteMatchesTheme(site, 'architecture')) return THEME_OPTIONS[1];
  if (siteMatchesTheme(site, 'history')) return THEME_OPTIONS[2];
  if (siteMatchesTheme(site, 'culture')) return THEME_OPTIONS[3];
  return THEME_OPTIONS[1];
}

function getShortSiteLabel(officialName: string): string {
  const cleaned = officialName.split(/\s*[（(]/)[0].trim();
  const dashSplit = cleaned.split(/\s+[–—-]\s+/)[0].trim();
  return dashSplit.length > 26 ? `${dashSplit.slice(0, 24)}…` : dashSplit;
}

/**
 * Piecewise linear mapping from construction year -> normalized depth u in [0, 1]
 * matching the 7 era milestones (2026 -> 0.0, 1698 -> 1.0).
 */
function yearToNormalizedU(year: number): number {
  if (year < 1698) {
    return 0.965;
  }
  if (year >= 2026) return 0.0;

  for (let i = 0; i < YEAR_TICKS.length - 1; i++) {
    const upper = YEAR_TICKS[i];
    const lower = YEAR_TICKS[i + 1];
    if (year <= upper.year && year >= lower.year) {
      const ratio = (upper.year - year) / (upper.year - lower.year);
      return upper.u + ratio * (lower.u - upper.u);
    }
  }
  return 0.5;
}

function projectDepth(u: number, depthOffset: number) {
  const relU = u - depthOffset;
  const rawS = 1 / (1 + Math.max(-0.62, relU) * 1.95);
  const minRawS = 1 / (1 + 1.0 * 1.95); // exact rawS for 1698 (u = 1.0) at default offset
  const frac = (rawS - minRawS) / (1 - minRawS);
  const y = Y_HORIZON + (Y_BOTTOM - Y_HORIZON) * frac;
  const scale = HORIZON_SCALE + (1 - HORIZON_SCALE) * frac;

  let opacity = 1;
  if (frac < -0.04) {
    opacity = Math.max(0, (frac + 0.14) / 0.1);
  } else if (frac > 1.03) {
    opacity = Math.max(0, 1 - (frac - 1.03) / 0.16);
  }

  return { frac, y, scale, opacity };
}

function projectX(bottomX: number, scale: number): number {
  return VP_X + (bottomX - VP_X) * scale;
}

function formatCommencementYear(
  year: number,
  lang: 'vi' | 'en' | 'zh'
): string {
  if (year < 0) {
    const absY = Math.abs(year);
    if (lang === 'en') return `${absY} BCE`;
    if (lang === 'zh') return `公元前 ${absY} 年`;
    return `${absY} TCN`;
  }
  return `${year}`;
}

const UI_COPY = {
  vi: {
    title: 'DÒNG CHẢY DI SẢN 300 NĂM',
    subtitle: 'SÀI GÒN - GIA ĐỊNH - ĐÔNG NAM BỘ (1698 - 2026)',
    quickHint:
      '1. Chọn mốc năm hoặc cuộn để du hành thời gian · 2. Lọc màu chủ đề bên phải · 3. Bấm vào điểm sáng để xem & mở 3D',
    guideBtn: 'Hướng dẫn',
    fullscreenBtn: 'Toàn màn hình',
    exitFullscreenBtn: 'Thu nhỏ',
    view3D: 'Dòng chảy 3D',
    viewFlat: 'Niên biểu phẳng',
    themesHeading: 'Chủ đề di sản',
    prevSite: 'Trước',
    nextSite: 'Tiếp',
    milestonesHeading: 'Mốc năm',
    autoplayStart: 'Tự động trình chiếu',
    autoplayStop: 'Dừng trình chiếu',
    resetView: 'Về mặc định',
    enter3D: 'Bước vào Không gian 3D',
    dossierBtn: 'Xem hồ sơ',
    closeCard: 'Đóng thẻ',
    allRegionsHint: 'Lọc theo khu vực bên dưới hoặc chọn chủ đề bên phải',
    clearFilters: 'Hiện tất cả di tích',
    guideTitle: 'Hướng dẫn khám phá Dòng chảy Di sản 300 năm',
    guideSubtitle: '3 thao tác trực quan qua hình minh họa',
    guideCard1Title: 'Lọc màu theo Chủ đề',
    guideCard1Caption: 'Bấm thẻ màu để lọc riêng từng nhóm di sản.',
    guideCard1Tags: ['Kiến trúc', 'Lịch sử', 'Văn hóa', 'Kháng chiến'],
    guideCard2Title: 'Lướt trục thời gian 1698 – 2026',
    guideCard2Caption: 'Cuộn chuột hoặc bấm mốc năm để đi xuyên 300 năm.',
    guideCard3Title: 'Chạm điểm sáng để vào 3D',
    guideCard3Caption: 'Bấm chấm sáng bất kỳ để xem ảnh và mở Không gian 3D.',
    guideConfirm: 'Đã hiểu, bắt đầu khám phá',
    flatEmpty: 'Không có di tích nào khớp với bộ lọc hiện tại.',
  },
  en: {
    title: '300-YEAR HERITAGE CHRONICLE',
    subtitle: 'SAIGON - GIA DINH - SOUTHEASTERN VIETNAM (1698 - 2026)',
    quickHint:
      '1. Pick a year milestone or scroll to travel in time · 2. Filter by theme colors on the right · 3. Click any glowing node to preview & open 3D',
    guideBtn: 'Guide',
    fullscreenBtn: 'Fullscreen',
    exitFullscreenBtn: 'Minimize',
    view3D: '3D Flow',
    viewFlat: 'Flat Timeline',
    themesHeading: 'Heritage Themes',
    prevSite: 'Prev',
    nextSite: 'Next',
    milestonesHeading: 'Milestones',
    autoplayStart: 'Auto-Slideshow',
    autoplayStop: 'Pause Slideshow',
    resetView: 'Reset View',
    enter3D: 'Enter 3D Space',
    dossierBtn: 'Dossier',
    closeCard: 'Close card',
    allRegionsHint: 'Filter by region below or select a theme on the right',
    clearFilters: 'Show all monuments',
    guideTitle: 'How to Explore the 300-Year Heritage Chronicle',
    guideSubtitle: '3 visual cues to navigate 17 Southern landmarks',
    guideCard1Title: 'Filter by Theme Color',
    guideCard1Caption: 'Tap a color tag to isolate each heritage group.',
    guideCard1Tags: ['Architecture', 'History', 'Culture', 'Resistance'],
    guideCard2Title: 'Glide Across 1698 – 2026',
    guideCard2Caption: 'Scroll or click a year mark to travel 300 years.',
    guideCard3Title: 'Tap a Glowing Node for 3D',
    guideCard3Caption: 'Click any glowing dot to preview and open 3D Space.',
    guideConfirm: 'Got it, start exploring',
    flatEmpty: 'No monuments match the current filters.',
  },
  zh: {
    title: '三百年遗产历史长河',
    subtitle: '西贡 - 嘉定 - 东南部 (1698 - 2026)',
    quickHint:
      '1. 点击年份节点或滚动浏览历史 · 2. 在右侧按主题色彩筛选 · 3. 点击亮点预览并进入 3D 空间',
    guideBtn: '操作指南',
    fullscreenBtn: '全屏浏览',
    exitFullscreenBtn: '退出全屏',
    view3D: '3D 历史流',
    viewFlat: '平面年表',
    themesHeading: '遗产主题',
    prevSite: '上一处',
    nextSite: '下一处',
    milestonesHeading: '历史节点',
    autoplayStart: '自动巡览',
    autoplayStop: '暂停巡览',
    resetView: '重置视角',
    enter3D: '进入 3D 空间',
    dossierBtn: '查看档案',
    closeCard: '关闭卡片',
    allRegionsHint: '点击下方区域栏或右侧主题筛选历史节点',
    clearFilters: '显示全部遗迹',
    guideTitle: '三百年遗产历史长河探索指南',
    guideSubtitle: '3 张图解快速掌握 17 处历史地标交互',
    guideCard1Title: '按主题色筛选',
    guideCard1Caption: '点击色标即可单独筛选对应遗产主题。',
    guideCard1Tags: ['建筑', '历史', '文化', '抗战'],
    guideCard2Title: '滑动 1698 – 2026 时间轴',
    guideCard2Caption: '滚动滚轮或点击年份节点穿越三百年历史。',
    guideCard3Title: '点击光点进入 3D',
    guideCard3Caption: '点击任意光点查看实景并开启 3D 空间。',
    guideConfirm: '已了解，开始探索',
    flatEmpty: '当前筛选条件下暂无匹配的遗迹。',
  },
} as const;

export const HistoricalTimeline: React.FC<HistoricalTimelineProps> = ({
  sites: sitesProp,
  hiddenSiteIds = [],
  onSelectSiteById,
  onOpen3DById,
}) => {
  const { lang, getLocalizedSite: localizeSite } = useI18n();
  const copy = UI_COPY[lang] || UI_COPY.vi;

  const [viewMode, setViewMode] = useState<ViewMode>('3d');
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>('all');
  const [selectedRegion, setSelectedRegion] = useState<RegionKey | null>(null);
  const [activeEraYear, setActiveEraYear] = useState<number | null>(null);
  const [pinnedSiteId, setPinnedSiteId] = useState<string | null>(null);
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null);
  const [isCardHovered, setIsCardHovered] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(TIMELINE_GUIDE_STORAGE_KEY) !== '1';
    } catch {
      return false;
    }
  });

  // Smooth 60fps depth interpolation
  const [depthOffset, setDepthOffset] = useState(0);
  const targetDepthRef = useRef(0);
  const currentDepthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const hoverCloseTimeoutRef = useRef<number | null>(null);
  const isCardHoveredRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => setIsMobileViewport(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const dismissGuide = useCallback(() => {
    setIsGuideOpen(false);
    try {
      localStorage.setItem(TIMELINE_GUIDE_STORAGE_KEY, '1');
    } catch {
      // Ignore storage errors
    }
  }, []);

  const exitFullscreenMode = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  // CSS-only viewport fullscreen overlay (never calls native requestFullscreen() to avoid browser banner clipping header)
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Keyboard Esc support: dismiss Guide modal first, otherwise exit Fullscreen
  useEffect(() => {
    if (!isFullscreen && !isGuideOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isGuideOpen) {
        dismissGuide();
      } else if (isFullscreen) {
        exitFullscreenMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isGuideOpen, dismissGuide, exitFullscreenMode]);

  // Lock background page scroll cleanly while fullscreen overlay is open
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  const scheduleAnimation = useCallback(() => {
    if (rafRef.current !== null) return;
    const step = () => {
      const diff = targetDepthRef.current - currentDepthRef.current;
      if (Math.abs(diff) < 0.0008) {
        currentDepthRef.current = targetDepthRef.current;
        setDepthOffset(currentDepthRef.current);
        rafRef.current = null;
        return;
      }
      currentDepthRef.current += diff * 0.16;
      setDepthOffset(currentDepthRef.current);
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (hoverCloseTimeoutRef.current !== null) {
        window.clearTimeout(hoverCloseTimeoutRef.current);
      }
    };
  }, []);

  const updateTargetDepth = useCallback(
    (next: number) => {
      const clamped = Math.max(
        MIN_DEPTH_OFFSET,
        Math.min(MAX_DEPTH_OFFSET, next)
      );
      targetDepthRef.current = clamped;
      scheduleAnimation();
    },
    [scheduleAnimation]
  );

  // Filter visible sites respecting hiddenSiteIds
  const visibleSites = useMemo(() => {
    const hiddenSet = new Set(hiddenSiteIds);
    const source = sitesProp && sitesProp.length > 0 ? sitesProp : HERITAGE_SITES;
    return source.filter(
      (s) => !hiddenSet.has(s.id) && s.visibility !== 'hidden'
    );
  }, [sitesProp, hiddenSiteIds]);

  // Chronologically sorted sites (earliest -> latest: 300 BCE -> 1744 -> ... -> 1966)
  const chronologicalSites = useMemo(() => {
    return [...visibleSites].sort(
      (a, b) => a.commencementYear - b.commencementYear
    );
  }, [visibleSites]);

  // Sites matching current Theme & Region filters in chronological order
  const filteredChronologicalSites = useMemo(() => {
    const activeTick =
      activeEraYear !== null
        ? YEAR_TICKS.find((t) => t.year === activeEraYear) || null
        : null;
    return chronologicalSites.filter((site) => {
      if (!siteMatchesTheme(site, selectedTheme)) return false;
      if (selectedRegion && getRegionForSite(site).key !== selectedRegion) {
        return false;
      }
      if (activeTick) {
        const [minY, maxY] = activeTick.eraRange;
        if (site.commencementYear < minY || site.commencementYear > maxY) {
          return false;
        }
      }
      return true;
    });
  }, [chronologicalSites, selectedTheme, selectedRegion, activeEraYear]);

  // Active navigable sequence (falls back to all chronological if era filter is narrow)
  const navigableSites = useMemo(() => {
    const byThemeRegion = chronologicalSites.filter((site) => {
      if (!siteMatchesTheme(site, selectedTheme)) return false;
      if (selectedRegion && getRegionForSite(site).key !== selectedRegion) {
        return false;
      }
      return true;
    });
    return byThemeRegion.length > 0 ? byThemeRegion : chronologicalSites;
  }, [chronologicalSites, selectedTheme, selectedRegion]);

  // Compute theme site counts dynamically from visible sites
  const themeCounts = useMemo(() => {
    const counts: Record<ThemeKey, number> = {
      all: visibleSites.length,
      architecture: 0,
      history: 0,
      culture: 0,
      resistance: 0,
    };
    visibleSites.forEach((site) => {
      if (siteMatchesTheme(site, 'architecture')) counts.architecture++;
      if (siteMatchesTheme(site, 'history')) counts.history++;
      if (siteMatchesTheme(site, 'culture')) counts.culture++;
      if (siteMatchesTheme(site, 'resistance')) counts.resistance++;
    });
    return counts;
  }, [visibleSites]);

  const activeEraTick = useMemo(
    () =>
      activeEraYear !== null
        ? YEAR_TICKS.find((t) => t.year === activeEraYear) || null
        : null,
    [activeEraYear]
  );

  // Project all sites to current perspective frame
  const projectedSites = useMemo(() => {
    return visibleSites
      .map((site) => {
        const region = getRegionForSite(site);
        const primaryTheme = getPrimaryThemeForSite(site);
        const u = yearToNormalizedU(site.commencementYear);
        const { frac, y, scale, opacity } = projectDepth(u, depthOffset);
        const laneBottomCenter = LANE_CENTERS_BOTTOM[region.index];
        const laneWidthAtDepth = 170 * scale;
        const jitter = (SITE_LANE_JITTER[site.id] ?? 0) * laneWidthAtDepth * 0.42;
        const svgX = projectX(laneBottomCenter, scale) + jitter;
        const svgY = y;

        const matchesTheme = siteMatchesTheme(site, selectedTheme);
        const matchesRegion = !selectedRegion || selectedRegion === region.key;
        const matchesEra =
          !activeEraTick ||
          (site.commencementYear >= activeEraTick.eraRange[0] &&
            site.commencementYear <= activeEraTick.eraRange[1]);
        const isHighlighted = matchesTheme && matchesRegion && matchesEra;

        const localized = localizeSite(site);
        const yearStr = formatCommencementYear(site.commencementYear, lang);
        const shortName = getShortSiteLabel(localized.officialName);

        return {
          site,
          localized,
          shortName,
          region,
          primaryTheme,
          u,
          frac,
          scale,
          depthOpacity: opacity,
          svgX,
          svgY,
          xPct: (svgX / SVG_W) * 100,
          yPct: (svgY / SVG_H) * 100,
          matchesTheme,
          matchesRegion,
          matchesEra,
          isHighlighted,
          yearStr,
        };
      })
      .sort((a, b) => a.u - b.u);
  }, [
    visibleSites,
    depthOffset,
    selectedTheme,
    selectedRegion,
    activeEraTick,
    localizeSite,
    lang,
  ]);

  const selectedThemeMeta = useMemo(
    () => THEME_OPTIONS.find((t) => t.key === selectedTheme) || THEME_OPTIONS[0],
    [selectedTheme]
  );

  // Chronologically ordered matching points for the glowing theme connection line
  const themePolylinePoints = useMemo(() => {
    if (selectedTheme === 'all') return '';
    const matching = projectedSites
      .filter((p) => p.matchesTheme && p.matchesRegion && p.depthOpacity > 0.08)
      .sort((a, b) => a.site.commencementYear - b.site.commencementYear);
    if (matching.length < 2) return '';
    return matching.map((p) => `${p.svgX.toFixed(1)},${p.svgY.toFixed(1)}`).join(' ');
  }, [projectedSites, selectedTheme]);

  // Quick Preview Card opens strictly when a site is selected/pinned (click or auto-slideshow)
  const activeProjected = useMemo(() => {
    if (!pinnedSiteId) return null;
    return projectedSites.find((p) => p.site.id === pinnedSiteId) || null;
  }, [pinnedSiteId, projectedSites]);

  // Strictly 1 floating label pill visible at any time: hovered node takes priority over pinned node
  const labeledSiteId = hoveredSiteId ?? pinnedSiteId;

  // Focus a specific site in the 3D grid smoothly and open its Quick Preview Card
  const focusSiteInTimeline = useCallback(
    (site: HeritageSite) => {
      const u = yearToNormalizedU(site.commencementYear);
      updateTargetDepth(u - 0.28);
      setPinnedSiteId(site.id);
      setHoveredSiteId(null);
    },
    [updateTargetDepth]
  );

  // Step Previous / Next monument chronologically
  const currentNavIndex = useMemo(() => {
    if (!pinnedSiteId) return -1;
    return navigableSites.findIndex((s) => s.id === pinnedSiteId);
  }, [navigableSites, pinnedSiteId]);

  const handleStepMonument = useCallback(
    (direction: -1 | 1) => {
      setIsAutoPlaying(false);
      setActiveEraYear(null);
      if (navigableSites.length === 0) return;
      let nextIdx: number;
      if (currentNavIndex === -1) {
        nextIdx = direction === 1 ? 0 : navigableSites.length - 1;
      } else {
        nextIdx =
          (currentNavIndex + direction + navigableSites.length) %
          navigableSites.length;
      }
      const nextSite = navigableSites[nextIdx];
      if (nextSite) {
        focusSiteInTimeline(nextSite);
      }
    },
    [navigableSites, currentNavIndex, focusSiteInTimeline]
  );

  // Auto-Slideshow timer (smoothly glides across the 300-year chronological sequence)
  useEffect(() => {
    if (!isAutoPlaying || navigableSites.length === 0) return;

    // Immediately focus first site if nothing is pinned yet
    if (!pinnedSiteId) {
      focusSiteInTimeline(navigableSites[0]);
    }

    const timer = window.setInterval(() => {
      setPinnedSiteId((prevId) => {
        const idx = navigableSites.findIndex((s) => s.id === prevId);
        const nextIdx = (idx + 1) % navigableSites.length;
        const nextSite = navigableSites[nextIdx];
        if (nextSite) {
          const u = yearToNormalizedU(nextSite.commencementYear);
          updateTargetDepth(u - 0.28);
          setHoveredSiteId(nextSite.id);
          return nextSite.id;
        }
        return prevId;
      });
    }, 3800);

    return () => window.clearInterval(timer);
  }, [isAutoPlaying, navigableSites, pinnedSiteId, focusSiteInTimeline, updateTargetDepth]);

  // Card anchor in SVG coordinates for diagonal #C9A46A connector line
  const cardAnchorSvg = useMemo(() => {
    return isMobileViewport
      ? { x: 500, y: 490 }
      : { x: 755, y: 500 };
  }, [isMobileViewport]);

  // Wheel scrubbing with graceful boundary handoff so user can still scroll page
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY * 0.00095;
    const atTopBoundary =
      targetDepthRef.current <= MIN_DEPTH_OFFSET + 0.002 && delta < 0;
    const atBottomBoundary =
      targetDepthRef.current >= MAX_DEPTH_OFFSET - 0.002 && delta > 0;

    if (atTopBoundary || atBottomBoundary) {
      return;
    }
    e.preventDefault();
    setIsAutoPlaying(false);
    updateTargetDepth(targetDepthRef.current + delta);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartYRef.current === null || e.touches.length !== 1) return;
    const dy = touchStartYRef.current - e.touches[0].clientY;
    touchStartYRef.current = e.touches[0].clientY;
    if (Math.abs(dy) > 1) {
      setIsAutoPlaying(false);
      updateTargetDepth(targetDepthRef.current + dy * 0.0022);
    }
  };

  const handleTouchEnd = () => {
    touchStartYRef.current = null;
  };

  const handleNodeMouseEnter = (siteId: string) => {
    if (hoverCloseTimeoutRef.current !== null) {
      window.clearTimeout(hoverCloseTimeoutRef.current);
      hoverCloseTimeoutRef.current = null;
    }
    setHoveredSiteId(siteId);
  };

  const handleNodeMouseLeave = () => {
    hoverCloseTimeoutRef.current = window.setTimeout(() => {
      setHoveredSiteId(null);
    }, 120);
  };

  const handleFocusYearTick = (tick: YearTick) => {
    setIsAutoPlaying(false);
    const nextEra = activeEraYear === tick.year ? null : tick.year;
    setActiveEraYear(nextEra);
    updateTargetDepth(tick.u - 0.28);
  };

  const handleResetAll = () => {
    setIsAutoPlaying(false);
    setSelectedTheme('all');
    setSelectedRegion(null);
    setActiveEraYear(null);
    setPinnedSiteId(null);
    setHoveredSiteId(null);
    updateTargetDepth(0);
  };

  const activePhotoUrl = useMemo(() => {
    if (!activeProjected) return '';
    const site = activeProjected.site;
    const primary = site.photos?.[0]?.trim();
    if (primary) return primary;
    return DEFAULT_SITE_PHOTOS_BY_ID[site.id]?.[0] || '';
  }, [activeProjected]);

  const hasActiveFilter =
    selectedTheme !== 'all' ||
    selectedRegion !== null ||
    activeEraYear !== null;

  return (
    <section
      ref={sectionRef}
      aria-label={copy.title}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-[#171817] text-[#D8C9A9] overflow-y-auto select-none flex flex-col'
          : 'relative w-full bg-[#171817] text-[#D8C9A9] overflow-x-clip rounded-2xl border border-[#C9A46A]/25 shadow-2xl select-none flex flex-col'
      }
    >
      {/* ====================================================================
          1. MINIMALIST MUSEUM HEADER (Clean title + mode switch + Guide + Fullscreen)
         ==================================================================== */}
      <div className="relative z-30 shrink-0 bg-[#171817] border-b border-[#C9A46A]/20 px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Subtitle */}
          <div className="min-w-0">
            <h2 className="font-serif text-lg sm:text-2xl lg:text-[26px] font-semibold tracking-[0.14em] uppercase text-[#D8C9A9] leading-tight">
              {copy.title}
            </h2>
            <p className="mt-1 text-[10.5px] sm:text-xs font-medium tracking-[0.18em] uppercase text-[#C9A46A]">
              {copy.subtitle}
            </p>
          </div>

          {/* Right Controls: 3D Flow / Flat Timeline Switch + Guide + Fullscreen */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              role="tablist"
              aria-label="Timeline view mode"
              className="inline-flex items-center p-0.5 rounded-full bg-[#222321] border border-[#C9A46A]/30"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === '3d'}
                onClick={() => setViewMode('3d')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === '3d'
                    ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                    : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
                <span>{copy.view3D}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'flat'}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setViewMode('flat');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'flat'
                    ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                    : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
                }`}
              >
                <List className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
                <span>{copy.viewFlat}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsGuideOpen((prev) => !prev)}
              aria-expanded={isGuideOpen}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isGuideOpen
                  ? 'bg-[#C9A46A]/18 border-[#C9A46A] text-[#C9A46A]'
                  : 'bg-[#171817] border-[#C9A46A]/35 text-[#D8C9A9] hover:border-[#C9A46A] hover:text-[#C9A46A]'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
              <span>{copy.guideBtn}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-pressed={isFullscreen}
              title={isFullscreen ? copy.exitFullscreenBtn : copy.fullscreenBtn}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isFullscreen
                  ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817] font-semibold'
                  : 'bg-[#171817] border-[#C9A46A]/35 text-[#D8C9A9] hover:border-[#C9A46A] hover:text-[#C9A46A]'
              }`}
            >
              {isFullscreen ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                  <line x1="14" y1="10" x2="21" y2="3" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                  <polyline points="20 14 14 14 14 20" />
                  <polyline points="4 10 10 10 10 4" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5 shrink-0"
                  aria-hidden="true"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <polyline points="21 15 21 21 15 21" />
                  <polyline points="3 9 3 3 9 3" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                  <line x1="21" y1="21" x2="14" y2="14" />
                  <line x1="3" y1="3" x2="10" y2="10" />
                </svg>
              )}
              <span>{isFullscreen ? copy.exitFullscreenBtn : copy.fullscreenBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. INTERACTIVE STAGE: EITHER "DÒNG CHẢY 3D" OR "NIÊN BIỂU PHẲNG"
         ==================================================================== */}
      {viewMode === '3d' ? (
        <div
          ref={stageRef}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPinnedSiteId(null);
              setHoveredSiteId(null);
              setIsAutoPlaying(false);
            }
          }}
          className={
            isFullscreen
              ? 'relative w-full flex-1 min-h-[500px] overflow-hidden'
              : 'relative w-full h-[480px] sm:h-[520px] lg:h-[550px] xl:h-[575px] overflow-hidden'
          }
        >
          {/* Horizon Radial Glow (#C9A46A/10) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 62% 32% at 42.5% 8%, rgba(201, 164, 106, 0.14) 0%, rgba(201, 164, 106, 0.04) 48%, rgba(23, 24, 23, 0) 82%)',
            }}
          />

          {/* Pure React + SVG Perspective Grid & Connectors (60fps) */}
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 w-full h-full z-10"
          >
            <defs>
              <linearGradient id="railFade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A46A" stopOpacity="0.35" />
                <stop offset="35%" stopColor="#D8C9A9" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#D8C9A9" stopOpacity="0.28" />
              </linearGradient>
            </defs>

            {/* Subtle Horizon Plane Line */}
            <line
              x1={projectX(LANE_BOUNDARIES_BOTTOM[0], HORIZON_SCALE)}
              y1={Y_HORIZON}
              x2={projectX(LANE_BOUNDARIES_BOTTOM[4], HORIZON_SCALE)}
              y2={Y_HORIZON}
              stroke="#C9A46A"
              strokeOpacity={0.35}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />

            {/* 5 Converging Regional Lane Boundary Rails */}
            {LANE_BOUNDARIES_BOTTOM.map((bx, idx) => {
              const topX = projectX(bx, HORIZON_SCALE);
              return (
                <line
                  key={`rail-${idx}`}
                  x1={topX}
                  y1={Y_HORIZON}
                  x2={bx}
                  y2={Y_BOTTOM}
                  stroke="url(#railFade)"
                  strokeWidth={idx === 0 || idx === 4 ? 1.2 : 1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {/* 4 Lane Center Guide Hairlines */}
            {LANE_CENTERS_BOTTOM.map((cx, idx) => {
              const lane = REGION_LANES[idx];
              const isLaneFocused = selectedRegion === lane.key;
              return (
                <line
                  key={`center-${lane.key}`}
                  x1={projectX(cx, HORIZON_SCALE)}
                  y1={Y_HORIZON}
                  x2={cx}
                  y2={Y_BOTTOM}
                  stroke={isLaneFocused ? lane.color : '#D8C9A9'}
                  strokeOpacity={isLaneFocused ? 0.5 : 0.08}
                  strokeWidth={isLaneFocused ? 1.5 : 0.8}
                  strokeDasharray={isLaneFocused ? undefined : '4 6'}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {/* Dynamic Depth Era Horizon Lines (2026 -> 1698) */}
            {YEAR_TICKS.map((tick) => {
              const { y, scale, opacity } = projectDepth(tick.u, depthOffset);
              if (opacity <= 0.03 || y < Y_HORIZON - 8 || y > Y_BOTTOM + 12) {
                return null;
              }
              const x1 = projectX(LANE_BOUNDARIES_BOTTOM[0], scale);
              const x2 = projectX(LANE_BOUNDARIES_BOTTOM[4], scale);
              const isEraSelected = activeEraYear === tick.year;
              return (
                <line
                  key={`tick-line-${tick.year}`}
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  stroke={isEraSelected ? '#C9A46A' : '#D8C9A9'}
                  strokeOpacity={isEraSelected ? 0.65 * opacity : 0.2 * opacity}
                  strokeWidth={isEraSelected ? 1.5 : 1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}

            {/* Theme Filter Chronological Connecting Line (Unified Bronze Gold #C9A46A) */}
            {themePolylinePoints && (
              <polyline
                points={themePolylinePoints}
                fill="none"
                stroke="#C9A46A"
                strokeOpacity={0.78}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Diagonal #C9A46A Connector Line from Active Node to Preview Card */}
          {activeProjected && (
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              preserveAspectRatio="none"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 w-full h-full z-20"
            >
              <line
                x1={activeProjected.svgX}
                y1={activeProjected.svgY}
                x2={cardAnchorSvg.x}
                y2={cardAnchorSvg.y}
                stroke="#C9A46A"
                strokeOpacity={0.85}
                strokeWidth={1.4}
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
              <circle
                cx={activeProjected.svgX}
                cy={activeProjected.svgY}
                r={10}
                fill="none"
                stroke="#C9A46A"
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {/* Directly Clickable Receding Year Ticks Along Left Rail (1698 - 2026) */}
          <div className="pointer-events-none absolute inset-0 z-25">
            {YEAR_TICKS.map((tick) => {
              const { y, scale, opacity } = projectDepth(tick.u, depthOffset);
              if (opacity <= 0.08 || y < Y_HORIZON - 6 || y > Y_BOTTOM + 6) {
                return null;
              }
              const leftRailX = projectX(LANE_BOUNDARIES_BOTTOM[0], scale);
              const labelLeftPct = Math.max(5.4, ((leftRailX - 10) / SVG_W) * 100);
              const topPct = (y / SVG_H) * 100;
              const isSelected = activeEraYear === tick.year;

              return (
                <button
                  key={`year-tick-${tick.year}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFocusYearTick(tick);
                  }}
                  style={{
                    left: `${labelLeftPct}%`,
                    top: `${topPct}%`,
                    opacity: isSelected ? 1 : Math.max(0.45, opacity * 0.88),
                  }}
                  className={`pointer-events-auto absolute -translate-x-full -translate-y-1/2 font-mono text-[11px] sm:text-xs tabular-nums tracking-wider transition-all cursor-pointer px-2 py-0.5 rounded-full border ${
                    isSelected
                      ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817] font-bold shadow-md'
                      : 'bg-[#171817]/70 border-transparent text-[#D8C9A9]/80 hover:text-[#C9A46A] hover:border-[#C9A46A]/45 hover:bg-[#171817]'
                  }`}
                >
                  {tick.label}
                </button>
              );
            })}
          </div>

          {/* ================================================================
              17 CLEAN GLOWING REGIONAL DOTS + SINGLE FLOATING HOVER/ACTIVE LABEL
             ================================================================ */}
          <div className="pointer-events-none absolute inset-0 z-20">
            {projectedSites.map((item) => {
              if (item.depthOpacity <= 0.04) return null;
              const isSelected = pinnedSiteId === item.site.id;
              const isHovered = hoveredSiteId === item.site.id;
              const showSingleLabel = labeledSiteId === item.site.id;
              const sizePx = Math.round(
                (isSelected || isHovered ? 17 : 10 + item.scale * 7) *
                  (isMobileViewport ? 0.92 : 1)
              );
              const nodeOpacity =
                item.depthOpacity * (item.isHighlighted ? 1 : 0.2);

              // Strictly regional corridor color (decoupled from Theme filter)
              const nodeDotColor = item.region.color;

              // Smart horizontal label alignment so full name never clips near stage edges
              const labelAlignClass =
                item.xPct < 24
                  ? 'left-0 translate-x-0'
                  : item.xPct > 72
                  ? 'right-0 translate-x-0'
                  : 'left-1/2 -translate-x-1/2';

              return (
                <button
                  key={item.site.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsAutoPlaying(false);
                    setPinnedSiteId((prev) =>
                      prev === item.site.id ? null : item.site.id
                    );
                  }}
                  onMouseEnter={() => handleNodeMouseEnter(item.site.id)}
                  onMouseLeave={handleNodeMouseLeave}
                  aria-label={`${item.localized.officialName} (${item.yearStr})`}
                  style={{
                    left: `${item.xPct}%`,
                    top: `${item.yPct}%`,
                    opacity: nodeOpacity,
                    zIndex: showSingleLabel ? 45 : Math.round(10 + item.frac * 15),
                  }}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer focus:outline-none p-2"
                >
                  <span
                    style={{
                      width: `${sizePx}px`,
                      height: `${sizePx}px`,
                      backgroundColor: nodeDotColor,
                      boxShadow:
                        isSelected || isHovered
                          ? '0 0 0 3px #C9A46A, 0 0 22px rgba(201,164,106,0.95)'
                          : item.isHighlighted
                          ? `0 0 12px ${nodeDotColor}`
                          : 'none',
                    }}
                    className={`block rounded-full border transition-transform duration-200 group-hover:scale-125 group-hover:shadow-[0_0_0_3px_#C9A46A,0_0_20px_rgba(201,164,106,0.9)] ${
                      isSelected || isHovered
                        ? 'border-[#F4EFE4] scale-115'
                        : 'border-[#D8C9A9]/85'
                    }`}
                  />

                  {/* Single Floating Label (Full Name + Year, Zero Truncation) */}
                  {showSingleLabel && (
                    <span
                      className={`pointer-events-none absolute ${labelAlignClass} -top-9 whitespace-nowrap px-3 py-1 rounded-full bg-[#171817] border border-[#C9A46A] text-[11.5px] font-medium text-[#D8C9A9] shadow-[0_12px_30px_rgba(0,0,0,0.85)] flex items-center gap-1.5`}
                    >
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: nodeDotColor }}
                        className="w-2 h-2 rounded-full shrink-0"
                      />
                      <span>{item.localized.officialName}</span>
                      <span className="font-mono tabular-nums text-[#C9A46A] font-semibold">
                        · {item.yearStr}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ================================================================
              DESKTOP RIGHT MINIMALIST THEME FILTER SIDEBAR (220px, Unified #C9A46A)
             ================================================================ */}
          <aside
            aria-label={copy.themesHeading}
            className="hidden lg:flex flex-col right-4 top-4 z-30 absolute bg-[#171817]/92 backdrop-blur-md border border-[#C9A46A]/30 rounded-2xl p-3.5 w-[220px] shadow-2xl"
          >
            <div className="flex items-center gap-2 pb-2.5 mb-2 border-b border-[#C9A46A]/20">
              <Eye className="w-4 h-4 text-[#C9A46A] shrink-0" strokeWidth={1.6} />
              <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#C9A46A]">
                {copy.themesHeading}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              {THEME_OPTIONS.map((opt) => {
                const active = selectedTheme === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setSelectedTheme(opt.key);
                    }}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs transition-all cursor-pointer border ${
                      active
                        ? 'bg-[#C9A46A]/18 border-[#C9A46A] text-[#C9A46A] font-semibold'
                        : 'bg-transparent border-transparent text-[#D8C9A9]/80 hover:text-[#D8C9A9] hover:bg-[#D8C9A9]/6'
                    }`}
                  >
                    <span className="truncate pr-2">{opt.label[lang]}</span>
                    <span
                      className={`font-mono tabular-nums text-[10.5px] px-1.5 py-0.5 rounded shrink-0 ${
                        active
                          ? 'bg-[#C9A46A] text-[#171817] font-bold'
                          : 'text-[#C9A46A]/80'
                      }`}
                    >
                      {themeCounts[opt.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetAll}
                className="mt-2.5 pt-2.5 border-t border-[#C9A46A]/20 text-[11px] text-[#C9A46A] hover:text-[#D8C9A9] text-left transition-colors cursor-pointer"
              >
                {copy.clearFilters}
              </button>
            )}
          </aside>

          {/* ================================================================
              QUICK PREVIEW CARD (Opens when clicking a glowing node)
             ================================================================ */}
          {activeProjected && (
            <div
              role="dialog"
              aria-label={activeProjected.localized.officialName}
              onMouseEnter={() => {
                if (hoverCloseTimeoutRef.current !== null) {
                  window.clearTimeout(hoverCloseTimeoutRef.current);
                  hoverCloseTimeoutRef.current = null;
                }
                isCardHoveredRef.current = true;
                setIsCardHovered(true);
              }}
              onMouseLeave={() => {
                isCardHoveredRef.current = false;
                setIsCardHovered(false);
                if (!pinnedSiteId) {
                  setHoveredSiteId(null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-4 z-40 sm:w-[430px] max-w-[calc(100%-24px)] rounded-2xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.82)] border border-[#C9A46A]/50 bg-[#171817] grid grid-cols-1 sm:grid-cols-[148px_1fr]"
            >
              {/* Left Thumbnail Photo */}
              <div className="relative h-32 sm:h-auto min-h-[144px] bg-[#222321] overflow-hidden border-b sm:border-b-0 sm:border-r border-[#C9A46A]/20">
                {activePhotoUrl && !failedPhotos[activeProjected.site.id] ? (
                  <HeritageSmoothImage
                    src={activePhotoUrl}
                    alt={activeProjected.localized.officialName}
                    waitTone="dark"
                    className="w-full h-full object-cover"
                    onError={() =>
                      setFailedPhotos((prev) => ({
                        ...prev,
                        [activeProjected.site.id]: true,
                      }))
                    }
                  />
                ) : (
                  <HeritageTypographicPlate
                    site={activeProjected.site}
                    className="w-full h-full"
                  />
                )}
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#171817]/90 border border-[#C9A46A]/40 font-mono text-[10.5px] font-semibold text-[#C9A46A] tabular-nums">
                  {activeProjected.yearStr}
                </span>
              </div>

              {/* Right Details: Region (colored dot) + Theme + Name + 2-Line Summary + Enter 3D CTA */}
              <div className="p-3.5 sm:p-4 flex flex-col justify-between gap-2.5 min-w-0 relative">
                <button
                  type="button"
                  onClick={() => {
                    isCardHoveredRef.current = false;
                    setPinnedSiteId(null);
                    setHoveredSiteId(null);
                    setIsCardHovered(false);
                    setIsAutoPlaying(false);
                  }}
                  aria-label={copy.closeCard}
                  title={copy.closeCard}
                  className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#222321] hover:bg-[#C9A46A]/20 text-[#D8C9A9]/75 hover:text-[#C9A46A] border border-[#C9A46A]/30 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.7} />
                </button>

                <div className="pr-7 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10.5px] text-[#D8C9A9]/80">
                    <span
                      aria-hidden="true"
                      style={{ backgroundColor: activeProjected.region.color }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                    <span className="truncate font-medium">
                      {activeProjected.region.name[lang]}
                    </span>
                    <span aria-hidden="true" className="opacity-45">
                      ·
                    </span>
                    <span className="truncate text-[#C9A46A]">
                      {activeProjected.primaryTheme.label[lang]}
                    </span>
                  </div>

                  <h3 className="font-serif text-sm sm:text-base font-semibold text-[#D8C9A9] leading-snug line-clamp-1">
                    {activeProjected.localized.officialName}
                  </h3>

                  <p className="text-[11.5px] leading-relaxed text-[#D8C9A9]/75 line-clamp-2 m-0">
                    {activeProjected.localized.summary}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onOpen3DById(activeProjected.site.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C9A46A] hover:brightness-110 text-[#171817] text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    <Box className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
                    <span>{copy.enter3D}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectSiteById(activeProjected.site.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-[#C9A46A]/35 text-[#D8C9A9] hover:border-[#C9A46A] hover:text-[#C9A46A] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
                    <span>{copy.dossierBtn}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ====================================================================
           FLAT CHRONOLOGICAL TIMELINE MODE ("NIÊN BIỂU PHẲNG" 1698 -> 2026)
           ==================================================================== */
        <div
          className={
            isFullscreen
              ? 'relative flex-1 flex flex-col bg-[#171817] px-4 sm:px-6 py-5 space-y-4 min-h-0'
              : 'relative bg-[#171817] px-4 sm:px-6 py-5 space-y-4'
          }
        >
          {/* Top Filter Bar for Flat View: Smooth Scrollable Bronze-Gold Themes + Era Milestones */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#C9A46A]/20">
            <div className="min-w-0 flex-1">
              <ScrollableThemeFilterBar
                lang={lang}
                selectedTheme={selectedTheme}
                themeCounts={themeCounts}
                onSelectTheme={(key) => setSelectedTheme(key)}
                keyPrefix="flat-theme"
              />
            </div>

            <DragScrollRow className="flex items-center gap-1.5 overflow-x-auto flex-nowrap heritage-scrollbar pb-1.5">
              {MILESTONES_ASC.map((tick) => {
                const active = activeEraYear === tick.year;
                return (
                  <button
                    key={`flat-year-${tick.year}`}
                    type="button"
                    onClick={() =>
                      setActiveEraYear((prev) =>
                        prev === tick.year ? null : tick.year
                      )
                    }
                    className={`shrink-0 px-2.5 py-1 rounded-full font-mono text-[11px] tabular-nums border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#C9A46A] border-[#C9A46A] text-[#171817] font-bold'
                        : 'bg-[#222321] border-[#C9A46A]/25 text-[#D8C9A9]/75 hover:text-[#C9A46A]'
                    }`}
                  >
                    {tick.label}
                  </button>
                );
              })}
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="shrink-0 px-2.5 py-1 rounded-full text-[11px] text-[#C9A46A] hover:underline cursor-pointer"
                >
                  {copy.resetView}
                </button>
              )}
            </DragScrollRow>
          </div>

          {/* Flat Chronological List (1698 -> 2026) with Cascade Reveal */}
          {filteredChronologicalSites.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-sm text-[#D8C9A9]/70">{copy.flatEmpty}</p>
              <button
                type="button"
                onClick={handleResetAll}
                className="px-4 py-2 rounded-full bg-[#C9A46A] text-[#171817] text-xs font-semibold cursor-pointer"
              >
                {copy.clearFilters}
              </button>
            </div>
          ) : (
            <div
              className={
                isFullscreen
                  ? 'relative pl-5 sm:pl-7 flex-1 overflow-y-auto heritage-scrollbar pr-1 space-y-3'
                  : 'relative pl-5 sm:pl-7 max-h-[560px] overflow-y-auto heritage-scrollbar pr-1 space-y-3'
              }
            >
              {/* Vertical Timeline Spine */}
              <div
                aria-hidden="true"
                className="absolute left-2 sm:left-2.5 top-3 bottom-3 w-px bg-[#C9A46A]/30"
              />

              {filteredChronologicalSites.map((site, idx) => {
                const localized = localizeSite(site);
                const region = getRegionForSite(site);
                const primaryTheme = getPrimaryThemeForSite(site);
                const yearStr = formatCommencementYear(site.commencementYear, lang);
                const photoUrl =
                  site.photos?.[0]?.trim() ||
                  DEFAULT_SITE_PHOTOS_BY_ID[site.id]?.[0] ||
                  '';

                return (
                  <CascadeRevealCard
                    key={`flat-${site.id}`}
                    index={idx}
                    columnsPerRow={1}
                    delayStepMs={55}
                    maxDelayMs={240}
                  >
                    <article className="relative rounded-xl bg-[#222321] border border-[#C9A46A]/20 hover:border-[#C9A46A]/55 transition-colors p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                      {/* Axis Dot (Regional Color) */}
                      <span
                        aria-hidden="true"
                        style={{ backgroundColor: region.color }}
                        className="absolute -left-[18px] sm:-left-[24px] top-6 sm:top-1/2 sm:-translate-y-1/2 w-3 h-3 rounded-full ring-2 ring-[#171817] border border-[#D8C9A9]/70"
                      />

                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-32 aspect-video shrink-0 rounded-lg overflow-hidden bg-[#171817] border border-[#C9A46A]/20">
                        {photoUrl && !failedPhotos[site.id] ? (
                          <HeritageSmoothImage
                            src={photoUrl}
                            alt={localized.officialName}
                            loading="lazy"
                            waitTone="dark"
                            className="w-full h-full object-cover"
                            onError={() =>
                              setFailedPhotos((prev) => ({
                                ...prev,
                                [site.id]: true,
                              }))
                            }
                          />
                        ) : (
                          <HeritageTypographicPlate
                            site={site}
                            variant="compact"
                            className="w-full h-full"
                          />
                        )}
                        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#171817]/90 border border-[#C9A46A]/35 font-mono text-[10px] font-semibold text-[#C9A46A] tabular-nums">
                          {yearStr}
                        </span>
                      </div>

                      {/* Text Details */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#D8C9A9]/80">
                          <span className="inline-flex items-center gap-1.5 font-medium">
                            <span
                              aria-hidden="true"
                              style={{ backgroundColor: region.color }}
                              className="w-2 h-2 rounded-full shrink-0"
                            />
                            {region.name[lang]}
                          </span>
                          <span aria-hidden="true" className="opacity-40">
                            ·
                          </span>
                          <span className="text-[#C9A46A]">
                            {primaryTheme.label[lang]}
                          </span>
                        </div>

                        <h3 className="font-serif text-base font-semibold text-[#D8C9A9] leading-snug">
                          {localized.officialName}
                        </h3>

                        <p className="text-xs text-[#D8C9A9]/75 leading-relaxed line-clamp-2 m-0">
                          {localized.summary}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => onOpen3DById(site.id)}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-[#C9A46A] hover:brightness-110 text-[#171817] text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                        >
                          <Box className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
                          <span>{copy.enter3D}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onSelectSiteById(site.id)}
                          className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-full border border-[#C9A46A]/35 text-[#D8C9A9] hover:border-[#C9A46A] hover:text-[#C9A46A] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" strokeWidth={1.6} />
                          <span>{copy.dossierBtn}</span>
                        </button>
                      </div>
                    </article>
                  </CascadeRevealCard>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Compact Centered Playback & Navigation Pill Bar (Above Bottom 4 Regional Lanes) */}
      {viewMode === '3d' && (
        <div className="relative z-30 shrink-0 border-t border-[#C9A46A]/18 bg-[#171817] px-3 py-2.5 flex items-center justify-center">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-[#222321] border border-[#C9A46A]/35 shadow-lg max-w-full overflow-x-auto flex-nowrap heritage-scrollbar">
            <button
              type="button"
              onClick={() => handleStepMonument(-1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#D8C9A9] hover:bg-[#C9A46A]/15 hover:text-[#C9A46A] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ChevronLeft className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
              <span>{copy.prevSite}</span>
            </button>

            <span aria-hidden="true" className="w-px h-4 bg-[#C9A46A]/25 shrink-0" />

            <button
              type="button"
              onClick={() => {
                setActiveEraYear(null);
                setIsAutoPlaying((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isAutoPlaying
                  ? 'bg-[#A94F3D] text-[#F7F3EB]'
                  : 'bg-[#C9A46A] text-[#171817] hover:brightness-110'
              }`}
            >
              {isAutoPlaying ? (
                <Pause className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
              ) : (
                <Play className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
              )}
              <span>{isAutoPlaying ? copy.autoplayStop : copy.autoplayStart}</span>
            </button>

            <span aria-hidden="true" className="w-px h-4 bg-[#C9A46A]/25 shrink-0" />

            <button
              type="button"
              onClick={() => handleStepMonument(1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-[#D8C9A9] hover:bg-[#C9A46A]/15 hover:text-[#C9A46A] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>{copy.nextSite}</span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" strokeWidth={1.7} />
            </button>

            {(hasActiveFilter || Math.abs(depthOffset) > 0.04 || pinnedSiteId) && (
              <>
                <span aria-hidden="true" className="w-px h-4 bg-[#C9A46A]/25 shrink-0" />
                <button
                  type="button"
                  onClick={handleResetAll}
                  title={copy.resetView}
                  aria-label={copy.resetView}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[#D8C9A9]/75 hover:text-[#C9A46A] hover:bg-[#C9A46A]/15 transition-colors cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.7} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile / Narrow-Screen Horizontal Scrollable & Mouse-Draggable Theme Filter Bar */}
      {viewMode === '3d' && (
        <div className="lg:hidden shrink-0 border-t border-[#C9A46A]/20 bg-[#171817] px-3 py-2.5">
          <ScrollableThemeFilterBar
            lang={lang}
            selectedTheme={selectedTheme}
            themeCounts={themeCounts}
            onSelectTheme={(key) => {
              setIsAutoPlaying(false);
              setSelectedTheme(key);
            }}
            showEyeIcon
            keyPrefix="mobile-theme"
          />
        </div>
      )}

      {/* Bottom 4 Regional Lanes Bar */}
      <div
        role="group"
        aria-label={copy.allRegionsHint}
        className="relative z-30 shrink-0 grid grid-cols-2 lg:grid-cols-4 border-t border-[#C9A46A]/30"
      >
        {REGION_LANES.map((lane) => {
          const isSelected = selectedRegion === lane.key;
          const isDimmed = selectedRegion !== null && !isSelected;
          const laneCount = visibleSites.filter(
            (s) => getRegionForSite(s).key === lane.key
          ).length;

          return (
            <button
              key={`lane-btn-${lane.key}`}
              type="button"
              onClick={() => {
                setIsAutoPlaying(false);
                setSelectedRegion((prev) =>
                  prev === lane.key ? null : lane.key
                );
              }}
              style={{
                backgroundColor: lane.color,
                color: lane.textColor,
              }}
              className={`relative px-3.5 sm:px-5 py-3 sm:py-3.5 text-left transition-all cursor-pointer flex items-center justify-between gap-2 border-r border-[#171817]/20 last:border-r-0 ${
                isDimmed ? 'opacity-50 hover:opacity-90' : 'opacity-100'
              } ${isSelected ? 'ring-2 ring-inset ring-[#D8C9A9]' : ''}`}
            >
              <div className="min-w-0">
                <div className="font-serif text-xs sm:text-sm font-bold tracking-wide truncate">
                  {lane.name[lang]}
                </div>
                <div
                  style={{ color: lane.subTextColor }}
                  className="text-[10px] sm:text-[11px] truncate mt-0.5"
                >
                  {lane.sub[lang]}
                </div>
              </div>
              <span
                style={{
                  borderColor: lane.borderColor,
                  color: lane.textColor,
                }}
                className="shrink-0 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border bg-[#171817]/10 tabular-nums"
              >
                {laneCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* ====================================================================
          UNIFIED VISUAL SVG DIAGRAM GUIDE MODAL (Always unclipped, z-[60])
         ==================================================================== */}
      {isGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={copy.guideTitle}
          onClick={dismissGuide}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#171817]/82 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[#171817] border border-[#C9A46A]/45 shadow-[0_28px_70px_rgba(0,0,0,0.88)] flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 px-5 sm:px-6 pt-5 pb-3.5 border-b border-[#C9A46A]/20 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#D8C9A9] leading-snug">
                  {copy.guideTitle}
                </h3>
                <p className="mt-1 text-xs text-[#C9A46A]">
                  {copy.guideSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={dismissGuide}
                aria-label={copy.closeCard}
                className="w-8 h-8 rounded-full border border-[#C9A46A]/35 text-[#D8C9A9]/80 hover:text-[#C9A46A] hover:border-[#C9A46A] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={1.7} />
              </button>
            </div>

            {/* 3 Visual SVG Diagram Cards */}
            <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Lọc màu theo Chủ đề */}
              <div className="rounded-xl bg-[#222321] border border-[#C9A46A]/25 p-3.5 flex flex-col gap-3">
                <div className="w-full aspect-[16/10] rounded-lg bg-[#171817] border border-[#C9A46A]/18 flex items-center justify-center overflow-hidden p-2">
                  <svg
                    viewBox="0 0 220 128"
                    className="w-full h-full"
                    aria-hidden="true"
                  >
                    <defs>
                      <filter id="guideGlow1" x="-40%" y="-40%" width="180%" height="180%">
                        <feGaussianBlur stdDeviation="2.6" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    {/* Subtle vertical rail behind dots */}
                    <line
                      x1="34"
                      y1="14"
                      x2="34"
                      y2="114"
                      stroke="#C9A46A"
                      strokeOpacity="0.22"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    {[
                      { y: 22, color: '#A94F3D', tag: copy.guideCard1Tags[0] },
                      { y: 50, color: '#47796D', tag: copy.guideCard1Tags[1] },
                      { y: 78, color: '#526D8B', tag: copy.guideCard1Tags[2] },
                      { y: 106, color: '#C9A46A', tag: copy.guideCard1Tags[3] },
                    ].map((row, idx) => (
                      <g key={`diag-theme-${idx}`}>
                        {/* Outer halo */}
                        <circle
                          cx="34"
                          cy={row.y}
                          r="9"
                          fill={row.color}
                          fillOpacity="0.22"
                        />
                        {/* Glowing core dot */}
                        <circle
                          cx="34"
                          cy={row.y}
                          r="5"
                          fill={row.color}
                          stroke="#D8C9A9"
                          strokeWidth="1.2"
                          filter="url(#guideGlow1)"
                        />
                        {/* Connector line from dot to tag */}
                        <line
                          x1="44"
                          y1={row.y}
                          x2="92"
                          y2={row.y}
                          stroke={row.color}
                          strokeOpacity="0.75"
                          strokeWidth="1.4"
                          strokeDasharray="3 2.5"
                        />
                        <circle cx="92" cy={row.y} r="2" fill={row.color} />
                        {/* Theme tag badge */}
                        <rect
                          x="96"
                          y={row.y - 10}
                          width="108"
                          height="20"
                          rx="10"
                          fill="#222321"
                          stroke={row.color}
                          strokeOpacity="0.75"
                          strokeWidth="1.2"
                        />
                        <circle cx="108" cy={row.y} r="3" fill={row.color} />
                        <text
                          x="117"
                          y={row.y + 3.5}
                          fill="#D8C9A9"
                          fontSize="9.5"
                          fontWeight="600"
                          fontFamily="system-ui, -apple-system, sans-serif"
                        >
                          {row.tag}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                <div className="space-y-1 text-center px-1">
                  <h4 className="text-xs font-semibold text-[#C9A46A] tracking-wide">
                    1. {copy.guideCard1Title}
                  </h4>
                  <p className="text-[11.5px] leading-snug text-[#D8C9A9]/85 m-0">
                    {copy.guideCard1Caption}
                  </p>
                </div>
              </div>

              {/* Card 2: Lướt trục thời gian 1698 – 2026 */}
              <div className="rounded-xl bg-[#222321] border border-[#C9A46A]/25 p-3.5 flex flex-col gap-3">
                <div className="w-full aspect-[16/10] rounded-lg bg-[#171817] border border-[#C9A46A]/18 flex items-center justify-center overflow-hidden p-2">
                  <svg
                    viewBox="0 0 220 128"
                    className="w-full h-full"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="guideRailGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#C9A46A" stopOpacity="0.35" />
                        <stop offset="50%" stopColor="#C9A46A" stopOpacity="1" />
                        <stop offset="100%" stopColor="#C9A46A" stopOpacity="0.35" />
                      </linearGradient>
                    </defs>

                    {/* Minimalist Mouse Scroll Icon */}
                    <g transform="translate(88, 12)">
                      {/* Mouse body */}
                      <rect
                        x="10"
                        y="6"
                        width="24"
                        height="38"
                        rx="12"
                        fill="#222321"
                        stroke="#C9A46A"
                        strokeWidth="1.6"
                      />
                      {/* Animated scroll wheel */}
                      <rect
                        x="20"
                        y="13"
                        width="4"
                        height="9"
                        rx="2"
                        fill="#C9A46A"
                      >
                        <animate
                          attributeName="y"
                          values="12;19;12"
                          dur="1.8s"
                          repeatCount="indefinite"
                        />
                      </rect>
                      {/* Left & right horizontal swipe chevrons */}
                      <path
                        d="M-6 20 L-12 25 L-6 30"
                        fill="none"
                        stroke="#D8C9A9"
                        strokeOpacity="0.6"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M50 20 L56 25 L50 30"
                        fill="none"
                        stroke="#D8C9A9"
                        strokeOpacity="0.6"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Vertical scroll cue arrows */}
                      <path
                        d="M18 1 L22 -3 L26 1"
                        fill="none"
                        stroke="#C9A46A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M18 49 L22 53 L26 49"
                        fill="none"
                        stroke="#C9A46A"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>

                    {/* Horizontal Chronological Rail: 1698 ───●─── 2026 */}
                    <line
                      x1="46"
                      y1="94"
                      x2="174"
                      y2="94"
                      stroke="url(#guideRailGrad)"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    {/* Era tick marks */}
                    {[46, 78, 110, 142, 174].map((x) => (
                      <line
                        key={`rail-tick-${x}`}
                        x1={x}
                        y1="89"
                        x2={x}
                        y2="99"
                        stroke="#D8C9A9"
                        strokeOpacity="0.55"
                        strokeWidth="1.2"
                      />
                    ))}

                    {/* Moving Glowing Year Indicator Node */}
                    <g>
                      <circle cx="110" cy="94" r="11" fill="#C9A46A" fillOpacity="0.22">
                        <animate
                          attributeName="cx"
                          values="68;152;68"
                          dur="3.6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <circle
                        cx="110"
                        cy="94"
                        r="5.5"
                        fill="#C9A46A"
                        stroke="#F4EFE4"
                        strokeWidth="1.5"
                      >
                        <animate
                          attributeName="cx"
                          values="68;152;68"
                          dur="3.6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </g>

                    {/* Endpoint Year Labels */}
                    <text
                      x="46"
                      y="116"
                      textAnchor="middle"
                      fill="#C9A46A"
                      fontSize="10.5"
                      fontWeight="700"
                      fontFamily="ui-monospace, SFMono-Regular, monospace"
                    >
                      1698
                    </text>
                    <text
                      x="110"
                      y="116"
                      textAnchor="middle"
                      fill="#D8C9A9"
                      fillOpacity="0.55"
                      fontSize="9"
                      fontFamily="ui-monospace, SFMono-Regular, monospace"
                    >
                      1859 · 1945
                    </text>
                    <text
                      x="174"
                      y="116"
                      textAnchor="middle"
                      fill="#C9A46A"
                      fontSize="10.5"
                      fontWeight="700"
                      fontFamily="ui-monospace, SFMono-Regular, monospace"
                    >
                      2026
                    </text>
                  </svg>
                </div>
                <div className="space-y-1 text-center px-1">
                  <h4 className="text-xs font-semibold text-[#C9A46A] tracking-wide">
                    2. {copy.guideCard2Title}
                  </h4>
                  <p className="text-[11.5px] leading-snug text-[#D8C9A9]/85 m-0">
                    {copy.guideCard2Caption}
                  </p>
                </div>
              </div>

              {/* Card 3: Chạm điểm sáng để vào 3D */}
              <div className="rounded-xl bg-[#222321] border border-[#C9A46A]/25 p-3.5 flex flex-col gap-3">
                <div className="w-full aspect-[16/10] rounded-lg bg-[#171817] border border-[#C9A46A]/18 flex items-center justify-center overflow-hidden p-2">
                  <svg
                    viewBox="0 0 220 128"
                    className="w-full h-full"
                    aria-hidden="true"
                  >
                    {/* Subtle perspective grid floor on bottom-left */}
                    <path
                      d="M14 114 L52 72 L96 72 L106 114 Z"
                      fill="#C9A46A"
                      fillOpacity="0.06"
                      stroke="#C9A46A"
                      strokeOpacity="0.24"
                      strokeWidth="1"
                    />
                    <line
                      x1="28"
                      y1="94"
                      x2="100"
                      y2="94"
                      stroke="#C9A46A"
                      strokeOpacity="0.22"
                      strokeWidth="1"
                    />

                    {/* Glowing Monument Node + Pulsing Ripple */}
                    <circle
                      cx="62"
                      cy="90"
                      r="15"
                      fill="none"
                      stroke="#C9A46A"
                      strokeOpacity="0.45"
                      strokeWidth="1.2"
                    >
                      <animate
                        attributeName="r"
                        values="9;18;9"
                        dur="2.2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="stroke-opacity"
                        values="0.8;0.1;0.8"
                        dur="2.2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="62"
                      cy="90"
                      r="6"
                      fill="#A94F3D"
                      stroke="#C9A46A"
                      strokeWidth="2"
                    />

                    {/* Pointer Cursor Clicking the Glowing Node */}
                    <path
                      d="M65 93 L79 101 L73 103.5 L76 111 L72.5 112.5 L69.5 105 L65 109 Z"
                      fill="#D8C9A9"
                      stroke="#171817"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />

                    {/* Dashed Connector Line to Popped-Up 3D Card */}
                    <line
                      x1="67"
                      y1="85"
                      x2="112"
                      y2="56"
                      stroke="#C9A46A"
                      strokeWidth="1.5"
                      strokeDasharray="3.5 2.5"
                    />

                    {/* Popped-Up Floating 3D Preview Card */}
                    <g transform="translate(110, 14)">
                      <rect
                        x="0"
                        y="0"
                        width="96"
                        height="86"
                        rx="10"
                        fill="#222321"
                        stroke="#C9A46A"
                        strokeWidth="1.5"
                      />
                      {/* Isometric 3D Cube inside preview frame */}
                      <g transform="translate(48, 36)">
                        {/* Top face */}
                        <polygon
                          points="0,-20 20,-10 0,0 -20,-10"
                          fill="#C9A46A"
                          fillOpacity="0.28"
                          stroke="#C9A46A"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                        {/* Left face */}
                        <polygon
                          points="-20,-10 0,0 0,21 -20,11"
                          fill="#47796D"
                          fillOpacity="0.32"
                          stroke="#C9A46A"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                        {/* Right face */}
                        <polygon
                          points="20,-10 0,0 0,21 20,11"
                          fill="#A94F3D"
                          fillOpacity="0.34"
                          stroke="#C9A46A"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                      </g>
                      {/* Miniature CTA pill bar inside card */}
                      <rect
                        x="14"
                        y="66"
                        width="68"
                        height="13"
                        rx="6.5"
                        fill="#C9A46A"
                      />
                      <text
                        x="48"
                        y="75.5"
                        textAnchor="middle"
                        fill="#171817"
                        fontSize="7.8"
                        fontWeight="700"
                        fontFamily="system-ui, -apple-system, sans-serif"
                      >
                        3D SPACE →
                      </text>
                    </g>
                  </svg>
                </div>
                <div className="space-y-1 text-center px-1">
                  <h4 className="text-xs font-semibold text-[#C9A46A] tracking-wide">
                    3. {copy.guideCard3Title}
                  </h4>
                  <p className="text-[11.5px] leading-snug text-[#D8C9A9]/85 m-0">
                    {copy.guideCard3Caption}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Action (Always Visible, Never Cut Off) */}
            <div className="shrink-0 px-5 sm:px-6 pb-5 pt-2 border-t border-[#C9A46A]/15 flex items-center justify-end">
              <button
                type="button"
                onClick={dismissGuide}
                className="px-6 py-2.5 rounded-full bg-[#C9A46A] hover:brightness-110 text-[#171817] text-xs sm:text-sm font-semibold transition cursor-pointer shadow-lg"
              >
                {copy.guideConfirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HistoricalTimeline;

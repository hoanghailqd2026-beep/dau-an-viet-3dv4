import React, { useRef, useState, useMemo, useEffect } from 'react';
import { HeritageSite } from '../../types/heritage';
import { formatWGS84 } from '../../utils/coordinateConversion';
import { useI18n } from '../../i18n/I18nContext';
import { getIndochineCategoryMeta } from '../../utils/indochinePalette';
import { Wireframe3DEmblem, Flip3DText } from '../spatial/Ambient3DBackground';
import {
  HeritageTypographicPlate,
  getHeritagePlatePalette,
} from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { HeritageOptionSearchSelect } from '../common/HeritageSiteSearchSelect';
import { Camera } from 'lucide-react';

interface TeslaHeritageShowcaseProps {
  sites: HeritageSite[];
  isAnyModalOpen?: boolean;
  onOpen3D: (site: HeritageSite) => void;
  onOpenDetail: (site: HeritageSite) => void;
  onOpenARAudio: (site: HeritageSite) => void;
  onNavigateToMap: (site: HeritageSite) => void;
  onNavigateToCatalog?: () => void;
  onOpenPhotoManager?: (site: HeritageSite) => void;
}

const AUTO_PLAY_DURATION_MS = 5000;

export const TeslaHeritageShowcase: React.FC<TeslaHeritageShowcaseProps> = ({
  sites,
  isAnyModalOpen = false,
  onOpen3D,
  onOpenDetail,
  onOpenARAudio,
  onNavigateToMap,
  onNavigateToCatalog,
  onOpenPhotoManager,
}) => {
  const { lang, t, getLocalizedSite, formatDistrictName, removeTones } = useI18n();

  // Bắt đầu từ di tích 01 / 12 và tự động xoay vòng 01 -> 12 -> 01
  const [featuredIndex, setFeaturedIndex] = useState<number>(0);
  const [timerResetKey, setTimerResetKey] = useState<number>(0);
  const discoveryRef = useRef<HTMLDivElement>(null);
  const showcaseScrollRef = useRef<HTMLDivElement>(null);
  const landmarkTabsContainerRef = useRef<HTMLDivElement>(null);
  const landmarkTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const elapsedMsRef = useRef<number>(0);

  // Mobile story modal state
  const [showStoryModal, setShowStoryModal] = useState<boolean>(false);

  // Smart pause states (Desktop hover & Mobile active touch)
  const [isHoverPaused, setIsHoverPaused] = useState<boolean>(false);
  const [isTouchPaused, setIsTouchPaused] = useState<boolean>(false);

  // Apple Spatial Hero 3D Multi-layer Parallax state (normalized x, y in [-1, 1])
  const [heroParallax, setHeroParallax] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Multi-Plane 3D Perspective Card Tilt (up to 8deg), Image Counter-Parallax & Specular Spotlight
  const [cardTiltMap, setCardTiltMap] = useState<
    Record<
      string,
      {
        rotateX: number;
        rotateY: number;
        pctX: number;
        pctY: number;
        spotX: number;
        spotY: number;
        active: boolean;
      }
    >
  >({});

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // [-1, 1]
    const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // [-1, 1]
    setHeroParallax({
      x: Math.max(-1, Math.min(1, normX)),
      y: Math.max(-1, Math.min(1, normY)),
    });
  };

  const handleCardMouseMove = (siteId: string, e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const relY = e.clientY - rect.top;
    const pctX = (relX / Math.max(1, rect.width) - 0.5) * 2; // [-1, 1]
    const pctY = (relY / Math.max(1, rect.height) - 0.5) * 2; // [-1, 1]
    // Multi-Plane 3D tilt up to 8deg
    const rotateY = pctX * 8;
    const rotateX = -pctY * 8;
    setCardTiltMap((prev) => ({
      ...prev,
      [siteId]: {
        rotateX,
        rotateY,
        pctX,
        pctY,
        spotX: relX,
        spotY: relY,
        active: true,
      },
    }));
  };

  const handleCardMouseLeave = (siteId: string) => {
    setCardTiltMap((prev) => ({
      ...prev,
      [siteId]: {
        rotateX: 0,
        rotateY: 0,
        pctX: 0,
        pctY: 0,
        spotX: 0,
        spotY: 0,
        active: false,
      },
    }));
  };

  // Search & Filter state for the Discovery Section
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterRanking, setFilterRanking] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [failedPhotoMap, setFailedPhotoMap] = useState<Record<string, boolean>>({});

  const activeSite = sites[featuredIndex] || sites[0];
  const locActiveSite = getLocalizedSite(activeSite);
  const activeIndochineMeta = useMemo(
    () => getIndochineCategoryMeta(activeSite, lang),
    [activeSite, lang]
  );

  const isAutoPlayPaused =
    isHoverPaused || isTouchPaused || showStoryModal || isAnyModalOpen || sites.length <= 1;

  // Đồng bộ tự động cuộn thanh chọn nhanh (Auto-scroll Pills) mỗi khi chuyển di tích
  useEffect(() => {
    const container = landmarkTabsContainerRef.current;
    const item = landmarkTabRefs.current[featuredIndex];
    if (!item) return;

    const pageScrollTop = showcaseScrollRef.current?.scrollTop || 0;
    if (pageScrollTop < 120 && typeof item.scrollIntoView === 'function') {
      item.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    } else if (container) {
      const targetLeft = item.offsetLeft - container.clientWidth / 2 + item.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: 'smooth',
      });
    }
  }, [featuredIndex]);

  // Reset bộ đếm 5 giây và thanh tiến trình về 0% ngay khi đổi di tích hoặc bấm nút thủ công
  useEffect(() => {
    elapsedMsRef.current = 0;
    if (progressBarRef.current) {
      progressBarRef.current.style.width = '0%';
    }
  }, [featuredIndex, timerResetKey]);

  // Bộ đếm tự động chuyển slide sau mỗi 5000ms (5 giây) đồng bộ mượt với thanh tiến trình 2px
  useEffect(() => {
    if (isAutoPlayPaused) return;

    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTimestamp;
      lastTimestamp = now;
      elapsedMsRef.current += delta;

      const ratio = Math.min(1, elapsedMsRef.current / AUTO_PLAY_DURATION_MS);
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${ratio * 100}%`;
      }

      if (elapsedMsRef.current >= AUTO_PLAY_DURATION_MS) {
        elapsedMsRef.current = 0;
        if (progressBarRef.current) {
          progressBarRef.current.style.width = '0%';
        }
        setFeaturedIndex((prev) => (prev + 1) % sites.length);
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isAutoPlayPaused, featuredIndex, timerResetKey, sites.length]);

  const handlePrevFeatured = () => {
    setFeaturedIndex((prev) => (prev === 0 ? sites.length - 1 : prev - 1));
    setTimerResetKey((k) => k + 1);
  };

  const handleNextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % sites.length);
    setTimerResetKey((k) => k + 1);
  };

  const handleSelectLandmarkPill = (idx: number) => {
    setFeaturedIndex(idx);
    setTimerResetKey((k) => k + 1);
    const item = landmarkTabRefs.current[idx];
    if (item && typeof item.scrollIntoView === 'function') {
      item.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  // Typography parser: Split official name into primary monument title and proper-cased italic subtitle
  const parsedTitle = useMemo(() => {
    if (!locActiveSite) return { main: '', sub: '' };
    const toProperCase = (str: string) => {
      if (!str) return '';
      return str.replace(/(?:^|\s|\/|\(|\-|–)[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, (m) => m.toUpperCase());
    };

    if (locActiveSite.officialName.includes(' (')) {
      const parts = locActiveSite.officialName.split(' (');
      return {
        main: parts[0].trim(),
        sub: toProperCase(`(${parts.slice(1).join(' (').trim()}`),
      };
    }
    if (locActiveSite.officialName.includes(' - ')) {
      const parts = locActiveSite.officialName.split(' - ');
      return {
        main: parts[0].trim(),
        sub: toProperCase(parts.slice(1).join(' - ').trim()),
      };
    }
    if (locActiveSite.folkName) {
      const firstFolk = locActiveSite.folkName.split('/')[0].trim();
      return {
        main: locActiveSite.officialName,
        sub: toProperCase(firstFolk),
      };
    }
    return {
      main: locActiveSite.officialName,
      sub: toProperCase(t(`types.${locActiveSite.type}`)),
    };
  }, [locActiveSite, t]);

  // Filtered sites for Discovery section (Bilingual & tone-insensitive)
  const discoveryFilteredSites = useMemo(() => {
    return sites.filter((site) => {
      const locSite = getLocalizedSite(site);
      if (searchQuery.trim()) {
        const q = removeTones(searchQuery);
        const matchesName = removeTones(site.officialName).includes(q) || removeTones(locSite.officialName).includes(q);
        const matchesFolk = removeTones(site.folkName || '').includes(q) || removeTones(locSite.folkName || '').includes(q);
        const matchesCode = removeTones(site.identifierCode).includes(q);
        const matchesStreet = removeTones(site.address.street).includes(q);
        const matchesDistrict = removeTones(site.address.district).includes(q) || removeTones(locSite.address.district).includes(q);
        const matchesChronology = removeTones(site.chronology).includes(q) || removeTones(locSite.chronology).includes(q);
        const matchesArchitect = removeTones(site.architect).includes(q) || removeTones(locSite.architect).includes(q);
        const matchesStyle = removeTones(site.architecturalStyle).includes(q) || removeTones(locSite.architecturalStyle).includes(q);
        if (
          !matchesName &&
          !matchesFolk &&
          !matchesCode &&
          !matchesStreet &&
          !matchesDistrict &&
          !matchesChronology &&
          !matchesArchitect &&
          !matchesStyle
        ) {
          return false;
        }
      }

      if (filterType !== 'all' && site.type !== filterType) return false;
      if (filterRanking !== 'all' && site.rankingLevel !== filterRanking && !(filterRanking === 'City Level' && site.rankingLevel === 'City')) return false;
      if (filterDistrict !== 'all' && !site.address.district.includes(filterDistrict) && !locSite.address.district.includes(filterDistrict)) return false;

      return true;
    });
  }, [sites, searchQuery, filterType, filterRanking, filterDistrict, getLocalizedSite, removeTones]);

  // Unique list of districts for the filter dropdown
  const uniqueDistricts = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => set.add(s.address.district));
    return Array.from(set).sort();
  }, [sites]);

  return (
    <div
      ref={showcaseScrollRef}
      className="relative w-full max-w-full min-w-0 h-full indochine-polychrome-bg text-[#F2EFE9] overflow-y-auto overflow-x-hidden scroll-smooth"
    >
      {/* =========================================================================
          SECTION 1: EDITORIAL MAGAZINE COVER HERO & EXHIBITION INDEX BAR
          - Inspired by Musée du Louvre, Google Arts & Culture, and Kinfolk
          - Indochine Polychrome Color System (Sơn Mài & Gốm Cổ Đông Dương)
          - +25% Brighter & Higher Contrast Monument Photography
          - Vertical Color Accent Bar next to Monument Title + Category Color Badge
         ========================================================================= */}
      <section
        onMouseEnter={() => setIsHoverPaused(true)}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={() => {
          setIsHoverPaused(false);
          setHeroParallax({ x: 0, y: 0 });
        }}
        onTouchStart={() => setIsTouchPaused(true)}
        onTouchEnd={() => setIsTouchPaused(false)}
        onTouchCancel={() => setIsTouchPaused(false)}
        className="relative w-full max-w-full min-w-0 overflow-hidden max-md:min-h-full md:min-h-[calc(100svh-80px)] flex flex-col justify-between select-none bg-[#121110]"
        style={{ perspective: '1000px' }}
        aria-label="Điểm đến di sản tiêu biểu"
      >
        {/* Full-Bleed High-Resolution Archival Photography with Apple Spatial 3D Multi-layer Counter-Parallax */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-[#121110]">
          <div
            className="absolute inset-0 w-full h-full"
            style={{
              transform: `translate3d(${heroParallax.x * -15}px, ${heroParallax.y * -15}px, 0) scale(1.06)`,
              transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              willChange: 'transform',
            }}
          >
            {sites.map((siteItem, idx) => {
              const isCurrentSlide = idx === featuredIndex;
              const slidePhoto = siteItem.photos?.[0];
              const hasSlidePhoto = Boolean(slidePhoto) && !failedPhotoMap[siteItem.id];
              const slidePalette = getHeritagePlatePalette(siteItem.id, idx);

              if (!hasSlidePhoto) {
                return (
                  <div
                    key={`${siteItem.id}-${isCurrentSlide ? 'active' : 'idle'}`}
                    aria-hidden={!isCurrentSlide}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-out ${
                      isCurrentSlide ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
                    }`}
                    style={{
                      background: `radial-gradient(circle at 75% 32%, ${slidePalette.bg}33 0%, #141210 58%, #0E0E10 100%)`,
                    }}
                  />
                );
              }

              return (
                <img
                  key={`${siteItem.id}-${isCurrentSlide ? 'active' : 'idle'}`}
                  src={slidePhoto}
                  alt={siteItem.officialName}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  referrerPolicy="no-referrer"
                  aria-hidden={!isCurrentSlide}
                  onError={() =>
                    setFailedPhotoMap((prev) => ({ ...prev, [siteItem.id]: true }))
                  }
                  className={`absolute inset-0 w-full h-full object-cover object-[center_22%] sm:object-[center_25%] lg:object-[center_20%] filter brightness-[1.03] contrast-[1.08] saturate-[1.08] transition-opacity duration-1000 ease-out will-change-[opacity,transform] ${
                    isCurrentSlide
                      ? 'opacity-100 animate-apple-ken-burns z-[1]'
                      : 'opacity-0 scale-[1.12] z-0'
                  }`}
                />
              );
            })}
          </div>

          {/* Smooth Left-Side Gradient Only — Preserving Full Natural Color & Clarity of Monument Photography */}
          <div className="hidden sm:block absolute inset-0 z-[2] bg-gradient-to-r from-[#121110]/90 via-[#121110]/40 to-transparent pointer-events-none" />
          <div className="hidden sm:block absolute inset-x-0 bottom-0 h-32 z-[2] bg-gradient-to-t from-[#121110]/85 to-transparent pointer-events-none" />

          {/* Mobile Scrim (<640px) */}
          <div className="sm:hidden absolute inset-0 z-[2] bg-gradient-to-t from-[#121110]/90 via-[#121110]/45 to-transparent pointer-events-none" />
        </div>

        {/* 1. TOP CURATORIAL FOLIO HEADER (UNBOXED EDITORIAL CAPTION & MINIMAL PREV/NEXT) */}
        <div className="relative z-10 w-full pt-5 sm:pt-7 px-5 sm:px-10 lg:px-16 flex items-center justify-between border-b border-[#F4F1EA]/15 pb-4 shrink-0">
          <div className="hidden md:flex items-center gap-3 text-[13px] font-medium text-[#E6E1D6]/85">
            <span className="text-[#F4F1EA]">
              {lang === 'en'
                ? 'Southern Vietnam Architectural Monograph'
                : lang === 'zh'
                ? '越南东南部建筑遗产专刊'
                : 'Chuyên san Kiến trúc & Di sản Đông Nam Bộ'}
            </span>
            <span aria-hidden="true" className="text-[#C5A059]">
              —
            </span>
            <span>
              {lang === 'en'
                ? 'Saigon · Binh Duong · Ba Ria - Vung Tau'
                : lang === 'zh'
                ? '西贡 · 平阳 · 巴地头顿'
                : 'TP.HCM · Bình Dương · Bà Rịa - Vũng Tàu'}
            </span>
          </div>

          {/* Editorial Folio Progress & Previous / Next Links */}
          <div className="flex items-center gap-5 ml-auto">
            <div className="w-24 sm:w-32 h-[2px] bg-[#F4F1EA]/15 relative overflow-hidden" aria-hidden="true">
              <div
                ref={progressBarRef}
                className="h-full bg-[#C5A059] transition-colors duration-300"
                style={{ width: '0%' }}
              />
            </div>

            <div className="flex items-center gap-4 text-[13px] font-medium text-[#E6E1D6]/85">
              <button
                type="button"
                onClick={handlePrevFeatured}
                className="hover:text-[#C5A059] transition-colors cursor-pointer py-1"
                title={t('showcase.previousLandmark')}
                aria-label={t('showcase.previousLandmark')}
              >
                ← {lang === 'en' ? 'Prev' : lang === 'zh' ? '上一页' : 'Trước'}
              </button>
              <span className="text-[#F4F1EA]/20">/</span>
              <button
                type="button"
                onClick={handleNextFeatured}
                className="hover:text-[#C5A059] transition-colors cursor-pointer py-1"
                title={t('showcase.nextLandmark')}
                aria-label={t('showcase.nextLandmark')}
              >
                {lang === 'en' ? 'Next' : lang === 'zh' ? '下一页' : 'Tiếp'} →
              </button>
            </div>
          </div>
        </div>

        {/* 2. EDITORIAL MAGAZINE COVER HERO CONTENT (60-30-10 LUXURY RULE + APPLE SPATIAL FOREGROUND PARALLAX) */}
        <div
          className="relative z-10 w-full px-5 sm:px-10 lg:px-16 flex-1 flex flex-col justify-end py-6 sm:py-10 lg:py-12"
          style={{
            transform: `translate3d(${heroParallax.x * 10}px, ${heroParallax.y * 10}px, 30px)`,
            transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          <div
            key={activeSite.id}
            className="w-full max-w-4xl space-y-4 sm:space-y-6 text-left"
          >
            {/* TIER 0 (0ms): KICKER + CHAMPAGNE GOLD ARCHIVAL BADGE + NÚT ĐỔI ẢNH THẬT */}
            <div className="hero-tier-0 flex flex-wrap items-center gap-3">
              <span className="font-serif italic text-base sm:text-lg text-[#C5A059] tabular-nums">
                No. {String(featuredIndex + 1).padStart(2, '0')} / {String(sites.length).padStart(2, '0')}
              </span>
              <span className="px-2.5 py-1 text-[12px] font-medium border border-[#C5A059]/45 bg-[#141311]/75 text-[#C5A059]">
                {activeIndochineMeta.badgeLabel}
              </span>
              <span className="font-sans text-[12px] font-medium text-[#E6E1D6] border-l border-[#F4F1EA]/25 pl-3 tabular-nums">
                {activeSite.identifierCode}
              </span>
              {onOpenPhotoManager && (
                <button
                  type="button"
                  onClick={() => onOpenPhotoManager(activeSite)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141311]/85 hover:bg-[#C5A059] text-[#E6E1D6] hover:text-[#141311] border border-[#C5A059]/45 font-sans text-[12px] font-medium transition-colors cursor-pointer rounded-none"
                  title={
                    lang === 'en'
                      ? 'Change or upload real monument photograph'
                      : 'Tải lên hoặc đổi ảnh chụp thực tế cho di tích này'
                  }
                >
                  <Camera className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'Real Photo'
                      : lang === 'zh'
                      ? '更换实景照片'
                      : 'Đổi ảnh thật'}
                  </span>
                </button>
              )}
            </div>

            {/* TIER 1 (80ms) & TIER 2 (160ms): TIÊU ĐỀ LỚN SERIF & CHỮ PHỤ MÀU TRẮNG NGÀ / XÁM BẠC (#E6E1D6) */}
            <div className="space-y-2 min-w-0">
              <h1 className="hero-tier-1 apple-title-shimmer font-serif text-4xl sm:text-6xl lg:text-7xl font-medium tracking-tight text-[#F4F1EA] leading-[1.06] drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)]">
                {parsedTitle.main}
              </h1>
              {parsedTitle.sub && (
                <p className="hero-tier-2 font-serif italic text-xl sm:text-2xl lg:text-3xl font-normal leading-snug text-[#E6E1D6]">
                  {parsedTitle.sub}
                </p>
              )}
            </div>

            {/* TIER 3 (240ms): ĐƯỜNG KẺ PHÂN CÁCH MẢNH & THÔNG TIN KIẾN TRÚC SƯ / NIÊN ĐẠI (#E6E1D6 & #C5A059) */}
            <div className="hero-tier-3 pt-2 border-t border-[#F4F1EA]/15 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium text-[#E6E1D6]/85">
              <span className="text-[#F4F1EA] font-medium">
                {formatDistrictName(activeSite.address.district)}
              </span>
              <span aria-hidden="true" className="text-[#C5A059]">
                ·
              </span>
              <span className="tabular-nums font-semibold text-[#C5A059]">
                {activeSite.commencementYear || locActiveSite.chronology.split('(')[0].trim() || '1863'}
              </span>
              {locActiveSite.architect && (
                <>
                  <span aria-hidden="true" className="text-[#F4F1EA]/25">·</span>
                  <span className="text-[#E6E1D6]">{locActiveSite.architect.split('(')[0].trim()}</span>
                </>
              )}
              <span aria-hidden="true" className="text-[#F4F1EA]/25 hidden sm:inline">·</span>
              <span className="font-sans text-[12px] text-[#E6E1D6]/75 hidden sm:inline tabular-nums">
                {formatWGS84(activeSite.gps)}
              </span>
            </div>

            {/* VĂN BẢN DẪN NHẬP TẠP CHÍ (EDITORIAL DECK PROSE) */}
            <p className="hero-tier-3 text-sm sm:text-base text-[#E6E1D6] leading-relaxed max-w-2xl font-normal hidden sm:block hero-hide-short-height line-clamp-3">
              {locActiveSite.summary}
            </p>

            {/* Liên kết XEM CÂU CHUYỆN LỊCH SỬ & TƯ LIỆU màu Trắng Ngà / Vàng Đồng thanh lịch (#E6E1D6 & #C5A059) */}
            <div className="hero-tier-3 sm:hidden hero-show-short-height">
              <button
                type="button"
                onClick={() => setShowStoryModal(true)}
                className="text-[13px] font-medium text-[#E6E1D6] hover:text-[#C5A059] border-b border-[#C5A059]/60 pb-0.5 transition-colors cursor-pointer"
              >
                {t('showcase.viewHistoricalStory')} ↗
              </button>
            </div>

            {/* TIER 4 (320ms): CÁC NÚT HÀNH ĐỘNG CHUẨN EDITORIAL LUXURY + METALLIC SPECULAR SHIMMER */}
            <div className="hero-tier-4 pt-2 flex flex-wrap items-center gap-x-8 gap-y-4">
              {/* Nút chính KHÁM PHÁ TRÊN BẢN ĐỒ: Vàng Champagne / Đồng Cổ sang trọng kèm Specular Shimmer */}
              <button
                type="button"
                onClick={() => onNavigateToMap(activeSite)}
                className="apple-shimmer-btn px-7 py-3.5 text-[13px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 bg-[#C5A059] text-[#121110] hover:bg-[#d4b26f] border border-[#C5A059]"
              >
                {lang === 'en'
                  ? 'Explore on Map'
                  : lang === 'zh'
                  ? '在地图上探索'
                  : 'Khám phá trên bản đồ'}
              </button>

              {/* Các mục phụ trình bày dạng Editorial Text Links màu Trắng Ngà / Vàng Champagne */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
                {activeSite.has3D && (
                  <button
                    type="button"
                    onClick={() => onOpen3D(activeSite)}
                    className="text-[13px] font-medium text-[#F4F1EA] hover:text-[#C5A059] border-b border-[#F4F1EA]/35 hover:border-[#C5A059] pb-1 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'en' ? '3D Model' : lang === 'zh' ? '3D 模型' : 'Mô hình 3D'} ↗
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onOpenDetail(activeSite)}
                  className="text-[13px] font-medium text-[#F4F1EA] hover:text-[#C5A059] border-b border-[#F4F1EA]/35 hover:border-[#C5A059] pb-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {lang === 'en' ? 'Archival Dossier' : lang === 'zh' ? '文献档案' : 'Hồ sơ tư liệu'} ↗
                </button>

                <button
                  type="button"
                  onClick={() => onOpenARAudio(activeSite)}
                  className="text-[13px] font-medium text-[#E6E1D6]/85 hover:text-[#C5A059] border-b border-[#F4F1EA]/25 hover:border-[#C5A059] pb-1 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {lang === 'en' ? 'Audio Narration' : lang === 'zh' ? '语音导览' : 'Thuyết minh'} ↗
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. THANH MỤC LỤC TRIỂN LÃM DƯỚI ĐÁY (TẤT CẢ SỐ THỨ TỰ 01, 02, 03... DÙNG 1 MÀU VÀNG ĐỒNG #C5A059 THỐNG NHẤT) */}
        <div className="relative z-10 shrink-0 w-full border-t border-[#F4F1EA]/15 bg-[#121110]/95 backdrop-blur-md">
          <div
            ref={landmarkTabsContainerRef}
            className="w-full flex items-stretch divide-x divide-[#F4F1EA]/10 overflow-x-auto heritage-scrollbar scroll-smooth snap-x touch-pan-x pb-1"
          >
            {sites.map((s, idx) => {
              const isSelected = idx === featuredIndex;
              const locS = getLocalizedSite(s);
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    landmarkTabRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => handleSelectLandmarkPill(idx)}
                  className={`group relative px-5 sm:px-6 py-4 shrink-0 snap-start text-left transition-colors duration-200 cursor-pointer flex items-baseline gap-3 ${
                    isSelected
                      ? 'bg-[#1A1816] text-[#F4F1EA]'
                      : 'bg-transparent hover:bg-[#1A1816]/60 text-[#A39E93] hover:text-[#F4F1EA]'
                  }`}
                  title={locS.officialName}
                >
                  {/* Đường gạch ngang 2px Vàng Đồng #C5A059 thống nhất ở mép trên */}
                  <span
                    className={`absolute top-0 inset-x-0 bg-[#C5A059] transition-all ${
                      isSelected ? 'h-[2px] opacity-100' : 'h-[2px] opacity-0 group-hover:opacity-40'
                    }`}
                    aria-hidden="true"
                  />

                  {/* Số thứ tự (01, 02, 03...) đồng nhất 1 màu Vàng Đồng #C5A059 (mục đang chọn sáng rõ, các mục khác opacity-50) */}
                  <span
                    className={`font-serif italic text-base sm:text-lg tabular-nums shrink-0 text-[#C5A059] transition-opacity ${
                      isSelected ? 'opacity-100 font-semibold' : 'opacity-50 group-hover:opacity-90'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Tên di tích thanh lịch bên cạnh */}
                  <div className="flex flex-col min-w-0">
                    <span
                      className={`text-xs sm:text-[13px] whitespace-nowrap truncate max-w-[165px] sm:max-w-[200px] ${
                        isSelected ? 'text-[#F4F1EA] font-medium' : 'text-[#E6E1D6]/70 group-hover:text-[#F4F1EA]'
                      }`}
                    >
                      {locS.officialName.split(' - ')[0].split(' (')[0]}
                    </span>
                    <span className="text-[11px] text-[#A39E93]/80 mt-0.5 whitespace-nowrap">
                      {formatDistrictName(s.address.district)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          MODAL: CÂU CHUYỆN LỊCH SỬ & TƯ LIỆU (EDITORIAL ARCHIVAL SHEET)
         ========================================================================= */}
      {showStoryModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="relative w-full sm:max-w-xl max-h-[88vh] overflow-y-auto bg-[#1A1816] border border-[#F2EFE9]/15 rounded-sm shadow-2xl p-6 sm:p-8 text-left space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-[#F2EFE9]/12 pb-4">
              <div>
                <span className="text-[12px] font-medium text-[#C5A059] block tabular-nums">
                  {activeSite.identifierCode} · {activeSite.address.district}
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-[#F2EFE9] font-medium mt-1">
                  {parsedTitle.main}
                </h3>
                {parsedTitle.sub && (
                  <p className="font-serif text-base italic text-[#A39E93] mt-0.5">
                    {parsedTitle.sub}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowStoryModal(false)}
                className="text-xs font-medium text-[#A39E93] hover:text-[#F2EFE9] py-1 px-2 cursor-pointer"
                aria-label={t('common.close')}
              >
                ✕
              </button>
            </div>

            <div className="py-3 border-b border-[#F2EFE9]/12 space-y-1">
              <div className="text-[12px] font-medium text-[#C5A059]">
                {t('showcase.storyModalArchitecture')}
              </div>
              <div className="text-sm text-[#F2EFE9]">
                {locActiveSite.architecturalStyle}
              </div>
              <div className="text-xs text-[#A39E93]">
                {t('common.chronology')}: {locActiveSite.chronology}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[12px] font-medium text-[#C5A059]">
                {t('showcase.storyModalNarrative')}
              </div>
              <p className="text-sm text-[#F2EFE9]/90 leading-relaxed">
                {locActiveSite.summary}
              </p>
            </div>

            {locActiveSite.milestones && locActiveSite.milestones.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-[#F2EFE9]/12">
                <div className="text-[12px] font-medium text-[#C5A059]">
                  {t('showcase.storyModalMilestones')}
                </div>
                <div className="space-y-2">
                  {locActiveSite.milestones.slice(0, 3).map((m, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs text-[#A39E93]">
                      <span className="font-serif italic text-sm text-[#C5A059] shrink-0 tabular-nums">
                        {m.year}
                      </span>
                      <span className="leading-relaxed text-[#F2EFE9]/85">{m.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[#F2EFE9]/12 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => {
                  setShowStoryModal(false);
                  onNavigateToMap(activeSite);
                }}
                className="border border-[#C5A059] bg-[#C5A059] text-[#121110] px-6 py-3 text-[13px] font-semibold hover:bg-transparent hover:text-[#C5A059] transition-all cursor-pointer"
              >
                {t('showcase.storyModalViewOnMap')}
              </button>
              <button
                onClick={() => {
                  setShowStoryModal(false);
                  onOpenARAudio(activeSite);
                }}
                className="text-[13px] font-medium text-[#F2EFE9] hover:text-[#C5A059] border-b border-[#F2EFE9]/30 pb-1 cursor-pointer"
              >
                {t('showcase.storyModalListenAudio')} ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 2: BỘ SƯU TẬP CHUYÊN KHẢO & LƯU TRỮ DI SẢN (CURATED ARCHIVE COLLECTION)
         ========================================================================= */}
      <section
        ref={discoveryRef}
        id="discovery-hub"
        className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-20 sm:py-24 pb-28 space-y-12"
      >
        {/* Editorial Section Heading */}
        <div className="border-b border-[#F2EFE9]/12 pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3">
            <span className="text-[13px] font-medium text-[#C5A059] block">
              {t('showcase.badge')}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-medium text-[#F2EFE9] tracking-tight">
              {t('showcase.heroTitle')}
            </h2>
          </div>
          <p className="text-sm sm:text-base text-[#A39E93] max-w-xl leading-relaxed">
            {t('showcase.heroDesc')}
          </p>
        </div>

        {/* =========================================================================
            1. THANH TRA CỨU & LỌC HỒ SƠ (EDITORIAL ARCHIVE FILTER BAR WITH 3D FLIP TEXT)
           ========================================================================= */}
        <div className="w-full bg-[#1A1816]/90 backdrop-blur-md border border-[#F2EFE9]/12 p-5 sm:p-6 space-y-5">
          {/* Hàng 1: Ô tìm kiếm + Chọn khu vực + Số lượng hồ sơ */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full">
            <div className="relative flex-1 min-w-0 border-b border-[#F2EFE9]/20 focus-within:border-[#C5A059] transition-colors">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('showcase.searchPlaceholder')}
                className="w-full pr-8 py-2.5 bg-transparent text-sm text-[#F2EFE9] placeholder-[#A39E93]/60 focus:outline-none"
                aria-label={t('showcase.searchPlaceholder')}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-[#A39E93] hover:text-[#F2EFE9] text-xs p-1 cursor-pointer"
                  aria-label={t('common.clear')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="relative shrink-0 w-full md:w-auto md:min-w-[235px]">
              <HeritageOptionSearchSelect
                value={filterDistrict}
                defaultValue="all"
                onChange={setFilterDistrict}
                ariaLabel={t('showcase.filterDistrictLabel')}
                options={[
                  {
                    value: 'all',
                    label:
                      lang === 'vi'
                        ? 'Khu vực: Tất cả quận / tỉnh'
                        : lang === 'zh'
                        ? '区域：全部地区'
                        : 'Area: All Districts',
                  },
                  ...uniqueDistricts.map((d) => ({
                    value: d,
                    label: formatDistrictName(d),
                  })),
                ]}
              />
            </div>

            <div className="shrink-0 text-[13px] font-medium text-[#A39E93] tabular-nums whitespace-nowrap pt-1 md:pt-0">
              {lang === 'vi'
                ? `Hồ sơ ${discoveryFilteredSites.length} / ${sites.length}`
                : lang === 'zh'
                ? `档案 ${discoveryFilteredSites.length} / ${sites.length}`
                : `Records ${discoveryFilteredSites.length} / ${sites.length}`}
            </div>
          </div>

          {/* Hàng 2: Bộ lọc chữ thuần túy có gạch chân mảnh & hiệu ứng 3D Flip Text */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#F2EFE9]/10 text-xs">
            <div className="flex flex-wrap items-center gap-6">
              {/* Loại hình */}
              <div className="flex items-center gap-4 overflow-x-auto flex-nowrap heritage-scrollbar pb-1.5 touch-pan-x">
                <span className="text-[#A39E93] text-[12px] font-medium shrink-0">
                  {lang === 'vi' ? 'Phân loại:' : lang === 'zh' ? '类别:' : 'Category:'}
                </span>
                {[
                  { key: 'all', label: lang === 'vi' ? 'Tất cả' : lang === 'zh' ? '全部' : 'All' },
                  { key: 'Architecture', label: t('types.Architecture') },
                  { key: 'History', label: t('types.History') },
                  { key: 'Archaeology', label: t('types.Archaeology') },
                ].map((item) => {
                  const isActive = filterType === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFilterType(item.key)}
                      className={`group text-[13px] pb-1 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                        isActive
                          ? 'text-[#C5A059] font-semibold border-b border-[#C5A059]'
                          : 'text-[#A39E93] hover:text-[#F2EFE9] border-b border-transparent'
                      }`}
                    >
                      <Flip3DText text={item.label} />
                    </button>
                  );
                })}
              </div>

              <span className="h-3.5 w-px bg-[#F2EFE9]/12 hidden lg:inline-block" />

              {/* Xếp hạng */}
              <div className="flex items-center gap-4 overflow-x-auto flex-nowrap heritage-scrollbar pb-1.5 touch-pan-x">
                <span className="text-[#A39E93] text-[12px] font-medium shrink-0">
                  {lang === 'vi' ? 'Cấp độ:' : lang === 'zh' ? '级别:' : 'Rank:'}
                </span>
                {[
                  { key: 'all', label: lang === 'vi' ? 'Tất cả' : lang === 'zh' ? '全部' : 'All' },
                  { key: 'Special National', label: lang === 'vi' ? 'QG Đặc Biệt' : lang === 'zh' ? '国家级特殊' : 'Special National' },
                  { key: 'National', label: lang === 'vi' ? 'Quốc Gia' : lang === 'zh' ? '国家级' : 'National' },
                  { key: 'City Level', label: lang === 'vi' ? 'Cấp TP' : lang === 'zh' ? '市级' : 'Municipal' },
                ].map((r) => {
                  const isActive = filterRanking === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setFilterRanking(r.key)}
                      className={`group text-[13px] pb-1 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                        isActive
                          ? 'text-[#C5A059] font-semibold border-b border-[#C5A059]'
                          : 'text-[#A39E93] hover:text-[#F2EFE9] border-b border-transparent'
                      }`}
                    >
                      <Flip3DText text={r.label} />
                    </button>
                  );
                })}
              </div>
            </div>

            {(searchQuery || filterType !== 'all' || filterRanking !== 'all' || filterDistrict !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setFilterRanking('all');
                  setFilterDistrict('all');
                }}
                className="group text-[13px] font-medium text-[#C5A059] hover:text-[#F2EFE9] border-b border-[#C5A059]/50 pb-0.5 cursor-pointer"
              >
                <Flip3DText text={lang === 'vi' ? 'Đặt lại' : lang === 'zh' ? '重置' : 'Reset'} />
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. LƯỚI TRIỂN LÃM HỒ SƠ DI SẢN (MULTI-PLANE 3D POP-OUT CARDS)
           ========================================================================= */}
        {discoveryFilteredSites.length > 0 ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            style={{ perspective: '1200px' }}
          >
            {discoveryFilteredSites.map((site, idx) => {
              const locSite = getLocalizedSite(site);
              const meta = getIndochineCategoryMeta(site, lang);
              const buildYear =
                site.commencementYear ||
                locSite.chronology.match(/\d{4}/)?.[0] ||
                locSite.chronology.split('(')[0].trim();
              const tilt = cardTiltMap[site.id];
              const isCardHovered = Boolean(tilt?.active);

              return (
                <article
                  key={`${site.id}-${filterType}-${filterRanking}-${filterDistrict}`}
                  onClick={() => onOpenDetail(site)}
                  onMouseMove={(e) => handleCardMouseMove(site.id, e)}
                  onMouseLeave={() => handleCardMouseLeave(site.id)}
                  className="animate-3d-cascade-card group relative bg-[#161412] border border-[#F2EFE9]/15 hover:border-[#C5A059]/65 flex flex-col justify-between cursor-pointer rounded-none shadow-[0_18px_42px_rgba(0,0,0,0.75)]"
                  style={{
                    animationDelay: `${(idx % 9) * 55}ms`,
                    borderTop: `3px solid ${meta.accentHex}`,
                    transformStyle: 'preserve-3d',
                    transform: isCardHovered
                      ? `perspective(1200px) rotateX(${tilt.rotateX.toFixed(2)}deg) rotateY(${tilt.rotateY.toFixed(2)}deg) translate3d(0, -4px, 0)`
                      : 'perspective(1200px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)',
                    transition: isCardHovered
                      ? 'transform 0.14s ease-out, border-color 0.3s ease, box-shadow 0.3s ease'
                      : 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease',
                    willChange: 'transform',
                  }}
                >
                  {/* LAYER 0 (translateZ 0px): Dynamic 3D Specular Champagne Gold Spotlight Following Mouse */}
                  <div
                    className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
                    style={{
                      transform: 'translateZ(0px)',
                      opacity: isCardHovered ? 1 : 0,
                      background: tilt
                        ? `radial-gradient(460px circle at ${tilt.spotX}px ${tilt.spotY}px, rgba(197, 160, 89, 0.18), transparent 72%)`
                        : 'none',
                    }}
                  />

                  <div
                    className="flex-1 flex flex-col relative z-10"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* LAYER 1 (translateZ 35px): Số thứ tự NO. 01 + Mã số hồ sơ + Nhãn Phân Loại */}
                    <div
                      className="px-5 py-3 border-b border-[#F2EFE9]/12 flex items-center justify-between gap-2 bg-[#141210]/90 transition-transform duration-300 ease-out"
                      style={{
                        transform: isCardHovered ? 'translateZ(35px)' : 'translateZ(0px)',
                      }}
                    >
                      <div className="flex items-baseline gap-2.5">
                        <span
                          className="font-serif italic text-lg font-semibold tabular-nums"
                          style={{ color: meta.accentHex }}
                        >
                          NO. {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="font-sans text-[12px] font-medium text-[#A39E93] tabular-nums">
                          {site.identifierCode}
                        </span>
                      </div>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 border"
                        style={{
                          color: meta.accentHex,
                          borderColor: meta.borderRgba,
                          backgroundColor: meta.softBgRgba,
                        }}
                      >
                        {formatDistrictName(site.address.district)}
                      </span>
                    </div>

                    {/* LAYER 2 (translateZ 20px): Khung ảnh thật hoặc Bản khắc Typographic Plate */}
                    <div
                      className="relative aspect-video bg-[#171817] overflow-hidden border-b border-[#F2EFE9]/10 transition-transform duration-300 ease-out"
                      style={{
                        transform: isCardHovered ? 'translateZ(20px)' : 'translateZ(0px)',
                      }}
                    >
                      {site.photos?.[0] && !failedPhotoMap[site.id] ? (
                        <>
                          <HeritageSmoothImage
                            src={site.photos[0]}
                            alt={locSite.officialName}
                            waitTone="dark"
                            onError={() =>
                              setFailedPhotoMap((prev) => ({ ...prev, [site.id]: true }))
                            }
                            className="w-full h-full object-cover transition-all duration-500 ease-out filter brightness-[0.98] contrast-[1.12] saturate-[1.06]"
                            style={{
                              transform: isCardHovered
                                ? `translate3d(${(tilt.pctX * -8).toFixed(1)}px, ${(tilt.pctY * -8).toFixed(1)}px, 0) scale(1.06)`
                                : 'translate3d(0, 0, 0) scale(1)',
                            }}
                          />

                          {/* Seamless Image Vignette hòa quyện bức ảnh vào thân thẻ đen #161412 */}
                          <div
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#161412] via-[#161412]/30 to-transparent"
                            aria-hidden="true"
                          />
                        </>
                      ) : (
                        <HeritageTypographicPlate site={site} index={idx} variant="catalog" />
                      )}

                      {/* Nút Đổi ảnh thật ẩn mặc định (opacity-0 group-hover:opacity-100) */}
                      {onOpenPhotoManager && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPhotoManager(site);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute top-2.5 right-2.5 z-20 inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141311]/90 hover:bg-[#C5A059] text-[#F4F1EA] hover:text-[#141311] border border-[#C5A059]/45 font-sans text-[11px] font-medium cursor-pointer rounded-none shadow-md"
                          title={
                            lang === 'en'
                              ? 'Update real monument photograph'
                              : 'Cập nhật ảnh chụp thực tế cho di tích này'
                          }
                        >
                          <Camera className="w-3 h-3 shrink-0" />
                          <span>
                            {lang === 'en'
                              ? 'Real Photo'
                              : lang === 'zh'
                              ? '更换实景图'
                              : 'Đổi ảnh thật'}
                          </span>
                        </button>
                      )}
                    </div>

                    {/* LAYER 3 & 4: Nội dung tạp chí + Biểu tượng Khung dây 3D xoay + Tiêu đề di tích nổi 3D (translateZ 50px) */}
                    <div
                      className="p-6 space-y-4 flex-1 flex flex-col justify-between bg-[#161412]"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div className="space-y-3" style={{ transformStyle: 'preserve-3d' }}>
                        {/* Hàng Nhãn Phân Loại (translateZ 35px) + Biểu tượng Khung dây 3D Xoay (Rotating 3D Wireframe Emblem) */}
                        <div
                          className="flex items-center justify-between gap-3 transition-transform duration-300 ease-out"
                          style={{
                            transform: isCardHovered ? 'translateZ(35px)' : 'translateZ(0px)',
                          }}
                        >
                          <span
                            className="text-[12px] font-semibold"
                            style={{ color: meta.accentHex }}
                          >
                            {meta.badgeLabel}
                          </span>

                          <Wireframe3DEmblem
                            accentHex={meta.accentHex}
                            variant={idx % 2 === 0 ? 'astrolabe' : 'octahedron'}
                          />
                        </div>

                        {/* LAYER 4 (translateZ 50px): Tiêu đề công trình Serif nổi hẳn lên không trung kèm bóng đổ sâu */}
                        <h3
                          className="font-serif text-2xl font-medium text-[#F2EFE9] group-hover:text-[#E6B35A] transition-all duration-300 ease-out leading-snug line-clamp-2"
                          style={{
                            transform: isCardHovered ? 'translateZ(50px)' : 'translateZ(0px)',
                            filter: isCardHovered
                              ? 'drop-shadow(0 15px 15px rgba(0,0,0,0.7))'
                              : 'none',
                          }}
                        >
                          {locSite.officialName}
                        </h3>
                      </div>

                      <div className="space-y-3.5 pt-1">
                        {/* Bảng thông số 2 cột trình bày thoáng đãng, KHÔNG cắt cụt tên Kiến trúc sư */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-2.5 sm:gap-x-3 border-y border-[#F2EFE9]/12 py-3 text-left">
                          <div className="sm:col-span-8 sm:pr-3 sm:border-r sm:border-[#F2EFE9]/12 min-w-0">
                            <span className="block text-[11px] font-medium text-[#A39E93]">
                              {lang === 'en'
                                ? 'Architect / Style'
                                : lang === 'zh'
                                ? '建筑师 / 风格'
                                : 'Kiến trúc sư / Phong cách'}
                            </span>
                            <span className="block text-xs text-[#F2EFE9] font-medium leading-snug break-words mt-1">
                              {locSite.architect
                                ? `${locSite.architect.split('(')[0].trim()} · ${locSite.architecturalStyle}`
                                : locSite.architecturalStyle}
                            </span>
                          </div>
                          <div className="sm:col-span-4 sm:pl-1 min-w-0 flex flex-col justify-center">
                            <span className="block text-[11px] font-medium text-[#A39E93]">
                              {lang === 'en' ? 'Chronology' : lang === 'zh' ? '建造年代' : 'Niên đại'}
                            </span>
                            <span
                              className="block text-xs font-semibold tabular-nums leading-snug mt-1"
                              style={{ color: meta.accentHex }}
                            >
                              {buildYear}
                            </span>
                          </div>
                        </div>

                        {/* Tóm tắt */}
                        <p className="text-xs sm:text-[13px] text-[#A39E93] line-clamp-2 leading-relaxed">
                          {locSite.summary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chân trang hồ sơ: Thanh tác vụ phẳng */}
                  <div
                    className="px-6 py-3.5 border-t border-[#F2EFE9]/15 bg-[#141210]/90 flex items-center justify-between gap-3 text-[12px] font-medium transition-transform duration-300 ease-out"
                    style={{
                      transform: isCardHovered ? 'translateZ(25px)' : 'translateZ(0px)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDetail(site);
                      }}
                      className="group/btn text-[#F2EFE9] hover:text-[#E6B35A] font-semibold transition-colors cursor-pointer"
                    >
                      <Flip3DText
                        text={
                          lang === 'vi'
                            ? 'Xem hồ sơ toàn văn ↗'
                            : lang === 'zh'
                            ? '查看完整档案 ↗'
                            : 'Full Dossier ↗'
                        }
                      />
                    </button>

                    <div className="flex items-center gap-3 shrink-0">
                      {site.has3D && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpen3D(site);
                          }}
                          className="font-semibold hover:underline cursor-pointer"
                          style={{ color: meta.accentHex }}
                        >
                          {lang === 'vi' ? 'Không gian 3D ↗' : '3D ↗'}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-[#1A1816] border border-[#F2EFE9]/12 space-y-4">
            <p className="font-serif text-xl text-[#F2EFE9]">
              {t('showcase.noResultsTitle')}
            </p>
            <p className="text-[#A39E93] text-xs">
              {t('showcase.noResultsDesc')}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterType('all');
                setFilterRanking('all');
                setFilterDistrict('all');
              }}
              className="border border-[#C5A059] text-[#C5A059] hover:bg-[#C5A059] hover:text-[#121110] px-6 py-2.5 text-[13px] font-medium transition-colors cursor-pointer mt-2"
            >
              {t('showcase.resetFilters')}
            </button>
          </div>
        )}

        {/* Section Bottom Editorial Footer */}
        <div className="pt-10 border-t border-[#F2EFE9]/12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-xs text-[#A39E93]">
            {t('showcase.systemNotice')}
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => onNavigateToMap(activeSite)}
              className="border border-[#C5A059] bg-[#C5A059] text-[#121110] px-6 py-3 text-[13px] font-semibold hover:bg-transparent hover:text-[#C5A059] transition-all cursor-pointer"
            >
              {t('showcase.exploreFullGISMap')}
            </button>

            {onNavigateToCatalog && (
              <button
                onClick={onNavigateToCatalog}
                className="text-[13px] font-medium text-[#F2EFE9] hover:text-[#C5A059] border-b border-[#F2EFE9]/30 hover:border-[#C5A059] pb-1 transition-colors cursor-pointer"
              >
                {t('showcase.viewAllCatalog')} ↗
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

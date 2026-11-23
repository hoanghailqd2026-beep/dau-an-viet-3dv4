import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TourRoute, HeritageSite } from '../../types/heritage';
import { TOUR_ROUTES } from '../../data/tours';
import {
  formatWGS84,
  calculateSegmentDistanceKm,
  calculateTourDistanceKm,
} from '../../utils/coordinateConversion';
import { useI18n } from '../../i18n/I18nContext';
import { getTourRouteIndochineColor } from '../../utils/indochinePalette';
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  Share2,
  Bookmark,
  Check,
  ChevronUp,
  ChevronDown,
  Footprints,
  Bike,
  Car,
} from 'lucide-react';

interface TourRoutePanelProps {
  activeTour: TourRoute | null;
  onSelectTour: (tour: TourRoute | null) => void;
  allSites: HeritageSite[];
  selectedSite?: HeritageSite | null;
  onFocusSite: (site: HeritageSite) => void;
  onOpen3D?: (site: HeritageSite) => void;
  onOpenARAudio?: (site: HeritageSite) => void;
  onOpenDetailModal?: (site: HeritageSite) => void;
  onOpenVideo?: (site: HeritageSite) => void;
  completedRouteIds?: string[];
  onCompleteTour?: (tour: TourRoute) => void;
  hiddenSiteIds?: string[];
}

type TransportMode = 'walk' | 'motorbike' | 'car';

interface TourRouteCardProps {
  tour: TourRoute;
  index: number;
  visibleStopCount: number;
  distanceKm: number;
  isSelected: boolean;
  isCompleted?: boolean;
  cleanTitle: string;
  regionLabel: string;
  stopNames: string[];
  lang: string;
  stopsLabel: string;
  onSelect: (tour: TourRoute) => void;
}

const TourRouteCard: React.FC<TourRouteCardProps> = React.memo(({
  tour,
  index,
  visibleStopCount,
  distanceKm,
  isSelected,
  isCompleted = false,
  cleanTitle,
  regionLabel,
  stopNames,
  lang,
  stopsLabel,
  onSelect,
}) => {
  const routeColor = getTourRouteIndochineColor(tour);
  const routeNumLabel =
    lang === 'en'
      ? `Route ${String(index + 1).padStart(2, '0')}`
      : lang === 'zh'
      ? `路线 ${String(index + 1).padStart(2, '0')}`
      : `Tuyến ${String(index + 1).padStart(2, '0')}`;
  const startLabel = isSelected
    ? lang === 'en'
      ? 'Viewing Route'
      : lang === 'zh'
      ? '正在查看'
      : 'Đang xem tuyến'
    : lang === 'en'
    ? 'Start Route'
    : lang === 'zh'
    ? '开始路线'
    : 'Bắt đầu tuyến';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(tour)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(tour);
        }
      }}
      style={
        isSelected
          ? { backgroundColor: routeColor.primaryHex, color: routeColor.fgHex, borderColor: '#171817' }
          : { borderLeftColor: routeColor.primaryHex, borderLeftWidth: '4px' }
      }
      className={`w-full text-left px-3.5 py-3 rounded-2xl border transition-all cursor-pointer space-y-2 ${
        isSelected
          ? 'shadow-sm'
          : 'bg-[#EDE4D0] border-[#171817]/15 hover:bg-[#D8C9A9]/85 text-[#171817]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded-full font-sans text-[10px] font-bold tabular-nums border ${
                isSelected
                  ? 'bg-[#171817] text-[#D8C9A9] border-[#171817]'
                  : 'bg-[#F4EFE4] text-[#171817] border-[#171817]/20'
              }`}
            >
              {routeNumLabel}
            </span>
            {regionLabel && (
              <span
                className="text-[10.5px] font-medium truncate opacity-85"
                style={{ color: isSelected ? routeColor.fgHex : '#171817' }}
              >
                {regionLabel}
              </span>
            )}
          </div>
          <div
            className="mt-1 text-[13.5px] font-serif font-semibold leading-snug"
            style={{ color: isSelected ? routeColor.fgHex : '#171817' }}
          >
            {cleanTitle}
          </div>
        </div>

        {isCompleted && (
          <span className="px-1.5 py-0.5 rounded-full bg-[#47796D] border border-[#171817]/25 text-[10px] font-sans font-semibold text-[#D8C9A9] shrink-0 whitespace-nowrap">
            {lang === 'zh' ? '已完成' : lang === 'en' ? 'Done' : 'Đã xong'}
          </span>
        )}
      </div>

      {/* Ordered monument list belonging to this route */}
      <ol
        className="space-y-0.5 text-[11px] leading-snug"
        style={{ color: isSelected ? routeColor.fgHex : '#171817' }}
      >
        {stopNames.map((name, sIdx) => (
          <li key={`${tour.id}-stop-${sIdx}`} className="flex items-baseline gap-1.5 opacity-90">
            <span className="font-sans font-bold text-[10px] tabular-nums shrink-0 opacity-80">
              {sIdx + 1}.
            </span>
            <span className="truncate">{name}</span>
          </li>
        ))}
      </ol>

      <div className="pt-1.5 border-t border-current/15 flex items-center justify-between gap-2">
        <div
          className="flex items-center gap-1.5 text-[10.5px] font-sans tabular-nums opacity-80"
          style={{ color: isSelected ? routeColor.fgHex : '#171817' }}
        >
          <span className="font-semibold">
            {visibleStopCount}{' '}
            {visibleStopCount === 1
              ? lang === 'zh'
                ? '处目的地'
                : lang === 'en'
                ? 'destination'
                : 'điểm đến'
              : stopsLabel}
          </span>
          {visibleStopCount >= 2 && distanceKm > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>~{distanceKm} km</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(tour);
          }}
          className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-colors cursor-pointer shrink-0 ${
            isSelected
              ? 'bg-[#171817] text-[#C9A46A]'
              : 'bg-[#171817] hover:bg-[#A94F3D] text-[#D8C9A9]'
          }`}
        >
          {startLabel}
        </button>
      </div>
    </div>
  );
});

interface TourStopCardProps {
  site: HeritageSite;
  idx: number;
  isCurrentStop: boolean;
  isHiddenForVisitors?: boolean;
  officialName: string;
  districtLabel: string;
  lang: string;
  hasNext: boolean;
  segDist: number;
  segMins: number;
  minutesLabel: string;
  onSelectStop: (site: HeritageSite, idx: number) => void;
  onOpenDetailModal?: (site: HeritageSite) => void;
  onOpen3D?: (site: HeritageSite) => void;
  onOpenARAudio?: (site: HeritageSite) => void;
  onOpenVideo?: (site: HeritageSite) => void;
}

const TourStopCard: React.FC<TourStopCardProps> = React.memo(({
  site,
  idx,
  isCurrentStop,
  isHiddenForVisitors = false,
  officialName,
  districtLabel,
  lang,
  hasNext,
  segDist,
  segMins,
  minutesLabel,
  onSelectStop,
  onOpenDetailModal,
  onOpen3D,
  onOpenARAudio,
  onOpenVideo,
}) => (
  <div className="relative">
    <button
      type="button"
      onClick={() => onSelectStop(site, idx)}
      aria-label={`Trạm ${idx + 1}: ${officialName}`}
      className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center font-sans text-[11px] font-bold transition-all cursor-pointer tabular-nums ${
        isCurrentStop
          ? 'bg-[#A94F3D] text-[#D8C9A9] ring-4 ring-[#A94F3D]/20'
          : 'bg-[#EDE4D0] text-[#171817] border border-[#171817]/30 hover:bg-[#C9A46A]'
      }`}
    >
      {idx + 1}
    </button>

    <div
      onClick={() => onSelectStop(site, idx)}
      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
        isCurrentStop
          ? 'bg-[#EDE4D0] border-[#A94F3D] shadow-sm'
          : 'bg-[#F4EFE4] border-[#171817]/15 hover:bg-[#EDE4D0]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-sans">
        <span className="text-[#A94F3D] font-bold tabular-nums">
          {lang === 'zh'
            ? `第 ${String(idx + 1).padStart(2, '0')} 站`
            : lang === 'en'
            ? `Stop ${String(idx + 1).padStart(2, '0')}`
            : `Trạm ${String(idx + 1).padStart(2, '0')}`}
        </span>
        <span className="text-[#171817]/65 truncate tabular-nums">{districtLabel}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="text-sm font-semibold text-[#171817] leading-snug">
          {officialName}
        </div>
        {isHiddenForVisitors && (
          <span className="px-2 py-0.5 rounded-full bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[9px] font-semibold shrink-0">
            {lang === 'en'
              ? 'Tester Preview · Hidden'
              : lang === 'zh'
              ? '隐藏草稿 · 测试模式'
              : 'Đang ẩn · Chế độ Tester'}
          </span>
        )}
      </div>

      <div className="text-[11px] text-[#171817]/65 truncate mt-0.5 tabular-nums">
        {site.address.street} · {formatWGS84(site.gps)}
      </div>

      {isCurrentStop && (
        <div
          className="mt-2.5 pt-2 border-t border-[#171817]/15 flex items-center justify-between gap-2 text-[11px] font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {onOpenDetailModal && (
            <button
              type="button"
              onClick={() => onOpenDetailModal(site)}
              className="text-[#A94F3D] font-semibold hover:underline cursor-pointer"
            >
              {lang === 'vi' ? 'Hồ sơ ↗' : lang === 'zh' ? '档案 ↗' : 'Dossier ↗'}
            </button>
          )}
          <div className="flex items-center gap-1.5">
            {site.has3D && onOpen3D && (
              <button
                type="button"
                onClick={() => onOpen3D(site)}
                className="px-2.5 py-1 rounded-full bg-[#A94F3D] hover:bg-[#934232] text-[#D8C9A9] font-semibold cursor-pointer transition-colors"
              >
                {lang === 'vi' ? 'Mở 3D ↗' : '3D ↗'}
              </button>
            )}
            {onOpenARAudio && (
              <button
                type="button"
                onClick={() => onOpenARAudio(site)}
                className="px-2.5 py-1 rounded-full bg-[#47796D] hover:bg-[#3B665B] text-[#171817] font-semibold cursor-pointer transition-colors"
              >
                {lang === 'vi' ? 'Thuyết minh' : lang === 'zh' ? '语音' : 'Audio'}
              </button>
            )}
            {onOpenVideo && (
              <button
                type="button"
                onClick={() => onOpenVideo(site)}
                className="px-2.5 py-1 rounded-full bg-[#C9A46A] hover:bg-[#b89256] text-[#171817] border border-[#171817]/20 font-semibold cursor-pointer transition-colors"
              >
                Video
              </button>
            )}
          </div>
        </div>
      )}
    </div>

    {hasNext && (
      <div className="mt-2 text-[11px] font-sans text-[#171817]/65 tabular-nums">
        ↓ {segDist} km · ~{segMins} {minutesLabel}
      </div>
    )}
  </div>
));

export const TourRoutePanel: React.FC<TourRoutePanelProps> = React.memo(({
  activeTour,
  onSelectTour,
  allSites,
  selectedSite,
  onFocusSite,
  onOpen3D,
  onOpenARAudio,
  onOpenDetailModal,
  onOpenVideo,
  completedRouteIds = [],
  onCompleteTour,
  hiddenSiteIds = [],
}) => {
  const { lang, t, getLocalizedSite, getLocalizedTour, formatDistrictName } = useI18n();
  const [activeStopIndex, setActiveStopIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [transportMode, setTransportMode] = useState<TransportMode>('motorbike');
  const [savedTourIds, setSavedTourIds] = useState<string[]>(['TOUR-01']);
  const [visitedStopIdsByTour, setVisitedStopIdsByTour] = useState<Record<string, string[]>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [mobileSheetExpanded, setMobileSheetExpanded] = useState<boolean>(true);
  const autoPlayTimerRef = useRef<number | null>(null);

  const currentTour = activeTour || TOUR_ROUTES[0];
  const currentTourSites = useMemo(
    () =>
      currentTour.sites
        .map((id: string) => allSites.find((s) => s.id === id))
        .filter((s): s is HeritageSite => Boolean(s)),
    [currentTour.sites, allSites]
  );

  const handleTourCardSelect = useCallback(
    (tour: TourRoute) => {
      setIsAutoPlaying(false);
      onSelectTour(tour);
    },
    [onSelectTour]
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  useEffect(() => {
    if (!activeTour) {
      onSelectTour(TOUR_ROUTES[0]);
      return;
    }
    const tourSites = activeTour.sites
      .map((id: string) => allSites.find((s) => s.id === id))
      .filter((s): s is HeritageSite => Boolean(s));
    if (tourSites.length > 0) {
      setActiveStopIndex(0);
    }
  }, [activeTour?.id]);

  useEffect(() => {
    if (!currentTour || !selectedSite) return;
    const idx = currentTour.sites.findIndex((id: string) => id === selectedSite.id);
    if (idx !== -1 && idx !== activeStopIndex) {
      setActiveStopIndex(idx);
    }
  }, [selectedSite?.id, currentTour?.id]);

  useEffect(() => {
    if (!isAutoPlaying || currentTourSites.length === 0) {
      if (autoPlayTimerRef.current) {
        window.clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
      return;
    }

    autoPlayTimerRef.current = window.setInterval(() => {
      setActiveStopIndex((prev) => {
        const nextIdx = (prev + 1) % currentTourSites.length;
        onFocusSite(currentTourSites[nextIdx]);
        return nextIdx;
      });
    }, 4500);

    return () => {
      if (autoPlayTimerRef.current) {
        window.clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    };
  }, [isAutoPlaying, currentTourSites, onFocusSite]);

  const recordStopVisit = useCallback(
    (tour: TourRoute, stopSite: HeritageSite | undefined, stopIdx: number, totalStops: number) => {
      if (!stopSite) return;
      setVisitedStopIdsByTour((prev) => {
        const currentStops = prev[tour.id] || [];
        const updatedStops = currentStops.includes(stopSite.id)
          ? currentStops
          : [...currentStops, stopSite.id];
        const minRequired = Math.min(2, totalStops);
        if (
          stopIdx === totalStops - 1 &&
          updatedStops.length >= minRequired &&
          !completedRouteIds.includes(tour.id)
        ) {
          onCompleteTour?.(tour);
        }
        return { ...prev, [tour.id]: updatedStops };
      });
    },
    [completedRouteIds, onCompleteTour]
  );

  const handleSelectStop = useCallback(
    (site: HeritageSite, idx: number) => {
      setIsAutoPlaying(false);
      setActiveStopIndex(idx);
      onFocusSite(site);
      recordStopVisit(currentTour, site, idx, currentTourSites.length);
    },
    [onFocusSite, recordStopVisit, currentTour, currentTourSites.length]
  );

  const handleStepStop = (delta: number) => {
    if (currentTourSites.length === 0) return;
    setIsAutoPlaying(false);
    const nextIdx =
      (activeStopIndex + delta + currentTourSites.length) % currentTourSites.length;
    setActiveStopIndex(nextIdx);
    const targetSite = currentTourSites[nextIdx];
    onFocusSite(targetSite);
    recordStopVisit(currentTour, targetSite, nextIdx, currentTourSites.length);
  };

  const handleToggleSaveTour = (
    e: React.MouseEvent,
    tourId: string,
    tourName: string
  ) => {
    e.stopPropagation();
    setSavedTourIds((prev) => {
      const exists = prev.includes(tourId);
      if (exists) {
        showToast(`${t('tours.removedToast')} "${tourName}"`);
        return prev.filter((id) => id !== tourId);
      }
      showToast(`${t('tours.savedToast')} "${tourName}"`);
      return [...prev, tourId];
    });
  };

  const handleShareTour = async (e: React.MouseEvent, tour: TourRoute) => {
    e.stopPropagation();
    const locTour = getLocalizedTour(tour);
    const computedKm = calculateTourDistanceKm(tour, allSites);
    const shareText = `${locTour.title} (${tour.sites.length} ${t('tours.stopsCount')}, ~${computedKm} km)`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
        showToast(t('tours.copiedToast'));
      }
    } catch {
      showToast(t('tours.sharedToast'));
    }
  };

  const getSegmentMinutes = (distKm: number, mode: TransportMode) => {
    const speedKmh = mode === 'walk' ? 4.8 : mode === 'motorbike' ? 22 : 18;
    return Math.max(3, Math.round((distKm / speedKmh) * 60));
  };

  const activeRouteColor = getTourRouteIndochineColor(currentTour);
  const locCurrentTour = getLocalizedTour(currentTour);
  const isCurrentSaved = savedTourIds.includes(currentTour.id);
  const currentTourDistanceKm = useMemo(
    () => calculateTourDistanceKm(currentTour, allSites),
    [currentTour, allSites]
  );

  return (
    <aside
      aria-label="Bảng điều khiển Tuyến di sản"
      className="w-full h-full bg-[#F4EFE4] flex flex-col z-20 select-none overflow-hidden text-[#171817] border-r border-[#171817]/15"
    >
      {/* 1. HEADER */}
      <div className="px-4 pt-3.5 pb-2.5 border-b border-[#171817]/12 bg-[#EDE4D0] shrink-0 flex items-center justify-between gap-2">
        <div>
          <span className="block text-[11px] text-[#A94F3D] font-semibold">
            {lang === 'vi'
              ? 'Hành trình Di sản Đông Nam Bộ'
              : lang === 'zh'
              ? '越南东南部遗产路线'
              : 'Southeast Vietnam Heritage Routes'}
          </span>
          <h2 className="text-base sm:text-lg font-serif font-semibold text-[#171817] tracking-tight mt-0.5">
            {lang === 'vi'
              ? `${TOUR_ROUTES.length} Tuyến Di sản`
              : lang === 'zh'
              ? `${TOUR_ROUTES.length}条遗产路线`
              : `${TOUR_ROUTES.length} Heritage Routes`}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setMobileSheetExpanded((p) => !p)}
          className="lg:hidden px-3 py-1 rounded-full bg-[#D8C9A9] border border-[#171817]/20 text-[10px] font-medium text-[#171817] flex items-center gap-1 cursor-pointer"
        >
          <span>
            {mobileSheetExpanded
              ? lang === 'vi'
                ? 'Thu gọn'
                : lang === 'zh'
                ? '收起路线'
                : 'Collapse'
              : lang === 'vi'
              ? 'Mở lộ trình'
              : lang === 'zh'
              ? '展开路线'
              : 'Expand'}
          </span>
          {mobileSheetExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {toastMessage && (
        <div className="mx-4 mt-2 px-3 py-1.5 rounded-full bg-[#EDE4D0] border border-[#A94F3D] text-[10.5px] text-[#171817] font-medium flex items-center gap-2 shrink-0">
          <Check className="w-3.5 h-3.5 text-[#A94F3D] shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* 2. SCROLLABLE SINGLE-COLUMN ROUTES + VERTICAL TIMELINE */}
      <div
        className={`${
          mobileSheetExpanded ? 'flex' : 'hidden lg:flex'
        } flex-1 flex-col min-h-0 max-lg:max-h-[44vh] overflow-y-auto modal-scrollbar`}
      >
        {/* A. 1-COLUMN SPACIOUS ROUTE LIST (NO TRUNCATION) */}
        <div className="p-3.5 space-y-2.5 border-b border-[#171817]/12 bg-[#F4EFE4]">
          {TOUR_ROUTES.map((tour, idx) => {
            const visibleStops = tour.sites
              .map((id) => allSites.find((s) => s.id === id))
              .filter((s): s is HeritageSite => Boolean(s));
            if (visibleStops.length === 0) return null;
            const isSelected = currentTour.id === tour.id;
            const locTour = getLocalizedTour(tour);
            const cleanTitle = locTour.title.replace(/^(Tuyến|Route|路线)\s*\d+\s*[—:-]\s*/i, '');
            const regionLabel = locTour.region || tour.region || '';
            const stopNames = visibleStops.map((s) =>
              getLocalizedSite(s).officialName.split(/\s*[-–(（]/)[0].trim()
            );
            const stopsLabel =
              lang === 'zh' ? '站' : lang === 'en' ? 'stops' : 'trạm';
            const computedDistanceKm = calculateTourDistanceKm(tour, allSites);

            return (
              <TourRouteCard
                key={tour.id}
                tour={tour}
                index={idx}
                visibleStopCount={visibleStops.length}
                distanceKm={computedDistanceKm}
                isSelected={isSelected}
                isCompleted={completedRouteIds.includes(tour.id)}
                cleanTitle={cleanTitle}
                regionLabel={regionLabel}
                stopNames={stopNames}
                lang={lang}
                stopsLabel={stopsLabel}
                onSelect={handleTourCardSelect}
              />
            );
          })}
        </div>

        {/* B. ACTIVE ROUTE CONTROLS & VERTICAL TIMELINE */}
        <div className="p-4 space-y-4 bg-[#F4EFE4]">
          {/* Selected Route Summary & Controls */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[11px] font-sans font-bold tabular-nums text-[#A94F3D]">
                  {currentTourSites.length === 1
                    ? lang === 'zh'
                      ? `单一目的地 · ${locCurrentTour.region || '头顿'}`
                      : lang === 'en'
                      ? `Single Destination · ${locCurrentTour.region || 'Vung Tau'}`
                      : `Điểm đến duy nhất · ${locCurrentTour.region || 'Vũng Tàu'}`
                    : lang === 'zh'
                    ? `路线详情 · ${currentTourSites.length} 站 · ~${currentTourDistanceKm} km`
                    : lang === 'en'
                    ? `Route timeline · ${currentTourSites.length} stops · ~${currentTourDistanceKm} km`
                    : `Lộ trình trạm dừng · ${currentTourSites.length} trạm · ~${currentTourDistanceKm} km`}
                </div>
                <p className="text-xs text-[#171817]/75 leading-relaxed mt-1">
                  {locCurrentTour.description}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) =>
                    handleToggleSaveTour(e, currentTour.id, locCurrentTour.title)
                  }
                  className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                    isCurrentSaved
                      ? 'bg-[#C9A46A] border-[#171817] text-[#171817]'
                      : 'border-[#171817]/20 text-[#171817]/70 hover:text-[#171817] hover:bg-[#EDE4D0]'
                  }`}
                  title={t('tours.saveRouteTitle')}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleShareTour(e, currentTour)}
                  className="w-7 h-7 rounded-full border border-[#171817]/20 text-[#171817]/70 hover:text-[#171817] hover:bg-[#EDE4D0] flex items-center justify-center transition-colors cursor-pointer"
                  title={t('tours.shareRouteTitle')}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Compact Transport Mode + Auto-Play Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAutoPlaying((prev) => !prev)}
                className="px-3.5 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#171817]/20"
                style={{ backgroundColor: activeRouteColor.primaryHex, color: activeRouteColor.fgHex }}
              >
                {isAutoPlaying ? (
                  <>
                    <Pause className="w-3 h-3 fill-current" />
                    <span>
                      {lang === 'vi'
                        ? 'Tạm dừng'
                        : lang === 'zh'
                        ? '暂停导览'
                        : 'Pause'}
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current" />
                    <span>
                      {lang === 'vi'
                        ? 'Tự động dẫn đường'
                        : lang === 'zh'
                        ? '自动导览'
                        : 'Auto-Play'}
                    </span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                {[
                  {
                    id: 'walk' as const,
                    icon: Footprints,
                    label: lang === 'vi' ? 'Đi bộ' : lang === 'zh' ? '步行' : 'Walk',
                  },
                  {
                    id: 'motorbike' as const,
                    icon: Bike,
                    label: lang === 'vi' ? 'Xe máy' : lang === 'zh' ? '摩托车' : 'Bike',
                  },
                  {
                    id: 'car' as const,
                    icon: Car,
                    label: lang === 'vi' ? 'Ô tô' : lang === 'zh' ? '汽车' : 'Car',
                  },
                ].map((m) => {
                  const Icon = m.icon;
                  const active = transportMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTransportMode(m.id)}
                      title={m.label}
                      className={`w-7 h-7 rounded-full border flex items-center justify-center transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#171817] border-[#171817] text-[#D8C9A9]'
                          : 'border-[#171817]/20 text-[#171817]/70 hover:text-[#171817] hover:bg-[#EDE4D0]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  );
                })}

                <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-[#171817]/15">
                  <button
                    type="button"
                    onClick={() => handleStepStop(-1)}
                    className="w-7 h-7 rounded-full border border-[#171817]/20 text-[#171817]/75 hover:text-[#171817] hover:bg-[#EDE4D0] flex items-center justify-center cursor-pointer"
                    title={t('tours.prevStopTitle')}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-sans text-[11px] font-semibold px-1 text-[#171817] tabular-nums">
                    {activeStopIndex + 1}/{currentTourSites.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStepStop(1)}
                    className="w-7 h-7 rounded-full border border-[#171817]/20 text-[#171817]/75 hover:text-[#171817] hover:bg-[#EDE4D0] flex items-center justify-center cursor-pointer"
                    title={t('tours.nextStopTitle')}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sharp Vertical Timeline */}
          <div className="relative pl-8 pt-1">
            {currentTourSites.length > 1 && (
              <div
                aria-hidden="true"
                className="absolute left-[11px] top-4 bottom-8 w-[1.5px] bg-[#A94F3D]/40"
              />
            )}

            <div className="space-y-4">
              {currentTourSites.map((site, idx) => {
                const isCurrentStop = idx === activeStopIndex;
                const locSite = getLocalizedSite(site);
                const nextSite =
                  idx < currentTourSites.length - 1
                    ? currentTourSites[idx + 1]
                    : null;
                const segDist = nextSite
                  ? calculateSegmentDistanceKm(
                      site.gps.lat,
                      site.gps.lng,
                      nextSite.gps.lat,
                      nextSite.gps.lng
                    )
                  : 0;
                const segMins = nextSite
                  ? getSegmentMinutes(segDist, transportMode)
                  : 0;

                return (
                  <TourStopCard
                    key={site.id}
                    site={site}
                    idx={idx}
                    isCurrentStop={isCurrentStop}
                    isHiddenForVisitors={hiddenSiteIds.includes(site.id)}
                    officialName={locSite.officialName}
                    districtLabel={formatDistrictName(site.address.district)}
                    lang={lang}
                    hasNext={Boolean(nextSite)}
                    segDist={segDist}
                    segMins={segMins}
                    minutesLabel={t('common.minutes')}
                    onSelectStop={handleSelectStop}
                    onOpenDetailModal={onOpenDetailModal}
                    onOpen3D={onOpen3D}
                    onOpenARAudio={onOpenARAudio}
                    onOpenVideo={onOpenVideo}
                  />
                );
              })}
            </div>

            {onCompleteTour && (
              <div className="mt-4 pt-3 border-t border-[#171817]/15 flex items-center justify-between gap-2">
                <span className="text-[11px] font-sans text-[#171817]/70 tabular-nums">
                  {lang === 'en'
                    ? `Visited ${(visitedStopIdsByTour[currentTour.id] || [currentTourSites[0]?.id].filter(Boolean)).length}/${currentTourSites.length} stops`
                    : lang === 'zh'
                    ? `已探访 ${(visitedStopIdsByTour[currentTour.id] || [currentTourSites[0]?.id].filter(Boolean)).length}/${currentTourSites.length} 站`
                    : `Đã qua ${(visitedStopIdsByTour[currentTour.id] || [currentTourSites[0]?.id].filter(Boolean)).length}/${currentTourSites.length} trạm`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onCompleteTour(currentTour);
                    showToast(
                      lang === 'en'
                        ? `✓ Completed route "${locCurrentTour.title}"`
                        : lang === 'zh'
                        ? `✓ 已完成路线“${locCurrentTour.title}”`
                        : `✓ Đã ghi nhận hoàn thành "${locCurrentTour.title}"`
                    );
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    completedRouteIds.includes(currentTour.id)
                      ? 'bg-[#47796D] border border-[#171817]/25 text-[#171817]'
                      : 'bg-[#A94F3D] hover:bg-[#934232] text-[#D8C9A9]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {completedRouteIds.includes(currentTour.id)
                      ? lang === 'en'
                        ? 'Route Completed'
                        : lang === 'zh'
                        ? '已完成路线'
                        : 'Đã hoàn thành tuyến'
                      : lang === 'en'
                      ? 'Complete Route'
                      : lang === 'zh'
                      ? '完成路线'
                      : 'Hoàn thành tuyến'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
});

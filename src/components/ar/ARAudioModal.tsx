import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { HeritageSite } from '../../types/heritage';
import { useI18n } from '../../i18n/I18nContext';
import { Language } from '../../i18n/types';
import { useAudioGuide, ComputedChapter } from '../../contexts/AudioGuideContext';
import { getSitePhotoCaption } from '../../utils/wikimediaPhotoService';
import { getHeritageSiteArchiveIndex } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { HeritageSitePickerDropdown } from '../common/HeritageSiteDropdown';
import { triggerHaptic } from '../../utils/haptics';
import { SectionGuideButton } from '../guide/InteractiveUserGuideModal';
import {
  Headphones,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronDown,
  Download,
  Upload,
  Box,
  Check,
  Music,
  X,
} from 'lucide-react';

interface ARAudioModalProps {
  site: HeritageSite;
  onClose: () => void;
  onBackToExplore?: () => void;
  onSelectSite?: (site: HeritageSite) => void;
  onLaunch3D?: () => void;
  onNavigateToMap?: (site: HeritageSite) => void;
  onOpenPhotoManager?: (site: HeritageSite) => void;
  onOpenGuide?: () => void;
}

function formatClock(seconds: number): string {
  const min = Math.floor(Math.max(0, seconds) / 60);
  const sec = Math.floor(Math.max(0, seconds) % 60);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * Pigment Identification Card fallback (#47796D or #526D8B) when real photo is unavailable/loading.
 */
const PigmentFallbackPlate: React.FC<{
  site: HeritageSite;
  slotIndex: number;
  title: string;
  compactLabel?: string;
  size?: 'large' | 'thumb';
}> = ({ site, slotIndex, title, compactLabel, size = 'large' }) => {
  const siteIdx = getHeritageSiteArchiveIndex(site.id, 0);
  const useTeal = (siteIdx + slotIndex) % 2 === 0;
  const bgHex = useTeal ? '#47796D' : '#526D8B';
  const indexCode = compactLabel || String(siteIdx + 1).padStart(2, '0');

  if (size === 'thumb') {
    return (
      <div
        className="w-full h-full flex flex-col justify-between p-1.5 select-none"
        style={{ backgroundColor: bgHex, color: '#D8C9A9' }}
      >
        <span className="text-[8px] uppercase tracking-[0.12em] opacity-80 leading-none truncate">
          {site.identifierCode.split('-').slice(-1)[0]}
        </span>
        <span className="font-['Lora'] text-[15px] leading-none tabular-nums">
          {indexCode}
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full p-6 sm:p-8 flex flex-col justify-between select-none"
      style={{ backgroundColor: bgHex, color: '#D8C9A9' }}
    >
      <div className="w-full h-full border border-[#D8C9A9]/30 p-5 sm:p-7 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#D8C9A9]/25 text-[11px] uppercase tracking-[0.14em] text-[#D8C9A9]/85">
          <span>{site.identifierCode}</span>
          <span className="tabular-nums">
            {site.commencementYear < 0
              ? `${Math.abs(site.commencementYear)} TCN`
              : site.commencementYear}
          </span>
        </div>

        <div className="my-auto py-4">
          <div className="font-['Lora'] text-5xl sm:text-6xl font-normal leading-none tracking-tight tabular-nums text-[#D8C9A9]/90 mb-3">
            {indexCode}
          </div>
          <h3 className="font-['Lora'] text-2xl sm:text-3xl font-normal leading-snug text-[#D8C9A9]">
            {title}
          </h3>
        </div>

        <div className="pt-3 border-t border-[#D8C9A9]/25 flex items-center justify-between text-[11px] uppercase tracking-[0.12em] text-[#D8C9A9]/75">
          <span className="truncate">{site.address.district}</span>
          <span className="shrink-0">{site.address.city}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Isolated elapsed clock subscriber (avoids re-rendering parent every 300ms).
 */
const EditorialElapsedClock: React.FC = React.memo(() => {
  const { getCurrentTimeSec, subscribePlaybackProgress } = useAudioGuide();
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (spanRef.current) {
      spanRef.current.textContent = formatClock(getCurrentTimeSec());
    }
    return subscribePlaybackProgress((_pct, timeSec) => {
      if (spanRef.current) {
        spanRef.current.textContent = formatClock(timeSec);
      }
    });
  }, [getCurrentTimeSec, subscribePlaybackProgress]);

  return (
    <span
      ref={spanRef}
      className="text-[11px] text-[#D8C9A9]/75 tabular-nums w-10 text-right shrink-0"
    >
      {formatClock(getCurrentTimeSec())}
    </span>
  );
});

/**
 * Isolated interactive linear scrubber (3px hairline track, #C9A46A progress fill).
 */
const EditorialLinearScrubber: React.FC = React.memo(() => {
  const { getPlaybackProgress, subscribePlaybackProgress, seekToPercent } = useAudioGuide();
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (pct: number) => {
      const clamped = Math.max(0, Math.min(100, pct));
      if (fillRef.current) {
        fillRef.current.style.width = `${clamped}%`;
      }
      if (trackRef.current) {
        trackRef.current.setAttribute('aria-valuenow', String(Math.round(clamped)));
      }
    };
    apply(getPlaybackProgress());
    return subscribePlaybackProgress((pct) => apply(pct));
  }, [getPlaybackProgress, subscribePlaybackProgress]);

  const seekAtClientX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      seekToPercent(pct);
    },
    [seekToPercent]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    seekAtClientX(e.clientX);
    const onMove = (ev: PointerEvent) => seekAtClientX(ev.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={handlePointerDown}
      role="slider"
      aria-label="Audio playback progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(getPlaybackProgress())}
      tabIndex={0}
      className="relative flex-1 h-5 flex items-center cursor-pointer group"
    >
      <div className="w-full h-[3px] bg-[#D8C9A9]/20 relative overflow-hidden">
        <div
          ref={fillRef}
          className="h-full bg-[#C9A46A] transition-[width] duration-200"
          style={{ width: `${Math.max(0, Math.min(100, getPlaybackProgress()))}%` }}
        />
      </div>
    </div>
  );
});

/**
 * Thin #C9A46A progress line along the bottom border of the active chapter row.
 */
const ChapterRowBottomProgress: React.FC<{
  chapter: ComputedChapter;
  isCurrent: boolean;
}> = React.memo(({ chapter, isCurrent }) => {
  const { getPlaybackProgress, subscribePlaybackProgress } = useAudioGuide();
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCurrent) return;
    const apply = (globalPct: number) => {
      if (!barRef.current) return;
      const span = Math.max(1, chapter.endPercent - chapter.startPercent);
      const localPct = Math.max(0, Math.min(100, ((globalPct - chapter.startPercent) / span) * 100));
      barRef.current.style.width = `${localPct}%`;
    };
    apply(getPlaybackProgress());
    return subscribePlaybackProgress((pct) => apply(pct));
  }, [isCurrent, chapter.startPercent, chapter.endPercent, getPlaybackProgress, subscribePlaybackProgress]);

  if (!isCurrent) return null;

  return (
    <div
      ref={barRef}
      className="absolute bottom-0 left-0 h-[2px] bg-[#C9A46A] transition-[width] duration-200 pointer-events-none"
      style={{ width: '0%' }}
    />
  );
});

export const ARAudioModal: React.FC<ARAudioModalProps> = ({
  site,
  onClose,
  onBackToExplore,
  onSelectSite,
  onLaunch3D,
  onOpenPhotoManager,
  onOpenGuide,
}) => {
  const { lang: globalLang, setLang: setGlobalLang, getLocalizedSite, formatDistrictName } = useI18n();
  const {
    sites,
    activeSite,
    chapters,
    selectedChapterIdx,
    activeChapter,
    sentences,
    activeSentenceIndex,
    isPlaying,
    isMuted,
    playbackSpeed,
    totalDurationSec,
    customAudio,
    isUsingCustomAudio,
    selectSite,
    togglePlayPause,
    toggleMute,
    selectChapter,
    prevChapter,
    nextChapter,
    jumpToSentence,
    cycleSpeed,
    seekBySeconds,
    uploadCustomAudio,
    removeCustomAudio,
    toggleCustomAudioSource,
    minimizeModalKeepPlaying,
  } = useAudioGuide();

  // Keep AudioGuideContext synced if launched from a specific card/3D scene
  useEffect(() => {
    if (site?.id && site.id !== activeSite.id) {
      selectSite(site.id, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [site.id]);

  // Scroll viewport to top when opening Thuyết minh page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const currentSite = activeSite || site;
  const localizedSite = getLocalizedSite(currentSite);

  const [activePhotoIdx, setActivePhotoIdx] = useState<0 | 1>(0);
  const [failedPhotoUrls, setFailedPhotoUrls] = useState<Record<string, boolean>>({});
  const [downloadToast, setDownloadToast] = useState<boolean>(false);
  const [startedChapterKeys, setStartedChapterKeys] = useState<Record<string, boolean>>({});
  const [isPlayHapticPulsing, setIsPlayHapticPulsing] = useState<boolean>(false);
  const playHapticTimerRef = useRef<number | null>(null);

  const triggerPlayButtonHaptic = useCallback(() => {
    triggerHaptic('pulse');
    if (playHapticTimerRef.current !== null) {
      window.clearTimeout(playHapticTimerRef.current);
    }
    setIsPlayHapticPulsing(false);
    window.requestAnimationFrame(() => {
      setIsPlayHapticPulsing(true);
      playHapticTimerRef.current = window.setTimeout(() => {
        setIsPlayHapticPulsing(false);
        playHapticTimerRef.current = null;
      }, 280);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (playHapticTimerRef.current !== null) {
        window.clearTimeout(playHapticTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const key = `${currentSite.id}:${selectedChapterIdx}`;
    setStartedChapterKeys((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, [isPlaying, currentSite.id, selectedChapterIdx]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const activeSentenceElRef = useRef<HTMLSpanElement | null>(null);

  // Reset photo angle when monument changes
  useEffect(() => {
    setActivePhotoIdx(0);
  }, [currentSite.id]);

  // Subtle alternating photo angle sync when picking chapters if a second real photo exists
  useEffect(() => {
    const preferredSlot: 0 | 1 = selectedChapterIdx % 2 === 1 && currentSite.photos?.[1] ? 1 : 0;
    setActivePhotoIdx(preferredSlot);
  }, [selectedChapterIdx, currentSite.photos]);

  // Scroll active spoken sentence cleanly inside the transcript box only (never hijacking window scroll)
  useEffect(() => {
    const container = transcriptContainerRef.current;
    const target = activeSentenceElRef.current;
    if (!container || !target) return;

    const targetTop = target.offsetTop - container.offsetTop;
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const targetBottom = targetTop + target.offsetHeight;

    if (targetTop < containerTop + 16 || targetBottom > containerBottom - 16) {
      container.scrollTo({
        top: Math.max(0, targetTop - container.clientHeight * 0.35),
        behavior: 'smooth',
      });
    }
  }, [activeSentenceIndex, selectedChapterIdx, globalLang]);

  const markPhotoFailed = useCallback((url: string) => {
    if (!url) return;
    setFailedPhotoUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }));
  }, []);

  const mainPhotoUrl = currentSite.photos?.[activePhotoIdx] || '';
  const hasValidMainPhoto = Boolean(mainPhotoUrl) && !failedPhotoUrls[mainPhotoUrl];

  const footerThumbUrl = currentSite.photos?.[selectedChapterIdx % 2] || currentSite.photos?.[0] || '';
  const hasValidFooterThumb = Boolean(footerThumbUrl) && !failedPhotoUrls[footerThumbUrl];

  const photoCaption = useMemo(
    () => getSitePhotoCaption(currentSite, activePhotoIdx, globalLang),
    [currentSite, activePhotoIdx, globalLang]
  );

  const rankingDisplayLabel = useMemo(() => {
    if (currentSite.rankingLevel === 'Special National') {
      return globalLang === 'en'
        ? 'Special National Monument'
        : globalLang === 'zh'
        ? '国家级特别遗迹'
        : 'Di tích Quốc gia Đặc biệt';
    }
    if (currentSite.rankingLevel === 'National') {
      return globalLang === 'en'
        ? 'National Monument'
        : globalLang === 'zh'
        ? '国家级遗迹'
        : 'Di tích Quốc gia';
    }
    return globalLang === 'en'
      ? 'Provincial / Municipal Monument'
      : globalLang === 'zh'
      ? '省市级历史遗迹'
      : 'Di tích Cấp Tỉnh / Thành phố';
  }, [currentSite.rankingLevel, globalLang]);

  const yearLabel = useMemo(() => {
    if (currentSite.commencementYear < 0) {
      const absYear = Math.abs(currentSite.commencementYear);
      return globalLang === 'en'
        ? `${absYear} BCE`
        : globalLang === 'zh'
        ? `公元前 ${absYear} 年`
        : `${absYear} TCN`;
    }
    return String(currentSite.commencementYear);
  }, [currentSite.commencementYear, globalLang]);

  const addressDisplay = useMemo(() => {
    const streetParts = [currentSite.address.houseNumber, currentSite.address.street]
      .filter(Boolean)
      .join(' ');
    const district = formatDistrictName(currentSite.address.district);
    return [streetParts, district, currentSite.address.city].filter(Boolean).join(', ');
  }, [currentSite.address, formatDistrictName]);

  const architecturalStyleDisplay =
    localizedSite.architecturalStyle || currentSite.architecturalStyle;

  const chapterCodeLabel = useMemo(() => {
    const num = String(selectedChapterIdx + 1).padStart(2, '0');
    if (globalLang === 'en') return `CHAPTER ${num}`;
    if (globalLang === 'zh') return `第 ${num} 章`;
    return `CHƯƠNG ${num}`;
  }, [selectedChapterIdx, globalLang]);

  // Group sentences into editorial paragraphs of 2 sentences each for refined reading flow
  const groupedParagraphs = useMemo(() => {
    const groups: { text: string; idx: number }[][] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const pair: { text: string; idx: number }[] = [{ text: sentences[i], idx: i }];
      if (i + 1 < sentences.length) {
        pair.push({ text: sentences[i + 1], idx: i + 1 });
      }
      groups.push(pair);
    }
    return groups;
  }, [sentences]);

  const handleBackClick = useCallback(() => {
    if (onBackToExplore) {
      onBackToExplore();
    } else {
      minimizeModalKeepPlaying();
      onClose();
    }
  }, [onBackToExplore, minimizeModalKeepPlaying, onClose]);

  const handleSitePicked = (nextSite: HeritageSite) => {
    selectSite(nextSite.id);
    if (onSelectSite) {
      onSelectSite(nextSite);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadCustomAudio(currentSite.id, file);
    }
    e.target.value = '';
  };

  const handleDownloadOffline = () => {
    setDownloadToast(true);
    try {
      const fullContent = [
        `DẤU ẤN VIỆT 3D — BẢN THU THUYẾT MINH LƯU TRỮ`,
        `Di tích: ${localizedSite.officialName} (${currentSite.identifierCode})`,
        `Ngôn ngữ: ${globalLang.toUpperCase()} · Thời lượng: ${formatClock(totalDurationSec)}`,
        `----------------------------------------`,
        ...chapters.map(
          (c, i) => `${String(i + 1).padStart(2, '0')}. ${c.title} (${c.durationLabel})\n${c.narration}\n`
        ),
      ].join('\n');
      const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSite.identifierCode}-${globalLang}-AudioGuide.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback toast only
    }
    setTimeout(() => setDownloadToast(false), 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekBySeconds(-15);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekBySeconds(15);
      } else if (e.key === 'Escape') {
        minimizeModalKeepPlaying();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, seekBySeconds, minimizeModalKeepPlaying, onClose]);

  return (
    <section
      aria-label={
        globalLang === 'en'
          ? `Audio Guide - ${localizedSite.officialName}`
          : globalLang === 'zh'
          ? `语音导览 - ${localizedSite.officialName}`
          : `Thuyết minh Di sản - ${localizedSite.officialName}`
      }
      className="min-h-[calc(100vh-4rem)] w-full bg-[#171817] text-[#D8C9A9] pb-8 md:pb-16 select-none"
    >
      {/* Hidden Custom MP3 Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ====================================================================
          1. DARK EDITORIAL HEADER SUB-BAR (BELOW UNCHANGED TOP NAVBAR)
         ==================================================================== */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-6 border-b border-[#D8C9A9]/15">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBackClick}
            className="text-[12px] uppercase tracking-[0.12em] text-[#D8C9A9]/65 hover:text-[#C9A46A] transition-colors cursor-pointer"
          >
            {globalLang === 'en'
              ? '← Back to Explore'
              : globalLang === 'zh'
              ? '← 返回探索'
              : '← Quay lại Khám phá'}
          </button>
          {onOpenGuide && (
            <SectionGuideButton lang={globalLang} onClick={onOpenGuide} />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Headphones className="w-7 h-7 text-[#C9A46A] shrink-0" strokeWidth={1.5} />
            <h1 className="font-['Lora'] text-[34px] md:text-[40px] font-normal leading-tight text-[#D8C9A9]">
              {globalLang === 'en'
                ? 'Heritage Audio Guide'
                : globalLang === 'zh'
                ? '遗产语音导览'
                : 'Thuyết minh Di sản'}
            </h1>
          </div>

          {/* 17 Heritage Sites Quick Dropdown */}
          <div className="relative w-full sm:w-[310px] max-w-full">
            <HeritageSitePickerDropdown
              sites={sites}
              selectedSiteId={currentSite.id}
              onSelectSite={handleSitePicked}
              align="right"
              dropdownWidthClass="w-full sm:w-[340px]"
              ariaLabel={
                globalLang === 'en'
                  ? 'Select heritage monument'
                  : globalLang === 'zh'
                  ? '选择遗产地点'
                  : 'Chọn nhanh 17 di tích'
              }
            />
          </div>
        </div>
      </div>

      {/* ====================================================================
          2. 2-COLUMN EDITORIAL LAYOUT: LARGE PHOTO LEFT | CONTENT & CHAPTERS RIGHT
         ==================================================================== */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* LEFT COLUMN (lg:col-span-6 lg:sticky lg:top-24): LARGE HERITAGE PHOTO */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <div className="w-full aspect-video bg-[#171817] border border-[#D8C9A9]/15 overflow-hidden relative">
            {hasValidMainPhoto ? (
              <HeritageSmoothImage
                src={mainPhotoUrl}
                alt={photoCaption}
                waitTone="dark"
                onError={() => markPhotoFailed(mainPhotoUrl)}
                className="w-full h-full object-cover object-center"
              />
            ) : (
              <PigmentFallbackPlate
                site={currentSite}
                slotIndex={activePhotoIdx}
                title={localizedSite.officialName}
                size="large"
              />
            )}
          </div>

          {/* Photo Caption + 01 | 02 View Toggle */}
          <div className="mt-3 flex items-center justify-between gap-4 text-[12px] text-[#D8C9A9]/70">
            <span className="truncate">{photoCaption}</span>

            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <button
                type="button"
                onClick={() => setActivePhotoIdx(0)}
                className={`cursor-pointer transition-colors ${
                  activePhotoIdx === 0
                    ? 'text-[#C9A46A] font-semibold'
                    : 'text-[#D8C9A9]/45 hover:text-[#D8C9A9]'
                }`}
                aria-label="View archival photo 01"
              >
                01
              </button>
              <span className="text-[#D8C9A9]/25 select-none">|</span>
              <button
                type="button"
                onClick={() => setActivePhotoIdx(1)}
                className={`cursor-pointer transition-colors ${
                  activePhotoIdx === 1
                    ? 'text-[#C9A46A] font-semibold'
                    : 'text-[#D8C9A9]/45 hover:text-[#D8C9A9]'
                }`}
                aria-label="View archival photo 02"
              >
                02
              </button>
            </div>
          </div>

          {/* Discreet Curatorial Utility Strip */}
          <div className="mt-4 pt-3 border-t border-[#D8C9A9]/10 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.1em] text-[#D8C9A9]/55">
            <div className="flex flex-wrap items-center gap-4">
              {onLaunch3D && (
                <button
                  type="button"
                  onClick={() => {
                    minimizeModalKeepPlaying();
                    onLaunch3D();
                  }}
                  className="inline-flex items-center gap-1.5 hover:text-[#C9A46A] transition-colors cursor-pointer"
                >
                  <Box className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>
                    {globalLang === 'en'
                      ? 'Open 3D Space'
                      : globalLang === 'zh'
                      ? '开启 3D 空间'
                      : 'Không gian 3D'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadOffline}
                className="inline-flex items-center gap-1.5 hover:text-[#C9A46A] transition-colors cursor-pointer"
              >
                {downloadToast ? (
                  <Check className="w-3.5 h-3.5 text-[#47796D]" strokeWidth={1.5} />
                ) : (
                  <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                )}
                <span>
                  {downloadToast
                    ? globalLang === 'en'
                      ? 'Saved Script'
                      : globalLang === 'zh'
                      ? '已下载文稿'
                      : 'Đã lưu kịch bản'
                    : globalLang === 'en'
                    ? 'Script Archive'
                    : globalLang === 'zh'
                    ? '下载文稿'
                    : 'Tải kịch bản'}
                </span>
              </button>

              {onOpenPhotoManager && (
                <button
                  type="button"
                  onClick={() => onOpenPhotoManager(currentSite)}
                  className="hover:text-[#C9A46A] transition-colors cursor-pointer"
                >
                  {globalLang === 'en'
                    ? 'Manage Photos'
                    : globalLang === 'zh'
                    ? '照片管理'
                    : 'Ảnh tư liệu'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {customAudio ? (
                <div className="inline-flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleCustomAudioSource(!isUsingCustomAudio)}
                    className={`inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      isUsingCustomAudio ? 'text-[#C9A46A]' : 'hover:text-[#D8C9A9]'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>
                      {isUsingCustomAudio
                        ? globalLang === 'en'
                          ? 'Using MP3 · Switch TTS'
                          : globalLang === 'zh'
                          ? '使用 MP3 · 切回语音'
                          : 'Đang phát MP3 · Đổi giọng đọc'
                        : 'MP3'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCustomAudio(currentSite.id)}
                    className="text-[#A94F3D] hover:text-[#D8C9A9] cursor-pointer"
                    title={globalLang === 'en' ? 'Remove MP3' : 'Xóa MP3'}
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 hover:text-[#C9A46A] transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>
                    {globalLang === 'en'
                      ? 'Upload MP3'
                      : globalLang === 'zh'
                      ? '上传 MP3'
                      : 'Tải lên MP3'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (lg:col-span-6): TITLE, TRANSCRIPT & COMPACT CHAPTER LIST */}
        <div className="lg:col-span-6 flex flex-col gap-8">
          {/* BLOCK A: Title & Narration Content */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#C9A46A] font-semibold">
              {chapterCodeLabel} · {rankingDisplayLabel}
            </div>

            <h2 className="font-['Lora'] text-[28px] leading-[1.22] font-normal text-[#D8C9A9] mt-1.5">
              {activeChapter?.title || localizedSite.officialName}
            </h2>

            {activeChapter?.title && activeChapter.title !== localizedSite.officialName && (
              <p className="mt-1 text-[13px] text-[#D8C9A9]/65">
                {localizedSite.officialName}
              </p>
            )}

            {/* Vertical Curatorial Specs with 2px #47796D left line */}
            <div className="mt-3 text-[12.5px] leading-[1.6] text-[#D8C9A9]/65 border-l-2 border-[#47796D] pl-3.5 space-y-0.5">
              <div>
                <span className="text-[#D8C9A9]/45">
                  {globalLang === 'en' ? 'Location: ' : globalLang === 'zh' ? '地点：' : 'Địa điểm: '}
                </span>
                <span>{addressDisplay}</span>
              </div>
              <div>
                <span className="text-[#D8C9A9]/45">
                  {globalLang === 'en'
                    ? 'Commencement: '
                    : globalLang === 'zh'
                    ? '始建年份：'
                    : 'Năm khởi công: '}
                </span>
                <span className="tabular-nums">{yearLabel}</span>
              </div>
              <div>
                <span className="text-[#D8C9A9]/45">
                  {globalLang === 'en'
                    ? 'Architectural Style: '
                    : globalLang === 'zh'
                    ? '建筑风格：'
                    : 'Phong cách kiến trúc: '}
                </span>
                <span>{architecturalStyleDisplay}</span>
              </div>
            </div>

            {/* Interactive Narration Transcript (scrollable 240px container) */}
            <div
              ref={transcriptContainerRef}
              className="mt-5 max-h-[240px] overflow-y-auto pr-3 text-[14.5px] leading-[1.8] text-[#D8C9A9]/90 space-y-4"
            >
              {groupedParagraphs.length > 0 ? (
                groupedParagraphs.map((para, pIdx) => (
                  <p key={pIdx} className="m-0">
                    {para.map((item, sOffset) => {
                      const isActiveSentence = item.idx === activeSentenceIndex;
                      return (
                        <React.Fragment key={item.idx}>
                          {sOffset > 0 && ' '}
                          <span
                            ref={isActiveSentence ? activeSentenceElRef : undefined}
                            role="button"
                            tabIndex={0}
                            onClick={() => jumpToSentence(item.idx)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                jumpToSentence(item.idx);
                              }
                            }}
                            title={
                              globalLang === 'en'
                                ? 'Click to narrate from this sentence'
                                : globalLang === 'zh'
                                ? '点击从此句开始播报'
                                : 'Nhấn để đọc từ câu này'
                            }
                            className={`cursor-pointer transition-colors ${
                              isActiveSentence
                                ? 'text-[#D8C9A9] bg-[#C9A46A]/15 border-b border-[#C9A46A]'
                                : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
                            }`}
                          >
                            {item.text}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </p>
                ))
              ) : (
                <p className="text-[#D8C9A9]/70">{localizedSite.summary}</p>
              )}
            </div>
          </div>

          {/* BLOCK B: Compact Editorial Chapter List */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[#D8C9A9]/60 pb-2 border-b border-[#D8C9A9]/15">
              {globalLang === 'en'
                ? 'AUDIO GUIDE CHAPTERS'
                : globalLang === 'zh'
                ? '语音导览章节列表'
                : 'DANH SÁCH CHƯƠNG THUYẾT MINH'}
            </div>

            <div>
              {chapters.map((ch, idx) => {
                const isCurrent = idx === selectedChapterIdx;
                const isThisPlaying = isCurrent && isPlaying;
                const chapterKey = `${currentSite.id}:${idx}`;
                const isThisPaused =
                  isCurrent &&
                  !isPlaying &&
                  (Boolean(startedChapterKeys[chapterKey]) || activeSentenceIndex > 0);
                const thumbUrl = currentSite.photos?.[idx % 2] || currentSite.photos?.[0] || '';
                const hasThumb = Boolean(thumbUrl) && !failedPhotoUrls[thumbUrl];

                return (
                  <div
                    key={ch.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      triggerHaptic('pulse');
                      if (isCurrent) {
                        togglePlayPause();
                      } else {
                        selectChapter(idx, true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isCurrent) {
                          togglePlayPause();
                        } else {
                          selectChapter(idx, true);
                        }
                      }
                    }}
                    className="py-3.5 flex items-center gap-4 cursor-pointer group relative border-b border-[#D8C9A9]/14 transition-colors"
                  >
                    {/* Left 80px aspect-video Thumbnail with Audio Badge */}
                    <div className="relative w-20 aspect-video shrink-0 bg-[#171817] border border-[#D8C9A9]/15 overflow-hidden rounded-sm">
                      {hasThumb ? (
                        <HeritageSmoothImage
                          src={thumbUrl}
                          alt={ch.title}
                          loading="lazy"
                          waitTone="dark"
                          onError={() => markPhotoFailed(thumbUrl)}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <PigmentFallbackPlate
                          site={currentSite}
                          slotIndex={idx}
                          title={ch.title}
                          compactLabel={String(idx + 1).padStart(2, '0')}
                          size="thumb"
                        />
                      )}
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 right-1 bg-[#171817]/85 border border-[#C9A46A]/40 px-1.5 py-0.5 rounded flex items-center justify-center pointer-events-none"
                      >
                        <Headphones className="w-3 h-3 text-[#C9A46A]" strokeWidth={1.7} />
                      </span>
                    </div>

                    {/* Middle Column: Chapter Title + Audio Guide Pill Button */}
                    <div className="min-w-0 flex-1 flex flex-col items-start gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[14px] font-medium leading-snug line-clamp-1 transition-colors ${
                            isCurrent
                              ? 'text-[#C9A46A]'
                              : 'text-[#D8C9A9] group-hover:text-[#C9A46A]'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}. {ch.title}
                        </span>
                        {ch.isHiddenForVisitors && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-[#171817] border border-[#C9A46A] text-[#C9A46A] text-[9.5px] font-semibold shrink-0">
                            {globalLang === 'en'
                              ? 'Tester Preview · Hidden'
                              : globalLang === 'zh'
                              ? '隐藏草稿 · 测试模式'
                              : 'Đang ẩn · Chế độ Tester'}
                          </span>
                        )}
                      </div>

                      <span
                        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                          isThisPlaying
                            ? 'bg-[#C9A46A] text-[#171817] font-semibold shadow-sm'
                            : isThisPaused
                            ? 'bg-[#171817] border border-[#C9A46A]/65 text-[#C9A46A] group-hover:bg-[#C9A46A] group-hover:text-[#171817]'
                            : 'bg-[#D8C9A9] text-[#171817] group-hover:bg-[#C9A46A]'
                        }`}
                      >
                        {isThisPlaying ? (
                          <>
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 18 18"
                              fill="none"
                              aria-hidden="true"
                              className="shrink-0"
                            >
                              <line
                                x1="4.5"
                                y1="5.5"
                                x2="4.5"
                                y2="12.5"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                className="ambient-wave-bar-1"
                              />
                              <line
                                x1="9"
                                y1="3.5"
                                x2="9"
                                y2="14.5"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                className="ambient-wave-bar-2"
                              />
                              <line
                                x1="13.5"
                                y1="5.5"
                                x2="13.5"
                                y2="12.5"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                className="ambient-wave-bar-3"
                              />
                            </svg>
                            <span>
                              {globalLang === 'en'
                                ? 'Playing Audio Guide'
                                : globalLang === 'zh'
                                ? '正在播放导览'
                                : 'Đang phát thuyết minh'}
                            </span>
                          </>
                        ) : isThisPaused ? (
                          <>
                            <Headphones className="w-[15px] h-[15px] shrink-0" strokeWidth={1.7} />
                            <span>
                              {globalLang === 'en'
                                ? 'Resume Audio'
                                : globalLang === 'zh'
                                ? '继续收听'
                                : 'Tiếp tục nghe'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Headphones className="w-[15px] h-[15px] shrink-0" strokeWidth={1.7} />
                            <span>
                              {globalLang === 'en'
                                ? 'Listen to Audio Guide'
                                : globalLang === 'zh'
                                ? '收听语音导览'
                                : 'Nghe thuyết minh'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-[#171817]/12 text-[#171817]/75 text-[10px] font-semibold tracking-wide uppercase leading-none">
                              Audio
                            </span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Right Column: Tabular Duration */}
                    <span className="text-[12px] text-[#D8C9A9]/60 tabular-nums self-end shrink-0">
                      {ch.durationLabel}
                    </span>

                    {/* Thin #C9A46A Progress Line on Active Row Bottom Border */}
                    <ChapterRowBottomProgress chapter={ch} isCurrent={isCurrent} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <footer className="max-w-7xl mx-auto px-6 md:px-12 pt-4 pb-2 border-t border-[#D8C9A9]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#D8C9A9]/65">
        <span>
          © 2026 Dấu Ấn Việt 3D ·{' '}
          <span className="font-medium text-[#C9A46A]">Made by Hoang Hai</span>
        </span>
        <span className="text-[#D8C9A9]/50">
          {globalLang === 'en'
            ? 'Heritage Audio Guide Studio'
            : globalLang === 'zh'
            ? '遗产多语种语音导览'
            : 'Hệ thống Thuyết minh Di sản Đa ngôn ngữ'}
        </span>
      </footer>

      {/* ====================================================================
          3. FIXED BOTTOM AUDIO PLAYER (MINIMALIST MUSEUM AUDIO BAR)
         ==================================================================== */}
      <div
        role="region"
        aria-label={
          globalLang === 'en'
            ? 'Audio Guide Controls'
            : globalLang === 'zh'
            ? '语音导览控制栏'
            : 'Thanh điều khiển Thuyết minh Di sản'
        }
        className="fixed bottom-0 inset-x-0 z-40 h-20 bg-[#171817]/95 backdrop-blur-md border-t border-[#D8C9A9]/20 px-4 sm:px-6 md:px-12"
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-3 sm:gap-6">
          {/* LEFT CLUSTER: 44px × 44px Thumbnail + Active Chapter + Monument Name */}
          <div className="flex items-center gap-3 min-w-0 w-36 sm:w-56 md:w-64 shrink-0">
            <div className="w-16 aspect-video shrink-0 bg-[#171817] border border-[#D8C9A9]/15 overflow-hidden">
              {hasValidFooterThumb ? (
                <HeritageSmoothImage
                  src={footerThumbUrl}
                  alt={localizedSite.officialName}
                  waitTone="dark"
                  onError={() => markPhotoFailed(footerThumbUrl)}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <PigmentFallbackPlate
                  site={currentSite}
                  slotIndex={selectedChapterIdx}
                  title={localizedSite.officialName}
                  compactLabel={String(selectedChapterIdx + 1).padStart(2, '0')}
                  size="thumb"
                />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[13.5px] font-medium text-[#D8C9A9] truncate leading-tight">
                  {activeChapter?.title || localizedSite.officialName}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <span className="text-[11.5px] text-[#C9A46A] truncate leading-tight">
                  {localizedSite.officialName}
                </span>
                {isUsingCustomAudio && customAudio ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-[3px] bg-[#47796D] text-[#F7F3EB] text-[9.5px] font-medium tracking-[0.01em] shrink-0 leading-none">
                    {globalLang === 'en'
                      ? 'Narrator Recording'
                      : globalLang === 'zh'
                      ? '讲解员原声'
                      : 'Bản thu âm thuyết minh viên'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-[3px] border border-[#C9A46A]/40 bg-[#C9A46A]/15 text-[#C9A46A] text-[9.5px] font-medium shrink-0 leading-none">
                    {globalLang === 'en'
                      ? 'AI Voice'
                      : globalLang === 'zh'
                      ? 'AI 语音'
                      : 'Giọng đọc AI'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CENTER CLUSTER: Transport Controls + Interactive Scrubber */}
          <div className="flex-1 max-w-xl flex flex-col items-center justify-center gap-1 min-w-0">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tick');
                  prevChapter();
                }}
                disabled={selectedChapterIdx === 0 || isUsingCustomAudio}
                className="text-[#D8C9A9] hover:text-[#C9A46A] disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
                aria-label={
                  globalLang === 'en'
                    ? 'Previous chapter'
                    : globalLang === 'zh'
                    ? '上一章'
                    : 'Chương trước'
                }
              >
                <SkipBack className="w-4 h-4" strokeWidth={1.75} />
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerPlayButtonHaptic();
                  togglePlayPause();
                }}
                className={`w-[38px] h-[38px] rounded-full bg-[#A94F3D] hover:bg-[#A94F3D]/85 text-[#D8C9A9] flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 ${
                  isPlayHapticPulsing ? 'haptic-tactile-pulse' : ''
                }`}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('tick');
                  nextChapter();
                }}
                disabled={selectedChapterIdx >= chapters.length - 1 || isUsingCustomAudio}
                className="text-[#D8C9A9] hover:text-[#C9A46A] disabled:opacity-30 transition-colors cursor-pointer active:scale-95"
                aria-label={
                  globalLang === 'en'
                    ? 'Next chapter'
                    : globalLang === 'zh'
                    ? '下一章'
                    : 'Chương tiếp'
                }
              >
                <SkipForward className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="w-full flex items-center gap-2.5">
              <EditorialElapsedClock />
              <EditorialLinearScrubber />
              <span className="text-[11px] text-[#D8C9A9]/65 tabular-nums w-10 shrink-0">
                {formatClock(totalDurationSec)}
              </span>
            </div>
          </div>

          {/* RIGHT CLUSTER: Speed (1.0x/1.25x/1.5x) + Volume Mute/Unmute + Voice Language (VI/EN/ZH) */}
          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={cycleSpeed}
              className="px-2.5 h-7 border border-[#D8C9A9]/25 hover:border-[#C9A46A] text-[11.5px] font-medium text-[#D8C9A9] tabular-nums transition-colors cursor-pointer"
              title={
                globalLang === 'en'
                  ? 'Playback speed (1.0x / 1.25x / 1.5x)'
                  : globalLang === 'zh'
                  ? '语速调节 (1.0x / 1.25x / 1.5x)'
                  : 'Tốc độ đọc (1.0x / 1.25x / 1.5x)'
              }
            >
              {playbackSpeed === 1 ? '1.0x' : `${playbackSpeed}x`}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="w-7 h-7 flex items-center justify-center border border-[#D8C9A9]/25 hover:border-[#C9A46A] text-[#D8C9A9] transition-colors cursor-pointer"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              title={
                isMuted
                  ? globalLang === 'en'
                    ? 'Unmute audio'
                    : globalLang === 'zh'
                    ? '取消静音'
                    : 'Bật âm thanh'
                  : globalLang === 'en'
                  ? 'Mute audio'
                  : globalLang === 'zh'
                  ? '静音'
                  : 'Tắt tiếng'
              }
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#A94F3D]" strokeWidth={1.75} />
              ) : (
                <Volume2 className="w-3.5 h-3.5" strokeWidth={1.75} />
              )}
            </button>

            <div
              className="hidden sm:inline-flex items-center border border-[#D8C9A9]/25"
              role="group"
              aria-label="Voice language"
            >
              {(['vi', 'en', 'zh'] as Language[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setGlobalLang(code)}
                  className={`px-2 h-[26px] text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-colors cursor-pointer ${
                    globalLang === code
                      ? 'bg-[#C9A46A] text-[#171817]'
                      : 'text-[#D8C9A9]/70 hover:text-[#D8C9A9]'
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

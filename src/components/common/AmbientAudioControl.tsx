import React, { useEffect, useRef, useState } from 'react';
import { useAmbientAudio } from '../../contexts/AmbientAudioContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import {
  getLocalizedTrackSubtitle,
  getLocalizedTrackTitle,
} from '../../utils/ambientAudioEngine';
import { getSpatialProfileLabel } from '../../utils/spatial3DAmbientEngine';
import { triggerHaptic, HapticPattern } from '../../utils/haptics';

interface AmbientAudioControlProps {
  /** Horizontal alignment for the floating mini-player popover */
  popoverAlign?: 'right' | 'left';
  /** Vertical placement for the floating mini-player popover */
  popoverPlacement?: 'bottom' | 'top';
}

type PopoverViewMode = 'player' | 'mixer';

export const AmbientAudioControl: React.FC<AmbientAudioControlProps> = ({
  popoverAlign = 'right',
  popoverPlacement = 'bottom',
}) => {
  const { lang } = useI18n();
  const { openAuthModal } = useAuth();
  const {
    playlist,
    currentTrack,
    currentTrackIndex,
    playbackMode,
    isMuted,
    isPlaying,
    isDucked,
    isPausedForVideo,
    isEnabledByAdmin,
    isLockedForGuest,
    hasUserInteracted,
    volume,
    voiceVolume,
    isVoiceMuted,
    isNarrationActive,
    spatialVolume,
    isSpatialMuted,
    isSpatial3DActive,
    isSpatialPlaying,
    isSpatialPreviewing,
    spatialProfile,
    togglePlayPause,
    nextTrack,
    prevTrack,
    selectTrack,
    togglePlaybackMode,
    setVolume,
    setVoiceVolume,
    toggleVoiceMute,
    setSpatialVolume,
    toggleSpatialMute,
    setSpatialPreviewing,
    resetMixerDefaults,
    markUserInteracted,
  } = useAmbientAudio();

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [viewMode, setViewMode] = useState<PopoverViewMode>('player');
  const [hapticTarget, setHapticTarget] = useState<
    'header' | 'play' | 'prev' | 'next' | 'mode' | null
  >(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hapticTimerRef = useRef<number | null>(null);

  const fireAudioHaptic = (
    target: 'header' | 'play' | 'prev' | 'next' | 'mode',
    pattern: HapticPattern = 'pulse'
  ) => {
    triggerHaptic(pattern);
    if (hapticTimerRef.current !== null) {
      window.clearTimeout(hapticTimerRef.current);
    }
    setHapticTarget(null);
    window.requestAnimationFrame(() => {
      setHapticTarget(target);
      hapticTimerRef.current = window.setTimeout(() => {
        setHapticTarget(null);
        hapticTimerRef.current = null;
      }, 280);
    });
  };

  useEffect(() => {
    return () => {
      if (hapticTimerRef.current !== null) {
        window.clearTimeout(hapticTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPopoverOpen) {
      setSpatialPreviewing(false);
      return;
    }
    const handleOutside = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPopoverOpen(false);
    };
    document.addEventListener('pointerdown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isPopoverOpen, setSpatialPreviewing]);

  const handleTriggerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    fireAudioHaptic('header', 'soft');
    if (!isLockedForGuest) {
      markUserInteracted();
    }
    setIsPopoverOpen((prev) => !prev);
  };

  const isSoundWaveAnimating =
    !isLockedForGuest &&
    ((isPlaying && !isMuted && !isPausedForVideo) ||
      (isSpatialPlaying && !isPausedForVideo));
  const isAllAmbientSilent =
    isLockedForGuest || (isMuted && (!isSpatialPlaying || isSpatialMuted));
  const activeTitle = getLocalizedTrackTitle(currentTrack, lang);
  const activeSubtitle = getLocalizedTrackSubtitle(currentTrack, lang);
  const spatialProfileDesc = getSpatialProfileLabel(spatialProfile, lang);

  const playerHeading =
    lang === 'en'
      ? 'Heritage Ambience'
      : lang === 'zh'
      ? '遗产背景雅乐'
      : 'Nhạc nền Di sản';

  const statusText = !isEnabledByAdmin
    ? lang === 'en'
      ? 'Disabled in Admin Studio'
      : lang === 'zh'
      ? '后台已停用'
      : 'Đang tắt từ Admin Studio'
    : isPausedForVideo
    ? lang === 'en'
      ? 'Paused for documentary video'
      : lang === 'zh'
      ? '纪录片播放时自动暂停'
      : 'Tạm dừng khi xem video tư liệu'
    : isDucked
    ? lang === 'en'
      ? 'Playing · Ducked to 5% for narration'
      : lang === 'zh'
      ? '播放中 · 导览语音时降至 5%'
      : 'Đang phát · Giảm 5% khi thuyết minh'
    : isPlaying && !isMuted
    ? lang === 'en'
      ? 'Now playing'
      : lang === 'zh'
      ? '正在播放'
      : 'Đang phát'
    : isMuted
    ? lang === 'en'
      ? 'Paused'
      : lang === 'zh'
      ? '已暂停'
      : 'Tạm dừng'
    : !hasUserInteracted
    ? lang === 'en'
      ? 'Ready · Starts on interaction'
      : lang === 'zh'
      ? '就绪 · 轻触后自动渐入'
      : 'Sẵn sàng · Tự phát khi tương tác'
    : lang === 'en'
    ? 'Paused'
    : lang === 'zh'
    ? '已暂停'
    : 'Tạm dừng';

  const modeLabel =
    playbackMode === 'auto_next'
      ? lang === 'en'
        ? 'Auto-next'
        : lang === 'zh'
        ? '顺序连播'
        : 'Tự chuyển bài'
      : lang === 'en'
      ? 'Repeat 1'
      : lang === 'zh'
      ? '单曲循环'
      : 'Lặp 1 bài';

  const modeTitle =
    playbackMode === 'auto_next'
      ? lang === 'en'
        ? 'Auto-next playlist (click to switch to Repeat One)'
        : lang === 'zh'
        ? '当前为自动顺序连播（点击切换为单曲循环）'
        : 'Đang bật Tự động chuyển bài (nhấn để chuyển sang Lặp lại 1 bài)'
      : lang === 'en'
      ? 'Repeat current track (click to switch to Auto-next)'
      : lang === 'zh'
      ? '当前为单曲循环（点击切换为顺序连播）'
      : 'Đang bật Lặp lại 1 bài (nhấn để chuyển sang Tự động chuyển bài)';

  const tracklistLabel =
    lang === 'en'
      ? 'Curated Tracklist'
      : lang === 'zh'
      ? '雅乐曲目单'
      : 'Danh sách bài hát';

  const triggerAriaLabel =
    lang === 'en'
      ? `Heritage Ambience & Global Sound Mixer (${isSoundWaveAnimating ? 'Playing' : 'Paused'})`
      : lang === 'zh'
      ? `遗产背景音乐与全局混音台（${isSoundWaveAnimating ? '播放中' : '已暂停'}）`
      : `Trình phát Nhạc nền & Bộ trộn âm thanh (${isSoundWaveAnimating ? 'Đang phát' : 'Tạm dừng'})`;

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={handleTriggerClick}
        aria-label={triggerAriaLabel}
        aria-expanded={isPopoverOpen}
        aria-haspopup="dialog"
        title={`${playerHeading} · ${activeTitle}`}
        className={`w-[34px] h-[34px] rounded-full bg-[#171817] border transition-colors duration-200 flex items-center justify-center cursor-pointer select-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A46A]/70 ${
          isPopoverOpen
            ? 'border-[#C9A46A] text-[#C9A46A]'
            : 'border-[#C9A46A]/40 hover:border-[#C9A46A] text-[#C9A46A]'
        } ${hapticTarget === 'header' ? 'haptic-tactile-pulse' : ''}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className={
            isSoundWaveAnimating
              ? 'animate-pulse transition-opacity duration-300'
              : 'transition-opacity duration-300'
          }
        >
          <g
            stroke="#C9A46A"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={
              isAllAmbientSilent
                ? 'opacity-60'
                : isDucked
                ? 'opacity-75'
                : 'opacity-100'
            }
          >
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </g>
          {isAllAmbientSilent && (
            <line
              x1="3.5"
              y1="3.5"
              x2="20.5"
              y2="20.5"
              stroke="#C9A46A"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>

      {/* Museum Popover Mini-Player & Global Sound Mixer */}
      {isPopoverOpen && (
        <div
          role="dialog"
          aria-label={
            viewMode === 'mixer'
              ? lang === 'en'
                ? 'Global Sound Mixer'
                : lang === 'zh'
                ? '全局混音台'
                : 'Bộ trộn Âm thanh Tổng'
              : playerHeading
          }
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            popoverPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            popoverAlign === 'left' ? 'left-0' : 'right-0'
          } w-[320px] max-w-[calc(100vw-24px)] rounded-2xl bg-[#171817] border border-[#C9A46A]/35 shadow-[0_22px_50px_rgba(0,0,0,0.65)] text-[#D8C9A9] z-[95] overflow-hidden whitespace-normal`}
        >
          <div className="relative min-h-[300px]">
            <div
              aria-hidden={isLockedForGuest || undefined}
              className={isLockedForGuest ? 'pointer-events-none select-none opacity-45' : undefined}
            >
          {/* Segmented Mode Header: Player vs Global Sound Mixer */}
          <div className="px-3.5 pt-3 pb-2.5 border-b border-[#D8C9A9]/12 flex items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label={
                lang === 'en'
                  ? 'Audio player view'
                  : lang === 'zh'
                  ? '音频面板切换'
                  : 'Chuyển chế độ âm thanh'
              }
              className="flex-1 grid grid-cols-2 p-0.5 rounded-lg bg-[#D8C9A9]/8 border border-[#D8C9A9]/12"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'player'}
                onClick={() => {
                  setViewMode('player');
                  setSpatialPreviewing(false);
                }}
                className={`py-1.5 px-2.5 rounded-md text-[11px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'player'
                    ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                    : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M6.2 12.2V4.3L13 3V10.9"
                    stroke="currentColor"
                    strokeWidth="1.45"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="4.6" cy="12.2" r="1.6" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="11.4" cy="10.9" r="1.6" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                <span>
                  {lang === 'en' ? 'Player' : lang === 'zh' ? '播放器' : 'Trình phát'}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'mixer'}
                onClick={() => setViewMode('mixer')}
                className={`py-1.5 px-2.5 rounded-md text-[11px] font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'mixer'
                    ? 'bg-[#C9A46A] text-[#171817] font-semibold'
                    : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <line x1="3.5" y1="2.5" x2="3.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="3.5" cy="6" r="1.6" fill="currentColor" />
                  <line x1="8" y1="2.5" x2="8" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="8" cy="10.5" r="1.6" fill="currentColor" />
                  <line x1="12.5" y1="2.5" x2="12.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <circle cx="12.5" cy="7.5" r="1.6" fill="currentColor" />
                </svg>
                <span>
                  {lang === 'en' ? 'Sound Mixer' : lang === 'zh' ? '全局混音' : 'Bộ trộn âm'}
                </span>
              </button>
            </div>
          </div>

          {viewMode === 'player' ? (
            <>
              {/* Top Now-Playing Section */}
              <div className="px-4 pt-3 pb-3 border-b border-[#D8C9A9]/12">
                <div className="flex items-center justify-between gap-2 text-[10.5px] text-[#D8C9A9]/65">
                  <span className="tracking-wide font-medium text-[#C9A46A]">{playerHeading}</span>
                  <span className="tabular-nums">
                    {String(currentTrackIndex + 1).padStart(2, '0')} /{' '}
                    {String(playlist.length).padStart(2, '0')}
                  </span>
                </div>

                <div className="mt-1.5 min-w-0">
                  <div className="text-[14px] font-semibold text-[#D8C9A9] leading-snug truncate">
                    {activeTitle}
                  </div>
                  <div className="text-[11px] text-[#D8C9A9]/65 truncate mt-0.5">
                    {activeSubtitle}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 text-[10.5px]">
                  <span
                    className={
                      isPlaying && !isMuted
                        ? 'text-[#C9A46A] font-medium'
                        : isPausedForVideo
                        ? 'text-[#526D8B]'
                        : 'text-[#D8C9A9]/60'
                    }
                  >
                    {statusText}
                  </span>
                  {currentTrack.sourceType === 'synth' && (
                    <span className="text-[#D8C9A9]/45 tabular-nums">01:30</span>
                  )}
                </div>
              </div>

              {/* Transport Controls + Playback Mode + Music Volume */}
              <div className="px-4 py-3 border-b border-[#D8C9A9]/12 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Previous Track */}
                    <button
                      type="button"
                      onClick={() => {
                        fireAudioHaptic('prev', 'tick');
                        prevTrack();
                      }}
                      disabled={!isEnabledByAdmin || playlist.length === 0}
                      aria-label={
                        lang === 'en' ? 'Previous track' : lang === 'zh' ? '上一首' : 'Bài trước'
                      }
                      title={
                        lang === 'en' ? 'Previous track' : lang === 'zh' ? '上一首' : 'Bài trước'
                      }
                      className={`w-8 h-8 rounded-full border border-[#D8C9A9]/20 hover:border-[#C9A46A]/60 text-[#D8C9A9] hover:text-[#C9A46A] flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-40 ${
                        hapticTarget === 'prev' ? 'haptic-tactile-pulse' : ''
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M4 3.5V12.5M12.2 4.1L6.4 8L12.2 11.9V4.1Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {/* Play / Pause */}
                    <button
                      type="button"
                      onClick={() => {
                        fireAudioHaptic('play', 'pulse');
                        togglePlayPause();
                      }}
                      disabled={!isEnabledByAdmin}
                      aria-label={
                        isPlaying && !isMuted
                          ? lang === 'en'
                            ? 'Pause'
                            : lang === 'zh'
                            ? '暂停'
                            : 'Tạm dừng'
                          : lang === 'en'
                          ? 'Play'
                          : lang === 'zh'
                          ? '播放'
                          : 'Phát nhạc'
                      }
                      title={
                        isPlaying && !isMuted
                          ? lang === 'en'
                            ? 'Pause'
                            : lang === 'zh'
                            ? '暂停'
                            : 'Tạm dừng'
                          : lang === 'en'
                          ? 'Play'
                          : lang === 'zh'
                          ? '播放'
                          : 'Phát nhạc'
                      }
                      className={`w-9 h-9 rounded-full bg-[#C9A46A] hover:bg-[#D8C9A9] text-[#171817] flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-40 ${
                        hapticTarget === 'play' ? 'haptic-tactile-pulse' : ''
                      }`}
                    >
                      {isPlaying && !isMuted ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <rect x="4" y="3.2" width="2.6" height="9.6" rx="0.8" fill="currentColor" />
                          <rect x="9.4" y="3.2" width="2.6" height="9.6" rx="0.8" fill="currentColor" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                          <path d="M5 3.4L12.6 8L5 12.6V3.4Z" fill="currentColor" />
                        </svg>
                      )}
                    </button>

                    {/* Next Track */}
                    <button
                      type="button"
                      onClick={() => {
                        fireAudioHaptic('next', 'tick');
                        nextTrack();
                      }}
                      disabled={!isEnabledByAdmin || playlist.length === 0}
                      aria-label={
                        lang === 'en' ? 'Next track' : lang === 'zh' ? '下一首' : 'Bài tiếp theo'
                      }
                      title={
                        lang === 'en' ? 'Next track' : lang === 'zh' ? '下一首' : 'Bài tiếp theo'
                      }
                      className={`w-8 h-8 rounded-full border border-[#D8C9A9]/20 hover:border-[#C9A46A]/60 text-[#D8C9A9] hover:text-[#C9A46A] flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-40 ${
                        hapticTarget === 'next' ? 'haptic-tactile-pulse' : ''
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M12 3.5V12.5M3.8 4.1L9.6 8L3.8 11.9V4.1Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Playback Mode Toggle: Auto-next vs Repeat One */}
                  <button
                    type="button"
                    onClick={() => {
                      fireAudioHaptic('mode', 'tick');
                      togglePlaybackMode();
                    }}
                    disabled={!isEnabledByAdmin}
                    title={modeTitle}
                    aria-label={modeTitle}
                    className={`h-8 px-2.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 whitespace-nowrap shrink-0 disabled:opacity-40 ${
                      playbackMode === 'auto_next'
                        ? 'bg-[#47796D]/22 border-[#47796D]/70 text-[#D8C9A9]'
                        : 'bg-[#C9A46A]/18 border-[#C9A46A]/65 text-[#C9A46A]'
                    } ${hapticTarget === 'mode' ? 'haptic-tactile-pulse' : ''}`}
                  >
                    {playbackMode === 'auto_next' ? (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M2.5 5H11.5L9.4 2.9M13.5 11H4.5L6.6 13.1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M3 6.2C3 4.5 4.3 3.2 6 3.2H12.2L10.4 1.6M13 9.8C13 11.5 11.7 12.8 10 12.8H3.8L5.6 14.4"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.1 6.2V9.8M7.1 7L8.1 6.2"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    <span>{modeLabel}</span>
                  </button>
                </div>

                {/* Quick Music Volume Slider (0% - 100%, default 25%) */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={togglePlayPause}
                    disabled={!isEnabledByAdmin}
                    aria-label={
                      isMuted
                        ? lang === 'en'
                          ? 'Unmute background music'
                          : lang === 'zh'
                          ? '取消背景音乐静音'
                          : 'Bật nhạc nền'
                        : lang === 'en'
                        ? 'Mute background music'
                        : lang === 'zh'
                        ? '静音背景音乐'
                        : 'Tắt tiếng nhạc nền'
                    }
                    className="text-[#C9A46A]/85 hover:text-[#C9A46A] transition-colors shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M3 6.2H5.6L9 3.5V12.5L5.6 9.8H3V6.2Z"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinejoin="round"
                      />
                      {isMuted || volume === 0 ? (
                        <path
                          d="M11.3 6.2L14 9.8M14 6.2L11.3 9.8"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      ) : (
                        <path
                          d="M11.4 5.7C12.3 6.6 12.3 9.4 11.4 10.3"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={volume}
                    disabled={!isEnabledByAdmin}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    aria-label={
                      lang === 'en'
                        ? 'Background Music volume'
                        : lang === 'zh'
                        ? '背景音乐音量'
                        : 'Âm lượng nhạc nền'
                    }
                    style={{
                      background: `linear-gradient(to right, #C9A46A 0%, #C9A46A ${volume}%, rgba(216,201,169,0.2) ${volume}%, rgba(216,201,169,0.2) 100%)`,
                    }}
                    className="heritage-volume-slider w-full cursor-pointer disabled:opacity-40"
                  />

                  <span className="text-[11px] font-semibold text-[#C9A46A] tabular-nums w-8 text-right shrink-0">
                    {volume}%
                  </span>
                </div>
              </div>

              {/* Curated Tracklist */}
              <div className="px-2.5 pt-2.5 pb-2.5">
                <div className="px-1.5 pb-1.5 flex items-center justify-between text-[10.5px] text-[#D8C9A9]/55">
                  <span>{tracklistLabel}</span>
                  <span className="tabular-nums">
                    {playlist.length}{' '}
                    {lang === 'en' ? 'tracks' : lang === 'zh' ? '首曲目' : 'bản nhạc'}
                  </span>
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5">
                  {playlist.map((track, idx) => {
                    const isSelected = track.id === currentTrack.id;
                    const isThisPlaying = isSelected && isPlaying && !isMuted && !isPausedForVideo;
                    const trackTitle = getLocalizedTrackTitle(track, lang);
                    const trackSub = getLocalizedTrackSubtitle(track, lang);

                    return (
                      <button
                        key={track.id}
                        type="button"
                        disabled={!isEnabledByAdmin}
                        onClick={() => {
                          triggerHaptic('selection');
                          selectTrack(track.id);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center gap-2.5 transition-colors cursor-pointer disabled:opacity-45 ${
                          isSelected
                            ? 'bg-[#C9A46A]/14 border border-[#C9A46A]/45'
                            : 'border border-transparent hover:bg-[#D8C9A9]/8'
                        }`}
                      >
                        <span
                          className={`text-[10.5px] font-semibold tabular-nums w-4 shrink-0 text-center ${
                            isSelected ? 'text-[#C9A46A]' : 'text-[#D8C9A9]/45'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>

                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs font-semibold truncate ${
                              isSelected ? 'text-[#C9A46A]' : 'text-[#D8C9A9]'
                            }`}
                          >
                            {trackTitle}
                          </div>
                          <div className="text-[10.5px] text-[#D8C9A9]/58 truncate mt-0.5">
                            {trackSub}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="shrink-0 flex items-center justify-center w-5 h-5">
                            <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                              <line
                                x1="4.5"
                                y1="6.5"
                                x2="4.5"
                                y2="11.5"
                                stroke="#C9A46A"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                className={isThisPlaying ? 'ambient-wave-bar-1' : undefined}
                              />
                              <line
                                x1="9"
                                y1="4"
                                x2="9"
                                y2="14"
                                stroke="#C9A46A"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                className={isThisPlaying ? 'ambient-wave-bar-2' : undefined}
                              />
                              <line
                                x1="13.5"
                                y1="6"
                                x2="13.5"
                                y2="12"
                                stroke="#C9A46A"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                className={isThisPlaying ? 'ambient-wave-bar-3' : undefined}
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* ================================================================
               GLOBAL SOUND MIXER VIEW (3 INDEPENDENT CHANNELS)
            ================================================================ */
            <div className="px-4 py-3.5 space-y-3.5">
              {/* Mixer Title & Reset */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[13px] font-serif font-semibold text-[#D8C9A9]">
                    {lang === 'en'
                      ? 'Global Sound Mixer'
                      : lang === 'zh'
                      ? '全局声景混音台'
                      : 'Bộ trộn Âm thanh Tổng'}
                  </div>
                  <div className="text-[10.5px] text-[#D8C9A9]/58 mt-0.5">
                    {lang === 'en'
                      ? 'Independent volume channels'
                      : lang === 'zh'
                      ? '独立调节三路博物馆音轨'
                      : 'Điều chỉnh độc lập 3 kênh âm thanh'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetMixerDefaults}
                  className="px-2.5 py-1 rounded-md border border-[#D8C9A9]/18 hover:border-[#C9A46A]/65 text-[10.5px] font-medium text-[#D8C9A9]/80 hover:text-[#C9A46A] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {lang === 'en' ? 'Reset' : lang === 'zh' ? '重置默认' : 'Mặc định'}
                </button>
              </div>

              {/* Channel 1: Background Music */}
              <div className="pt-3 border-t border-[#D8C9A9]/12 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      disabled={!isEnabledByAdmin}
                      aria-label={
                        lang === 'en'
                          ? 'Toggle Background Music mute'
                          : lang === 'zh'
                          ? '切换背景音乐静音'
                          : 'Bật/tắt Nhạc nền'
                      }
                      className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:opacity-40 ${
                        isMuted || volume === 0
                          ? 'border-[#D8C9A9]/15 text-[#D8C9A9]/45 hover:text-[#D8C9A9]'
                          : 'border-[#C9A46A]/45 bg-[#C9A46A]/12 text-[#C9A46A]'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M6.2 12.2V4.3L13 3V10.9"
                          stroke="currentColor"
                          strokeWidth="1.45"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="4.6" cy="12.2" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                        <circle cx="11.4" cy="10.9" r="1.5" stroke="currentColor" strokeWidth="1.4" />
                        {(isMuted || volume === 0) && (
                          <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        )}
                      </svg>
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#D8C9A9] truncate">
                        {lang === 'en'
                          ? 'Background Music'
                          : lang === 'zh'
                          ? '背景音乐'
                          : 'Nhạc nền Di sản'}
                      </div>
                      <div className="text-[10.5px] text-[#D8C9A9]/58 truncate">
                        {isDucked
                          ? lang === 'en'
                            ? 'Auto-ducked during narration'
                            : lang === 'zh'
                            ? '讲解期间自动柔和降音'
                            : 'Tự giảm nhẹ khi thuyết minh'
                          : activeTitle}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#C9A46A] tabular-nums w-9 text-right shrink-0">
                    {volume}%
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={volume}
                  disabled={!isEnabledByAdmin}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  aria-label={
                    lang === 'en'
                      ? 'Background Music volume'
                      : lang === 'zh'
                      ? '背景音乐音量'
                      : 'Âm lượng Nhạc nền Di sản'
                  }
                  style={{
                    background: `linear-gradient(to right, #C9A46A 0%, #C9A46A ${volume}%, rgba(216,201,169,0.18) ${volume}%, rgba(216,201,169,0.18) 100%)`,
                  }}
                  className="heritage-volume-slider w-full cursor-pointer disabled:opacity-40"
                />
              </div>

              {/* Channel 2: Voice Narrations */}
              <div className="pt-3 border-t border-[#D8C9A9]/12 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={toggleVoiceMute}
                      aria-label={
                        lang === 'en'
                          ? 'Toggle Voice Narrations mute'
                          : lang === 'zh'
                          ? '切换语音导览静音'
                          : 'Bật/tắt Giọng thuyết minh'
                      }
                      className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isVoiceMuted || voiceVolume === 0
                          ? 'border-[#D8C9A9]/15 text-[#D8C9A9]/45 hover:text-[#D8C9A9]'
                          : 'border-[#A94F3D]/60 bg-[#A94F3D]/18 text-[#E8B3A7]'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="5.8" y="2.2" width="4.4" height="7.4" rx="2.2" stroke="currentColor" strokeWidth="1.4" />
                        <path
                          d="M3.6 7.8C3.6 10.2 5.6 12.1 8 12.1C10.4 12.1 12.4 10.2 12.4 7.8M8 12.1V14"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        {(isVoiceMuted || voiceVolume === 0) && (
                          <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        )}
                      </svg>
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#D8C9A9] truncate">
                        {lang === 'en'
                          ? 'Voice Narrations'
                          : lang === 'zh'
                          ? '语音导览与讲解'
                          : 'Thuyết minh & Giọng đọc'}
                      </div>
                      <div className="text-[10.5px] text-[#D8C9A9]/58 truncate">
                        {isNarrationActive
                          ? lang === 'en'
                            ? 'Narration currently speaking'
                            : lang === 'zh'
                            ? '正在播报导览讲解'
                            : 'Đang phát thuyết minh bảo tàng'
                          : lang === 'en'
                          ? 'Audio Guide & Royal Historiographer'
                          : lang === 'zh'
                          ? '语音导览与史官讲解'
                          : 'Thuyết minh bảo tàng & Sử Quan Dấu Ấn'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#D8C9A9] tabular-nums w-9 text-right shrink-0">
                    {voiceVolume}%
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={voiceVolume}
                  onChange={(e) => setVoiceVolume(Number(e.target.value))}
                  aria-label={
                    lang === 'en'
                      ? 'Voice Narrations volume'
                      : lang === 'zh'
                      ? '语音导览音量'
                      : 'Âm lượng Thuyết minh và Giọng đọc'
                  }
                  style={{
                    background: `linear-gradient(to right, #A94F3D 0%, #A94F3D ${voiceVolume}%, rgba(216,201,169,0.18) ${voiceVolume}%, rgba(216,201,169,0.18) 100%)`,
                  }}
                  className="heritage-volume-slider w-full cursor-pointer"
                />
              </div>

              {/* Channel 3: 3D Spatial Ambient Sounds */}
              <div className="pt-3 border-t border-[#D8C9A9]/12 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={toggleSpatialMute}
                      aria-label={
                        lang === 'en'
                          ? 'Toggle 3D Spatial Ambient Sounds mute'
                          : lang === 'zh'
                          ? '切换 3D 空间环境音静音'
                          : 'Bật/tắt Âm thanh Không gian 3D'
                      }
                      className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        isSpatialMuted || spatialVolume === 0
                          ? 'border-[#D8C9A9]/15 text-[#D8C9A9]/45 hover:text-[#D8C9A9]'
                          : 'border-[#47796D]/75 bg-[#47796D]/20 text-[#9FD0C4]'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M2.2 6.2H9.6C10.7 6.2 11.6 5.3 11.6 4.2C11.6 3.1 10.7 2.3 9.6 2.3C8.8 2.3 8.2 2.7 7.9 3.3"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M2.2 9.2H12.2C13.3 9.2 14.1 10 14.1 11.1C14.1 12.1 13.3 12.9 12.2 12.9C11.4 12.9 10.8 12.5 10.5 11.9"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <path
                          d="M2.2 12H7.4"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        {(isSpatialMuted || spatialVolume === 0) && (
                          <line x1="2.5" y1="2.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        )}
                      </svg>
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#D8C9A9] truncate">
                          {lang === 'en'
                            ? '3D Spatial Ambient Sounds'
                            : lang === 'zh'
                            ? '3D 空间环境音'
                            : 'Âm thanh Không gian 3D'}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-[#D8C9A9]/58 truncate">
                        {isSpatial3DActive
                          ? `${spatialProfileDesc}`
                          : isSpatialPreviewing
                          ? lang === 'en'
                            ? `Previewing · ${spatialProfileDesc}`
                            : lang === 'zh'
                            ? `试听中 · ${spatialProfileDesc}`
                            : `Đang nghe thử · ${spatialProfileDesc}`
                          : lang === 'en'
                          ? 'Wind & street ambience · Auto in 3D'
                          : lang === 'zh'
                          ? '风声与街景声 · 进入 3D 自动开启'
                          : 'Gió & phố cổ · Tự bật khi xem 3D'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isSpatial3DActive && (
                      <button
                        type="button"
                        onClick={() => {
                          markUserInteracted();
                          if (spatialVolume === 0) {
                            setSpatialVolume(40);
                          }
                          setSpatialPreviewing(!isSpatialPreviewing);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                          isSpatialPreviewing
                            ? 'bg-[#47796D] border-[#47796D] text-[#F4EFE4]'
                            : 'border-[#D8C9A9]/18 text-[#D8C9A9]/75 hover:border-[#47796D] hover:text-[#D8C9A9]'
                        }`}
                      >
                        {isSpatialPreviewing
                          ? lang === 'en'
                            ? 'Stop'
                            : lang === 'zh'
                            ? '停止'
                            : 'Dừng'
                          : lang === 'en'
                          ? 'Preview'
                          : lang === 'zh'
                          ? '试听'
                          : 'Nghe thử'}
                      </button>
                    )}
                    <span className="text-[11px] font-semibold text-[#8EC2B5] tabular-nums w-9 text-right">
                      {spatialVolume}%
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={spatialVolume}
                  onChange={(e) => setSpatialVolume(Number(e.target.value))}
                  aria-label={
                    lang === 'en'
                      ? '3D Spatial Ambient Sounds volume'
                      : lang === 'zh'
                      ? '3D 空间环境音量'
                      : 'Âm lượng Âm thanh Không gian 3D'
                  }
                  style={{
                    background: `linear-gradient(to right, #47796D 0%, #47796D ${spatialVolume}%, rgba(216,201,169,0.18) ${spatialVolume}%, rgba(216,201,169,0.18) 100%)`,
                  }}
                  className="heritage-volume-slider w-full cursor-pointer"
                />
              </div>

              {/* Saved Preferences Footer Note */}
              <div className="pt-2.5 border-t border-[#D8C9A9]/10 flex items-center justify-between gap-2 text-[10.5px] text-[#D8C9A9]/50">
                <span>
                  {lang === 'en'
                    ? 'Saved automatically to this device'
                    : lang === 'zh'
                    ? '音量偏好已自动保存至本地设备'
                    : 'Tự động lưu tùy chọn trên thiết bị này'}
                </span>
                {isSpatial3DActive && (
                  <span className="text-[#8EC2B5] font-medium whitespace-nowrap">
                    {lang === 'en' ? '3D Active' : lang === 'zh' ? '3D 已激活' : '3D Đang bật'}
                  </span>
                )}
              </div>
            </div>
          )}
            </div>

            {/* Frosted-Glass Members-Only Lock Overlay for Unauthenticated Visitors */}
            {isLockedForGuest && (
              <div
                role="region"
                aria-label={
                  lang === 'en'
                    ? 'Members-Only Feature'
                    : lang === 'zh'
                    ? '会员专属功能'
                    : 'Tính năng dành cho Thành viên'
                }
                className="absolute inset-0 z-20 w-full h-full flex flex-col items-center justify-center text-center px-6 py-8 bg-[#171817]/95 backdrop-blur-md rounded-2xl whitespace-normal"
              >
                <div className="w-12 h-12 rounded-full border border-[#C9A46A]/40 bg-[#171817] flex items-center justify-center mx-auto mb-4 shrink-0 shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <rect
                      x="5"
                      y="11"
                      width="14"
                      height="9.5"
                      rx="2.2"
                      stroke="#C9A46A"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.2 11V7.8C8.2 5.7 9.9 4 12 4C14.1 4 15.8 5.7 15.8 7.8V11"
                      stroke="#C9A46A"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="15.6" r="1.2" fill="#C9A46A" />
                  </svg>
                </div>

                <h3 className="w-full text-center font-serif font-semibold text-base text-[#D8C9A9] leading-snug mb-2 whitespace-normal break-words">
                  {lang === 'en'
                    ? 'Members-Only Feature'
                    : lang === 'zh'
                    ? '会员专属功能'
                    : 'Tính năng dành cho Thành viên'}
                </h3>

                <p className="w-full max-w-[260px] mx-auto text-center text-xs leading-relaxed text-[#D8C9A9]/75 whitespace-normal break-words mb-5">
                  {lang === 'en'
                    ? 'Sign in to enjoy Heritage Ambience and customize the Spatial Sound Mixer.'
                    : lang === 'zh'
                    ? '登录账号即可畅享遗产背景雅乐并自由调节空间混音台。'
                    : 'Đăng nhập tài khoản để thưởng thức Nhạc nền Di sản và tùy chỉnh Bộ trộn âm không gian.'}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsPopoverOpen(false);
                    openAuthModal({
                      prompt:
                        lang === 'en'
                          ? 'Sign in to unlock Heritage Ambience and customize the 3D Spatial Sound Mixer.'
                          : lang === 'zh'
                          ? '登录账号即可解锁遗产背景雅乐并自定义 3D 空间混音台。'
                          : 'Đăng nhập tài khoản để thưởng thức Nhạc nền Di sản và tùy chỉnh Bộ trộn âm không gian.',
                    });
                  }}
                  className="mx-auto px-6 py-2.5 rounded-full bg-[#C9A46A] text-[#171817] font-medium text-sm whitespace-nowrap hover:brightness-110 transition cursor-pointer shadow-lg"
                >
                  {lang === 'en' ? 'Sign in now' : lang === 'zh' ? '立即登录' : 'Đăng nhập ngay'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

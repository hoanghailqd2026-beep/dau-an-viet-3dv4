import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  X,
  Film,
  Play,
  Pause,
  Upload,
  Link2,
  RotateCcw,
  Check,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Video,
} from 'lucide-react';
import { HeritageSite } from '../../types/heritage';
import { HERITAGE_SITES } from '../../data/heritageSites';
import { AUDIO_GUIDE_SCRIPTS } from '../../data/audioGuideScripts';
import { useI18n } from '../../i18n/I18nContext';
import { speechEngine } from '../../utils/chunkedSpeechEngine';
import { HeritageTypographicPlate } from '../common/HeritageTypographicPlate';
import { HeritageSmoothImage } from '../common/HeritageSmoothImage';
import { ArchivalSourcesTrigger } from '../common/ArchivalSourcesTrigger';
import { getHistoricalArchiveForSite } from '../spatial/MuseumHistoricalWidgets';
import {
  HeritageVideoKey,
  HERITAGE_VIDEO_KEYS_ORDERED,
  HERITAGE_VIDEO_DATA,
  HERITAGE_FLYCAM_VIDEOS,
  HERITAGE_ARCHIVE_VIDEOS,
  DOCUMENTARY_TOTAL_DURATION_SEC,
  DocumentaryCameraEffect,
  CustomVideoUrlEntry,
  WikimediaVideoItem,
  resolveHeritageVideoId,
  fetchWikimediaVideosForHeritage,
  loadCustomVideoUrlForHeritage,
  saveCustomVideoUrlForHeritage,
  removeCustomVideoUrlForHeritage,
  saveLocalVideoToIndexedDB,
  loadLocalVideoFromIndexedDB,
  deleteLocalVideoFromIndexedDB,
} from '../../data/heritageFilms';

export interface LocalVideoAsset {
  url: string;
  fileName: string;
}

interface CinemaDocumentaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextSite?: HeritageSite | null;
  sites?: HeritageSite[];
  localVideosMap: Record<string, LocalVideoAsset>;
  onUploadLocalVideo: (targetKey: string, file: File) => void;
  onClearLocalVideo: (targetKey: string) => void;
  onSwitchSite?: (site: HeritageSite) => void;
  onOpenMediaCredits?: (siteId?: string | null) => void;
}

interface ResolvedSceneFrame {
  id: string;
  startSec: number;
  endSec: number;
  cameraEffect: DocumentaryCameraEffect;
  imageUrl: string;
  fallbackUrl: string;
  filterCss?: string;
  sceneLabel: string;
  subtitle: string;
}

function formatTimeSec(sec: number): string {
  const clamped = Math.max(0, Math.min(DOCUMENTARY_TOTAL_DURATION_SEC, Math.floor(sec)));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function computeKenBurnsTransform(effect: DocumentaryCameraEffect, progress: number): string {
  const t = Math.max(0, Math.min(1, progress));
  // Smooth ease-in-out curve for cinematic camera glide
  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  switch (effect) {
    case 'zoom-in': {
      const scale = 1.0 + ease * 0.14;
      const ty = -ease * 1.2;
      return `scale(${scale.toFixed(4)}) translate3d(0%, ${ty.toFixed(2)}%, 0)`;
    }
    case 'pan-right': {
      const scale = 1.11;
      const tx = -2.8 + ease * 5.6;
      return `scale(${scale}) translate3d(${tx.toFixed(2)}%, 0%, 0)`;
    }
    case 'zoom-out': {
      const scale = 1.15 - ease * 0.13;
      const ty = 1.0 - ease * 1.0;
      return `scale(${scale.toFixed(4)}) translate3d(0%, ${ty.toFixed(2)}%, 0)`;
    }
    case 'pan-left': {
      const scale = 1.11;
      const tx = 2.8 - ease * 5.6;
      return `scale(${scale}) translate3d(${tx.toFixed(2)}%, 0%, 0)`;
    }
  }
}

type VideoSourceMode = 'wikimedia' | 'youtube' | 'local';

function formatFileSizeMb(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export const CinemaDocumentaryModal: React.FC<CinemaDocumentaryModalProps> = ({
  isOpen,
  onClose,
  contextSite,
  sites,
  localVideosMap,
  onUploadLocalVideo,
  onClearLocalVideo,
  onSwitchSite,
  onOpenMediaCredits,
}) => {
  const { lang } = useI18n();

  const [activeVideoId, setActiveVideoId] = useState<HeritageVideoKey>(() =>
    resolveHeritageVideoId(contextSite)
  );
  const [sourceMode, setSourceMode] = useState<VideoSourceMode>('youtube');
  const [customUrlEntry, setCustomUrlEntry] = useState<CustomVideoUrlEntry | null>(null);
  const [useCustomYoutubeOverride, setUseCustomYoutubeOverride] = useState<boolean>(false);
  const [idbLocalVideo, setIdbLocalVideo] = useState<LocalVideoAsset | null>(null);
  const [isYouTubePanelOpen, setIsYouTubePanelOpen] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Wikimedia Commons Live Video API States
  const [wikiVideos, setWikiVideos] = useState<WikimediaVideoItem[]>([]);
  const [wikiLoading, setWikiLoading] = useState<boolean>(false);
  const [wikiFetchError, setWikiFetchError] = useState<boolean>(false);
  const [wikiUsedFallbackQuery, setWikiUsedFallbackQuery] = useState<boolean>(false);
  const [selectedWikiIndex, setSelectedWikiIndex] = useState<number>(0);
  const [failedWikiUrls, setFailedWikiUrls] = useState<Record<string, boolean>>({});

  // Documentary Fallback & Ken Burns Player States (45s Ken Burns + Crossfade + Synced Subtitles + TTS)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [failedImagesMap, setFailedImagesMap] = useState<Record<string, boolean>>({});
  const [tier1VideoError, setTier1VideoError] = useState<boolean>(false);
  const [useFlycamBackup, setUseFlycamBackup] = useState<boolean>(false);
  const [useArchiveBackup, setUseArchiveBackup] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const idbObjectUrlRef = useRef<string | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastFrameTsRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const wasOpenRef = useRef<boolean>(false);
  const prevSyncedContextIdRef = useRef<string | null>(null);

  // Sync activeVideoId 1-to-1 when modal opens or external contextSite changes, defaulting to Clip Flycam YouTube
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      prevSyncedContextIdRef.current = null;
      return;
    }
    const nextContextId = contextSite?.id ?? null;
    if (!wasOpenRef.current || nextContextId !== prevSyncedContextIdRef.current) {
      wasOpenRef.current = true;
      prevSyncedContextIdRef.current = nextContextId;
      const lockedId = resolveHeritageVideoId(contextSite);
      setActiveVideoId(lockedId);
      setSourceMode('youtube');
      setUseCustomYoutubeOverride(Boolean(loadCustomVideoUrlForHeritage(lockedId)));
      setCurrentTime(0);
      setIsPlaying(true);
      setIsYouTubePanelOpen(false);
      setSaveFeedback(null);
      setTier1VideoError(false);
      setUseFlycamBackup(false);
      setUseArchiveBackup(false);
      setFailedImagesMap({});
      setSelectedWikiIndex(0);
      setFailedWikiUrls({});
    }
  }, [isOpen, contextSite]);

  // Revoke any managed IndexedDB ObjectURL helper
  const revokeIdbObjectUrl = useCallback(() => {
    if (idbObjectUrlRef.current) {
      try {
        URL.revokeObjectURL(idbObjectUrlRef.current);
      } catch {
        // ignore
      }
      idbObjectUrlRef.current = null;
    }
  }, []);

  // Load saved custom YouTube & IndexedDB .MP4 for activeVideoId
  useEffect(() => {
    if (!isOpen) {
      revokeIdbObjectUrl();
      setIdbLocalVideo(null);
      return;
    }

    let cancelled = false;
    setTier1VideoError(false);

    const savedUrl = loadCustomVideoUrlForHeritage(activeVideoId);
    setCustomUrlEntry(savedUrl);
    setUseCustomYoutubeOverride(Boolean(savedUrl));
    setUrlInput(savedUrl?.originalUrl || '');

    revokeIdbObjectUrl();
    setIdbLocalVideo(null);

    loadLocalVideoFromIndexedDB(activeVideoId)
      .then((record) => {
        if (cancelled) return;
        if (record?.blob) {
          const objUrl = URL.createObjectURL(record.blob);
          idbObjectUrlRef.current = objUrl;
          setIdbLocalVideo({ url: objUrl, fileName: record.fileName });
        }
      })
      .catch(() => {
        // ignore IndexedDB read failure
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeVideoId, revokeIdbObjectUrl]);

  // Fetch Wikimedia Commons Live Video API when user selects the Wikimedia Commons tab
  useEffect(() => {
    if (!isOpen || sourceMode !== 'wikimedia') {
      return;
    }

    if (HERITAGE_ARCHIVE_VIDEOS[activeVideoId]) {
      setWikiLoading(false);
      setWikiFetchError(false);
      setWikiVideos([]);
      setSelectedWikiIndex(0);
      setFailedWikiUrls({});
      return;
    }

    let cancelled = false;
    const abortCtrl = new AbortController();

    setWikiLoading(true);
    setWikiFetchError(false);
    setWikiVideos([]);
    setSelectedWikiIndex(0);
    setFailedWikiUrls({});

    fetchWikimediaVideosForHeritage(activeVideoId, abortCtrl.signal)
      .then((res) => {
        if (cancelled) return;
        setWikiVideos(res.items);
        setWikiUsedFallbackQuery(res.usedFallbackQuery);
        setWikiLoading(false);
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        setWikiLoading(false);
        setWikiFetchError(true);
      });

    return () => {
      cancelled = true;
      abortCtrl.abort();
    };
  }, [isOpen, activeVideoId, sourceMode]);

  const videoEntry = HERITAGE_VIDEO_DATA[activeVideoId];
  const currentVideo = HERITAGE_FLYCAM_VIDEOS[activeVideoId];

  const resolvedSite = useMemo<HeritageSite | undefined>(() => {
    const pool = sites && sites.length > 0 ? sites : HERITAGE_SITES;
    return (
      pool.find((s) => s.id === videoEntry.siteId) ||
      HERITAGE_SITES.find((s) => s.id === videoEntry.siteId)
    );
  }, [sites, videoEntry.siteId]);

  const sessionLocalAsset = localVideosMap[activeVideoId] || localVideosMap[videoEntry.siteId];
  const activeLocalMp4 = sessionLocalAsset || idbLocalVideo;

  const curatedArchive = HERITAGE_ARCHIVE_VIDEOS[activeVideoId] || null;
  const isCuratedArchiveActive = sourceMode === 'wikimedia' && Boolean(curatedArchive);

  const selectedWikiVideo = wikiVideos[selectedWikiIndex] || null;
  const isSelectedWikiPlayable = Boolean(
    sourceMode === 'wikimedia' &&
      !isCuratedArchiveActive &&
      selectedWikiVideo &&
      !failedWikiUrls[selectedWikiVideo.url]
  );

  const isPlayingYoutubeEmbed = sourceMode === 'youtube' && !tier1VideoError;
  const isPlayingLocalMp4 = Boolean(
    sourceMode === 'local' && activeLocalMp4 && !tier1VideoError
  );
  const isExternalStreamActive =
    isCuratedArchiveActive || isSelectedWikiPlayable || isPlayingYoutubeEmbed || isPlayingLocalMp4;

  const activeFlycamVideoId =
    useFlycamBackup && currentVideo.backupVideoId
      ? currentVideo.backupVideoId
      : currentVideo.videoId;
  const flycamEmbedHost = currentVideo.useNoCookie ? 'youtube-nocookie' : 'youtube';
  const flycamEmbedSrc = `https://www.${flycamEmbedHost}.com/embed/${activeFlycamVideoId}?autoplay=1&rel=0`;

  const activeArchiveVideoId = curatedArchive
    ? useArchiveBackup && curatedArchive.backupVideoId
      ? curatedArchive.backupVideoId
      : curatedArchive.videoId
    : '';
  const archiveEmbedSrc = curatedArchive
    ? `https://www.${curatedArchive.embedHost}.com/embed/${activeArchiveVideoId}?autoplay=1&rel=0`
    : '';

  // Build 4 distinct scenes (0->45s) strictly for THIS heritageId using uploaded real/historical photos or archival typographic plate
  const resolvedScenes = useMemo<ResolvedSceneFrame[]>(() => {
    const siteId = videoEntry.siteId;
    const primaryReal = resolvedSite?.photos?.[0] || '';
    const secondaryReal = resolvedSite?.photos?.[1] || primaryReal;
    const historicalArchive = getHistoricalArchiveForSite(siteId);
    const historicalImg = historicalArchive?.url || primaryReal;
    const historicalFilter = historicalArchive?.isFilteredArchival
      ? historicalArchive.filterCss || 'sepia(0.82) contrast(1.12) brightness(0.88)'
      : 'sepia(0.18) contrast(1.06)';

    return videoEntry.scenes.map((scene) => {
      let imageUrl = primaryReal;
      let filterCss: string | undefined;

      if (scene.photoSlot === 'historical') {
        imageUrl = historicalImg;
        filterCss = historicalFilter;
      } else if (scene.photoSlot === 'real_secondary') {
        imageUrl = secondaryReal;
      } else if (scene.photoSlot === 'real_detail') {
        imageUrl = primaryReal;
        filterCss = 'contrast(1.06) saturate(1.08)';
      }

      return {
        id: scene.id,
        startSec: scene.startSec,
        endSec: scene.endSec,
        cameraEffect: scene.cameraEffect,
        imageUrl,
        fallbackUrl: primaryReal,
        filterCss,
        sceneLabel: scene.sceneLabel[lang],
        subtitle: scene.subtitle[lang],
      };
    });
  }, [videoEntry, resolvedSite, lang]);

  // Determine current active scene index based on currentTime (0 -> 45s)
  const activeSceneIndex = useMemo(() => {
    const idx = resolvedScenes.findIndex(
      (s) => currentTime >= s.startSec && currentTime < s.endSec
    );
    return idx >= 0 ? idx : resolvedScenes.length - 1;
  }, [resolvedScenes, currentTime]);

  const activeScene = resolvedScenes[activeSceneIndex] || resolvedScenes[0];

  // 60FPS Ken Burns & Timeline Clock (active whenever fallback documentary stage is visible)
  useEffect(() => {
    if (!isOpen || isExternalStreamActive || !isPlaying) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastFrameTsRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastFrameTsRef.current === null) {
        lastFrameTsRef.current = now;
      }
      const dt = Math.min(0.1, (now - lastFrameTsRef.current) / 1000);
      lastFrameTsRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + dt;
        return next >= DOCUMENTARY_TOTAL_DURATION_SEC ? 0 : next;
      });

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      lastFrameTsRef.current = null;
    };
  }, [isOpen, isExternalStreamActive, isPlaying]);

  // Speech Engine Control for Voice Narration Toggle (🔊 Thuyết minh)
  const stopVoiceNarration = useCallback(() => {
    speechEngine.stop();
    setIsVoiceActive(false);
  }, []);

  const startVoiceNarrationForSite = useCallback(
    (entryKey: HeritageVideoKey) => {
      const entry = HERITAGE_VIDEO_DATA[entryKey];
      const siteScript = AUDIO_GUIDE_SCRIPTS[entry.siteId]?.[lang];
      const fullNarration = siteScript
        ? siteScript.chapters.map((c) => c.narration).join(' ')
        : entry.scenes.map((s) => s.subtitle[lang]).join(' ');

      setIsVoiceActive(true);
      speechEngine.speakText(fullNarration, {
        lang,
        rate: 1,
        onComplete: () => setIsVoiceActive(false),
        onError: () => setIsVoiceActive(false),
      });
    },
    [lang]
  );

  // Stop TTS and HTML5 video cleanly when closing or unmounting (avoid empty src .load() console error)
  const teardownVideoElement = useCallback(() => {
    const el = videoRef.current;
    if (el) {
      try {
        el.pause();
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      teardownVideoElement();
      stopVoiceNarration();
    }
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      teardownVideoElement();
      speechEngine.stop();
      revokeIdbObjectUrl();
    };
  }, [isOpen, teardownVideoElement, stopVoiceNarration, revokeIdbObjectUrl]);

  const handleClose = useCallback(() => {
    teardownVideoElement();
    stopVoiceNarration();
    onClose();
  }, [teardownVideoElement, stopVoiceNarration, onClose]);

  // Escape key closes modal cleanly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const switchToHeritageVideo = useCallback(
    (nextKey: HeritageVideoKey) => {
      teardownVideoElement();
      stopVoiceNarration();
      setActiveVideoId(nextKey);
      setSourceMode('youtube');
      setUseCustomYoutubeOverride(Boolean(loadCustomVideoUrlForHeritage(nextKey)));
      setCurrentTime(0);
      setIsPlaying(true);
      setIsYouTubePanelOpen(false);
      setSaveFeedback(null);
      setTier1VideoError(false);
      setUseFlycamBackup(false);
      setUseArchiveBackup(false);
      setFailedImagesMap({});
      setSelectedWikiIndex(0);
      setFailedWikiUrls({});

      const targetSiteId = HERITAGE_VIDEO_DATA[nextKey].siteId;
      const pool = sites && sites.length > 0 ? sites : HERITAGE_SITES;
      const targetSite =
        pool.find((s) => s.id === targetSiteId) ||
        HERITAGE_SITES.find((s) => s.id === targetSiteId);
      if (targetSite) {
        prevSyncedContextIdRef.current = targetSite.id;
        if (onSwitchSite) {
          onSwitchSite(targetSite);
        }
      }
    },
    [teardownVideoElement, stopVoiceNarration, sites, onSwitchSite]
  );

  const visibleVideoKeys = useMemo(() => {
    if (!sites || sites.length === 0) return HERITAGE_VIDEO_KEYS_ORDERED;
    const allowed = new Set(sites.map((s) => resolveHeritageVideoId(s.id)));
    const filtered = HERITAGE_VIDEO_KEYS_ORDERED.filter((k) => allowed.has(k));
    return filtered.length > 0 ? filtered : HERITAGE_VIDEO_KEYS_ORDERED;
  }, [sites]);

  const handlePrevHeritage = () => {
    const idx = visibleVideoKeys.indexOf(activeVideoId);
    const safeIdx = idx >= 0 ? idx : 0;
    const prevIdx = (safeIdx - 1 + visibleVideoKeys.length) % visibleVideoKeys.length;
    switchToHeritageVideo(visibleVideoKeys[prevIdx]);
  };

  const handleNextHeritage = () => {
    const idx = visibleVideoKeys.indexOf(activeVideoId);
    const safeIdx = idx >= 0 ? idx : 0;
    const nextIdx = (safeIdx + 1) % visibleVideoKeys.length;
    switchToHeritageVideo(visibleVideoKeys[nextIdx]);
  };

  const showToast = (msg: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setSaveFeedback(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setSaveFeedback(null);
      toastTimerRef.current = null;
    }, 2800);
  };

  const handleWikiVideoError = () => {
    if (!selectedWikiVideo) return;
    const nextFailed = { ...failedWikiUrls, [selectedWikiVideo.url]: true };
    setFailedWikiUrls(nextFailed);

    // Auto-advance to another playable Wikimedia clip (e.g., .webm/.mp4) if available
    const nextPlayableIdx = wikiVideos.findIndex(
      (item, idx) => idx !== selectedWikiIndex && !nextFailed[item.url] && item.format !== 'ogv'
    );
    if (nextPlayableIdx >= 0) {
      setSelectedWikiIndex(nextPlayableIdx);
    }
  };

  const handleApplyYouTubeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = urlInput.trim();
    if (!cleaned) return;
    teardownVideoElement();
    stopVoiceNarration();

    const saved = saveCustomVideoUrlForHeritage(activeVideoId, cleaned);
    setCustomUrlEntry(saved);
    setUseCustomYoutubeOverride(true);
    setTier1VideoError(false);
    setSourceMode('youtube');
    setIsYouTubePanelOpen(false);
    showToast(
      lang === 'en'
        ? `Playing custom YouTube clip for [${activeVideoId}] ${videoEntry.name.en}`
        : lang === 'zh'
        ? `已播放 [${activeVideoId}] ${videoEntry.name.zh} 的自定义 YouTube 视频`
        : `Đã gắn & phát Clip YouTube cho [${activeVideoId}] ${videoEntry.name.vi}`
    );

    // Silent background Auto-Push when Admin is authenticated with Firebase
    void import('../../utils/cloudSync').then(({ autoPushAssetUpdateInBackground, pushVideosBranchToCloud }) => {
      autoPushAssetUpdateInBackground(`Video ${videoEntry.name.vi}`, async () => {
        const res = await pushVideosBranchToCloud(HERITAGE_SITES, { skipIfMatched: true });
        return {
          ok: !res.permissionDenied && res.failedCount === 0,
          detail: `Đã cập nhật liên kết video di sản lên Cloud`,
          errorMessage: res.permissionDenied ? 'Cần quyền quản trị Firebase' : undefined,
        };
      });
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    teardownVideoElement();
    stopVoiceNarration();
    setTier1VideoError(false);

    // Save to IndexedDB strictly under video_custom_${heritageId} AND update session state
    try {
      await saveLocalVideoToIndexedDB(activeVideoId, file);
    } catch {
      // Fallback to in-memory ObjectURL if browser restricts IndexedDB
    }
    revokeIdbObjectUrl();
    const objUrl = URL.createObjectURL(file);
    idbObjectUrlRef.current = objUrl;
    setIdbLocalVideo({ url: objUrl, fileName: file.name });
    onUploadLocalVideo(activeVideoId, file);
    setSourceMode('local');
    setIsYouTubePanelOpen(false);

    showToast(
      lang === 'en'
        ? `Loaded .MP4 for [${activeVideoId}]: ${file.name}`
        : lang === 'zh'
        ? `已加载 [${activeVideoId}] 本地 .MP4: ${file.name}`
        : `Đã nạp .MP4 riêng cho [${activeVideoId}]: ${file.name}`
    );

    // Background Auto-Push of local video to Firebase Cloud (chunked <= 25MB) when Admin is signed in
    void Promise.all([
      import('../../lib/firebaseAuth'),
      import('../../utils/cloudSync'),
    ]).then(([{ firebaseAuth }, { uploadAssetBinaryToFirebaseStorage }]) => {
      if (!firebaseAuth.currentUser) return;
      void uploadAssetBinaryToFirebaseStorage('videos', `${videoEntry.siteId}_0`, file, file.name);
    });
  };

  const handleClearLocalFile = async () => {
    teardownVideoElement();
    onClearLocalVideo(activeVideoId);
    onClearLocalVideo(videoEntry.siteId);
    await deleteLocalVideoFromIndexedDB(activeVideoId);
    revokeIdbObjectUrl();
    setIdbLocalVideo(null);
    setSourceMode('youtube');
  };

  const handleRestoreDefaultFlycam = () => {
    removeCustomVideoUrlForHeritage(activeVideoId);
    setCustomUrlEntry(null);
    setUseCustomYoutubeOverride(false);
    setUrlInput('');
    setIsYouTubePanelOpen(false);
    setTier1VideoError(false);
    setSourceMode('youtube');
  };

  // Strict lazy mount
  if (!isOpen) return null;

  const flycamSearchQuery = `${videoEntry.name[lang]} flycam 4K`;
  const youtubeSearchHref = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    flycamSearchQuery
  )}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${videoEntry.id} · ${videoEntry.name[lang]}`}
      onClick={handleClose}
      className="fixed inset-0 z-[1200] flex items-center justify-center p-2.5 sm:p-5 bg-black/90 backdrop-blur-2xl overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-5xl w-full max-h-[85vh] sm:max-h-[92vh] overflow-y-auto heritage-scrollbar rounded-[28px] sm:rounded-[32px] bg-[#121214]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_35px_100px_rgba(0,0,0,0.92)] text-[#F5F5F7] my-auto animate-apple-sheet"
      >
        {/* 1. MUSEUM ARCHIVAL HEADER — STRICTLY LOCKED TO HERITAGE ID (01 -> 17) */}
        <div className="px-5 sm:px-7 py-4 border-b border-white/[0.08] flex items-center justify-between gap-4 bg-white/[0.02]">
          <div className="min-w-0 flex items-center gap-4 sm:gap-5">
            {/* Cột trái: Mã lưu trữ */}
            <div className="flex items-baseline shrink-0 select-none">
              <span
                className="font-serif text-[28px] leading-none font-normal text-[#C8A96E] tabular-nums"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {videoEntry.id}
              </span>
              <span className="text-[13px] text-[#6E6E73] tabular-nums ml-1.5 font-normal">
                / 17
              </span>
            </div>

            {/* Đường kẻ dọc mảnh */}
            <span
              aria-hidden="true"
              className="w-px h-9 bg-white/[0.12] shrink-0"
            />

            {/* Cột phải: Thông tin di tích */}
            <div className="min-w-0">
              <h2
                className="text-[20px] sm:text-[24px] leading-tight font-medium text-[#FAF8F5] tracking-tight truncate"
                style={{ fontVariantNumeric: 'lining-nums' }}
              >
                {videoEntry.name[lang]}
              </h2>
              <p className="text-[13px] leading-snug text-[#A1A1AA] truncate mt-1">
                {videoEntry.locationBadge[lang]}  ·  {videoEntry.historicalYear}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label={lang === 'en' ? 'Close cinema' : lang === 'zh' ? '关闭影院' : 'Đóng trình chiếu'}
            className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] border border-white/[0.12] text-[#F5F5F7] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. 16:9 CINEMA VIEWPORT STAGE (CLIP FLYCAM YOUTUBE MẶC ĐỊNH / WIKIMEDIA / LOCAL MP4 / KEN BURNS BACKUP) */}
        <div className="aspect-video w-full bg-black relative overflow-hidden select-none">
          {isPlayingYoutubeEmbed ? (
            useCustomYoutubeOverride && customUrlEntry ? (
              customUrlEntry.kind === 'youtube' ? (
                <iframe
                  key={`yt-custom-${activeVideoId}-${customUrlEntry.embedUrl}`}
                  src={
                    currentVideo.useNoCookie && customUrlEntry.videoId
                      ? `https://www.youtube-nocookie.com/embed/${customUrlEntry.videoId}?autoplay=1&rel=0`
                      : customUrlEntry.embedUrl
                  }
                  title={`${videoEntry.id} · ${videoEntry.name[lang]}`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video
                  ref={videoRef}
                  key={`url-${activeVideoId}-${customUrlEntry.embedUrl}`}
                  src={customUrlEntry.embedUrl}
                  controls
                  autoPlay
                  playsInline
                  onError={() => setTier1VideoError(true)}
                  className="w-full h-full object-contain bg-black"
                />
              )
            ) : (
              /* NGUỒN MẶC ĐỊNH: CLIP FLYCAM YOUTUBE KHÓA CHUẨN 17 DI TÍCH */
              <iframe
                key={`flycam-${activeVideoId}-${activeFlycamVideoId}`}
                src={flycamEmbedSrc}
                title={currentVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )
          ) : isCuratedArchiveActive && curatedArchive ? (
            /* PHIM TƯ LIỆU LỊCH SỬ & KIẾN TRÚC KHUNG HÌNH NGANG 16:9 */
            <iframe
              key={`archive-${activeVideoId}-${activeArchiveVideoId}`}
              src={archiveEmbedSrc}
              title={curatedArchive.title[lang]}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : isSelectedWikiPlayable && selectedWikiVideo ? (
            /* KHO WIKIMEDIA COMMONS */
            <video
              ref={videoRef}
              key={`wiki-${activeVideoId}-${selectedWikiVideo.url}`}
              src={selectedWikiVideo.url}
              controls
              autoPlay
              playsInline
              onError={handleWikiVideoError}
              className="w-full h-full object-contain bg-black"
            />
          ) : isPlayingLocalMp4 && activeLocalMp4 ? (
            /* FILE .MP4 TỪ MÁY TÍNH / INDEXEDDB */
            <video
              ref={videoRef}
              key={`mp4-${activeVideoId}-${activeLocalMp4.fileName}`}
              src={activeLocalMp4.url}
              controls
              autoPlay
              playsInline
              onError={() => setTier1VideoError(true)}
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            /* TRÌNH PHÁT DỰ PHÒNG KEN BURNS 45s — KHÔNG BAO GIỜ ĐEN MÀN HÌNH */
            <div className="relative w-full h-full bg-[#09090B] overflow-hidden">
              {resolvedScenes.map((scene, idx) => {
                const isSceneActive = idx === activeSceneIndex;
                const sceneDuration = Math.max(1, scene.endSec - scene.startSec);
                const rawProgress = (currentTime - scene.startSec) / sceneDuration;
                const clampedProgress = Math.max(0, Math.min(1, rawProgress));
                const transformStr = isSceneActive
                  ? computeKenBurnsTransform(scene.cameraEffect, clampedProgress)
                  : computeKenBurnsTransform(scene.cameraEffect, idx < activeSceneIndex ? 1 : 0);

                const imgSrc = failedImagesMap[scene.id]
                  ? scene.fallbackUrl
                  : scene.imageUrl;
                const hasValidImg = Boolean(imgSrc) && !(failedImagesMap[scene.id] && (!scene.fallbackUrl || imgSrc === scene.imageUrl));
                const isHistoricalSlot = scene.sceneLabel.toLowerCase().includes('xưa') || scene.sceneLabel.toLowerCase().includes('archival') || scene.sceneLabel.toLowerCase().includes('historical') || scene.sceneLabel.includes('历史');

                return (
                  <div
                    key={scene.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      isSceneActive ? 'opacity-100 z-[2]' : 'opacity-0 z-[1]'
                    }`}
                  >
                    {hasValidImg && !failedImagesMap[`${scene.id}_fb`] ? (
                      <HeritageSmoothImage
                        src={imgSrc}
                        alt={`${videoEntry.name[lang]} - ${scene.sceneLabel}`}
                        waitTone="dark"
                        onError={() => {
                          if (!failedImagesMap[scene.id]) {
                            setFailedImagesMap((prev) => ({
                              ...prev,
                              [scene.id]: true,
                              ...(scene.fallbackUrl && scene.fallbackUrl === imgSrc
                                ? { [`${scene.id}_fb`]: true }
                                : {}),
                            }));
                          } else {
                            setFailedImagesMap((prev) => ({ ...prev, [`${scene.id}_fb`]: true }));
                          }
                        }}
                        className="w-full h-full object-cover will-change-transform"
                        style={{
                          transform: transformStr,
                          filter: scene.filterCss,
                        }}
                      />
                    ) : resolvedSite ? (
                      <div
                        className="w-full h-full will-change-transform"
                        style={{ transform: transformStr }}
                      >
                        <HeritageTypographicPlate
                          site={resolvedSite}
                          variant={isHistoricalSlot ? 'archival' : 'detail'}
                          badgeOverride={scene.sceneLabel}
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <div
                className="absolute inset-0 z-[3] pointer-events-none"
                style={{
                  background:
                    'radial-gradient(circle at center, transparent 48%, rgba(0,0,0,0.65) 100%)',
                }}
              />
              <div className="absolute inset-x-0 top-0 h-20 z-[3] pointer-events-none bg-gradient-to-b from-black/75 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-44 sm:h-48 z-[3] pointer-events-none bg-gradient-to-t from-black/95 via-black/70 to-transparent" />

              {/* Top-Left Status / Scene Badge & Top-Right Year Stamp */}
              <div className="absolute top-3.5 left-4 right-4 z-[4] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-[#C5A059]/45 text-[11px] font-medium text-[#F5EFE6] flex items-center gap-2">
                    {wikiLoading && sourceMode === 'wikimedia' ? (
                      <>
                        <Loader2 className="w-3 h-3 text-[#C5A059] animate-spin" />
                        <span>
                          {lang === 'en'
                            ? 'Searching Wikimedia Commons video archive...'
                            : lang === 'zh'
                            ? '正在检索 Wikimedia Commons 视频档案...'
                            : 'Đang truy xuất video từ Wikimedia Commons...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
                        <span>{activeScene.sceneLabel}</span>
                      </>
                    )}
                  </div>

                  {sourceMode === 'wikimedia' &&
                    !wikiLoading &&
                    selectedWikiVideo &&
                    failedWikiUrls[selectedWikiVideo.url] && (
                      <div className="px-3 py-1 rounded-full bg-[#1C1610]/90 backdrop-blur-md border border-amber-400/50 text-[10.5px] text-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>
                          {lang === 'en'
                            ? `Format .${selectedWikiVideo.format.toUpperCase()} unsupported by browser — Playing backup film`
                            : lang === 'zh'
                            ? `浏览器不支持 .${selectedWikiVideo.format.toUpperCase()} 格式 — 已切换备用纪录片`
                            : `Định dạng .${selectedWikiVideo.format.toUpperCase()} không tương thích trình duyệt — Đang phát phim dự phòng`}
                        </span>
                      </div>
                    )}

                  {sourceMode === 'wikimedia' &&
                    !wikiLoading &&
                    (wikiFetchError || wikiVideos.length === 0) && (
                      <div className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[10.5px] text-[#D1D1D6]">
                        {lang === 'en'
                          ? 'Wikimedia backup archival stream (45s)'
                          : lang === 'zh'
                          ? '已切换 45 秒高清文献纪录片备用源'
                          : 'Đang phát phim tư liệu dự phòng 45s'}
                      </div>
                    )}
                </div>

                <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-[11px] font-medium text-[#C5A059] tabular-nums">
                  {videoEntry.historicalYear}
                </div>
              </div>

              {/* Lower-Third Cinema Subtitle Synced to Progress */}
              <div className="absolute bottom-4 sm:bottom-6 inset-x-4 sm:inset-x-10 z-[4] text-center pointer-events-none">
                <div className="inline-block max-w-3xl px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.85)]">
                  <p className="font-sans text-xs sm:text-base font-medium text-[#F5F5F7] leading-relaxed">
                    {activeScene.subtitle}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. CONTROLS, WIKIMEDIA ARCHIVE SELECTOR & 3-OPTION QUICK SWITCH BAR */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#161618] border-t border-white/[0.08] space-y-3">
          {/* A. 3-OPTION QUICK SOURCE SWITCHER (CLIP FLYCAM YOUTUBE [DEFAULT] | KHO WIKIMEDIA | NẠP FILE .MP4) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-white/[0.07]">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* 1) Clip Flycam YouTube (Mặc định phát ngay) */}
              <button
                type="button"
                onClick={() => {
                  teardownVideoElement();
                  setSourceMode('youtube');
                  setTier1VideoError(false);
                }}
                className={`h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                  sourceMode === 'youtube'
                    ? 'bg-[#C5A059] border-[#C5A059] text-[#121110] font-semibold shadow-sm'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-[#F5F5F7]'
                }`}
              >
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'YouTube Flycam Clip'
                    : lang === 'zh'
                    ? 'YouTube 航拍视频'
                    : '🎬 Clip Flycam YouTube'}
                </span>
              </button>

              {/* 2) Kho Wikimedia Commons */}
              <button
                type="button"
                onClick={() => {
                  teardownVideoElement();
                  setSourceMode('wikimedia');
                  setIsYouTubePanelOpen(false);
                  setTier1VideoError(false);
                }}
                className={`h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                  sourceMode === 'wikimedia'
                    ? 'bg-[#C5A059] border-[#C5A059] text-[#121110] font-semibold shadow-sm'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-[#F5F5F7]'
                }`}
              >
                <Film className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Wikimedia Commons Archive'
                    : lang === 'zh'
                    ? 'Wikimedia Commons 片库'
                    : '🎞️ Kho Wikimedia Commons'}
                </span>
                {wikiVideos.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10.5px] font-medium tabular-nums ${
                      sourceMode === 'wikimedia'
                        ? 'bg-black/20 text-[#121110]'
                        : 'bg-white/10 text-[#C5A059]'
                    }`}
                  >
                    {wikiVideos.length}
                  </span>
                )}
              </button>

              {/* 3) Nạp file .MP4 từ máy tính */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogv"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => {
                  if (activeLocalMp4 && sourceMode !== 'local') {
                    teardownVideoElement();
                    setSourceMode('local');
                    setTier1VideoError(false);
                    setIsYouTubePanelOpen(false);
                  } else {
                    fileInputRef.current?.click();
                  }
                }}
                className={`h-8 px-3 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                  sourceMode === 'local'
                    ? 'bg-[#C5A059] border-[#C5A059] text-[#121110] font-semibold shadow-sm'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.12] text-[#F5F5F7]'
                }`}
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Load .MP4 from Computer'
                    : lang === 'zh'
                    ? '从电脑加载 .MP4'
                    : '📁 Nạp file .MP4 từ máy tính'}
                </span>
              </button>

              {sourceMode === 'local' && activeLocalMp4 && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 px-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-[11px] text-[#D1D1D6] cursor-pointer"
                  >
                    {lang === 'en' ? 'Choose another' : lang === 'zh' ? '更换文件' : 'Đổi file'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearLocalFile}
                    className="h-8 px-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-[11px] text-[#8E8E93] hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{lang === 'en' ? 'Clear' : lang === 'zh' ? '清除' : 'Xóa'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Transparent Attribution Label */}
            <div className="text-[11px] text-[#A1A1A6] truncate max-w-full sm:max-w-md tabular-nums">
              {sourceMode === 'youtube' ? (
                <span className="inline-flex items-center gap-1.5 truncate">
                  <span className="text-[#C5A059] font-semibold">{currentVideo.duration}</span>
                  <span>•</span>
                  <span className="text-[#F5F5F7] truncate" title={currentVideo.title}>
                    {useCustomYoutubeOverride && customUrlEntry
                      ? customUrlEntry.originalUrl
                      : currentVideo.title}
                  </span>
                </span>
              ) : isCuratedArchiveActive && curatedArchive ? (
                <span className="inline-flex items-center gap-1.5 truncate">
                  <span className="text-[#C5A059] font-semibold">{curatedArchive.badge}</span>
                  <span>•</span>
                  <span className="text-[#F5F5F7] truncate" title={curatedArchive.title[lang]}>
                    {curatedArchive.title[lang]}
                  </span>
                </span>
              ) : sourceMode === 'wikimedia' && selectedWikiVideo ? (
                <span className="inline-flex items-center gap-1.5 truncate">
                  <span className="text-[#C5A059]">
                    {lang === 'en'
                      ? 'Source: Wikimedia Commons'
                      : lang === 'zh'
                      ? '来源: Wikimedia Commons'
                      : 'Nguồn: Wikimedia Commons'}
                  </span>
                  <span>•</span>
                  <span className="text-[#F5F5F7] truncate" title={selectedWikiVideo.fileName}>
                    {selectedWikiVideo.fileName}
                  </span>
                  {selectedWikiVideo.descriptionUrl && (
                    <a
                      href={selectedWikiVideo.descriptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C5A059] hover:underline inline-flex items-center shrink-0"
                      title="Wikimedia Commons"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </span>
              ) : sourceMode === 'local' && activeLocalMp4 ? (
                <span>
                  {lang === 'en'
                    ? `Local File • ${activeLocalMp4.fileName}`
                    : lang === 'zh'
                    ? `本地文件 • ${activeLocalMp4.fileName}`
                    : `Nguồn: Máy tính cá nhân • ${activeLocalMp4.fileName}`}
                </span>
              ) : (
                <span>
                  {lang === 'en'
                    ? 'Source: Archival Documentary'
                    : lang === 'zh'
                    ? '来源: 历史文献纪录片'
                    : 'Nguồn: Tư liệu Lưu trữ Đông Nam Bộ'}
                </span>
              )}
            </div>
          </div>

          {/* A2. FLYCAM BACKUP SELECTOR STRIP (WHEN AVAILABLE, E.G. SITE 06) */}
          {sourceMode === 'youtube' && !useCustomYoutubeOverride && currentVideo.backupVideoId && (
            <div className="rounded-xl bg-white/[0.03] border border-[#C5A059]/35 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-[#C5A059] text-black shrink-0 tabular-nums">
                  {currentVideo.duration}
                </span>
                <p className="text-xs text-[#F5F5F7] truncate">{currentVideo.title}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setUseFlycamBackup(false)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    !useFlycamBackup
                      ? 'bg-[#C5A059] border-[#C5A059] text-black font-semibold'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-[#D1D1D6]'
                  }`}
                >
                  {lang === 'en' ? 'Primary Flycam' : lang === 'zh' ? '主航拍源' : `Flycam chính (${currentVideo.videoId})`}
                </button>
                <button
                  type="button"
                  onClick={() => setUseFlycamBackup(true)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                    useFlycamBackup
                      ? 'bg-[#C5A059] border-[#C5A059] text-black font-semibold'
                      : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-[#D1D1D6]'
                  }`}
                >
                  {lang === 'en' ? 'Backup Flycam' : lang === 'zh' ? '备用航拍源' : `Dự phòng (${currentVideo.backupVideoId})`}
                </button>
              </div>
            </div>
          )}

          {/* B. WIKIMEDIA COMMONS RETRIEVED CLIPS SELECTOR STRIP */}
          {sourceMode === 'wikimedia' &&
            (isCuratedArchiveActive && curatedArchive ? (
              <div className="rounded-xl bg-white/[0.03] border border-[#C5A059]/35 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="px-1.5 py-0.5 rounded text-[10.5px] font-semibold bg-[#C5A059] text-black shrink-0 tabular-nums">
                    {curatedArchive.badge}
                  </span>
                  <p className="text-xs text-[#F5F5F7] leading-relaxed">
                    {curatedArchive.description[lang]}
                  </p>
                </div>

                {curatedArchive.backupVideoId && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setUseArchiveBackup(false)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                        !useArchiveBackup
                          ? 'bg-[#C5A059] border-[#C5A059] text-black font-semibold'
                          : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-[#D1D1D6]'
                      }`}
                    >
                      {lang === 'en'
                        ? `Primary (${curatedArchive.videoId})`
                        : lang === 'zh'
                        ? `主片源 (${curatedArchive.videoId})`
                        : `Phim chính (${curatedArchive.videoId})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseArchiveBackup(true)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                        useArchiveBackup
                          ? 'bg-[#C5A059] border-[#C5A059] text-black font-semibold'
                          : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-[#D1D1D6]'
                      }`}
                    >
                      {curatedArchive.backupLabel?.[lang] ||
                        (lang === 'en'
                          ? `Backup (${curatedArchive.backupVideoId})`
                          : lang === 'zh'
                          ? `备用 (${curatedArchive.backupVideoId})`
                          : `Dự phòng (${curatedArchive.backupVideoId})`)}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8E8E93]">
                  <span>
                    {wikiLoading
                      ? lang === 'en'
                        ? 'Querying Wikimedia Commons (filetype:video)...'
                        : lang === 'zh'
                        ? '正在搜索 Wikimedia Commons 视频文件...'
                        : 'Đang tìm thước phim thật trên Wikimedia Commons...'
                      : wikiVideos.length > 0
                      ? lang === 'en'
                        ? `Found ${wikiVideos.length} archival clips${wikiUsedFallbackQuery ? ' (regional archive)' : ''} — Select to switch:`
                        : lang === 'zh'
                        ? `已检索到 ${wikiVideos.length} 段影像档案${wikiUsedFallbackQuery ? '（区域档案扩展）' : ''} — 点击切换：`
                        : `Tìm thấy ${wikiVideos.length} thước phim trên Wikimedia Commons${wikiUsedFallbackQuery ? ' (mở rộng theo vùng)' : ''} — Bấm chọn để phát:`
                      : lang === 'en'
                      ? 'No matching video on Wikimedia Commons — Playing 45s backup documentary'
                      : lang === 'zh'
                      ? 'Wikimedia Commons 暂无匹配视频 — 正在播放45秒备用纪录片'
                      : 'Chưa có video khớp trực tiếp trên Wikimedia — Đang phát phim tư liệu dự phòng'}
                  </span>
                </div>

                {wikiLoading ? (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[0, 1, 2].map((skeletonIdx) => (
                      <div
                        key={skeletonIdx}
                        className="h-11 w-48 rounded-xl bg-white/[0.04] border border-white/[0.06] animate-pulse shrink-0"
                      />
                    ))}
                  </div>
                ) : wikiVideos.length > 0 ? (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 gis-scrollbar">
                    {wikiVideos.map((clip, idx) => {
                      const isSelected = idx === selectedWikiIndex;
                      const hasFailed = Boolean(failedWikiUrls[clip.url]);
                      const sizeLabel = formatFileSizeMb(clip.sizeBytes);
                      return (
                        <button
                          key={`${clip.pageId}-${clip.fileName}`}
                          type="button"
                          onClick={() => {
                            teardownVideoElement();
                            setSelectedWikiIndex(idx);
                            setFailedWikiUrls((prev) => {
                              if (!prev[clip.url]) return prev;
                              const next = { ...prev };
                              delete next[clip.url];
                              return next;
                            });
                          }}
                          className={`shrink-0 max-w-[250px] text-left px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
                            isSelected
                              ? 'bg-[#C5A059]/18 border-[#C5A059] text-[#F5F5F7]'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.08] text-[#D1D1D6]'
                          }`}
                          title={`Wikimedia Commons • ${clip.fileName}`}
                        >
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                              hasFailed
                                ? 'bg-amber-500/20 text-amber-300'
                                : isSelected
                                ? 'bg-[#C5A059] text-black'
                                : 'bg-white/10 text-[#C5A059]'
                            }`}
                          >
                            {clip.format.toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[11.5px] font-medium truncate leading-tight">
                              {clip.title}
                            </div>
                            <div className="text-[10.5px] text-[#8E8E93] truncate tabular-nums">
                              #{String(idx + 1).padStart(2, '0')}
                              {sizeLabel ? ` · ${sizeLabel}` : ''}
                              {clip.license ? ` · ${clip.license}` : ''}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}

          {/* C. Timeline Scrubber & Playback (Active whenever Ken Burns Documentary Backup is playing) */}
          {!isExternalStreamActive && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="w-9 h-9 rounded-full bg-[#C5A059] hover:bg-[#D9B66E] text-[#121110] flex items-center justify-center shrink-0 cursor-pointer transition-all shadow-md"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <span className="text-[11px] text-[#F5F5F7] tabular-nums w-11 shrink-0">
                  {formatTimeSec(currentTime)}
                </span>

                <div className="relative flex-1 flex items-center">
                  <input
                    type="range"
                    min={0}
                    max={DOCUMENTARY_TOTAL_DURATION_SEC}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                    aria-label="Thanh tua tiến độ phim tư liệu"
                    className="w-full h-1.5 rounded-full appearance-none bg-white/15 accent-[#C5A059] cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #C5A059 ${(currentTime / DOCUMENTARY_TOTAL_DURATION_SEC) * 100}%, rgba(255,255,255,0.14) ${(currentTime / DOCUMENTARY_TOTAL_DURATION_SEC) * 100}%)`,
                    }}
                  />
                </div>

                <span className="text-[11px] text-[#8E8E93] tabular-nums w-11 text-right shrink-0">
                  {formatTimeSec(DOCUMENTARY_TOTAL_DURATION_SEC)}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {resolvedScenes.map((sc, idx) => {
                  const isActive = idx === activeSceneIndex;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => {
                        setCurrentTime(sc.startSec + 0.05);
                        setIsPlaying(true);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] truncate text-left transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-[#C5A059]/20 border-[#C5A059]/55 text-[#F5EFE6] font-semibold'
                          : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/[0.06] text-[#8E8E93]'
                      }`}
                      title={sc.sceneLabel}
                    >
                      {sc.sceneLabel}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* D. Audio Narration Toggle + YouTube Link Edit + Prev/Next Site */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isVoiceActive) {
                    stopVoiceNarration();
                  } else {
                    startVoiceNarrationForSite(activeVideoId);
                  }
                }}
                className={`h-8 px-3.5 rounded-full text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isVoiceActive
                    ? 'bg-[#0071E3] border-[#0071E3] text-white shadow-[0_4px_16px_rgba(0,113,227,0.4)]'
                    : 'bg-white/[0.07] hover:bg-white/[0.14] border-white/[0.12] text-[#F5F5F7]'
                }`}
              >
                {isVoiceActive ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#C5A059]" />
                )}
                <span>
                  {isVoiceActive
                    ? lang === 'en'
                      ? 'Stop Voice'
                      : lang === 'zh'
                      ? '停止配音'
                      : 'Tắt thuyết minh'
                    : lang === 'en'
                    ? 'Voice Narration'
                    : lang === 'zh'
                    ? '语音解说'
                    : '🔊 Thuyết minh'}
                </span>
              </button>

              {sourceMode === 'youtube' && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsYouTubePanelOpen((prev) => !prev)}
                    className="h-8 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-medium text-[#D1D1D6] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5 text-[#C5A059]" />
                    <span>
                      {lang === 'en'
                        ? 'Change YouTube Link'
                        : lang === 'zh'
                        ? '更换 YouTube 链接'
                        : 'Đổi link YouTube'}
                    </span>
                  </button>
                  {useCustomYoutubeOverride && (
                    <button
                      type="button"
                      onClick={handleRestoreDefaultFlycam}
                      className="h-8 px-3 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-xs font-medium text-[#C5A059] flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'en'
                          ? 'Default Flycam'
                          : lang === 'zh'
                          ? '恢复默认航拍'
                          : 'Flycam mặc định'}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Right Group: Quick Switch ‹ Di tích trước | Di tích tiếp › */}
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={handlePrevHeritage}
                className="h-8 px-3 rounded-full bg-white/[0.07] hover:bg-white/[0.15] border border-white/[0.12] text-xs font-medium text-[#F5F5F7] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>
                  {lang === 'en'
                    ? 'Prev Site'
                    : lang === 'zh'
                    ? '上一遗址'
                    : '‹ Di tích trước'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleNextHeritage}
                className="h-8 px-3 rounded-full bg-white/[0.07] hover:bg-white/[0.15] border border-white/[0.12] text-xs font-medium text-[#F5F5F7] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>
                  {lang === 'en'
                    ? 'Next Site'
                    : lang === 'zh'
                    ? '下一遗址'
                    : 'Di tích tiếp ›'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" />
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {saveFeedback && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-xs text-emerald-300 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
          )}

          {/* Inline YouTube Flycam Panel (Keyed strictly to video_custom_${heritageId}) */}
          {isYouTubePanelOpen && (
            <div className="rounded-2xl bg-black/55 border border-white/[0.12] p-3.5 space-y-2.5 animate-apple-sheet">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[#F5F5F7] font-medium">
                  {lang === 'en'
                    ? `Flycam 4K YouTube source for [${activeVideoId}] ${videoEntry.name.en}`
                    : lang === 'zh'
                    ? `为 [${activeVideoId}] ${videoEntry.name.zh} 绑定 YouTube 航拍视频`
                    : `Gắn Clip Flycam YouTube cho [${activeVideoId}] ${videoEntry.name.vi}`}
                </span>
                <a
                  href={youtubeSearchHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-[#C5A059] hover:underline"
                >
                  <span>
                    {lang === 'en'
                      ? 'Search Flycam 4K on YouTube'
                      : lang === 'zh'
                      ? '在 YouTube 搜索 4K 航拍'
                      : 'Tìm Clip Flycam 4K trên YouTube'}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <form onSubmit={handleApplyYouTubeUrl} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Paste YouTube Flycam URL (watch?v=..., youtu.be/..., shorts/...)...'
                      : lang === 'zh'
                      ? '粘贴任意 YouTube 航拍链接 (watch?v=..., youtu.be/...)...'
                      : 'Dán link YouTube Flycam 4K (watch?v=..., youtu.be/..., shorts/...)...'
                  }
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.12] focus:border-[#C5A059] focus:outline-none text-xs text-[#F5F5F7] placeholder:text-[#6E6E73]"
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#D4B06A] disabled:opacity-40 text-[#121110] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                >
                  {lang === 'en' ? 'Save & Play' : lang === 'zh' ? '保存并播放' : 'Lưu & Phát ngay'}
                </button>
              </form>
            </div>
          )}

          {/* Architectural Style Footer Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8E8E93] pt-1 border-t border-white/[0.06]">
            <span>{videoEntry.architecturalStyle[lang]}</span>
            <div className="flex flex-wrap items-center gap-3">
              {onOpenMediaCredits && (
                <ArchivalSourcesTrigger
                  onClick={() => onOpenMediaCredits(videoEntry.siteId)}
                  tone="dark"
                />
              )}
              <span className="text-[11px] text-[#6E6E73] tabular-nums">
                Mã lưu trữ: video_custom_{activeVideoId}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CinemaDocumentaryModal;

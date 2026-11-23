import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { HeritageSite } from '../types/heritage';
import { Language } from '../i18n/types';
import { useI18n } from '../i18n/I18nContext';
import { useAuth } from './AuthContext';
import { getCuratedAudioScript } from '../data/audioGuideScripts';
import {
  speechEngine,
  SPEECH_VOLUME_CHANGED_EVENT,
  splitTextIntoSentences,
  SupportedPlaybackSpeed,
} from '../utils/chunkedSpeechEngine';
import {
  CMS_UPDATED_EVENT,
  loadCmsSiteOverrides,
  trackPlatformInteraction,
} from '../utils/adminPlatformStore';
import { recordPersonalVisitHistory } from '../utils/accountActivityStore';
import {
  evaluateSitePermissions,
  getAdminPreviewRole,
  getSiteNameById,
  loadLocalUserSubscription,
  openUpgradePrompt,
} from '../utils/subscriptionGatingStore';
import {
  ASSET_VAULT_UPDATED_EVENT,
  deleteAudioFromVault,
  updateAudioDurationInVault,
} from '../utils/assetVault';
import {
  AssetResolutionTier,
  CLOUD_ASSETS_MANIFEST_READY_EVENT,
  resolveSmartAudioAsset,
  saveCloudAudioUrl,
  uploadAssetBinaryToFirebaseStorage,
} from '../utils/cloudSync';
import {
  BAKED_ASSETS,
  GITHUB_ASSETS_MANIFEST_READY_EVENT,
  deriveGithubRawFallbackUrl,
  getBakedAudioCandidateUrls,
  preloadGithubAssetsManifest,
} from '../data/bakedAssets';

export interface ComputedChapter {
  id: string;
  roman: string;
  title: string;
  durationLabel: string;
  durationSec: number;
  startSec: number;
  startPercent: number;
  endPercent: number;
  narration: string;
  sentences: string[];
  isHiddenForVisitors?: boolean;
}

export interface CustomAudioTrack {
  url: string;
  fallbackUrl?: string;
  fileName: string;
  durationSec: number;
  sourceTier?: AssetResolutionTier;
}

function buildInitialBakedAudioMap(): Record<string, CustomAudioTrack> {
  const initial: Record<string, CustomAudioTrack> = {};
  for (const [siteId, entry] of Object.entries(BAKED_ASSETS)) {
    const candidates = getBakedAudioCandidateUrls(siteId);
    const primaryUrl = candidates[0] || entry.audioUrl;
    if (primaryUrl) {
      initial[siteId] = {
        url: primaryUrl,
        fallbackUrl: candidates[1] || entry.audioRawFallbackUrl || deriveGithubRawFallbackUrl(primaryUrl) || undefined,
        fileName: entry.audioFileName || entry.recommendedAudioFileName,
        durationSec: 0,
        sourceTier: 'static_source',
      };
    }
  }
  return initial;
}

function cancelBrowserSpeechSynthesis(): void {
  speechEngine.stop();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore speechSynthesis cancel errors
    }
  }
}

interface AudioGuideContextType {
  sites: HeritageSite[];
  activeSiteId: string;
  activeSite: HeritageSite;
  folioTitle: string;
  chapters: ComputedChapter[];
  selectedChapterIdx: number;
  activeChapter: ComputedChapter;
  sentences: string[];
  activeSentenceIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  playbackSpeed: SupportedPlaybackSpeed;
  totalDurationSec: number;
  getPlaybackProgress: () => number;
  getCurrentTimeSec: () => number;
  subscribePlaybackProgress: (
    listener: (progress: number, timeSec: number) => void
  ) => () => void;
  customAudio: CustomAudioTrack | null;
  isUsingCustomAudio: boolean;
  isModalOpen: boolean;
  isFloatingBarVisible: boolean;
  openModalForSite: (siteId: string) => void;
  startAudioGuideForSite: (siteId: string) => void;
  closeModalAndStop: () => void;
  minimizeModalKeepPlaying: () => void;
  dismissFloatingBar: () => void;
  selectSite: (siteId: string, autoPlay?: boolean) => void;
  togglePlayPause: () => void;
  toggleMute: () => void;
  play: () => void;
  pause: () => void;
  selectChapter: (chapterIdx: number, autoPlay?: boolean) => void;
  prevChapter: () => void;
  nextChapter: () => void;
  jumpToSentence: (sentenceIdx: number) => void;
  setSpeed: (speed: SupportedPlaybackSpeed) => void;
  cycleSpeed: () => void;
  seekToPercent: (percent: number) => void;
  seekBySeconds: (deltaSec: number) => void;
  uploadCustomAudio: (siteId: string, file: File) => void;
  removeCustomAudio: (siteId: string) => void;
  toggleCustomAudioSource: (useCustom: boolean) => void;
  getCustomAudioForSite: (siteId: string) => CustomAudioTrack | null;
}

const AudioGuideContext = createContext<AudioGuideContextType | null>(null);

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const AudioGuideProvider: React.FC<{
  sites: HeritageSite[];
  children: React.ReactNode;
}> = ({ sites, children }) => {
  const { lang, getLocalizedSite } = useI18n();
  const { user, isAdmin, isTesterPro } = useAuth();
  const canPreviewHidden = isAdmin || isTesterPro;

  const [activeSiteId, setActiveSiteId] = useState<string>(() => sites[0]?.id || 'HCM-DT-001');
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<SupportedPlaybackSpeed>(1);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasActiveSession, setHasActiveSession] = useState<boolean>(false);

  // Per-site resolved recordings (.m4a / .mp3): pre-seeded immediately with locked GitHub CDN URLs
  const [customAudioMap, setCustomAudioMap] = useState<Record<string, CustomAudioTrack>>(
    () => buildInitialBakedAudioMap()
  );
  // Track sites where ALL candidate URLs (API exact, NFC/NFD CDN, API raw, NFC/NFD raw) failed so TTS kicks in cleanly
  const [audioFailedToTtsBySite, setAudioFailedToTtsBySite] = useState<Record<string, boolean>>({});
  // Candidate URL index per siteId so error recovery walks through every candidate in order
  const candidateIndexBySiteRef = useRef<Record<string, number>>({});
  // Pending chapter/scrubber seek percentage when user clicks before metadata finishes loading
  const pendingSeekPercentRef = useRef<number | null>(null);
  // Guard flag while swapping candidate URLs so transient pause events do not flip UI state
  const isSwitchingCandidateRef = useRef<boolean>(false);
  // User override: 'tts' forces Web Speech API; 'custom' forces studio recording even on EN/ZH
  const [audioSourceOverrideBySite, setAudioSourceOverrideBySite] = useState<
    Record<string, 'custom' | 'tts'>
  >({});
  const [cmsScriptVersion, setCmsScriptVersion] = useState<number>(0);

  useEffect(() => {
    void preloadGithubAssetsManifest();
  }, []);

  useEffect(() => {
    const onCmsUpdated = () => setCmsScriptVersion((v) => v + 1);
    window.addEventListener(CMS_UPDATED_EVENT, onCmsUpdated);
    return () => window.removeEventListener(CMS_UPDATED_EVENT, onCmsUpdated);
  }, []);

  // Hydrate all 17 sites: prefer local Admin IndexedDB / custom Cloud override, else keep permanent GitHub CDN .m4a
  useEffect(() => {
    let active = true;
    const hydrateAllAudioAssets = async () => {
      const resolvedPairs = await Promise.all(
        sites.map(async (site) => {
          const resolved = await resolveSmartAudioAsset(site.id, { autoDownloadFromCloud: false });
          return [site.id, resolved] as const;
        })
      );
      if (!active) return;
      setCustomAudioMap((prev) => {
        const next: Record<string, CustomAudioTrack> = { ...buildInitialBakedAudioMap(), ...prev };
        for (const [siteId, resolved] of resolvedPairs) {
          const baked = BAKED_ASSETS[siteId];
          const existing = prev[siteId];
          const bakedCandidates = getBakedAudioCandidateUrls(siteId);
          const primaryBakedUrl = bakedCandidates[0] || baked?.audioUrl || '';

          if (
            resolved.url &&
            (resolved.tier === 'indexed_db' || resolved.tier === 'firebase_cloud')
          ) {
            next[siteId] = {
              url: resolved.url,
              fallbackUrl:
                deriveGithubRawFallbackUrl(resolved.url) ||
                bakedCandidates[0] ||
                baked?.audioRawFallbackUrl ||
                undefined,
              fileName: resolved.fileName || baked?.audioFileName || `${siteId}.m4a`,
              durationSec:
                typeof resolved.durationSec === 'number' && resolved.durationSec > 0
                  ? resolved.durationSec
                  : existing?.url === resolved.url
                  ? existing.durationSec
                  : 0,
              sourceTier: resolved.tier,
            };
          } else if (primaryBakedUrl && baked) {
            next[siteId] = {
              url: primaryBakedUrl,
              fallbackUrl: bakedCandidates[1] || baked.audioRawFallbackUrl,
              fileName: baked.audioFileName || baked.recommendedAudioFileName,
              durationSec: existing?.durationSec && existing.durationSec > 0 ? existing.durationSec : 0,
              sourceTier: 'static_source',
            };
          }
        }
        return next;
      });
    };

    void hydrateAllAudioAssets();
    const onRefresh = () => {
      void hydrateAllAudioAssets();
    };
    const onGithubManifestReady = () => {
      // Reset candidate index to 0 when exact GitHub API filenames arrive so newly discovered exact URLs take priority
      candidateIndexBySiteRef.current = {};
      setAudioFailedToTtsBySite({});
      void hydrateAllAudioAssets();
    };
    window.addEventListener(ASSET_VAULT_UPDATED_EVENT, onRefresh);
    window.addEventListener(CLOUD_ASSETS_MANIFEST_READY_EVENT, onRefresh);
    window.addEventListener(GITHUB_ASSETS_MANIFEST_READY_EVENT, onGithubManifestReady);
    return () => {
      active = false;
      window.removeEventListener(ASSET_VAULT_UPDATED_EVENT, onRefresh);
      window.removeEventListener(CLOUD_ASSETS_MANIFEST_READY_EVENT, onRefresh);
      window.removeEventListener(GITHUB_ASSETS_MANIFEST_READY_EVENT, onGithubManifestReady);
    };
  }, [sites]);

  // High-frequency playback progress isolated in refs + subscribers (zero root React re-renders)
  const playbackProgressRef = useRef<number>(0);
  const customAudioCurrentSecRef = useRef<number>(0);
  const progressSubscribersRef = useRef<
    Set<(progress: number, timeSec: number) => void>
  >(new Set());

  const htmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeSiteIdRef = useRef<string>(activeSiteId);
  const customAudioMapRef = useRef<Record<string, CustomAudioTrack>>(customAudioMap);
  const isPlayingRef = useRef(isPlaying);
  const isMutedRef = useRef(isMuted);
  const selectedChapterIdxRef = useRef(selectedChapterIdx);
  const activeSentenceIndexRef = useRef(activeSentenceIndex);
  const playbackSpeedRef = useRef(playbackSpeed);
  const prevLangRef = useRef<Language>(lang);
  const customAudioUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    activeSiteIdRef.current = activeSiteId;
  }, [activeSiteId]);

  useEffect(() => {
    customAudioMapRef.current = customAudioMap;
  }, [customAudioMap]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    selectedChapterIdxRef.current = selectedChapterIdx;
  }, [selectedChapterIdx]);

  useEffect(() => {
    activeSentenceIndexRef.current = activeSentenceIndex;
  }, [activeSentenceIndex]);

  useEffect(() => {
    playbackSpeedRef.current = playbackSpeed;
  }, [playbackSpeed]);

  // Cleanup all speech & object URLs on unmount
  useEffect(() => {
    return () => {
      speechEngine.stop();
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        htmlAudioRef.current.src = '';
      }
      customAudioUrlsRef.current.forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const activeSite = useMemo(
    () => sites.find((s) => s.id === activeSiteId) || sites[0],
    [sites, activeSiteId]
  );

  // Automatically log Audio Guide listening to personal visit history (/users/{uid}/visitHistory)
  useEffect(() => {
    if (!isPlaying || !user || !activeSite) return;
    recordPersonalVisitHistory({
      uid: user.firebaseUid || user.userId,
      siteId: activeSite.id,
      siteName: activeSite.officialName,
      activityType: 'audio_guide',
    });
  }, [isPlaying, user, activeSite]);

  const localizedSite = useMemo(
    () => getLocalizedSite(activeSite),
    [activeSite, getLocalizedSite]
  );

  const customAudio = customAudioMap[activeSite.id] || null;
  const shouldUseCustomAudioForSite = useCallback(
    (siteId: string, targetLang: Language, audioMap: Record<string, CustomAudioTrack>): boolean => {
      const track = audioMap[siteId];
      const hasBaked = Boolean(BAKED_ASSETS[siteId]?.audioUrl);
      if ((!track || !track.url) && !hasBaked) return false;
      if (audioFailedToTtsBySite[siteId]) return false;
      const override = audioSourceOverrideBySite[siteId];
      if (override === 'tts') return false;
      if (override === 'custom') return true;
      // Vietnamese (VI) always plays authentic studio .m4a voice recordings first; EN/ZH uses multilingual TTS
      return targetLang === 'vi';
    },
    [audioSourceOverrideBySite, audioFailedToTtsBySite]
  );
  const isUsingCustomAudio = shouldUseCustomAudioForSite(activeSite.id, lang, customAudioMap);

  const getOrderedCandidatesForSite = useCallback(
    (siteId: string, overrideTrack?: CustomAudioTrack | null): string[] => {
      const track = overrideTrack ?? customAudioMapRef.current[siteId] ?? null;
      const bakedCandidates = getBakedAudioCandidateUrls(siteId);

      // If admin uploaded a local blob or custom non-baked cloud file, try that first, then baked GitHub chain
      if (
        track?.url &&
        (track.sourceTier === 'indexed_db' ||
          track.sourceTier === 'firebase_cloud' ||
          track.url.startsWith('blob:'))
      ) {
        return Array.from(
          new Set([track.url, track.fallbackUrl || '', ...bakedCandidates].filter(Boolean))
        );
      }

      return Array.from(
        new Set([...bakedCandidates, track?.url || '', track?.fallbackUrl || ''].filter(Boolean))
      );
    },
    []
  );

  // Build authentic 4 chapters in current language (VI / EN / ZH)
  const { folioTitle, chapters, ttsTotalDurationSec } = useMemo(() => {
    const curated = getCuratedAudioScript(activeSite.id, lang);
    const cmsOverrides = loadCmsSiteOverrides();
    const hiddenSet = new Set(cmsOverrides[activeSite.id]?.hiddenChapterIds || []);

    if (curated) {
      const visibleRaw = canPreviewHidden
        ? curated.chapters
        : curated.chapters.filter((ch) => !hiddenSet.has(ch.id));
      const effectiveRaw = visibleRaw.length > 0 ? visibleRaw : curated.chapters.slice(0, 1);
      const total = Math.max(
        1,
        effectiveRaw.reduce((sum, ch) => sum + ch.durationSec, 0)
      );
      let accSec = 0;
      const computed: ComputedChapter[] = effectiveRaw.map((ch, idx) => {
        const startSec = accSec;
        const startPercent = (startSec / total) * 100;
        accSec += ch.durationSec;
        const endPercent = idx === effectiveRaw.length - 1 ? 100 : (accSec / total) * 100;
        return {
          id: ch.id,
          roman: ch.roman,
          title: ch.title,
          durationLabel: formatClock(ch.durationSec),
          durationSec: ch.durationSec,
          startSec,
          startPercent,
          endPercent,
          narration: ch.narration,
          sentences: splitTextIntoSentences(ch.narration),
          isHiddenForVisitors: canPreviewHidden && hiddenSet.has(ch.id),
        };
      });

      return {
        folioTitle: curated.folioTitle,
        chapters: computed,
        ttsTotalDurationSec: total,
      };
    }

    // Fallback synthesis if an unknown site ID is ever added dynamically
    const fallbackTotal = 240;
    const rawNarration = localizedSite.summary || activeSite.summary;
    const fallbackChapters: ComputedChapter[] = [
      {
        id: 'ch1',
        roman: lang === 'zh' ? '第一章' : lang === 'en' ? 'CHAPTER I' : 'CHƯƠNG I',
        title: localizedSite.officialName,
        durationLabel: formatClock(fallbackTotal),
        durationSec: fallbackTotal,
        startSec: 0,
        startPercent: 0,
        endPercent: 100,
        narration: rawNarration,
        sentences: splitTextIntoSentences(rawNarration),
      },
    ];
    return {
      folioTitle: localizedSite.officialName,
      chapters: fallbackChapters,
      ttsTotalDurationSec: fallbackTotal,
    };
  }, [activeSite, localizedSite, lang, cmsScriptVersion, canPreviewHidden]);

  const chaptersRef = useRef(chapters);
  useEffect(() => {
    chaptersRef.current = chapters;
  }, [chapters]);

  const safeChapterIdx = Math.min(selectedChapterIdx, Math.max(0, chapters.length - 1));
  const activeChapter = chapters[safeChapterIdx] || chapters[0];
  const sentences = activeChapter?.sentences || [];

  const totalDurationSec = useMemo(() => {
    if (isUsingCustomAudio && customAudio && customAudio.durationSec > 0) {
      return customAudio.durationSec;
    }
    return ttsTotalDurationSec;
  }, [isUsingCustomAudio, customAudio, ttsTotalDurationSec]);

  const isUsingCustomAudioRef = useRef<boolean>(isUsingCustomAudio);
  const totalDurationSecRef = useRef<number>(totalDurationSec);

  const computeCurrentTimeSec = useCallback((progress: number, customSec?: number) => {
    if (isUsingCustomAudioRef.current) {
      return customSec !== undefined ? customSec : customAudioCurrentSecRef.current;
    }
    return (progress / 100) * totalDurationSecRef.current;
  }, []);

  const updatePlaybackProgress = useCallback(
    (nextProgress: number, nextCustomSec?: number) => {
      const clamped = Math.max(0, Math.min(100, nextProgress));
      playbackProgressRef.current = clamped;
      if (nextCustomSec !== undefined) {
        customAudioCurrentSecRef.current = nextCustomSec;
      }
      const timeSec = computeCurrentTimeSec(clamped, nextCustomSec);
      progressSubscribersRef.current.forEach((cb) => {
        try {
          cb(clamped, timeSec);
        } catch {
          // ignore subscriber errors
        }
      });
    },
    [computeCurrentTimeSec]
  );

  useEffect(() => {
    isUsingCustomAudioRef.current = isUsingCustomAudio;
    totalDurationSecRef.current = totalDurationSec;
    const timeSec = computeCurrentTimeSec(playbackProgressRef.current);
    progressSubscribersRef.current.forEach((cb) => {
      try {
        cb(playbackProgressRef.current, timeSec);
      } catch {
        // ignore subscriber errors
      }
    });
  }, [isUsingCustomAudio, totalDurationSec, computeCurrentTimeSec]);

  const getPlaybackProgress = useCallback(() => playbackProgressRef.current, []);
  const getCurrentTimeSec = useCallback(
    () => computeCurrentTimeSec(playbackProgressRef.current),
    [computeCurrentTimeSec]
  );
  const subscribePlaybackProgress = useCallback(
    (listener: (progress: number, timeSec: number) => void) => {
      progressSubscribersRef.current.add(listener);
      return () => {
        progressSubscribersRef.current.delete(listener);
      };
    },
    []
  );

  // Helper to start speaking a specific chapter & sentence index using chunked engine
  const startTtsAt = useCallback(
    (
      chapterIdx: number,
      sentenceIdx: number,
      targetLang: Language,
      speed: SupportedPlaybackSpeed,
      chaptersSnapshot?: ComputedChapter[]
    ) => {
      const list = chaptersSnapshot || chaptersRef.current;
      const ch = list[chapterIdx];
      if (!ch || ch.sentences.length === 0) {
        speechEngine.stop();
        setIsPlaying(false);
        return;
      }

      const clampedSentenceIdx = Math.max(0, Math.min(sentenceIdx, ch.sentences.length - 1));
      setSelectedChapterIdx(chapterIdx);
      setActiveSentenceIndex(clampedSentenceIdx);
      setIsPlaying(true);
      setHasActiveSession(true);

      const chapterSpan = Math.max(1, ch.endPercent - ch.startPercent);

      speechEngine.speakSentences(ch.sentences, {
        lang: targetLang,
        rate: speed,
        volume: isMutedRef.current ? 0 : 1,
        startIndex: clampedSentenceIdx,
        onSentenceStart: (idx) => {
          setActiveSentenceIndex(idx);
          const ratio = ch.sentences.length > 0 ? idx / ch.sentences.length : 0;
          updatePlaybackProgress(Math.min(99, ch.startPercent + ratio * chapterSpan));
        },
        onComplete: () => {
          const latestChapters = chaptersRef.current;
          const nextChapterIdx = chapterIdx + 1;
          if (nextChapterIdx < latestChapters.length) {
            startTtsAt(nextChapterIdx, 0, targetLang, playbackSpeedRef.current, latestChapters);
          } else {
            setIsPlaying(false);
            updatePlaybackProgress(100);
          }
        },
      });
    },
    [updatePlaybackProgress]
  );

  const ensureSingleHtmlAudio = useCallback((): HTMLAudioElement | null => {
    if (!htmlAudioRef.current && typeof Audio !== 'undefined') {
      const el = new Audio();
      el.preload = 'metadata';
      htmlAudioRef.current = el;
    }
    return htmlAudioRef.current;
  }, []);

  /**
   * Advances to the next candidate URL (GitHub API exact -> NFC/NFD jsDelivr -> API raw -> NFC/NFD raw)
   * when an audio URL fails to load or decode. Falls back to Web Speech API only after ALL candidates fail.
   */
  const tryNextCandidateOrFallbackTts = useCallback(
    (siteId: string, shouldPlay: boolean) => {
      const audioEl = ensureSingleHtmlAudio();
      if (!audioEl) return;

      const candidates = getOrderedCandidatesForSite(siteId);
      const currentIdx = candidateIndexBySiteRef.current[siteId] ?? 0;
      const nextIdx = currentIdx + 1;

      if (nextIdx < candidates.length) {
        const nextUrl = candidates[nextIdx];
        candidateIndexBySiteRef.current[siteId] = nextIdx;
        isSwitchingCandidateRef.current = true;
        console.warn(
          `[AudioGuide] Candidate #${currentIdx} failed for ${siteId}; retrying #${nextIdx}:`,
          nextUrl
        );
        audioEl.src = nextUrl;
        audioEl.setAttribute('data-site-id', siteId);
        audioEl.setAttribute('data-candidate-url', nextUrl);
        audioEl.load();
        audioEl.playbackRate = playbackSpeedRef.current;
        audioEl.muted = isMutedRef.current;
        audioEl.volume = isMutedRef.current ? 0 : speechEngine.getGlobalVolume();

        if (shouldPlay) {
          cancelBrowserSpeechSynthesis();
          audioEl
            .play()
            .then(() => {
              isSwitchingCandidateRef.current = false;
              setIsPlaying(true);
              setHasActiveSession(true);
            })
            .catch((err) => {
              isSwitchingCandidateRef.current = false;
              if (err instanceof Error && err.name === 'AbortError') return;
              if (err instanceof Error && err.name === 'NotAllowedError') {
                setIsPlaying(false);
                return;
              }
              tryNextCandidateOrFallbackTts(siteId, true);
            });
        } else {
          isSwitchingCandidateRef.current = false;
        }
        return;
      }

      isSwitchingCandidateRef.current = false;
      console.warn(
        `[AudioGuide] All ${candidates.length} audio candidate URLs failed for ${siteId}; falling back to Web Speech API.`
      );
      setAudioFailedToTtsBySite((prev) => ({ ...prev, [siteId]: true }));
      if (shouldPlay) {
        startTtsAt(
          selectedChapterIdxRef.current,
          activeSentenceIndexRef.current,
          lang,
          playbackSpeedRef.current
        );
      } else {
        setIsPlaying(false);
      }
    },
    [ensureSingleHtmlAudio, getOrderedCandidatesForSite, lang, startTtsAt]
  );

  /**
   * Single unified entry point controlling the ONE HTMLAudioElement for all studio .m4a playback
   * (used by bottom Play button, FloatingAudioBar, chapter "Nghe thuyết minh" buttons, and site launch).
   */
  const playHtmlAudioForSite = useCallback(
    (
      siteId: string,
      options?: { restart?: boolean; seekPercent?: number; overrideTrack?: CustomAudioTrack | null }
    ): boolean => {
      const audioEl = ensureSingleHtmlAudio();
      if (!audioEl) return false;

      const candidates = getOrderedCandidatesForSite(siteId, options?.overrideTrack);
      if (candidates.length === 0) return false;

      cancelBrowserSpeechSynthesis();

      let idx = candidateIndexBySiteRef.current[siteId] ?? 0;
      if (idx < 0 || idx >= candidates.length) {
        idx = 0;
        candidateIndexBySiteRef.current[siteId] = 0;
      }
      const targetUrl = candidates[idx];
      const currentAssignedUrl = audioEl.getAttribute('data-candidate-url') || '';
      const currentAssignedSite = audioEl.getAttribute('data-site-id') || '';
      const needsSourceLoad =
        currentAssignedSite !== siteId ||
        currentAssignedUrl !== targetUrl ||
        !audioEl.src ||
        audioEl.readyState === 0;

      if (needsSourceLoad) {
        isSwitchingCandidateRef.current = true;
        audioEl.src = targetUrl;
        audioEl.setAttribute('data-site-id', siteId);
        audioEl.setAttribute('data-candidate-url', targetUrl);
        audioEl.load();
      }

      if (options?.restart) {
        pendingSeekPercentRef.current = null;
        try {
          audioEl.currentTime = 0;
        } catch {
          // ignore if metadata not yet loaded
        }
        updatePlaybackProgress(0, 0);
      } else if (typeof options?.seekPercent === 'number') {
        const clampedPct = Math.max(0, Math.min(99.5, options.seekPercent));
        if (audioEl.duration && Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
          const targetSec = (clampedPct / 100) * audioEl.duration;
          audioEl.currentTime = targetSec;
          pendingSeekPercentRef.current = null;
          updatePlaybackProgress(clampedPct, targetSec);
        } else {
          pendingSeekPercentRef.current = clampedPct;
          updatePlaybackProgress(clampedPct);
        }
      }

      audioEl.playbackRate = playbackSpeedRef.current;
      audioEl.muted = isMutedRef.current;
      audioEl.volume = isMutedRef.current ? 0 : speechEngine.getGlobalVolume();

      setHasActiveSession(true);

      audioEl
        .play()
        .then(() => {
          isSwitchingCandidateRef.current = false;
          setIsPlaying(true);
        })
        .catch((err) => {
          isSwitchingCandidateRef.current = false;
          if (err instanceof Error && err.name === 'AbortError') return;
          if (err instanceof Error && err.name === 'NotAllowedError') {
            setIsPlaying(false);
            return;
          }
          tryNextCandidateOrFallbackTts(siteId, true);
        });

      return true;
    },
    [
      ensureSingleHtmlAudio,
      getOrderedCandidatesForSite,
      tryNextCandidateOrFallbackTts,
      updatePlaybackProgress,
    ]
  );

  // Sync HTML5 <audio> element lifecycle with automatic multi-candidate fallback -> TTS
  useEffect(() => {
    const audioEl = ensureSingleHtmlAudio();
    if (!audioEl) return;

    const handleTimeUpdate = () => {
      if (!audioEl.duration || !Number.isFinite(audioEl.duration) || audioEl.duration <= 0) return;
      updatePlaybackProgress(
        (audioEl.currentTime / audioEl.duration) * 100,
        audioEl.currentTime
      );
    };

    const handleLoadedMeta = () => {
      const siteId = audioEl.getAttribute('data-site-id') || activeSiteIdRef.current;
      if (audioEl.duration && Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
        const dur = audioEl.duration;
        void updateAudioDurationInVault(siteId, dur);
        setCustomAudioMap((prev) => {
          const existing = prev[siteId];
          if (!existing || Math.abs(existing.durationSec - dur) < 0.5) return prev;
          return {
            ...prev,
            [siteId]: { ...existing, durationSec: dur },
          };
        });

        if (pendingSeekPercentRef.current !== null) {
          const pct = pendingSeekPercentRef.current;
          pendingSeekPercentRef.current = null;
          const targetSec = (pct / 100) * dur;
          try {
            audioEl.currentTime = targetSec;
            updatePlaybackProgress(pct, targetSec);
          } catch {
            // ignore seek timing error
          }
        }
      }
    };

    const handlePlaying = () => {
      isSwitchingCandidateRef.current = false;
      setIsPlaying(true);
      setHasActiveSession(true);
    };

    const handlePause = () => {
      if (!isSwitchingCandidateRef.current && isUsingCustomAudioRef.current && !audioEl.ended) {
        setIsPlaying(false);
      }
    };

    const handleEnded = () => {
      isSwitchingCandidateRef.current = false;
      setIsPlaying(false);
      updatePlaybackProgress(100);
    };

    const handleAudioError = () => {
      const siteId = audioEl.getAttribute('data-site-id') || activeSiteIdRef.current;
      const shouldKeepPlaying = isPlayingRef.current || isSwitchingCandidateRef.current;
      if (isUsingCustomAudioRef.current) {
        tryNextCandidateOrFallbackTts(siteId, shouldKeepPlaying);
      }
    };

    audioEl.addEventListener('timeupdate', handleTimeUpdate);
    audioEl.addEventListener('loadedmetadata', handleLoadedMeta);
    audioEl.addEventListener('playing', handlePlaying);
    audioEl.addEventListener('pause', handlePause);
    audioEl.addEventListener('ended', handleEnded);
    audioEl.addEventListener('error', handleAudioError);

    return () => {
      audioEl.removeEventListener('timeupdate', handleTimeUpdate);
      audioEl.removeEventListener('loadedmetadata', handleLoadedMeta);
      audioEl.removeEventListener('playing', handlePlaying);
      audioEl.removeEventListener('pause', handlePause);
      audioEl.removeEventListener('ended', handleEnded);
      audioEl.removeEventListener('error', handleAudioError);
    };
  }, [ensureSingleHtmlAudio, tryNextCandidateOrFallbackTts, updatePlaybackProgress]);

  // Keep HTMLAudioElement properties synced (rate, mute, volume) & preload metadata for active site
  useEffect(() => {
    const audioEl = ensureSingleHtmlAudio();
    if (!audioEl) return;

    if (isUsingCustomAudio) {
      audioEl.playbackRate = playbackSpeed;
      audioEl.muted = isMuted;
      audioEl.volume = isMuted ? 0 : speechEngine.getGlobalVolume();

      // Preload active site metadata quietly when paused so duration displays promptly
      const candidates = getOrderedCandidatesForSite(activeSite.id);
      const idx = Math.min(candidateIndexBySiteRef.current[activeSite.id] ?? 0, Math.max(0, candidates.length - 1));
      const desiredUrl = candidates[idx] || '';
      const assignedSite = audioEl.getAttribute('data-site-id') || '';
      if (desiredUrl && assignedSite !== activeSite.id && audioEl.paused) {
        audioEl.src = desiredUrl;
        audioEl.setAttribute('data-site-id', activeSite.id);
        audioEl.setAttribute('data-candidate-url', desiredUrl);
        audioEl.load();
      }
    } else {
      if (!audioEl.paused) {
        audioEl.pause();
      }
    }
  }, [
    activeSite.id,
    isUsingCustomAudio,
    playbackSpeed,
    isMuted,
    ensureSingleHtmlAudio,
    getOrderedCandidatesForSite,
  ]);

  // Listen to Global Sound Mixer Voice Narrations volume changes
  useEffect(() => {
    let ttsSyncTimer: number | null = null;
    const onGlobalVoiceVolumeChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ volume?: number }>).detail;
      const vol01 =
        typeof detail?.volume === 'number' ? detail.volume : speechEngine.getGlobalVolume();

      if (htmlAudioRef.current) {
        htmlAudioRef.current.volume = isMutedRef.current ? 0 : Math.max(0, Math.min(1, vol01));
      }

      if (isPlayingRef.current && !isUsingCustomAudioRef.current) {
        if (ttsSyncTimer !== null) {
          window.clearTimeout(ttsSyncTimer);
        }
        ttsSyncTimer = window.setTimeout(() => {
          ttsSyncTimer = null;
          if (isPlayingRef.current && !isUsingCustomAudioRef.current) {
            startTtsAt(
              selectedChapterIdxRef.current,
              activeSentenceIndexRef.current,
              lang,
              playbackSpeedRef.current
            );
          }
        }, 220);
      }
    };

    window.addEventListener(SPEECH_VOLUME_CHANGED_EVENT, onGlobalVoiceVolumeChanged);
    return () => {
      window.removeEventListener(SPEECH_VOLUME_CHANGED_EVENT, onGlobalVoiceVolumeChanged);
      if (ttsSyncTimer !== null) {
        window.clearTimeout(ttsSyncTimer);
      }
    };
  }, [lang, startTtsAt]);

  // Smooth progress micro-tick during TTS playback so scrubber feels alive between sentences
  useEffect(() => {
    if (!isPlaying || isUsingCustomAudio) return;

    const timer = window.setInterval(() => {
      const ch = chaptersRef.current[selectedChapterIdxRef.current];
      if (!ch) return;
      const step = (0.3 / totalDurationSec) * 100 * playbackSpeedRef.current;
      const prev = playbackProgressRef.current;
      const cap = Math.max(ch.startPercent, ch.endPercent - 0.5);
      if (prev < cap) {
        updatePlaybackProgress(Math.min(cap, prev + step));
      }
    }, 300);

    return () => window.clearInterval(timer);
  }, [isPlaying, isUsingCustomAudio, totalDurationSec, updatePlaybackProgress]);

  // CRITICAL: React immediately when global language VI | EN | ZH changes!
  useEffect(() => {
    if (prevLangRef.current === lang) return;
    prevLangRef.current = lang;

    // Reset sentence pointer to 0 in current chapter so new language text matches cleanly
    setActiveSentenceIndex(0);

    if (isPlayingRef.current && isUsingCustomAudio) {
      playHtmlAudioForSite(activeSite.id);
    } else if (isPlayingRef.current && !isUsingCustomAudio) {
      // Cancel old voice + 80ms delay + restart from sentence 0 in the new language
      startTtsAt(selectedChapterIdxRef.current, 0, lang, playbackSpeedRef.current, chapters);
    } else if (!isUsingCustomAudio) {
      speechEngine.stop();
    }
  }, [lang, chapters, isUsingCustomAudio, activeSite.id, playHtmlAudioForSite, startTtsAt]);

  const play = useCallback(() => {
    setHasActiveSession(true);
    trackPlatformInteraction('audio', activeSite.id);
    if (isUsingCustomAudio) {
      const started = playHtmlAudioForSite(activeSite.id);
      if (started) return;
    }
    startTtsAt(
      selectedChapterIdxRef.current,
      activeSentenceIndexRef.current,
      lang,
      playbackSpeedRef.current
    );
  }, [activeSite.id, isUsingCustomAudio, playHtmlAudioForSite, lang, startTtsAt]);

  const pause = useCallback(() => {
    isSwitchingCandidateRef.current = false;
    cancelBrowserSpeechSynthesis();
    if (htmlAudioRef.current) {
      htmlAudioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const toggleMute = useCallback(() => {
    const nextMuted = !isMutedRef.current;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);

    if (htmlAudioRef.current) {
      htmlAudioRef.current.muted = nextMuted;
    }

    if (isPlayingRef.current && !isUsingCustomAudioRef.current) {
      startTtsAt(
        selectedChapterIdxRef.current,
        activeSentenceIndexRef.current,
        lang,
        playbackSpeedRef.current
      );
    }
  }, [lang, startTtsAt]);

  const selectSite = useCallback(
    (siteId: string, autoPlay?: boolean) => {
      if (siteId === activeSiteId) return;
      const wasPlaying = isPlayingRef.current;
      isSwitchingCandidateRef.current = false;
      pendingSeekPercentRef.current = null;
      cancelBrowserSpeechSynthesis();
      if (htmlAudioRef.current) {
        htmlAudioRef.current.pause();
        try {
          htmlAudioRef.current.currentTime = 0;
        } catch {
          // ignore
        }
      }

      setActiveSiteId(siteId);
      activeSiteIdRef.current = siteId;
      setSelectedChapterIdx(0);
      setActiveSentenceIndex(0);
      updatePlaybackProgress(0, 0);

      const shouldPlay = autoPlay ?? wasPlaying;
      if (shouldPlay) {
        const targetUseCustom = shouldUseCustomAudioForSite(siteId, lang, customAudioMapRef.current);
        if (targetUseCustom) {
          playHtmlAudioForSite(siteId, { restart: true });
        } else {
          const curated = getCuratedAudioScript(siteId, lang);
          if (curated) {
            const cmsOverrides = loadCmsSiteOverrides();
            const hiddenSet = new Set(cmsOverrides[siteId]?.hiddenChapterIds || []);
            const visibleRaw = canPreviewHidden
              ? curated.chapters
              : curated.chapters.filter((ch) => !hiddenSet.has(ch.id));
            const effectiveRaw = visibleRaw.length > 0 ? visibleRaw : curated.chapters.slice(0, 1);
            const total = Math.max(
              1,
              effectiveRaw.reduce((sum, ch) => sum + ch.durationSec, 0)
            );
            let accSec = 0;
            const nextChapters: ComputedChapter[] = effectiveRaw.map((ch, idx) => {
              const startSec = accSec;
              const startPercent = (startSec / total) * 100;
              accSec += ch.durationSec;
              const endPercent = idx === effectiveRaw.length - 1 ? 100 : (accSec / total) * 100;
              return {
                id: ch.id,
                roman: ch.roman,
                title: ch.title,
                durationLabel: formatClock(ch.durationSec),
                durationSec: ch.durationSec,
                startSec,
                startPercent,
                endPercent,
                narration: ch.narration,
                sentences: splitTextIntoSentences(ch.narration),
                isHiddenForVisitors: canPreviewHidden && hiddenSet.has(ch.id),
              };
            });
            startTtsAt(0, 0, lang, playbackSpeedRef.current, nextChapters);
          } else {
            const targetSite = sites.find((s) => s.id === siteId);
            if (targetSite) {
              const targetLoc = getLocalizedSite(targetSite);
              const fallbackTotal = 240;
              const rawNarration = targetLoc.summary || targetSite.summary;
              const fallbackChapters: ComputedChapter[] = [
                {
                  id: 'ch1',
                  roman: lang === 'zh' ? '第一章' : lang === 'en' ? 'CHAPTER I' : 'CHƯƠNG I',
                  title: targetLoc.officialName,
                  durationLabel: formatClock(fallbackTotal),
                  durationSec: fallbackTotal,
                  startSec: 0,
                  startPercent: 0,
                  endPercent: 100,
                  narration: rawNarration,
                  sentences: splitTextIntoSentences(rawNarration),
                },
              ];
              startTtsAt(0, 0, lang, playbackSpeedRef.current, fallbackChapters);
            }
          }
        }
      } else {
        setIsPlaying(false);
      }
    },
    [
      activeSiteId,
      shouldUseCustomAudioForSite,
      playHtmlAudioForSite,
      lang,
      sites,
      getLocalizedSite,
      startTtsAt,
      updatePlaybackProgress,
      canPreviewHidden,
    ]
  );

  const ensureAudioGuidePermission = useCallback(
    (targetSiteId: string): boolean => {
      const uid = user?.firebaseUid || user?.userId;
      const subscription = loadLocalUserSubscription(uid, user?.email);
      const previewRole = getAdminPreviewRole();
      const perms = evaluateSitePermissions({
        isAdmin,
        isTesterPro,
        subscription,
        previewRole,
        siteId: targetSiteId,
      });
      if (!perms.canUseAudioGuide) {
        openUpgradePrompt({
          featureKey: 'audio_guide',
          siteId: targetSiteId,
          siteName: getSiteNameById(targetSiteId),
          requiredPlan: perms.isPlusScopeLockedForSite ? 'pro' : 'plus_or_pro',
          isPlusScopeMismatch: perms.isPlusScopeLockedForSite,
        });
        return false;
      }
      return true;
    },
    [user?.firebaseUid, user?.userId, user?.email, isAdmin, isTesterPro]
  );

  const startAudioGuideForSite = useCallback(
    (siteId: string) => {
      if (!siteId) return;
      if (!ensureAudioGuidePermission(siteId)) return;
      setHasActiveSession(true);
      trackPlatformInteraction('audio', siteId);

      const useTargetCustom = shouldUseCustomAudioForSite(siteId, lang, customAudioMapRef.current);

      if (siteId !== activeSiteId) {
        selectSite(siteId, true);
        return;
      }

      if (useTargetCustom) {
        const started = playHtmlAudioForSite(siteId, { restart: true });
        if (started) return;
      }

      updatePlaybackProgress(0, 0);
      startTtsAt(0, 0, lang, playbackSpeedRef.current);
    },
    [
      ensureAudioGuidePermission,
      activeSiteId,
      selectSite,
      shouldUseCustomAudioForSite,
      playHtmlAudioForSite,
      lang,
      startTtsAt,
      updatePlaybackProgress,
    ]
  );

  const openModalForSite = useCallback(
    (siteId: string) => {
      const targetId = siteId || activeSiteId;
      if (targetId && !ensureAudioGuidePermission(targetId)) return;
      if (siteId && siteId !== activeSiteId) {
        selectSite(siteId, false);
      }
      setIsModalOpen(true);
    },
    [activeSiteId, ensureAudioGuidePermission, selectSite]
  );

  const closeModalAndStop = useCallback(() => {
    pause();
    setIsModalOpen(false);
    setHasActiveSession(false);
  }, [pause]);

  const minimizeModalKeepPlaying = useCallback(() => {
    setIsModalOpen(false);
    if (isPlayingRef.current || hasActiveSession) {
      setHasActiveSession(true);
    }
  }, [hasActiveSession]);

  const dismissFloatingBar = useCallback(() => {
    pause();
    setHasActiveSession(false);
  }, [pause]);

  const selectChapter = useCallback(
    (chapterIdx: number, autoPlay = true) => {
      const clamped = Math.max(0, Math.min(chapterIdx, chaptersRef.current.length - 1));
      const ch = chaptersRef.current[clamped];
      if (!ch) return;

      setSelectedChapterIdx(clamped);
      setActiveSentenceIndex(0);
      updatePlaybackProgress(ch.startPercent);

      // Always route through the single HTMLAudioElement when studio recording is active,
      // even before audioEl.duration metadata has finished loading!
      if (isUsingCustomAudio) {
        if (autoPlay) {
          playHtmlAudioForSite(activeSite.id, { seekPercent: ch.startPercent });
        } else if (
          htmlAudioRef.current &&
          htmlAudioRef.current.duration &&
          Number.isFinite(htmlAudioRef.current.duration)
        ) {
          const targetTime = (ch.startPercent / 100) * htmlAudioRef.current.duration;
          htmlAudioRef.current.currentTime = targetTime;
          updatePlaybackProgress(ch.startPercent, targetTime);
        }
        return;
      }

      if (autoPlay || isPlayingRef.current) {
        startTtsAt(clamped, 0, lang, playbackSpeedRef.current);
      } else {
        speechEngine.stop();
      }
    },
    [activeSite.id, isUsingCustomAudio, playHtmlAudioForSite, lang, startTtsAt, updatePlaybackProgress]
  );

  const prevChapter = useCallback(() => {
    selectChapter(Math.max(0, selectedChapterIdxRef.current - 1), true);
  }, [selectChapter]);

  const nextChapter = useCallback(() => {
    selectChapter(Math.min(chaptersRef.current.length - 1, selectedChapterIdxRef.current + 1), true);
  }, [selectChapter]);

  const jumpToSentence = useCallback(
    (sentenceIdx: number) => {
      if (isUsingCustomAudio) {
        // Switch smoothly to TTS from that clicked sentence if user taps Teleprompter
        setAudioSourceOverrideBySite((prev) => ({ ...prev, [activeSite.id]: 'tts' }));
        if (htmlAudioRef.current) htmlAudioRef.current.pause();
      }
      startTtsAt(selectedChapterIdxRef.current, sentenceIdx, lang, playbackSpeedRef.current);
    },
    [isUsingCustomAudio, activeSite.id, lang, startTtsAt]
  );

  const setSpeed = useCallback(
    (newSpeed: SupportedPlaybackSpeed) => {
      setPlaybackSpeed(newSpeed);
      playbackSpeedRef.current = newSpeed;

      if (isUsingCustomAudio && htmlAudioRef.current) {
        htmlAudioRef.current.playbackRate = newSpeed;
        return;
      }

      if (isPlayingRef.current) {
        startTtsAt(
          selectedChapterIdxRef.current,
          activeSentenceIndexRef.current,
          lang,
          newSpeed
        );
      }
    },
    [isUsingCustomAudio, lang, startTtsAt]
  );

  const cycleSpeed = useCallback(() => {
    const speeds: SupportedPlaybackSpeed[] = [1, 1.25, 1.5];
    const idx = speeds.indexOf(playbackSpeedRef.current);
    const next = speeds[(idx + 1) % speeds.length];
    setSpeed(next);
  }, [setSpeed]);

  const seekToPercent = useCallback(
    (percent: number) => {
      const clampedPct = Math.max(0, Math.min(100, percent));

      if (isUsingCustomAudio) {
        const audioEl = htmlAudioRef.current;
        if (audioEl && audioEl.duration && Number.isFinite(audioEl.duration) && audioEl.duration > 0) {
          const t = (clampedPct / 100) * audioEl.duration;
          audioEl.currentTime = t;
          updatePlaybackProgress(clampedPct, t);
          if (!isPlayingRef.current) {
            playHtmlAudioForSite(activeSite.id);
          }
        } else {
          playHtmlAudioForSite(activeSite.id, { seekPercent: clampedPct });
        }
        return;
      }

      updatePlaybackProgress(clampedPct);

      const list = chaptersRef.current;
      let targetChIdx = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        if (clampedPct >= list[i].startPercent) {
          targetChIdx = i;
          break;
        }
      }
      const ch = list[targetChIdx];
      const span = Math.max(1, ch.endPercent - ch.startPercent);
      const localRatio = Math.max(0, Math.min(0.99, (clampedPct - ch.startPercent) / span));
      const targetSentIdx = Math.min(
        Math.max(0, ch.sentences.length - 1),
        Math.floor(localRatio * ch.sentences.length)
      );

      startTtsAt(targetChIdx, targetSentIdx, lang, playbackSpeedRef.current);
    },
    [activeSite.id, isUsingCustomAudio, playHtmlAudioForSite, lang, startTtsAt, updatePlaybackProgress]
  );

  const seekBySeconds = useCallback(
    (deltaSec: number) => {
      if (isUsingCustomAudio && htmlAudioRef.current && htmlAudioRef.current.duration) {
        const nextT = Math.max(
          0,
          Math.min(htmlAudioRef.current.duration, htmlAudioRef.current.currentTime + deltaSec)
        );
        htmlAudioRef.current.currentTime = nextT;
        updatePlaybackProgress((nextT / htmlAudioRef.current.duration) * 100, nextT);
        return;
      }

      const ch = chaptersRef.current[selectedChapterIdxRef.current];
      if (!ch) return;
      const curSent = activeSentenceIndexRef.current;
      if (deltaSec < 0) {
        if (curSent > 0) {
          startTtsAt(selectedChapterIdxRef.current, curSent - 1, lang, playbackSpeedRef.current);
        } else if (selectedChapterIdxRef.current > 0) {
          const prevChIdx = selectedChapterIdxRef.current - 1;
          const prevCh = chaptersRef.current[prevChIdx];
          startTtsAt(
            prevChIdx,
            Math.max(0, prevCh.sentences.length - 1),
            lang,
            playbackSpeedRef.current
          );
        }
      } else {
        if (curSent + 1 < ch.sentences.length) {
          startTtsAt(selectedChapterIdxRef.current, curSent + 1, lang, playbackSpeedRef.current);
        } else if (selectedChapterIdxRef.current + 1 < chaptersRef.current.length) {
          startTtsAt(selectedChapterIdxRef.current + 1, 0, lang, playbackSpeedRef.current);
        }
      }
    },
    [isUsingCustomAudio, lang, startTtsAt]
  );

  const uploadCustomAudio = useCallback(
    (siteId: string, file: File) => {
      const objectUrl = URL.createObjectURL(file);
      customAudioUrlsRef.current.push(objectUrl);

      const nextTrack: CustomAudioTrack = {
        url: objectUrl,
        fileName: file.name,
        durationSec: 0,
        sourceTier: 'indexed_db',
      };

      candidateIndexBySiteRef.current[siteId] = 0;
      setAudioFailedToTtsBySite((prev) => ({ ...prev, [siteId]: false }));

      setCustomAudioMap((prev) => {
        const old = prev[siteId];
        if (old?.url && old.url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(old.url);
          } catch {
            // ignore
          }
        }
        return {
          ...prev,
          [siteId]: nextTrack,
        };
      });

      setAudioSourceOverrideBySite((prev) => ({ ...prev, [siteId]: 'custom' }));

      // Persist binary permanently into Tier 1 IndexedDB Vault & offload to Tier 2 Firebase Storage
      void uploadAssetBinaryToFirebaseStorage('audio', siteId, file, file.name);

      if (siteId === activeSiteId) {
        playHtmlAudioForSite(siteId, { restart: true, overrideTrack: nextTrack });
      }
    },
    [activeSiteId, playHtmlAudioForSite]
  );

  const removeCustomAudio = useCallback(
    (siteId: string) => {
      const existing = customAudioMap[siteId];
      if (existing?.url && existing.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(existing.url);
        } catch {
          // ignore
        }
      }
      saveCloudAudioUrl(siteId, null);
      void deleteAudioFromVault(siteId);

      setCustomAudioMap((prev) => {
        const copy = { ...prev };
        delete copy[siteId];
        return copy;
      });
      if (siteId === activeSiteId) {
        if (htmlAudioRef.current) {
          htmlAudioRef.current.pause();
          htmlAudioRef.current.src = '';
        }
        setIsPlaying(false);
        updatePlaybackProgress(0, 0);
      }
    },
    [customAudioMap, activeSiteId, updatePlaybackProgress]
  );

  const toggleCustomAudioSource = useCallback(
    (useCustom: boolean) => {
      setAudioSourceOverrideBySite((prev) => ({
        ...prev,
        [activeSite.id]: useCustom ? 'custom' : 'tts',
      }));
      pause();
      updatePlaybackProgress(0, 0);
      setActiveSentenceIndex(0);
    },
    [activeSite.id, pause, updatePlaybackProgress]
  );

  const getCustomAudioForSite = useCallback(
    (siteId: string): CustomAudioTrack | null => {
      if (audioSourceOverrideBySite[siteId] === 'tts') return null;
      return customAudioMap[siteId] || null;
    },
    [customAudioMap, audioSourceOverrideBySite]
  );

  const isFloatingBarVisible = !isModalOpen && (isPlaying || hasActiveSession);

  const value = useMemo<AudioGuideContextType>(
    () => ({
      sites,
      activeSiteId: activeSite.id,
      activeSite,
      folioTitle,
      chapters,
      selectedChapterIdx: safeChapterIdx,
      activeChapter,
      sentences,
      activeSentenceIndex,
      isPlaying,
      isMuted,
      playbackSpeed,
      totalDurationSec,
      getPlaybackProgress,
      getCurrentTimeSec,
      subscribePlaybackProgress,
      customAudio,
      isUsingCustomAudio,
      isModalOpen,
      isFloatingBarVisible,
      openModalForSite,
      startAudioGuideForSite,
      closeModalAndStop,
      minimizeModalKeepPlaying,
      dismissFloatingBar,
      selectSite,
      togglePlayPause,
      toggleMute,
      play,
      pause,
      selectChapter,
      prevChapter,
      nextChapter,
      jumpToSentence,
      setSpeed,
      cycleSpeed,
      seekToPercent,
      seekBySeconds,
      uploadCustomAudio,
      removeCustomAudio,
      toggleCustomAudioSource,
      getCustomAudioForSite,
    }),
    [
      sites,
      activeSite,
      folioTitle,
      chapters,
      safeChapterIdx,
      activeChapter,
      sentences,
      activeSentenceIndex,
      isPlaying,
      isMuted,
      playbackSpeed,
      totalDurationSec,
      getPlaybackProgress,
      getCurrentTimeSec,
      subscribePlaybackProgress,
      customAudio,
      isUsingCustomAudio,
      isModalOpen,
      isFloatingBarVisible,
      openModalForSite,
      startAudioGuideForSite,
      closeModalAndStop,
      minimizeModalKeepPlaying,
      dismissFloatingBar,
      selectSite,
      togglePlayPause,
      toggleMute,
      play,
      pause,
      selectChapter,
      prevChapter,
      nextChapter,
      jumpToSentence,
      setSpeed,
      cycleSpeed,
      seekToPercent,
      seekBySeconds,
      uploadCustomAudio,
      removeCustomAudio,
      toggleCustomAudioSource,
      getCustomAudioForSite,
    ]
  );

  return <AudioGuideContext.Provider value={value}>{children}</AudioGuideContext.Provider>;
};

export function useAudioGuide(): AudioGuideContextType {
  const ctx = useContext(AudioGuideContext);
  if (!ctx) {
    throw new Error('useAudioGuide must be used within an AudioGuideProvider');
  }
  return ctx;
}

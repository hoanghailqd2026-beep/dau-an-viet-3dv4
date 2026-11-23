import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAudioGuide } from './AudioGuideContext';
import { useAuth } from './AuthContext';
import { useAdminPreviewRole } from '../utils/subscriptionGatingStore';
import {
  REMOTE_AMBIENT_SYNC_EVENT,
  syncUserPreferencesToCloud,
} from '../utils/realtimeCloudSync';
import {
  AmbientMuseumAudioEngine,
  AmbientPlaylistTrack,
  DEFAULT_AMBIENT_PLAYLIST,
  cloneDefaultAmbientPlaylist,
} from '../utils/ambientAudioEngine';
import {
  Spatial3DAmbientEngine,
  Spatial3DAmbientProfile,
  resolveSpatialProfileForSite,
} from '../utils/spatial3DAmbientEngine';
import {
  CMS_UPDATED_EVENT,
  loadSiteSettings,
  SiteSettings,
} from '../utils/adminPlatformStore';
import {
  SPEECH_ENGINE_STATE_EVENT,
  speechEngine,
} from '../utils/chunkedSpeechEngine';

const VISITOR_PREFS_STORAGE_KEY = 'dau_an_viet_ambient_audio_prefs_v2';
const LEGACY_PREFS_STORAGE_KEY = 'dau_an_viet_ambient_audio_prefs_v1';
export const DEFAULT_AMBIENT_VOLUME = 25; // 0..100 Background Music
export const DEFAULT_VOICE_VOLUME = 85; // 0..100 Voice Narrations
export const DEFAULT_SPATIAL_VOLUME = 40; // 0..100 3D Spatial Ambient Sounds
const DUCKED_AMBIENT_VOLUME = 5; // 0..100 during Audio Guide / Sử Quan Dấu Ấn narration

export type AmbientPlaybackMode = 'auto_next' | 'repeat_one';

export interface Spatial3DContextState {
  active: boolean;
  siteId?: string;
  siteName?: string;
  siteType?: string;
}

interface VisitorAmbientPrefs {
  isMuted: boolean;
  volume: number;
  isVoiceMuted: boolean;
  voiceVolume: number;
  isSpatialMuted: boolean;
  spatialVolume: number;
  playbackMode: AmbientPlaybackMode;
  selectedTrackId: string;
}

function clampPercent(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }
  return fallback;
}

function loadVisitorAmbientPrefs(): VisitorAmbientPrefs {
  const fallback: VisitorAmbientPrefs = {
    isMuted: false,
    volume: DEFAULT_AMBIENT_VOLUME,
    isVoiceMuted: false,
    voiceVolume: DEFAULT_VOICE_VOLUME,
    isSpatialMuted: false,
    spatialVolume: DEFAULT_SPATIAL_VOLUME,
    playbackMode: 'auto_next',
    selectedTrackId: DEFAULT_AMBIENT_PLAYLIST[0].id,
  };
  if (typeof window === 'undefined') return fallback;
  try {
    const raw =
      window.localStorage.getItem(VISITOR_PREFS_STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_PREFS_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<VisitorAmbientPrefs>;
    const vol = clampPercent(parsed.volume, DEFAULT_AMBIENT_VOLUME);
    const voiceVol = clampPercent(parsed.voiceVolume, DEFAULT_VOICE_VOLUME);
    const spatialVol = clampPercent(parsed.spatialVolume, DEFAULT_SPATIAL_VOLUME);
    const mode: AmbientPlaybackMode =
      parsed.playbackMode === 'repeat_one' ? 'repeat_one' : 'auto_next';
    const selectedId =
      typeof parsed.selectedTrackId === 'string' && parsed.selectedTrackId.trim()
        ? parsed.selectedTrackId.trim()
        : DEFAULT_AMBIENT_PLAYLIST[0].id;
    return {
      isMuted: Boolean(parsed.isMuted),
      volume: vol,
      isVoiceMuted: Boolean(parsed.isVoiceMuted),
      voiceVolume: voiceVol,
      isSpatialMuted: Boolean(parsed.isSpatialMuted),
      spatialVolume: spatialVol,
      playbackMode: mode,
      selectedTrackId: selectedId,
    };
  } catch {
    return fallback;
  }
}

function saveVisitorAmbientPrefs(prefs: VisitorAmbientPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(VISITOR_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage quota errors
  }
}

export interface AmbientAudioContextValue {
  playlist: AmbientPlaylistTrack[];
  currentTrack: AmbientPlaylistTrack;
  currentTrackIndex: number;
  playbackMode: AmbientPlaybackMode;
  isMuted: boolean;
  isPlaying: boolean;
  isDucked: boolean;
  isPausedForVideo: boolean;
  isEnabledByAdmin: boolean;
  isLockedForGuest: boolean;
  hasUserInteracted: boolean;
  // Channel 1: Background Music (0..100)
  volume: number;
  effectiveVolume: number;
  // Channel 2: Voice Narrations (0..100)
  voiceVolume: number;
  isVoiceMuted: boolean;
  isNarrationActive: boolean;
  // Channel 3: 3D Spatial Ambient Sounds (0..100)
  spatialVolume: number;
  isSpatialMuted: boolean;
  isSpatial3DActive: boolean;
  isSpatialPlaying: boolean;
  isSpatialPreviewing: boolean;
  spatialProfile: Spatial3DAmbientProfile;
  // Actions
  toggleMute: () => void;
  togglePlayPause: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  selectTrack: (trackId: string) => void;
  togglePlaybackMode: () => void;
  setVolume: (vol: number) => void;
  setVoiceVolume: (vol: number) => void;
  toggleVoiceMute: () => void;
  setSpatialVolume: (vol: number) => void;
  toggleSpatialMute: () => void;
  setSpatialPreviewing: (previewing: boolean) => void;
  setSpatial3DContext: (ctx: Spatial3DContextState) => void;
  resetMixerDefaults: () => void;
  setVideoModalOpen: (open: boolean) => void;
  setAdminPreviewing: (previewing: boolean) => void;
  markUserInteracted: () => void;
}

const AmbientAudioContext = createContext<AmbientAudioContextValue | null>(null);

export const AmbientAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isPlaying: isAudioGuidePlaying } = useAudioGuide();
  const { user, isAdmin } = useAuth();
  const [adminPreviewRole] = useAdminPreviewRole();
  const isSimulatingGuest = isAdmin && adminPreviewRole === 'guest';
  const isAudioAuthenticated = Boolean(user) && !isSimulatingGuest;
  const isLockedForGuest = !isAudioAuthenticated;
  const isAudioAuthenticatedRef = useRef(isAudioAuthenticated);
  isAudioAuthenticatedRef.current = isAudioAuthenticated;

  const [prefs, setPrefs] = useState<VisitorAmbientPrefs>(() => loadVisitorAmbientPrefs());
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => loadSiteSettings());
  const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
  const [isSpeechEngineSpeaking, setIsSpeechEngineSpeaking] = useState<boolean>(() =>
    speechEngine.isSpeaking()
  );
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isAdminPreviewing, setIsAdminPreviewing] = useState<boolean>(false);
  const [isEnginePlaying, setIsEnginePlaying] = useState<boolean>(false);
  const [replayCounter, setReplayCounter] = useState<number>(0);

  // 3D Spatial Ambient state
  const [spatial3DContext, setSpatial3DContextState] = useState<Spatial3DContextState>({
    active: false,
  });
  const [isSpatialPreviewing, setIsSpatialPreviewing] = useState<boolean>(false);
  const [isSpatialEnginePlaying, setIsSpatialEnginePlaying] = useState<boolean>(false);

  const engineRef = useRef<AmbientMuseumAudioEngine | null>(null);
  const spatialEngineRef = useRef<Spatial3DAmbientEngine | null>(null);
  const hasStartedFirstFadeRef = useRef<boolean>(false);

  // Active enabled playlist (always guaranteed non-empty via default 3 built-in tracks)
  const playlist = useMemo<AmbientPlaylistTrack[]>(() => {
    const configured = Array.isArray(siteSettings.ambientPlaylist)
      ? siteSettings.ambientPlaylist.filter((t) => t.enabled)
      : [];
    return configured.length > 0 ? configured : cloneDefaultAmbientPlaylist();
  }, [siteSettings.ambientPlaylist]);

  const currentTrackIndex = useMemo(() => {
    const idx = playlist.findIndex((t) => t.id === prefs.selectedTrackId);
    return idx >= 0 ? idx : 0;
  }, [playlist, prefs.selectedTrackId]);

  const currentTrack = playlist[currentTrackIndex] || DEFAULT_AMBIENT_PLAYLIST[0];

  // Keep refs for callbacks fired by audio engine timers / HTMLAudio 'ended'
  const playlistRef = useRef(playlist);
  playlistRef.current = playlist;
  const currentIndexRef = useRef(currentTrackIndex);
  currentIndexRef.current = currentTrackIndex;
  const playbackModeRef = useRef(prefs.playbackMode);
  playbackModeRef.current = prefs.playbackMode;

  const handleEngineTrackEnded = useCallback(() => {
    const list = playlistRef.current;
    if (list.length === 0) return;
    if (playbackModeRef.current === 'repeat_one' || list.length === 1) {
      setReplayCounter((c) => c + 1);
      return;
    }
    const nextIdx = (currentIndexRef.current + 1) % list.length;
    const nextTrackItem = list[nextIdx];
    if (!nextTrackItem) return;
    const next: VisitorAmbientPrefs = {
      ...prefsRef.current,
      selectedTrackId: nextTrackItem.id,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  // Lazy-create hybrid multi-track engine & 3D spatial engine once
  if (!engineRef.current && typeof window !== 'undefined') {
    engineRef.current = new AmbientMuseumAudioEngine({
      onTrackEnded: () => {
        handleEngineTrackEnded();
      },
    });
  }
  if (!spatialEngineRef.current && typeof window !== 'undefined') {
    spatialEngineRef.current = new Spatial3DAmbientEngine();
  }

  useEffect(() => {
    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
      spatialEngineRef.current?.destroy();
      spatialEngineRef.current = null;
    };
  }, []);

  // Sync Voice Narrations volume to global speechEngine immediately and on every update
  const effectiveVoiceVolume = prefs.isVoiceMuted ? 0 : prefs.voiceVolume;
  useEffect(() => {
    speechEngine.setGlobalVolume(effectiveVoiceVolume / 100);
  }, [effectiveVoiceVolume]);

  // Listen for Admin Studio / Firebase RTDB SiteSettings changes
  useEffect(() => {
    const syncSettings = () => {
      setSiteSettings(loadSiteSettings());
    };
    window.addEventListener(CMS_UPDATED_EVENT, syncSettings);
    return () => {
      window.removeEventListener(CMS_UPDATED_EVENT, syncSettings);
    };
  }, []);

  // Listen for real-time cross-device / cross-tab ambient audio preference updates (echo-safe)
  useEffect(() => {
    const onRemoteAmbient = (ev: Event) => {
      const detail = (ev as CustomEvent<{ isMuted?: boolean; volume?: number }>).detail;
      if (!detail || typeof detail !== 'object') return;
      const prev = prefsRef.current;
      const nextMuted =
        typeof detail.isMuted === 'boolean' ? detail.isMuted : prev.isMuted;
      const nextVol =
        typeof detail.volume === 'number' && Number.isFinite(detail.volume)
          ? Math.max(0, Math.min(100, Math.round(detail.volume)))
          : prev.volume;
      if (nextMuted === prev.isMuted && nextVol === prev.volume) return;
      const next: VisitorAmbientPrefs = {
        ...prev,
        isMuted: nextMuted,
        volume: nextVol,
      };
      prefsRef.current = next;
      saveVisitorAmbientPrefs(next);
      setPrefs(next);
    };
    window.addEventListener(REMOTE_AMBIENT_SYNC_EVENT, onRemoteAmbient);
    return () => window.removeEventListener(REMOTE_AMBIENT_SYNC_EVENT, onRemoteAmbient);
  }, []);

  const currentAudioUidRef = useRef<string | null>(null);
  currentAudioUidRef.current = user ? user.firebaseUid || user.userId || user.id : null;

  // Listen for Sử Quan Dấu Ấn / global chunked speech engine start & stop
  useEffect(() => {
    const handleSpeechState = (ev: Event) => {
      const detail = (ev as CustomEvent<{ speaking?: boolean }>).detail;
      setIsSpeechEngineSpeaking(Boolean(detail?.speaking));
    };
    window.addEventListener(SPEECH_ENGINE_STATE_EVENT, handleSpeechState);
    return () => {
      window.removeEventListener(SPEECH_ENGINE_STATE_EVENT, handleSpeechState);
    };
  }, []);

  // Stop all ambient audio immediately if visitor logs out or Admin previews "Chưa đăng nhập"
  useEffect(() => {
    if (!isAudioAuthenticated) {
      hasStartedFirstFadeRef.current = false;
      setHasUserInteracted(false);
      setIsSpatialPreviewing(false);
      if (engineRef.current) {
        engineRef.current.stop(180, false);
      }
      if (spatialEngineRef.current) {
        spatialEngineRef.current.stop(180);
      }
      setIsEnginePlaying(false);
      setIsSpatialEnginePlaying(false);
    }
  }, [isAudioAuthenticated]);

  // Browser Autoplay Policy Compliance: trigger 1.5s fade-in on first user gesture ONLY when authenticated
  useEffect(() => {
    if (!isAudioAuthenticated || hasUserInteracted || typeof window === 'undefined') return;

    const handleFirstGesture = () => {
      if (!isAudioAuthenticatedRef.current) return;
      setHasUserInteracted(true);
    };

    window.addEventListener('pointerdown', handleFirstGesture, { once: true, capture: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstGesture, true);
      window.removeEventListener('keydown', handleFirstGesture, true);
    };
  }, [isAudioAuthenticated, hasUserInteracted]);

  const isEnabledByAdmin = siteSettings.ambientAudioEnabled !== false;
  const isNarrationActive = isAudioGuidePlaying || isSpeechEngineSpeaking;
  const isSuspendedByMedia = isVideoModalOpen || isAdminPreviewing;
  const isEffectivelyMuted =
    isLockedForGuest || prefs.isMuted || prefs.volume <= 0 || !isEnabledByAdmin;

  const targetPercent = useMemo(() => {
    if (isEffectivelyMuted || isSuspendedByMedia) return 0;
    if (isNarrationActive) {
      return Math.min(prefs.volume, DUCKED_AMBIENT_VOLUME);
    }
    return prefs.volume;
  }, [isEffectivelyMuted, isSuspendedByMedia, isNarrationActive, prefs.volume]);

  const targetGain = targetPercent / 100;
  const targetGainRef = useRef(targetGain);
  targetGainRef.current = targetGain;

  const shouldPlayNow =
    isAudioAuthenticated && hasUserInteracted && !isEffectivelyMuted && !isSuspendedByMedia;
  const shouldPlayNowRef = useRef(shouldPlayNow);
  shouldPlayNowRef.current = shouldPlayNow;

  const lastLoadedSignatureRef = useRef<string>('');

  // Load & crossfade whenever selected track, track source, or repeat_one replay changes
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const signature = `${currentTrack.id}|${currentTrack.sourceType}|${
      currentTrack.audioUrl || ''
    }|${currentTrack.synthPreset || ''}|${replayCounter}`;

    if (signature === lastLoadedSignatureRef.current) return;
    const isInitialLoad = lastLoadedSignatureRef.current === '';
    lastLoadedSignatureRef.current = signature;

    const fadeInMs =
      !hasStartedFirstFadeRef.current && shouldPlayNowRef.current ? 1500 : 600;
    if (shouldPlayNowRef.current) {
      hasStartedFirstFadeRef.current = true;
    }

    let cancelled = false;
    void engine
      .loadTrack(currentTrack, {
        shouldPlay: shouldPlayNowRef.current,
        targetGain: targetGainRef.current,
        fadeOutMs: isInitialLoad ? 120 : 400,
        fadeInMs,
        forceRestart: true,
      })
      .then((started) => {
        if (!cancelled) {
          setIsEnginePlaying(started);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentTrack, replayCounter]);

  // Synchronize Background Music engine play/pause & smooth gain transitions
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (!shouldPlayNow) {
      if (isEnginePlaying) {
        engine.stop(isSuspendedByMedia ? 380 : 280, false);
        setIsEnginePlaying(false);
      }
      return;
    }

    if (!isEnginePlaying) {
      const fadeMs = !hasStartedFirstFadeRef.current ? 1500 : 600;
      hasStartedFirstFadeRef.current = true;
      void engine.start(targetGain, fadeMs, false).then((started) => {
        if (started) {
          setIsEnginePlaying(true);
        }
      });
    } else {
      const rampMs = isNarrationActive ? 500 : 320;
      engine.setGain(targetGain, rampMs);
    }
  }, [shouldPlayNow, targetGain, isEnginePlaying, isNarrationActive, isSuspendedByMedia]);

  // --------------------------------------------------------------------------
  // Channel 3: 3D Spatial Ambient Sounds lifecycle
  // --------------------------------------------------------------------------
  const spatialProfile = useMemo<Spatial3DAmbientProfile>(
    () =>
      resolveSpatialProfileForSite({
        siteId: spatial3DContext.siteId,
        siteName: spatial3DContext.siteName,
        siteType: spatial3DContext.siteType,
      }),
    [spatial3DContext.siteId, spatial3DContext.siteName, spatial3DContext.siteType]
  );

  const isSpatialEffectivelyMuted =
    isLockedForGuest || prefs.isSpatialMuted || prefs.spatialVolume <= 0;
  const shouldPlaySpatialNow =
    isAudioAuthenticated &&
    hasUserInteracted &&
    (spatial3DContext.active || isSpatialPreviewing) &&
    !isSpatialEffectivelyMuted &&
    !isSuspendedByMedia;

  const targetSpatialPercent = useMemo(() => {
    if (!shouldPlaySpatialNow) return 0;
    if (isNarrationActive && !isSpatialPreviewing) {
      // Gently duck spatial environmental ambience to 35% of user level during narration
      return Math.round(prefs.spatialVolume * 0.35);
    }
    return prefs.spatialVolume;
  }, [shouldPlaySpatialNow, isNarrationActive, isSpatialPreviewing, prefs.spatialVolume]);

  useEffect(() => {
    const spatialEngine = spatialEngineRef.current;
    if (!spatialEngine) return;

    if (!shouldPlaySpatialNow) {
      if (isSpatialEnginePlaying) {
        spatialEngine.stop(420);
        setIsSpatialEnginePlaying(false);
      }
      return;
    }

    const gain01 = targetSpatialPercent / 100;
    if (!isSpatialEnginePlaying) {
      void spatialEngine.start(spatialProfile, gain01, 850).then((started) => {
        if (started) {
          setIsSpatialEnginePlaying(true);
        }
      });
    } else {
      spatialEngine.setProfile(spatialProfile);
      spatialEngine.rampGain(gain01, 280);
    }
  }, [shouldPlaySpatialNow, targetSpatialPercent, spatialProfile, isSpatialEnginePlaying]);

  const markUserInteracted = useCallback(() => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
  }, []);

  const toggleMute = useCallback(() => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const prev = prefsRef.current;
    const nextMuted = !prev.isMuted;
    const nextVolume = !nextMuted && prev.volume <= 0 ? DEFAULT_AMBIENT_VOLUME : prev.volume;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isMuted: nextMuted,
      volume: nextVolume,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
    if (currentAudioUidRef.current) {
      syncUserPreferencesToCloud(currentAudioUidRef.current, {
        ambientMuted: nextMuted,
        ambientVolume: nextVolume,
      });
    }
  }, []);

  const selectTrack = useCallback((trackId: string) => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const list = playlistRef.current;
    if (!list.some((t) => t.id === trackId)) return;
    const prev = prefsRef.current;
    const nextVolume = prev.volume <= 0 ? DEFAULT_AMBIENT_VOLUME : prev.volume;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isMuted: false,
      volume: nextVolume,
      selectedTrackId: trackId,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  const nextTrack = useCallback(() => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const list = playlistRef.current;
    if (list.length === 0) return;
    const nextIdx = (currentIndexRef.current + 1) % list.length;
    const target = list[nextIdx];
    if (!target) return;
    if (list.length === 1) {
      setReplayCounter((c) => c + 1);
    }
    const prev = prefsRef.current;
    const nextVolume = prev.volume <= 0 ? DEFAULT_AMBIENT_VOLUME : prev.volume;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isMuted: false,
      volume: nextVolume,
      selectedTrackId: target.id,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  const prevTrack = useCallback(() => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const list = playlistRef.current;
    if (list.length === 0) return;
    const prevIdx = (currentIndexRef.current - 1 + list.length) % list.length;
    const target = list[prevIdx];
    if (!target) return;
    if (list.length === 1) {
      setReplayCounter((c) => c + 1);
    }
    const prev = prefsRef.current;
    const nextVolume = prev.volume <= 0 ? DEFAULT_AMBIENT_VOLUME : prev.volume;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isMuted: false,
      volume: nextVolume,
      selectedTrackId: target.id,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  const togglePlaybackMode = useCallback(() => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const prev = prefsRef.current;
    const nextMode: AmbientPlaybackMode =
      prev.playbackMode === 'auto_next' ? 'repeat_one' : 'auto_next';
    const next: VisitorAmbientPrefs = {
      ...prev,
      playbackMode: nextMode,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    const prev = prefsRef.current;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isMuted: clamped === 0,
      volume: clamped === 0 ? prev.volume : clamped,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
    if (currentAudioUidRef.current) {
      syncUserPreferencesToCloud(currentAudioUidRef.current, {
        ambientMuted: next.isMuted,
        ambientVolume: next.volume,
      });
    }
  }, []);

  const setVoiceVolume = useCallback((vol: number) => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    const prev = prefsRef.current;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isVoiceMuted: clamped === 0,
      voiceVolume: clamped === 0 ? prev.voiceVolume : clamped,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  const toggleVoiceMute = useCallback(() => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const prev = prefsRef.current;
    const nextMuted = !prev.isVoiceMuted;
    const nextVol = !nextMuted && prev.voiceVolume <= 0 ? DEFAULT_VOICE_VOLUME : prev.voiceVolume;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isVoiceMuted: nextMuted,
      voiceVolume: nextVol,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  const setSpatialVolume = useCallback((vol: number) => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    const prev = prefsRef.current;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isSpatialMuted: clamped === 0,
      spatialVolume: clamped === 0 ? prev.spatialVolume : clamped,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  const toggleSpatialMute = useCallback(() => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const prev = prefsRef.current;
    const nextMuted = !prev.isSpatialMuted;
    const nextVol =
      !nextMuted && prev.spatialVolume <= 0 ? DEFAULT_SPATIAL_VOLUME : prev.spatialVolume;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isSpatialMuted: nextMuted,
      spatialVolume: nextVol,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
  }, []);

  const setSpatial3DContext = useCallback((ctx: Spatial3DContextState) => {
    setSpatial3DContextState((prev) => {
      if (
        prev.active === ctx.active &&
        prev.siteId === ctx.siteId &&
        prev.siteName === ctx.siteName &&
        prev.siteType === ctx.siteType
      ) {
        return prev;
      }
      return ctx;
    });
  }, []);

  const resetMixerDefaults = useCallback(() => {
    if (!isAudioAuthenticatedRef.current) return;
    setHasUserInteracted(true);
    const prev = prefsRef.current;
    const next: VisitorAmbientPrefs = {
      ...prev,
      isMuted: false,
      volume: DEFAULT_AMBIENT_VOLUME,
      isVoiceMuted: false,
      voiceVolume: DEFAULT_VOICE_VOLUME,
      isSpatialMuted: false,
      spatialVolume: DEFAULT_SPATIAL_VOLUME,
    };
    prefsRef.current = next;
    saveVisitorAmbientPrefs(next);
    setPrefs(next);
    if (currentAudioUidRef.current) {
      syncUserPreferencesToCloud(currentAudioUidRef.current, {
        ambientMuted: false,
        ambientVolume: DEFAULT_AMBIENT_VOLUME,
      });
    }
  }, []);

  const value = useMemo<AmbientAudioContextValue>(
    () => ({
      playlist,
      currentTrack,
      currentTrackIndex,
      playbackMode: prefs.playbackMode,
      isMuted: isEffectivelyMuted,
      isPlaying: isAudioAuthenticated && isEnginePlaying && !isEffectivelyMuted && !isSuspendedByMedia,
      isDucked: isAudioAuthenticated && isEnginePlaying && isNarrationActive && !isEffectivelyMuted && !isSuspendedByMedia,
      isPausedForVideo: isVideoModalOpen,
      isEnabledByAdmin,
      isLockedForGuest,
      hasUserInteracted,
      volume: prefs.isMuted ? 0 : prefs.volume,
      effectiveVolume: isAudioAuthenticated && isEnginePlaying ? targetPercent : 0,
      voiceVolume: effectiveVoiceVolume,
      isVoiceMuted: prefs.isVoiceMuted || prefs.voiceVolume <= 0,
      isNarrationActive,
      spatialVolume: prefs.isSpatialMuted ? 0 : prefs.spatialVolume,
      isSpatialMuted: isSpatialEffectivelyMuted,
      isSpatial3DActive: spatial3DContext.active,
      isSpatialPlaying: isAudioAuthenticated && isSpatialEnginePlaying && shouldPlaySpatialNow,
      isSpatialPreviewing,
      spatialProfile,
      toggleMute,
      togglePlayPause: toggleMute,
      nextTrack,
      prevTrack,
      selectTrack,
      togglePlaybackMode,
      setVolume,
      setVoiceVolume,
      toggleVoiceMute,
      setSpatialVolume,
      toggleSpatialMute,
      setSpatialPreviewing: setIsSpatialPreviewing,
      setSpatial3DContext,
      resetMixerDefaults,
      setVideoModalOpen: setIsVideoModalOpen,
      setAdminPreviewing: setIsAdminPreviewing,
      markUserInteracted,
    }),
    [
      playlist,
      currentTrack,
      currentTrackIndex,
      prefs.playbackMode,
      prefs.isMuted,
      prefs.volume,
      prefs.isVoiceMuted,
      prefs.voiceVolume,
      prefs.isSpatialMuted,
      prefs.spatialVolume,
      isAudioAuthenticated,
      isLockedForGuest,
      isEffectivelyMuted,
      isEnginePlaying,
      isSuspendedByMedia,
      isNarrationActive,
      isVideoModalOpen,
      isEnabledByAdmin,
      hasUserInteracted,
      targetPercent,
      effectiveVoiceVolume,
      isSpatialEffectivelyMuted,
      spatial3DContext.active,
      isSpatialEnginePlaying,
      shouldPlaySpatialNow,
      isSpatialPreviewing,
      spatialProfile,
      toggleMute,
      nextTrack,
      prevTrack,
      selectTrack,
      togglePlaybackMode,
      setVolume,
      setVoiceVolume,
      toggleVoiceMute,
      setSpatialVolume,
      toggleSpatialMute,
      setSpatial3DContext,
      resetMixerDefaults,
      markUserInteracted,
    ]
  );

  return (
    <AmbientAudioContext.Provider value={value}>
      {children}
    </AmbientAudioContext.Provider>
  );
};

export function useAmbientAudio(): AmbientAudioContextValue {
  const ctx = useContext(AmbientAudioContext);
  if (!ctx) {
    throw new Error('useAmbientAudio must be used within AmbientAudioProvider');
  }
  return ctx;
}

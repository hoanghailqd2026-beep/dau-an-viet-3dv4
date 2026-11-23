/**
 * Multi-Track Ambient Museum Audio Engine for "Dấu Ấn Việt 3D"
 * - 3 built-in Web Audio API tracks (90s each, auto-emitting ended event):
 *   1) Khúc Ngũ Cung Cung Đình (Đàn tranh chậm rãi, trang nghiêm)
 *   2) Thanh Âm Sài Gòn Xưa (Âm hưởng ấm áp, hoài niệm thập niên 1960)
 *   3) Gió Trúc Non Sông (Sáo trúc và không gian mở thư thái)
 * - Hybrid custom HTMLAudio playback (.mp3 / .ogg / URL / uploaded Firebase RTDB asset)
 *   with smooth 400ms fade-out / 600ms fade-in cross-transitions and automatic synth fallback.
 * - Per-track IndexedDB caching for Admin-uploaded audio files.
 */

import { pullAmbientTrackAssetFromFirebase } from './firebaseRestSync';

export const FIREBASE_AMBIENT_PREFIX = 'firebase-ambient://';
export const FIREBASE_AMBIENT_POINTER = `${FIREBASE_AMBIENT_PREFIX}default`;
export const SYNTH_TRACK_DURATION_SEC = 90;

export type AmbientTrackSynthPreset =
  | 'imperial_dan_tranh'
  | 'saigon_1960s'
  | 'bamboo_flute_breeze';

export interface AmbientPlaylistTrack {
  id: string;
  title: string;
  titleEn?: string;
  titleZh?: string;
  subtitle: string;
  subtitleEn?: string;
  subtitleZh?: string;
  sourceType: 'synth' | 'custom';
  synthPreset?: AmbientTrackSynthPreset;
  audioUrl?: string;
  durationSec?: number;
  enabled: boolean;
  isBuiltIn?: boolean;
  updatedAt?: string;
}

export const DEFAULT_AMBIENT_PLAYLIST: AmbientPlaylistTrack[] = [
  {
    id: 'builtin-ngu-cung-cung-dinh',
    title: 'Khúc Ngũ Cung Cung Đình',
    titleEn: 'Imperial Pentatonic Melody',
    titleZh: '宫廷五声古曲',
    subtitle: 'Âm sắc đàn tranh chậm rãi, trang nghiêm',
    subtitleEn: 'Slow, stately Đàn tranh & gentle temple chimes',
    subtitleZh: '庄重舒缓的越南古筝与清雅风铃',
    sourceType: 'synth',
    synthPreset: 'imperial_dan_tranh',
    durationSec: SYNTH_TRACK_DURATION_SEC,
    enabled: true,
    isBuiltIn: true,
  },
  {
    id: 'builtin-thanh-am-sai-gon-xua',
    title: 'Thanh Âm Sài Gòn Xưa',
    titleEn: 'Echoes of Old Saigon',
    titleZh: '西贡旧韵',
    subtitle: 'Âm hưởng ấm áp, hoài niệm thập niên 1960',
    subtitleEn: 'Warm, nostalgic 1960s Saigon chamber chords',
    subtitleZh: '温暖怀旧的1960年代西贡雅韵',
    sourceType: 'synth',
    synthPreset: 'saigon_1960s',
    durationSec: SYNTH_TRACK_DURATION_SEC,
    enabled: true,
    isBuiltIn: true,
  },
  {
    id: 'builtin-gio-truc-non-song',
    title: 'Gió Trúc Non Sông',
    titleEn: 'Bamboo Flute & Mountain Breeze',
    titleZh: '竹笛山风',
    subtitle: 'Âm sắc sáo trúc và không gian mở thư thái',
    subtitleEn: 'Serene bamboo flute & open highland atmosphere',
    subtitleZh: '清幽竹笛与辽阔山水意境',
    sourceType: 'synth',
    synthPreset: 'bamboo_flute_breeze',
    durationSec: SYNTH_TRACK_DURATION_SEC,
    enabled: true,
    isBuiltIn: true,
  },
];

export function cloneDefaultAmbientPlaylist(): AmbientPlaylistTrack[] {
  return DEFAULT_AMBIENT_PLAYLIST.map((t) => ({ ...t }));
}

export function normalizeAmbientPlaylist(raw: unknown): AmbientPlaylistTrack[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return cloneDefaultAmbientPlaylist();
  }

  const seenIds = new Set<string>();
  const normalized: AmbientPlaylistTrack[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Partial<AmbientPlaylistTrack>;
    const rawId = typeof obj.id === 'string' ? obj.id.trim() : '';
    const title = typeof obj.title === 'string' ? obj.title.trim() : '';
    if (!rawId || !title || seenIds.has(rawId)) continue;
    seenIds.add(rawId);

    const builtInMatch = DEFAULT_AMBIENT_PLAYLIST.find((b) => b.id === rawId);
    const sourceType: 'synth' | 'custom' =
      obj.sourceType === 'custom' && typeof obj.audioUrl === 'string' && obj.audioUrl.trim()
        ? 'custom'
        : 'synth';

    const validPreset: AmbientTrackSynthPreset =
      obj.synthPreset === 'imperial_dan_tranh' ||
      obj.synthPreset === 'saigon_1960s' ||
      obj.synthPreset === 'bamboo_flute_breeze'
        ? obj.synthPreset
        : builtInMatch?.synthPreset || 'imperial_dan_tranh';

    normalized.push({
      id: rawId,
      title,
      titleEn:
        typeof obj.titleEn === 'string' && obj.titleEn.trim()
          ? obj.titleEn.trim()
          : builtInMatch?.titleEn,
      titleZh:
        typeof obj.titleZh === 'string' && obj.titleZh.trim()
          ? obj.titleZh.trim()
          : builtInMatch?.titleZh,
      subtitle:
        typeof obj.subtitle === 'string' && obj.subtitle.trim()
          ? obj.subtitle.trim()
          : builtInMatch?.subtitle || 'Hòa tấu Di sản',
      subtitleEn:
        typeof obj.subtitleEn === 'string' && obj.subtitleEn.trim()
          ? obj.subtitleEn.trim()
          : builtInMatch?.subtitleEn,
      subtitleZh:
        typeof obj.subtitleZh === 'string' && obj.subtitleZh.trim()
          ? obj.subtitleZh.trim()
          : builtInMatch?.subtitleZh,
      sourceType,
      synthPreset: sourceType === 'synth' ? validPreset : undefined,
      audioUrl: sourceType === 'custom' ? (obj.audioUrl || '').trim() : undefined,
      durationSec:
        typeof obj.durationSec === 'number' && obj.durationSec > 0
          ? obj.durationSec
          : sourceType === 'synth'
          ? SYNTH_TRACK_DURATION_SEC
          : undefined,
      enabled: typeof obj.enabled === 'boolean' ? obj.enabled : true,
      isBuiltIn: Boolean(obj.isBuiltIn ?? builtInMatch?.isBuiltIn),
      updatedAt: typeof obj.updatedAt === 'string' ? obj.updatedAt : undefined,
    });
  }

  return normalized.length > 0 ? normalized : cloneDefaultAmbientPlaylist();
}

export function getLocalizedTrackTitle(
  track: AmbientPlaylistTrack,
  lang: 'vi' | 'en' | 'zh'
): string {
  if (lang === 'en' && track.titleEn) return track.titleEn;
  if (lang === 'zh' && track.titleZh) return track.titleZh;
  return track.title;
}

export function getLocalizedTrackSubtitle(
  track: AmbientPlaylistTrack,
  lang: 'vi' | 'en' | 'zh'
): string {
  if (lang === 'en' && track.subtitleEn) return track.subtitleEn;
  if (lang === 'zh' && track.subtitleZh) return track.subtitleZh;
  return track.subtitle;
}

// ============================================================================
// INDEXEDDB LOCAL CACHE FOR ADMIN-UPLOADED TRACKS
// ============================================================================
const IDB_NAME = 'dau_an_viet_ambient_audio_db_v1';
const IDB_STORE = 'ambient_tracks';
const LEGACY_IDB_KEY = 'custom_ambient_track';

export interface StoredLocalAmbientAudio {
  dataUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
}

export function makeFirebaseAmbientPointer(trackId: string): string {
  const safeId = trackId.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'default';
  return `${FIREBASE_AMBIENT_PREFIX}${safeId}`;
}

export function extractTrackIdFromAmbientPointer(pointerUrl: string): string | null {
  const trimmed = (pointerUrl || '').trim();
  if (!trimmed.startsWith(FIREBASE_AMBIENT_PREFIX)) return null;
  const key = trimmed.slice(FIREBASE_AMBIENT_PREFIX.length).replace(/^\/+/, '');
  return key || 'default';
}

function openAmbientDb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveLocalAmbientTrackAudio(
  trackId: string,
  record: StoredLocalAmbientAudio
): Promise<boolean> {
  const db = await openAmbientDb();
  if (!db) return false;
  const key = trackId === 'default' ? LEGACY_IDB_KEY : `track_${trackId}`;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(record, key);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

export async function loadLocalAmbientTrackAudio(
  trackId: string
): Promise<StoredLocalAmbientAudio | null> {
  const db = await openAmbientDb();
  if (!db) return null;
  const key = trackId === 'default' ? LEGACY_IDB_KEY : `track_${trackId}`;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => {
        const val = req.result as StoredLocalAmbientAudio | undefined;
        db.close();
        resolve(val && typeof val.dataUrl === 'string' ? val : null);
      };
      req.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function deleteLocalAmbientTrackAudio(trackId: string): Promise<void> {
  const db = await openAmbientDb();
  if (!db) return;
  const key = trackId === 'default' ? LEGACY_IDB_KEY : `track_${trackId}`;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(key);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function saveLocalAmbientAudio(record: StoredLocalAmbientAudio): Promise<boolean> {
  return saveLocalAmbientTrackAudio('default', record);
}

export async function loadLocalAmbientAudio(): Promise<StoredLocalAmbientAudio | null> {
  return loadLocalAmbientTrackAudio('default');
}

export async function clearLocalAmbientAudio(): Promise<void> {
  return deleteLocalAmbientTrackAudio('default');
}

export async function resolveAmbientTrackUrl(rawUrl: string): Promise<string | null> {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) return null;

  const pointerTrackId = extractTrackIdFromAmbientPointer(trimmed);
  if (pointerTrackId) {
    const local = await loadLocalAmbientTrackAudio(pointerTrackId);
    if (local?.dataUrl) return local.dataUrl;
    const remote = await pullAmbientTrackAssetFromFirebase(pointerTrackId);
    if (remote?.dataUrl) {
      await saveLocalAmbientTrackAudio(pointerTrackId, {
        dataUrl: remote.dataUrl,
        fileName: remote.fileName,
        mimeType: remote.mimeType,
        sizeBytes: Math.round((remote.dataUrl.length * 3) / 4),
        updatedAt: remote.updatedAt,
      });
      return remote.dataUrl;
    }
    return null;
  }

  return trimmed;
}

// ============================================================================
// MULTI-PRESET WEB AUDIO API SYNTHESIZER (3 BUILT-IN 90s MUSEUM COMPOSITIONS)
// ============================================================================

// Preset 1: Khúc Ngũ Cung Cung Đình (D major / B minor Pentatonic Đàn tranh)
const DAN_TRANH_NOTES = [
  293.66, // D4
  329.63, // E4
  392.0,  // G4
  440.0,  // A4
  493.88, // B4
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
];
const CHIME_NOTES = [1174.66, 1318.51, 1567.98, 1760.0, 1975.53];
const IMPERIAL_PHRASES: number[][] = [
  [0, 2, 3, 5, 3, 2],
  [5, 4, 3, 2, 1, 0],
  [3, 5, 6, 5, 3, 2],
  [2, 3, 5, 7, 5, 3],
  [4, 3, 2, 0, 2, 3],
  [5, 6, 7, 6, 5, 3],
];

// Preset 2: Thanh Âm Sài Gòn Xưa (Warm 1960s nostalgic chamber progression in F major)
const SAIGON_CHORDS: Array<{ bass: number; chord: number[]; melody: number[] }> = [
  {
    bass: 87.31, // F2
    chord: [174.61, 220.0, 261.63, 329.63], // Fmaj7
    melody: [523.25, 440.0, 392.0, 329.63],
  },
  {
    bass: 73.42, // D2
    chord: [146.83, 220.0, 261.63, 329.63], // Dm9
    melody: [440.0, 392.0, 349.23, 329.63],
  },
  {
    bass: 98.0, // G2
    chord: [196.0, 233.08, 293.66, 349.23], // Gm7
    melody: [392.0, 440.0, 466.16, 392.0],
  },
  {
    bass: 130.81, // C3
    chord: [196.0, 233.08, 293.66, 329.63], // C9
    melody: [329.63, 392.0, 440.0, 523.25],
  },
  {
    bass: 116.54, // Bb2
    chord: [174.61, 220.0, 293.66, 349.23], // Bbmaj7
    melody: [587.33, 523.25, 440.0, 392.0],
  },
  {
    bass: 110.0, // A2
    chord: [164.81, 196.0, 261.63, 329.63], // Am7
    melody: [440.0, 392.0, 329.63, 293.66],
  },
];

// Preset 3: Gió Trúc Non Sông (G major Pentatonic Sáo trúc & highland open space)
const FLUTE_NOTES = [
  392.0,  // G4
  440.0,  // A4
  493.88, // B4
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  987.77, // B5
];
const FLUTE_PHRASES: Array<Array<{ note: number; dur: number }>> = [
  [
    { note: 0, dur: 2.2 },
    { note: 2, dur: 1.5 },
    { note: 3, dur: 2.6 },
    { note: 4, dur: 1.8 },
    { note: 3, dur: 2.8 },
  ],
  [
    { note: 5, dur: 2.4 },
    { note: 4, dur: 1.4 },
    { note: 3, dur: 2.0 },
    { note: 2, dur: 1.6 },
    { note: 0, dur: 3.0 },
  ],
  [
    { note: 1, dur: 1.8 },
    { note: 3, dur: 2.2 },
    { note: 5, dur: 2.8 },
    { note: 6, dur: 1.7 },
    { note: 5, dur: 2.6 },
  ],
  [
    { note: 3, dur: 2.0 },
    { note: 2, dur: 1.5 },
    { note: 1, dur: 2.0 },
    { note: 0, dur: 3.1 },
  ],
];

export class MultiTrackMuseumSynth {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private fxInput: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private preset: AmbientTrackSynthPreset = 'imperial_dan_tranh';
  private primaryTimerId: number | null = null;
  private secondaryTimerId: number | null = null;
  private trackEndTimerId: number | null = null;
  private isRunning = false;

  private phraseIdx = 0;
  private stepIdx = 0;
  private chordIdx = 0;
  private elapsedMs = 0;
  private runStartedAtMs = 0;
  private currentGainValue = 0;

  private onTrackEnded?: () => void;

  constructor(opts?: { onTrackEnded?: () => void }) {
    this.onTrackEnded = opts?.onTrackEnded;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.ctx) return this.ctx;

    const AudioCtxCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxCtor) return null;

    const ctx = new AudioCtxCtor();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Warm museum hall stereo-like dual feedback delay bus
    const fxInput = ctx.createGain();
    fxInput.gain.setValueAtTime(0.88, ctx.currentTime);

    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.75, ctx.currentTime);
    fxInput.connect(dryGain);
    dryGain.connect(masterGain);

    const delayL = ctx.createDelay(1.5);
    delayL.delayTime.setValueAtTime(0.42, ctx.currentTime);
    const delayR = ctx.createDelay(1.5);
    delayR.delayTime.setValueAtTime(0.64, ctx.currentTime);

    const dampFilter = ctx.createBiquadFilter();
    dampFilter.type = 'lowpass';
    dampFilter.frequency.setValueAtTime(1680, ctx.currentTime);

    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.32, ctx.currentTime);

    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.36, ctx.currentTime);

    fxInput.connect(delayL);
    delayL.connect(dampFilter);
    dampFilter.connect(delayR);
    delayR.connect(feedback);
    feedback.connect(delayL);
    dampFilter.connect(wetGain);
    delayR.connect(wetGain);
    wetGain.connect(masterGain);

    // Soft adaptive harmonic bed (tuned per preset)
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.025, ctx.currentTime);
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(420, ctx.currentTime);

    const droneOsc1 = ctx.createOscillator();
    droneOsc1.type = 'sine';
    droneOsc1.frequency.setValueAtTime(146.83, ctx.currentTime);

    const droneOsc2 = ctx.createOscillator();
    droneOsc2.type = 'sine';
    droneOsc2.frequency.setValueAtTime(220.0, ctx.currentTime);

    droneOsc1.connect(droneFilter);
    droneOsc2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(masterGain);

    droneOsc1.start();
    droneOsc2.start();

    // Soft white-noise buffer for bamboo flute breath & gentle air texture
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      channelData[i] = Math.random() * 2 - 1;
    }

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.fxInput = fxInput;
    this.droneGain = droneGain;
    this.droneOsc1 = droneOsc1;
    this.droneOsc2 = droneOsc2;
    this.noiseBuffer = buffer;
    this.tuneDroneForPreset(this.preset);
    return ctx;
  }

  private tuneDroneForPreset(preset: AmbientTrackSynthPreset): void {
    if (!this.ctx || !this.droneOsc1 || !this.droneOsc2 || !this.droneGain) return;
    const now = this.ctx.currentTime;
    if (preset === 'imperial_dan_tranh') {
      // D3 + A3 contemplative open fifth
      this.droneOsc1.frequency.setTargetAtTime(146.83, now, 0.25);
      this.droneOsc2.frequency.setTargetAtTime(220.0, now, 0.25);
      this.droneGain.gain.setTargetAtTime(0.026, now, 0.25);
    } else if (preset === 'saigon_1960s') {
      // Warm low F2 + C3 parlor resonance
      this.droneOsc1.frequency.setTargetAtTime(174.61, now, 0.25);
      this.droneOsc2.frequency.setTargetAtTime(261.63, now, 0.25);
      this.droneGain.gain.setTargetAtTime(0.018, now, 0.25);
    } else {
      // G3 + D4 airy highland harmonic bed
      this.droneOsc1.frequency.setTargetAtTime(196.0, now, 0.25);
      this.droneOsc2.frequency.setTargetAtTime(293.66, now, 0.25);
      this.droneGain.gain.setTargetAtTime(0.022, now, 0.25);
    }
  }

  public setPreset(preset: AmbientTrackSynthPreset, resetPosition = true): void {
    this.preset = preset;
    if (resetPosition) {
      this.phraseIdx = 0;
      this.stepIdx = 0;
      this.chordIdx = 0;
      this.elapsedMs = 0;
    }
    this.tuneDroneForPreset(preset);
  }

  // ---- PRESET 1: KHÚC NGŨ CUNG CUNG ĐÌNH (Đàn tranh & Chuông gió) ----
  private pluckDanTranh(freq: number, accent = 1, withBend = false): void {
    if (!this.ctx || !this.fxInput || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'sine';

    if (withBend) {
      osc1.frequency.setValueAtTime(freq * 0.965, now);
      osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.14);
      osc2.frequency.setValueAtTime(freq * 2 * 0.965, now);
      osc2.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.14);
    } else {
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);
    }

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(4.2, now);
    lfoGain.gain.setValueAtTime(0, now);
    lfoGain.gain.linearRampToValueAtTime(withBend ? 2.4 : 0.9, now + 0.45);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(1.4, now);
    filter.frequency.setValueAtTime(Math.min(2800, freq * 4.5), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(460, freq * 1.45), now + 2.8);

    const osc2Mix = this.ctx.createGain();
    osc2Mix.gain.setValueAtTime(0.26, now);

    const env = this.ctx.createGain();
    const peak = 0.2 * accent;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(peak, now + 0.018);
    env.gain.exponentialRampToValueAtTime(peak * 0.35, now + 0.55);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

    osc1.connect(filter);
    osc2.connect(osc2Mix);
    osc2Mix.connect(filter);
    filter.connect(env);
    env.connect(this.fxInput);

    osc1.start(now);
    osc2.start(now);
    lfo.start(now);
    osc1.stop(now + 4.35);
    osc2.stop(now + 4.35);
    lfo.stop(now + 4.35);
  }

  private playWindChime(freq: number): void {
    if (!this.ctx || !this.fxInput || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const oscMain = this.ctx.createOscillator();
    const oscOvertone = this.ctx.createOscillator();
    oscMain.type = 'sine';
    oscOvertone.type = 'sine';
    oscMain.frequency.setValueAtTime(freq, now);
    oscOvertone.frequency.setValueAtTime(freq * 2.756, now);

    const overtoneGain = this.ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.018, now);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.045, now + 0.025);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 4.8);

    oscMain.connect(env);
    oscOvertone.connect(overtoneGain);
    overtoneGain.connect(env);
    env.connect(this.fxInput);

    oscMain.start(now);
    oscOvertone.start(now);
    oscMain.stop(now + 5.0);
    oscOvertone.stop(now + 1.6);
  }

  private scheduleImperialNote = (): void => {
    if (!this.isRunning || this.preset !== 'imperial_dan_tranh') return;
    const phrase = IMPERIAL_PHRASES[this.phraseIdx % IMPERIAL_PHRASES.length];
    const noteIndex = phrase[this.stepIdx];
    const freq = DAN_TRANH_NOTES[noteIndex] || DAN_TRANH_NOTES[0];

    const isStart = this.stepIdx === 0;
    const isEnd = this.stepIdx === phrase.length - 1;
    const withBend = !isStart && Math.random() < 0.36;
    const accent = isStart ? 1.0 : isEnd ? 0.85 : 0.72 + Math.random() * 0.2;

    this.pluckDanTranh(freq, accent, withBend);

    if (isStart && Math.random() < 0.72) {
      window.setTimeout(() => {
        if (this.isRunning && this.preset === 'imperial_dan_tranh') {
          this.pluckDanTranh(freq * 0.5, 0.55, false);
        }
      }, 190);
    }

    this.stepIdx += 1;
    let nextDelayMs = 1180 + Math.random() * 820;
    if (this.stepIdx >= phrase.length) {
      this.stepIdx = 0;
      this.phraseIdx = (this.phraseIdx + 1 + Math.floor(Math.random() * 2)) % IMPERIAL_PHRASES.length;
      nextDelayMs = 2300 + Math.random() * 1200;
    }

    this.primaryTimerId = window.setTimeout(this.scheduleImperialNote, nextDelayMs);
  };

  private scheduleImperialChime = (): void => {
    if (!this.isRunning || this.preset !== 'imperial_dan_tranh') return;
    const baseIdx = Math.floor(Math.random() * CHIME_NOTES.length);
    this.playWindChime(CHIME_NOTES[baseIdx]);

    if (Math.random() < 0.45) {
      const secondIdx = (baseIdx + 1 + Math.floor(Math.random() * 2)) % CHIME_NOTES.length;
      window.setTimeout(() => {
        if (this.isRunning && this.preset === 'imperial_dan_tranh') {
          this.playWindChime(CHIME_NOTES[secondIdx]);
        }
      }, 420 + Math.random() * 320);
    }

    this.secondaryTimerId = window.setTimeout(
      this.scheduleImperialChime,
      5400 + Math.random() * 4400
    );
  };

  // ---- PRESET 2: THANH ÂM SÀI GÒN XƯA (Warm 1960s nostalgic chamber) ----
  private playVintageRhodesNote(freq: number, peakGain: number, durationSec: number, delaySec = 0): void {
    if (!this.ctx || !this.fxInput || this.ctx.state !== 'running') return;
    const start = this.ctx.currentTime + delaySec;

    const oscBody = this.ctx.createOscillator();
    const oscTine = this.ctx.createOscillator();
    oscBody.type = 'sine';
    oscTine.type = 'triangle';
    oscBody.frequency.setValueAtTime(freq, start);
    oscTine.frequency.setValueAtTime(freq * 2, start);

    // Subtle warm tape pitch drift
    const tremolo = this.ctx.createOscillator();
    const tremGain = this.ctx.createGain();
    tremolo.frequency.setValueAtTime(3.2, start);
    tremGain.gain.setValueAtTime(0.018 * peakGain, start);

    const tineGain = this.ctx.createGain();
    tineGain.gain.setValueAtTime(0.18, start);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.38);

    const warmFilter = this.ctx.createBiquadFilter();
    warmFilter.type = 'lowpass';
    warmFilter.frequency.setValueAtTime(1450, start);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(peakGain, start + 0.045);
    env.gain.exponentialRampToValueAtTime(peakGain * 0.45, start + durationSec * 0.45);
    env.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    tremolo.connect(tremGain);
    tremGain.connect(env.gain);

    oscBody.connect(warmFilter);
    oscTine.connect(tineGain);
    tineGain.connect(warmFilter);
    warmFilter.connect(env);
    env.connect(this.fxInput);

    oscBody.start(start);
    oscTine.start(start);
    tremolo.start(start);
    oscBody.stop(start + durationSec + 0.15);
    oscTine.stop(start + 0.45);
    tremolo.stop(start + durationSec + 0.15);
  }

  private scheduleSaigonChord = (): void => {
    if (!this.isRunning || this.preset !== 'saigon_1960s') return;
    const bar = SAIGON_CHORDS[this.chordIdx % SAIGON_CHORDS.length];

    // Warm bass root
    this.playVintageRhodesNote(bar.bass * 2, 0.12, 4.6, 0);

    // Arpeggiated nostalgic 1960s parlor chord
    bar.chord.forEach((f, idx) => {
      this.playVintageRhodesNote(f, 0.075, 4.4, 0.08 * idx);
    });

    // Gentle melody response notes across the bar
    const noteA = bar.melody[this.stepIdx % bar.melody.length];
    const noteB = bar.melody[(this.stepIdx + 1) % bar.melody.length];
    this.playVintageRhodesNote(noteA, 0.095, 2.4, 0.9);
    if (Math.random() < 0.78) {
      this.playVintageRhodesNote(noteB, 0.078, 2.5, 2.35);
    }

    this.chordIdx = (this.chordIdx + 1) % SAIGON_CHORDS.length;
    this.stepIdx += 1;

    this.primaryTimerId = window.setTimeout(this.scheduleSaigonChord, 4200);
  };

  // ---- PRESET 3: GIÓ TRÚC NON SÔNG (Sáo trúc & Không gian mở) ----
  private playBambooFluteNote(freq: number, durationSec: number): void {
    if (!this.ctx || !this.fxInput || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    // Warm hollow bamboo tone (sine + soft 2nd harmonic)
    const oscMain = this.ctx.createOscillator();
    const oscHarm = this.ctx.createOscillator();
    oscMain.type = 'sine';
    oscHarm.type = 'triangle';

    // Gentle upward ornamental breath slide on attack
    oscMain.frequency.setValueAtTime(freq * 0.985, now);
    oscMain.frequency.exponentialRampToValueAtTime(freq, now + 0.16);
    oscHarm.frequency.setValueAtTime(freq * 2 * 0.985, now);
    oscHarm.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.16);

    // Expressive flute vibrato blooming mid-note
    const vibrato = this.ctx.createOscillator();
    const vibGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.1, now);
    vibGain.gain.setValueAtTime(0, now);
    vibGain.gain.linearRampToValueAtTime(freq * 0.008, now + Math.min(0.9, durationSec * 0.45));
    vibrato.connect(vibGain);
    vibGain.connect(oscMain.frequency);

    const harmMix = this.ctx.createGain();
    harmMix.gain.setValueAtTime(0.11, now);

    const toneFilter = this.ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    toneFilter.frequency.setValueAtTime(Math.min(2600, freq * 3.2), now);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.145, now + Math.min(0.42, durationSec * 0.25));
    env.gain.setValueAtTime(0.135, now + Math.max(0.45, durationSec * 0.68));
    env.gain.exponentialRampToValueAtTime(0.0001, now + durationSec + 0.35);

    oscMain.connect(toneFilter);
    oscHarm.connect(harmMix);
    harmMix.connect(toneFilter);
    toneFilter.connect(env);
    env.connect(this.fxInput);

    oscMain.start(now);
    oscHarm.start(now);
    vibrato.start(now);
    oscMain.stop(now + durationSec + 0.45);
    oscHarm.stop(now + durationSec + 0.45);
    vibrato.stop(now + durationSec + 0.45);

    // Soft breathy airflow layer
    if (this.noiseBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;

      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(freq * 1.5, now);
      bp.Q.setValueAtTime(4.5, now);

      const breathEnv = this.ctx.createGain();
      breathEnv.gain.setValueAtTime(0.0001, now);
      breathEnv.gain.linearRampToValueAtTime(0.018, now + 0.25);
      breathEnv.gain.exponentialRampToValueAtTime(0.0001, now + durationSec + 0.2);

      noise.connect(bp);
      bp.connect(breathEnv);
      breathEnv.connect(this.fxInput);

      noise.start(now);
      noise.stop(now + durationSec + 0.3);
    }
  }

  private playMountainBreezeSwell(): void {
    if (!this.ctx || !this.fxInput || !this.noiseBuffer || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, now);
    filter.frequency.linearRampToValueAtTime(860, now + 2.8);
    filter.frequency.linearRampToValueAtTime(480, now + 5.6);
    filter.Q.setValueAtTime(1.8, now);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.016, now + 2.5);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 5.8);

    noise.connect(filter);
    filter.connect(env);
    env.connect(this.fxInput);

    noise.start(now);
    noise.stop(now + 6.0);
  }

  private scheduleFluteNote = (): void => {
    if (!this.isRunning || this.preset !== 'bamboo_flute_breeze') return;
    const phrase = FLUTE_PHRASES[this.phraseIdx % FLUTE_PHRASES.length];
    const item = phrase[this.stepIdx];
    const freq = FLUTE_NOTES[item.note] || FLUTE_NOTES[0];

    this.playBambooFluteNote(freq, item.dur);

    this.stepIdx += 1;
    let nextDelayMs = Math.round(item.dur * 1000 * 0.92);
    if (this.stepIdx >= phrase.length) {
      this.stepIdx = 0;
      this.phraseIdx = (this.phraseIdx + 1) % FLUTE_PHRASES.length;
      nextDelayMs += 2100 + Math.random() * 1200;
    }

    this.primaryTimerId = window.setTimeout(this.scheduleFluteNote, nextDelayMs);
  };

  private scheduleMountainBreeze = (): void => {
    if (!this.isRunning || this.preset !== 'bamboo_flute_breeze') return;
    this.playMountainBreezeSwell();
    this.secondaryTimerId = window.setTimeout(
      this.scheduleMountainBreeze,
      7800 + Math.random() * 4200
    );
  };

  // ---- LIFECYCLE & 90-SECOND TRACK COMPLETION TIMER ----
  private clearAllTimers(): void {
    if (this.primaryTimerId !== null) {
      window.clearTimeout(this.primaryTimerId);
      this.primaryTimerId = null;
    }
    if (this.secondaryTimerId !== null) {
      window.clearTimeout(this.secondaryTimerId);
      this.secondaryTimerId = null;
    }
    if (this.trackEndTimerId !== null) {
      window.clearTimeout(this.trackEndTimerId);
      this.trackEndTimerId = null;
    }
  }

  private scheduleTrackEndTimer(): void {
    if (this.trackEndTimerId !== null) {
      window.clearTimeout(this.trackEndTimerId);
      this.trackEndTimerId = null;
    }
    const remainingMs = Math.max(1200, SYNTH_TRACK_DURATION_SEC * 1000 - this.elapsedMs);
    this.runStartedAtMs = Date.now();
    this.trackEndTimerId = window.setTimeout(() => {
      if (!this.isRunning) return;
      this.elapsedMs = 0;
      this.onTrackEnded?.();
    }, remainingMs);
  }

  public async start(
    preset: AmbientTrackSynthPreset,
    targetGain: number,
    fadeDurationMs: number,
    resetPosition = false
  ): Promise<boolean> {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return false;

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch {
      return false;
    }

    const presetChanged = preset !== this.preset;
    if (presetChanged || resetPosition) {
      this.clearAllTimers();
      this.isRunning = false;
      this.setPreset(preset, true);
    }

    if (!this.isRunning) {
      this.isRunning = true;
      this.tuneDroneForPreset(this.preset);
      if (this.preset === 'imperial_dan_tranh') {
        this.scheduleImperialNote();
        this.secondaryTimerId = window.setTimeout(this.scheduleImperialChime, 1900);
      } else if (this.preset === 'saigon_1960s') {
        this.scheduleSaigonChord();
      } else {
        this.scheduleFluteNote();
        this.secondaryTimerId = window.setTimeout(this.scheduleMountainBreeze, 1200);
      }
      this.scheduleTrackEndTimer();
    }

    this.rampGain(targetGain, fadeDurationMs);
    return true;
  }

  public rampGain(targetGain: number, durationMs: number): void {
    if (!this.ctx || !this.masterGain) return;
    const safeTarget = Math.max(0, Math.min(1, targetGain));
    const now = this.ctx.currentTime;
    const gainParam = this.masterGain.gain;

    try {
      gainParam.cancelScheduledValues(now);
      gainParam.setValueAtTime(gainParam.value, now);
      gainParam.linearRampToValueAtTime(safeTarget, now + Math.max(0.03, durationMs / 1000));
      this.currentGainValue = safeTarget;
    } catch {
      this.currentGainValue = safeTarget;
    }
  }

  public stop(fadeOutMs = 280, resetPosition = false): void {
    if (this.isRunning && this.runStartedAtMs > 0) {
      this.elapsedMs += Math.max(0, Date.now() - this.runStartedAtMs);
      this.runStartedAtMs = 0;
    }
    if (resetPosition) {
      this.elapsedMs = 0;
      this.phraseIdx = 0;
      this.stepIdx = 0;
      this.chordIdx = 0;
    }
    this.isRunning = false;
    this.clearAllTimers();
    this.rampGain(0, fadeOutMs);
  }

  public getCurrentGain(): number {
    return this.currentGainValue;
  }

  public destroy(): void {
    this.stop(60, true);
    try {
      this.droneOsc1?.stop();
      this.droneOsc2?.stop();
      void this.ctx?.close();
    } catch {
      // ignore teardown errors
    }
    this.ctx = null;
    this.masterGain = null;
    this.fxInput = null;
    this.droneGain = null;
  }
}

export function createPreviewSynth(): MultiTrackMuseumSynth {
  return new MultiTrackMuseumSynth();
}

// ============================================================================
// HYBRID MULTI-TRACK AMBIENT MUSEUM ENGINE (SMOOTH 400ms OUT / 600ms IN)
// ============================================================================
export class AmbientMuseumAudioEngine {
  private synth: MultiTrackMuseumSynth;
  private audioEl: HTMLAudioElement | null = null;
  private activeTrack: AmbientPlaylistTrack = DEFAULT_AMBIENT_PLAYLIST[0];
  private activeMode: 'synth' | 'custom' = 'synth';
  private activeResolvedUrl = '';
  private volumeRafId: number | null = null;
  private isPlaying = false;
  private targetGain = 0.25;
  private transitionToken = 0;

  private onTrackEnded?: () => void;
  private onFallbackToSynth?: (trackId: string) => void;

  constructor(opts?: {
    onTrackEnded?: () => void;
    onFallbackToSynth?: (trackId: string) => void;
  }) {
    this.onTrackEnded = opts?.onTrackEnded;
    this.onFallbackToSynth = opts?.onFallbackToSynth;
    this.synth = new MultiTrackMuseumSynth({
      onTrackEnded: () => {
        if (this.isPlaying && this.activeMode === 'synth') {
          this.onTrackEnded?.();
        }
      },
    });
  }

  private cancelHtmlFade(): void {
    if (this.volumeRafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.volumeRafId);
      this.volumeRafId = null;
    }
  }

  private rampHtmlVolume(target: number, durationMs: number, onDone?: () => void): void {
    if (!this.audioEl || typeof window === 'undefined') {
      onDone?.();
      return;
    }
    this.cancelHtmlFade();
    const audio = this.audioEl;
    const from = Number.isFinite(audio.volume) ? audio.volume : 0;
    const to = Math.max(0, Math.min(1, target));
    const safeDuration = Math.max(40, durationMs);
    const startTs = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTs) / safeDuration);
      const eased = 1 - Math.pow(1 - progress, 2);
      try {
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * eased));
      } catch {
        // ignore audio volume errors
      }
      if (progress < 1) {
        this.volumeRafId = window.requestAnimationFrame(step);
      } else {
        this.volumeRafId = null;
        onDone?.();
      }
    };

    this.volumeRafId = window.requestAnimationFrame(step);
  }

  private waitMs(ms: number): Promise<void> {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  private teardownHtmlAudio(): void {
    this.cancelHtmlFade();
    if (this.audioEl) {
      try {
        this.audioEl.onended = null;
        this.audioEl.onerror = null;
        this.audioEl.pause();
        this.audioEl.src = '';
      } catch {
        // ignore
      }
      this.audioEl = null;
    }
  }

  private fallbackToSynth(gain: number, fadeInMs = 600): void {
    const failedTrackId = this.activeTrack.id;
    this.teardownHtmlAudio();
    this.activeMode = 'synth';
    this.activeResolvedUrl = '';
    this.onFallbackToSynth?.(failedTrackId);
    if (this.isPlaying) {
      void this.synth.start(
        this.activeTrack.synthPreset || 'imperial_dan_tranh',
        gain,
        fadeInMs,
        true
      );
    }
  }

  /**
   * Smoothly transitions to a track (400ms fade-out -> switch -> 600ms fade-in).
   */
  public async loadTrack(
    track: AmbientPlaylistTrack,
    opts: {
      shouldPlay: boolean;
      targetGain: number;
      fadeOutMs?: number;
      fadeInMs?: number;
      forceRestart?: boolean;
    }
  ): Promise<boolean> {
    const token = ++this.transitionToken;
    const fadeOutMs = opts.fadeOutMs ?? 400;
    const fadeInMs = opts.fadeInMs ?? 600;
    this.targetGain = Math.max(0, Math.min(1, opts.targetGain));

    const isSameTrack =
      this.activeTrack.id === track.id &&
      this.activeTrack.sourceType === track.sourceType &&
      this.activeTrack.audioUrl === track.audioUrl &&
      this.activeTrack.synthPreset === track.synthPreset;

    if (isSameTrack && !opts.forceRestart) {
      if (opts.shouldPlay && !this.isPlaying) {
        return this.start(this.targetGain, fadeInMs, false);
      }
      return this.isPlaying;
    }

    // Smooth fade-out before switching track (400ms)
    if (this.isPlaying) {
      this.synth.stop(fadeOutMs, true);
      if (this.audioEl) {
        const prevAudio = this.audioEl;
        this.rampHtmlVolume(0, fadeOutMs, () => {
          try {
            prevAudio.pause();
          } catch {
            // ignore
          }
        });
      }
      await this.waitMs(fadeOutMs);
      if (token !== this.transitionToken) return false;
    } else {
      this.synth.stop(80, true);
      this.teardownHtmlAudio();
    }

    this.activeTrack = track;

    if (track.sourceType === 'custom' && track.audioUrl?.trim()) {
      const resolvedUrl = await resolveAmbientTrackUrl(track.audioUrl);
      if (token !== this.transitionToken) return false;

      if (resolvedUrl) {
        this.teardownHtmlAudio();
        const audio = new Audio();
        audio.loop = false; // Handled explicitly via onTrackEnded for Auto-next / Repeat One
        audio.preload = 'auto';
        audio.volume = 0;
        audio.src = resolvedUrl;
        audio.onended = () => {
          if (token === this.transitionToken && this.isPlaying) {
            this.onTrackEnded?.();
          }
        };
        audio.onerror = () => {
          if (token === this.transitionToken && this.activeMode === 'custom') {
            this.fallbackToSynth(this.targetGain, 600);
          }
        };
        this.audioEl = audio;
        this.activeMode = 'custom';
        this.activeResolvedUrl = resolvedUrl;
      } else {
        this.teardownHtmlAudio();
        this.activeMode = 'synth';
        this.activeResolvedUrl = '';
      }
    } else {
      this.teardownHtmlAudio();
      this.activeMode = 'synth';
      this.activeResolvedUrl = '';
      this.synth.setPreset(track.synthPreset || 'imperial_dan_tranh', true);
    }

    if (opts.shouldPlay) {
      return this.start(this.targetGain, fadeInMs, true);
    }

    this.isPlaying = false;
    return false;
  }

  public async start(
    targetGain: number,
    fadeDurationMs = 1500,
    restartFromBeginning = false
  ): Promise<boolean> {
    this.targetGain = Math.max(0, Math.min(1, targetGain));
    this.isPlaying = true;

    if (this.activeMode === 'custom' && this.audioEl) {
      try {
        if (restartFromBeginning) {
          this.audioEl.currentTime = 0;
        }
        this.audioEl.volume = Math.min(this.audioEl.volume, 0.01);
        await this.audioEl.play();
        this.rampHtmlVolume(this.targetGain, fadeDurationMs);
        return true;
      } catch {
        this.fallbackToSynth(this.targetGain, fadeDurationMs);
        return this.synth.start(
          this.activeTrack.synthPreset || 'imperial_dan_tranh',
          this.targetGain,
          fadeDurationMs,
          true
        );
      }
    }

    return this.synth.start(
      this.activeTrack.synthPreset || 'imperial_dan_tranh',
      this.targetGain,
      fadeDurationMs,
      restartFromBeginning
    );
  }

  public setGain(targetGain: number, durationMs = 500): void {
    this.targetGain = Math.max(0, Math.min(1, targetGain));
    if (!this.isPlaying) return;

    if (this.activeMode === 'custom' && this.audioEl) {
      this.rampHtmlVolume(this.targetGain, durationMs);
    } else {
      this.synth.rampGain(this.targetGain, durationMs);
    }
  }

  public stop(fadeOutMs = 300, resetPosition = false): void {
    this.isPlaying = false;
    this.synth.stop(fadeOutMs, resetPosition);
    if (this.audioEl) {
      const audio = this.audioEl;
      this.rampHtmlVolume(0, fadeOutMs, () => {
        if (!this.isPlaying) {
          try {
            audio.pause();
            if (resetPosition) audio.currentTime = 0;
          } catch {
            // ignore
          }
        }
      });
    }
  }

  public getActiveMode(): 'synth' | 'custom' {
    return this.activeMode;
  }

  public getActiveResolvedUrl(): string {
    return this.activeResolvedUrl;
  }

  public destroy(): void {
    this.transitionToken += 1;
    this.teardownHtmlAudio();
    this.synth.destroy();
  }
}

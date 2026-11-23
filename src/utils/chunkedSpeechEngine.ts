import { Language } from '../i18n/types';

export type SupportedPlaybackSpeed = 0.85 | 1 | 1.2 | 1.25 | 1.5;

export function getSpeechLocale(lang: Language | 'vn'): string {
  if (lang === 'en') return 'en-US';
  if (lang === 'zh') return 'zh-CN';
  return 'vi-VN';
}

/**
 * Splits a multi-language narration script into clean sentences without breaking
 * numbers/decimals (e.g., "1.5", "20.000", "30/4/1975").
 * Handles Vietnamese, English (. ! ?) and Chinese (。 ！ ？).
 */
export function splitTextIntoSentences(text: string): string[] {
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentences: string[] = [];
  let buffer = '';

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    const prev = i > 0 ? normalized[i - 1] : '';
    const next = i + 1 < normalized.length ? normalized[i + 1] : '';

    buffer += ch;

    const isCjkTerminator = ch === '。' || ch === '！' || ch === '？';
    const isLatinTerminator = ch === '.' || ch === '!' || ch === '?';

    if (isCjkTerminator) {
      // Include optional closing quotes right after CJK punctuation
      if (next === '”' || next === '」' || next === '"' || next === ')') {
        continue;
      }
      const trimmed = buffer.trim();
      if (trimmed) sentences.push(trimmed);
      buffer = '';
      continue;
    }

    if (isLatinTerminator) {
      // Do not split decimal numbers or thousands separators (e.g., 10.7769, 20.000, 1.5x)
      const isNumericDot = ch === '.' && /\d/.test(prev) && /\d/.test(next);
      // Do not split initials/abbreviations followed immediately by non-space (e.g. KTS.Ngô or U.S.)
      const isAbbrevNoSpace = ch === '.' && next !== '' && !/\s/.test(next) && next !== '"' && next !== '”' && next !== ')';
      // Check common Vietnamese/academic abbreviations ending with dot before space
      const lowerTail = buffer.slice(-5).toLowerCase();
      const isCommonAbbrev =
        ch === '.' &&
        (/\bkts\.$/.test(lowerTail) ||
          /\bgs\.$/.test(lowerTail) ||
          /\bts\.$/.test(lowerTail) ||
          /\bths\.$/.test(lowerTail) ||
          /\btp\.$/.test(lowerTail) ||
          /\bno\.$/.test(lowerTail));

      if (isNumericDot || isAbbrevNoSpace || isCommonAbbrev) {
        continue;
      }

      // If next char is closing quote/bracket, let it attach to this sentence first
      if (next === '"' || next === '”' || next === ')') {
        continue;
      }

      if (next === '' || /\s/.test(next)) {
        const trimmed = buffer.trim();
        if (trimmed) sentences.push(trimmed);
        buffer = '';
      }
    } else if (
      (ch === '"' || ch === '”' || ch === '」' || ch === ')') &&
      /[.!?。！？]/.test(prev) &&
      (next === '' || /\s/.test(next) || isCjkChar(next))
    ) {
      const trimmed = buffer.trim();
      if (trimmed) sentences.push(trimmed);
      buffer = '';
    }
  }

  const tail = buffer.trim();
  if (tail) {
    sentences.push(tail);
  }

  return sentences;
}

function isCjkChar(ch: string): boolean {
  return /[\u4e00-\u9fff]/.test(ch);
}

/**
 * Breaks an extra-long sentence into smaller speech chunks (< 220 chars) so Chrome's
 * ~15s Web Speech buffer limit never truncates a single utterance.
 */
function splitLongSentenceForUtterance(sentence: string, maxLen = 210): string[] {
  const clean = sentence.trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const parts = clean.split(/(?<=[,;，；:：])\s*/).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    if (!current) {
      current = part;
    } else if ((current + ' ' + part).length <= maxLen) {
      current += (isCjkChar(part[0]) ? '' : ' ') + part;
    } else {
      chunks.push(current.trim());
      current = part;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [clean];
}

export interface SpeakSentencesOptions {
  lang: Language | 'vn';
  rate?: number;
  pitch?: number;
  volume?: number;
  startIndex?: number;
  onSentenceStart?: (sentenceIndex: number) => void;
  onComplete?: () => void;
  onError?: (err: string) => void;
}

export const SPEECH_ENGINE_STATE_EVENT = 'dau-an-viet-speech-state-changed';
export const SPEECH_VOLUME_CHANGED_EVENT = 'dau-an-viet-speech-volume-changed';

class ChunkedSpeechSynthesisEngine {
  private voices: SpeechSynthesisVoice[] = [];
  private voicesInitialized = false;
  private playbackToken = 0;
  private startTimeoutId: number | null = null;
  private keepaliveIntervalId: number | null = null;
  private activeSpeaking = false;
  private globalVolume = 0.85;

  constructor() {
    this.initVoices();
  }

  public isSpeaking(): boolean {
    return this.activeSpeaking;
  }

  public getGlobalVolume(): number {
    return this.globalVolume;
  }

  public setGlobalVolume(volume01: number): void {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(volume01) ? volume01 : 0.85));
    this.globalVolume = clamped;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(SPEECH_VOLUME_CHANGED_EVENT, { detail: { volume: clamped } })
      );
    }
  }

  private setSpeakingState(next: boolean): void {
    if (this.activeSpeaking === next) return;
    this.activeSpeaking = next;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(SPEECH_ENGINE_STATE_EVENT, { detail: { speaking: next } })
      );
    }
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (this.voicesInitialized) return;
    this.voicesInitialized = true;

    const loadVoices = () => {
      try {
        const list = window.speechSynthesis.getVoices();
        if (list && list.length > 0) {
          this.voices = list;
        }
      } catch {
        // Ignore browser voice enumeration issues
      }
    };

    loadVoices();
    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const fresh = window.speechSynthesis.getVoices();
      if (fresh && fresh.length > 0) {
        this.voices = fresh;
      }
    }
    return this.voices;
  }

  /**
   * Smart Voice Detection matching vi-VN, en-US/en-GB, zh-CN/zh-TW.
   * Returns undefined cleanly when no explicit voice exists so utterance.lang fallback takes over.
   */
  public findBestVoice(lang: Language | 'vn'): SpeechSynthesisVoice | undefined {
    const allVoices = this.getAvailableVoices();
    if (!allVoices || allVoices.length === 0) return undefined;

    const normalizedLang: Language = lang === 'vn' ? 'vi' : lang;

    if (normalizedLang === 'vi') {
      return (
        allVoices.find((v) => v.lang.toLowerCase() === 'vi-vn' && /google|microsoft|linh|an|nam/i.test(v.name)) ||
        allVoices.find((v) => v.lang.toLowerCase() === 'vi-vn') ||
        allVoices.find((v) => v.lang.toLowerCase().startsWith('vi'))
      );
    }

    if (normalizedLang === 'zh') {
      return (
        allVoices.find((v) => v.lang.toLowerCase() === 'zh-cn' && /google|microsoft|xiaoxiao|yunxi|ting/i.test(v.name)) ||
        allVoices.find((v) => v.lang.toLowerCase() === 'zh-cn') ||
        allVoices.find((v) => v.lang.toLowerCase().startsWith('zh-hans')) ||
        allVoices.find((v) => v.lang.toLowerCase().startsWith('zh-tw') || v.lang.toLowerCase().startsWith('zh-hk')) ||
        allVoices.find((v) => v.lang.toLowerCase().startsWith('zh'))
      );
    }

    // English
    return (
      allVoices.find((v) => v.lang.toLowerCase() === 'en-us' && /google|samantha|aria|jenny|natural/i.test(v.name)) ||
      allVoices.find((v) => v.lang.toLowerCase() === 'en-us') ||
      allVoices.find((v) => v.lang.toLowerCase() === 'en-gb') ||
      allVoices.find((v) => v.lang.toLowerCase().startsWith('en'))
    );
  }

  private clearTimers(): void {
    if (this.startTimeoutId !== null && typeof window !== 'undefined') {
      window.clearTimeout(this.startTimeoutId);
      this.startTimeoutId = null;
    }
    if (this.keepaliveIntervalId !== null && typeof window !== 'undefined') {
      window.clearInterval(this.keepaliveIntervalId);
      this.keepaliveIntervalId = null;
    }
  }

  public stop(): void {
    this.playbackToken += 1;
    this.clearTimers();
    this.setSpeakingState(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore browser cancel errors
      }
    }
  }

  public speakSentences(sentences: string[], options: SpeakSentencesOptions): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options.onComplete?.();
      return;
    }

    this.initVoices();

    const cleanSentences = sentences.map((s) => s.trim()).filter(Boolean);
    if (cleanSentences.length === 0) {
      this.stop();
      options.onComplete?.();
      return;
    }

    const startIdx = Math.max(0, Math.min(options.startIndex ?? 0, cleanSentences.length - 1));
    const locale = getSpeechLocale(options.lang);
    const rate = options.rate ?? 1;
    const pitch = options.pitch ?? 1.0;
    const baseVolume = Math.max(0, Math.min(1, options.volume ?? 1));
    const resolveEffectiveVolume = () => Math.max(0, Math.min(1, baseVolume * this.globalVolume));

    // 1. Invalidate any in-flight utterances & cancel queue immediately
    this.playbackToken += 1;
    const token = this.playbackToken;
    this.clearTimers();

    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cancel errors
    }

    // 2. Mandatory 80ms delay after cancel() so Chromium/Safari flush TTS queue reliably
    this.setSpeakingState(true);
    this.startTimeoutId = window.setTimeout(() => {
      if (token !== this.playbackToken) return;

      // 3. Anti-Auto-Pause Keepalive every 8 seconds while speaking
      this.keepaliveIntervalId = window.setInterval(() => {
        if (token !== this.playbackToken) {
          this.clearTimers();
          return;
        }
        try {
          if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {
          // Ignore resume errors
        }
      }, 8000);

      const speakSentenceAt = (sentenceIdx: number) => {
        if (token !== this.playbackToken) return;

        if (sentenceIdx >= cleanSentences.length) {
          this.clearTimers();
          this.setSpeakingState(false);
          options.onComplete?.();
          return;
        }

        options.onSentenceStart?.(sentenceIdx);

        const sentenceText = cleanSentences[sentenceIdx];
        const subChunks = splitLongSentenceForUtterance(sentenceText);
        const matchedVoice = this.findBestVoice(options.lang);

        const speakSubChunk = (subIdx: number) => {
          if (token !== this.playbackToken) return;

          if (subIdx >= subChunks.length) {
            speakSentenceAt(sentenceIdx + 1);
            return;
          }

          try {
            const utterance = new SpeechSynthesisUtterance(subChunks[subIdx]);
            utterance.lang = locale;
            utterance.rate = rate;
            utterance.pitch = pitch;
            utterance.volume = resolveEffectiveVolume();
            // Assign voice only if found; otherwise browser cleanly falls back via utterance.lang
            if (matchedVoice) {
              utterance.voice = matchedVoice;
            }

            let handled = false;
            const advance = () => {
              if (handled || token !== this.playbackToken) return;
              handled = true;
              speakSubChunk(subIdx + 1);
            };

            utterance.onend = advance;
            utterance.onerror = (ev) => {
              if (token !== this.playbackToken) return;
              const errCode = (ev as SpeechSynthesisErrorEvent)?.error;
              if (errCode === 'interrupted' || errCode === 'canceled') {
                return;
              }
              options.onError?.(errCode || 'tts_error');
              // Advance rather than freezing the whole tour
              advance();
            };

            window.speechSynthesis.speak(utterance);
          } catch {
            if (token === this.playbackToken) {
              speakSentenceAt(sentenceIdx + 1);
            }
          }
        };

        speakSubChunk(0);
      };

      speakSentenceAt(startIdx);
    }, 80);
  }

  public speakText(text: string, options: Omit<SpeakSentencesOptions, 'startIndex'>): string[] {
    const sentences = splitTextIntoSentences(text);
    this.speakSentences(sentences, { ...options, startIndex: 0 });
    return sentences;
  }
}

export const speechEngine = new ChunkedSpeechSynthesisEngine();

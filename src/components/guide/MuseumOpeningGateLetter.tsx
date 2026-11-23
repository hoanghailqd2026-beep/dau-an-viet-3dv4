import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Language } from '../../i18n/types';
import { LeQuyDonVungTauEmblem } from './LeQuyDonVungTauEmblem';

export { LeQuyDonVungTauEmblem };

export const GATE_LETTER_SESSION_PREFIX = 'dauAnViet_gateLetterSeen_';
export const WELCOME_SEEN_LOCAL_PREFIX = 'dauAnViet_welcomeSeen_';

export function getGateLetterSessionStorageKey(uid: string): string {
  return `${GATE_LETTER_SESSION_PREFIX}${uid}`;
}

export function getWelcomeSeenLocalStorageKey(uid: string): string {
  return `${WELCOME_SEEN_LOCAL_PREFIX}${uid}`;
}

export function clearAllGateLetterSessionFlags(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(GATE_LETTER_SESSION_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}

interface GateLetterLocaleContent {
  kicker: string;
  subtitle: string;
  title: string;
  salutation: string;
  paragraphs: string[];
  sealSignature: string;
  ctaLabel: string;
  lockedCtaLabel: string;
  revealAllLabel: string;
  closeLabel: string;
  keySoundOnLabel: string;
  keySoundOffLabel: string;
  keySoundToggleAria: string;
}

const GATE_LETTER_CONTENT: Record<Language, GateLetterLocaleContent> = {
  vi: {
    kicker: 'THƯ NGỎ · DẤU ẤN VIỆT 3D',
    subtitle: 'Tập thể Lớp 10 Chuyên Sử · THPT Chuyên Lê Quý Đôn – Vũng Tàu',
    title: 'Thư ngỏ từ Đội ngũ phát triển Dấu Ấn Việt 3D',
    salutation: 'Kính thưa quý khách hàng thân mến!',
    paragraphs: [
      'Việt Nam sở hữu một kho tàng lịch sử, văn hóa, kiến trúc vô cùng đa dạng và phong phú. Tuy nhiên, trước tác động của thời gian và quá trình đô thị hóa diễn ra ngày càng mạnh mẽ, nhiều giá trị di sản ý nghĩa ấy gần như bị nhạt phai, khó tiếp cận với thế hệ trẻ.',
      'Xuất phát từ mong muốn bảo tồn, gìn giữ những di sản quý báu đấy bằng phương thức hiện đại, 5 cá nhân đại diện cho tập thể lớp 10 chuyên Sử trường THPT chuyên Lê Quý Đôn – Vũng Tàu chính thức cho ra mắt dự án: Dấu Ấn Việt 3D nhằm giúp người dùng dễ dàng tiếp cận với những di sản mang trong mình cội nguồn của dân tộc một cách tiện lợi nhất. Không chỉ hỗ trợ người Việt, dự án này còn hỗ trợ khách du lịch nước ngoài tìm hiểu về những trang sử hào hùng của dân tộc Việt Nam thông qua bản thuyết minh tiếng Anh và tiếng Trung.',
      'Để hành trình số hóa di sản của chúng tôi ngày càng phát triển và hoàn thiện, rất mong nhận được sự ủng hộ và góp ý của quý khách hàng.',
    ],
    sealSignature: '- Trân trọng, Đội ngũ Dấu Ấn Việt 3D',
    ctaLabel: 'Khám phá Bảo tàng số',
    lockedCtaLabel: 'Vui lòng đọc hết thư ngỏ để tiếp tục...',
    revealAllLabel: 'Hiện toàn bộ',
    closeLabel: 'Đóng thư ngỏ',
    keySoundOnLabel: 'Âm phím: Bật',
    keySoundOffLabel: 'Âm phím: Tắt',
    keySoundToggleAria: 'Bật hoặc tắt âm thanh gõ máy chữ cơ học',
  },
  en: {
    kicker: 'WELCOME LETTER · DẤU ẤN VIỆT 3D',
    subtitle: 'Grade 10 History Class · Le Quy Don High School for the Gifted – Vung Tau',
    title: 'Welcome Letter from the Dấu Ấn Việt 3D Development Team',
    salutation: 'Dear Valued Guests,',
    paragraphs: [
      'Vietnam possesses an extraordinarily diverse and rich treasure trove of history, culture, and architecture. However, under the passage of time and the accelerating pace of urbanization, many of these meaningful heritage values risk fading away and becoming harder for younger generations to access.',
      "Driven by the desire to preserve and safeguard these precious heritages through modern technology, five students representing the Grade 10 History Specialized Class of Le Quy Don High School for the Gifted – Vung Tau officially introduce the project: Dấu Ấn Việt 3D, enabling users to explore the cultural roots of our nation in the most accessible and convenient way. Beyond serving Vietnamese audiences, the project also supports international tourists in discovering the heroic chapters of Vietnam's history through English and Chinese audio narrations.",
      'For our heritage digitization journey to grow and improve continuously, we sincerely hope to receive your support and valuable feedback.',
    ],
    sealSignature: '- Sincerely, Dấu Ấn Việt 3D Team',
    ctaLabel: 'Explore Digital Museum',
    lockedCtaLabel: 'Please finish reading the letter to continue...',
    revealAllLabel: 'Show all',
    closeLabel: 'Close welcome letter',
    keySoundOnLabel: 'Key sound: On',
    keySoundOffLabel: 'Key sound: Off',
    keySoundToggleAria: 'Toggle mechanical typewriter keystroke sound',
  },
  zh: {
    kicker: '开幕寄语 · DẤU ẤN VIỆT 3D',
    subtitle: '头顿黎贵惇重点高中 · 十年级历史专业班',
    title: 'Dấu Ấn Việt 3D 项目开发团队致欢迎信',
    salutation: '尊敬的各位来宾：',
    paragraphs: [
      '越南拥有极其丰富而多元的历史、文化与建筑宝库。然而，随着时间的流逝以及城市化进程的不断加快，许多意义深远的文化遗产正逐渐淡化，年轻一代也越来越难以亲近和了解。',
      '怀着以现代科技手段保护和传承这些珍贵遗产的初心，代表头顿黎贵惇重点高中十年级历史专业班的五名成员正式推出 Dấu Ấn Việt 3D 项目，旨在让用户以最便捷的方式走近承载民族根脉的历史遗迹。本项目不仅服务于越南本土观众，还特别配备了英语与中文语音导览，助力外国游客深入领略越南民族波澜壮阔的历史篇章。',
      '为了让我们的遗产数字化之旅不断发展与完善，衷心期待得到您的支持与宝贵建议。',
    ],
    sealSignature: '- 此致敬礼，Dấu Ấn Việt 3D 团队',
    ctaLabel: '探索数字博物馆',
    lockedCtaLabel: '请阅读完整欢迎信后继续...',
    revealAllLabel: '显示全部',
    closeLabel: '关闭欢迎信',
    keySoundOnLabel: '按键音：开',
    keySoundOffLabel: '按键音：关',
    keySoundToggleAria: '开启或关闭机械打字机按键音',
  },
};

const LANGUAGE_TABS: Array<{ id: Language; label: string }> = [
  { id: 'vi', label: 'Tiếng Việt' },
  { id: 'en', label: 'English' },
  { id: 'zh', label: '中文' },
];

const TYPEWRITER_INTERVAL_MS = 15;

export interface MuseumOpeningGateLetterProps {
  isOpen: boolean;
  isMandatoryRead?: boolean;
  onEnterMuseum: () => void;
}

export const MuseumOpeningGateLetter: React.FC<MuseumOpeningGateLetterProps> = ({
  isOpen,
  isMandatoryRead = false,
  onEnterMuseum,
}) => {
  const { lang, setLang } = useI18n();
  const content = GATE_LETTER_CONTENT[lang] || GATE_LETTER_CONTENT.vi;

  // Combine salutation & paragraphs with double line breaks to preserve clear paragraph separation
  const fullLetterText = useMemo(
    () => `${content.salutation}\n\n${content.paragraphs.join('\n\n')}`,
    [content.salutation, content.paragraphs]
  );

  const [typedLength, setTypedLength] = useState<number>(0);
  const [hasReachedScrollBottom, setHasReachedScrollBottom] = useState<boolean>(false);
  const [isKeySoundEnabled, setIsKeySoundEnabled] = useState<boolean>(true);
  const isKeySoundEnabledRef = useRef<boolean>(true);
  const typedLengthRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement | null>(null);

  // Synthesized Mechanical Typewriter Sound Engine (Web Audio API only, zero external files)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const lastSoundTimeRef = useRef<number>(0);

  useEffect(() => {
    isKeySoundEnabledRef.current = isKeySoundEnabled;
  }, [isKeySoundEnabled]);

  const getOrCreateAudioContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      return audioCtxRef.current;
    }
    const AudioCtxCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxCtor) return null;
    try {
      const ctx = new AudioCtxCtor();
      audioCtxRef.current = ctx;

      // Pre-build short 24ms warm white noise buffer for tactile mechanical click transient
      const sampleRate = ctx.sampleRate || 44100;
      const frameCount = Math.max(1, Math.floor(sampleRate * 0.024));
      const buffer = ctx.createBuffer(1, frameCount, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frameCount; i += 1) {
        const decay = Math.exp((-i / frameCount) * 4.5);
        data[i] = (Math.random() * 2 - 1) * decay;
      }
      noiseBufferRef.current = buffer;
      return ctx;
    } catch {
      return null;
    }
  }, []);

  const resumeKeystrokeAudio = useCallback(() => {
    const ctx = getOrCreateAudioContext();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
  }, [getOrCreateAudioContext]);

  const stopAllKeystrokeAudio = useCallback(() => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      void audioCtxRef.current.suspend().catch(() => {});
    }
  }, []);

  const playMechanicalKeystroke = useCallback(() => {
    if (!isKeySoundEnabledRef.current) return;
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
      return;
    }
    if (ctx.state !== 'running') return;

    const nowMs = performance.now();
    if (nowMs - lastSoundTimeRef.current < 12) return;
    lastSoundTimeRef.current = nowMs;

    try {
      const now = ctx.currentTime;
      // Subtle ±8% natural pitch variation per keystroke
      const pitchFactor = 0.92 + Math.random() * 0.16;
      // Subtle volume kept at ~10%–14% so it feels warm and unobtrusive
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.125, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
      masterGain.connect(ctx.destination);

      // 1. Warm low-frequency mechanical body thump (~18ms)
      const thumpOsc = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      thumpOsc.type = 'triangle';
      thumpOsc.frequency.setValueAtTime(148 * pitchFactor, now);
      thumpOsc.frequency.exponentialRampToValueAtTime(54 * pitchFactor, now + 0.018);
      thumpGain.gain.setValueAtTime(0.85, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(masterGain);
      thumpOsc.start(now);
      thumpOsc.stop(now + 0.02);

      // 2. Bandpass-filtered tactile keycap click (~16ms)
      if (noiseBufferRef.current) {
        const noiseSrc = ctx.createBufferSource();
        noiseSrc.buffer = noiseBufferRef.current;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(2250 * pitchFactor, now);
        bandpass.Q.setValueAtTime(2.1, now);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.75, now);
        clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.016);

        noiseSrc.connect(bandpass);
        bandpass.connect(clickGain);
        clickGain.connect(masterGain);
        noiseSrc.start(now);
        noiseSrc.stop(now + 0.019);
      }
    } catch {
      // ignore transient audio node errors
    }
  }, [getOrCreateAudioContext]);

  const isTypingComplete = typedLength >= fullLetterText.length;
  const isMandatoryUnlocked = isTypingComplete && hasReachedScrollBottom;
  const canDismiss = !isMandatoryRead || isMandatoryUnlocked;

  const stopTypingTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleCloseOrEnter = useCallback(() => {
    stopTypingTimer();
    stopAllKeystrokeAudio();
    onEnterMuseum();
  }, [onEnterMuseum, stopAllKeystrokeAudio, stopTypingTimer]);

  const handleRevealAll = useCallback(() => {
    if (isMandatoryRead) return;
    stopTypingTimer();
    stopAllKeystrokeAudio();
    typedLengthRef.current = fullLetterText.length;
    setTypedLength(fullLetterText.length);
  }, [fullLetterText.length, isMandatoryRead, stopAllKeystrokeAudio, stopTypingTimer]);

  const handleToggleKeySound = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      setIsKeySoundEnabled((prev) => {
        const next = !prev;
        isKeySoundEnabledRef.current = next;
        if (next) {
          resumeKeystrokeAudio();
        } else {
          stopAllKeystrokeAudio();
        }
        return next;
      });
    },
    [resumeKeystrokeAudio, stopAllKeystrokeAudio]
  );

  const checkScrollBottom = useCallback(() => {
    const el = scrollBodyRef.current;
    if (!el) return;
    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 12;
    if (isAtBottom) {
      setHasReachedScrollBottom(true);
    }
  }, []);

  // Auto-resume Web Audio context on the very first user pointer/touch/key interaction
  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    const unlock = () => {
      if (isKeySoundEnabledRef.current) {
        resumeKeystrokeAudio();
      }
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [isOpen, resumeKeystrokeAudio]);

  // Close AudioContext cleanly on unmount
  useEffect(() => {
    return () => {
      stopTypingTimer();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        void audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
      noiseBufferRef.current = null;
    };
  }, [stopTypingTimer]);

  // Typewriter effect: restarts cleanly on modal open or language tab switch (15ms / character)
  useEffect(() => {
    stopTypingTimer();
    setHasReachedScrollBottom(false);

    if (!isOpen) {
      stopAllKeystrokeAudio();
      typedLengthRef.current = 0;
      setTypedLength(0);
      return;
    }

    if (isKeySoundEnabledRef.current) {
      resumeKeystrokeAudio();
    }

    typedLengthRef.current = 0;
    setTypedLength(0);
    if (scrollBodyRef.current) {
      scrollBodyRef.current.scrollTop = 0;
    }
    const totalLength = fullLetterText.length;

    timerRef.current = window.setInterval(() => {
      const next = typedLengthRef.current + 1;
      const revealedChar = fullLetterText.charAt(next - 1);
      typedLengthRef.current = next;

      // Play tactile mechanical keystroke tick only for visible non-whitespace characters
      if (revealedChar && !/^\s$/.test(revealedChar)) {
        playMechanicalKeystroke();
      }

      if (next >= totalLength) {
        stopTypingTimer();
        setTypedLength(totalLength);
      } else {
        setTypedLength(next);
      }
    }, TYPEWRITER_INTERVAL_MS);

    return () => {
      stopTypingTimer();
    };
  }, [
    isOpen,
    lang,
    fullLetterText,
    stopTypingTimer,
    stopAllKeystrokeAudio,
    resumeKeystrokeAudio,
    playMechanicalKeystroke,
  ]);

  // Verify scroll-to-bottom automatically once typing completes (unlocks immediately if no scrollbar needed)
  useEffect(() => {
    if (!isOpen || !isTypingComplete) return;
    const rafId = window.requestAnimationFrame(() => {
      checkScrollBottom();
    });
    const handleResize = () => checkScrollBottom();
    window.addEventListener('resize', handleResize);
    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, isTypingComplete, checkScrollBottom]);

  // Lock background page scroll; allow Esc key ONLY when not in mandatory read mode
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isMandatoryRead) {
        handleCloseOrEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMandatoryRead, handleCloseOrEnter]);

  if (!isOpen) return null;

  const salutationLength = content.salutation.length;
  const bodyStartOffset = salutationLength + 2; // accounts for "\n\n"
  const visibleSalutation = fullLetterText.slice(0, Math.min(typedLength, salutationLength));
  const visibleBody =
    typedLength > bodyStartOffset ? fullLetterText.slice(bodyStartOffset, typedLength) : '';
  const isTypingSalutation = !isTypingComplete && typedLength <= salutationLength;
  const isTypingBody = !isTypingComplete && typedLength > salutationLength;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="museum-gate-letter-title"
      onClick={() => {
        if (!isMandatoryRead) {
          handleCloseOrEnter();
        }
      }}
      className="fixed inset-0 z-[70] bg-[#171817]/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-[#1C1D1B] border border-[#C9A46A]/50 text-[#D8C9A9] rounded-3xl max-w-xl w-full max-h-[82vh] flex flex-col p-5 sm:p-6 shadow-2xl overflow-hidden animate-apple-sheet"
      >
        {/* Subtle Archival Double-Hairline Inner Frame */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-2 rounded-[20px] border border-[#C9A46A]/18"
        />

        {/* Header: Position 1 — School Crest Emblem (w-11 h-11) + Full School Subtitle + 3-Lang Tabs + Optional Close X */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-[#C9A46A]/25 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <LeQuyDonVungTauEmblem className="w-11 h-11 shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#C9A46A] leading-tight">
                {content.kicker}
              </div>
              <div className="text-[11.5px] text-[#D8C9A9]/75 leading-snug mt-0.5">
                {content.subtitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start shrink-0">
            {/* 3-Language Switcher: Tiếng Việt | English | 中文 */}
            <div
              role="tablist"
              aria-label="Chọn ngôn ngữ thư ngỏ"
              className="inline-flex items-center p-0.5 rounded-full bg-[#171817] border border-[#C9A46A]/35 shrink-0"
            >
              {LANGUAGE_TABS.map((tab, idx) => {
                const isSelected = lang === tab.id;
                return (
                  <React.Fragment key={tab.id}>
                    {idx > 0 && (
                      <span
                        aria-hidden="true"
                        className="text-[10px] text-[#C9A46A]/30 select-none px-0.5"
                      >
                        |
                      </span>
                    )}
                    <button
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      onClick={() => {
                        stopTypingTimer();
                        setLang(tab.id);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-[#C9A46A] text-[#171817] shadow-sm'
                          : 'text-[#D8C9A9]/75 hover:text-[#D8C9A9]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Close X Button — STRICTLY HIDDEN during first-login mandatory read */}
            {!isMandatoryRead && (
              <button
                type="button"
                onClick={handleCloseOrEnter}
                aria-label={content.closeLabel}
                title={content.closeLabel}
                className="w-7 h-7 rounded-full bg-[#171817] border border-[#C9A46A]/35 hover:border-[#C9A46A] text-[#D8C9A9]/75 hover:text-[#F4EFE4] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-3.5 h-3.5"
                  aria-hidden="true"
                >
                  <path d="M5.5 5.5l9 9" />
                  <path d="M14.5 5.5l-9 9" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Editorial Letter Body with Typewriter Animation */}
        <div
          ref={scrollBodyRef}
          onScroll={() => {
            if (isTypingComplete) {
              checkScrollBottom();
            }
          }}
          onClick={() => {
            if (!isMandatoryRead && !isTypingComplete) {
              handleRevealAll();
            }
          }}
          title={
            !isMandatoryRead && !isTypingComplete
              ? lang === 'en'
                ? 'Click to reveal full letter immediately'
                : lang === 'zh'
                ? '点击立即显示全文'
                : 'Bấm để hiển thị trọn vẹn bức thư ngay lập tức'
              : undefined
          }
          className={`relative z-10 flex-1 min-h-0 overflow-y-auto heritage-scrollbar heritage-letter-scroll py-4 pr-2 space-y-2.5 ${
            !isMandatoryRead && !isTypingComplete ? 'cursor-pointer' : ''
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2.5">
            <h2
              id="museum-gate-letter-title"
              className="font-serif text-lg sm:text-[20px] font-semibold tracking-tight leading-snug text-[#F4EFE4] min-w-0 flex-1"
            >
              {content.title}
            </h2>

            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
              {/* Compact Keystroke Sound Toggle Button */}
              <button
                type="button"
                onClick={handleToggleKeySound}
                aria-pressed={isKeySoundEnabled}
                aria-label={content.keySoundToggleAria}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#C9A46A]/40 bg-[#171817]/85 hover:border-[#C9A46A] text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isKeySoundEnabled
                    ? 'text-[#C9A46A] hover:text-[#F4EFE4]'
                    : 'text-[#D8C9A9]/60 hover:text-[#D8C9A9]'
                }`}
              >
                {isKeySoundEnabled ? (
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M9.5 4.5L5.5 7.75H3v4.5h2.5l4 3.25V4.5z" />
                    <path d="M13 7.25a4 4 0 0 1 0 5.5" />
                    <path d="M15.4 5.1a7 7 0 0 1 0 9.8" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3 h-3 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M9.5 4.5L5.5 7.75H3v4.5h2.5l4 3.25V4.5z" />
                    <path d="M13 7.5l4 5" />
                    <path d="M17 7.5l-4 5" />
                  </svg>
                )}
                <span>{isKeySoundEnabled ? content.keySoundOnLabel : content.keySoundOffLabel}</span>
              </button>

              {/* Reveal All shortcut — only shown when NOT in first-login mandatory read */}
              {!isMandatoryRead && !isTypingComplete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRevealAll();
                  }}
                  className="shrink-0 px-2.5 py-1 rounded-full border border-[#C9A46A]/40 bg-[#171817]/85 hover:border-[#C9A46A] text-[11px] font-medium text-[#C9A46A] hover:text-[#F4EFE4] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {content.revealAllLabel}
                </button>
              )}
            </div>
          </div>

          <div className="w-12 h-[2px] bg-[#A94F3D] rounded-full" />

          <div className="text-[13.5px] leading-relaxed space-y-2.5 text-[#D8C9A9]/92 pt-0.5 min-h-[210px]">
            <p className="font-serif text-[14.5px] italic text-[#C9A46A] whitespace-pre-line">
              {visibleSalutation}
              {isTypingSalutation && (
                <span
                  aria-hidden="true"
                  className="inline-block w-[2px] h-4 bg-[#C9A46A] ml-1 align-middle animate-pulse"
                />
              )}
            </p>

            {(visibleBody.length > 0 || isTypingBody) && (
              <p className="whitespace-pre-line text-justify">
                {visibleBody}
                {isTypingBody && (
                  <span
                    aria-hidden="true"
                    className="inline-block w-[2px] h-4 bg-[#C9A46A] ml-1 align-middle animate-pulse"
                  />
                )}
              </p>
            )}
          </div>
        </div>

        {/* Footer: Position 2 — School Crest Emblem (w-9 h-9) + Signature + Locked/Unlocked CTA Button */}
        <div className="relative z-10 pt-3.5 border-t border-[#C9A46A]/25 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs text-[#D8C9A9]/85">
            <LeQuyDonVungTauEmblem className="w-9 h-9 shrink-0" />
            <span className="font-serif italic text-[12.5px] text-[#F4EFE4]/90">
              {content.sealSignature}
            </span>
          </div>

          {!canDismiss ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-[13px] rounded-full bg-[#171817] border border-[#C9A46A]/30 text-[#D8C9A9]/60 font-medium cursor-not-allowed transition-all inline-flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#C9A46A"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0 opacity-75"
                aria-hidden="true"
              >
                <path d="M5 3h14" />
                <path d="M5 21h14" />
                <path d="M7 3v3.5a5 5 0 0 0 2.5 4.33L12 12l2.5-1.17A5 5 0 0 0 17 6.5V3" />
                <path d="M7 21v-3.5a5 5 0 0 1 2.5-4.33L12 12l2.5 1.17A5 5 0 0 1 17 17.5V21" />
              </svg>
              <span>{content.lockedCtaLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCloseOrEnter}
              className="w-full sm:w-auto px-6 py-2.5 text-sm rounded-full bg-[#C9A46A] hover:bg-[#d8b57c] text-[#171817] font-semibold transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-[0_8px_22px_rgba(201,164,106,0.26)] active:scale-[0.99] whitespace-nowrap"
            >
              <span>{content.ctaLabel}</span>
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M4.5 10h11" />
                <path d="M11 5.5L15.5 10 11 14.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

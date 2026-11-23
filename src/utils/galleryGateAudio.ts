// =========================================================================
// MUSEUM GALLERY-GATE ATMOSPHERIC TRANSITION AUDIO
// Uses an in-memory WAV audio file routed through a Web Audio BiquadFilterNode
// (low-pass filter) for a warm, subtle museum threshold acoustic signature.
// =========================================================================

export type GalleryGateTransitionMode = 'enter' | 'exit';

let sharedAudioCtx: AudioContext | null = null;
const cachedWavUrls: Partial<Record<GalleryGateTransitionMode, string>> = {};

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Generates a 16-bit PCM mono WAV file Blob URL containing a warm museum
 * architectural resonance + soft velvet air texture so it can be played
 * as a real audio file through a Web Audio low-pass filter node.
 */
function getOrCreateGalleryGateWavUrl(mode: GalleryGateTransitionMode): string {
  if (cachedWavUrls[mode]) {
    return cachedWavUrls[mode]!;
  }

  const sampleRate = 44100;
  const durationSeconds = mode === 'enter' ? 0.95 : 0.75;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  // RIFF WAV Header
  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, 1, true); // NumChannels (1 = Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeAscii(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Deterministic pseudo-random state for soft acoustic room air
  let seed = mode === 'enter' ? 104729 : 7919;
  const nextNoise = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed / 0xffffffff) * 2 - 1;
  };

  // Frequencies: warm acoustic fifth (A2 110Hz & E3 164.81Hz & A3 220Hz)
  const f1 = mode === 'enter' ? 110.0 : 164.81;
  const f2 = mode === 'enter' ? 164.81 : 110.0;
  const f3 = mode === 'enter' ? 220.0 : 146.83;

  let prevNoise = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const progress = t / durationSeconds;

    // Smooth attack & long exponential gallery decay
    const attack = Math.min(1, t / 0.08);
    const decay = Math.exp(-3.6 * progress) * (1 - progress);
    const env = attack * decay;

    // Delayed second harmonic bloom (portal threshold sensation)
    const bloomAttack = Math.max(0, Math.min(1, (t - 0.09) / 0.12));
    const bloomEnv = bloomAttack * Math.exp(-3.2 * progress) * (1 - progress);

    // Subtle smoothed room air movement
    const rawNoise = nextNoise();
    prevNoise = prevNoise * 0.88 + rawNoise * 0.12;
    const airEnv = Math.sin(Math.PI * progress) * Math.exp(-2.2 * progress);

    const tone1 = Math.sin(2 * Math.PI * f1 * t) * 0.42 * env;
    const tone2 = Math.sin(2 * Math.PI * f2 * t) * 0.34 * bloomEnv;
    const tone3 = Math.sin(2 * Math.PI * f3 * t) * 0.16 * bloomEnv;
    const air = prevNoise * 0.18 * airEnv;

    const sample = Math.max(-1, Math.min(1, tone1 + tone2 + tone3 + air));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  cachedWavUrls[mode] = url;
  return url;
}

/**
 * Plays the subtle 'gallery-gate' transition sound by loading the WAV audio file
 * and routing it through a Web Audio BiquadFilterNode (low-pass filter).
 */
export function playGalleryGateSound(mode: GalleryGateTransitionMode = 'enter'): void {
  try {
    const ctx = getAudioContext();
    const wavUrl = getOrCreateGalleryGateWavUrl(mode);
    const audioEl = new Audio(wavUrl);
    audioEl.crossOrigin = 'anonymous';
    audioEl.volume = mode === 'enter' ? 0.32 : 0.26;

    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const sourceNode = ctx.createMediaElementSource(audioEl);
      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.Q.value = 1.4;

      const now = ctx.currentTime;
      if (mode === 'enter') {
        // Gentle opening sweep of the gallery gate low-pass filter
        lowpassFilter.frequency.setValueAtTime(240, now);
        lowpassFilter.frequency.exponentialRampToValueAtTime(820, now + 0.32);
        lowpassFilter.frequency.exponentialRampToValueAtTime(340, now + 0.9);
      } else {
        // Gentle closing sweep of the gallery gate low-pass filter
        lowpassFilter.frequency.setValueAtTime(680, now);
        lowpassFilter.frequency.exponentialRampToValueAtTime(190, now + 0.68);
      }

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.linearRampToValueAtTime(mode === 'enter' ? 0.28 : 0.22, now + 0.06);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + (mode === 'enter' ? 0.92 : 0.72));

      sourceNode.connect(lowpassFilter);
      lowpassFilter.connect(masterGain);
      masterGain.connect(ctx.destination);

      audioEl.onended = () => {
        try {
          sourceNode.disconnect();
          lowpassFilter.disconnect();
          masterGain.disconnect();
        } catch {
          // ignore disconnect cleanup errors
        }
      };
    }

    audioEl.play().catch(() => {
      // Autoplay policy or muted browser tab — fail silently
    });
  } catch {
    // Fail silently if Web Audio API is unavailable
  }
}

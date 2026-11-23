/**
 * Procedural 3D Spatial Ambient Soundscape Engine (Web Audio API)
 * Generates subtle, authentic environmental atmospheres for 3D heritage views:
 *  - urban_heritage: soft tropical breeze + distant historic Saigon boulevard hum
 *  - sacred_courtyard: gentle temple courtyard wind + open-air resonance + distant bronze shimmer
 *  - nature_sanctuary: slow sweeping open-air wind gusts through foliage
 *
 * Zero external audio assets required; runs cleanly offline with smooth gain ramps.
 */

export type Spatial3DAmbientProfile =
  | 'urban_heritage'
  | 'sacred_courtyard'
  | 'nature_sanctuary';

export function resolveSpatialProfileForSite(params: {
  siteId?: string;
  siteName?: string;
  siteType?: string;
}): Spatial3DAmbientProfile {
  const combined = `${params.siteId || ''} ${params.siteName || ''} ${params.siteType || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    /chua|lang|den|mieu|hoi quan|thanh that|nha tho|pagoda|temple|mausoleum|shrine|sacred|ton giao|tin nguong/.test(
      combined
    )
  ) {
    return 'sacred_courtyard';
  }

  if (
    /dia dao|cu chi|rung|con dao|nui|vuon|dao|chien khu|can gio|ba den|bien|song|nature|tunnel|forest|island/.test(
      combined
    )
  ) {
    return 'nature_sanctuary';
  }

  return 'urban_heritage';
}

export function getSpatialProfileLabel(
  profile: Spatial3DAmbientProfile,
  lang: 'vi' | 'en' | 'zh'
): string {
  if (profile === 'sacred_courtyard') {
    return lang === 'en'
      ? 'Courtyard breeze & temple air'
      : lang === 'zh'
      ? '古寺庭院微风与清幽回响'
      : 'Gió sân chùa & Không gian cổ kính';
  }
  if (profile === 'nature_sanctuary') {
    return lang === 'en'
      ? 'Open-air wind & rustling foliage'
      : lang === 'zh'
      ? '旷野清风与林叶沙沙声'
      : 'Gió đồng nội & Tiếng lá xào xạc';
  }
  return lang === 'en'
    ? 'Breeze & distant historic street hum'
    : lang === 'zh'
    ? '微风与远方历史街区声景'
    : 'Gió nhẹ & Nhịp phố Sài Gòn từ xa';
}

export class Spatial3DAmbientEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private windLfo: OscillatorNode | null = null;
  private windLfoGain: GainNode | null = null;

  private streetFilter: BiquadFilterNode | null = null;
  private streetGain: GainNode | null = null;

  private pannerNode: StereoPannerNode | null = null;
  private panLfo: OscillatorNode | null = null;

  private noiseBuffer: AudioBuffer | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private streetSource: AudioBufferSourceNode | null = null;

  private gustTimerId: number | null = null;
  private detailTimerId: number | null = null;
  private isRunning = false;
  private profile: Spatial3DAmbientProfile = 'urban_heritage';
  private currentGain = 0;

  // Keep ambient ceiling tasteful so 100% slider sounds immersive, never harsh
  private readonly MAX_OUTPUT_SCALE = 0.42;

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

    // Optional stereo spatial panner with slow organic drift
    let spatialBus: AudioNode = masterGain;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(0, ctx.currentTime);
      panner.connect(masterGain);

      const panLfo = ctx.createOscillator();
      const panLfoDepth = ctx.createGain();
      panLfo.type = 'sine';
      panLfo.frequency.setValueAtTime(0.065, ctx.currentTime);
      panLfoDepth.gain.setValueAtTime(0.28, ctx.currentTime);
      panLfo.connect(panLfoDepth);
      panLfoDepth.connect(panner.pan);
      panLfo.start();

      this.pannerNode = panner;
      this.panLfo = panLfo;
      spatialBus = panner;
    }

    // Generate 4 seconds of warm pink-ish noise for natural wind & street air
    const sampleCount = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < sampleCount; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.055;
      b6 = white * 0.115926;
    }

    // Layer 1: Wind / Breeze bandpass noise with slow breathing LFO
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(420, ctx.currentTime);
    windFilter.Q.setValueAtTime(1.15, ctx.currentTime);

    const windGain = ctx.createGain();
    windGain.gain.setValueAtTime(0.32, ctx.currentTime);

    const windLfo = ctx.createOscillator();
    const windLfoGain = ctx.createGain();
    windLfo.type = 'sine';
    windLfo.frequency.setValueAtTime(0.11, ctx.currentTime);
    windLfoGain.gain.setValueAtTime(140, ctx.currentTime);
    windLfo.connect(windLfoGain);
    windLfoGain.connect(windFilter.frequency);
    windLfo.start();

    windFilter.connect(windGain);
    windGain.connect(spatialBus);

    // Layer 2: Warm low-pass distant boulevard / open-air room tone
    const streetFilter = ctx.createBiquadFilter();
    streetFilter.type = 'lowpass';
    streetFilter.frequency.setValueAtTime(220, ctx.currentTime);
    streetFilter.Q.setValueAtTime(0.7, ctx.currentTime);

    const streetGain = ctx.createGain();
    streetGain.gain.setValueAtTime(0.26, ctx.currentTime);

    streetFilter.connect(streetGain);
    streetGain.connect(masterGain);

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.windFilter = windFilter;
    this.windGain = windGain;
    this.windLfo = windLfo;
    this.windLfoGain = windLfoGain;
    this.streetFilter = streetFilter;
    this.streetGain = streetGain;
    this.noiseBuffer = buffer;

    this.applyProfileParams(this.profile);
    return ctx;
  }

  private ensureContinuousSources(): void {
    if (!this.ctx || !this.noiseBuffer || !this.windFilter || !this.streetFilter) return;

    if (!this.windSource) {
      const ws = this.ctx.createBufferSource();
      ws.buffer = this.noiseBuffer;
      ws.loop = true;
      ws.connect(this.windFilter);
      ws.start();
      this.windSource = ws;
    }

    if (!this.streetSource) {
      const ss = this.ctx.createBufferSource();
      ss.buffer = this.noiseBuffer;
      ss.loop = true;
      // Offset loop playback so both layers never phase-lock
      ss.start(0, 1.7);
      ss.connect(this.streetFilter);
      this.streetSource = ss;
    }
  }

  private applyProfileParams(profile: Spatial3DAmbientProfile): void {
    if (!this.ctx || !this.windFilter || !this.windGain || !this.streetFilter || !this.streetGain) {
      return;
    }
    const now = this.ctx.currentTime;
    if (profile === 'urban_heritage') {
      // Gentle Saigon breeze + warm distant boulevard air
      this.windFilter.frequency.setTargetAtTime(380, now, 0.35);
      this.windFilter.Q.setTargetAtTime(1.1, now, 0.35);
      this.windGain.gain.setTargetAtTime(0.28, now, 0.35);
      this.streetFilter.frequency.setTargetAtTime(240, now, 0.35);
      this.streetGain.gain.setTargetAtTime(0.38, now, 0.35);
    } else if (profile === 'sacred_courtyard') {
      // Calm temple courtyard air + softer low bed
      this.windFilter.frequency.setTargetAtTime(480, now, 0.35);
      this.windFilter.Q.setTargetAtTime(1.5, now, 0.35);
      this.windGain.gain.setTargetAtTime(0.32, now, 0.35);
      this.streetFilter.frequency.setTargetAtTime(145, now, 0.35);
      this.streetGain.gain.setTargetAtTime(0.18, now, 0.35);
    } else {
      // Open-air foliage wind & gentle air movement
      this.windFilter.frequency.setTargetAtTime(560, now, 0.35);
      this.windFilter.Q.setTargetAtTime(0.95, now, 0.35);
      this.windGain.gain.setTargetAtTime(0.42, now, 0.35);
      this.streetFilter.frequency.setTargetAtTime(175, now, 0.35);
      this.streetGain.gain.setTargetAtTime(0.22, now, 0.35);
    }
  }

  private triggerOrganicGust(): void {
    if (!this.ctx || !this.noiseBuffer || !this.masterGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const startFreq =
      this.profile === 'nature_sanctuary'
        ? 460 + Math.random() * 240
        : 320 + Math.random() * 180;
    const peakFreq = startFreq + 220 + Math.random() * 260;
    const dur = 3.2 + Math.random() * 2.8;

    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.linearRampToValueAtTime(peakFreq, now + dur * 0.45);
    filter.frequency.linearRampToValueAtTime(startFreq * 0.85, now + dur);
    filter.Q.setValueAtTime(1.4, now);

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.16, now + dur * 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    const targetNode = this.pannerNode || this.masterGain;
    src.connect(filter);
    filter.connect(env);
    env.connect(targetNode);

    src.start(now, Math.random() * 2);
    src.stop(now + dur + 0.1);
  }

  private triggerSiteDetailAccent(): void {
    if (!this.ctx || !this.masterGain || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const targetNode = this.pannerNode || this.masterGain;

    if (this.profile === 'sacred_courtyard') {
      // Very distant warm temple bronze shimmer
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      const freqs = [392.0, 440.0, 523.25];
      osc.frequency.setValueAtTime(freqs[Math.floor(Math.random() * freqs.length)], now);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.022, now + 0.08);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 4.4);

      osc.connect(env);
      env.connect(targetNode);
      osc.start(now);
      osc.stop(now + 4.6);
    } else if (this.profile === 'urban_heritage') {
      // Soft distant passing avenue swell (low-passed gentle street motion)
      if (!this.noiseBuffer) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'bandpass';
      lp.frequency.setValueAtTime(160, now);
      lp.frequency.linearRampToValueAtTime(280, now + 1.8);
      lp.frequency.linearRampToValueAtTime(135, now + 4.2);
      lp.Q.setValueAtTime(1.6, now);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.14, now + 1.9);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 4.3);

      src.connect(lp);
      lp.connect(env);
      env.connect(targetNode);
      src.start(now, Math.random() * 2);
      src.stop(now + 4.5);
    } else {
      // Subtle high leafy rustle
      if (!this.noiseBuffer) return;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;

      const hp = this.ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.setValueAtTime(1450, now);
      hp.Q.setValueAtTime(2.0, now);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(0.055, now + 1.1);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      src.connect(hp);
      hp.connect(env);
      env.connect(targetNode);
      src.start(now, Math.random() * 2);
      src.stop(now + 3.0);
    }
  }

  private scheduleLoops(): void {
    this.clearTimers();
    const runGust = () => {
      if (!this.isRunning) return;
      this.triggerOrganicGust();
      this.gustTimerId = window.setTimeout(runGust, 4800 + Math.random() * 4400);
    };
    const runDetail = () => {
      if (!this.isRunning) return;
      this.triggerSiteDetailAccent();
      this.detailTimerId = window.setTimeout(runDetail, 6800 + Math.random() * 5800);
    };

    this.gustTimerId = window.setTimeout(runGust, 1400);
    this.detailTimerId = window.setTimeout(runDetail, 3400);
  }

  private clearTimers(): void {
    if (this.gustTimerId !== null) {
      window.clearTimeout(this.gustTimerId);
      this.gustTimerId = null;
    }
    if (this.detailTimerId !== null) {
      window.clearTimeout(this.detailTimerId);
      this.detailTimerId = null;
    }
  }

  public setProfile(profile: Spatial3DAmbientProfile): void {
    this.profile = profile;
    this.applyProfileParams(profile);
  }

  public async start(
    profile: Spatial3DAmbientProfile,
    targetGain01: number,
    fadeDurationMs = 900
  ): Promise<boolean> {
    this.profile = profile;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return false;

    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch {
      return false;
    }

    this.applyProfileParams(profile);
    this.ensureContinuousSources();

    if (!this.isRunning) {
      this.isRunning = true;
      this.scheduleLoops();
    }

    this.rampGain(targetGain01, fadeDurationMs);
    return true;
  }

  public rampGain(targetGain01: number, durationMs = 350): void {
    if (!this.ctx || !this.masterGain) return;
    const scaled = Math.max(0, Math.min(1, targetGain01)) * this.MAX_OUTPUT_SCALE;
    const now = this.ctx.currentTime;
    const param = this.masterGain.gain;

    try {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(scaled, now + Math.max(0.03, durationMs / 1000));
      this.currentGain = scaled;
    } catch {
      this.currentGain = scaled;
    }
  }

  public stop(fadeOutMs = 450): void {
    this.isRunning = false;
    this.clearTimers();
    this.rampGain(0, fadeOutMs);
  }

  public getCurrentGain(): number {
    return this.currentGain;
  }

  public destroy(): void {
    this.stop(60);
    try {
      this.windSource?.stop();
      this.streetSource?.stop();
      this.windLfo?.stop();
      this.panLfo?.stop();
      void this.ctx?.close();
    } catch {
      // ignore teardown errors
    }
    this.windSource = null;
    this.streetSource = null;
    this.ctx = null;
    this.masterGain = null;
  }
}

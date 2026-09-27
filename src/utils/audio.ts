/**
 * Sound synthesis engine using ONLY native Web Audio API.
 * 100% offline, zero external audio files, zero fetch, zero network calls.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private spinTimer: number | null = null;
  private isDecelerating: boolean = false;

  // Background Music (BGM) state
  private isBgmPlaying: boolean = false;
  private bgmVolume: number = 0.35;
  private bgmTimer: number | null = null;
  private customAudio: HTMLAudioElement | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpinTicks();
      this.pauseBgm();
    } else if (this.isBgmPlaying) {
      this.resumeBgm();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    if (this.customAudio) {
      this.customAudio.volume = this.bgmVolume;
    }
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  /**
   * Crisp, tension-building tick sound (like a high-tech game show ticker)
   */
  public playTick(pitchMultiplier: number = 1.0) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const baseFreq = 1100 * pitchMultiplier;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(320 * pitchMultiplier, now + 0.035);

      const currentVol = 0.25 * this.volume;
      gain.gain.setValueAtTime(currentVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.036);
    } catch {
      // AudioContext safe catch
    }
  }

  /**
   * Continuous high-speed ticks while spinning
   */
  public startSpinTicks(speedMs: number = 65) {
    if (this.isMuted) return;
    this.stopSpinTicks();
    this.isDecelerating = false;

    const tickLoop = () => {
      this.playTick(1.0 + (Math.random() * 0.15 - 0.075));
      this.spinTimer = window.setTimeout(tickLoop, speedMs);
    };

    tickLoop();
  }

  /**
   * Natural deceleration: intervals between ticks increase progressively
   */
  public decelerateTicks(durationMs: number = 3000, onStep?: (progress: number) => void): Promise<void> {
    this.stopSpinTicks();
    if (this.isMuted) {
      return new Promise((resolve) => setTimeout(resolve, durationMs));
    }

    this.isDecelerating = true;
    const startTime = performance.now();

    return new Promise((resolve) => {
      const step = () => {
        if (!this.isDecelerating) {
          resolve();
          return;
        }

        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        if (onStep) onStep(progress);

        const ease = progress * progress * progress;
        const currentInterval = 70 + ease * 380;
        const pitchMultiplier = 1.0 - progress * 0.25;

        this.playTick(pitchMultiplier);

        if (elapsed < durationMs) {
          this.spinTimer = window.setTimeout(step, currentInterval);
        } else {
          this.isDecelerating = false;
          resolve();
        }
      };

      step();
    });
  }

  public stopSpinTicks() {
    if (this.spinTimer !== null) {
      clearTimeout(this.spinTimer);
      this.spinTimer = null;
    }
    this.isDecelerating = false;
  }

  /**
   * Crystal "Ting" chime when a student is selected
   */
  public playTing() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const freqs = [1046.5, 1567.98, 2093.0]; // C6, G6, C7
      const gains = [0.35, 0.2, 0.15];

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const targetVol = gains[idx] * this.volume;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(targetVol, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 1.85);
      });
    } catch {
      // AudioContext safe catch
    }
  }

  /**
   * Synthesizes 2.5 - 3 seconds of realistic classroom / game show applause
   */
  public playApplause(durationSec: number = 2.6) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const sampleRate = this.ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * durationSec);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const isClapBurst = Math.random() < 0.004;
        const burstMultiplier = isClapBurst ? Math.random() * 2.5 + 1.2 : 1.0;
        output[i] = (Math.random() * 2 - 1) * burstMultiplier;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.2, this.ctx.currentTime);

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(3200, this.ctx.currentTime);

      const masterGain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const peakVol = 0.42 * this.volume;

      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(peakVol, now + 0.15);
      masterGain.gain.setValueAtTime(peakVol, now + 1.4);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      whiteNoise.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + durationSec + 0.1);
    } catch {
      // AudioContext safe catch
    }
  }

  public playSelectionSequence() {
    this.stopSpinTicks();
    this.playTing();
    setTimeout(() => {
      this.playApplause(2.8);
    }, 180);
  }

  /**
   * Ambient Synthesized Background Music (BGM)
   * 100% offline, smooth game show chill chords
   */
  public toggleBgm(play: boolean) {
    this.isBgmPlaying = play;
    if (play && !this.isMuted) {
      this.startSynthesizedBgm();
    } else {
      this.pauseBgm();
    }
  }

  public isBgmActive(): boolean {
    return this.isBgmPlaying;
  }

  private startSynthesizedBgm() {
    if (this.customAudio) {
      this.customAudio.play().catch(() => {});
      return;
    }

    if (this.bgmTimer) return;
    this.initContext();

    // Pentatonic calm groove notes: C4, E4, G4, A4, B4, C5
    const notes = [261.63, 329.63, 392.0, 440.0, 493.88, 523.25];
    let noteIndex = 0;

    const playChordStep = () => {
      if (!this.isBgmPlaying || this.isMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const freq = notes[noteIndex % notes.length];
      noteIndex = (noteIndex + 1) % notes.length;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      const targetVol = 0.08 * this.bgmVolume;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(targetVol, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.0);

      this.bgmTimer = window.setTimeout(playChordStep, 450);
    };

    playChordStep();
  }

  public pauseBgm() {
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  public resumeBgm() {
    if (this.isBgmPlaying && !this.isMuted) {
      this.startSynthesizedBgm();
    }
  }

  public setCustomAudioFile(audioUrl: string | null) {
    if (this.customAudio) {
      this.customAudio.pause();
      this.customAudio = null;
    }

    if (audioUrl) {
      this.customAudio = new Audio(audioUrl);
      this.customAudio.loop = true;
      this.customAudio.volume = this.bgmVolume;
      if (this.isBgmPlaying && !this.isMuted) {
        this.customAudio.play().catch(() => {});
      }
    }
  }
}

export const soundManager = new SoundEngine();

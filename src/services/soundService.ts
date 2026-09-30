// Sound service utilizing Web Audio API for responsive low-latency sound effects and ambient music

const SOUND_NAMES = [
  'select-0', 'select-1', 'select-2',
  'move-0', 'move-1', 'move-2',
  'capture', 'entrance', 'check',
  'victory', 'defeat', 'draw', 'promotion'
] as const;

export type SoundEffect =
  | 'select'
  | 'move'
  | 'capture'
  | 'entrance'
  | 'check'
  | 'victory'
  | 'defeat'
  | 'draw'
  | 'promotion';

class SoundService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  private buffers: Map<string, AudioBuffer> = new Map();
  private isLoaded = false;
  private isUnlocked = false;

  private lobbyMusic: HTMLAudioElement | null = null;
  private gameMusic: HTMLAudioElement | null = null;
  private lobbySource: MediaElementAudioSourceNode | null = null;
  private gameSource: MediaElementAudioSourceNode | null = null;
  private currentMusicMode: 'lobby' | 'game' | 'none' = 'none';

  private soundVolume = 0.85;
  private musicVolume = 0.28;
  private soundEnabled = true;
  private musicEnabled = true;

  constructor() {
    // Unlock Web Audio on first user interaction
    const unlock = () => {
      this.init();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  public async init() {
    if (this.ctx && this.isUnlocked) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.limiter = this.ctx.createDynamicsCompressor();

        this.limiter.threshold.value = -12;
        this.limiter.knee.value = 8;
        this.limiter.ratio.value = 4;
        this.limiter.attack.value = 0.003;
        this.limiter.release.value = 0.12;

        this.sfxGain.connect(this.masterGain);
        this.musicGain.connect(this.masterGain);
        this.masterGain.connect(this.limiter);
        this.limiter.connect(this.ctx.destination);

        this.syncVolumes();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isUnlocked = true;

      if (!this.isLoaded) {
        this.loadAssets();
      }
    } catch (e) {
      console.warn('Web Audio initialization:', e);
    }
  }

  private async loadAssets() {
    if (!this.ctx) return;
    this.isLoaded = true;

    // Load SFX in background
    SOUND_NAMES.forEach(async (name) => {
      try {
        const resp = await fetch(`/assets/audio/${name}.wav`);
        if (!resp.ok) return;
        const arrayBuffer = await resp.arrayBuffer();
        const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
        this.buffers.set(name, audioBuffer);
      } catch (err) {
        // audio loading error suppressed
      }
    });

    // Setup music elements
    this.lobbyMusic = new Audio('/assets/music/passage-of-time.mp3');
    this.lobbyMusic.loop = true;
    this.lobbyMusic.preload = 'none';

    this.gameMusic = new Audio('/assets/music/reverie.mp3');
    this.gameMusic.loop = true;
    this.gameMusic.preload = 'none';

    try {
      this.lobbySource = this.ctx.createMediaElementSource(this.lobbyMusic);
      this.gameSource = this.ctx.createMediaElementSource(this.gameMusic);
      this.lobbySource.connect(this.musicGain!);
      this.gameSource.connect(this.musicGain!);
    } catch {
      // media element source error suppressed
    }
  }

  public updateSettings(sound: boolean, sVolume: number, music: boolean, mVolume: number) {
    this.soundEnabled = sound;
    this.soundVolume = Math.max(0, Math.min(1, sVolume));
    this.musicEnabled = music;
    this.musicVolume = Math.max(0, Math.min(1, mVolume));
    this.syncVolumes();
  }

  private syncVolumes() {
    if (!this.ctx || !this.sfxGain || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const targetSfx = this.soundEnabled ? this.soundVolume : 0;
    const targetMusic = this.soundEnabled && this.musicEnabled ? this.musicVolume : 0;

    this.sfxGain.gain.cancelScheduledValues(now);
    this.sfxGain.gain.linearRampToValueAtTime(targetSfx, now + 0.05);

    this.musicGain.gain.cancelScheduledValues(now);
    this.musicGain.gain.linearRampToValueAtTime(targetMusic, now + 0.05);
  }

  public play(effect: SoundEffect, pan = 0) {
    if (!this.soundEnabled || !this.ctx || !this.sfxGain) return;
    let sampleName: string = effect;

    // Handle random variations for select and move
    if (effect === 'select') {
      const idx = Math.floor(Math.random() * 3);
      sampleName = `select-${idx}`;
    } else if (effect === 'move') {
      const idx = Math.floor(Math.random() * 3);
      sampleName = `move-${idx}`;
    }

    const buffer = this.buffers.get(sampleName);
    if (!buffer) return;

    try {
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      if (pan !== 0 && this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, pan));
        source.connect(panner);
        panner.connect(this.sfxGain);
      } else {
        source.connect(this.sfxGain);
      }

      source.start();
    } catch (e) {
      console.warn('Failed to play SFX:', e);
    }
  }

  public setMusicMode(mode: 'lobby' | 'game' | 'none') {
    this.currentMusicMode = mode;
    if (!this.musicEnabled || !this.soundEnabled) {
      this.lobbyMusic?.pause();
      this.gameMusic?.pause();
      return;
    }

    if (mode === 'lobby') {
      this.gameMusic?.pause();
      this.lobbyMusic?.play().catch(() => {});
    } else if (mode === 'game') {
      this.lobbyMusic?.pause();
      this.gameMusic?.play().catch(() => {});
    } else {
      this.lobbyMusic?.pause();
      this.gameMusic?.pause();
    }
  }
}

export const soundService = new SoundService();

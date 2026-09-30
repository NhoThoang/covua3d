import { create } from 'zustand';
import { GraphicSettings, SoundSettings } from '../types/chess';
import { soundService } from '../services/soundService';

interface SettingsState {
  sound: SoundSettings;
  graphics: GraphicSettings;
  cameraView: 'default' | 'top' | 'flipped';
  isStartModalOpen: boolean;
  isSettingsOpen: boolean;
  isPgnModalOpen: boolean;

  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;

  setGraphicsQuality: (quality: GraphicSettings['quality']) => void;
  setPieceShading: (shading: GraphicSettings['shading']) => void;
  setLuxuryLighting: (enabled: boolean) => void;
  setAnimations: (enabled: boolean) => void;
  setLegalHints: (enabled: boolean) => void;

  setCameraView: (view: 'default' | 'top' | 'flipped') => void;
  setIsStartModalOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsPgnModalOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  sound: {
    soundEnabled: true,
    soundVolume: 0.85,
    musicEnabled: true,
    musicVolume: 0.28,
  },
  graphics: {
    quality: 'high',
    shading: 'flat',
    luxuryLighting: true,
    animations: true,
    legalHints: true,
    frameLimit: 120,
  },
  cameraView: 'default',
  isStartModalOpen: false,
  isSettingsOpen: false,
  isPgnModalOpen: false,

  setSoundEnabled: (enabled) => {
    set((state) => {
      const nextSound = { ...state.sound, soundEnabled: enabled };
      soundService.updateSettings(nextSound.soundEnabled, nextSound.soundVolume, nextSound.musicEnabled, nextSound.musicVolume);
      return { sound: nextSound };
    });
  },

  setSoundVolume: (volume) => {
    set((state) => {
      const nextSound = { ...state.sound, soundVolume: volume };
      soundService.updateSettings(nextSound.soundEnabled, nextSound.soundVolume, nextSound.musicEnabled, nextSound.musicVolume);
      return { sound: nextSound };
    });
  },

  setMusicEnabled: (enabled) => {
    set((state) => {
      const nextSound = { ...state.sound, musicEnabled: enabled };
      soundService.updateSettings(nextSound.soundEnabled, nextSound.soundVolume, nextSound.musicEnabled, nextSound.musicVolume);
      return { sound: nextSound };
    });
  },

  setMusicVolume: (volume) => {
    set((state) => {
      const nextSound = { ...state.sound, musicVolume: volume };
      soundService.updateSettings(nextSound.soundEnabled, nextSound.soundVolume, nextSound.musicEnabled, nextSound.musicVolume);
      return { sound: nextSound };
    });
  },

  setGraphicsQuality: (quality) => {
    set((state) => ({ graphics: { ...state.graphics, quality } }));
  },

  setPieceShading: (shading) => {
    set((state) => ({ graphics: { ...state.graphics, shading } }));
  },

  setLuxuryLighting: (enabled) => {
    set((state) => ({ graphics: { ...state.graphics, luxuryLighting: enabled } }));
  },

  setAnimations: (enabled) => {
    set((state) => ({ graphics: { ...state.graphics, animations: enabled } }));
  },

  setLegalHints: (enabled) => {
    set((state) => ({ graphics: { ...state.graphics, legalHints: enabled } }));
  },

  setCameraView: (view) => set({ cameraView: view }),
  setIsStartModalOpen: (open) => set({ isStartModalOpen: open }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setIsPgnModalOpen: (open) => set({ isPgnModalOpen: open }),
}));

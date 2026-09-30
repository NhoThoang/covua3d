import React, { useState } from 'react';
import {
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2,
  Camera,
  Play,
  FileText,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export const TopNav: React.FC = () => {
  const { mode, difficulty } = useGameStore();
  const {
    cameraView,
    setCameraView,
    setIsStartModalOpen,
    setIsSettingsOpen,
    setIsPgnModalOpen,
    sound,
    setSoundEnabled,
  } = useSettingsStore();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const difficultyNames = {
    1: 'Dễ',
    2: 'Vừa',
    3: 'Khó',
    4: 'Tinh tú',
  };

  const cycleCamera = () => {
    if (cameraView === 'default') setCameraView('top');
    else if (cameraView === 'top') setCameraView('flipped');
    else setCameraView('default');
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-40 p-3 md:p-4 flex items-center justify-between pointer-events-none">
      {/* Brand & Match Status */}
      <div className="flex items-center gap-3 bg-[#080a24]/80 backdrop-blur-xl border border-amber-400/20 px-4 py-2.5 rounded-3xl shadow-2xl pointer-events-auto">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <span className="text-xl">♛</span>
        </div>
        <div>
          <h1 className="font-serif text-base md:text-lg font-bold text-amber-100 leading-tight tracking-wide">
            RoyalChess 3D
          </h1>
          <p className="text-xs text-amber-300/70 font-medium">
            {mode === 'bot'
              ? `Đấu với máy · ${difficultyNames[difficulty]}`
              : 'Hai người chơi'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* New Game */}
        <button
          onClick={() => setIsStartModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-semibold text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all duration-300 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">Ván mới</span>
        </button>

        {/* Toggle Sound */}
        <button
          onClick={() => setSoundEnabled(!sound.soundEnabled)}
          className="w-10 h-10 rounded-2xl bg-[#080a24]/80 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-slate-200 flex items-center justify-center transition-all duration-300 cursor-pointer"
          title={sound.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
        >
          {sound.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
        </button>

        {/* Camera Views */}
        <button
          onClick={cycleCamera}
          className="w-10 h-10 rounded-2xl bg-[#080a24]/80 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-slate-200 flex items-center justify-center transition-all duration-300 cursor-pointer"
          title={`Góc nhìn camera: ${cameraView}`}
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* PGN Modal */}
        <button
          onClick={() => setIsPgnModalOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#080a24]/80 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-slate-200 flex items-center justify-center transition-all duration-300 cursor-pointer"
          title="Nhập/Xuất ván cờ PGN"
        >
          <FileText className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-10 h-10 rounded-2xl bg-[#080a24]/80 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-slate-200 flex items-center justify-center transition-all duration-300 cursor-pointer"
          title="Cài đặt trò chơi"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 rounded-2xl bg-[#080a24]/80 backdrop-blur-xl border border-white/10 hover:border-amber-400/40 text-slate-200 flex items-center justify-center transition-all duration-300 cursor-pointer"
          title="Toàn màn hình"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};

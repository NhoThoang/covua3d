import React from 'react';
import { X, Volume2, Music, Sparkles, Eye, Monitor } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export const SettingsDrawer: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    sound,
    graphics,
    setSoundVolume,
    setMusicVolume,
    setGraphicsQuality,
    setLuxuryLighting,
    setAnimations,
    setLegalHints,
  } = useSettingsStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#080a24]/95 border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl text-slate-100 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
            <h2 className="font-serif text-2xl font-bold text-amber-100">Cài đặt trò chơi</h2>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sound Controls */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4">
              Âm thanh & Nhạc nền
            </h3>

            {/* Music Volume */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-2 text-slate-300">
                  <Music className="w-4 h-4 text-amber-300" />
                  <span>Nhạc nền giao hưởng</span>
                </span>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {Math.round(sound.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sound.musicVolume * 100}
                onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* SFX Volume */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="flex items-center gap-2 text-slate-300">
                  <Volume2 className="w-4 h-4 text-amber-300" />
                  <span>Hiệu ứng âm thanh</span>
                </span>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {Math.round(sound.soundVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sound.soundVolume * 100}
                onChange={(e) => setSoundVolume(Number(e.target.value) / 100)}
                className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </section>

          {/* Graphics Settings */}
          <section className="mb-6">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4">
              Đồ họa & Hiệu ứng 3D
            </h3>

            {/* Quality Preset */}
            <div className="mb-4">
              <label className="block text-sm text-slate-300 mb-2">Chất lượng hình ảnh</label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => setGraphicsQuality(q)}
                    className={`py-2 rounded-2xl border text-xs font-semibold capitalize transition-all cursor-pointer ${
                      graphics.quality === q
                        ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {q === 'high' ? 'Cao nhất' : q === 'medium' ? 'Cân bằng' : 'Nhẹ'}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle rows */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Ánh sáng thiên thể & lấp lánh</span>
                </span>
                <input
                  type="checkbox"
                  checked={graphics.luxuryLighting}
                  onChange={(e) => setLuxuryLighting(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <Monitor className="w-4 h-4 text-amber-300" />
                  <span>Hoạt ảnh di chuyển quân cờ</span>
                </span>
                <input
                  type="checkbox"
                  checked={graphics.animations}
                  onChange={(e) => setAnimations(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer">
                <span className="flex items-center gap-2 text-sm text-slate-200">
                  <Eye className="w-4 h-4 text-amber-300" />
                  <span>Gợi ý các nước đi hợp lệ</span>
                </span>
                <input
                  type="checkbox"
                  checked={graphics.legalHints}
                  onChange={(e) => setLegalHints(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 text-center text-xs text-slate-500">
          RoyalChess 3D · Stockfish 18 WebAssembly Engine
        </div>
      </div>
    </div>
  );
};

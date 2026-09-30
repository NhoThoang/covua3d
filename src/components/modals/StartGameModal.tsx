import React, { useState } from 'react';
import { X, Bot, Users, Clock, ShieldCheck } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { BotDifficulty, CLOCK_PRESETS, GameMode, PieceColor } from '../../types/chess';

export const StartGameModal: React.FC = () => {
  const { isStartModalOpen, setIsStartModalOpen } = useSettingsStore();
  const { startNewGame, mode: currentMode, difficulty: currentDiff, playerColor: currentSide } = useGameStore();

  const [mode, setMode] = useState<GameMode>(currentMode);
  const [difficulty, setDifficulty] = useState<BotDifficulty>(currentDiff);
  const [clockIdx, setClockIdx] = useState<number>(2); // 5 minutes default
  const [side, setSide] = useState<PieceColor>(currentSide);

  if (!isStartModalOpen) return null;

  const handleStart = () => {
    startNewGame({
      mode,
      difficulty,
      playerColor: side,
      clockPreset: CLOCK_PRESETS[clockIdx],
    });
    setIsStartModalOpen(false);
  };

  const difficultyLevels: { level: BotDifficulty; name: string; desc: string }[] = [
    { level: 1, name: 'Dễ', desc: 'Thử nghiệm & Học chơi' },
    { level: 2, name: 'Vừa', desc: 'Người chơi nghiệp dư' },
    { level: 3, name: 'Khó', desc: 'Kỳ thủ có kinh nghiệm' },
    { level: 4, name: 'Tinh tú', desc: 'Stockfish 18 đỉnh cao' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#080a24]/95 border border-amber-400/30 rounded-3xl p-6 shadow-2xl shadow-amber-500/10 text-slate-100 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setIsStartModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">
            Khởi tạo ván cờ hoàng gia
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-amber-100">
            Tùy chỉnh ván mới
          </h2>
        </div>

        {/* Mode Selector */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-400 mb-2">Chế độ chơi</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMode('bot')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-semibold text-sm transition-all cursor-pointer ${
                mode === 'bot'
                  ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/10'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Đấu với máy (AI)</span>
            </button>

            <button
              onClick={() => setMode('pvp')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border font-semibold text-sm transition-all cursor-pointer ${
                mode === 'pvp'
                  ? 'bg-amber-400/20 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/10'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Hai người chơi</span>
            </button>
          </div>
        </div>

        {/* Bot Difficulty (if mode === bot) */}
        {mode === 'bot' && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 mb-2">Độ khó của máy</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {difficultyLevels.map(({ level, name, desc }) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    difficulty === level
                      ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="font-bold text-sm">{name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Side Selection */}
        {mode === 'bot' && (
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 mb-2">Chọn quân của bạn</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSide('w')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border font-semibold text-sm transition-all cursor-pointer ${
                  side === 'w'
                    ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <span className="text-lg">♔</span>
                <span>Bạch Tinh (Trắng)</span>
              </button>

              <button
                onClick={() => setSide('b')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-2xl border font-semibold text-sm transition-all cursor-pointer ${
                  side === 'b'
                    ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <span className="text-lg">♚</span>
                <span>Hắc Nguyệt (Tím)</span>
              </button>
            </div>
          </div>
        )}

        {/* Time Control */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-400 mb-2">Thời gian ván cờ</label>
          <div className="relative">
            <select
              value={clockIdx}
              onChange={(e) => setClockIdx(Number(e.target.value))}
              className="w-full bg-[#0a0c2e] border border-white/10 rounded-2xl py-3 px-4 text-sm font-semibold text-slate-200 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none"
            >
              {CLOCK_PRESETS.map((preset, idx) => (
                <option key={idx} value={idx}>
                  {preset.label}
                </option>
              ))}
            </select>
            <Clock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold text-sm md:text-base shadow-xl shadow-amber-500/20 transition-all duration-300 cursor-pointer"
        >
          Bắt đầu ván cờ →
        </button>
      </div>
    </div>
  );
};

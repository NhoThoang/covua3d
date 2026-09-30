import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Trophy, Frown, Equal } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export const ResultModal: React.FC = () => {
  const { isGameOver, gameResult, mode, playerColor, moveHistory, startNewGame } = useGameStore();
  const { setIsStartModalOpen } = useSettingsStore();

  const isDraw = !gameResult?.winner;
  const playerWon = mode === 'pvp' || gameResult?.winner === playerColor;
  const winnerName = gameResult?.winner === 'w' ? 'Bạch Tinh' : 'Hắc Nguyệt';

  // Confetti on victory
  useEffect(() => {
    if (isGameOver && playerWon && !isDraw) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#f5efdf', '#c8a365', '#b88cff'],
      });
    }
  }, [isGameOver, playerWon, isDraw]);

  if (!isGameOver || !gameResult) return null;

  const reasonLabels: Record<string, string> = {
    checkmate: 'Chiếu hết',
    timeout: 'Hết thời gian',
    stalemate: 'Hết nước đi hợp lệ (Hòa)',
    'insufficient-material': 'Không đủ quân để chiếu hết (Hòa)',
    'threefold-repetition': 'Lặp lại thế cờ ba lần (Hòa)',
    'fifty-move': 'Luật 50 nước không ăn quân (Hòa)',
    resignation: 'Đầu hàng',
    agreement: 'Hai bên đồng ý hòa',
    draw: 'Hòa cờ',
  };

  const reason = reasonLabels[gameResult.reason] || 'Ván cờ kết thúc';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in zoom-in-95 duration-300">
      <div className="relative w-full max-w-md bg-[#080a24]/95 border border-amber-400/40 rounded-3xl p-6 md:p-8 shadow-2xl text-center text-slate-100">
        {/* Crown Seal Icon */}
        <div className="relative mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-xl shadow-amber-500/20 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-[#05061a] flex items-center justify-center">
            {isDraw ? (
              <Equal className="w-10 h-10 text-amber-300" />
            ) : playerWon ? (
              <Trophy className="w-10 h-10 text-amber-400 animate-bounce" />
            ) : (
              <Frown className="w-10 h-10 text-purple-400" />
            )}
          </div>
        </div>

        {/* Outcome Kicker */}
        <p className="text-xs uppercase tracking-widest text-amber-400 font-semibold mb-1">
          {isDraw ? 'Bất phân thắng bại' : playerWon ? 'Chiến thắng vang dội' : 'Ván cờ khép lại'}
        </p>

        {/* Title */}
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-amber-100 mb-2">
          {isDraw ? 'Thế cờ cân bằng' : `${winnerName} đăng quang`}
        </h2>

        {/* Reason */}
        <p className="text-sm font-medium text-slate-300 mb-1">{reason}</p>
        <p className="text-xs text-slate-400 mb-6">
          {isDraw
            ? 'Cả hai bên đã thể hiện bản lĩnh tuyệt vời.'
            : playerWon
            ? 'Một thế trận sắc bén và xứng đáng với vương miện!'
            : 'Mỗi ván cờ đều để lại những bài học quý giá.'}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block">Tổng số nước</span>
            <span className="font-mono text-base font-bold text-amber-200">
              {moveHistory.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Chế độ</span>
            <span className="font-semibold text-slate-200 capitalize">
              {mode === 'bot' ? 'Đấu với máy' : 'Hai người'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => startNewGame()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-white/20 hover:bg-white/5 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tái đấu</span>
          </button>

          <button
            onClick={() => setIsStartModalOpen(true)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <span>Ván mới →</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Flag, Handshake } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { PieceColor, PieceType } from '../../types/chess';

const PIECE_GLYPHS: Record<PieceColor, Record<PieceType, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

function formatClock(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const PlayerPanel: React.FC<{ color: PieceColor }> = ({ color }) => {
  const {
    turn,
    mode,
    playerColor,
    isBotThinking,
    clocks,
    captured,
    clockPreset,
    isGameOver,
    resign,
  } = useGameStore();

  const isCurrentTurn = turn === color && !isGameOver;
  const isBot = mode === 'bot' && color !== playerColor;
  const clockMs = clocks[color];
  const isLowTime = clockPreset.initialMs > 0 && clockMs < 30000;

  // Name and styling
  const name = isBot
    ? 'Stockfish 18 (AI)'
    : mode === 'bot'
    ? 'Người chơi'
    : color === 'w'
    ? 'Bạch Tinh (Trắng)'
    : 'Hắc Nguyệt (Tím)';

  // Captured pieces and material score
  const piecesTaken = captured[color];
  const scoreDiff = color === 'w' ? captured.scoreDiff : -captured.scoreDiff;

  return (
    <div
      className={`p-3 md:p-4 rounded-3xl backdrop-blur-xl border transition-all duration-300 shadow-xl ${
        isCurrentTurn
          ? 'bg-[#0a0c2e]/90 border-amber-400/50 shadow-amber-500/10 ring-1 ring-amber-400/30'
          : 'bg-[#080a24]/70 border-white/10'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Avatar & Player Name */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-serif text-2xl font-bold shadow-md ${
              color === 'w'
                ? 'bg-gradient-to-tr from-slate-200 to-amber-100 text-slate-900 border border-amber-300/40'
                : 'bg-gradient-to-tr from-indigo-950 to-purple-900 text-purple-200 border border-purple-500/40'
            }`}
          >
            {color === 'w' ? '♔' : '♚'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm md:text-base text-slate-100">{name}</span>
              {isCurrentTurn && (
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>

            <p className="text-xs text-slate-400">
              {isBot && isBotThinking
                ? 'Đang tính toán nước đi...'
                : isCurrentTurn
                ? 'Lượt đi của bạn'
                : 'Chờ đối thủ'}
            </p>
          </div>
        </div>

        {/* Digital Countdown Clock */}
        {clockPreset.initialMs > 0 && (
          <div
            className={`px-3 py-1.5 rounded-2xl font-mono text-sm md:text-base font-bold tracking-wider border transition-colors ${
              isLowTime
                ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                : isCurrentTurn
                ? 'bg-amber-400/20 border-amber-400/40 text-amber-200'
                : 'bg-slate-900/60 border-white/10 text-slate-300'
            }`}
          >
            {formatClock(clockMs)}
          </div>
        )}
      </div>

      {/* Captured pieces tally */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
          {piecesTaken.length === 0 ? (
            <span className="text-[11px] text-slate-500">Chưa ăn quân</span>
          ) : (
            piecesTaken.map((p, i) => (
              <span key={i} className="text-base text-amber-200/90 leading-none">
                {PIECE_GLYPHS[color === 'w' ? 'b' : 'w'][p]}
              </span>
            ))
          )}
          {scoreDiff > 0 && (
            <span className="ml-1 text-xs font-semibold text-amber-400">+{scoreDiff}</span>
          )}
        </div>

        {/* Resign action button if human */}
        {!isBot && !isGameOver && (
          <button
            onClick={() => resign(color)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 px-2 py-1 rounded-xl hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Đầu hàng"
          >
            <Flag className="w-3 h-3" />
            <span>Đầu hàng</span>
          </button>
        )}
      </div>
    </div>
  );
};

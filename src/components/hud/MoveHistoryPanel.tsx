import React, { useEffect, useRef } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export const MoveHistoryPanel: React.FC = () => {
  const { moveHistory, fen, chess } = useGameStore();
  const [copied, setCopied] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Group moves into pairs (White & Black)
  const movePairs: { white: string; black?: string; index: number }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      index: Math.floor(i / 2) + 1,
      white: moveHistory[i].san,
      black: moveHistory[i + 1]?.san,
    });
  }

  // Auto-scroll to bottom on move
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [moveHistory.length]);

  const copyPgn = () => {
    navigator.clipboard.writeText(chess.pgn());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#080a24]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-3 md:p-4 shadow-xl flex flex-col w-full max-h-[300px] transition-all">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs md:text-sm text-slate-200">Lịch sử nước đi</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
            {moveHistory.length}
          </span>
        </div>

        <button
          onClick={copyPgn}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-300 px-2 py-1 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          title="Sao chép PGN ván cờ"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="text-[11px]">{copied ? 'Đã sao chép' : 'PGN'}</span>
        </button>
      </div>

      <div ref={listRef} className="overflow-y-auto space-y-1 pr-1 font-mono text-xs flex-1 min-h-[90px]">
        {movePairs.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            Chưa có nước đi nào
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.index}
              className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-white/5 transition-colors text-slate-300"
            >
              <span className="text-slate-500 w-8">{pair.index}.</span>
              <span className="font-semibold text-amber-100 flex-1">{pair.white}</span>
              <span className="font-semibold text-purple-200 flex-1 text-right">
                {pair.black || ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

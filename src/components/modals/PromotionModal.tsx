import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { PieceType } from '../../types/chess';

export const PromotionModal: React.FC = () => {
  const { pendingPromotion, completePromotion, cancelPromotion, turn } = useGameStore();

  if (!pendingPromotion) return null;

  const choices: { type: PieceType; name: string; icon: string }[] = [
    { type: 'q', name: 'Hậu', icon: turn === 'w' ? '♕' : '♛' },
    { type: 'r', name: 'Xe', icon: turn === 'w' ? '♖' : '♜' },
    { type: 'b', name: 'Tượng', icon: turn === 'w' ? '♗' : '♝' },
    { type: 'n', name: 'Mã', icon: turn === 'w' ? '♘' : '♞' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm bg-[#080a24]/95 border border-amber-400/40 rounded-3xl p-6 shadow-2xl text-center text-slate-100">
        <h2 className="font-serif text-2xl font-bold text-amber-200 mb-1">Phong Cấp Quân Tốt</h2>
        <p className="text-xs text-slate-400 mb-6">Chọn quân bạn muốn hóa thân</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          {choices.map(({ type, name, icon }) => (
            <button
              key={type}
              onClick={() => completePromotion(type)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-400 hover:bg-amber-400/10 transition-all cursor-pointer group"
            >
              <span className="text-4xl mb-1 text-amber-200 group-hover:scale-110 transition-transform">
                {icon}
              </span>
              <span className="font-semibold text-sm text-slate-300 group-hover:text-amber-200">
                {name}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={cancelPromotion}
          className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Hủy bỏ nước đi
        </button>
      </div>
    </div>
  );
};

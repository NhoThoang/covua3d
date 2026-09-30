import React, { useState } from 'react';
import { X, FileCode } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';

export const PGNModal: React.FC = () => {
  const { isPgnModalOpen, setIsPgnModalOpen } = useSettingsStore();
  const { loadPgn, chess } = useGameStore();
  const [pgnText, setPgnText] = useState('');
  const [error, setError] = useState('');

  if (!isPgnModalOpen) return null;

  const handleImport = () => {
    if (!pgnText.trim()) return;
    const ok = loadPgn(pgnText.trim());
    if (ok) {
      setError('');
      setIsPgnModalOpen(false);
    } else {
      setError('Định dạng PGN không hợp lệ, vui lòng kiểm tra lại!');
    }
  };

  const handleCurrentPgn = () => {
    setPgnText(chess.pgn());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#080a24]/95 border border-white/20 rounded-3xl p-6 shadow-2xl text-slate-100">
        <button
          onClick={() => setIsPgnModalOpen(false)}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h2 className="font-serif text-2xl font-bold text-amber-100 flex items-center gap-2">
            <FileCode className="w-6 h-6 text-amber-400" />
            <span>Ván cờ định dạng PGN</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dán nội dung PGN để tải lại ván cờ hoặc xem PGN hiện tại.
          </p>
        </div>

        <textarea
          rows={7}
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 ..."
          className="w-full bg-[#05061a] border border-white/10 rounded-2xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-400 resize-none mb-2"
        />

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleCurrentPgn}
            className="text-xs text-amber-300 hover:underline cursor-pointer"
          >
            Lấy PGN ván hiện tại
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPgnModalOpen(false)}
              className="px-4 py-2 rounded-2xl border border-white/10 text-xs font-semibold hover:bg-white/5 cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handleImport}
              className="px-5 py-2 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              Mở ván cờ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { ChessBoard3D } from './features/board-3d/ChessBoard3D';
import { TopNav } from './components/hud/TopNav';
import { PlayerPanel } from './components/hud/PlayerPanel';
import { MoveHistoryPanel } from './components/hud/MoveHistoryPanel';
import { StartGameModal } from './components/modals/StartGameModal';
import { SettingsDrawer } from './components/modals/SettingsDrawer';
import { PromotionModal } from './components/modals/PromotionModal';
import { ResultModal } from './components/modals/ResultModal';
import { PGNModal } from './components/modals/PGNModal';
import { useGameStore } from './store/useGameStore';
import { soundService } from './services/soundService';

export const App: React.FC = () => {
  const { isStarted, startNewGame, tickClocks, playerColor, mode } = useGameStore();

  // Initialize first game automatically
  useEffect(() => {
    if (!isStarted) {
      startNewGame();
    }
  }, [isStarted]);

  // Digital Clocks Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      tickClocks(100);
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const opponentColor = playerColor === 'w' ? 'b' : 'w';

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#05061a] select-none">
      {/* 3D WebGL Canvas Layer */}
      <div className="absolute inset-0 z-0">
        <ChessBoard3D />
      </div>

      {/* Top Header Navigation */}
      <TopNav />

      {/* Opponent Player HUD (Top-Left on Desktop) */}
      <div className="absolute top-18 md:top-20 left-3 md:left-4 z-30 w-72 md:w-80 pointer-events-auto">
        <PlayerPanel color={opponentColor} />
      </div>

      {/* Your Player HUD (Bottom-Left on Desktop) */}
      <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 z-30 w-72 md:w-80 pointer-events-auto">
        <PlayerPanel color={playerColor} />
      </div>

      {/* Move History Panel (Bottom-Right / Side on Desktop) */}
      <div className="hidden lg:block absolute bottom-4 right-4 z-30 w-72 pointer-events-auto">
        <MoveHistoryPanel />
      </div>

      {/* Modals & Dialogs */}
      <StartGameModal />
      <SettingsDrawer />
      <PromotionModal />
      <ResultModal />
      <PGNModal />
    </div>
  );
};

export default App;

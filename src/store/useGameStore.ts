import { create } from 'zustand';
import { Chess, Square } from 'chess.js';
import {
  GameMode,
  BotDifficulty,
  PieceColor,
  PieceType,
  ClockPreset,
  CLOCK_PRESETS,
  MoveRecord,
  GameResult,
  CapturedPieces,
} from '../types/chess';
import { soundService } from '../services/soundService';
import { stockfishService } from '../services/stockfishService';

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

interface GameOptions {
  mode: GameMode;
  difficulty: BotDifficulty;
  playerColor: PieceColor;
  clockPreset: ClockPreset;
}

interface GameState {
  chess: Chess;
  fen: string;
  turn: PieceColor;
  mode: GameMode;
  difficulty: BotDifficulty;
  playerColor: PieceColor;
  isStarted: boolean;
  isGameOver: boolean;
  isBotThinking: boolean;
  gameResult: GameResult | null;
  moveHistory: MoveRecord[];
  captured: CapturedPieces;
  clocks: { w: number; b: number };
  clockPreset: ClockPreset;
  selectedSquare: string | null;
  legalMoves: string[];
  lastMove: { from: string; to: string } | null;
  inCheck: boolean;
  pendingPromotion: { from: string; to: string } | null;

  // Actions
  startNewGame: (options?: Partial<GameOptions>) => void;
  selectSquare: (sq: string | null) => void;
  requestMove: (from: string, to: string, promotion?: PieceType) => boolean;
  completePromotion: (pieceType: PieceType) => void;
  cancelPromotion: () => void;
  triggerBotMove: () => Promise<void>;
  tickClocks: (deltaMs: number) => void;
  resign: (color?: PieceColor) => void;
  loadPgn: (pgn: string) => boolean;
}

function calculateCaptured(chess: Chess): CapturedPieces {
  const currentCounts: Record<PieceColor, Record<PieceType, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };

  const initialCounts: Record<PieceType, number> = {
    p: 8,
    n: 2,
    b: 2,
    r: 2,
    q: 1,
    k: 1,
  };

  chess.board().forEach((row) => {
    row.forEach((cell) => {
      if (cell) {
        currentCounts[cell.color][cell.type]++;
      }
    });
  });

  const capturedW: PieceType[] = []; // Black pieces taken by White
  const capturedB: PieceType[] = []; // White pieces taken by Black

  let whiteMaterial = 0;
  let blackMaterial = 0;

  (['p', 'n', 'b', 'r', 'q'] as PieceType[]).forEach((type) => {
    const missingWhite = Math.max(0, initialCounts[type] - currentCounts.w[type]);
    const missingBlack = Math.max(0, initialCounts[type] - currentCounts.b[type]);

    for (let i = 0; i < missingBlack; i++) capturedW.push(type);
    for (let i = 0; i < missingWhite; i++) capturedB.push(type);

    whiteMaterial += currentCounts.w[type] * PIECE_VALUES[type];
    blackMaterial += currentCounts.b[type] * PIECE_VALUES[type];
  });

  return {
    w: capturedW,
    b: capturedB,
    scoreDiff: whiteMaterial - blackMaterial,
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const initialChess = new Chess();

  return {
    chess: initialChess,
    fen: initialChess.fen(),
    turn: 'w',
    mode: 'bot',
    difficulty: 2,
    playerColor: 'w',
    isStarted: false,
    isGameOver: false,
    isBotThinking: false,
    gameResult: null,
    moveHistory: [],
    captured: { w: [], b: [], scoreDiff: 0 },
    clocks: { w: 300000, b: 300000 },
    clockPreset: CLOCK_PRESETS[2], // 5 mins
    selectedSquare: null,
    legalMoves: [],
    lastMove: null,
    inCheck: false,
    pendingPromotion: null,

    startNewGame: (options = {}) => {
      const mode = options.mode ?? get().mode;
      const difficulty = options.difficulty ?? get().difficulty;
      const playerColor = options.playerColor ?? get().playerColor;
      const clockPreset = options.clockPreset ?? get().clockPreset;

      const newChess = new Chess();
      const initialClock = clockPreset.initialMs;

      set({
        chess: newChess,
        fen: newChess.fen(),
        turn: 'w',
        mode,
        difficulty,
        playerColor,
        clockPreset,
        clocks: { w: initialClock, b: initialClock },
        isStarted: true,
        isGameOver: false,
        isBotThinking: false,
        gameResult: null,
        moveHistory: [],
        captured: { w: [], b: [], scoreDiff: 0 },
        selectedSquare: null,
        legalMoves: [],
        lastMove: null,
        inCheck: false,
        pendingPromotion: null,
      });

      soundService.setMusicMode('game');
      soundService.play('entrance');

      // If Bot plays white, trigger bot immediately
      if (mode === 'bot' && playerColor === 'b') {
        setTimeout(() => get().triggerBotMove(), 600);
      }
    },

    selectSquare: (sq: string | null) => {
      const { chess, turn, mode, playerColor, isBotThinking, isGameOver } = get();
      if (isGameOver || isBotThinking) return;

      // In bot mode, only human color can click
      if (mode === 'bot' && turn !== playerColor) return;

      if (!sq) {
        set({ selectedSquare: null, legalMoves: [] });
        return;
      }

      const piece = chess.get(sq as Square);

      // If clicking own piece, select it and find legal destinations
      if (piece && piece.color === turn) {
        const moves = chess.moves({ square: sq as Square, verbose: true });
        const destinations = moves.map((m) => m.to);
        soundService.play('select');
        set({ selectedSquare: sq, legalMoves: destinations });
        return;
      }

      // If already have selected square, check if clicking a valid move
      const { selectedSquare, legalMoves } = get();
      if (selectedSquare && legalMoves.includes(sq)) {
        get().requestMove(selectedSquare, sq);
      } else {
        set({ selectedSquare: null, legalMoves: [] });
      }
    },

    requestMove: (from: string, to: string, promotion?: PieceType) => {
      const { chess, pendingPromotion } = get();
      if (pendingPromotion) return false;

      const piece = chess.get(from as Square);
      if (!piece) return false;

      // Check if this is a pawn promotion move
      const isPromotion =
        piece.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

      if (isPromotion && !promotion) {
        // Need user to pick promotion piece
        set({ pendingPromotion: { from, to } });
        return true;
      }

      try {
        const move = chess.move({
          from,
          to,
          promotion: promotion || 'q',
        });

        if (!move) return false;

        // Apply clock increment if any
        const { clocks, turn, clockPreset, mode, playerColor } = get();
        const nextClocks = { ...clocks };
        if (clockPreset.initialMs > 0 && clockPreset.incrementMs > 0) {
          nextClocks[turn] += clockPreset.incrementMs;
        }

        const isCheck = chess.inCheck();
        const isCheckmate = chess.isCheckmate();
        const isDraw = chess.isDraw();
        const isStalemate = chess.isStalemate();
        const isInsufficient = chess.isInsufficientMaterial();
        const isThreefold = chess.isThreefoldRepetition();

        let gameResult: GameResult | null = null;
        if (isCheckmate) {
          gameResult = { winner: turn, reason: 'checkmate' };
        } else if (isStalemate) {
          gameResult = { winner: null, reason: 'stalemate' };
        } else if (isInsufficient) {
          gameResult = { winner: null, reason: 'insufficient-material' };
        } else if (isThreefold) {
          gameResult = { winner: null, reason: 'threefold-repetition' };
        } else if (isDraw) {
          gameResult = { winner: null, reason: 'draw' };
        }

        // Play SFX
        if (gameResult) {
          if (gameResult.winner) {
            const playerWon = mode === 'pvp' || gameResult.winner === playerColor;
            soundService.play(playerWon ? 'victory' : 'defeat');
          } else {
            soundService.play('draw');
          }
        } else if (isCheck) {
          soundService.play('check');
        } else if (move.captured) {
          soundService.play('capture');
        } else {
          soundService.play('move');
        }

        const newHistoryItem: MoveRecord = {
          san: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece,
          color: move.color,
          captured: move.captured,
          promotion: move.promotion,
          fen: chess.fen(),
        };

        const updatedHistory = [...get().moveHistory, newHistoryItem];
        const nextTurn = chess.turn();

        set({
          fen: chess.fen(),
          turn: nextTurn,
          clocks: nextClocks,
          moveHistory: updatedHistory,
          captured: calculateCaptured(chess),
          selectedSquare: null,
          legalMoves: [],
          lastMove: { from, to },
          inCheck: isCheck,
          isGameOver: !!gameResult,
          gameResult,
          pendingPromotion: null,
        });

        // If next turn is bot, trigger bot
        if (!gameResult && mode === 'bot' && nextTurn !== playerColor) {
          get().triggerBotMove();
        }

        return true;
      } catch (e) {
        console.warn('Invalid move:', e);
        return false;
      }
    },

    completePromotion: (pieceType: PieceType) => {
      const { pendingPromotion } = get();
      if (!pendingPromotion) return;
      get().requestMove(pendingPromotion.from, pendingPromotion.to, pieceType);
    },

    cancelPromotion: () => {
      set({ pendingPromotion: null, selectedSquare: null, legalMoves: [] });
    },

    triggerBotMove: async () => {
      const { fen, difficulty, isGameOver } = get();
      if (isGameOver) return;

      set({ isBotThinking: true });

      try {
        const result = await stockfishService.getBestMove(fen, difficulty);
        if (result && !get().isGameOver) {
          get().requestMove(result.from, result.to, (result.promotion as PieceType) || undefined);
        }
      } catch (err) {
        console.error('Bot move failed:', err);
      } finally {
        set({ isBotThinking: false });
      }
    },

    tickClocks: (deltaMs: number) => {
      const { isStarted, isGameOver, turn, clocks, clockPreset, mode, playerColor } = get();
      if (!isStarted || isGameOver || clockPreset.initialMs === 0) return;

      const remaining = clocks[turn] - deltaMs;
      if (remaining <= 0) {
        const winner = turn === 'w' ? 'b' : 'w';
        const playerWon = mode === 'pvp' || winner === playerColor;
        soundService.play(playerWon ? 'victory' : 'defeat');

        set({
          clocks: { ...clocks, [turn]: 0 },
          isGameOver: true,
          gameResult: { winner, reason: 'timeout' },
        });
      } else {
        set({ clocks: { ...clocks, [turn]: remaining } });
      }
    },

    resign: (color) => {
      const { turn, mode, playerColor, isGameOver } = get();
      if (isGameOver) return;
      const resigningColor = color || (mode === 'bot' ? playerColor : turn);
      const winner = resigningColor === 'w' ? 'b' : 'w';
      soundService.play(resigningColor === playerColor && mode === 'bot' ? 'defeat' : 'victory');

      set({
        isGameOver: true,
        gameResult: { winner, reason: 'resignation' },
      });
    },

    loadPgn: (pgn: string) => {
      try {
        const newChess = new Chess();
        newChess.loadPgn(pgn);
        set({
          chess: newChess,
          fen: newChess.fen(),
          turn: newChess.turn(),
          isStarted: true,
          isGameOver: newChess.isGameOver(),
          moveHistory: [],
          captured: calculateCaptured(newChess),
          selectedSquare: null,
          legalMoves: [],
          lastMove: null,
          inCheck: newChess.inCheck(),
        });
        soundService.play('entrance');
        return true;
      } catch {
        return false;
      }
    },
  };
});

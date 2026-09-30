export type PieceColor = 'w' | 'b';
export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';

export type GameMode = 'bot' | 'pvp';
export type BotDifficulty = 1 | 2 | 3 | 4; // 1: Easy, 2: Medium, 3: Hard, 4: Celestial

export interface ClockPreset {
  label: string;
  initialMs: number;
  incrementMs: number;
}

export const CLOCK_PRESETS: ClockPreset[] = [
  { label: 'Không giới hạn', initialMs: 0, incrementMs: 0 },
  { label: '3 phút + 2 giây', initialMs: 180000, incrementMs: 2000 },
  { label: '5 phút', initialMs: 300000, incrementMs: 0 },
  { label: '10 phút + 5 giây', initialMs: 600000, incrementMs: 5000 },
  { label: '15 phút + 10 giây', initialMs: 900000, incrementMs: 10000 },
];

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  fen: string;
  timeRemaining?: number;
}

export type GameResultReason =
  | 'checkmate'
  | 'timeout'
  | 'stalemate'
  | 'insufficient-material'
  | 'threefold-repetition'
  | 'fifty-move'
  | 'resignation'
  | 'agreement'
  | 'draw';

export interface GameResult {
  winner: PieceColor | null; // null = draw
  reason: GameResultReason;
  label?: string;
}

export interface CapturedPieces {
  w: PieceType[]; // pieces captured by white (black pieces)
  b: PieceType[]; // pieces captured by black (white pieces)
  scoreDiff: number; // positive = white ahead, negative = black ahead
}

export interface SoundSettings {
  soundEnabled: boolean;
  soundVolume: number;
  musicEnabled: boolean;
  musicVolume: number;
}

export interface GraphicSettings {
  quality: 'high' | 'medium' | 'low' | 'auto';
  shading: 'smooth' | 'flat';
  luxuryLighting: boolean;
  animations: boolean;
  legalHints: boolean;
  frameLimit: number;
}

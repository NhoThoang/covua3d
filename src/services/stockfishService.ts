import { Chess } from 'chess.js';
import { BotDifficulty } from '../types/chess';

export interface BestMoveResult {
  from: string;
  to: string;
  promotion?: string;
  scoreCp?: number;
  depth?: number;
  nodes?: number;
}

const DIFFICULTY_CONFIG: Record<BotDifficulty, { skillLevel: number; moveTimeMs: number }> = {
  1: { skillLevel: 0, moveTimeMs: 150 },
  2: { skillLevel: 5, moveTimeMs: 400 },
  3: { skillLevel: 10, moveTimeMs: 800 },
  4: { skillLevel: 18, moveTimeMs: 1600 },
};

export class StockfishService {
  private worker: Worker | null = null;
  private isReady = false;
  private readyPromise: Promise<void> | null = null;
  private pendingCallback: ((result: BestMoveResult | null) => void) | null = null;
  private lastScoreCp = 0;
  private lastDepth = 0;

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    try {
      this.worker = new Worker('/vendor/stockfish/stockfish-18-lite-single.js');

      this.readyPromise = new Promise((resolve) => {
        const onMessage = (event: MessageEvent) => {
          const line = String(event.data || '').trim();
          if (line === 'readyok' || line === 'uciok') {
            this.isReady = true;
            resolve();
          }
          this.handleLine(line);
        };

        this.worker!.onmessage = onMessage;
        this.worker!.onerror = (err) => {
          console.warn('Stockfish Worker failed, attempting fallback...', err);
          this.initFallbackWorker();
        };

        this.worker!.postMessage('uci');
        this.worker!.postMessage('isready');
      });
    } catch (e) {
      console.warn('Could not spawn Stockfish Worker, falling back...', e);
      this.initFallbackWorker();
    }
  }

  private initFallbackWorker() {
    try {
      this.worker?.terminate();
      this.worker = new Worker('/engine-worker.js');
      this.worker.onmessage = (event) => {
        const line = String(event.data || '').trim();
        this.handleLine(line);
      };
      this.isReady = true;
    } catch (err) {
      console.error('Failed to load fallback worker:', err);
    }
  }

  private handleLine(line: string) {
    if (!line) return;

    // Parse info evaluation score
    if (line.startsWith('info')) {
      const depthMatch = line.match(/\bdepth\s+(\d+)/);
      if (depthMatch) this.lastDepth = parseInt(depthMatch[1], 10);

      const cpMatch = line.match(/\bscore\s+cp\s+(-?\d+)/);
      if (cpMatch) this.lastScoreCp = parseInt(cpMatch[1], 10);
    }

    // Parse bestmove
    if (line.startsWith('bestmove')) {
      const parts = line.split(/\s+/);
      const moveUci = parts[1];

      if (moveUci && moveUci !== '(none)' && moveUci !== '0000') {
        const from = moveUci.substring(0, 2);
        const to = moveUci.substring(2, 4);
        const promotion = moveUci.length > 4 ? moveUci.substring(4, 5) : undefined;

        if (this.pendingCallback) {
          const cb = this.pendingCallback;
          this.pendingCallback = null;
          cb({
            from,
            to,
            promotion,
            scoreCp: this.lastScoreCp,
            depth: this.lastDepth,
          });
        }
      } else {
        if (this.pendingCallback) {
          const cb = this.pendingCallback;
          this.pendingCallback = null;
          cb(null);
        }
      }
    }
  }

  public async getBestMove(fen: string, difficulty: BotDifficulty = 2): Promise<BestMoveResult | null> {
    if (this.readyPromise) {
      await Promise.race([
        this.readyPromise,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    }

    const config = DIFFICULTY_CONFIG[difficulty] || DIFFICULTY_CONFIG[2];

    return new Promise((resolve) => {
      this.pendingCallback = resolve;
      this.lastScoreCp = 0;
      this.lastDepth = 0;

      if (!this.worker) {
        resolve(this.getFallbackLocalMove(fen));
        return;
      }

      this.worker.postMessage(`setoption name Skill Level value ${config.skillLevel}`);
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go movetime ${config.moveTimeMs}`);

      // Timeout safety guard
      setTimeout(() => {
        if (this.pendingCallback === resolve) {
          this.pendingCallback = null;
          resolve(this.getFallbackLocalMove(fen));
        }
      }, config.moveTimeMs + 3500);
    });
  }

  private getFallbackLocalMove(fen: string): BestMoveResult | null {
    try {
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      if (!moves.length) return null;
      // Simple random pick or capture preference
      const captures = moves.filter((m) => m.captured);
      const chosen = captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : moves[Math.floor(Math.random() * moves.length)];
      return {
        from: chosen.from,
        to: chosen.to,
        promotion: chosen.promotion,
        depth: 1,
      };
    } catch {
      return null;
    }
  }

  public stop() {
    this.worker?.postMessage('stop');
  }

  public terminate() {
    this.worker?.terminate();
    this.worker = null;
  }
}

export const stockfishService = new StockfishService();

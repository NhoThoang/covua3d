import { Chess } from './res-8a40776e6f1b0ec7/vendor/chess.js';

const MATE = 100000;
const INF = 1000000;
const VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };

// The limits are deliberately modest: this is a local JavaScript engine, not
// Stockfish.  Iterative deepening means it can still return a complete result
// when the clock expires in the middle of a deeper iteration.
export const LEVELS = Object.freeze({
  1: { maxDepth: 2, timeMs: 120, nodeLimit: 12_000 },
  2: { maxDepth: 3, timeMs: 350, nodeLimit: 70_000 },
  3: { maxDepth: 4, timeMs: 850, nodeLimit: 300_000 },
  4: { maxDepth: 6, timeMs: 1_800, nodeLimit: 1_000_000 },
});

class SearchStopped extends Error {}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const moveInput = (move) => ({ from: move.from, to: move.to, ...(move.promotion ? { promotion: move.promotion } : {}) });
const moveKey = (move) => move ? `${move.from}${move.to}${move.promotion || ''}` : '';

function squareMetrics(square, color) {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]) - 1;
  const forwardRank = color === 'w' ? rank : 7 - rank;
  const center = 7 - (Math.abs(file - 3.5) + Math.abs(rank - 3.5));
  return { file, rank, forwardRank, center };
}

function pieceSquare(piece, square, endgame) {
  const { file, rank, forwardRank, center } = squareMetrics(square, piece.color);
  switch (piece.type) {
    case 'p': {
      const central = (file === 3 || file === 4) ? 8 : (file === 2 || file === 5 ? 3 : 0);
      return forwardRank * 7 + central - (forwardRank === 1 ? 0 : Math.abs(file - 3.5));
    }
    case 'n': return center * 7 - ((file === 0 || file === 7) ? 12 : 0);
    case 'b': return center * 4 + (forwardRank > 0 ? 4 : 0);
    case 'r': return forwardRank === 6 ? 18 : (forwardRank > 0 ? 3 : 0);
    case 'q': return center * 2;
    case 'k': {
      if (endgame) return center * 5;
      const homeSafety = forwardRank <= 1 && (file <= 2 || file >= 5) ? 22 : 0;
      return homeSafety - center * 3 - forwardRank * 5;
    }
    default: return 0;
  }
}

function rayMobility(board, row, col, directions) {
  let count = 0;
  for (const [dr, dc] of directions) {
    let r = row + dr;
    let c = col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      count++;
      if (board[r][c]) break;
      r += dr;
      c += dc;
    }
  }
  return count;
}

function staticMobility(board, row, col, piece) {
  if (piece.type === 'n') {
    const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
    return jumps.reduce((n, [dr, dc]) => n + (row + dr >= 0 && row + dr < 8 && col + dc >= 0 && col + dc < 8 ? 1 : 0), 0) * 2;
  }
  const diagonal = [[-1,-1],[-1,1],[1,-1],[1,1]];
  const straight = [[-1,0],[1,0],[0,-1],[0,1]];
  if (piece.type === 'b') return rayMobility(board, row, col, diagonal) * 2;
  if (piece.type === 'r') return rayMobility(board, row, col, straight);
  if (piece.type === 'q') return rayMobility(board, row, col, diagonal.concat(straight));
  return 0;
}

/** Evaluate a position in centipawns from White's point of view. */
export function evaluatePosition(chess) {
  const board = chess.board();
  let nonPawnMaterial = 0;
  for (const row of board) for (const piece of row) {
    if (piece && piece.type !== 'p' && piece.type !== 'k') nonPawnMaterial += VALUES[piece.type];
  }
  const endgame = nonPawnMaterial <= 1500;
  let score = 0;
  let whiteBishops = 0;
  let blackBishops = 0;
  const pawnFiles = { w: Array(8).fill(0), b: Array(8).fill(0) };

  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) {
    const piece = board[row][col];
    if (!piece) continue;
    const sign = piece.color === 'w' ? 1 : -1;
    const square = `${String.fromCharCode(97 + col)}${8 - row}`;
    score += sign * (VALUES[piece.type] + pieceSquare(piece, square, endgame) + staticMobility(board, row, col, piece));
    if (piece.type === 'b') piece.color === 'w' ? whiteBishops++ : blackBishops++;
    if (piece.type === 'p') pawnFiles[piece.color][col]++;
  }
  if (whiteBishops >= 2) score += 24;
  if (blackBishops >= 2) score -= 24;
  for (const color of ['w', 'b']) {
    const sign = color === 'w' ? 1 : -1;
    for (let file = 0; file < 8; file++) {
      const count = pawnFiles[color][file];
      if (count > 1) score -= sign * (count - 1) * 13;
      if (count && !pawnFiles[color][file - 1] && !pawnFiles[color][file + 1]) score -= sign * 10;
    }
  }
  return Math.round(score);
}

function terminalScore(chess, ply) {
  if (chess.isCheckmate()) return -MATE + ply;
  if (chess.isDraw() || chess.isStalemate()) return 0;
  return null;
}

function orderScore(move, preferredKey, killers, ply, history) {
  const key = moveKey(move);
  let score = key === preferredKey ? 2_000_000 : 0;
  if (move.captured) score += 100_000 + VALUES[move.captured] * 16 - VALUES[move.piece];
  if (move.promotion) score += 80_000 + VALUES[move.promotion];
  if (move.san?.includes('#')) score += 500_000;
  else if (move.san?.includes('+')) score += 12_000;
  if (killers[ply]?.includes(key)) score += 9_000;
  score += history.get(key) || 0;
  return score;
}

function orderedMoves(chess, preferredKey, state, ply, tacticalOnly = false) {
  let moves = chess.moves({ verbose: true });
  if (tacticalOnly && !chess.inCheck()) moves = moves.filter((move) => move.captured || move.promotion);
  return moves.sort((a, b) => orderScore(b, preferredKey, state.killers, ply, state.history) - orderScore(a, preferredKey, state.killers, ply, state.history));
}

function checkStop(state) {
  state.nodes++;
  if (state.nodes >= state.nodeLimit || (state.nodes & 31) === 0 && performance.now() >= state.deadline) throw new SearchStopped();
}

function quiescence(chess, alpha, beta, ply, state, qDepth = 0) {
  checkStop(state);
  const terminal = terminalScore(chess, ply);
  if (terminal !== null) return { score: terminal, pv: [] };
  const checked = chess.inCheck();
  const standPat = (chess.turn() === 'w' ? 1 : -1) * evaluatePosition(chess);
  if (!checked) {
    if (standPat >= beta) return { score: standPat, pv: [] };
    if (standPat > alpha) alpha = standPat;
    if (qDepth >= 5) return { score: standPat, pv: [] };
  } else if (qDepth >= 7) {
    return { score: standPat, pv: [] };
  }

  let best = checked ? -INF : standPat;
  let bestPv = [];
  for (const move of orderedMoves(chess, '', state, ply, true)) {
    // A capture that cannot possibly raise alpha does not deserve a full
    // continuation. Checks are retained because their tactical value is not
    // represented by the captured material alone.
    if (!checked && move.captured && !move.promotion && !move.san?.includes('+') &&
        standPat + VALUES[move.captured] + 140 < alpha) continue;
    chess.move(moveInput(move));
    const child = quiescence(chess, -beta, -alpha, ply + 1, state, qDepth + 1);
    chess.undo();
    const score = -child.score;
    if (score > best) {
      best = score;
      bestPv = [move.san, ...child.pv];
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return { score: best, pv: bestPv };
}

function alphaBeta(chess, depth, alpha, beta, ply, state) {
  checkStop(state);
  const terminal = terminalScore(chess, ply);
  if (terminal !== null) return { score: terminal, pv: [] };
  if (depth <= 0) return quiescence(chess, alpha, beta, ply, state);

  const fen = chess.fen();
  const cached = state.tt.get(fen);
  const originalAlpha = alpha;
  if (cached && cached.depth >= depth) {
    if (cached.flag === 'exact') return { score: cached.score, pv: cached.pv.slice() };
    if (cached.flag === 'lower') alpha = Math.max(alpha, cached.score);
    else if (cached.flag === 'upper') beta = Math.min(beta, cached.score);
    if (alpha >= beta) return { score: cached.score, pv: cached.pv.slice() };
  }

  let best = -INF;
  let bestPv = [];
  let bestMoveKey = '';
  const moves = orderedMoves(chess, cached?.moveKey || '', state, ply);
  for (const move of moves) {
    chess.move(moveInput(move));
    const child = alphaBeta(chess, depth - 1, -beta, -alpha, ply + 1, state);
    chess.undo();
    const score = -child.score;
    if (score > best) {
      best = score;
      bestMoveKey = moveKey(move);
      bestPv = [move.san, ...child.pv];
    }
    if (score > alpha) alpha = score;
    if (alpha >= beta) {
      if (!move.captured) {
        const killers = state.killers[ply] ||= [];
        const key = moveKey(move);
        if (!killers.includes(key)) killers.unshift(key);
        killers.length = Math.min(killers.length, 2);
        state.history.set(key, (state.history.get(key) || 0) + depth * depth);
      }
      break;
    }
  }

  const flag = best <= originalAlpha ? 'upper' : best >= beta ? 'lower' : 'exact';
  state.tt.set(fen, { depth, score: best, flag, moveKey: bestMoveKey, pv: bestPv.slice(0, depth + 3) });
  return { score: best, pv: bestPv };
}

function searchRoot(chess, depth, state, preferredKey) {
  let bestScore = -INF;
  let bestMove = null;
  let bestPv = [];
  let alpha = -INF;
  const moves = orderedMoves(chess, preferredKey, state, 0);
  for (const move of moves) {
    checkStop(state);
    chess.move(moveInput(move));
    const child = alphaBeta(chess, depth - 1, -INF, -alpha, 1, state);
    chess.undo();
    const score = -child.score;
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
      bestPv = [move.san, ...child.pv];
    }
    if (score > alpha) alpha = score;
  }
  return { score: bestScore, move: bestMove, pv: bestPv };
}

function cheapFallback(chess, legal) {
  const rootColor = chess.turn();
  const rootSign = rootColor === 'w' ? 1 : -1;
  let bestMove = legal[0];
  let bestScore = -INF;
  for (const move of legal) {
    chess.move(moveInput(move));
    const terminal = terminalScore(chess, 1);
    const score = terminal === null ? rootSign * evaluatePosition(chess) : -terminal;
    chess.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return { move: bestMove, score: bestScore, pv: [bestMove.san], depth: 0 };
}

/**
 * Synchronous search core, intended to run inside engine-worker.js.
 * The returned score is always from White's point of view.
 */
export function searchFen(fen, options = {}) {
  const chess = new Chess(fen);
  const legal = chess.moves({ verbose: true });
  if (!legal.length) {
    const sideScore = terminalScore(chess, 0) ?? 0;
    return { move: null, scoreCp: chess.turn() === 'w' ? sideScore : -sideScore, depth: 0, pv: [], nodes: 0 };
  }

  const level = clamp(Math.round(Number(options.level) || 2), 1, 4);
  const config = LEVELS[level];
  const timeMs = clamp(Number(options.timeMs) || config.timeMs, 25, 10_000);
  const maxDepth = clamp(Number(options.maxDepth) || config.maxDepth, 1, 12);
  const nodeLimit = clamp(Number(options.nodeLimit) || config.nodeLimit, 100, 10_000_000);
  const start = performance.now();
  const state = {
    deadline: start + timeMs,
    nodeLimit,
    nodes: 0,
    tt: new Map(),
    killers: [],
    history: new Map(),
  };
  const rootColor = chess.turn();
  let completed = cheapFallback(chess, legal);
  let preferred = moveKey(completed.move);

  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      const result = searchRoot(chess, depth, state, preferred);
      completed = { ...result, depth };
      preferred = moveKey(result.move);
      if (Math.abs(result.score) >= MATE - 100) break;
    } catch (error) {
      if (!(error instanceof SearchStopped)) throw error;
      break;
    }
  }

  return {
    move: completed.move ? moveInput(completed.move) : null,
    scoreCp: rootColor === 'w' ? completed.score : -completed.score,
    depth: completed.depth,
    pv: completed.pv,
    nodes: state.nodes,
  };
}

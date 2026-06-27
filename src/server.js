import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Chess } from 'chess.js';
import { Server } from 'socket.io';
import { Telegraf, Markup } from 'telegraf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const dataDir = path.join(rootDir, 'data');

fs.mkdirSync(dataDir, { recursive: true });

const BOT_TOKEN = process.env.BOT_TOKEN || '';
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3000}`;
const PORT = Number(process.env.PORT || 3000);
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'chess.json');
const store = loadStore();

function loadStore() {
  if (!fs.existsSync(dbPath)) {
    return { nextUserId: 1, users: [], matches: [] };
  }

  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveStore() {
  fs.writeFileSync(dbPath, JSON.stringify(store, null, 2));
}

function now() {
  return new Date().toISOString();
}

function findUserByTelegramId(telegramId) {
  return store.users.find((user) => user.telegram_id === telegramId);
}

function topUsers() {
  return [...store.users]
    .sort((a, b) => b.rating - a.rating || b.wins - a.wins || a.games - b.games)
    .slice(0, 20)
    .map(({ telegram_id, name, rating, games, wins, losses, draws }) => ({
      telegram_id,
      name,
      rating,
      games,
      wins,
      losses,
      draws
    }));
}

function storeStats() {
  const users = store.users || [];
  const matches = store.matches || [];
  const testUsers = users.filter((user) => /^dev:|^guest:/.test(String(user.telegram_id || '')));
  const finishedMatches = matches.filter((match) => match.finished_at || match.result);

  return {
    users: {
      total: users.length,
      telegram: users.length - testUsers.length,
      test: testUsers.length
    },
    matches: {
      total: matches.length,
      finished: finishedMatches.length,
      unfinished: matches.length - finishedMatches.length,
      activeNow: games.size
    },
    leaderboard: topUsers().slice(0, 10)
  };
}

function createStoredMatch(match) {
  store.matches.push({
    ...match,
    result: null,
    pgn: null,
    created_at: now(),
    finished_at: null
  });
  saveStore();
}

function finishStoredMatch({ id, result, pgn }) {
  const match = store.matches.find((item) => item.id === id);
  if (!match) return;
  match.result = result;
  match.pgn = pgn;
  match.finished_at = now();
  saveStore();
}

function updateStoredRating(user, rating, wins, losses, draws) {
  user.rating = rating;
  user.games += 1;
  user.wins += wins;
  user.losses += losses;
  user.draws += draws;
  user.updated_at = now();
  saveStore();
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: true } });

app.use(express.json());
app.use(express.static(publicDir));

const games = new Map();
const challenges = new Map();
let waitingSocket = null;
let telegramBot = null;

const COMPUTER_ID = -1;
const COMPUTER_NAME = 'Computer';
const BOT_RATING_MIN = 200;
const BOT_RATING_MAX = 3000;
const TIME_CONTROLS = {
  casual: { label: 'Casual', initialMs: null, incrementMs: 0 },
  bullet: { label: '1+0 Bullet', initialMs: 60_000, incrementMs: 0 },
  blitz: { label: '3+2 Blitz', initialMs: 180_000, incrementMs: 2_000 },
  rapid: { label: '10+0 Rapid', initialMs: 600_000, incrementMs: 0 },
  classical: { label: '15+10 Classical', initialMs: 900_000, incrementMs: 10_000 }
};

function chooseOnlineColors(socketA, socketB) {
  const prefA = ['w', 'b', 'random'].includes(socketA.data.colorChoice) ? socketA.data.colorChoice : 'random';
  const prefB = ['w', 'b', 'random'].includes(socketB.data.colorChoice) ? socketB.data.colorChoice : 'random';

  if (prefA === 'w' && prefB !== 'w') return { whiteSocket: socketA, blackSocket: socketB };
  if (prefA === 'b' && prefB !== 'b') return { whiteSocket: socketB, blackSocket: socketA };
  if (prefB === 'w' && prefA !== 'w') return { whiteSocket: socketB, blackSocket: socketA };
  if (prefB === 'b' && prefA !== 'b') return { whiteSocket: socketA, blackSocket: socketB };

  const whiteSocket = Math.random() > 0.5 ? socketA : socketB;
  return { whiteSocket, blackSocket: whiteSocket.id === socketA.id ? socketB : socketA };
}

function chooseChallengePlayers(challenge, opponent) {
  if (challenge.colorChoice === 'w') return { white: challenge.creator, black: opponent };
  if (challenge.colorChoice === 'b') return { white: opponent, black: challenge.creator };
  return Math.random() > 0.5
    ? { white: challenge.creator, black: opponent }
    : { white: opponent, black: challenge.creator };
}

function challengeUrl(id) {
  const separator = PUBLIC_URL.includes('?') ? '&' : '?';
  return `${PUBLIC_URL}${separator}challenge=${encodeURIComponent(id)}`;
}

function knownTelegramUsers(exceptUserId) {
  return store.users
    .filter((user) => user.id !== exceptUserId)
    .filter((user) => /^\d+$/.test(String(user.telegram_id || '')))
    .sort((a, b) => b.updated_at?.localeCompare(a.updated_at || '') || b.rating - a.rating)
    .slice(0, 30)
    .map((user) => ({
      id: user.id,
      name: user.name,
      rating: user.rating,
      games: user.games
    }));
}

function verifyTelegramInitData(initData) {
  if (!BOT_TOKEN || !initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (!hash || hash.length !== expectedHash.length) return null;

  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash))) {
    return null;
  }

  const user = JSON.parse(params.get('user') || '{}');
  return {
    telegram_id: String(user.id),
    name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Player'
  };
}

function getTelegramUserFromInitData(initData) {
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user') || '{}');
    if (!user.id) return null;

    return {
      telegram_id: String(user.id),
      name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || 'Player'
    };
  } catch {
    return null;
  }
}

function getDevUser(req) {
  const devUser = req.query.devUser || req.headers['x-dev-user'];
  if (!devUser) return null;
  return {
    telegram_id: `dev:${String(devUser).slice(0, 40)}`,
    name: String(devUser).slice(0, 32)
  };
}

function getGuestUser(req) {
  const rawId = req.query.guest || req.headers['x-guest-user'] || req.ip || 'local';
  const id = String(rawId).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 40) || 'local';
  return {
    telegram_id: `guest:${id}`,
    name: 'Guest'
  };
}

function ensureUser(identity) {
  const existing = findUserByTelegramId(identity.telegram_id);
  if (existing) {
    existing.name = identity.name;
    existing.updated_at = now();
    saveStore();
    return existing;
  }

  const user = {
    id: store.nextUserId++,
    telegram_id: identity.telegram_id,
    name: identity.name,
    rating: 1200,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    updated_at: now()
  };
  store.users.push(user);
  saveStore();
  return user;
}

function getRequestUser(req) {
  const initData = req.headers.authorization?.replace(/^tma\s+/i, '') || req.query.tgWebAppData;
  const identity = verifyTelegramInitData(initData) || getTelegramUserFromInitData(initData) || getDevUser(req) || getGuestUser(req);
  if (!identity) return null;
  return ensureUser(identity);
}

function socketUser(socket) {
  const initData = socket.handshake.auth?.initData;
  const devUser = socket.handshake.auth?.devUser;
  const identity = verifyTelegramInitData(initData) || getTelegramUserFromInitData(initData) || (devUser ? {
    telegram_id: `dev:${String(devUser).slice(0, 40)}`,
    name: String(devUser).slice(0, 32)
  } : {
    telegram_id: `guest:socket:${socket.id}`,
    name: 'Guest'
  });
  if (!identity) return null;
  return ensureUser(identity);
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function normalizeTimeControl(value) {
  return TIME_CONTROLS[value] ? value : 'casual';
}

function computerUser(rating = 1200) {
  const safeRating = clampNumber(rating, BOT_RATING_MIN, BOT_RATING_MAX, 1200);
  return {
    id: COMPUTER_ID,
    telegram_id: 'computer',
    name: `${COMPUTER_NAME} ${safeRating}`,
    rating: safeRating,
    games: 0,
    wins: 0,
    losses: 0,
    draws: 0
  };
}

function syncClock(game) {
  if (!game.clock || game.status !== 'playing') return;
  const currentTurn = game.chess.turn();
  const elapsed = Date.now() - game.clock.lastTickAt;
  game.clock.remaining[currentTurn] = Math.max(0, game.clock.remaining[currentTurn] - elapsed);
  game.clock.lastTickAt = Date.now();

  if (game.clock.remaining[currentTurn] <= 0) {
    game.status = 'finished';
    game.result = currentTurn === 'w' ? '0-1' : '1-0';
    finishStoredMatch({ id: game.id, result: game.result, pgn: game.chess.pgn() });
    if (game.mode === 'online' && game.white && game.black) {
      updateElo(game.white, game.black, game.result);
    }
  }
}

function applyClockAfterMove(game, movedColor) {
  if (!game.clock || game.status !== 'playing') return;
  const control = TIME_CONTROLS[game.timeControl] || TIME_CONTROLS.casual;
  game.clock.remaining[movedColor] += control.incrementMs;
  game.clock.lastTickAt = Date.now();
}

function publicClock(game) {
  if (!game.clock) return null;
  syncClock(game);
  return {
    w: game.clock.remaining.w,
    b: game.clock.remaining.b,
    running: game.status === 'playing' ? game.chess.turn() : null,
    lastTickAt: game.clock.lastTickAt
  };
}

function serializeGame(game, viewerId) {
  syncClock(game);
  const turn = game.chess.turn();
  const color = game.white.id === viewerId ? 'w' : game.black?.id === viewerId ? 'b' : 'spectator';
  const history = game.chess.history({ verbose: true });
  const lastMove = history.at(-1) || null;
  return {
    id: game.id,
    mode: game.mode,
    fen: game.chess.fen(),
    pgn: game.chess.pgn(),
    turn,
    color,
    status: game.status,
    result: game.result,
    botRating: game.botRating || null,
    difficulty: game.botRating || game.difficulty || 'normal',
    timeControl: game.timeControl || 'casual',
    timeLabel: TIME_CONTROLS[game.timeControl || 'casual'].label,
    clock: publicClock(game),
    white: publicUser(game.white),
    black: game.black ? publicUser(game.black) : publicUser(computerUser(game.botRating)),
    lastMove: lastMove ? { from: lastMove.from, to: lastMove.to, san: lastMove.san } : null,
    moves: game.chess.moves({ verbose: true })
  };
}

function publicUser(user) {
  return {
    name: user.name,
    rating: user.rating,
    games: user.games,
    wins: user.wins,
    losses: user.losses,
    draws: user.draws
  };
}

function randomId(prefix = 'game') {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function createGame({ mode, white, black = null, difficulty = 'normal', botRating = null, timeControl = 'casual' }) {
  const id = randomId(mode);
  const normalizedTime = normalizeTimeControl(timeControl);
  const control = TIME_CONTROLS[normalizedTime];
  const game = {
    id,
    mode,
    difficulty,
    botRating,
    timeControl: normalizedTime,
    clock: control.initialMs === null ? null : {
      remaining: { w: control.initialMs, b: control.initialMs },
      lastTickAt: Date.now()
    },
    chess: new Chess(),
    white,
    black,
    status: 'playing',
    result: null
  };
  games.set(id, game);
  createStoredMatch({
    id,
    white_id: white.id,
    black_id: black?.id || null,
    mode
  });
  return game;
}

function evaluateBoard(chess, perspective = 'b') {
  const values = { p: 100, n: 315, b: 330, r: 500, q: 900, k: 0 };
  const material = chess.board().flat().reduce((score, piece) => {
    if (!piece) return score;
    const value = values[piece.type] || 0;
    return score + (piece.color === perspective ? value : -value);
  }, 0);
  const turn = chess.turn();
  const mobility = chess.moves().length * (turn === perspective ? 2 : -2);
  if (chess.isCheckmate()) return turn === perspective ? -100000 : 100000;
  if (chess.isDraw()) return 0;
  return material + mobility;
}

function moveScore(chess, move, perspective = move.color) {
  const clone = new Chess(chess.fen());
  clone.move(move);
  let score = evaluateBoard(clone, perspective);
  if (clone.isCheckmate()) score += move.color === perspective ? 100000 : -100000;
  if (move.captured) score += 90 + (move.captured === 'q' ? 120 : 0);
  if (move.promotion) score += 120;
  if (clone.inCheck()) score += move.color === perspective ? 35 : -35;
  return score;
}

function minimax(chess, depth, alpha, beta, perspective) {
  if (depth === 0 || chess.isGameOver()) return evaluateBoard(chess, perspective);

  const maximizing = chess.turn() === perspective;
  const moves = chess.moves({ verbose: true });
  let best = maximizing ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

  for (const move of moves) {
    const clone = new Chess(chess.fen());
    clone.move(move);
    const score = minimax(clone, depth - 1, alpha, beta, perspective);

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }

    if (beta <= alpha) break;
  }

  return best;
}

function chooseComputerMove(chess, botRating = 1200) {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  const rating = clampNumber(botRating, BOT_RATING_MIN, BOT_RATING_MAX, 1200);
  const perspective = chess.turn();
  const randomChance = rating <= 400 ? 0.82 : rating <= 800 ? 0.48 : rating <= 1200 ? 0.22 : rating <= 1800 ? 0.1 : rating <= 2400 ? 0.04 : 0.01;
  const depth = rating >= 2500 ? 3 : rating >= 1500 ? 2 : 1;

  if (Math.random() < randomChance) {
    const noisyMoves = moves.map((move) => ({
      move,
      score: moveScore(chess, move, perspective) + Math.random() * (900 - Math.min(700, rating / 4))
    }));
    noisyMoves.sort((a, b) => a.score - b.score);
    return noisyMoves[Math.floor(Math.random() * Math.min(5, noisyMoves.length))].move;
  }

  let best = moves[0];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const move of moves) {
    const clone = new Chess(chess.fen());
    clone.move(move);
    let score = depth === 1
      ? moveScore(chess, move, perspective)
      : minimax(clone, depth - 1, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, perspective);
    score += Math.random() * Math.max(2, 80 - rating / 45);

    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
  }

  return best;
}

function maybePlayComputerMove(game) {
  if (game.mode !== 'bot' || game.status !== 'playing') return;
  const turn = game.chess.turn();
  const botColor = game.white.id === COMPUTER_ID ? 'w' : game.black?.id === COMPUTER_ID ? 'b' : null;
  if (turn !== botColor) return;

  syncClock(game);
  if (game.status !== 'playing') return;

  const reply = chooseComputerMove(game.chess, game.botRating);
  if (!reply) return;
  game.chess.move(reply);
  applyClockAfterMove(game, botColor);
  completeIfOver(game);
}

function completeIfOver(game) {
  if (!game.chess.isGameOver()) return false;

  game.status = 'finished';
  if (game.chess.isCheckmate()) {
    game.result = game.chess.turn() === 'w' ? '0-1' : '1-0';
  } else {
    game.result = '1/2-1/2';
  }

  finishStoredMatch({ id: game.id, result: game.result, pgn: game.chess.pgn() });

  if (game.mode === 'online' && game.white && game.black) {
    updateElo(game.white, game.black, game.result);
  }

  return true;
}

function updateElo(white, black, result) {
  const scoreWhite = result === '1-0' ? 1 : result === '0-1' ? 0 : 0.5;
  const expectedWhite = 1 / (1 + Math.pow(10, (black.rating - white.rating) / 400));
  const expectedBlack = 1 - expectedWhite;
  const k = 32;
  const whiteRating = Math.round(white.rating + k * (scoreWhite - expectedWhite));
  const blackRating = Math.round(black.rating + k * ((1 - scoreWhite) - expectedBlack));

  updateStoredRating(white, whiteRating, scoreWhite === 1 ? 1 : 0, scoreWhite === 0 ? 1 : 0, scoreWhite === 0.5 ? 1 : 0);
  updateStoredRating(black, blackRating, scoreWhite === 0 ? 1 : 0, scoreWhite === 1 ? 1 : 0, scoreWhite === 0.5 ? 1 : 0);
}

app.get('/api/me', (req, res) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Telegram auth required' });
  res.json(publicUser(user));
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    uptime: Math.round(process.uptime()),
    activeGames: games.size,
    pendingChallenges: challenges.size
  });
});

app.get('/api/leaderboard', (_req, res) => {
  res.json(topUsers());
});

app.get('/api/friends', (req, res) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Telegram auth required' });
  res.json(knownTelegramUsers(user.id));
});

app.get('/api/stats', (_req, res) => {
  res.json(storeStats());
});

app.post('/api/challenges', async (req, res) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Telegram auth required' });

  const id = randomId('challenge');
  const timeControl = normalizeTimeControl(req.body?.timeControl);
  const colorChoice = ['w', 'b', 'random'].includes(req.body?.colorChoice) ? req.body.colorChoice : 'random';
  const targetUserId = Number(req.body?.targetUserId || 0);
  const target = targetUserId ? store.users.find((item) => item.id === targetUserId) : null;
  const challenge = {
    id,
    creator: user,
    targetUserId: target?.id || null,
    colorChoice,
    timeControl,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 60_000
  };
  challenges.set(id, challenge);

  let notified = false;
  let notifyError = null;
  if (target && telegramBot && /^\d+$/.test(String(target.telegram_id || ''))) {
    try {
      await telegramBot.telegram.sendMessage(
        target.telegram_id,
        `${user.name} invites you to a chess game.`,
        Markup.inlineKeyboard([
          Markup.button.webApp('Accept challenge', challengeUrl(id))
        ])
      );
      notified = true;
    } catch (error) {
      notifyError = error.message;
    }
  }

  res.json({
    id,
    url: challengeUrl(id),
    expiresAt: challenge.expiresAt,
    notified,
    notifyError
  });
});

app.post('/api/challenges/:id/accept', (req, res) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Telegram auth required' });

  const challenge = challenges.get(req.params.id);
  if (!challenge) return res.status(404).json({ error: 'Challenge not found' });
  if (challenge.status !== 'pending') return res.status(409).json({ error: 'Challenge already used' });
  if (challenge.expiresAt < Date.now()) {
    challenge.status = 'expired';
    return res.status(410).json({ error: 'Challenge expired' });
  }
  if (challenge.creator.id === user.id) return res.status(400).json({ error: 'Send this invite to a friend.' });
  if (challenge.targetUserId && challenge.targetUserId !== user.id) {
    return res.status(403).json({ error: 'This challenge is for another player' });
  }

  const { white, black } = chooseChallengePlayers(challenge, user);
  const game = createGame({
    mode: 'online',
    white,
    black,
    timeControl: challenge.timeControl
  });
  challenge.status = 'accepted';
  challenge.gameId = game.id;

  emitGame(game);
  res.json(serializeGame(game, user.id));
});

app.post('/api/bot-game', (req, res) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Telegram auth required' });
  const botRating = clampNumber(req.body?.botRating || req.body?.difficulty, BOT_RATING_MIN, BOT_RATING_MAX, 1200);
  const colorChoice = ['w', 'b', 'random'].includes(req.body?.colorChoice) ? req.body.colorChoice : 'w';
  const playerColor = colorChoice === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : colorChoice;
  const bot = computerUser(botRating);
  const game = createGame({
    mode: 'bot',
    white: playerColor === 'w' ? user : bot,
    black: playerColor === 'b' ? user : bot,
    botRating,
    timeControl: req.body?.timeControl
  });
  maybePlayComputerMove(game);
  res.json(serializeGame(game, user.id));
});

app.post('/api/games/:id/move', (req, res) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Telegram auth required' });

  const game = games.get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'playing') return res.status(409).json({ error: 'Game already finished' });

  syncClock(game);
  if (game.status !== 'playing') return res.json(serializeGame(game, user.id));

  const userColor = game.white.id === user.id ? 'w' : game.black?.id === user.id ? 'b' : null;
  if (!userColor || game.chess.turn() !== userColor) return res.status(403).json({ error: 'Not your turn' });

  let move = null;
  try {
    move = game.chess.move({
      from: req.body.from,
      to: req.body.to,
      promotion: req.body.promotion || 'q'
    });
  } catch {
    move = null;
  }
  if (!move) return res.status(400).json({ error: 'Illegal move' });

  applyClockAfterMove(game, userColor);
  completeIfOver(game);

  maybePlayComputerMove(game);

  emitGame(game);
  res.json(serializeGame(game, user.id));
});

app.post('/api/games/:id/resign', (req, res) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Telegram auth required' });

  const game = games.get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.status !== 'playing') return res.status(409).json({ error: 'Game already finished' });

  const userColor = game.white.id === user.id ? 'w' : game.black?.id === user.id ? 'b' : null;
  if (!userColor) return res.status(403).json({ error: 'Not your game' });

  game.status = 'finished';
  game.result = userColor === 'w' ? '0-1' : '1-0';
  finishStoredMatch({ id: game.id, result: game.result, pgn: game.chess.pgn() });

  if (game.mode === 'online' && game.white && game.black) {
    updateElo(game.white, game.black, game.result);
  }

  emitGame(game);
  res.json(serializeGame(game, user.id));
});

io.on('connection', (socket) => {
  const user = socketUser(socket);
  if (!user) {
    socket.emit('auth:error');
    socket.disconnect(true);
    return;
  }

  socket.data.user = user;
  socket.join(`user:${user.id}`);

  socket.on('queue:join', (options = {}) => {
    const timeControl = normalizeTimeControl(options.timeControl);
    socket.data.timeControl = timeControl;
    socket.data.colorChoice = ['w', 'b', 'random'].includes(options.colorChoice) ? options.colorChoice : 'random';

    if (waitingSocket && waitingSocket.connected && waitingSocket.id !== socket.id && waitingSocket.data.timeControl === timeControl) {
      const { whiteSocket, blackSocket } = chooseOnlineColors(socket, waitingSocket);
      const game = createGame({
        mode: 'online',
        white: whiteSocket.data.user,
        black: blackSocket.data.user,
        timeControl
      });

      whiteSocket.join(game.id);
      blackSocket.join(game.id);
      whiteSocket.emit('game:start', serializeGame(game, whiteSocket.data.user.id));
      blackSocket.emit('game:start', serializeGame(game, blackSocket.data.user.id));
      waitingSocket = null;
      return;
    }

    waitingSocket = socket;
    socket.emit('queue:waiting');
  });

  socket.on('game:watch', (gameId) => {
    const game = games.get(gameId);
    if (!game) return;
    socket.join(game.id);
    socket.emit('game:update', serializeGame(game, user.id));
  });

  socket.on('disconnect', () => {
    if (waitingSocket?.id === socket.id) waitingSocket = null;
  });
});

function emitGame(game) {
  io.to(`user:${game.white.id}`).emit('game:update', serializeGame(game, game.white.id));
  if (game.black) {
    io.to(`user:${game.black.id}`).emit('game:update', serializeGame(game, game.black.id));
  }
  io.to(game.id).emit('game:spectator-update', serializeGame(game, 0));
}

if (BOT_TOKEN) {
  const bot = new Telegraf(BOT_TOKEN);
  telegramBot = bot;
  bot.start((ctx) => ctx.reply(
    'Готовы сыграть?',
    Markup.inlineKeyboard([
      Markup.button.webApp('Играть в шахматы', PUBLIC_URL)
    ])
  ));
  bot.launch();
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Chess arena is running at ${PUBLIC_URL}`);
});

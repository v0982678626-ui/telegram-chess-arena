const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();

const params = new URLSearchParams(window.location.search);
const devUser = params.get('devUser') || localStorage.getItem('devUser') || `guest-${Math.floor(Math.random() * 9999)}`;
localStorage.setItem('devUser', devUser);
const incomingChallengeId = params.get('challenge');

const authHeaders = () => {
  if (tg?.initData) return { Authorization: `tma ${tg.initData}` };
  return { 'x-dev-user': devUser };
};

function withAuthQuery(path) {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}devUser=${encodeURIComponent(devUser)}`;
}

const pieceShapes = {
  p: `
    <circle class="piece-fill" cx="50" cy="23" r="11.5" />
    <path class="piece-fill" d="M41 37h18c4 6 7 16 7 27H34c0-11 3-21 7-27z" />
    <path class="piece-fill" d="M31 63h38l4 10H27z" />
    <path class="piece-fill" d="M25 74h50l3 9H22z" />
    <path class="piece-shine" d="M43 19c3-4 8-5 12-3" />
  `,
  n: `
    <path class="piece-fill" d="M24 82h55l-3-10H33c-3-15 3-27 18-35 1-5-2-10-7-13l-8 7-11-5 20-18c18 2 30 13 31 30 1 11-5 22-16 32h17l3 12z" />
    <path class="piece-line" d="M38 51c9 0 21-5 29-16" />
    <path class="piece-line" d="M36 31l9-7" />
    <circle class="piece-eye" cx="51" cy="27" r="2.5" />
  `,
  b: `
    <circle class="piece-fill" cx="50" cy="13" r="6.5" />
    <path class="piece-fill" d="M33 61c1-25 8-42 17-48 10 7 17 24 17 48z" />
    <path class="piece-line" d="M59 25 41 55" />
    <path class="piece-line" d="M43 31c5-4 10-5 15-3" />
    <path class="piece-fill" d="M29 61h42l5 12H24z" />
    <path class="piece-fill" d="M22 74h56l3 9H19z" />
  `,
  r: `
    <path class="piece-fill" d="M25 15h12v10h9V15h9v10h9V15h11v24H25z" />
    <path class="piece-fill" d="M32 38h36l4 29H28z" />
    <path class="piece-fill" d="M27 64h46l4 10H23z" />
    <path class="piece-fill" d="M21 74h58l3 9H18z" />
    <path class="piece-line" d="M32 39h36" />
  `,
  q: `
    <circle class="piece-fill" cx="23" cy="24" r="7" />
    <circle class="piece-fill" cx="37" cy="16" r="7" />
    <circle class="piece-fill" cx="50" cy="13" r="7.5" />
    <circle class="piece-fill" cx="63" cy="16" r="7" />
    <circle class="piece-fill" cx="77" cy="24" r="7" />
    <path class="piece-fill" d="M25 30h50l-8 37H33z" />
    <path class="piece-fill" d="M29 65h42l5 9H24z" />
    <path class="piece-fill" d="M21 74h58l3 9H18z" />
    <path class="piece-line" d="M35 35h30" />
  `,
  k: `
    <path class="piece-fill" d="M46 8h8v11h11v8H54v12h-8V27H35v-8h11z" />
    <path class="piece-fill" d="M34 63c0-17 6-29 16-29s16 12 16 29z" />
    <path class="piece-fill" d="M29 64h42l5 10H24z" />
    <path class="piece-fill" d="M21 74h58l3 9H18z" />
    <path class="piece-line" d="M38 47h24" />
  `
};

function pieceSvg(type) {
  return `
    <svg class="piece-icon" viewBox="0 0 100 100" aria-hidden="true">
      <g class="piece-shadow">${pieceShapes[type]}</g>
      <g>${pieceShapes[type]}</g>
    </svg>
  `;
}

const pieces = Object.fromEntries(
  ['w', 'b'].flatMap((color) => ['p', 'n', 'b', 'r', 'q', 'k'].map((type) => [`${color}${type}`, pieceSvg(type)]))
);

const translations = {
  en: {
    brand: 'Telegram Chess',
    player: 'Player',
    computer: 'Computer',
    quickGame: 'Quick game',
    online: 'Online',
    findPlayer: 'Find player',
    friend: 'Friend',
    sendInvite: 'Send invite',
    botRating: 'Bot rating',
    playAs: 'Play as',
    white: 'White',
    black: 'Black',
    random: 'Random',
    time: 'Time',
    noClock: 'No clock',
    startGame: 'Start game',
    findPlayerAction: 'Find player',
    createInvite: 'Create invite',
    resign: 'Resign',
    chooseMode: 'Choose a mode and start a game.',
    notifyPlayer: 'Notify player',
    shareManual: 'Share link manually',
    copy: 'Copy',
    share: 'Share',
    menu: 'Menu',
    game: 'Game',
    gameOver: 'Game over',
    whiteToMove: 'White to move',
    blackToMove: 'Black to move',
    moves: 'Moves',
    rating: 'Rating',
    myFriends: 'Friends',
    style: 'Style',
    language: 'Language',
    boardTheme: 'Board theme',
    classicGreen: 'Classic green',
    wood: 'Wood',
    ocean: 'Ocean',
    violet: 'Violet',
    pieces: 'Pieces',
    chessClean: 'Chess clean',
    classic: 'Classic',
    minimal: 'Minimal',
    coordinates: 'Coordinates',
    moveDots: 'Move dots',
    choosePromotion: 'Choose promotion',
    playBot: 'Play a fast game against the computer.',
    joinQueue: 'Join the queue and play online.',
    challengeHelp: 'Create a challenge link for a friend.',
    waitingQueue: 'You are in the queue. Waiting for another player.',
    authFailed: 'Telegram authorization failed.',
    openingChallenge: 'Opening friend challenge...',
    inviteSent: 'Invite sent. Friend also received a bot message.',
    inviteCreated: 'Invite created. Share the link with your friend.',
    directChallengeSent: 'Challenge sent in the bot.',
    challengeButton: 'Challenge',
    friendsEmpty: 'Friends appear here after they open the bot.',
    inviteCopied: 'Invite link copied.',
    inviteShared: 'Invite shared.',
    stillOpen: 'Game is still open. Press Start to create a new one.',
    startFirst: 'Start a game first.',
    gameFinished: 'Game finished.',
    waitTurn: 'Wait for your turn.',
    selected: 'Selected {square}. Dots show legal moves.',
    noMoves: 'This piece has no legal moves.',
    choosePiece: 'Choose a piece for promotion.',
    moving: 'Moving...',
    spectator: 'Spectating this game.',
    yourTurn: 'Your turn. Tap a piece.',
    opponentThinking: 'Opponent is thinking.',
    draw: 'Draw',
    drawDetails: 'The game ended in a draw.',
    drawStatus: 'Game over: draw.',
    youWon: 'You won',
    youLost: 'You lost',
    resultDetails: '{winner} won the game. Result: {result}',
    wonStatus: 'Game over: you won.',
    lostStatus: 'Game over: you lost.',
    ratingEmpty: 'Rating appears after the first online games.',
    ratingUnavailable: 'Rating is unavailable.',
    timeMode: 'Time mode: {mode}.',
    botRatingStatus: 'Bot rating: {rating}.'
  },
  ru: {
    brand: 'Telegram Шахматы',
    player: 'Игрок',
    computer: 'Компьютер',
    quickGame: 'Быстрая игра',
    online: 'Онлайн',
    findPlayer: 'Найти игрока',
    friend: 'Друг',
    sendInvite: 'Вызов',
    botRating: 'Рейтинг бота',
    playAs: 'Играть за',
    white: 'Белые',
    black: 'Черные',
    random: 'Случайно',
    time: 'Время',
    noClock: 'Без часов',
    startGame: 'Начать игру',
    findPlayerAction: 'Найти игрока',
    createInvite: 'Создать вызов',
    resign: 'Сдаться',
    chooseMode: 'Выбери режим и начни игру.',
    notifyPlayer: 'Оповестить игрока',
    shareManual: 'Отправить ссылку вручную',
    copy: 'Копировать',
    share: 'Поделиться',
    menu: 'Меню',
    game: 'Игра',
    gameOver: 'Игра окончена',
    whiteToMove: 'Ход белых',
    blackToMove: 'Ход черных',
    moves: 'Ходы',
    rating: 'Рейтинг',
    myFriends: 'Друзья',
    style: 'Стиль',
    language: 'Язык',
    boardTheme: 'Цвет доски',
    classicGreen: 'Классическая зеленая',
    wood: 'Дерево',
    ocean: 'Океан',
    violet: 'Фиолетовая',
    pieces: 'Фигуры',
    chessClean: 'Чистые шахматы',
    classic: 'Классика',
    minimal: 'Минимал',
    coordinates: 'Координаты',
    moveDots: 'Точки ходов',
    choosePromotion: 'Выбери превращение',
    playBot: 'Сыграй быструю партию против компьютера.',
    joinQueue: 'Встань в очередь и сыграй онлайн.',
    challengeHelp: 'Создай ссылку-вызов для друга.',
    waitingQueue: 'Ты в очереди. Ждем второго игрока.',
    authFailed: 'Ошибка авторизации Telegram.',
    openingChallenge: 'Открываю вызов друга...',
    inviteSent: 'Вызов создан. Другу отправлено сообщение от бота.',
    inviteCreated: 'Вызов создан. Отправь ссылку другу.',
    directChallengeSent: 'Вызов отправлен в боте.',
    challengeButton: 'Вызов',
    friendsEmpty: 'Друзья появятся тут после того, как они откроют бота.',
    inviteCopied: 'Ссылка вызова скопирована.',
    inviteShared: 'Вызов отправлен.',
    stillOpen: 'Игра еще открыта. Нажми старт, чтобы создать новую.',
    startFirst: 'Сначала начни игру.',
    gameFinished: 'Игра окончена.',
    waitTurn: 'Подожди свой ход.',
    selected: 'Выбрано {square}. Точки показывают возможные ходы.',
    noMoves: 'У этой фигуры нет ходов.',
    choosePiece: 'Выбери фигуру для превращения.',
    moving: 'Ход...',
    spectator: 'Ты смотришь эту игру.',
    yourTurn: 'Твой ход. Нажми на фигуру.',
    opponentThinking: 'Соперник думает.',
    draw: 'Ничья',
    drawDetails: 'Партия закончилась ничьей.',
    drawStatus: 'Игра окончена: ничья.',
    youWon: 'Ты победил',
    youLost: 'Ты проиграл',
    resultDetails: '{winner} выиграл партию. Результат: {result}',
    wonStatus: 'Игра окончена: ты победил.',
    lostStatus: 'Игра окончена: ты проиграл.',
    ratingEmpty: 'Рейтинг появится после первых онлайн-игр.',
    ratingUnavailable: 'Рейтинг недоступен.',
    timeMode: 'Режим времени: {mode}.',
    botRatingStatus: 'Рейтинг бота: {rating}.'
  }
};

const pieceOrder = ['q', 'r', 'b', 'n', 'p'];
const defaultSettings = {
  boardTheme: 'classic',
  pieceStyle: 'chess',
  botRating: 1200,
  colorChoice: 'w',
  timeControl: 'casual',
  language: 'ru',
  coordinates: true,
  moveDots: true
};

const state = {
  mode: 'bot',
  game: null,
  selected: null,
  legalTargets: new Set(),
  promotion: null,
  socket: null,
  clockTimer: null,
  inviteUrl: '',
  settings: loadSettings()
};

const els = {
  playerName: document.querySelector('#playerName'),
  playerRating: document.querySelector('#playerRating'),
  botMode: document.querySelector('#botMode'),
  onlineMode: document.querySelector('#onlineMode'),
  challengeMode: document.querySelector('#challengeMode'),
  playButton: document.querySelector('#playButton'),
  resignButton: document.querySelector('#resignButton'),
  backToSetupButton: document.querySelector('#backToSetupButton'),
  botRatingField: document.querySelector('#botRatingField'),
  botRatingInput: document.querySelector('#botRatingInput'),
  botRatingValue: document.querySelector('#botRatingValue'),
  colorChoiceSelect: document.querySelector('#colorChoiceSelect'),
  timeControlSelect: document.querySelector('#timeControlSelect'),
  statusText: document.querySelector('#statusText'),
  invitePanel: document.querySelector('#invitePanel'),
  friendSelect: document.querySelector('#friendSelect'),
  inviteLink: document.querySelector('#inviteLink'),
  inviteUrl: document.querySelector('#inviteUrl'),
  copyInviteButton: document.querySelector('#copyInviteButton'),
  shareInviteButton: document.querySelector('#shareInviteButton'),
  board: document.querySelector('#board'),
  turnText: document.querySelector('#turnText'),
  gameResult: document.querySelector('#gameResult'),
  gameModeTitle: document.querySelector('#gameModeTitle'),
  timeControlLabel: document.querySelector('#timeControlLabel'),
  resultBanner: document.querySelector('#resultBanner'),
  resultTitle: document.querySelector('#resultTitle'),
  resultDetails: document.querySelector('#resultDetails'),
  topPlayerName: document.querySelector('#topPlayerName'),
  bottomPlayerName: document.querySelector('#bottomPlayerName'),
  topPlayerColor: document.querySelector('#topPlayerColor'),
  bottomPlayerColor: document.querySelector('#bottomPlayerColor'),
  topClock: document.querySelector('#topClock'),
  bottomClock: document.querySelector('#bottomClock'),
  topCaptured: document.querySelector('#topCaptured'),
  bottomCaptured: document.querySelector('#bottomCaptured'),
  whiteName: document.querySelector('#whiteName'),
  blackName: document.querySelector('#blackName'),
  moveList: document.querySelector('#moveList'),
  leaderboard: document.querySelector('#leaderboard'),
  friendsList: document.querySelector('#friendsList'),
  promotionModal: document.querySelector('#promotionModal'),
  promotionOptions: document.querySelector('#promotionOptions'),
  languageSelect: document.querySelector('#languageSelect'),
  boardThemeSelect: document.querySelector('#boardThemeSelect'),
  pieceStyleSelect: document.querySelector('#pieceStyleSelect'),
  coordinatesToggle: document.querySelector('#coordinatesToggle'),
  moveDotsToggle: document.querySelector('#moveDotsToggle')
};

function loadSettings() {
  try {
    const settings = { ...defaultSettings, ...JSON.parse(localStorage.getItem('chessSettings') || '{}') };
    if (settings.pieceStyle === 'neo') settings.pieceStyle = 'chess';
    if (['easy', 'normal', 'hard'].includes(settings.botDifficulty) && !settings.botRating) {
      settings.botRating = settings.botDifficulty === 'easy' ? 600 : settings.botDifficulty === 'hard' ? 2000 : 1200;
    }
    settings.botRating = clamp(settings.botRating, 200, 3000);
    if (!['w', 'b', 'random'].includes(settings.colorChoice)) settings.colorChoice = 'w';
    if (!['casual', 'bullet', 'blitz', 'rapid', 'classical'].includes(settings.timeControl)) settings.timeControl = 'casual';
    if (!['ru', 'en'].includes(settings.language)) settings.language = 'ru';
    return settings;
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings() {
  localStorage.setItem('chessSettings', JSON.stringify(state.settings));
}

function applySettings() {
  document.body.dataset.boardTheme = state.settings.boardTheme;
  document.body.dataset.pieceStyle = state.settings.pieceStyle;
  document.body.classList.toggle('hide-coordinates', !state.settings.coordinates);
  document.body.classList.toggle('hide-move-dots', !state.settings.moveDots);

  document.documentElement.lang = state.settings.language;
  els.languageSelect.value = state.settings.language;
  els.boardThemeSelect.value = state.settings.boardTheme;
  els.pieceStyleSelect.value = state.settings.pieceStyle;
  els.botRatingInput.value = state.settings.botRating;
  els.botRatingValue.textContent = state.settings.botRating;
  els.colorChoiceSelect.value = state.settings.colorChoice;
  els.timeControlSelect.value = state.settings.timeControl;
  els.botRatingField.hidden = state.mode !== 'bot';
  els.coordinatesToggle.checked = state.settings.coordinates;
  els.moveDotsToggle.checked = state.settings.moveDots;
  applyTranslations();
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function t(key, vars = {}) {
  const text = translations[state.settings.language]?.[key] || translations.en[key] || key;
  return Object.entries(vars).reduce((result, [name, value]) => result.replaceAll(`{${name}}`, value), text);
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  updatePlayButtonText();
  if (els.friendsList.innerHTML) loadFriends();
  if (state.game) {
    els.turnText.textContent = state.game.turn === 'w' ? t('whiteToMove') : t('blackToMove');
    renderPlayerStrips(state.game);
  }
}

function updatePlayButtonText() {
  const key = state.mode === 'challenge' ? 'createInvite' : state.mode === 'online' ? 'findPlayerAction' : 'startGame';
  els.playButton.textContent = t(key);
}

function timeLabel(key) {
  const labels = {
    casual: t('noClock'),
    bullet: '1+0 Bullet',
    blitz: '3+2 Blitz',
    rapid: '10+0 Rapid',
    classical: '15+10 Classical'
  };
  return labels[key] || t('noClock');
}

function displayName(user) {
  if (!user) return '';
  if (/^Computer\s+\d+/.test(user.name)) return `${t('computer')} ${user.rating}`;
  return user.name;
}

function parseFen(fen) {
  return fen.split(' ')[0].split('/').map((row) => {
    const cells = [];
    for (const char of row) {
      if (/\d/.test(char)) {
        cells.push(...Array.from({ length: Number(char) }, () => null));
      } else {
        cells.push({
          color: char === char.toUpperCase() ? 'w' : 'b',
          type: char.toLowerCase()
        });
      }
    }
    return cells;
  });
}

function initialBoard() {
  return parseFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
}

function squareName(row, col) {
  return `${'abcdefgh'[col]}${8 - row}`;
}

function squareToIndexes(square) {
  return {
    row: 8 - Number(square[1]),
    col: 'abcdefgh'.indexOf(square[0])
  };
}

function pieceAt(square) {
  if (!state.game) return null;
  const { row, col } = squareToIndexes(square);
  return parseFen(state.game.fen)[row]?.[col] || null;
}

function playerColor() {
  if (state.game?.color === 'w' || state.game?.color === 'b') return state.game.color;
  if (state.game?.mode === 'bot') return 'w';
  return null;
}

function canMoveNow() {
  const color = playerColor();
  return Boolean(state.game && state.game.status === 'playing' && color && state.game.turn === color);
}

function showGameScreen() {
  document.body.classList.add('in-game');
}

function showSetupScreen() {
  document.body.classList.remove('in-game');
}

function formatClock(ms) {
  if (ms === null || ms === undefined) return '--:--';
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.ceil(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function liveClock(color) {
  const clock = state.game?.clock;
  if (!clock) return null;
  let remaining = clock[color];
  if (state.game.status === 'playing' && clock.running === color) {
    remaining -= Date.now() - clock.lastTickAt;
  }
  return Math.max(0, remaining);
}

function renderClocks() {
  if (!state.game) {
    els.topClock.textContent = '--:--';
    els.bottomClock.textContent = '--:--';
    return;
  }

  const bottomColor = playerColor() === 'b' ? 'b' : 'w';
  const topColor = bottomColor === 'w' ? 'b' : 'w';
  els.topClock.textContent = formatClock(liveClock(topColor));
  els.bottomClock.textContent = formatClock(liveClock(bottomColor));
  els.topClock.classList.toggle('active', state.game.clock?.running === topColor);
  els.bottomClock.classList.toggle('active', state.game.clock?.running === bottomColor);
}

function startClockTicker() {
  clearInterval(state.clockTimer);
  renderClocks();
  state.clockTimer = setInterval(renderClocks, 250);
}

function renderBoard() {
  els.board.innerHTML = '';
  const board = state.game ? parseFen(state.game.fen) : initialBoard();
  const flip = playerColor() === 'b';
  const rows = [...Array(8).keys()];
  const cols = [...Array(8).keys()];
  if (flip) {
    rows.reverse();
    cols.reverse();
  }

  for (const row of rows) {
    for (const col of cols) {
      const square = squareName(row, col);
      const piece = board[row][col];
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
      cell.dataset.square = square;
      cell.setAttribute('aria-label', square);

      if (state.selected === square) cell.classList.add('selected');
      if (state.legalTargets.has(square)) cell.classList.add('legal');
      if (state.game?.lastMove && (state.game.lastMove.from === square || state.game.lastMove.to === square)) {
        cell.classList.add('last-move');
      }
      if (piece?.color === playerColor() && state.game?.turn === piece.color) cell.classList.add('own-piece');
      if (piece) {
        cell.insertAdjacentHTML('afterbegin', `<span class="piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}">${pieces[`${piece.color}${piece.type}`]}</span>`);
      }
      if (state.settings.coordinates) addCoordinates(cell, row, col, flip);
      cell.addEventListener('click', () => onSquareClick(square, piece));
      els.board.appendChild(cell);
    }
  }
}

function addCoordinates(cell, row, col, flip) {
  const file = 'abcdefgh'[col];
  const rank = String(8 - row);
  const fileEdge = flip ? row === 0 : row === 7;
  const rankEdge = flip ? col === 7 : col === 0;

  if (fileEdge) {
    const label = document.createElement('span');
    label.className = 'coord file';
    label.textContent = file;
    cell.appendChild(label);
  }

  if (rankEdge) {
    const label = document.createElement('span');
    label.className = 'coord rank';
    label.textContent = rank;
    cell.appendChild(label);
  }
}

async function onSquareClick(square, piece) {
  if (!state.game) {
    setStatus(t('startFirst'));
    return;
  }

  if (!canMoveNow()) {
    setStatus(state.game.status === 'finished' ? t('gameFinished') : t('waitTurn'));
    return;
  }

  if (state.selected && state.legalTargets.has(square)) {
    const from = state.selected;
    const promotionMove = isPromotionMove(from, square);
    clearSelection(false);
    if (promotionMove) {
      showPromotionChoice(from, square);
      return;
    }
    await makeMove(from, square);
    return;
  }

  const color = playerColor();
  if (piece?.color === color) {
    const moves = state.game.moves.filter((move) => move.from === square);
    state.selected = square;
    state.legalTargets = new Set(moves.map((move) => move.to));
    setStatus(moves.length ? t('selected', { square }) : t('noMoves'));
    renderBoard();
    return;
  }

  clearSelection();
}

function isPromotionMove(from, to) {
  const movingPiece = pieceAt(from);
  if (movingPiece?.type !== 'p') return false;
  if (!((movingPiece.color === 'w' && to[1] === '8') || (movingPiece.color === 'b' && to[1] === '1'))) {
    return false;
  }
  return state.game.moves.some((move) => move.from === from && move.to === to);
}

function clearSelection(render = true) {
  state.selected = null;
  state.legalTargets = new Set();
  if (render) renderBoard();
}

async function api(path, options = {}) {
  const response = await fetch(withAuthQuery(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error((await response.json()).error || 'Request failed');
  return response.json();
}

function showPromotionChoice(from, to) {
  const color = playerColor() || 'w';
  state.promotion = { from, to };
  els.promotionOptions.innerHTML = ['q', 'r', 'b', 'n'].map((type) => `
    <button class="promotion-option" type="button" data-piece="${type}" aria-label="Promote to ${type}">
      <span class="piece ${color === 'w' ? 'white-piece' : 'black-piece'}">${pieces[`${color}${type}`]}</span>
    </button>
  `).join('');
  els.promotionModal.hidden = false;
  setStatus(t('choosePiece'));
}

function hidePromotionChoice() {
  state.promotion = null;
  els.promotionModal.hidden = true;
  els.promotionOptions.innerHTML = '';
}

async function makeMove(from, to, promotion = 'q') {
  try {
    setStatus(t('moving'));
    const game = await api(`/api/games/${state.game.id}/move`, {
      method: 'POST',
      body: JSON.stringify({ from, to, promotion })
    });
    setGame(game);
  } catch (error) {
    setStatus(error.message);
    renderBoard();
  }
}

async function resignGame() {
  if (!state.game || state.game.status !== 'playing') return;

  els.resignButton.disabled = true;
  try {
    const game = await api(`/api/games/${state.game.id}/resign`, {
      method: 'POST',
      body: '{}'
    });
    setGame(game);
  } catch (error) {
    setStatus(error.message);
    els.resignButton.disabled = false;
  }
}

function setGame(game) {
  state.game = game;
  clearSelection(false);
  showGameScreen();

  els.whiteName.textContent = `${displayName(game.white)} - ${game.white.rating}`;
  els.blackName.textContent = `${displayName(game.black)} - ${game.black.rating}`;
  els.gameModeTitle.textContent = game.mode === 'bot' ? `${t('computer')} ${game.botRating || game.difficulty || ''}` : t('online');
  els.timeControlLabel.textContent = timeLabel(game.timeControl);
  renderPlayerStrips(game);
  els.turnText.textContent = game.turn === 'w' ? t('whiteToMove') : t('blackToMove');
  els.gameResult.textContent = game.result || game.lastMove?.san || '';
  els.resignButton.disabled = game.status !== 'playing' || game.color === 'spectator';

  if (game.status === 'finished') {
    const summary = resultSummary(game);
    setStatus(summary.status);
    showResult(summary.title, summary.details);
  } else if (game.color === 'spectator') {
    hideResult();
    setStatus(t('spectator'));
  } else if (game.turn === playerColor()) {
    hideResult();
    setStatus(t('yourTurn'));
  } else {
    hideResult();
    setStatus(t('opponentThinking'));
  }

  renderMoves(game.pgn);
  renderBoard();
  startClockTicker();
  loadLeaderboard();
}

function renderPlayerStrips(game) {
  const bottomColor = playerColor() === 'b' ? 'b' : 'w';
  const topColor = bottomColor === 'w' ? 'b' : 'w';
  const byColor = {
    w: game.white,
    b: game.black
  };
  const labels = {
    w: t('white'),
    b: t('black')
  };
  const captured = capturedPieces(game.fen);

  els.topPlayerColor.textContent = labels[topColor];
  els.bottomPlayerColor.textContent = labels[bottomColor];
  els.topPlayerName.textContent = `${displayName(byColor[topColor])} - ${byColor[topColor].rating}`;
  els.bottomPlayerName.textContent = `${displayName(byColor[bottomColor])} - ${byColor[bottomColor].rating}`;
  els.topCaptured.innerHTML = captured[topColor].map((type) => pieces[`${bottomColor}${type}`]).join('');
  els.bottomCaptured.innerHTML = captured[bottomColor].map((type) => pieces[`${topColor}${type}`]).join('');
  renderClocks();
}

function capturedPieces(fen) {
  const start = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1 }
  };
  const current = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0 }
  };

  for (const row of parseFen(fen)) {
    for (const piece of row) {
      if (piece && current[piece.color][piece.type] !== undefined) {
        current[piece.color][piece.type] += 1;
      }
    }
  }

  return {
    w: missingPieces(start.b, current.b),
    b: missingPieces(start.w, current.w)
  };
}

function missingPieces(start, current) {
  return pieceOrder.flatMap((type) => Array.from({ length: Math.max(0, start[type] - current[type]) }, () => type));
}

function resultSummary(game) {
  const color = playerColor();
  const whiteWon = game.result === '1-0';
  const blackWon = game.result === '0-1';
  const draw = game.result === '1/2-1/2';

  if (draw) {
    return {
      title: t('draw'),
      details: t('drawDetails'),
      status: t('drawStatus')
    };
  }

  const won = (color === 'w' && whiteWon) || (color === 'b' && blackWon);
  const winner = whiteWon ? game.white.name : game.black.name;
  return {
    title: won ? t('youWon') : t('youLost'),
    details: t('resultDetails', { winner, result: game.result }),
    status: won ? t('wonStatus') : t('lostStatus')
  };
}

function showResult(title, details) {
  els.resultTitle.textContent = title;
  els.resultDetails.textContent = details;
  els.resultBanner.hidden = false;
  els.resultBanner.classList.toggle('win', title === t('youWon'));
  els.resultBanner.classList.toggle('loss', title === t('youLost'));
  els.resultBanner.classList.toggle('draw', title === t('draw'));
}

function hideResult() {
  els.resultBanner.hidden = true;
  els.resultBanner.classList.remove('win', 'loss', 'draw');
}

function renderMoves(pgn) {
  const tokens = pgn
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\d+\./g, '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((token) => !['1-0', '0-1', '1/2-1/2', '*'].includes(token));
  const rows = [];
  for (let index = 0; index < tokens.length; index += 2) {
    rows.push(`
      <li>
        <span>${Math.floor(index / 2) + 1}.</span>
        <strong>${escapeHtml(tokens[index] || '')}</strong>
        <strong>${escapeHtml(tokens[index + 1] || '')}</strong>
      </li>
    `);
  }
  els.moveList.innerHTML = rows.join('');
}

function setStatus(text) {
  els.statusText.textContent = text;
}

function setMode(mode) {
  state.mode = mode;
  els.botMode.classList.toggle('active', mode === 'bot');
  els.onlineMode.classList.toggle('active', mode === 'online');
  els.challengeMode.classList.toggle('active', mode === 'challenge');
  els.invitePanel.hidden = mode !== 'challenge';
  updatePlayButtonText();
  applySettings();
  if (mode === 'bot') setStatus(t('playBot'));
  else if (mode === 'online') setStatus(t('joinQueue'));
  else {
    setStatus(t('challengeHelp'));
    loadFriends();
  }
}

async function startBotGame() {
  els.playButton.disabled = true;
  try {
    const game = await api('/api/bot-game', {
      method: 'POST',
      body: JSON.stringify({
        botRating: state.settings.botRating,
        colorChoice: state.settings.colorChoice,
        timeControl: state.settings.timeControl
      })
    });
    setGame(game);
  } catch (error) {
    setStatus(error.message);
  } finally {
    els.playButton.disabled = false;
  }
}

function startOnlineGame() {
  els.playButton.disabled = true;
  setupSocket();
  state.socket.emit('queue:join', {
    timeControl: state.settings.timeControl,
    colorChoice: state.settings.colorChoice
  });
  setStatus(t('joinQueue'));
}

async function createChallenge(targetUserId = null) {
  return api('/api/challenges', {
    method: 'POST',
    body: JSON.stringify({
      timeControl: state.settings.timeControl,
      colorChoice: state.settings.colorChoice,
      targetUserId
    })
  });
}

async function startChallengeInvite() {
  els.playButton.disabled = true;
  try {
    const invite = await createChallenge(els.friendSelect.value || null);
    state.inviteUrl = invite.url;
    els.inviteUrl.value = invite.url;
    els.inviteLink.hidden = false;
    setStatus(invite.notified ? t('inviteSent') : t('inviteCreated'));
  } catch (error) {
    setStatus(error.message);
  } finally {
    els.playButton.disabled = false;
  }
}

async function sendDirectChallenge(targetUserId) {
  try {
    setStatus(t('openingChallenge'));
    const invite = await createChallenge(targetUserId);
    state.inviteUrl = invite.url;
    els.inviteUrl.value = invite.url;
    els.inviteLink.hidden = Boolean(invite.notified);
    setStatus(invite.notified ? t('directChallengeSent') : t('inviteCreated'));
  } catch (error) {
    setStatus(error.message);
  }
}

async function acceptIncomingChallenge() {
  if (!incomingChallengeId) return;
  try {
    setStatus(t('openingChallenge'));
    const game = await api(`/api/challenges/${encodeURIComponent(incomingChallengeId)}/accept`, {
      method: 'POST',
      body: '{}'
    });
    setGame(game);
  } catch (error) {
    setMode('challenge');
    setStatus(error.message);
  }
}

function setupSocket() {
  if (state.socket) return;

  state.socket = io({
    auth: {
      initData: tg?.initData || '',
      devUser: tg?.initData ? '' : devUser
    }
  });

  state.socket.on('queue:waiting', () => {
    setStatus(t('waitingQueue'));
  });

  state.socket.on('game:start', (game) => {
    els.playButton.disabled = false;
    setGame(game);
  });

  state.socket.on('game:update', (game) => {
    setGame(game);
  });

  state.socket.on('auth:error', () => {
    els.playButton.disabled = false;
    setStatus(t('authFailed'));
  });
}

async function loadMe() {
  try {
    const me = await api('/api/me');
    els.playerName.textContent = me.name;
    els.playerRating.textContent = me.rating;
  } catch {
    els.playerName.textContent = devUser;
  }
}

async function loadLeaderboard() {
  try {
    const rows = await api('/api/leaderboard');
    els.leaderboard.innerHTML = rows.length
      ? rows.map((row, index) => `
        <div class="leader-row">
          <span>#${index + 1}</span>
          <strong>${escapeHtml(row.name)}</strong>
          <span>${row.rating}</span>
        </div>
      `).join('')
      : `<p class="status">${t('ratingEmpty')}</p>`;
  } catch {
    els.leaderboard.innerHTML = `<p class="status">${t('ratingUnavailable')}</p>`;
  }
}

async function loadFriends() {
  try {
    const friends = await api('/api/friends');
    els.friendSelect.innerHTML = `<option value="">${t('shareManual')}</option>` + friends.map((friend) => `
      <option value="${friend.id}">${escapeHtml(friend.name)} - ${friend.rating}</option>
    `).join('');
    els.friendsList.innerHTML = friends.length
      ? friends.map((friend) => `
        <div class="friend-row">
          <div>
            <strong>${escapeHtml(friend.name)}</strong>
            <span>${friend.rating} · ${friend.games} ${t('game').toLowerCase()}</span>
          </div>
          <button class="secondary-action small-action" type="button" data-challenge-user="${friend.id}">
            ${t('challengeButton')}
          </button>
        </div>
      `).join('')
      : `<p class="status">${t('friendsEmpty')}</p>`;
  } catch {
    els.friendSelect.innerHTML = `<option value="">${t('shareManual')}</option>`;
    els.friendsList.innerHTML = `<p class="status">${t('friendsEmpty')}</p>`;
  }
}

async function copyInvite() {
  if (!state.inviteUrl) return;
  try {
    await navigator.clipboard.writeText(state.inviteUrl);
    setStatus(t('inviteCopied'));
  } catch {
    els.inviteUrl.select();
    document.execCommand('copy');
    setStatus(t('inviteCopied'));
  }
}

async function shareInvite() {
  if (!state.inviteUrl) return;
  const text = state.settings.language === 'ru' ? 'Сыграй со мной в шахматы в Chess Arena' : 'Play chess with me in Chess Arena';
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Chess Arena', text, url: state.inviteUrl });
      setStatus(t('inviteShared'));
      return;
    } catch {
      // Fall back to clipboard below.
    }
  }
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(state.inviteUrl)}&text=${encodeURIComponent(text)}`);
    return;
  }
  await copyInvite();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[char]);
}

els.botMode.addEventListener('click', () => setMode('bot'));
els.onlineMode.addEventListener('click', () => setMode('online'));
els.challengeMode.addEventListener('click', () => setMode('challenge'));
els.playButton.addEventListener('click', () => {
  if (state.mode === 'bot') startBotGame();
  else if (state.mode === 'online') startOnlineGame();
  else startChallengeInvite();
});
els.copyInviteButton.addEventListener('click', copyInvite);
els.shareInviteButton.addEventListener('click', shareInvite);
els.backToSetupButton.addEventListener('click', () => {
  showSetupScreen();
  setStatus(state.game?.status === 'playing' ? t('stillOpen') : t('chooseMode'));
});
els.resignButton.addEventListener('click', resignGame);
els.promotionOptions.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-piece]');
  if (!button || !state.promotion) return;

  const { from, to } = state.promotion;
  const promotion = button.dataset.piece;
  hidePromotionChoice();
  await makeMove(from, to, promotion);
});
els.promotionModal.addEventListener('click', (event) => {
  if (event.target === els.promotionModal) hidePromotionChoice();
});

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((item) => item.classList.remove('active'));
    document.querySelectorAll('.tab-view').forEach((view) => view.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`#${tab.dataset.tab}View`).classList.add('active');
    if (tab.dataset.tab === 'friends') loadFriends();
  });
});

els.friendsList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-challenge-user]');
  if (!button) return;
  setMode('challenge');
  els.friendSelect.value = button.dataset.challengeUser;
  sendDirectChallenge(button.dataset.challengeUser);
});

els.languageSelect.addEventListener('change', () => {
  state.settings.language = els.languageSelect.value;
  saveSettings();
  applySettings();
  loadLeaderboard();
  if (state.mode === 'challenge') loadFriends();
  setStatus(t('chooseMode'));
});

els.boardThemeSelect.addEventListener('change', () => {
  state.settings.boardTheme = els.boardThemeSelect.value;
  saveSettings();
  applySettings();
});

els.pieceStyleSelect.addEventListener('change', () => {
  state.settings.pieceStyle = els.pieceStyleSelect.value;
  saveSettings();
  applySettings();
});

els.botRatingInput.addEventListener('input', () => {
  state.settings.botRating = clamp(els.botRatingInput.value, 200, 3000);
  saveSettings();
  applySettings();
  setStatus(t('botRatingStatus', { rating: state.settings.botRating }));
});

els.colorChoiceSelect.addEventListener('change', () => {
  state.settings.colorChoice = els.colorChoiceSelect.value;
  saveSettings();
  applySettings();
});

els.timeControlSelect.addEventListener('change', () => {
  state.settings.timeControl = els.timeControlSelect.value;
  saveSettings();
  applySettings();
  setStatus(t('timeMode', { mode: els.timeControlSelect.options[els.timeControlSelect.selectedIndex].text }));
});

els.coordinatesToggle.addEventListener('change', () => {
  state.settings.coordinates = els.coordinatesToggle.checked;
  saveSettings();
  applySettings();
  renderBoard();
});

els.moveDotsToggle.addEventListener('change', () => {
  state.settings.moveDots = els.moveDotsToggle.checked;
  saveSettings();
  applySettings();
});

applySettings();
renderBoard();
loadMe();
loadLeaderboard();
loadFriends();
acceptIncomingChallenge();

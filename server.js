// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { Pool } = require('pg');

let pgPool = null;
if (process.env.DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
  });
}

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// ─── QUESTION BANKS ────────────────────────────────────────────────────────

const QUESTION_BANKS = {
  'trivia-world-history': [
    { q: 'What year did the Berlin Wall fall?', a: '1989' },
    { q: 'Who was the first Emperor of Rome?', a: 'augustus' },
    { q: 'What ancient wonder was located in Alexandria?', a: 'lighthouse' },
    { q: 'Which country was Napoleon Bonaparte born in?', a: 'france' },
    { q: 'What year did World War I begin?', a: '1914' },
    { q: 'Who wrote the Declaration of Independence?', a: 'thomas jefferson' },
    { q: 'What empire was ruled by Genghis Khan?', a: 'mongol' },
    { q: 'In what city was the Titanic built?', a: 'belfast' },
    { q: 'What country did the Ottoman Empire originate from?', a: 'turkey' },
    { q: 'Who was the first woman to win a Nobel Prize?', a: 'marie curie' },
  ],
  'trivia-pop-culture': [
    { q: 'What movie features the line "You had me at hello"?', a: 'jerry maguire' },
    { q: 'Which band sang Bohemian Rhapsody?', a: 'queen' },
    { q: "What is the name of Simba's father in The Lion King?", a: 'mufasa' },
    { q: 'Which TV show features Walter White?', a: 'breaking bad' },
    { q: 'What year was the first iPhone released?', a: '2007' },
    { q: 'Who played Iron Man in the Marvel films?', a: 'robert downey jr' },
    { q: 'What is the best-selling video game of all time?', a: 'minecraft' },
    { q: 'Which artist painted the Sistine Chapel ceiling?', a: 'michelangelo' },
    { q: 'What show is set in Hawkins Indiana?', a: 'stranger things' },
    { q: 'Who wrote the Harry Potter series?', a: 'jk rowling' },
  ],
  'trivia-science': [
    { q: 'What planet is closest to the sun?', a: 'mercury' },
    { q: 'What gas do plants absorb from the air?', a: 'carbon dioxide' },
    { q: 'What is the chemical symbol for gold?', a: 'au' },
    { q: 'How many bones are in the adult human body?', a: '206' },
    { q: 'What is the powerhouse of the cell?', a: 'mitochondria' },
    { q: 'What force keeps planets in orbit around the sun?', a: 'gravity' },
    { q: 'What is the atomic number of carbon?', a: '6' },
    { q: 'What is the fastest land animal?', a: 'cheetah' },
    { q: 'What organ produces insulin?', a: 'pancreas' },
    { q: 'What is the hardest natural substance on Earth?', a: 'diamond' },
  ],
  'trivia-music': [
    { q: 'How many strings does a standard guitar have?', a: '6' },
    { q: 'What is the highest female singing voice called?', a: 'soprano' },
    { q: 'Which composer wrote the Four Seasons?', a: 'vivaldi' },
    { q: 'What instrument does a pianist play?', a: 'piano' },
    { q: 'Which band was Freddie Mercury the lead singer of?', a: 'queen' },
    { q: 'How many keys does a standard piano have?', a: '88' },
    { q: 'What decade did hip hop originate?', a: '1970s' },
    { q: 'What is the term for a musical piece for one performer?', a: 'solo' },
    { q: 'Which country does reggae music come from?', a: 'jamaica' },
    { q: 'What does BPM stand for in music?', a: 'beats per minute' },
  ],
};

// ─── GAMES CATALOG ─────────────────────────────────────────────────────────

const GAMES_CATALOG = [
  {
    category: 'Trivia',
    games: [
      { id: 'trivia-world-history', name: 'World History',    emoji: '🌍', available: true },
      { id: 'trivia-pop-culture',   name: 'Pop Culture',      emoji: '🎬', available: true },
      { id: 'trivia-science',       name: 'Science & Nature', emoji: '🔬', available: true },
      { id: 'trivia-music',         name: 'Music',            emoji: '🎵', available: true },
    ],
  },
  {
    category: 'Word Games',
    games: [
      { id: 'word-association', name: 'Word Association',  emoji: '🔤', available: false },
      { id: 'finish-the-lyric', name: 'Finish the Lyric',  emoji: '📝', available: false },
    ],
  },
  {
    category: 'Drawing',
    games: [
      { id: 'sketch-guess', name: 'Sketch & Guess', emoji: '✏️', available: false },
    ],
  },
];

// ─── IN-MEMORY STORE ───────────────────────────────────────────────────────

const rooms = {};

// ─── HELPERS ───────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).substring(2, 8);
}

function sanitizeQuestion(game) {
  if (!game) return null;
  return {
    index: game.currentIndex,
    total: game.questions.length,
    question: game.questions[game.currentIndex].q,
  };
}

function namesMatch(a, b) {
  return (
    a &&
    b &&
    String(a).toLowerCase().trim() === String(b).toLowerCase().trim()
  );
}

function normalizeMemberKey(raw) {
  if (typeof raw !== 'string') return null;
  const t = raw.trim();
  if (!t || t.length > 128) return null;
  return t;
}

/** Client payloads must never receive internal memberKey (session identity). */
function publicMembers(members) {
  return members.map((m) => ({ id: m.id, name: m.name }));
}

/** Reconnect: same display name + same memberKey, or adopt legacy row with no key. */
function rosterRowMatchesRoomMember(row, roomMember) {
  if (!namesMatch(row.name, roomMember.name)) return false;
  const rk = row.memberKey ?? null;
  const mk = roomMember.memberKey ?? null;
  if (mk && rk) return rk === mk;
  if (!rk && mk) return true;
  if (!rk && !mk) return true;
  return false;
}

function buildInviteCard(game, room) {
  const hostFromMember =
    game.hostId && room.members.find((m) => m.id === game.hostId)?.name;
  if (!game.hostName && game.participants[0]?.name) {
    game.hostName = game.participants[0].name;
  }
  return {
    type: 'game-invite',
    gameId: game.id,
    gameType: game.gameType,
    gameName: game.gameName,
    gameEmoji: game.gameEmoji,
    status: game.status,
    hostName: hostFromMember || game.hostName || 'Someone',
    participants: game.participants.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
    })),
    spectators: game.spectators.map((s) => ({ id: s.id, name: s.name })),
    finalScores: game.finalScores,
    ts: game.inviteTs,
  };
}

function broadcastInviteCard(io, room, game) {
  const card = buildInviteCard(game, room);
  const idx = room.chat.findIndex(
    (m) => m.type === 'game-invite' && m.gameId === game.id
  );
  if (idx !== -1) room.chat[idx] = card;
  io.to(room.id).emit('game:card:update', card);
}

function gameRoom(roomId, gameId) {
  return `game:${roomId}:${gameId}`;
}

/** Drop room.members rows whose sockets are gone (fixes fast refresh racing new join vs old disconnect). */
function pruneStaleRoomMembers(io, room) {
  if (!room?.members?.length) return;
  room.members = room.members.filter((m) => {
    const sock = io.sockets.sockets.get(m.id);
    return sock && sock.connected;
  });
}

function findMemberGame(room, socketId, playerName, memberKey) {
  return (
    room.games.find((g) => {
      if (g.status !== 'waiting' && g.status !== 'active') return false;
      if (g.participants.some((p) => p.id === socketId)) return true;
      if (g.spectators.some((s) => s.id === socketId)) return true;
      if (playerName && memberKey) {
        if (
          g.participants.some(
            (p) =>
              p.id == null &&
              namesMatch(p.name, playerName) &&
              p.memberKey === memberKey
          )
        )
          return true;
        if (
          g.spectators.some(
            (s) =>
              s.id == null &&
              namesMatch(s.name, playerName) &&
              s.memberKey === memberKey
          )
        )
          return true;
      }
      return false;
    }) ?? null
  );
}

function isSocketInGame(game, socketId) {
  return (
    game.participants.some((p) => p.id === socketId) ||
    game.spectators.some((s) => s.id === socketId)
  );
}

function clearGameTimer(game) {
  if (game?.timer) {
    clearInterval(game.timer);
    game.timer = null;
  }
}

function normalizeAnswer(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}

function getAnswerMatch(submittedRaw, correctRaw) {
  const submitted = normalizeAnswer(submittedRaw);
  const correct = normalizeAnswer(correctRaw);

  if (!submitted || !correct) return { matched: false, mode: 'none' };
  if (submitted === correct) return { matched: true, mode: 'exact' };

  // Treat decade shorthand as equivalent (e.g. "70s" <-> "1970s" <-> "1970").
  const decadePattern = /^(\d{2,4})s?$/;
  const toDecadeYear = (value) => {
    const match = value.match(decadePattern);
    if (!match) return null;
    let year = match[1];
    if (year.length === 2) year = `19${year}`;
    if (year.length === 3) year = `1${year}`;
    if (year.length !== 4) return null;
    return year;
  };

  const submittedDecade = toDecadeYear(submitted);
  const correctDecade = toDecadeYear(correct);
  if (submittedDecade && correctDecade && submittedDecade === correctDecade) {
    return { matched: true, mode: 'fuzzy' };
  }

  // Keep number-only answers strict to avoid accidental scoring.
  if (/^\d+$/.test(correct)) {
    return { matched: submitted === correct, mode: submitted === correct ? 'exact' : 'none' };
  }

  // Damerau-Levenshtein style adjustment:
  // treat a single adjacent letter swap as one typo (e.g. "jamiaca").
  let distance = levenshteinDistance(submitted, correct);
  if (distance > 1 && submitted.length === correct.length) {
    for (let i = 0; i < submitted.length - 1; i += 1) {
      if (
        submitted[i] === correct[i + 1] &&
        submitted[i + 1] === correct[i] &&
        submitted.slice(0, i) === correct.slice(0, i) &&
        submitted.slice(i + 2) === correct.slice(i + 2)
      ) {
        distance = 1;
        break;
      }
    }
  }

  const maxLen = Math.max(submitted.length, correct.length);

  let maxDistance = 1;
  if (maxLen >= 5) maxDistance = 2;
  if (maxLen >= 9) maxDistance = 3;
  if (maxLen >= 14) maxDistance = 4;

  if (distance <= maxDistance) {
    return { matched: true, mode: 'fuzzy' };
  }

  return { matched: false, mode: 'none' };
}

function transferHost(game, room, io) {
  const connected = game.participants.filter(
    (p) => p.id != null && io.sockets.sockets.get(p.id)?.connected
  );
  if (connected.length === 0) {
    game.hostId = null;
    return null;
  }
  game.hostId = connected[0].id;
  game.hostName = connected[0].name;
  return room.members.find((m) => m.id === game.hostId) ?? null;
}

// ─── TIMER + ROUND LOGIC ───────────────────────────────────────────────────

const QUESTION_TIME = 20;
const NEXT_DELAY = 3000;

function advanceRound(io, room, game) {
  if (game.roundTransitioning) return;
  game.roundTransitioning = true;

  clearGameTimer(game);

  const isLastQuestion = game.currentIndex >= game.questions.length - 1;

  if (isLastQuestion) {
    game.status = 'finished';
    game.roundTransitioning = false;
    game.finalScores = [...game.participants]
      .sort((a, b) => b.score - a.score)
      .map((p) => ({ id: p.id, name: p.name, score: p.score }));

    broadcastInviteCard(io, room, game);

    io.to(gameRoom(room.id, game.id)).emit('game:over', {
      gameId: game.id,
      players: game.finalScores,
    });
    return;
  }

  setTimeout(() => {
    if (game.status !== 'active') return;

    game.currentIndex += 1;
    game.answered = false;
    game.roundTransitioning = false;
    game.timeLeft = QUESTION_TIME;

    io.to(gameRoom(room.id, game.id)).emit('game:question', {
      gameId: game.id,
      ...sanitizeQuestion(game),
    });

    startTimer(io, room, game);
  }, NEXT_DELAY);
}

function startTimer(io, room, game) {
  clearGameTimer(game);
  game.timeLeft = QUESTION_TIME;

  game.timer = setInterval(() => {
    if (game.status !== 'active') {
      clearGameTimer(game);
      return;
    }

    game.timeLeft -= 1;

    io.to(gameRoom(room.id, game.id)).emit('game:timer', {
      gameId: game.id,
      timeLeft: game.timeLeft,
    });

    if (game.timeLeft <= 0) {
      if (!game.answered) {
        const currentQ = game.questions[game.currentIndex];
        io.to(gameRoom(room.id, game.id)).emit('game:correct', {
          gameId: game.id,
          playerName: null,
          answer: currentQ.a,
          scores: game.participants,
        });
      }
      advanceRound(io, room, game);
    }
  }, 1000);
}

// ─── SERVER BOOT ───────────────────────────────────────────────────────────

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: '*' },
  });

  global.io = io;

  if (pgPool) {
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          return next(new Error('Authentication required'));
        }
        const secret =
          process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
        if (!secret) {
          return next(new Error('Server misconfigured'));
        }
        const { decode } = await import('@auth/core/jwt');
        const salts = [
          '__Secure-authjs.session-token',
          'authjs.session-token',
        ];
        let payload = null;
        for (const salt of salts) {
          try {
            payload = await decode({ token, secret, salt });
            if (payload) break;
          } catch {
            /* try next salt */
          }
        }
        if (!payload?.name) {
          return next(new Error('Invalid or expired session'));
        }
        socket.data.userId = payload.sub;
        socket.data.playerName = payload.name;
        next();
      } catch {
        next(new Error('Auth error'));
      }
    });
  }

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // ── ROOM ──────────────────────────────────────────────

    socket.on('room:create', ({ playerName }, callback) => {
      const roomId = generateId();
      rooms[roomId] = {
        id: roomId,
        members: [],
        chat: [],
        games: [],
      };
      console.log(`Room created: ${roomId}`);
      callback({ roomId });
    });

    socket.on('room:join', async ({ roomId, memberKey: memberKeyRaw, playerName: legacyPlayerName }, callback) => {
      let room = rooms[roomId];
      if (!room && pgPool) {
        try {
          const { rows } = await pgPool.query(
            'SELECT id FROM rooms WHERE id = $1',
            [roomId]
          );
          if (rows.length > 0) {
            rooms[roomId] = {
              id: roomId,
              members: [],
              chat: [],
              games: [],
            };
            room = rooms[roomId];
          }
        } catch (e) {
          console.error('[room:join] ensure room from DB failed', e);
        }
      }
      if (!room) {
        callback({ error: 'room_not_found', message: 'Room not found' });
        return;
      }

      const playerName = pgPool
        ? socket.data.playerName
        : legacyPlayerName;
      if (!playerName) {
        callback({
          error: 'auth_required',
          message: 'Authentication required',
        });
        return;
      }

      pruneStaleRoomMembers(io, room);

      const memberKey = normalizeMemberKey(memberKeyRaw);

      // Case-insensitive name collision check
      const nameTaken = room.members.some(
        (m) =>
          m.name.toLowerCase() === playerName.toLowerCase() &&
          m.id !== socket.id
      );

      if (nameTaken) {
        callback({
          error: 'name_taken',
          message:
            'Someone in this room is already using that name. Try a nickname or add something to make it unique.',
        });
        return;
      }

      // Same socket re-calling room:join (React effect re-runs, Strict Mode, etc.) —
      // still refresh membership, but only announce "joined" the first time.
      const alreadyInRoomAsThisSocket = room.members.some(
        (m) => m.id === socket.id
      );

      // Remove stale entry for same socket (refresh)
      room.members = room.members.filter((m) => m.id !== socket.id);

      const member = { id: socket.id, name: playerName, memberKey };
      room.members.push(member);

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerName = playerName;
      socket.data.memberKey = memberKey;

      const gameChats = {};
      room.games.forEach((g) => {
        const inAs =
          g.participants.some(
            (p) =>
              p.id === socket.id ||
              (p.id == null && rosterRowMatchesRoomMember(p, member))
          ) ||
          g.spectators.some(
            (s) =>
              s.id === socket.id ||
              (s.id == null && rosterRowMatchesRoomMember(s, member))
          );
        if (inAs) gameChats[g.id] = g.gameChat ?? [];
      });

      callback({
        success: true,
        room: {
          id: room.id,
          members: publicMembers(room.members),
          chat: room.chat,
          games: room.games.map((g) => buildInviteCard(g, room)),
        },
        gameChats,
        catalog: GAMES_CATALOG,
      });

      io.to(roomId).emit('room:members', publicMembers(room.members));
      if (!alreadyInRoomAsThisSocket) {
        io.to(roomId).emit('chat:message', {
          type: 'system',
          text: `${playerName} joined`,
          ts: Date.now(),
        });
      }

      // Re-subscribe to games on refresh (soft-disconnect slots use id: null until re-linked)
      room.games.forEach((g) => {
        const isParticipant = g.participants.some((p) =>
          rosterRowMatchesRoomMember(p, member)
        );
        const isSpectator = g.spectators.some((s) =>
          rosterRowMatchesRoomMember(s, member)
        );

        if (isParticipant || isSpectator) {
          if (isParticipant) {
            const p = g.participants.find((p) =>
              rosterRowMatchesRoomMember(p, member)
            );
            if (p) {
              p.id = socket.id;
              if (memberKey && !p.memberKey) p.memberKey = memberKey;
            }
          }
          if (isSpectator) {
            const s = g.spectators.find((s) =>
              rosterRowMatchesRoomMember(s, member)
            );
            if (s) {
              s.id = socket.id;
              if (memberKey && !s.memberKey) s.memberKey = memberKey;
            }
          }

          if (
            g.hostId == null &&
            g.hostName &&
            namesMatch(g.hostName, playerName)
          ) {
            g.hostId = socket.id;
          }

          socket.join(gameRoom(roomId, g.id));
          if (g.status === 'active') {
            socket.emit('game:question', { gameId: g.id, ...sanitizeQuestion(g) });
            socket.emit('game:timer', { gameId: g.id, timeLeft: g.timeLeft });
          }
        }
      });

      if (!alreadyInRoomAsThisSocket) {
        console.log(`${playerName} joined room ${roomId}`);
      }
    });

    socket.on('disconnect', () => {
      const { roomId, playerName } = socket.data;
      if (!roomId || !rooms[roomId]) return;

      const room = rooms[roomId];

      // Soft disconnect: keep game roster rows, clear socket ids (refresh / tab close)
      room.games.forEach((game) => {
        if (game.status !== 'waiting' && game.status !== 'active') return;

        const wasHost = game.hostId === socket.id;
        const participant = game.participants.find((p) => p.id === socket.id);
        const spectator = game.spectators.find((s) => s.id === socket.id);

        if (!participant && !spectator) return;

        if (participant) participant.id = null;
        if (spectator) spectator.id = null;

        if (wasHost) {
          transferHost(game, room, io);
        }

        const anyConnected = game.participants.some(
          (p) => p.id != null && io.sockets.sockets.get(p.id)?.connected
        );
        if (!anyConnected && game.participants.length > 0 && game.status === 'active') {
          clearGameTimer(game);
          game.status = 'ended';
          game.finalScores = [];
          broadcastInviteCard(io, room, game);
          io.to(gameRoom(room.id, game.id)).emit('game:ended', {
            gameId: game.id,
            reason: 'All players disconnected',
            finalScores: [],
          });
          return;
        }

        broadcastInviteCard(io, room, game);
      });

      room.members = room.members.filter((m) => m.id !== socket.id);

      io.to(roomId).emit('room:members', publicMembers(room.members));
      io.to(roomId).emit('chat:message', {
        type: 'system',
        text: `${playerName} left`,
        ts: Date.now(),
      });

      if (room.members.length === 0) {
        const keepForReconnect = room.games.some(
          (g) => g.status === 'waiting' || g.status === 'active'
        );
        if (!keepForReconnect) {
          room.games.forEach((g) => clearGameTimer(g));
          delete rooms[roomId];
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    });

    // ── CHAT ──────────────────────────────────────────────

    socket.on('chat:message', ({ roomId, text }) => {
      const room = rooms[roomId];
      if (!room) return;

      const message = {
        type: 'message',
        name: socket.data.playerName,
        text: text.trim(),
        ts: Date.now(),
      };

      room.chat.push(message);
      if (room.chat.length > 100) room.chat.shift();

      io.to(roomId).emit('chat:message', message);
    });

    socket.on('game:chat:message', ({ roomId, gameId, text }) => {
      const room = rooms[roomId];
      if (!room) return;

      const game = room.games.find((g) => g.id === gameId);
      if (!game) return;
      if (!isSocketInGame(game, socket.id)) return;

      const trimmed = String(text ?? '').trim();
      if (!trimmed) return;

      if (!game.gameChat) game.gameChat = [];

      const message = {
        type: 'message',
        name: socket.data.playerName,
        text: trimmed,
        ts: Date.now(),
      };

      game.gameChat.push(message);
      if (game.gameChat.length > 100) game.gameChat.shift();

      io.to(gameRoom(roomId, gameId)).emit('game:chat:message', {
        gameId,
        ...message,
      });
    });

    // ── GAME LIFECYCLE ─────────────────────────────────────

    socket.on('game:create', ({ roomId, gameTypeId }, callback) => {
      const room = rooms[roomId];
      if (!room) { callback({ error: 'Room not found' }); return; }

      let gameMeta = null;
      for (const cat of GAMES_CATALOG) {
        const found = cat.games.find((g) => g.id === gameTypeId && g.available);
        if (found) { gameMeta = found; break; }
      }
      if (!gameMeta) { callback({ error: 'Game not available' }); return; }

      const existingGame = findMemberGame(
        room,
        socket.id,
        socket.data.playerName,
        socket.data.memberKey
      );
      if (existingGame) {
        callback({ error: 'Already in a game', gameId: existingGame.id });
        return;
      }

      const questions = [...(QUESTION_BANKS[gameTypeId] ?? [])].sort(
        () => Math.random() - 0.5
      );
      if (questions.length === 0) {
        callback({ error: 'No questions found for this game' });
        return;
      }

      const creator = room.members.find((m) => m.id === socket.id);

      const game = {
        id: generateId(),
        gameType: gameTypeId,
        gameName: gameMeta.name,
        gameEmoji: gameMeta.emoji,
        status: 'waiting',
        hostId: socket.id,
        hostName: creator.name,
        participants: [{ ...creator, score: 0 }],
        spectators: [],
        questions,
        currentIndex: 0,
        answered: false,
        roundTransitioning: false,
        timeLeft: QUESTION_TIME,
        timer: null,
        finalScores: [],
        inviteTs: Date.now(),
        gameChat: [],
      };

      room.games.push(game);
      socket.join(gameRoom(roomId, game.id));

      const card = buildInviteCard(game, room);
      room.chat.push(card);
      io.to(roomId).emit('chat:message', card);

      callback({
        success: true,
        gameId: game.id,
        gameName: game.gameName,
        gameChat: game.gameChat ?? [],
      });
      console.log(`Game created: ${game.gameName} in room ${roomId}`);
    });

    socket.on('game:join', ({ roomId, gameId }, callback) => {
      const room = rooms[roomId];
      if (!room) { callback?.({ error: 'Room not found' }); return; }

      const game = room.games.find((g) => g.id === gameId);
      if (!game) { callback?.({ error: 'Game not found' }); return; }
      if (game.status !== 'waiting') {
        callback?.({ error: 'Game already started' });
        return;
      }

      const existingGame = findMemberGame(
        room,
        socket.id,
        socket.data.playerName,
        socket.data.memberKey
      );
      if (existingGame && existingGame.id !== gameId) {
        callback?.({ error: 'Already in a game', gameId: existingGame.id });
        return;
      }

      const member = room.members.find((m) => m.id === socket.id);
      if (!member) return;

      game.spectators = game.spectators.filter(
        (s) =>
          s.id !== socket.id &&
          !(s.id == null && rosterRowMatchesRoomMember(s, member))
      );

      let slot = game.participants.find((p) => p.id === socket.id);
      if (!slot) {
        slot = game.participants.find(
          (p) => p.id == null && rosterRowMatchesRoomMember(p, member)
        );
        if (slot) {
          slot.id = socket.id;
          if (member.memberKey && !slot.memberKey) slot.memberKey = member.memberKey;
        }
      }
      if (!slot) {
        game.participants.push({
          id: member.id,
          name: member.name,
          memberKey: member.memberKey,
          score: 0,
        });
      }

      socket.join(gameRoom(roomId, gameId));
      broadcastInviteCard(io, room, game);
      callback?.({ success: true, gameChat: game.gameChat ?? [] });
    });

    socket.on('game:spectate', ({ roomId, gameId }, callback) => {
      const room = rooms[roomId];
      if (!room) { callback?.({ error: 'Room not found' }); return; }

      const game = room.games.find((g) => g.id === gameId);
      if (!game) { callback?.({ error: 'Game not found' }); return; }
      if (game.status !== 'waiting') {
        callback?.({ error: 'Game already started' });
        return;
      }

      const existingGame = findMemberGame(
        room,
        socket.id,
        socket.data.playerName,
        socket.data.memberKey
      );
      if (existingGame && existingGame.id !== gameId) {
        callback?.({ error: 'Already in a game', gameId: existingGame.id });
        return;
      }

      const member = room.members.find((m) => m.id === socket.id);
      if (!member) return;

      game.participants = game.participants.filter(
        (p) =>
          p.id !== socket.id &&
          !(p.id == null && rosterRowMatchesRoomMember(p, member))
      );
      if (game.hostId === socket.id) transferHost(game, room, io);

      let watch = game.spectators.find((s) => s.id === socket.id);
      if (!watch) {
        watch = game.spectators.find(
          (s) => s.id == null && rosterRowMatchesRoomMember(s, member)
        );
        if (watch) {
          watch.id = socket.id;
          if (member.memberKey && !watch.memberKey) watch.memberKey = member.memberKey;
        }
      }
      if (!watch) {
        game.spectators.push({
          id: member.id,
          name: member.name,
          memberKey: member.memberKey,
        });
      }

      socket.join(gameRoom(roomId, gameId));
      broadcastInviteCard(io, room, game);
      callback?.({ success: true, gameChat: game.gameChat ?? [] });
    });

    socket.on('game:start', ({ roomId, gameId }) => {
      const room = rooms[roomId];
      if (!room) return;

      const game = room.games.find((g) => g.id === gameId);
      if (!game || game.status !== 'waiting') return;
      if (game.hostId !== socket.id) return;

      game.status = 'active';
      game.currentIndex = 0;
      game.answered = false;
      game.roundTransitioning = false;
      game.timeLeft = QUESTION_TIME;

      game.spectators.forEach((s) => {
        if (s.id == null) return;
        const sock = io.sockets.sockets.get(s.id);
        if (sock) sock.join(gameRoom(roomId, gameId));
      });

      broadcastInviteCard(io, room, game);

      io.to(gameRoom(roomId, gameId)).emit('game:question', {
        gameId: game.id,
        ...sanitizeQuestion(game),
      });

      startTimer(io, room, game);
      console.log(`Game started: ${game.gameName} in room ${roomId}`);
    });

    socket.on('game:answer', ({ roomId, gameId, answer }) => {
      const room = rooms[roomId];
      if (!room) return;

      const game = room.games.find((g) => g.id === gameId);
      if (!game || game.status !== 'active') return;
      if (game.answered) return;

      const participant = game.participants.find((p) => p.id === socket.id);
      if (!participant) return;

      const currentQ = game.questions[game.currentIndex];
      const match = getAnswerMatch(answer, currentQ.a);
      if (!match.matched) {
        socket.emit('game:wrong', { gameId });
        return;
      }

      game.answered = true;
      participant.score += 1;

      io.to(gameRoom(roomId, gameId)).emit('game:correct', {
        gameId,
        playerName: socket.data.playerName,
        answer: currentQ.a,
        acceptedBy: match.mode,
        scores: game.participants,
      });

      advanceRound(io, room, game);
    });

    socket.on('game:panel:close', ({ roomId, gameId }) => {
      // Client closes the panel — stays in game server-side, nothing to do here
    });

    socket.on('game:leave', ({ roomId, gameId }, callback) => {
      const room = rooms[roomId];
      if (!room) return;

      const game = room.games.find((g) => g.id === gameId);
      if (!game) return;

      const wasHost = game.hostId === socket.id;

      game.participants = game.participants.filter((p) => p.id !== socket.id);
      game.spectators   = game.spectators.filter((s) => s.id !== socket.id);

      socket.leave(gameRoom(roomId, gameId));

      if (wasHost && game.participants.length > 0) {
        transferHost(game, room, io);
      }

      const anyStillListed = game.participants.length > 0;
      if (!anyStillListed && game.status === 'active') {
        clearGameTimer(game);
        game.status = 'ended';
        game.finalScores = [];
        broadcastInviteCard(io, room, game);
        io.to(gameRoom(room.id, game.id)).emit('game:ended', {
          gameId: game.id,
          reason: 'No players remaining',
          finalScores: [],
        });
        callback?.({ success: true });
        return;
      }

      broadcastInviteCard(io, room, game);
      callback?.({ success: true });
    });

    socket.on('game:end', ({ roomId, gameId }, callback) => {
      const room = rooms[roomId];
      if (!room) return;

      const game = room.games.find((g) => g.id === gameId);
      if (!game) return;
      if (game.hostId !== socket.id) return;

      clearGameTimer(game);
      game.status = 'ended';
      game.finalScores = [...game.participants]
        .sort((a, b) => b.score - a.score)
        .map((p) => ({ id: p.id, name: p.name, score: p.score }));

      broadcastInviteCard(io, room, game);

      io.to(gameRoom(room.id, game.id)).emit('game:ended', {
        gameId: game.id,
        reason: 'Ended by host',
        finalScores: game.finalScores,
      });

      callback?.({ success: true });
      console.log(`Game ended by host: ${game.gameName} in room ${roomId}`);
    });

    socket.on('game:restart', ({ roomId, gameId }) => {
      const room = rooms[roomId];
      if (!room) return;

      const game = room.games.find((g) => g.id === gameId);
      if (!game) return;
      if (game.hostId !== socket.id) return;
      if (game.status !== 'finished' && game.status !== 'ended') return;

      const questions = [...(QUESTION_BANKS[game.gameType] ?? [])].sort(
        () => Math.random() - 0.5
      );

      game.questions     = questions;
      game.status        = 'active';
      game.currentIndex  = 0;
      game.answered      = false;
      game.roundTransitioning = false;
      game.timeLeft      = QUESTION_TIME;
      game.finalScores   = [];
      game.participants.forEach((p) => (p.score = 0));

      [...game.participants, ...game.spectators].forEach((p) => {
        if (p.id == null) return;
        const sock = io.sockets.sockets.get(p.id);
        if (sock) sock.join(gameRoom(roomId, gameId));
      });

      broadcastInviteCard(io, room, game);

      io.to(gameRoom(roomId, gameId)).emit('game:question', {
        gameId: game.id,
        ...sanitizeQuestion(game),
      });

      startTimer(io, room, game);
    });
  });

  const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`> Ready on port ${PORT}`);
});
});

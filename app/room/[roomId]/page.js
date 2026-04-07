// app/room/[roomId]/page.js
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSocket } from '../../../lib/socket';
import { getOrCreateMemberKey } from '../../../lib/memberKey';
import TopBar from './components/TopBar';
import RejoinBanner from './components/RejoinBanner';
import GameMenu from './components/GameMenu';
import ChatView from './components/ChatView';
import GamePanel from './components/GamePanel';

const DEFAULT_FEEDBACK = { state: null, locked: false };
const NEXT_QUESTION_DELAY_SECONDS = 3;
const QUESTION_TIME_SECONDS = 20;

export default function RoomPage() {
  const params = useParams();
  const roomIdRaw = params?.roomId;
  const roomId = Array.isArray(roomIdRaw) ? roomIdRaw[0] : roomIdRaw;
  const router     = useRouter();

  // ── Room state ─────────────────────────────────────────
  const [members, setMembers]   = useState([]);
  const [chat, setChat]         = useState([]);
  const [catalog, setCatalog]   = useState([]);
  const [joined, setJoined]     = useState(false);
  const [myName, setMyName]     = useState('');

  // ── Game menu ──────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Active game tracking ───────────────────────────────
  const [myGameId, setMyGameId]       = useState(null);
  const [myGameName, setMyGameName]   = useState('');
  const [myGameEmoji, setMyGameEmoji] = useState('');
  const [gameOpen, setGameOpen]       = useState(false);
  const [gameCards, setGameCards]     = useState({});

  // ── In-panel game state ────────────────────────────────
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [feedback, setFeedback] = useState(DEFAULT_FEEDBACK);
  const [gameOver, setGameOver] = useState(null);
  const [successEventId, setSuccessEventId] = useState(0);
  const [gameChatMessages, setGameChatMessages] = useState([]);

  const myNameRef        = useRef('');
  const myGameIdRef      = useRef(null);
  const wrongTimer       = useRef(null);
  const nextQuestionTimer = useRef(null);
  const [nextQuestionIn, setNextQuestionIn] = useState(null);

  useEffect(() => { myGameIdRef.current = myGameId; }, [myGameId]);

  useEffect(() => {
    if (!roomId) return;

    const name = sessionStorage.getItem('playerName');
    if (!name) { router.push('/'); return; }

    setMyName(name);
    myNameRef.current = name;

    const socket = getSocket();
    let cancelled = false;

    function onJoinAck(res) {
      if (cancelled || !res) return;
      if (res.error === 'name_taken') { alert(res.message); router.push('/'); return; }
      if (res.error) { alert('Could not join room.'); router.push('/'); return; }

      setMembers(res.room.members);
      setCatalog(res.catalog);

      const initialCards = {};
      res.room.games.forEach((card) => { initialCards[card.gameId] = card; });
      setGameCards(initialCards);
      setChat(res.room.chat);

      let recoveredGameChat = [];

      res.room.games.forEach((card) => {
        const inAs =
          card.participants.some((p) => p.name === name) ? 'participant' :
          card.spectators.some((s) => s.name === name)   ? 'spectator'   : null;
        if (
          inAs &&
          ['waiting', 'active', 'finished', 'ended'].includes(card.status)
        ) {
          setMyGameId(card.gameId);
          myGameIdRef.current = card.gameId;
          setMyGameName(card.gameName);
          setMyGameEmoji(card.gameEmoji);
          recoveredGameChat = res.gameChats?.[card.gameId] ?? [];
        }
      });

      setGameChatMessages(recoveredGameChat);

      setJoined(true);
    }

    function tryJoinRoom() {
      if (cancelled) return;
      socket.emit(
        'room:join',
        { roomId, playerName: name, memberKey: getOrCreateMemberKey() },
        onJoinAck
      );
    }

    socket.on('room:members', setMembers);

    socket.on('chat:message', (message) => {
      if (message.type === 'game-invite') {
        setGameCards((prev) => ({ ...prev, [message.gameId]: message }));
      }
      setChat((prev) => [...prev, message]);
    });

    socket.on('game:card:update', (card) => {
      setGameCards((prev) => ({ ...prev, [card.gameId]: card }));
      setChat((prev) =>
        prev.map((m) =>
          m.type === 'game-invite' && m.gameId === card.gameId ? card : m
        )
      );
      // Keep the ended/finished game attached so the panel can show results/restart.
      if (card.gameId === myGameIdRef.current) {
        setMyGameName(card.gameName);
        setMyGameEmoji(card.gameEmoji);
      }
    });

    socket.on('game:ended', ({ gameId, finalScores }) => {
      if (gameId !== myGameIdRef.current) return;
      clearTimeout(wrongTimer.current);
      clearInterval(nextQuestionTimer.current);
      nextQuestionTimer.current = null;
      setNextQuestionIn(null);
      setQuestion(null);
      setGameOver({ players: finalScores ?? [] });
      setFeedback(DEFAULT_FEEDBACK);
      setGameOpen(true);
    });

    socket.on('game:question', ({ gameId, ...q }) => {
      if (gameId !== myGameIdRef.current) return;
      clearTimeout(wrongTimer.current);
      clearInterval(nextQuestionTimer.current);
      nextQuestionTimer.current = null;
      setNextQuestionIn(null);
      setTimeLeft(QUESTION_TIME_SECONDS);
      setQuestion(q);
      setGameOver(null);
      setFeedback(DEFAULT_FEEDBACK);
    });

    socket.on('game:timer', ({ gameId, timeLeft }) => {
      if (gameId !== myGameIdRef.current) return;
      setTimeLeft(timeLeft);
    });

    socket.on('game:wrong', ({ gameId }) => {
      if (gameId !== myGameIdRef.current) return;
      setFeedback({ state: 'wrong', locked: false });
      clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setFeedback(DEFAULT_FEEDBACK), 1200);
    });

    socket.on('game:correct', ({ gameId, playerName, answer, acceptedBy, scores }) => {
      if (gameId !== myGameIdRef.current) return;
      if (Array.isArray(scores)) {
        const participants = scores.map((p) => ({
          id: p.id,
          name: p.name,
          score: p.score ?? 0,
        }));
        setGameCards((prev) => {
          const card = prev[gameId];
          if (!card) return prev;
          return { ...prev, [gameId]: { ...card, participants } };
        });
        setChat((prev) =>
          prev.map((m) =>
            m.type === 'game-invite' && m.gameId === gameId
              ? { ...m, participants }
              : m
          )
        );
      }
      clearTimeout(wrongTimer.current);
      clearInterval(nextQuestionTimer.current);
      const startedAt = Date.now();
      setSuccessEventId((prev) => prev + 1);
      setNextQuestionIn(NEXT_QUESTION_DELAY_SECONDS);
      nextQuestionTimer.current = setInterval(() => {
        const elapsedSeconds = (Date.now() - startedAt) / 1000;
        const remaining = Math.max(0, NEXT_QUESTION_DELAY_SECONDS - elapsedSeconds);
        setNextQuestionIn(remaining);
        if (remaining <= 0) {
          clearInterval(nextQuestionTimer.current);
          nextQuestionTimer.current = null;
        }
      }, 100);

      const isMe = playerName === myNameRef.current;
      setFeedback({
        state: 'correct',
        locked: true,
        answer,
        acceptedBy,
        winner: isMe ? 'you' : playerName ? 'other' : 'nobody',
        winnerName: playerName,
      });
    });

    socket.on('game:over', ({ gameId, players }) => {
      if (gameId !== myGameIdRef.current) return;
      clearTimeout(wrongTimer.current);
      clearInterval(nextQuestionTimer.current);
      nextQuestionTimer.current = null;
      setNextQuestionIn(null);
      setGameOver({ players });
      setQuestion(null);
      setGameOpen(true);
    });

    socket.on('game:chat:message', (msg) => {
      if (msg.gameId !== myGameIdRef.current) return;
      const { gameId, ...rest } = msg;
      setGameChatMessages((prev) => {
        const last = prev[prev.length - 1];
        const isDuplicateEcho =
          last &&
          last.name === rest.name &&
          last.text === rest.text &&
          Math.abs((last.ts ?? 0) - (rest.ts ?? 0)) < 1500;
        if (isDuplicateEcho) return prev;
        return [...prev, rest];
      });
    });

    if (socket.connected) {
      tryJoinRoom();
    } else {
      socket.once('connect', tryJoinRoom);
    }

    return () => {
      cancelled = true;
      socket.off('connect', tryJoinRoom);
      socket.off('room:members');
      socket.off('chat:message');
      socket.off('game:card:update');
      socket.off('game:ended');
      socket.off('game:question');
      socket.off('game:timer');
      socket.off('game:wrong');
      socket.off('game:correct');
      socket.off('game:over');
      socket.off('game:chat:message');
      clearTimeout(wrongTimer.current);
      clearInterval(nextQuestionTimer.current);
    };
  }, [roomId, router]);

  // ── Handlers ───────────────────────────────────────────

  function handleSendMessage(text) {
    getSocket().emit('chat:message', { roomId, text });
  }

  function handleSendGameChat(text) {
    if (!myGameId) return;
    setGameChatMessages((prev) => [
      ...prev,
      {
        type: 'message',
        name: myNameRef.current,
        text: text.trim(),
        ts: Date.now(),
      },
    ]);
    getSocket().emit('game:chat:message', { roomId, gameId: myGameId, text });
  }

  function handleSelectGame(gameTypeId) {
    setMenuOpen(false);
    const socket = getSocket();

    socket.emit('game:create', { roomId, gameTypeId }, (res) => {
      if (res.error) { alert(res.error); return; }

      let emoji = '🎮';
      catalog.forEach((cat) => {
        const found = cat.games.find((g) => g.id === gameTypeId);
        if (found) emoji = found.emoji;
      });

      setMyGameId(res.gameId);
      myGameIdRef.current = res.gameId;
      setMyGameName(res.gameName);
      setMyGameEmoji(emoji);
      setQuestion(null);
      setGameOver(null);
      setFeedback(DEFAULT_FEEDBACK);
      setGameChatMessages(res.gameChat ?? []);
      setGameOpen(true);
    });
  }

  function handleJoinGame(gameId) {
    const card = gameCards[gameId];
    if (!card) return;

    getSocket().emit('game:join', { roomId, gameId }, (res) => {
      if (res?.error) { alert(res.error); return; }
      setMyGameId(gameId);
      myGameIdRef.current = gameId;
      setMyGameName(card.gameName);
      setMyGameEmoji(card.gameEmoji);
      setQuestion(null);
      setGameOver(null);
      setFeedback(DEFAULT_FEEDBACK);
      setGameChatMessages(res.gameChat ?? []);
      setGameOpen(true);
    });
  }

  function handleSpectateGame(gameId) {
    const card = gameCards[gameId];
    if (!card) return;

    getSocket().emit('game:spectate', { roomId, gameId }, (res) => {
      if (res?.error) { alert(res.error); return; }
      setMyGameId(gameId);
      myGameIdRef.current = gameId;
      setMyGameName(card.gameName);
      setMyGameEmoji(card.gameEmoji);
      setQuestion(null);
      setGameOver(null);
      setFeedback(DEFAULT_FEEDBACK);
      setGameChatMessages(res.gameChat ?? []);
      setGameOpen(true);
    });
  }

  function handleClosePanel() {
    setGameOpen(false);
  }

  function handleRejoin() {
    setGameOpen(true);
  }

  function handleStartGame() {
    getSocket().emit('game:start', { roomId, gameId: myGameId });
  }

  function handleAnswer(answer) {
    getSocket().emit('game:answer', { roomId, gameId: myGameId, answer });
  }

  function handleLeaveGame(gameId) {
    getSocket().emit('game:leave', { roomId, gameId }, (res) => {
      if (res?.error) { alert(res.error); return; }
      setMyGameId(null);
      myGameIdRef.current = null;
      setMyGameName('');
      setMyGameEmoji('');
      setGameOpen(false);
      setQuestion(null);
      setGameOver(null);
      setFeedback(DEFAULT_FEEDBACK);
      setNextQuestionIn(null);
      setGameChatMessages([]);
    });
  }

  function handleEndGame(gameId) {
    getSocket().emit('game:end', { roomId, gameId }, (res) => {
      if (res?.error) { alert(res.error); return; }
      // Wait for game:ended + game:card:update to populate final state UI.
      setQuestion(null);
      setFeedback(DEFAULT_FEEDBACK);
      setNextQuestionIn(null);
      setGameOpen(true);
    });
  }

  function handleRestartGame() {
    getSocket().emit('game:restart', { roomId, gameId: myGameId });
    setQuestion(null);
    setGameOver(null);
    setFeedback(DEFAULT_FEEDBACK);
    setNextQuestionIn(null);
  }

  // ── Derived ────────────────────────────────────────────

  const myActiveCard = myGameId ? gameCards[myGameId] : null;
  const gameIsActive =
    myActiveCard &&
    (myActiveCard.status === 'waiting' || myActiveCard.status === 'active');

  const myRole = myActiveCard
    ? myActiveCard.participants.some((p) => p.name === myName) ? 'participant'
    : myActiveCard.spectators.some((s) => s.name === myName)   ? 'spectator'
    : null
    : null;

  const isHost = Boolean(
    myName &&
    myActiveCard &&
    (myActiveCard.hostName
      ? myActiveCard.hostName.toLowerCase() === myName.toLowerCase()
      : myActiveCard.participants[0]?.name?.toLowerCase() === myName.toLowerCase())
  );

  if (!roomId) {
    return (
      <main className="flex items-center justify-center min-h-dvh bg-zinc-950/10 px-6 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))]">
        <p className="text-violet-200/90 text-sm text-center">
          Invalid room link.{' '}
          <button
            type="button"
            className="text-fuchsia-300 underline underline-offset-2"
            onClick={() => router.push('/')}
          >
            Back to home
          </button>
        </p>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="flex items-center justify-center min-h-dvh bg-zinc-950/10 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-violet-200/90 text-sm">Joining room...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative w-full h-dvh max-h-dvh min-h-0 overflow-hidden bg-zinc-950/10 flex flex-col max-w-lg mx-auto">

      <TopBar
        roomId={roomId}
        memberCount={members.length}
        onGameIconClick={() => setMenuOpen(true)}
      />

      {gameIsActive && !gameOpen && (
        <RejoinBanner
          gameName={myGameName}
          gameEmoji={myGameEmoji}
          onRejoin={handleRejoin}
        />
      )}

      <GameMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        catalog={catalog}
        onSelectGame={handleSelectGame}
        isInGame={Boolean(myGameId && gameIsActive)}
        myGameName={myGameName}
        myGameEmoji={myGameEmoji}
        onRejoin={() => { setMenuOpen(false); handleRejoin(); }}
      />

      <ChatView
        roomId={roomId}
        myName={myName}
        members={members}
        chat={chat}
        gameCards={gameCards}
        onSendMessage={handleSendMessage}
        onJoinGame={handleJoinGame}
        onSpectateGame={handleSpectateGame}
      />

      <GamePanel
        isOpen={gameOpen}
        myName={myName}
        myRole={myRole}
        isHost={isHost}
        card={myActiveCard}
        question={question}
        timeLeft={timeLeft}
        feedback={feedback}
        successEventId={successEventId}
        nextQuestionIn={nextQuestionIn}
        gameOver={gameOver}
        gameChatMessages={gameChatMessages}
        onSendGameChat={handleSendGameChat}
        onClose={handleClosePanel}
        onStart={handleStartGame}
        onAnswer={handleAnswer}
        onLeave={handleLeaveGame}
        onEnd={handleEndGame}
        onRestart={handleRestartGame}
      />

    </div>
  );
}

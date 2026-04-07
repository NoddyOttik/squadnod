// app/room/[roomId]/RoomClient.js
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

export default function RoomClient({ roomId, initialName }) {
  const router     = useRouter();
  const socketRef  = useRef(null);

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
    if (!roomId) return undefined;

    const name = initialName;
    if (!name) {
      router.push('/auth/setup');
      return undefined;
    }

    setMyName(name);
    myNameRef.current = name;

    let cancelled = false;
    let socket = null;
    let tryJoinRoom = () => {};

    fetch('/api/auth/socket-token', { credentials: 'include' })
      .then((tr) => {
        if (!tr.ok) {
          router.push(
            `/auth/register?callbackUrl=${encodeURIComponent(`/room/${roomId}`)}`
          );
          return null;
        }
        return tr.json();
      })
      .then((body) => {
        if (cancelled || !body?.token) return null;
        return getSocket(body.token);
      })
      .then((s) => {
        if (cancelled || !s) return;
        socket = s;
        socketRef.current = s;

        function onJoinAck(res) {
          if (cancelled || !res) return;
          if (res.error === 'name_taken') { alert(res.message); router.push('/groups'); return; }
          if (res.error) { alert('Could not join room.'); router.push('/groups'); return; }

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
              card.spectators.some((x) => x.name === name)   ? 'spectator'   : null;
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

        tryJoinRoom = () => {
          if (cancelled) return;
          s.emit(
            'room:join',
            { roomId, memberKey: getOrCreateMemberKey() },
            onJoinAck
          );
        };

        s.on('room:members', setMembers);

        s.on('chat:message', (message) => {
          if (message.type === 'game-invite') {
            setGameCards((prev) => ({ ...prev, [message.gameId]: message }));
          }
          setChat((prev) => [...prev, message]);
        });

        s.on('game:card:update', (card) => {
          setGameCards((prev) => ({ ...prev, [card.gameId]: card }));
          setChat((prev) =>
            prev.map((m) =>
              m.type === 'game-invite' && m.gameId === card.gameId ? card : m
            )
          );
          if (card.gameId === myGameIdRef.current) {
            setMyGameName(card.gameName);
            setMyGameEmoji(card.gameEmoji);
          }
        });

        s.on('game:ended', ({ gameId, finalScores }) => {
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

        s.on('game:question', ({ gameId, ...q }) => {
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

        s.on('game:timer', ({ gameId, timeLeft: tl }) => {
          if (gameId !== myGameIdRef.current) return;
          setTimeLeft(tl);
        });

        s.on('game:wrong', ({ gameId }) => {
          if (gameId !== myGameIdRef.current) return;
          setFeedback({ state: 'wrong', locked: false });
          clearTimeout(wrongTimer.current);
          wrongTimer.current = setTimeout(() => setFeedback(DEFAULT_FEEDBACK), 1200);
        });

        s.on('game:correct', ({ gameId, playerName, answer, acceptedBy, scores }) => {
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

        s.on('game:over', ({ gameId, players }) => {
          if (gameId !== myGameIdRef.current) return;
          clearTimeout(wrongTimer.current);
          clearInterval(nextQuestionTimer.current);
          nextQuestionTimer.current = null;
          setNextQuestionIn(null);
          setGameOver({ players });
          setQuestion(null);
          setGameOpen(true);
        });

        s.on('game:chat:message', (msg) => {
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

        if (s.connected) {
          tryJoinRoom();
        } else {
          s.once('connect', tryJoinRoom);
        }
      })
      .catch((e) => {
        console.error(e);
      });

    return () => {
      cancelled = true;
      if (socket) {
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
      }
      clearTimeout(wrongTimer.current);
      clearInterval(nextQuestionTimer.current);
    };
  }, [roomId, router, initialName]);

  // ── Handlers ───────────────────────────────────────────

  function handleSendMessage(text) {
    socketRef.current?.emit('chat:message', { roomId, text });
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
    socketRef.current?.emit('game:chat:message', { roomId, gameId: myGameId, text });
  }

  function handleSelectGame(gameTypeId) {
    setMenuOpen(false);
    const socket = socketRef.current;
    if (!socket) return;

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

    socketRef.current?.emit('game:join', { roomId, gameId }, (res) => {
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

    socketRef.current?.emit('game:spectate', { roomId, gameId }, (res) => {
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
    socketRef.current?.emit('game:start', { roomId, gameId: myGameId });
  }

  function handleAnswer(answer) {
    socketRef.current?.emit('game:answer', { roomId, gameId: myGameId, answer });
  }

  function handleLeaveGame(gameId) {
    socketRef.current?.emit('game:leave', { roomId, gameId }, (res) => {
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
    socketRef.current?.emit('game:end', { roomId, gameId }, (res) => {
      if (res?.error) { alert(res.error); return; }
      setQuestion(null);
      setFeedback(DEFAULT_FEEDBACK);
      setNextQuestionIn(null);
      setGameOpen(true);
    });
  }

  function handleRestartGame() {
    socketRef.current?.emit('game:restart', { roomId, gameId: myGameId });
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
      <main className="flex items-center justify-center min-h-dvh px-6 pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))]">
        <p className="text-slate-700 text-sm text-center">
          Invalid room link.{' '}
          <button
            type="button"
            className="text-indigo-700 font-semibold underline underline-offset-2 hover:text-indigo-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 rounded-sm"
            onClick={() => router.push('/groups')}
          >
            Back to groups
          </button>
        </p>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="flex items-center justify-center min-h-dvh pt-[max(1rem,var(--safe-top))] pb-[max(1rem,var(--safe-bottom))]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" aria-hidden />
          <p className="text-slate-700 text-sm font-medium">Joining room...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative w-full h-screen min-h-0 overflow-hidden bg-transparent flex flex-col max-w-lg mx-auto">

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

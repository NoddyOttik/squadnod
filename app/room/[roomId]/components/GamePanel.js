// app/room/[roomId]/components/GamePanel.js
'use client';

import { useState } from 'react';
import GameLobby from './GameLobby';
import GameQuestion from './GameQuestion';
import GameScoreboard from './GameScoreboard';
import GameOver from './GameOver';
import GameChatPanel from './GameChatPanel';

export default function GamePanel({
  isOpen,
  myName,
  myRole,
  isHost,
  card,
  question,
  timeLeft,
  feedback,
  successEventId,
  nextQuestionIn,
  gameOver,
  gameChatMessages,
  onSendGameChat,
  onClose,
  onStart,
  onAnswer,
  onLeave,
  onEnd,
  onRestart,
}) {
  // 'idle' | 'confirm-leave' | 'confirm-end'
  const [confirm, setConfirm] = useState('idle');

  function handleLeaveConfirm() {
    setConfirm('idle');
    onLeave(card?.gameId);
  }

  function handleEndConfirm() {
    setConfirm('idle');
    onEnd(card?.gameId);
  }

  const isSpectator   = myRole === 'spectator';
  const isParticipant = myRole === 'participant';
  const gameStatus    = card?.status ?? 'waiting';

  return (
    <div
      className={`
        absolute inset-0 z-50 bg-zinc-950
        flex flex-col min-h-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >

      {/* ── Panel header ─────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-[max(1.35rem,var(--safe-top))] pb-3 border-b border-zinc-800 gap-3 pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))]">

        {/* Game identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0">{card?.gameEmoji ?? '🎮'}</span>
          <div className="min-w-0">
            <p
              className="text-xs text-zinc-500 uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {gameStatus === 'active' ? 'In Progress' :
               gameStatus === 'waiting' ? 'Lobby' : 'Game'}
            </p>
            <h2
              className="font-extrabold text-base leading-tight truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {card?.gameName ?? 'Loading...'}
            </h2>
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Inline confirmation */}
          {confirm === 'confirm-leave' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirm('idle')}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveConfirm}
                className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/50 px-3 py-1 rounded-lg transition-colors"
              >
                Leave
              </button>
            </div>
          )}

          {confirm === 'confirm-end' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirm('idle')}
                className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEndConfirm}
                className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/50 px-3 py-1 rounded-lg transition-colors"
              >
                End Game
              </button>
            </div>
          )}

          {/* Normal buttons — hidden during confirmation */}
          {confirm === 'idle' && (
            <>
              {isHost && isParticipant &&
               (gameStatus === 'waiting' || gameStatus === 'active') && (
                <button
                  onClick={() => setConfirm('confirm-end')}
                  className="text-xs text-zinc-500 hover:text-red-400 px-2 py-1.5 rounded-lg hover:bg-red-950/30 transition-all"
                >
                  End
                </button>
              )}

              {isParticipant &&
               (gameStatus === 'waiting' || gameStatus === 'active') && (
                <button
                  onClick={() => setConfirm('confirm-leave')}
                  className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-all"
                >
                  Leave
                </button>
              )}
            </>
          )}

          {/* ✕ always just closes the panel */}
          <button
            onClick={() => { setConfirm('idle'); onClose(); }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Panel body + game chat ───────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col max-w-lg mx-auto w-full">
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">

          {/* Lobby */}
          {gameStatus === 'waiting' && (
            <GameLobby
              card={card}
              myName={myName}
              isHost={isHost}
              isSpectator={isSpectator}
              onStart={onStart}
            />
          )}

          {/* Active question */}
          {gameStatus === 'active' && question && (
            <>
              <GameQuestion
                question={question}
                timeLeft={timeLeft}
                feedback={feedback}
                successEventId={successEventId}
                nextQuestionIn={nextQuestionIn}
                isSpectator={isSpectator}
                onAnswer={onAnswer}
              />
              <GameScoreboard
                participants={card?.participants ?? []}
                myName={myName}
              />
            </>
          )}

          {/* Between questions */}
          {gameStatus === 'active' && !question && !gameOver && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-zinc-500 text-sm">
                  {isSpectator ? 'Waiting for next question...' : 'Get ready...'}
                </p>
              </div>
            </div>
          )}

          {/* Game over */}
          {(gameStatus === 'finished' || gameStatus === 'ended' || gameOver) && (
            <GameOver
              players={gameOver?.players ?? card?.finalScores ?? []}
              status={gameStatus}
              myName={myName}
              isHost={isHost}
              isSpectator={isSpectator}
              onRestart={onRestart}
            />
          )}
        </div>

        {card && myRole && (
          <GameChatPanel
            myName={myName}
            messages={gameChatMessages}
            onSend={onSendGameChat}
          />
        )}
      </div>
    </div>
  );
}

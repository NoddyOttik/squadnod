// app/room/[roomId]/components/GamePanel.js
'use client';

import { useState } from 'react';
import GameLobby from './GameLobby';
import GameQuestion from './GameQuestion';
import GameScoreboard from './GameScoreboard';
import GameOver from './GameOver';
import GameChatPanel from './GameChatPanel';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8ff]';

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
        absolute inset-0 z-50
        bg-gradient-to-b from-white/96 via-[#f3f6ff]/96 to-[#eef2ff]/98 backdrop-blur-xl
        flex flex-col min-h-0
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >

      {/* ── Panel header ─────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 pt-[max(1.35rem,var(--safe-top))] pb-3 border-b border-white/50 gap-3 pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))] bg-white/40 backdrop-blur-md shadow-sm">

        {/* Game identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl shrink-0" aria-hidden>{card?.gameEmoji ?? '🎮'}</span>
          <div className="min-w-0">
            <p
              className="text-xs text-slate-600 uppercase tracking-widest font-semibold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {gameStatus === 'active' ? 'In Progress' :
               gameStatus === 'waiting' ? 'Lobby' : 'Game'}
            </p>
            <h2
              className="font-extrabold text-base leading-tight truncate text-slate-900"
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
                className={`text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg transition-colors ${focus}`}
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveConfirm}
                className={`text-xs font-bold text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors border border-red-200 ${focus}`}
              >
                Leave
              </button>
            </div>
          )}

          {confirm === 'confirm-end' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirm('idle')}
                className={`text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg transition-colors ${focus}`}
              >
                Cancel
              </button>
              <button
                onClick={handleEndConfirm}
                className={`text-xs font-bold text-red-800 bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition-colors border border-red-200 ${focus}`}
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
                  className={`text-xs text-slate-600 hover:text-red-800 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-all ${focus}`}
                >
                  End
                </button>
              )}

              {isParticipant &&
               (gameStatus === 'waiting' || gameStatus === 'active') && (
                <button
                  onClick={() => setConfirm('confirm-leave')}
                  className={`text-xs text-slate-600 hover:text-slate-900 px-2 py-1.5 rounded-lg hover:bg-white/80 transition-all ${focus}`}
                >
                  Leave
                </button>
              )}
            </>
          )}

          {/* ✕ always just closes the panel */}
          <button
            onClick={() => { setConfirm('idle'); onClose(); }}
            className={`w-8 h-8 flex items-center justify-center rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors text-sm shadow-md ${focus}`}
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
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" aria-hidden />
                <p className="text-slate-600 text-sm font-medium">
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

// app/room/[roomId]/components/GameQuestion.js
'use client';

import { useState, useEffect, useRef } from 'react';

const CONFETTI_COLORS = ['#22c55e', '#f59e0b', '#a78bfa', '#f43f5e', '#38bdf8', '#f97316'];
const CONFETTI_PIECES = [
  { sx: '-10px', tx: '-120px', ty: '-62px', rot: '-250deg', delay: '0ms' },
  { sx: '6px', tx: '-84px', ty: '-74px', rot: '-190deg', delay: '40ms' },
  { sx: '0px', tx: '-42px', ty: '-82px', rot: '-145deg', delay: '90ms' },
  { sx: '8px', tx: '8px', ty: '-86px', rot: '130deg', delay: '20ms' },
  { sx: '-4px', tx: '46px', ty: '-82px', rot: '180deg', delay: '70ms' },
  { sx: '5px', tx: '90px', ty: '-74px', rot: '225deg', delay: '25ms' },
  { sx: '-7px', tx: '124px', ty: '-62px', rot: '270deg', delay: '55ms' },
  { sx: '3px', tx: '0px', ty: '-98px', rot: '300deg', delay: '120ms' },
];

export default function GameQuestion({
  question,
  timeLeft,
  feedback,
  successEventId,
  nextQuestionIn,
  isSpectator,
  onAnswer,
}) {
  const QUESTION_TIME_SECONDS = 20;
  const NEXT_DELAY_SECONDS = 3;
  const [draft, setDraft] = useState('');
  const inputRef          = useRef(null);

  useEffect(() => {
    setDraft('');
    if (!isSpectator) inputRef.current?.focus();
  }, [question?.index, isSpectator]);

  function submitAnswer() {
    const text = (inputRef.current?.value ?? draft).trim();
    if (!text || feedback.locked || isSpectator) return;
    onAnswer(text);
    setDraft('');
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    submitAnswer();
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    submitAnswer();
  }

  if (!question) return null;

  const urgent = timeLeft <= 5;
  const showQuestionTimer = feedback.state !== 'correct';
  const successFillPct =
    typeof nextQuestionIn === 'number'
      ? Math.max(
          0,
          Math.min(100, (nextQuestionIn / NEXT_DELAY_SECONDS) * 100)
        )
      : 0;

  const inputRing =
    feedback.state === 'wrong'   ? 'ring-2 ring-red-500' :
    feedback.state === 'correct' ? 'ring-2 ring-green-500' :
    'focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 squadnod-anim-fade-up">

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs text-zinc-500 uppercase tracking-widest"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {question.index + 1} / {question.total}
        </p>
        <div className={`
          text-xs font-bold tabular-nums px-3 py-1 rounded-full transition-colors
          ${showQuestionTimer ? 'visible' : 'invisible'}
          ${urgent
            ? 'bg-red-900/50 text-red-400 animate-pulse'
            : 'bg-zinc-800 text-zinc-300'
          }
        `}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {timeLeft}s
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-1 rounded-full overflow-hidden -mt-2 ${showQuestionTimer ? 'bg-zinc-800 visible' : 'bg-transparent invisible'}`}>
        <div
          key={`q-progress-${question.index}`}
          className={`h-full rounded-full ${
            urgent ? 'bg-red-500' : 'bg-indigo-500'
          }`}
          style={{
            width: '100%',
            marginRight: 'auto',
            animation: showQuestionTimer
              ? `squadnodQuestionDrain ${QUESTION_TIME_SECONDS}s linear forwards`
              : 'none',
          }}
        />
      </div>

      {/* Question */}
      <p className="text-base font-semibold leading-snug text-white squadnod-anim-pop">
        {question.question}
      </p>

      {/* Correct banner — shown to everyone including spectators */}
      {feedback.state === 'correct' && (
        <div
          key={successEventId}
          className="relative bg-green-950/50 border-[3px] border-green-800/60 rounded-xl px-4 py-3 flex flex-col gap-1 squadnod-anim-success-pop"
        >
          {typeof nextQuestionIn === 'number' && (
            <div
              className="absolute inset-y-0 left-0 bg-green-900/45 pointer-events-none transition-all duration-100 linear"
              style={{ width: `${successFillPct}%` }}
              aria-hidden="true"
            />
          )}
          {feedback.winner === 'you' && (
            <div className="squadnod-confetti-layer" aria-hidden="true">
              {CONFETTI_PIECES.map((piece, i) => (
                <span
                  key={`${feedback.answer}-${i}`}
                  className="squadnod-confetti-piece"
                  style={{
                    backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                    '--sx': piece.sx,
                    '--tx': piece.tx,
                    '--ty': piece.ty,
                    '--rot': piece.rot,
                    animationDelay: piece.delay,
                  }}
                />
              ))}
            </div>
          )}
          <p
            className="relative z-[1] text-green-400 text-sm font-bold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {feedback.winner === 'you'    ? 'You got it! ✓'              :
             feedback.winner === 'other'  ? `${feedback.winnerName} got it first` :
             "Time's up"}
          </p>
          {!isSpectator && feedback.winner === 'other' && (
            <p className="relative z-[1] text-green-300 text-xs">
              You did not get this one in time.
            </p>
          )}
          <p className="relative z-[1] text-zinc-400 text-sm">
            Answer:{' '}
            <span className="text-white font-semibold">{feedback.answer}</span>
          </p>
          {feedback.winner === 'you' && feedback.acceptedBy === 'fuzzy' && (
            <p className="relative z-[1] text-green-300 text-xs">
              Close spelling accepted. Use this spelling next time.
            </p>
          )}
        </div>
      )}

      {/* Spectator label */}
      {isSpectator && feedback.state !== 'correct' && (
        <p className="text-zinc-600 text-xs italic">
          You're watching — answers locked
        </p>
      )}

      {/* Answer input — participants only */}
      {!isSpectator && feedback.state !== 'correct' && (
        <div className="flex flex-col gap-1.5">
          <form className="flex gap-2" onSubmit={handleFormSubmit}>
            <input
              ref={inputRef}
              className={`
                flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-sm text-white
                placeholder-zinc-600 focus:outline-none transition-all
                ${inputRing}
              `}
              style={{ fontFamily: 'var(--font-body)' }}
              placeholder="Your answer..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={feedback.locked}
              maxLength={100}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <button
              type="submit"
              disabled={feedback.locked || !draft.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 px-4 py-3 rounded-xl text-sm font-bold transition-all shrink-0"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Go
            </button>
          </form>
          {feedback.state === 'wrong' && (
            <p className="text-red-400 text-xs px-1">Not quite — try again</p>
          )}
        </div>
      )}

    </div>
  );
}

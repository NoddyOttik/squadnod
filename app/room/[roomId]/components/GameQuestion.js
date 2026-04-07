// app/room/[roomId]/components/GameQuestion.js
'use client';

import { useState, useEffect, useRef } from 'react';

const CONFETTI_COLORS = ['#15803d', '#d97706', '#6d28d9', '#be123c', '#0369a1', '#c2410c'];
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

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8ff]';

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
    feedback.state === 'wrong'   ? 'ring-2 ring-red-600 ring-offset-2 ring-offset-[#f5f8ff]' :
    feedback.state === 'correct' ? 'ring-2 ring-emerald-600 ring-offset-2 ring-offset-[#f5f8ff]' :
    'focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-[#f5f8ff]';

  return (
    <div className="bg-white/75 border border-white/60 rounded-2xl p-5 flex flex-col gap-4 squadnod-anim-fade-up shadow-lg backdrop-blur-sm">

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <p
          className="text-xs text-slate-600 uppercase tracking-widest font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {question.index + 1} / {question.total}
        </p>
        <div className={`
          text-xs font-bold tabular-nums px-3 py-1 rounded-full transition-colors
          ${showQuestionTimer ? 'visible' : 'invisible'}
          ${urgent
            ? 'bg-red-100 text-red-900 border border-red-200 animate-pulse'
            : 'bg-slate-100 text-slate-800 border border-slate-200'
          }
        `}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {timeLeft}s
        </div>
      </div>

      {/* Progress bar */}
      <div className={`h-1 rounded-full overflow-hidden -mt-2 ${showQuestionTimer ? 'bg-slate-200 visible' : 'bg-transparent invisible'}`}>
        <div
          key={`q-progress-${question.index}`}
          className={`h-full rounded-full ${
            urgent ? 'bg-red-500' : 'bg-indigo-600'
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
      <p className="text-base font-semibold leading-snug text-slate-900 squadnod-anim-pop">
        {question.question}
      </p>

      {/* Correct banner — shown to everyone including spectators */}
      {feedback.state === 'correct' && (
        <div
          key={successEventId}
          className="relative bg-emerald-50 border-[3px] border-emerald-300 rounded-2xl px-4 py-3 flex flex-col gap-1 squadnod-anim-success-pop"
        >
          {typeof nextQuestionIn === 'number' && (
            <div
              className="absolute inset-y-0 left-0 bg-emerald-200/60 pointer-events-none transition-all duration-100 linear rounded-l-2xl"
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
            className="relative z-[1] text-emerald-900 text-sm font-bold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {feedback.winner === 'you'    ? 'You got it! ✓'              :
             feedback.winner === 'other'  ? `${feedback.winnerName} got it first` :
             "Time's up"}
          </p>
          {!isSpectator && feedback.winner === 'other' && (
            <p className="relative z-[1] text-emerald-800 text-xs">
              You did not get this one in time.
            </p>
          )}
          <p className="relative z-[1] text-slate-700 text-sm">
            Answer:{' '}
            <span className="text-slate-900 font-semibold">{feedback.answer}</span>
          </p>
          {feedback.winner === 'you' && feedback.acceptedBy === 'fuzzy' && (
            <p className="relative z-[1] text-emerald-800 text-xs">
              Close spelling accepted. Use this spelling next time.
            </p>
          )}
        </div>
      )}

      {/* Spectator label */}
      {isSpectator && feedback.state !== 'correct' && (
        <p className="text-slate-500 text-xs italic">
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
                flex-1 bg-white/90 border border-slate-200 rounded-full px-4 py-3 text-sm text-slate-900
                placeholder:text-slate-500 focus:outline-none transition-all
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
              className={`bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 px-4 py-3 rounded-full text-sm font-bold text-white transition-all shrink-0 shadow-md ${focus}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Go
            </button>
          </form>
          {feedback.state === 'wrong' && (
            <p className="text-red-800 text-xs font-medium px-1">Not quite — try again</p>
          )}
        </div>
      )}

    </div>
  );
}

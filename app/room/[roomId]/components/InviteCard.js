// app/room/[roomId]/components/InviteCard.js
const MEDALS = ['🥇', '🥈', '🥉'];

function nameMatches(a, b) {
  return (
    a &&
    b &&
    String(a).toLowerCase().trim() === String(b).toLowerCase().trim()
  );
}

const btnFocus =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8ff]';

export default function InviteCard({ card, myName, onJoin, onSpectate }) {
  const participants = card.participants ?? [];
  const spectators = card.spectators ?? [];
  const finalScores = card.finalScores ?? [];

  const locked = card.status !== 'waiting';

  const myRole = participants.some((p) => nameMatches(p.name, myName))
    ? 'participant'
    : spectators.some((s) => nameMatches(s.name, myName))
    ? 'spectator'
    : null;

  // ── Finished / Ended ─────────────────────────────────
  if (card.status === 'finished' || card.status === 'ended') {
    return (
      <div className="w-full shrink-0 rounded-2xl border border-white/55 bg-white/55 backdrop-blur-md overflow-hidden my-1 shadow-md shadow-slate-900/10">
        <div className="px-4 pt-3 pb-2 border-b border-white/45 flex items-center gap-2 bg-white/40">
          <span aria-hidden>{card.status === 'finished' ? '🏆' : '🛑'}</span>
          <p
            className="text-xs font-bold uppercase tracking-widest text-slate-800"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {card.gameEmoji} {card.gameName} —{' '}
            {card.status === 'finished' ? 'Final Scores' : 'Ended Early'}
          </p>
        </div>
        <div className="px-4 py-3 flex flex-col gap-2">
          {finalScores.length > 0 ? (
            finalScores.map((player, i) => (
              <div key={player.id ?? `${player.name}-${i}`} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{MEDALS[i] ?? `${i + 1}.`}</span>
                  <span className={`text-sm font-medium ${
                    player.name === myName ? 'text-indigo-700' : 'text-slate-800'
                  }`}>
                    {player.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-600 tabular-nums">
                  {player.score} pts
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 text-xs italic">No scores recorded</p>
          )}
        </div>
      </div>
    );
  }

  // ── Waiting / Active ──────────────────────────────────
  return (
    <div className="w-full shrink-0 rounded-2xl border border-white/55 bg-white/50 backdrop-blur-md overflow-hidden my-1 shadow-md shadow-slate-900/10">
      <div className="px-4 pt-3 pb-2 border-b border-white/45 flex items-center justify-between bg-indigo-50/80">
        <div className="flex items-center gap-2">
          <span aria-hidden>{card.gameEmoji}</span>
          <p
            className="text-xs font-bold uppercase tracking-widest text-slate-800"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {card.gameName}
          </p>
        </div>
        {card.status === 'active' && (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
            </span>
            <span className="text-xs text-emerald-800 font-semibold">Live</span>
          </span>
        )}
      </div>

      <div className="px-4 py-3 flex flex-col gap-2">
        {card.hostName && (
          <p className="text-[11px] text-slate-600">
            Hosted by <span className="font-semibold text-slate-800">{card.hostName}</span>
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-slate-500 w-16 shrink-0">Playing</span>
          <span className="text-xs text-slate-800 break-words min-w-0">
            {participants.length > 0
              ? participants.map((p) => p.name).join(', ')
              : '—'}
          </span>
        </div>
        {spectators.length > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-500 w-16 shrink-0">Watching</span>
            <span className="text-xs text-slate-700 break-words min-w-0">
              {spectators.map((s) => s.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-0">
        {myRole === 'participant' ? (
          <p className="text-xs text-indigo-800 font-semibold py-1">You're playing ✓</p>
        ) : myRole === 'spectator' ? (
          <p className="text-xs text-slate-600 font-medium py-1">You're watching ✓</p>
        ) : locked ? (
          <p className="text-xs text-slate-500 italic py-1">Game in progress</p>
        ) : (
          <div className="flex flex-wrap gap-2 w-full">
            <button
              type="button"
              onClick={() => onJoin(card.gameId)}
              className={`min-h-[44px] min-w-[5.5rem] flex-1 basis-[calc(33.333%-0.375rem)] bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold px-2 py-2.5 rounded-full transition-all shadow-md ${btnFocus}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => onSpectate(card.gameId)}
              className={`min-h-[44px] min-w-[5.5rem] flex-1 basis-[calc(33.333%-0.375rem)] bg-white/80 border border-white/70 hover:bg-white active:scale-[0.98] text-slate-800 text-xs font-semibold px-2 py-2.5 rounded-full transition-all shadow-sm ${btnFocus}`}
            >
              Spectate
            </button>
            <button
              type="button"
              className="min-h-[44px] min-w-[5.5rem] flex-1 basis-[calc(33.333%-0.375rem)] bg-slate-100/90 text-slate-400 text-xs font-semibold px-2 py-2.5 rounded-full cursor-default border border-slate-200/80"
              disabled
              aria-disabled="true"
            >
              Ignore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

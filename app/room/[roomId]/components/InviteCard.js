// app/room/[roomId]/components/InviteCard.js
const MEDALS = ['🥇', '🥈', '🥉'];

function nameMatches(a, b) {
  return (
    a &&
    b &&
    String(a).toLowerCase().trim() === String(b).toLowerCase().trim()
  );
}

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
      <div className="w-full shrink-0 rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden my-1 ring-1 ring-white/10 shadow-lg shadow-black/40">
        <div className="px-4 pt-3 pb-2 border-b border-white/10 flex items-center gap-2 bg-black/15">
          <span>{card.status === 'finished' ? '🏆' : '🛑'}</span>
          <p
            className="text-xs font-bold uppercase tracking-widest text-violet-200/85"
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
                    player.name === myName ? 'text-fuchsia-300' : 'text-violet-100/90'
                  }`}>
                    {player.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-violet-200/70 tabular-nums">
                  {player.score} pts
                </span>
              </div>
            ))
          ) : (
            <p className="text-violet-200/50 text-xs italic">No scores recorded</p>
          )}
        </div>
      </div>
    );
  }

  // ── Waiting / Active ──────────────────────────────────
  return (
    <div className="w-full shrink-0 rounded-2xl border border-violet-500/25 bg-zinc-950 overflow-hidden my-1 ring-1 ring-violet-500/20 shadow-lg shadow-black/40">
      <div className="px-4 pt-3 pb-2 border-b border-white/10 flex items-center justify-between bg-violet-950/40">
        <div className="flex items-center gap-2">
          <span>{card.gameEmoji}</span>
          <p
            className="text-xs font-bold uppercase tracking-widest text-violet-200/85"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {card.gameName}
          </p>
        </div>
        {card.status === 'active' && (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <span className="text-xs text-green-500 font-medium">Live</span>
          </span>
        )}
      </div>

      <div className="px-4 py-3 flex flex-col gap-2">
        {card.hostName && (
          <p className="text-[11px] text-violet-200/60">
            Hosted by <span className="font-semibold text-violet-200/90">{card.hostName}</span>
          </p>
        )}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-violet-200/55 w-16 shrink-0">Playing</span>
          <span className="text-xs text-violet-100/90 break-words min-w-0">
            {participants.length > 0
              ? participants.map((p) => p.name).join(', ')
              : '—'}
          </span>
        </div>
        {spectators.length > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-violet-200/55 w-16 shrink-0">Watching</span>
            <span className="text-xs text-violet-200/75 break-words min-w-0">
              {spectators.map((s) => s.name).join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 pt-0">
        {myRole === 'participant' ? (
          <p className="text-xs text-fuchsia-300/90 font-medium py-1">You're playing ✓</p>
        ) : myRole === 'spectator' ? (
          <p className="text-xs text-violet-200/55 font-medium py-1">You're watching ✓</p>
        ) : locked ? (
          <p className="text-xs text-violet-200/45 italic py-1">Game in progress</p>
        ) : (
          <div className="flex flex-wrap gap-2 w-full">
            <button
              type="button"
              onClick={() => onJoin(card.gameId)}
              className="min-h-[44px] min-w-[5.5rem] flex-1 basis-[calc(33.333%-0.375rem)] bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 active:scale-[0.98] text-white text-xs font-bold px-2 py-2.5 rounded-xl transition-all shadow-md shadow-violet-900/25"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => onSpectate(card.gameId)}
              className="min-h-[44px] min-w-[5.5rem] flex-1 basis-[calc(33.333%-0.375rem)] bg-zinc-800 ring-1 ring-white/15 hover:bg-zinc-700 active:scale-[0.98] text-violet-100 text-xs font-semibold px-2 py-2.5 rounded-xl transition-all"
            >
              Spectate
            </button>
            <button
              type="button"
              className="min-h-[44px] min-w-[5.5rem] flex-1 basis-[calc(33.333%-0.375rem)] bg-zinc-900/80 text-violet-300/50 text-xs font-semibold px-2 py-2.5 rounded-xl cursor-default ring-1 ring-white/10"
            >
              Ignore
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

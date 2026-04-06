// app/room/[roomId]/components/GameScoreboard.js
export default function GameScoreboard({ participants, myName }) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 squadnod-anim-fade-up">
      <p
        className="text-xs text-zinc-500 uppercase tracking-widest mb-3"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Scores
      </p>
      <div className="flex flex-col gap-2">
        {sorted.map((p, i) => {
          const isMe = p.name === myName;
          return (
            <div
              key={p.id ?? `${p.name}-${i}`}
              className={`
                flex items-center gap-3 rounded-lg px-2 py-1 transition-colors
                ${i === 0 ? 'squadnod-anim-pop' : ''}
                hover:bg-zinc-800/40
              `}
            >
              <span className="text-xs text-zinc-600 w-4 tabular-nums">{i + 1}</span>
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${
                  isMe ? 'text-indigo-400 font-semibold' : 'text-zinc-300'
                }`}>
                  {p.name}{isMe ? ' (you)' : ''}
                </span>
                <span className="text-sm font-bold text-zinc-400 tabular-nums">
                  {p.score} {p.score === 1 ? 'pt' : 'pts'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

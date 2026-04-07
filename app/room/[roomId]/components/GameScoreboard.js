// app/room/[roomId]/components/GameScoreboard.js
export default function GameScoreboard({ participants, myName }) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white/70 border border-white/60 rounded-2xl p-4 squadnod-anim-fade-up shadow-md backdrop-blur-sm">
      <p
        className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-bold"
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
                flex items-center gap-3 rounded-xl px-2 py-1 transition-colors
                ${i === 0 ? 'squadnod-anim-pop' : ''}
                hover:bg-white/50
              `}
            >
              <span className="text-xs text-slate-500 w-4 tabular-nums">{i + 1}</span>
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${
                  isMe ? 'text-indigo-700 font-semibold' : 'text-slate-800'
                }`}>
                  {p.name}{isMe ? ' (you)' : ''}
                </span>
                <span className="text-sm font-bold text-slate-600 tabular-nums">
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

// app/room/[roomId]/components/GameOver.js
const MEDALS = ['🥇', '🥈', '🥉'];

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8ff]';

export default function GameOver({
  players,
  status,
  myName,
  isHost,
  isSpectator,
  onRestart,
}) {
  const wasEnded = status === 'ended';

  return (
    <div className="flex flex-col gap-4 squadnod-anim-fade-up">

      {/* Hero */}
      <div className="bg-white/75 border border-white/60 rounded-2xl p-5 text-center squadnod-anim-pop shadow-lg backdrop-blur-sm">
        <p className="text-3xl mb-2" aria-hidden>{wasEnded ? '🛑' : '🏆'}</p>
        <h3
          className="font-extrabold text-xl text-slate-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {wasEnded ? 'Game Ended' : 'Game Over'}
        </h3>
        {wasEnded && (
          <p className="text-slate-600 text-xs mt-1">Ended early by the host</p>
        )}
        {!wasEnded && players[0] && (
          <p className="text-slate-700 text-sm mt-1">
            {players[0].name === myName ? 'You win! 🎉' : `${players[0].name} wins!`}
          </p>
        )}
      </div>

      {/* Final scores */}
      <div className="bg-white/75 border border-white/60 rounded-2xl p-4 shadow-md backdrop-blur-sm">
        <p
          className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {wasEnded ? 'Scores at Time of End' : 'Final Scores'}
        </p>

        {players.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No scores recorded</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {players.map((player, i) => {
              const isMe = player.name === myName;
              return (
                <div
                  key={player.id ?? `${player.name}-${i}`}
                  className={`
                    flex items-center justify-between rounded-xl px-3 py-2.5
                    ${i === 0 && !wasEnded
                      ? 'bg-amber-50 border border-amber-200/80'
                      : 'bg-white/60 border border-white/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">
                      {MEDALS[i] ?? `${i + 1}.`}
                    </span>
                    <span className={`text-sm font-semibold ${
                      isMe ? 'text-indigo-700' : 'text-slate-800'
                    }`}>
                      {player.name}{isMe ? ' (you)' : ''}
                    </span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${
                    i === 0 && !wasEnded ? 'text-amber-800' : 'text-slate-600'
                  }`}>
                    {player.score} {player.score === 1 ? 'pt' : 'pts'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Play again — host only, not spectators */}
      {isHost && !isSpectator && (
        <button
          onClick={onRestart}
          className={`w-full bg-slate-900 hover:bg-slate-800 hover:shadow-[0_0_0_3px_rgba(15,23,42,0.15)] active:scale-[0.98] rounded-full py-3.5 font-bold text-sm text-white transition-all squadnod-anim-pop ${focus}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Play Again
        </button>
      )}

      {!isHost && !isSpectator && (
        <p className="text-slate-600 text-xs text-center">
          Waiting for the host to start a new game...
        </p>
      )}

    </div>
  );
}

// app/room/[roomId]/components/GameOver.js
const MEDALS = ['🥇', '🥈', '🥉'];

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
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center squadnod-anim-pop">
        <p className="text-3xl mb-2">{wasEnded ? '🛑' : '🏆'}</p>
        <h3
          className="font-extrabold text-xl text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {wasEnded ? 'Game Ended' : 'Game Over'}
        </h3>
        {wasEnded && (
          <p className="text-zinc-500 text-xs mt-1">Ended early by the host</p>
        )}
        {!wasEnded && players[0] && (
          <p className="text-zinc-400 text-sm mt-1">
            {players[0].name === myName ? 'You win! 🎉' : `${players[0].name} wins!`}
          </p>
        )}
      </div>

      {/* Final scores */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p
          className="text-xs text-zinc-500 uppercase tracking-widest mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {wasEnded ? 'Scores at Time of End' : 'Final Scores'}
        </p>

        {players.length === 0 ? (
          <p className="text-zinc-600 text-sm italic">No scores recorded</p>
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
                      ? 'bg-amber-950/40 border border-amber-800/40'
                      : 'bg-zinc-800/50'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base w-6 text-center">
                      {MEDALS[i] ?? `${i + 1}.`}
                    </span>
                    <span className={`text-sm font-semibold ${
                      isMe ? 'text-indigo-400' : 'text-zinc-200'
                    }`}>
                      {player.name}{isMe ? ' (you)' : ''}
                    </span>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${
                    i === 0 && !wasEnded ? 'text-amber-400' : 'text-zinc-400'
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
          className="w-full bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] active:scale-[0.98] rounded-xl py-3.5 font-bold text-sm transition-all squadnod-anim-pop"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Play Again
        </button>
      )}

      {!isHost && !isSpectator && (
        <p className="text-zinc-600 text-xs text-center">
          Waiting for the host to start a new game...
        </p>
      )}

    </div>
  );
}

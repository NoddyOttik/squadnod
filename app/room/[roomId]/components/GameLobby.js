// app/room/[roomId]/components/GameLobby.js
function hostMatch(hostName, playerName) {
  return (
    hostName &&
    playerName &&
    String(hostName).toLowerCase() === String(playerName).toLowerCase()
  );
}

export default function GameLobby({ card, myName, isHost, isSpectator, onStart }) {
  if (!card) return null;

  return (
    <div className="flex flex-col gap-4">

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center flex flex-col gap-3">
        {isSpectator ? (
          <p className="text-zinc-500 text-sm">
            You're watching. Game starts when the host is ready.
          </p>
        ) : isHost ? (
          <>
            <p className="text-zinc-400 text-sm">
              {card.participants.length === 1
                ? 'Waiting for others to join...'
                : `${card.participants.length} players ready`}
            </p>
            <button
              onClick={onStart}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl py-3.5 font-bold text-sm transition-all"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Start Game
            </button>
          </>
        ) : (
          <p className="text-zinc-500 text-sm italic">
            Waiting for the host to start...
          </p>
        )}
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <p
          className="text-xs text-zinc-500 uppercase tracking-widest mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Players — {card.participants.length}
        </p>
        <div className="flex flex-col gap-2.5">
          {card.participants.map((p, i) => (
            <div key={p.id ?? `p-${p.name}-${i}`} className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  p.id == null ? 'bg-amber-500' : 'bg-green-400'
                }`}
                title={p.id == null ? 'Reconnecting…' : undefined}
              />
              <span className={`text-sm ${
                p.name === myName ? 'text-indigo-400 font-semibold' : 'text-zinc-200'
              }`}>
                {p.name}
                {p.id == null && (
                  <span className="text-zinc-500 font-normal"> · away</span>
                )}
              </span>
              {hostMatch(card.hostName, p.name) && (
                <span className="text-xs text-zinc-600 ml-auto">host</span>
              )}
            </div>
          ))}
        </div>

        {card.spectators.length > 0 && (
          <>
            <p
              className="text-xs text-zinc-500 uppercase tracking-widest mt-4 mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Watching — {card.spectators.length}
            </p>
            <div className="flex flex-col gap-2.5">
              {card.spectators.map((s, i) => (
                <div key={s.id ?? `s-${s.name}-${i}`} className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      s.id == null ? 'bg-amber-600' : 'bg-zinc-600'
                    }`}
                  />
                  <span className={`text-sm text-zinc-500 ${
                    s.name === myName ? 'font-semibold' : ''
                  }`}>
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

    </div>
  );
}

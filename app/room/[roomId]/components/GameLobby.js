// app/room/[roomId]/components/GameLobby.js
function hostMatch(hostName, playerName) {
  return (
    hostName &&
    playerName &&
    String(hostName).toLowerCase() === String(playerName).toLowerCase()
  );
}

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8ff]';

export default function GameLobby({ card, myName, isHost, isSpectator, onStart }) {
  if (!card) return null;

  return (
    <div className="flex flex-col gap-4">

      <div className="bg-white/70 border border-white/60 rounded-2xl p-5 text-center flex flex-col gap-3 shadow-md backdrop-blur-sm">
        {isSpectator ? (
          <p className="text-slate-600 text-sm">
            You're watching. Game starts when the host is ready.
          </p>
        ) : isHost ? (
          <>
            <p className="text-slate-600 text-sm">
              {card.participants.length === 1
                ? 'Waiting for others to join...'
                : `${card.participants.length} players ready`}
            </p>
            <button
              onClick={onStart}
              className={`w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] rounded-full py-3.5 font-bold text-sm text-white transition-all shadow-lg ${focus}`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Start Game
            </button>
          </>
        ) : (
          <p className="text-slate-500 text-sm italic">
            Waiting for the host to start...
          </p>
        )}
      </div>

      <div className="bg-white/70 border border-white/60 rounded-2xl p-4 shadow-md backdrop-blur-sm">
        <p
          className="text-xs text-slate-600 uppercase tracking-widest mb-3 font-bold"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Players — {card.participants.length}
        </p>
        <div className="flex flex-col gap-2.5">
          {card.participants.map((p, i) => (
            <div key={p.id ?? `p-${p.name}-${i}`} className="flex items-center gap-2.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  p.id == null ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                title={p.id == null ? 'Reconnecting…' : undefined}
              />
              <span className={`text-sm ${
                p.name === myName ? 'text-indigo-700 font-semibold' : 'text-slate-800'
              }`}>
                {p.name}
                {p.id == null && (
                  <span className="text-slate-500 font-normal"> · away</span>
                )}
              </span>
              {hostMatch(card.hostName, p.name) && (
                <span className="text-xs text-slate-500 ml-auto font-medium">host</span>
              )}
            </div>
          ))}
        </div>

        {card.spectators.length > 0 && (
          <>
            <p
              className="text-xs text-slate-600 uppercase tracking-widest mt-4 mb-3 font-bold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Watching — {card.spectators.length}
            </p>
            <div className="flex flex-col gap-2.5">
              {card.spectators.map((s, i) => (
                <div key={s.id ?? `s-${s.name}-${i}`} className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      s.id == null ? 'bg-amber-600' : 'bg-slate-400'
                    }`}
                  />
                  <span className={`text-sm text-slate-600 ${
                    s.name === myName ? 'font-semibold text-slate-800' : ''
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

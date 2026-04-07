// app/room/[roomId]/components/GameMenu.js
'use client';

import { useEffect, useRef } from 'react';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export default function GameMenu({
  isOpen,
  onClose,
  catalog,
  onSelectGame,
  isInGame,
  myGameName,
  myGameEmoji,
  onRejoin,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }

    const timeout = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('touchstart', handleClick);
    }, 50);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 bg-slate-900/15 backdrop-blur-[3px]">

      <div
        ref={menuRef}
        className="
          absolute top-[56px] right-3
          w-72
          rounded-2xl overflow-hidden
          border border-white/55 bg-white/80 backdrop-blur-xl
          shadow-2xl shadow-slate-900/15 ring-1 ring-white/40
        "
      >
        <div className="absolute -top-2 right-3 w-4 h-2 overflow-hidden" aria-hidden="true">
          <div className="
            w-3 h-3 bg-white/90 border-l border-t border-white/60
            rotate-45 translate-y-1.5 translate-x-0.5 shadow-sm
          " />
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/45 bg-white/50">
          <h2
            className="font-extrabold text-sm text-slate-900 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Games
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200/80 hover:bg-slate-200/80 text-slate-700 text-xs transition-colors ${focus}`}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body — max-height keeps it mid-screen */}
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>

          {/* Blocked state */}
          {isInGame ? (
            <div className="px-4 py-5 flex flex-col gap-4">
              <p className="text-slate-600 text-xs leading-relaxed">
                You're currently in a game. Finish or leave it before starting or joining another.
              </p>
              <button
                type="button"
                onClick={onRejoin}
                className={`w-full flex items-center justify-between rounded-2xl border border-white/60 bg-white/60 px-3.5 py-3 shadow-sm hover:bg-white/90 transition-colors ${focus}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg" aria-hidden>{myGameEmoji}</span>
                  <div className="text-left">
                    <p
                      className="text-sm font-semibold text-slate-900"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {myGameName}
                    </p>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">Tap to rejoin</p>
                  </div>
                </div>
                <span className="text-indigo-700 text-sm font-semibold">→</span>
              </button>
            </div>

          ) : (
            <div className="px-4 py-4 flex flex-col gap-5">
              {catalog.map((category) => (
                <div key={category.category}>
                  <p
                    className="text-xs font-bold uppercase tracking-widest text-slate-600 mb-2.5"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {category.category}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {category.games.map((game) => (
                      <GameRow key={game.id} game={game} onSelect={onSelectGame} />
                    ))}
                  </div>
                </div>
              ))}
              <div className="h-2" />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function GameRow({ game, onSelect }) {
  const available = game.available;

  return (
    <button
      type="button"
      onClick={() => available && onSelect(game.id)}
      disabled={!available}
      className={`
        w-full flex items-center justify-between
        px-3.5 py-2.5 rounded-xl border transition-all text-left
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-white
        ${available
          ? 'bg-white/70 border-white/60 hover:bg-white hover:shadow-md active:scale-[0.98]'
          : 'bg-slate-100/60 border-slate-200/50 opacity-60 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg w-6 text-center" aria-hidden>{game.emoji}</span>
        <span
          className={`text-sm font-semibold ${available ? 'text-slate-900' : 'text-slate-400'}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {game.name}
        </span>
      </div>
      {available ? (
        <span className="text-indigo-700 text-xs font-semibold">Play →</span>
      ) : (
        <span className="text-slate-500 text-xs font-semibold bg-slate-200/80 ring-1 ring-slate-300/80 px-2 py-0.5 rounded-full">
          soon
        </span>
      )}
    </button>
  );
}

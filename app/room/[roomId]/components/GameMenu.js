// app/room/[roomId]/components/GameMenu.js
'use client';

import { useEffect, useRef } from 'react';

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
    <div className="absolute inset-0 z-40 bg-black/25 backdrop-blur-[2px]">

      <div
        ref={menuRef}
        className="
          absolute top-[56px] right-3
          w-72
          rounded-2xl overflow-hidden
          border border-white/10 bg-white/[0.08] backdrop-blur-xl
          shadow-2xl shadow-black/50 ring-1 ring-white/5
        "
      >
        <div className="absolute -top-2 right-3 w-4 h-2 overflow-hidden" aria-hidden="true">
          <div className="
            w-3 h-3 bg-[#0f0a18]/95 border-l border-t border-white/15
            rotate-45 translate-y-1.5 translate-x-0.5
          " />
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 bg-black/20">
          <h2
            className="font-extrabold text-sm text-white tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Games
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-xl bg-black/30 ring-1 ring-white/10 hover:bg-violet-950/50 text-violet-200/90 text-xs transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body — max-height keeps it mid-screen */}
        <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>

          {/* Blocked state */}
          {isInGame ? (
            <div className="px-4 py-5 flex flex-col gap-4">
              <p className="text-violet-200/80 text-xs leading-relaxed">
                You're currently in a game. Finish or leave it before starting or joining another.
              </p>
              <button
                type="button"
                onClick={onRejoin}
                className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/25 px-3.5 py-3 ring-1 ring-violet-500/20 hover:bg-violet-950/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{myGameEmoji}</span>
                  <div className="text-left">
                    <p
                      className="text-sm font-semibold text-violet-100"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {myGameName}
                    </p>
                    <p className="text-xs text-fuchsia-300/80 mt-0.5">Tap to rejoin</p>
                  </div>
                </div>
                <span className="text-fuchsia-300/90 text-sm">→</span>
              </button>
            </div>

          ) : (
            <div className="px-4 py-4 flex flex-col gap-5">
              {catalog.map((category) => (
                <div key={category.category}>
                  <p
                    className="text-xs font-bold uppercase tracking-widest text-violet-200/75 mb-2.5"
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
        ${available
          ? 'bg-black/25 border-white/10 ring-1 ring-white/5 hover:bg-violet-950/35 hover:border-violet-400/25 hover:ring-violet-500/20 active:scale-[0.98]'
          : 'bg-black/15 border-white/5 opacity-45 cursor-not-allowed'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg w-6 text-center">{game.emoji}</span>
        <span
          className={`text-sm font-semibold ${available ? 'text-white' : 'text-zinc-500'}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {game.name}
        </span>
      </div>
      {available ? (
        <span className="text-violet-300/80 text-xs">Play →</span>
      ) : (
        <span className="text-zinc-500 text-xs font-medium bg-black/30 ring-1 ring-white/10 px-2 py-0.5 rounded-full">
          soon
        </span>
      )}
    </button>
  );
}

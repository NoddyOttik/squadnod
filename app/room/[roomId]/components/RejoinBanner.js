// app/room/[roomId]/components/RejoinBanner.js
export default function RejoinBanner({ gameName, gameEmoji, onRejoin }) {
  return (
    <button
      onClick={onRejoin}
      className="
        shrink-0 w-full flex items-center justify-between
        px-4 py-2.5 bg-indigo-950/70 border-b border-indigo-800/50
        hover:bg-indigo-900/60 active:bg-indigo-900/80
        transition-colors text-left
      "
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
        </span>
        <span className="text-indigo-300 text-xs font-medium">
          {gameEmoji} {gameName} in progress
        </span>
      </div>
      <span
        className="text-indigo-400 text-xs font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Rejoin →
      </span>
    </button>
  );
}

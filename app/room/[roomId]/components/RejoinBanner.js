export default function RejoinBanner({ gameName, gameEmoji, onRejoin }) {
  return (
    <button
      onClick={onRejoin}
      className="
        shrink-0 w-full flex items-center justify-between
        pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))]
        py-2.5 bg-gradient-to-r from-indigo-100/95 to-violet-100/95
        border-b border-white/50 hover:from-indigo-100 hover:to-violet-50
        active:scale-[0.995] transition-all text-left
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600
      "
    >
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
        </span>
        <span className="text-slate-800 text-xs font-semibold">
          {gameEmoji} {gameName} in progress
        </span>
      </div>
      <span
        className="text-indigo-800 text-xs font-bold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Rejoin →
      </span>
    </button>
  );
}

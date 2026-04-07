import InviteCard from './InviteCard';

export default function ChatMessage({
  message,
  previousMessage,
  myName,
  gameCards,
  onJoin,
  onSpectate,
}) {
  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  if (message.type === 'game-invite') {
    // Always render from live gameCards state, not the stale chat array version
    const liveCard = gameCards[message.gameId] ?? message;
    return (
      <div className="w-full max-w-full min-w-0 shrink-0">
        <InviteCard
          card={liveCard}
          myName={myName}
          onJoin={onJoin}
          onSpectate={onSpectate}
        />
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <p className="text-slate-500 text-xs text-center italic py-0.5">
        {message.text}
      </p>
    );
  }

  const isMe = message.name === myName;
  const timeLabel = formatTime(message.ts) || '';

  const isStartOfGroup =
    !previousMessage ||
    previousMessage.type !== 'message' ||
    previousMessage.name !== message.name;

  const isContinuation =
    previousMessage?.type === 'message' &&
    previousMessage.name === message.name;

  return (
    <div
      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${
        isContinuation ? '-mt-2' : ''
      }`}
    >
      {isStartOfGroup && (
        <span
          className={`mb-1 max-w-[78%] px-0.5 text-[11px] leading-tight ${
            isMe ? 'text-right text-slate-600' : 'text-left text-slate-600'
          }`}
        >
          <span className="font-semibold text-slate-800">{message.name}</span>
          {timeLabel ? (
            <>
              <span className="mx-1 text-slate-400" aria-hidden>
                ·
              </span>
              <span className="font-normal text-slate-500 tabular-nums">
                {timeLabel}
              </span>
            </>
          ) : null}
        </span>
      )}
      <div className={`
        max-w-[78%] px-3.5 py-2.5 text-sm leading-snug shadow-sm
        ${isMe
          ? 'bg-slate-900 text-white rounded-2xl rounded-br-sm ring-1 ring-slate-900/10'
          : 'bg-white/80 text-slate-900 ring-1 ring-white/70 rounded-2xl rounded-bl-sm'
        }
        ${isContinuation
          ? isMe
            ? 'rounded-tr-sm'
            : 'rounded-tl-sm'
          : ''
        }
      `}>
        {message.text}
      </div>
    </div>
  );
}

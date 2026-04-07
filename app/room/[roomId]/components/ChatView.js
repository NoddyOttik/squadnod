// app/room/[roomId]/components/ChatView.js
'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import MemberList from './MemberList';

export default function ChatView({
  roomId,
  myName,
  members,
  chat,
  gameCards,
  onSendMessage,
  onJoinGame,
  onSpectateGame,
}) {
  const [draft, setDraft]             = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const bottomRef                     = useRef(null);
  const messageInputRef               = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  function sendWithValue(raw) {
    const text = raw.trim();
    if (!text) return;
    onSendMessage(text);
    setDraft('');
  }

  function handleKeyDown(e) {
    if (e.key !== 'Enter' || e.shiftKey) return;
    if (e.nativeEvent.isComposing) return;
    e.preventDefault();
    sendWithValue(e.currentTarget.value);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const v = messageInputRef.current?.value ?? draft;
    sendWithValue(v);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 mx-3 mb-0 pt-2 bg-transparent overflow-hidden min-h-0">

      {showMembers && (
        <div className="shrink-0 border-b border-white/10 bg-transparent py-2">
          <MemberList members={members} gameCards={gameCards} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowMembers((v) => !v)}
        className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-transparent hover:bg-white/[0.04] transition-colors w-full text-left"
      >
        <div className="flex -space-x-1">
          {members.slice(0, 5).map((m, i) => (
            <div
              key={m.id}
              className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-700 border border-[#0a0514] flex items-center justify-center text-white shadow-sm"
              style={{ fontSize: 9, zIndex: 5 - i }}
            >
              {m.name[0].toUpperCase()}
            </div>
          ))}
        </div>
        <span
          className="text-violet-200/90 text-xs"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {members.length} {members.length === 1 ? 'person' : 'people'} here
          {showMembers ? ' · tap to hide' : ' · tap to see'}
        </span>
      </button>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 min-h-0 bg-transparent">
        {chat.length === 0 && (
          <p className="text-violet-200/50 text-xs text-center mt-8 leading-relaxed">
            No messages yet. Say hello!
          </p>
        )}
        {chat.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            previousMessage={i > 0 ? chat[i - 1] : null}
            myName={myName}
            gameCards={gameCards}
            onJoin={onJoinGame}
            onSpectate={onSpectateGame}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-white/10 bg-zinc-950/95 backdrop-blur-md px-3 pt-2 pb-[max(0.75rem,var(--safe-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.35)]">
        <form className="flex gap-2" onSubmit={handleSubmit}>
          <input
            ref={messageInputRef}
            name="message"
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 bg-black/35 ring-1 ring-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
            style={{ fontFamily: 'var(--font-body)' }}
            placeholder="Message..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={200}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="disabled:opacity-30 disabled:cursor-not-allowed px-4 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95 shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-md shadow-violet-900/30"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}

// app/room/[roomId]/components/ChatView.js
'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import MemberList from './MemberList';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f4ff]';

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
    <div className="flex-1 flex flex-col min-h-0 mx-3 my-2 pt-0 overflow-hidden rounded-[1.75rem] border border-white/50 bg-white/35 backdrop-blur-xl shadow-lg shadow-slate-900/5">

      {showMembers && (
        <div className="shrink-0 border-b border-white/45 bg-white/30 py-2">
          <MemberList members={members} gameCards={gameCards} />
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowMembers((v) => !v)}
        className={`shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-white/40 bg-white/25 hover:bg-white/40 transition-colors w-full text-left rounded-t-[1.75rem] ${focus}`}
      >
        <div className="flex -space-x-1">
          {members.slice(0, 5).map((m, i) => (
            <div
              key={m.id}
              className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 border-2 border-white flex items-center justify-center text-white shadow-sm"
              style={{ fontSize: 9, zIndex: 5 - i }}
            >
              {m.name[0].toUpperCase()}
            </div>
          ))}
        </div>
        <span
          className="text-slate-700 text-xs font-medium"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {members.length} {members.length === 1 ? 'person' : 'people'} here
          {showMembers ? ' · tap to hide' : ' · tap to see'}
        </span>
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 bg-transparent">
        {chat.length === 0 && (
          <p className="text-slate-500 text-xs text-center mt-8 leading-relaxed">
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

      <div className="shrink-0 border-t border-white/45 bg-white/55 backdrop-blur-md px-3 pt-2 pb-[max(0.5rem,var(--safe-bottom))] shadow-[0_-8px_32px_rgba(15,23,42,0.08)] rounded-b-[1.75rem]">
        <form className="flex gap-2 items-center" onSubmit={handleSubmit}>
          <input
            ref={messageInputRef}
            name="message"
            className="flex-1 rounded-full px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 bg-white/85 border border-white/70 shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-[#f5f8ff] transition-all"
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
            className={`disabled:opacity-40 disabled:cursor-not-allowed px-5 py-3 rounded-full text-sm font-bold text-white transition-all active:scale-95 shrink-0 bg-slate-900 hover:bg-slate-800 shadow-md ${focus}`}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}

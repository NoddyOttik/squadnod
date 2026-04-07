// app/room/[roomId]/components/GameChatPanel.js
'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f8ff]';

export default function GameChatPanel({ myName, messages, onSend }) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendWithValue(raw) {
    const text = raw.trim();
    if (!text) return;
    onSend(text);
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
    const v = inputRef.current?.value ?? draft;
    sendWithValue(v);
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col border-t border-white/50 bg-white/45 backdrop-blur-md">
      <p
        className="shrink-0 px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest text-slate-600 font-bold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Game chat
      </p>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-slate-500 text-xs text-center py-2">
            Messages here stay in this game — not shown in room chat.
          </p>
        )}
        {messages.map((msg, i) => (
          <ChatMessage
            key={`${msg.ts}-${i}`}
            message={msg}
            previousMessage={i > 0 ? messages[i - 1] : null}
            myName={myName}
            gameCards={{}}
            onJoin={() => {}}
            onSpectate={() => {}}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <form className={`shrink-0 flex gap-2 px-3 pt-1 pb-[max(0.5rem,var(--safe-bottom))] bg-white/60 border-t border-white/50`} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          name="gameMessage"
          className="flex-1 bg-white/90 border border-white/70 rounded-full px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-[#f5f8ff] transition-all"
          style={{ fontFamily: 'var(--font-body)' }}
          placeholder="Message your game..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className={`bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed px-4 py-2.5 rounded-full text-sm font-bold text-white transition-all active:scale-95 shrink-0 shadow-md ${focus}`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

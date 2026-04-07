// app/room/[roomId]/components/GameChatPanel.js
'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';

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
    <div className="flex-1 min-h-0 flex flex-col border-t border-zinc-800 bg-zinc-950/10">
      <p
        className="shrink-0 px-4 pt-2 pb-1 text-[10px] uppercase tracking-widest text-zinc-600"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Game chat
      </p>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-2 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-zinc-600 text-xs text-center py-2">
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
      <form className="shrink-0 flex gap-2 px-3 pt-1 pb-3 bg-zinc-950/95 border-t border-zinc-800/80" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          name="gameMessage"
          className="flex-1 bg-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
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
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shrink-0"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Send
        </button>
      </form>
    </div>
  );
}

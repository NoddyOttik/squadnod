// app/room/[roomId]/components/TopBar.js
'use client';

import { useState } from 'react';

export default function TopBar({ roomId, memberCount, onGameIconClick }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = String(roomId ?? '').trim();
    if (!text) return;

    let ok = false;
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      } else {
        throw new Error('clipboard-unavailable');
      }
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.left = '0';
        ta.style.width = '1px';
        ta.style.height = '1px';
        ta.style.padding = '0';
        ta.style.border = 'none';
        ta.style.outline = 'none';
        ta.style.boxShadow = 'none';
        ta.style.background = 'transparent';
        ta.style.opacity = '0';
        ta.setAttribute('aria-hidden', 'true');
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-violet-500/25 bg-zinc-950/10">

      {/* Room identity + copy */}
      <div className="group flex items-center gap-2">
        <div>
          <p
            className="text-violet-300/90 text-xs uppercase tracking-widest"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Room
          </p>
          <h1
            className="text-lg font-extrabold tracking-widest leading-tight text-white"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {roomId}
          </h1>
        </div>

        {/* Copy button — always visible on mobile, hover on desktop */}
        <button
          type="button"
          onClick={handleCopy}
          className="
            flex items-center gap-1 mt-3
            opacity-100 sm:opacity-0 sm:group-hover:opacity-100
            transition-opacity duration-150 rounded-md
            text-violet-300/90 hover:text-white
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07030f]
          "
          title="Copy room code"
          aria-label="Copy room code"
        >
          {copied ? (
            <span
              className="text-xs text-green-400 font-medium"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Copied!
            </span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14" height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-violet-200/85 text-xs">{memberCount} online</span>
        </div>

        <div className="relative">
          <button
            onClick={onGameIconClick}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-950/80 ring-1 ring-violet-500/30 hover:bg-violet-900/90 active:scale-95 transition-all"
            aria-label="Open games"
          >
            <span className="text-lg">🎮</span>
          </button>
        </div>
      </div>

    </div>
  );
}

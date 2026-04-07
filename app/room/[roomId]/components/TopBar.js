// app/room/[roomId]/components/TopBar.js
'use client';

import { useState } from 'react';

const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f4ff]';

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
    <div className="shrink-0 flex items-center justify-between px-4 pt-[max(1.35rem,var(--safe-top))] pb-3 border-b border-white/45 bg-white/45 backdrop-blur-xl shadow-sm pl-[max(1rem,var(--safe-left))] pr-[max(1rem,var(--safe-right))]">

      {/* Room identity + copy */}
      <div className="group flex items-center gap-2">
        <div>
          <p
            className="text-slate-600 text-xs uppercase tracking-widest font-semibold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Room
          </p>
          <h1
            className="text-lg font-extrabold tracking-widest leading-tight text-slate-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {roomId}
          </h1>
        </div>

        {/* Copy button — always visible on mobile, hover on desktop */}
        <button
          type="button"
          onClick={handleCopy}
          className={`
            flex items-center gap-1 mt-3
            opacity-100 sm:opacity-0 sm:group-hover:opacity-100
            transition-opacity duration-150 rounded-lg
            text-indigo-700 hover:text-indigo-900
            ${focus}
          `}
          title="Copy room code"
          aria-label="Copy room code"
        >
          {copied ? (
            <span
              className="text-xs text-emerald-800 font-semibold"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Copied!
            </span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />
          <span className="text-slate-600 text-xs font-medium">{memberCount} online</span>
        </div>

        <div className="relative">
          <button
            onClick={onGameIconClick}
            className={`w-9 h-9 flex items-center justify-center rounded-full bg-slate-900 text-white shadow-md border border-white/50 hover:bg-slate-800 active:scale-95 transition-all ${focus}`}
            aria-label="Open games"
          >
            <span className="text-lg">🎮</span>
          </button>
        </div>
      </div>

    </div>
  );
}

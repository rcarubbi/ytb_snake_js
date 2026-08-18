"use client";

import { RoomsIcon, SnakeIcon } from "./icons";

interface HUDProps {
  online: boolean;
  roomId: string | null;
  running: boolean;
  onStart: () => void;
  onStop: () => void;
  onBrowseRooms: () => void;
}

export default function HUD({
  online,
  roomId,
  running,
  onStart,
  onStop,
  onBrowseRooms,
}: HUDProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5 backdrop-blur sm:px-5">
      <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
        <SnakeIcon className="h-7 w-7 shrink-0 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
        <div className="min-w-0">
          <h1 className="font-display truncate text-base font-extrabold tracking-[0.2em] neon-text sm:text-xl">
            SNAKE ARENA
          </h1>
          <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">
            <span className={online ? "neon-cyan" : "text-zinc-400"}>
              {online ? "online" : "local"}
            </span>
            {roomId ? <span className="text-emerald-400"> · room {roomId}</span> : null}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {online ? (
          <button
            id="rooms-button"
            type="button"
            aria-label="Browse rooms"
            onClick={onBrowseRooms}
            className="rounded-lg border border-cyan-500/60 p-2 text-cyan-300 transition hover:bg-cyan-400/10 hover:shadow-[0_0_14px_rgba(34,211,238,0.3)] active:scale-95"
          >
            <RoomsIcon className="h-5 w-5" />
          </button>
        ) : null}
        <button
          id="start-button"
          type="button"
          onClick={onStart}
          disabled={running || (online && !roomId)}
          className="rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-400 px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-emerald-950 shadow-[0_0_14px_rgba(16,185,129,0.35)] transition hover:shadow-[0_0_22px_rgba(16,185,129,0.6)] active:scale-95 disabled:pointer-events-none disabled:opacity-30 sm:px-5"
        >
          Start
        </button>
        <button
          id="stop-button"
          type="button"
          onClick={onStop}
          disabled={!running}
          className="rounded-lg bg-gradient-to-r from-rose-700 to-rose-500 px-4 py-2 font-display text-xs font-bold uppercase tracking-widest text-rose-50 shadow-[0_0_14px_rgba(225,29,72,0.3)] transition hover:shadow-[0_0_22px_rgba(225,29,72,0.55)] active:scale-95 disabled:pointer-events-none disabled:opacity-30 sm:px-5"
        >
          Stop
        </button>
      </div>
    </header>
  );
}

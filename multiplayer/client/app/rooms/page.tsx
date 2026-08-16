"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import gameClient from "@/lib/gameClient";
import type { RoomSummary } from "@/lib/game/types";
import { CloseIcon, RoomsIcon, SnakeIcon } from "@/components/icons";

const PLAYER_NAME_KEY = "snake.playerName";
const PENDING_JOIN_KEY = "snake.pendingJoin";

const labelClass = "text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500";

export default function RoomsPage() {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState(() => {
    try {
      return localStorage.getItem(PLAYER_NAME_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [joining, setJoining] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await gameClient.listRooms();
      setRooms(list);
    } catch {
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await gameClient.connectAsync();
        if (cancelled) return;
        gameClient.onRoomListChanged((list) => setRooms(list));
        await refresh();
      } catch {
        if (!cancelled) setError("Connection failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    try {
      localStorage.setItem(PLAYER_NAME_KEY, playerName);
    } catch {
      // ignore
    }
  }, [playerName]);

  const joinRoom = useCallback(
    async (roomId: string) => {
      const name = playerName.trim();
      if (!name) {
        setError("Enter a player name first");
        return;
      }
      setJoining(roomId);
      setError(null);
      const response = await gameClient.joinRoom(roomId, name);
      if (!response || response.error) {
        setError(response?.error || "Failed to join room");
        setJoining(null);
        return;
      }
      try {
        sessionStorage.setItem(
          PENDING_JOIN_KEY,
          JSON.stringify({
            roomId: response.roomId,
            playerId: response.playerId,
            speed: response.speed,
            canvasWidth: response.canvasWidth,
            canvasHeight: response.canvasHeight,
          })
        );
      } catch {
        // ignore
      }
      router.replace("/");
    },
    [playerName, router]
  );

  const isFull = (room: RoomSummary) => room.players.length >= room.numberOfPlayers;

  return (
    <div className="flex h-dvh flex-col bg-[#060a08] text-zinc-200">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5 backdrop-blur sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <RoomsIcon className="h-6 w-6 shrink-0 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
          <h1 className="font-display truncate text-base font-extrabold tracking-[0.2em] neon-cyan sm:text-xl">
            ROOMS
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            id="rooms-refresh-button"
            type="button"
            onClick={() => {
              setLoading(true);
              refresh();
            }}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-300 transition hover:border-cyan-500/60 hover:text-cyan-300 active:scale-95"
          >
            Refresh
          </button>
          <button
            id="rooms-back-button"
            type="button"
            aria-label="Back"
            onClick={() => router.push("/")}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-300 transition hover:border-rose-500/60 hover:text-rose-300 active:scale-95"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
        <section className="mb-5">
          <label className={labelClass} htmlFor="rooms-player-name">
            Your name
          </label>
          <input
            id="rooms-player-name"
            type="text"
            maxLength={8}
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="PLAYER 1"
            className="gamer-input mt-2 max-w-xs"
          />
        </section>

        {error ? (
          <p className="mb-4 rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-rose-300">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-[11px] uppercase tracking-[0.3em] text-zinc-500">
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <SnakeIcon className="h-10 w-10 text-zinc-700" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">
              No rooms open yet
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <li
                key={room.roomId}
                className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={labelClass}>Room</p>
                    <p className="font-display text-lg font-bold neon-text">{room.roomId}</p>
                  </div>
                  <span className="rounded-md border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-widest text-zinc-400">
                    speed {room.speed}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-zinc-400">
                  <p>
                    <span className="uppercase tracking-widest text-zinc-500">Host: </span>
                    <span className="text-emerald-300">{room.ownerId}</span>
                  </p>
                  <p>
                    <span className="uppercase tracking-widest text-zinc-500">Players: </span>
                    {room.players.length}/{room.numberOfPlayers}
                  </p>
                  <p>
                    <span className="uppercase tracking-widest text-zinc-500">Apples: </span>
                    {room.numberOfApples}
                  </p>
                  {room.players.length > 0 ? (
                    <p className="truncate text-zinc-500">
                      {room.players.join(", ")}
                    </p>
                  ) : null}
                </div>

                <button
                  id={`join-room-${room.roomId}`}
                  type="button"
                  disabled={isFull(room) || joining !== null}
                  onClick={() => joinRoom(room.roomId)}
                  className="mt-auto rounded-lg border border-cyan-500/60 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition hover:bg-cyan-400/10 hover:shadow-[0_0_14px_rgba(34,211,238,0.35)] active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                >
                  {isFull(room) ? "Full" : joining === room.roomId ? "Joining..." : "Join"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

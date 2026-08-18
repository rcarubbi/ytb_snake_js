"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import gameClient from "@/lib/gameClient";
import type { RoomSummary } from "@/lib/game/types";
import { CloseIcon, RoomsIcon, SnakeIcon } from "@/components/icons";

const PLAYER_NAME_KEY = "snake.playerName";
const PENDING_JOIN_KEY = "snake.pendingJoin";

const labelClass = "text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500";
const sectionTitle = "font-display text-xs font-bold uppercase tracking-[0.25em] text-emerald-300";

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
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);

  const [showControls, setShowControls] = useState(false);
  const [online, setOnline] = useState(true);
  const [speed, setSpeed] = useState(15);
  const [players, setPlayers] = useState(2);
  const [apples, setApples] = useState(1);
  const [creating, setCreating] = useState(false);

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
    try {
      const pending = sessionStorage.getItem(PENDING_JOIN_KEY);
      if (pending) {
        const data = JSON.parse(pending);
        if (data?.roomId && data?.playerId) {
          setCurrentRoomId(data.roomId);
          setCurrentPlayerId(data.playerId);
        }
      }
    } catch {
      // ignore
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
      if (currentRoomId) {
        setError("Leave your current room first");
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
    [playerName, router, currentRoomId]
  );

  const leaveCurrentRoom = useCallback(async () => {
    if (!currentRoomId || !currentPlayerId) return;
    setLeaving(true);
    setError(null);
    try {
      await gameClient.leaveRoom(currentRoomId, currentPlayerId);
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem(PENDING_JOIN_KEY);
    } catch {
      // ignore
    }
    setCurrentRoomId(null);
    setCurrentPlayerId(null);
    setLeaving(false);
  }, [currentRoomId, currentPlayerId]);

  const createGame = useCallback(async () => {
    const name = playerName.trim();
    if (!name) {
      setError("Enter a player name first");
      return;
    }
    if (currentRoomId) {
      setError("Leave your current room first");
      return;
    }
    if (!online) {
      try {
        sessionStorage.setItem(
          PENDING_JOIN_KEY,
          JSON.stringify({ local: true, speed, players, apples })
        );
      } catch {
        // ignore
      }
      router.replace("/");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await gameClient.connectAsync();
      const response = await gameClient.createRoom({
        numberOfPlayers: players,
        numberOfApples: apples,
        speed,
        canvasWidth: 1120,
        canvasHeight: 1040,
        playerId: name,
      });
      if (!response || response.error) {
        setError(response?.error || "Failed to create room");
        setCreating(false);
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
    } catch {
      setError("Failed to connect");
      setCreating(false);
    }
  }, [playerName, speed, players, apples, online, router, currentRoomId]);

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
            id="rooms-new-game-button"
            type="button"
            disabled={!!currentRoomId}
            onClick={() => setShowControls((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-widest transition active:scale-95 disabled:pointer-events-none disabled:opacity-30 ${
              showControls
                ? "border-emerald-400/70 bg-emerald-400/10 text-emerald-300 shadow-[0_0_14px_rgba(16,185,129,0.4)]"
                : "border-emerald-500/60 text-emerald-300 hover:bg-emerald-400/10 hover:shadow-[0_0_14px_rgba(16,185,129,0.35)]"
            }`}
          >
            New Game
          </button>
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
            readOnly={!!currentRoomId}
            placeholder="PLAYER 1"
            className={`gamer-input mt-2 max-w-xs ${currentRoomId ? "opacity-50" : ""}`}
          />
        </section>

        {showControls ? (
          <section className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className={sectionTitle}>New Game</h3>
              <button
                type="button"
                aria-label="Close controls"
                onClick={() => setShowControls(false)}
                className="rounded-lg border border-zinc-700 p-1.5 text-zinc-300 transition hover:border-rose-500/60 hover:text-rose-300 active:scale-95"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className={sectionTitle}>Game mode</p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {online ? "Online multiplayer" : "Local same-keyboard"}
                </p>
              </div>
              <button
                id="rooms-online-toggle"
                type="button"
                role="switch"
                aria-checked={online}
                data-on={online}
                onClick={() => setOnline((v) => !v)}
                className="gamer-switch"
              />
            </div>

            <div className="mb-4 space-y-4 border-t border-zinc-800 pt-4">
              <div>
                <label className={labelClass} htmlFor="rooms-speed">
                  Speed
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="rooms-speed"
                    type="range"
                    min={5}
                    max={25}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="gamer-range"
                  />
                  <span className="w-8 shrink-0 text-right font-display text-sm font-bold neon-cyan">
                    {speed}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="rooms-players">
                    Players
                  </label>
                  <input
                    id="rooms-players"
                    type="number"
                    min={1}
                    max={8}
                    value={players}
                    onChange={(e) => setPlayers(Math.max(1, Math.min(8, Number(e.target.value) || 1)))}
                    className="gamer-input mt-2"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="rooms-apples">
                    Apples
                  </label>
                  <input
                    id="rooms-apples"
                    type="number"
                    min={1}
                    max={10}
                    value={apples}
                    onChange={(e) => setApples(Math.max(1, Number(e.target.value) || 1))}
                    className="gamer-input mt-2"
                  />
                </div>
              </div>
            </div>

            <button
              id="rooms-create-game-button"
              type="button"
              disabled={creating || !playerName.trim()}
              onClick={createGame}
              className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-400 px-4 py-2.5 font-display text-xs font-bold uppercase tracking-widest text-emerald-950 shadow-[0_0_14px_rgba(16,185,129,0.35)] transition hover:shadow-[0_0_22px_rgba(16,185,129,0.6)] active:scale-95 disabled:pointer-events-none disabled:opacity-30"
            >
              {creating ? "Creating..." : online ? "Create Room" : "Start Local Game"}
            </button>
          </section>
        ) : null}

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
                  disabled={leaving || joining !== null}
                  onClick={() => {
                    if (currentRoomId === room.roomId) {
                      leaveCurrentRoom();
                    } else {
                      joinRoom(room.roomId);
                    }
                  }}
                  className={`mt-auto rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-widest transition active:scale-95 disabled:pointer-events-none disabled:opacity-30 ${
                    currentRoomId === room.roomId
                      ? "border-rose-500/60 text-rose-300 hover:bg-rose-500/10 hover:shadow-[0_0_14px_rgba(244,63,94,0.3)]"
                      : "border-cyan-500/60 text-cyan-300 hover:bg-cyan-400/10 hover:shadow-[0_0_14px_rgba(34,211,238,0.35)]"
                  }`}
                >
                  {currentRoomId === room.roomId
                    ? leaving
                      ? "Leaving..."
                      : "Leave"
                    : isFull(room)
                      ? "Full"
                      : joining === room.roomId
                        ? "Joining..."
                        : "Join"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

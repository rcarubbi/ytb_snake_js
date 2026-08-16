"use client";

import { CloseIcon } from "./icons";

interface SettingsDrawerProps {
  open: boolean;
  online: boolean;
  running: boolean;
  busy: boolean;
  speed: number;
  players: number;
  apples: number;
  playerName: string;
  roomId: string | null;
  roomToJoin: string;
  onToggleOnline: (checked: boolean) => void;
  onSpeedChange: (value: number) => void;
  onPlayersChange: (value: number) => void;
  onApplesChange: (value: number) => void;
  onPlayerNameChange: (value: string) => void;
  onRoomToJoinChange: (value: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  onClose: () => void;
}

const fieldLabel = "block text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500";
const sectionTitle = "font-display text-xs font-bold uppercase tracking-[0.25em] text-emerald-300";

export default function SettingsDrawer({
  open,
  online,
  running,
  busy,
  speed,
  players,
  apples,
  playerName,
  roomId,
  roomToJoin,
  onToggleOnline,
  onSpeedChange,
  onPlayersChange,
  onApplesChange,
  onPlayerNameChange,
  onRoomToJoinChange,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onClose,
}: SettingsDrawerProps) {
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed right-0 top-0 z-50 flex h-dvh w-80 max-w-[85vw] transform flex-col border-l border-zinc-800 bg-zinc-900/95 backdrop-blur transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-display text-sm font-extrabold uppercase tracking-[0.25em] neon-text">
            Settings
          </h2>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 p-1.5 text-zinc-300 transition hover:border-rose-500/60 hover:text-rose-300 active:scale-95"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* mode */}
          <section className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className={sectionTitle}>Game mode</h3>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {online ? "Online multiplayer" : "Local same-keyboard"}
                </p>
              </div>
              <button
                id="online"
                type="button"
                role="switch"
                aria-checked={online}
                disabled={running}
                data-on={online}
                onClick={() => onToggleOnline(!online)}
                className="gamer-switch disabled:cursor-not-allowed disabled:opacity-40"
              />
            </div>
          </section>

          {/* gameplay settings */}
          <section className="mb-5 space-y-4 border-t border-zinc-800 pt-4">
            <h3 className={sectionTitle}>Gameplay</h3>

            <div>
              <label className={fieldLabel} htmlFor="speed">
                Speed
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="speed"
                  type="range"
                  min={5}
                  max={25}
                  value={speed}
                  onChange={(e) => onSpeedChange(Number(e.target.value))}
                  className="gamer-range"
                />
                <span className="w-8 shrink-0 text-right font-display text-sm font-bold neon-cyan">
                  {speed}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={fieldLabel} htmlFor="players">
                  Players
                </label>
                <input
                  id="players"
                  type="number"
                  min={1}
                  max={4}
                  value={players}
                  onChange={(e) => onPlayersChange(Math.max(1, Number(e.target.value) || 1))}
                  className="gamer-input mt-2"
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="apples">
                  Apples
                </label>
                <input
                  id="apples"
                  type="number"
                  min={1}
                  max={10}
                  value={apples}
                  onChange={(e) => onApplesChange(Math.max(1, Number(e.target.value) || 1))}
                  className="gamer-input mt-2"
                />
              </div>
            </div>
          </section>

          {/* player */}
          <section className="mb-5 border-t border-zinc-800 pt-4">
            <h3 className={sectionTitle}>Player</h3>
            <label className={`${fieldLabel} mt-3`} htmlFor="player-id">
              Name
            </label>
            <input
              id="player-id"
              type="text"
              maxLength={8}
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder="PLAYER 1"
              className="gamer-input mt-2"
            />
          </section>

          {/* room */}
          {online ? (
            <section className="space-y-3 border-t border-zinc-800 pt-4">
              <h3 className={sectionTitle}>Online room</h3>

              <div>
                <label className={fieldLabel} htmlFor="room-id">
                  Your room
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="room-id"
                    type="text"
                    readOnly
                    value={roomId ?? ""}
                    placeholder="—"
                    className="gamer-input"
                  />
                  <button
                    id="create-room-button"
                    type="button"
                    disabled={!online || !!roomId || running || busy}
                    onClick={onCreateRoom}
                    className="shrink-0 rounded-lg border border-emerald-500/60 px-3 py-2 text-xs font-bold uppercase tracking-widest text-emerald-300 transition hover:bg-emerald-400/10 hover:shadow-[0_0_14px_rgba(16,185,129,0.35)] active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                  >
                    Create
                  </button>
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="room-id-input">
                  Join room
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    id="room-id-input"
                    type="text"
                    value={roomToJoin}
                    onChange={(e) => onRoomToJoinChange(e.target.value)}
                    placeholder="ROOM ID"
                    disabled={!online}
                    className="gamer-input"
                  />
                  <button
                    id="join-room-button"
                    type="button"
                    disabled={!online || !!roomId || running || busy}
                    onClick={onJoinRoom}
                    className="shrink-0 rounded-lg border border-cyan-500/60 px-3 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 transition hover:bg-cyan-400/10 hover:shadow-[0_0_14px_rgba(34,211,238,0.35)] active:scale-95 disabled:pointer-events-none disabled:opacity-30"
                  >
                    Join
                  </button>
                </div>
              </div>

              <button
                id="leave-room-button"
                type="button"
                disabled={!roomId || busy}
                onClick={onLeaveRoom}
                className="w-full rounded-lg border border-rose-500/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/10 hover:shadow-[0_0_14px_rgba(244,63,94,0.3)] active:scale-95 disabled:pointer-events-none disabled:opacity-30"
              >
                Leave room
              </button>
            </section>
          ) : null}
        </div>

        <div className="border-t border-zinc-800 px-4 py-3 text-center text-[10px] uppercase tracking-[0.3em] text-zinc-600">
          {running ? "game in session" : "ready"}
        </div>
      </aside>
    </>
  );
}

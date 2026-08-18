import { io, type Socket } from "socket.io-client";
import type {
  GameSettings,
  RoomResponse,
  GameState,
  RoomSummary,
} from "@/lib/game/types";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
    ? window.location.origin
    : "http://localhost:3000");

let socket: Socket | null = null;
let connectionPromise: Promise<string> | null = null;

function asyncEmit<T>(eventName: string, data?: unknown): Promise<T> {
  return new Promise<T>((resolve) => {
    const handler = (result: T) => {
      socket?.off(eventName, handler);
      resolve(result);
    };
    socket?.on(eventName, handler);
    socket?.emit(eventName, data);
  });
}

const gameClient = {
  connectAsync: async function (): Promise<string> {
    if (connectionPromise) return connectionPromise;
    connectionPromise = new Promise<string>((resolve, reject) => {
      try {
        socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
        });
        socket.on("connection", (id: string) => {
          resolve(id);
        });
        socket.on("connect_error", (err: Error) => {
          connectionPromise = null;
          reject(err);
        });
      } catch (e) {
        connectionPromise = null;
        reject(e as Error);
      }
    });
    return connectionPromise;
  },

  disconnectAsync: async function (): Promise<void> {
    await new Promise<void>((resolve) => {
      try {
        socket?.disconnect();
        socket = null;
        connectionPromise = null;
        resolve();
      } catch {
        socket = null;
        connectionPromise = null;
        resolve();
      }
    });
  },

  onStateChange: function (callback: (state: GameState) => void) {
    socket?.on("gameState", callback);
  },

  offStateChange: function (callback: (state: GameState) => void) {
    socket?.off("gameState", callback);
  },

  onRoomListChanged: function (callback: (rooms: RoomSummary[]) => void) {
    socket?.on("roomListChanged", callback);
  },

  listRooms: async function (): Promise<RoomSummary[]> {
    return asyncEmit<RoomSummary[]>("listRooms");
  },

  createRoom: async function (gameSettings: GameSettings): Promise<RoomResponse> {
    return asyncEmit<RoomResponse>("createRoom", gameSettings);
  },

  leaveRoom: async function (
    roomId: string,
    playerId: string | null
  ): Promise<unknown> {
    return asyncEmit("leaveRoom", { roomId, playerId });
  },

  joinRoom: async function (
    roomId: string,
    playerId: string | null
  ): Promise<RoomResponse> {
    return asyncEmit<RoomResponse>("joinRoom", { roomId, playerId });
  },

  keyPressed: function (roomId: string, key: string, playerId: string | null) {
    socket?.emit("keyPressed", { roomId, playerId, key });
  },

  updateState: async function (roomId: string) {
    return asyncEmit<GameState>("updateState", roomId);
  },
};

export default gameClient;

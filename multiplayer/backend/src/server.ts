import express from "express";
import fs from "fs";
import http from "http";
import path from "path";
import { Server, type Socket } from "socket.io";
import Lobby from "./Lobby.js";
import type { GameSettings, RoomResponse } from "./game/types.js";

const app = express();
const httpServer = http.createServer(app);

// serve the statically exported Next.js client (multiplayer/client/out) when built
const clientOut = path.resolve(import.meta.dirname, "../../client/out");
const clientIndex = path.join(clientOut, "index.html");
if (fs.existsSync(clientIndex)) {
  app.use(express.static(clientOut));
  // SPA fallback: any non-socket GET goes to index.html
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/socket.io")) {
      res.sendFile(clientIndex);
      return;
    }
    next();
  });
}
// allow the Next.js client (localhost:3001) to reach the socket.io backend
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// select port according to environment
const port = Number(process.env.PORT) || 3000;

const CANVAS_WIDTH = 1120;
const CANVAS_HEIGHT = 1040;

const lobby = new Lobby();
const roomTimers = new Map<string, NodeJS.Timeout>();
// maps socket.id -> { roomId, playerId } so disconnects can clean up by name
const socketPlayerMap = new Map<string, { roomId: string; playerId: string | null }>();

interface JoinRoomData {
  roomId: string;
  playerId: string;
}

interface KeyPressedData {
  roomId: string;
  key: string;
  playerId: string | null;
}

interface LeaveRoomData {
  roomId: string;
  playerId: string;
}

function validatePlayerName(name: string | null | undefined): string | null {
  if (!name || !name.trim()) {
    return "Player name is required";
  }
  if (name.trim().length > 8) {
    return "Player name must be at most 8 characters";
  }
  return null;
}

function sanitizeGameSettings(gameSettings: GameSettings): GameSettings {
  const speed = Math.min(25, Math.max(5, Number(gameSettings.speed) || 15));
  const numberOfPlayers = Math.min(
    8,
    Math.max(1, Number(gameSettings.numberOfPlayers) || 2)
  );
  const numberOfApples = Math.min(
    10,
    Math.max(1, Number(gameSettings.numberOfApples) || 1)
  );
  return {
    ...gameSettings,
    speed,
    numberOfPlayers,
    numberOfApples,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  };
}

function startRoomTimer(roomId: string) {
  const room = lobby.getRoom(roomId);
  if (!room || roomTimers.has(roomId)) return;
  roomTimers.set(
    roomId,
    setInterval(() => {
      const state = lobby.updateState(roomId);
      io.to(String(roomId)).emit("gameState", state);
    }, 1000 / room.speed)
  );
}

function stopRoomTimer(roomId: string) {
  const timer = roomTimers.get(roomId);
  if (timer) {
    clearInterval(timer);
    roomTimers.delete(roomId);
  }
}

function leaveSocketRoom(roomId: string | null, playerId: string, socket: Socket) {
  if (roomId == null) return;
  lobby.leaveRoom(roomId, playerId);
  socket.leave(String(roomId));
  if (!lobby.getRoom(roomId)) {
    stopRoomTimer(roomId);
  }
}

// listen to port 3000
httpServer.listen(port, function () {
  console.log(`socket.io server listening on port ${port}`);
});

// initialize socket io
io.on("connection", function (socket) {
  // emit user id
  socket.emit("connection", socket.id);
  console.log(`user ${socket.id} connected`);

  // create room
  socket.on("createRoom", function (gameSettings: GameSettings) {
    const nameError = validatePlayerName(gameSettings.playerId);
    if (nameError) {
      socket.emit("createRoom", { error: nameError } satisfies RoomResponse);
      return;
    }
    const settings = sanitizeGameSettings(gameSettings);
    const roomId = lobby.createRoom(settings);
    const joinRoomResponse = lobby.joinRoom(roomId, settings.playerId ?? "");

    if (joinRoomResponse && !joinRoomResponse.error) {
      socket.join(String(roomId));
      socketPlayerMap.set(socket.id, {
        roomId,
        playerId: joinRoomResponse.playerId ?? null,
      });
      startRoomTimer(roomId);
    }

    // emit room id
    socket.emit("createRoom", joinRoomResponse);
    console.log(
      `${joinRoomResponse.playerId} created room ${roomId}`
    );
  });

  // join room
  socket.on("joinRoom", function (data: JoinRoomData) {
    const nameError = validatePlayerName(data.playerId);
    if (nameError) {
      socket.emit("joinRoom", { error: nameError } satisfies RoomResponse);
      return;
    }
    const response = lobby.joinRoom(data.roomId, data.playerId);
    if (response && !response.error) {
      socket.join(String(response.roomId));
      socketPlayerMap.set(socket.id, {
        roomId: response.roomId as string,
        playerId: response.playerId ?? null,
      });
      startRoomTimer(response.roomId as string);
      // send current state snapshot to the new player
      socket.emit("gameState", lobby.getState(response.roomId as string));
    }
    socket.emit("joinRoom", response);
    console.log(`${response.playerId} joined room ${data.roomId}`);
  });

  // leave room
  socket.on("leaveRoom", function (data: LeaveRoomData) {
    leaveSocketRoom(data.roomId, data.playerId, socket);
    socketPlayerMap.delete(socket.id);
    socket.emit("leaveRoom", data);
    console.log(`${data.playerId} left room ${data.roomId}`);
  });

  // update state
  socket.on("updateState", function (roomId: string) {
    socket.emit("updateState", lobby.getState(roomId));
  });

  // move snake
  socket.on("keyPressed", function (settings: KeyPressedData) {
    lobby.keyPressed(settings.roomId, settings.key, settings.playerId);
    socket.emit("keyPressed", settings);
  });

  socket.on("disconnecting", function () {
    console.log(`user ${socket.id} disconnecting`);
    const entry = socketPlayerMap.get(socket.id);
    if (entry) {
      leaveSocketRoom(entry.roomId, entry.playerId ?? "", socket);
      socketPlayerMap.delete(socket.id);
    }
  });
});

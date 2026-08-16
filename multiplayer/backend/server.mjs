import express from 'express';
import http from 'http';

import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import lobby from '../scripts/lobby.mjs';

const app = express();
const httpServer = http.Server(app);
const io = new Server(httpServer);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// select port according to environment
const port = process.env.PORT || 3000;
const options = {
  index: "snake.html"
};

const CANVAS_WIDTH = 1120;
const CANVAS_HEIGHT = 1040;

const roomTimers = new Map();
// maps socket.id -> { roomId, playerId } so disconnects can clean up by name
const socketPlayerMap = new Map();

function validatePlayerName(name) {
    if (!name || !name.trim()) {
        return 'Player name is required';
    }
    if (name.trim().length > 8) {
        return 'Player name must be at most 8 characters';
    }
    return null;
}

function sanitizeGameSettings(gameSettings) {
    const speed = Math.min(25, Math.max(5, Number(gameSettings.speed) || 15));
    const numberOfPlayers = Math.min(8, Math.max(1, Number(gameSettings.numberOfPlayers) || 2));
    const numberOfApples = Math.min(10, Math.max(1, Number(gameSettings.numberOfApples) || 1));
    return {
        ...gameSettings,
        speed,
        numberOfPlayers,
        numberOfApples,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT,
    };
}

function startRoomTimer(roomId) {
    const room = lobby.getRoom(roomId);
    if (!room || roomTimers.has(roomId)) return;
    roomTimers.set(roomId, setInterval(() => {
        const state = lobby.updateState(roomId);
        io.to(String(roomId)).emit("gameState", state);
    }, 1000 / room.speed));
}

function stopRoomTimer(roomId) {
    const timer = roomTimers.get(roomId);
    if (timer) {
        clearInterval(timer);
        roomTimers.delete(roomId);
    }
}

function leaveSocketRoom(roomId, socketId, socket) {
    if (roomId == null) return;
    lobby.leaveRoom(roomId, socketId);
    socket.leave(String(roomId));
    if (!lobby.getRoom(roomId)) {
        stopRoomTimer(roomId);
    }
}

// listen to port 3000
httpServer.listen(port, function () {
    // serve frontend game
    
    app.use("/", express.static(path.join(__dirname, '..', 'frontend'), options));

    app.use("/scripts", express.static(path.join(__dirname, '..', 'scripts')));

});

// initialize socket io
io.on('connection', function (socket) {
    // emit user id
    socket.emit('connection', socket.id);
    console.log(`user ${socket.id} connected`);
    // create room
    socket.on('createRoom', function (gameSettings) {
        const nameError = validatePlayerName(gameSettings.playerId);
        if (nameError) {
            socket.emit('createRoom', { error: nameError });
            return;
        }
        const settings = sanitizeGameSettings(gameSettings);
        const roomId = lobby.createRoom(settings);
        const joinRoomResponse = lobby.joinRoom(roomId, settings.playerId);

        if (joinRoomResponse && !joinRoomResponse.error) {
            socket.join(String(roomId));
            socketPlayerMap.set(socket.id, { roomId, playerId: joinRoomResponse.playerId });
            startRoomTimer(roomId);
        }

        // emit room id
        socket.emit('createRoom', joinRoomResponse );
        console.log(`${joinRoomResponse && joinRoomResponse.playerId} created room ${roomId}`);
    });

    // join room
    socket.on('joinRoom', function (data) {
        const nameError = validatePlayerName(data.playerId);
        if (nameError) {
            socket.emit("joinRoom", { error: nameError });
            return;
        }
        const response = lobby.joinRoom(data.roomId, data.playerId);
        if (response && !response.error) {
            socket.join(String(response.roomId));
            socketPlayerMap.set(socket.id, { roomId: response.roomId, playerId: response.playerId });
            startRoomTimer(response.roomId);
            // send current state snapshot to the new player
            socket.emit("gameState", lobby.getState(response.roomId));
        }
        socket.emit("joinRoom", response );
        console.log(`${response && response.playerId} joined room ${data.roomId}`);
    });

    // leave room
    socket.on('leaveRoom', function (data) {
        leaveSocketRoom(data.roomId, data.playerId, socket);
        socketPlayerMap.delete(socket.id);
        socket.emit("leaveRoom", data);
        console.log(`${data.playerId} left room ${data.roomId}`);
    });

    // update state
    socket.on('updateState', function (roomId) {
        socket.emit("updateState", lobby.getState(roomId));
    });

    // move snake
    socket.on('keyPressed', function (settings) {
         
        lobby.keyPressed(settings.roomId, settings.key, settings.playerId);
        socket.emit("keyPressed", settings);
         
    });

    socket.on('disconnecting', function () {
        console.log(`user ${socket.id} disconnecting`);
        const entry = socketPlayerMap.get(socket.id);
        if (entry) {
            leaveSocketRoom(entry.roomId, entry.playerId, socket);
            socketPlayerMap.delete(socket.id);
        }
    });

});

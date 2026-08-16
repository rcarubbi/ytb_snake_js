import { io } from "https://cdn.socket.io/4.3.2/socket.io.esm.min.js";
let socket = null

function asyncEmit(eventName, data) {
    return new Promise(function (resolve) {
        const handler = (result) => {
            socket.off(eventName, handler);
            resolve(result);
        };
        socket.on(eventName, handler);
        socket.emit(eventName, data);
    });
}

const gameClient = {
    connectAsync: async function () {
        const playerId = await (new Promise(function (resolve, reject) {
            try {
                socket = io("/");
                socket.on("connection", (id) => {
                    resolve(id);
                });
                socket.on("connect_error", (err) => {
                    reject(err);
                });
            } catch (e) {
                reject(e);
            }
        }));

        return playerId;
    },
    disconnectAsync: async function () {
        await (new Promise(function (resolve, reject) {
            try {
                socket.disconnect();
                resolve();
            } catch (e) {
                reject(e);
            }
        }));
    },
    onStateChange: function (callback) {
        socket.on("gameState", callback);
    },
    createRoom: async function (gameSettings) {
        return await asyncEmit("createRoom", gameSettings);
    },
    leaveRoom: async function (roomId, playerId) {
        return await asyncEmit("leaveRoom", { roomId, playerId });
    },
    joinRoom: async function (roomId, playerId) {
        return await asyncEmit("joinRoom", { roomId, playerId });
    },
    keyPressed: function (roomId, key, playerId) {
        socket.emit("keyPressed", {roomId, playerId, key});
    },
    updateState: async function (roomId) {
        return await asyncEmit("updateState", roomId);
    },
  
}

export default gameClient;

import gameClient from "./gameClient.js";
import Game from "./game.mjs";
import KeyboardListener from './listeners/keyboardListener.js';
import SwipeGestureListener from './listeners/swipeGestureListener.js';
import ScoreRenderer from './renderers/scoreRenderer.js';
import SnakeRenderer from './renderers/snakeRenderer.js';
import AppleRenderer from './renderers/appleRenderer.js';
import BombRenderer from './renderers/bombRenderer.js';

const main = document.getElementsByTagName('main')[0];
const footer = document.getElementsByTagName('footer')[0];
const startButton = document.getElementById("start-button");
const stopButton = document.getElementById("stop-button");
const onlineSwitch = document.getElementById("online");

const scanline = document.getElementById("scanline");
const canvas = document.getElementById("canvas");
const screen = document.getElementById("screen");
const tv = document.getElementById("tv");

const createRoom = document.getElementById("create-room-button");
const joinRoom = document.getElementById("join-room-button");
const roomIdToJoinInput = document.getElementById("room-id-input");

const leaveRoom = document.getElementById("leave-room-button");

const playerIdInput = document.getElementById("player-id");
const roomIdInput = document.getElementById("room-id");
const roomIdLabel = roomIdInput.labels[0];


let animationHandle, lastFrameTimestamp = null;

let playerId = null;
let currentRoomId = null;
let currentGame = null;
let currentSpeed = 15;
let latestState = null;

function getGameSettings() {
    const numberOfPlayers = document.getElementById('players').value;
    const numberOfApples = document.getElementById('apples').value;
    const speed = document.getElementById('speed').value;
    return {
        numberOfPlayers,
        numberOfApples,
        canvasHeight: canvas.height,
        canvasWidth: canvas.width,
        playerId,
        speed 
    }
}

function startLocalGame() {
    const gameSettings = getGameSettings();
    currentSpeed = gameSettings.speed;
    currentGame = new Game(gameSettings);
    currentGame.start();
}

let connectPromise = null;
async function ensureOnlineConnection() {
    if (!connectPromise) {
        connectPromise = gameClient.connectAsync().then(() => {
            gameClient.onStateChange((state) => {
                latestState = state;
            });
        });
    }
    return connectPromise;
}

function showToast(message) {
    M.toast({ html: `<span>${message}</span>`, classes: 'red rounded' });
}

function readPlayerName() {
    return playerIdInput.value.trim();
}

function keyboardHandler(key) {
    if (currentGame) {
        currentGame.keyPressed(key);
    } else if (currentRoomId) {
         gameClient.keyPressed(currentRoomId, key, playerId);
    }
}

function swipeGestureHandler(direction) {
    // map swipe direction to keyboard key
    const key = {
        "left": "ArrowLeft",
        "right": "ArrowRight",
        "up": "ArrowUp",
        "down": "ArrowDown"
    }[direction];

    keyboardHandler(key);
}




async function stopOnlineGameStart() {
    if (currentRoomId) {
        await gameClient.leaveRoom(currentRoomId, playerId);
    }
}



function gameLoop(timestamp) {
    if (currentGame) {
        if (timestamp < lastFrameTimestamp + (1000 / currentSpeed)) {
            animationHandle = requestAnimationFrame(gameLoop);
            return;
        }

        lastFrameTimestamp = timestamp;
        const newState = currentGame.updateState();
        if (newState) {
            draw(newState);
        }
    } else if (latestState) {
        draw(latestState);
    }
    animationHandle = requestAnimationFrame(gameLoop);
}

const scoreRenderer = new ScoreRenderer(canvas);
const appleRenderer = new AppleRenderer(canvas);
const snakeRenderer = new SnakeRenderer(canvas);
const bombRenderer = new BombRenderer(canvas);

function draw(state) {
    snakeRenderer.draw(state);
    scoreRenderer.draw(state);
    appleRenderer.draw(state);
    bombRenderer.draw(state);
}

function clearCanvas() {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function stopGameloop() {
    cancelAnimationFrame(animationHandle);
    clearCanvas()
}
const presentation = {
    resizeGameArea: function () {
        // stretch the canvas to fill the tv inner area exactly in both dimensions
        // footer is pinned by flex layout, so footer.top - tv.top is deterministic;
        // cap height by aspect ratio so tall/narrow layouts don't over-stretch
        const footerTop = footer.getBoundingClientRect().top;
        const tvTop = tv.getBoundingClientRect().top;
        const availableWidth = tv.clientWidth;
        const availableHeight = Math.max(100, Math.min(
            footerTop - tvTop - 30,
            tv.clientWidth * (canvas.height / canvas.width)
        ));
        screen.style.width = `${availableWidth}px`;
        screen.style.height = `${availableHeight}px`;
    },
    createRoom: async function () {
        createRoom.disabled = true;
        joinRoom.disabled = true;
        leaveRoom.disabled = false;
        roomIdToJoinInput.disabled = true;
        playerIdInput.disabled = true;
        roomIdInput.disabled = true;
        playerId = readPlayerName();
        if (!playerId) {
            showToast('Enter a player name first');
            createRoom.disabled = false;
            joinRoom.disabled = false;
            leaveRoom.disabled = true;
            roomIdToJoinInput.disabled = false;
            playerIdInput.disabled = false;
            roomIdInput.disabled = false;
            return;
        }
        await ensureOnlineConnection();
        const roomCreationResponse = await gameClient.createRoom(getGameSettings());
        if (!roomCreationResponse || roomCreationResponse.error) {
            showToast(roomCreationResponse ? roomCreationResponse.error : 'Failed to create room');
            createRoom.disabled = false;
            joinRoom.disabled = false;
            leaveRoom.disabled = true;
            roomIdToJoinInput.disabled = false;
            playerIdInput.disabled = false;
            roomIdInput.disabled = false;
            return;
        }
        playerId = roomCreationResponse.playerId;
        currentRoomId = roomCreationResponse.roomId;
        currentSpeed = roomCreationResponse.speed;
        canvas.width = roomCreationResponse.canvasWidth;
        canvas.height = roomCreationResponse.canvasHeight;
        presentation.resizeGameArea();
        roomIdInput.value = currentRoomId;
        roomIdLabel.classList.add("active");
        presentation.startGame();
    },
    leaveRoom: async function () {
        createRoom.disabled = false;
        joinRoom.disabled = false;
        leaveRoom.disabled = true;
        roomIdToJoinInput.disabled = false;
        await presentation.stopGameStart();
        await gameClient.leaveRoom(currentRoomId, playerId);
        currentRoomId = null;
        roomIdInput.value = "";
        roomIdLabel.classList.remove("active");
    },
    joinRoom: async function () {
        createRoom.disabled = true;
        joinRoom.disabled = true;
        leaveRoom.disabled = false;
        roomIdToJoinInput.disabled = true;
        playerId = readPlayerName();
        if (!playerId) {
            showToast('Enter a player name first');
            createRoom.disabled = false;
            joinRoom.disabled = false;
            leaveRoom.disabled = true;
            roomIdToJoinInput.disabled = false;
            return;
        }
        await ensureOnlineConnection();
        const joinRoomResponse  = await gameClient.joinRoom(roomIdToJoinInput.value, playerId);
        if (!joinRoomResponse || joinRoomResponse.error) {
            showToast(joinRoomResponse ? joinRoomResponse.error : 'Room not found');
            createRoom.disabled = false;
            joinRoom.disabled = false;
            leaveRoom.disabled = true;
            roomIdToJoinInput.disabled = false;
            return;
        }
        currentRoomId = joinRoomResponse.roomId;
        playerId = joinRoomResponse.playerId;
        currentSpeed = joinRoomResponse.speed;
        canvas.width = joinRoomResponse.canvasWidth;
        canvas.height = joinRoomResponse.canvasHeight;
        presentation.resizeGameArea();
        roomIdInput.value = currentRoomId;
        roomIdLabel.classList.add("active");
        presentation.startGame();
    },
    startGame: function () {
        try {
            if (!online.checked) {
                startLocalGame();
            }

            animationHandle = requestAnimationFrame(gameLoop);
            screen.classList.add("crt");
            scanline.classList.add("scanline");
            tv.style.backgroundColor = "white";
            screen.classList.remove("turn-off");
            startButton.disabled = true;
            stopButton.disabled = false;
            onlineSwitch.disabled = true;

        }
        catch (err) {
            alert(err);

        }
    },
    connectOnlineGame: async function (event) {
        const online = event.target.checked;

        playerIdInput.disabled = false;
        roomIdToJoinInput.disabled =
            createRoom.disabled =
            joinRoom.disabled = !online;

        if (online) {
            // connect socket
            await ensureOnlineConnection();

        } else {
            // disconnect socket
            if (currentRoomId) {
                await gameClient.leaveRoom(currentRoomId, playerId);
                currentRoomId = null;
                roomIdInput.value = "";
                roomIdLabel.classList.remove("active");
            }

            await gameClient.disconnectAsync();
            connectPromise = null;
            playerId = null;
        }

    },
    stopGameStart: async function () {
        tv.style.backgroundColor = "rgba(0,0,0,0.9)";
        screen.classList.add("turn-off");
        startButton.disabled = false;
        stopButton.disabled = true;
        onlineSwitch.disabled = false;
        if (online.checked) {
            await stopOnlineGameStart();
        }

    },
    stopGameEnd: function () {
        stopGameloop()
        screen.classList.remove("crt");
        scanline.classList.remove("scanline");
        screen.classList.remove("turn-off");
        tv.style.backgroundColor = "white";
        currentGame = null;
        latestState = null;
    },
    disablePageScrollOnCanvas: function () {
        canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
        }, { passive: false });
    }


}

const keyboardListener = new KeyboardListener();
const swipeGestureListener = new SwipeGestureListener();

// listen for swipe gestures
window.addEventListener('touchstart', function (e) {
    swipeGestureListener.listen(e);
});

window.addEventListener('touchend', function (e) {
    swipeGestureListener.listen(e, swipeGestureHandler);
});

window.addEventListener("keydown", function (event) {
    keyboardListener.listen(event, keyboardHandler);
});

export default presentation;
import Game from './game.mjs';
import controls from './controls.mjs';
export default class Room {
    constructor(ownerId, roomId, gameSettings) {
        this.ownerId = ownerId;
        this.roomId = roomId;
        const { numberOfApples, numberOfPlayers, canvasHeight, canvasWidth } = gameSettings

        this.game = new Game(canvasWidth, canvasHeight, numberOfPlayers, numberOfApples);
    }

    joinRoom(playerId) {
        //check if player is already in room
        if (this.game.snakes.find(snake => snake.playerId == playerId)) {
            return;
        }

        return this.game.addSnake(playerId, controls[0]);
    }

    leaveRoom(playerId) {
   
        if (playerId == this.ownerId) {
            this.game.end();
        } else {
            this.game.removeSnake(playerId);
        }
    }

    updateState() {
        return this.game.updateState();
    }

    moveSnake(playerId, key) {

        this.game.moveSnakeByPlayerId(playerId, key);
    }


} 
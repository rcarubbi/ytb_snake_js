import Game from './game.mjs';
import controls from './controls.mjs';
export default class Room {
    constructor(ownerId, roomId, gameSettings) {
        this.ownerId = ownerId;
        this.roomId = roomId;
        this.game = new Game(gameSettings);
        this.speed = gameSettings.speed;
    }

    joinRoom(playerId) {
        const name = playerId && playerId.trim();
        if (!name) {
            return { error: 'Player name is required' };
        }
        if (name.length > 8) {
            return { error: 'Player name must be at most 8 characters' };
        }
        //check if name is already in room
        if (this.game.snakes.find(snake => snake.playerId == name)) {
            return { error: 'Name already taken' };
        }

        if (this.game.snakes.length >= this.game.numberOfPlayers) {
            return { error: 'Room is full' };
        }

        const acceptedPlayerId = this.game.addSnake(name, controls[0]);
        return {
            speed: this.speed,
            roomId: this.roomId,
            playerId: acceptedPlayerId,
            canvasWidth: this.game.canvasWidth,
            canvasHeight: this.game.canvasHeight,
        }
    }

    getState() {
        return this.game.getState();
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

    keyPressed(key, playerId) {
        this.game.keyPressed(key, playerId);
    }

    


} 
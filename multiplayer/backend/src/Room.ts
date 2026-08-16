import Game from "./game/Game.js";
import controls from "./game/controls.js";
import type { GameSettings, GameState, RoomResponse } from "./game/types.js";

export default class Room {
  ownerId: string;
  roomId: string;
  game: Game;
  speed: number;

  constructor(ownerId: string, roomId: string, gameSettings: GameSettings) {
    this.ownerId = ownerId;
    this.roomId = roomId;
    this.game = new Game(gameSettings);
    this.speed = gameSettings.speed;
  }

  joinRoom(playerId: string): RoomResponse {
    const name = playerId && playerId.trim();
    if (!name) {
      return { error: "Player name is required" };
    }
    if (name.length > 8) {
      return { error: "Player name must be at most 8 characters" };
    }
    if (this.game.snakes.some((snake) => snake.playerId === name)) {
      return { error: "Name already taken" };
    }
    if (this.game.snakes.length >= this.game.numberOfPlayers) {
      return { error: "Room is full" };
    }

    const acceptedPlayerId = this.game.addSnake(name, controls[0]);
    return {
      speed: this.speed,
      roomId: this.roomId,
      playerId: acceptedPlayerId,
      canvasWidth: this.game.canvasWidth,
      canvasHeight: this.game.canvasHeight,
    };
  }

  getState(): GameState {
    return this.game.getState();
  }

  leaveRoom(playerId: string) {
    if (playerId === this.ownerId) {
      this.game.end();
    } else {
      this.game.removeSnake(playerId);
    }
  }

  updateState(): GameState {
    return this.game.updateState();
  }

  keyPressed(key: string, playerId: string | null) {
    this.game.keyPressed(key, playerId ?? undefined);
  }
}

import Room from "./Room.js";
import type {
  GameSettings,
  GameState,
  RoomResponse,
  RoomSummary,
} from "./game/types.js";

export default class Lobby {
  private rooms = new Map<string, Room>();

  private generateUniqueRoomId(): string {
    let roomId = String(Math.floor(Math.random() * 10000));
    while (this.rooms.has(roomId)) {
      roomId = String(Math.floor(Math.random() * 10000));
    }
    return roomId;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  listRooms(): RoomSummary[] {
    return Array.from(this.rooms.values()).map((room) => ({
      roomId: room.roomId,
      ownerId: room.ownerId,
      players: room.game.snakes.map((snake) => snake.playerId),
      numberOfPlayers: room.game.numberOfPlayers,
      numberOfApples: room.game.numberOfApples,
      speed: room.speed,
    }));
  }

  createRoom(gameSettings: GameSettings): string {
    const roomId = this.generateUniqueRoomId();
    this.rooms.set(roomId, new Room(gameSettings.playerId ?? "", roomId, gameSettings));
    return roomId;
  }

  joinRoom(roomId: string, playerId: string): RoomResponse {
    const room = this.rooms.get(roomId);
    if (!room) return { error: "Room not found" };
    return room.joinRoom(playerId);
  }

  leaveRoom(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.leaveRoom(playerId);
    if (room.ownerId === playerId) {
      this.rooms.delete(roomId);
    }
  }

  updateState(roomId: string): GameState | undefined {
    return this.rooms.get(roomId)?.updateState();
  }

  getState(roomId: string): GameState | undefined {
    return this.rooms.get(roomId)?.getState();
  }

  keyPressed(roomId: string, key: string, playerId: string | null) {
    this.rooms.get(roomId)?.keyPressed(key, playerId);
  }
}

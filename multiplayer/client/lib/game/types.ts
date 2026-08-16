export interface Point {
  x: number;
  y: number;
}

export interface SnakeControls {
  left: string;
  up: string;
  right: string;
  down: string;
  bomb: string;
}

export interface Bomb {
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface SnakeData {
  playerId: string;
  color: string;
  tail: Point[];
  head: Point;
  size: number;
  remainingBombs: number;
  alive: boolean;
  x: number;
  y: number;
}

export interface AppleData {
  x: number;
  y: number;
  size: number;
  color: string;
}

export interface GameState {
  snakes: SnakeData[];
  apples: AppleData[];
  aliveSnakes: SnakeData[];
  bombs: Bomb[];
}

export interface GameSettings {
  numberOfPlayers: number;
  numberOfApples: number;
  speed: number;
  canvasWidth: number;
  canvasHeight: number;
  playerId?: string | null;
}

export interface RoomResponse {
  roomId?: string;
  playerId?: string;
  speed?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  error?: string;
}

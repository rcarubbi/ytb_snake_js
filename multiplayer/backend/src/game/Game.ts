import Snake from "./Snake.js";
import Apple from "./Apple.js";
import colors from "./colors.js";
import controls from "./controls.js";
import type { Bomb, GameSettings, GameState } from "./types.js";

export default class Game {
  canvasWidth: number;
  canvasHeight: number;
  numberOfPlayers: number;
  numberOfApples: number;
  snakes: Snake[] = [];
  apples: Apple[] = [];
  bombs: Bomb[] = [];
  playAreaTop = 40;

  constructor(gameSettings: GameSettings) {
    this.canvasWidth = gameSettings.canvasWidth;
    this.canvasHeight = gameSettings.canvasHeight;
    this.numberOfPlayers = gameSettings.numberOfPlayers;
    this.numberOfApples = gameSettings.numberOfApples;
  }

  initializeApples() {
    for (let i = 0; i < this.numberOfApples; i++) {
      this.addApple();
    }
  }

  getAliveSnakes() {
    return this.snakes.filter((snake) => snake.alive);
  }

  removeSnake(playerId: string) {
    const snake = this.snakes.find((s) => s.playerId === playerId);

    if (snake) {
      this.snakes.splice(this.snakes.indexOf(snake), 1);
    }
  }

  addSnake(playerId?: string, keyMap?: Snake["controls"]) {
    const snakeIndex = this.snakes.length;
    playerId = playerId || `Player${snakeIndex + 1}`;
    const cellsPerRow = Math.floor(this.canvasWidth / 100);
    const snakeInitialX = 20 + (snakeIndex % cellsPerRow) * 100;
    const snakeInitialY =
      this.playAreaTop + 20 + Math.floor(snakeIndex / cellsPerRow) * 120;
    this.snakes.push(
      new Snake(
        playerId,
        snakeInitialX,
        snakeInitialY,
        20,
        colors[snakeIndex],
        keyMap || controls[snakeIndex]
      )
    );
    if (this.snakes.length === 1) {
      this.initializeApples();
    }
    return playerId;
  }

  addApple() {
    this.apples.push(
      new Apple(
        this.getAliveSnakes(),
        20,
        this.canvasWidth,
        this.canvasHeight,
        this.playAreaTop
      )
    );
  }

  checkEatenApples() {
    for (const apple of this.apples) {
      for (const snake of this.getAliveSnakes()) {
        if (snake.eat(apple)) {
          this.apples.splice(this.apples.indexOf(apple), 1);
          this.addApple();
          snake.grow();
        }
      }
    }
  }

  checkCollisions() {
    const snakesToDie: Snake[] = [];
    for (const snake of this.getAliveSnakes()) {
      for (const otherSnake of this.getAliveSnakes()) {
        if (snake.hasCollision(otherSnake)) {
          snakesToDie.push(snake);
        }
      }
    }
    for (const snake of snakesToDie) {
      snake.die();
      setTimeout(this.recoverSnake, 5000, snake);
    }
  }

  recoverSnake(snake: Snake) {
    snake.alive = true;
  }

  updateSnakes() {
    for (const snake of this.getAliveSnakes()) {
      snake.move();
      this.teleportFromBorders(snake);
    }
  }

  teleportFromBorders(snake: Snake) {
    if (snake.head.x <= -snake.size) {
      snake.head.x = this.canvasWidth - snake.size;
    } else if (snake.head.x >= this.canvasWidth) {
      snake.head.x = 0;
    } else if (snake.head.y < this.playAreaTop) {
      snake.head.y = this.canvasHeight - snake.size;
    } else if (snake.head.y >= this.canvasHeight) {
      snake.head.y = this.playAreaTop;
    }
  }

  start() {
    this.snakes = [];
    this.apples = [];
    if (this.numberOfApples > 10) {
      throw new Error("Too many apples. Limit is 10");
    }

    if (this.numberOfPlayers > colors.length) {
      throw new Error("Too many players. Limit is " + colors.length);
    }
    for (let i = 0; i < this.numberOfPlayers; i++) {
      this.addSnake();
    }
  }

  updateState(): GameState {
    this.updateSnakes();
    this.checkCollisions();
    this.checkEatenApples();
    this.checkExplodedBombs();
    return this.getState();
  }

  getState(): GameState {
    return {
      snakes: this.snakes,
      apples: this.apples,
      aliveSnakes: this.getAliveSnakes() || [],
      bombs: this.bombs || [],
    };
  }

  checkExplodedBombs() {
    for (const snake of this.getAliveSnakes()) {
      for (const bomb of this.bombs) {
        if (snake.exploded(bomb)) {
          snake.die();
          setTimeout(this.recoverSnake, 5000, snake);
          this.bombs.splice(this.bombs.indexOf(bomb), 1);
        }
      }
    }
  }

  keyPressed(key: string, playerId?: string) {
    const snake = playerId
      ? this.snakes.find((s) => s.playerId === playerId)
      : this.snakes.find(
          (s) =>
            s.controls.up === key ||
            s.controls.down === key ||
            s.controls.left === key ||
            s.controls.right === key ||
            s.controls.bomb === key
        );

    if (snake) {
      if (key === snake.controls.bomb) {
        this.dropBomb(snake);
      } else {
        snake.keyDown(key);
      }
    }
  }

  end() {
    this.snakes = [];
    this.apples = [];
    this.bombs = [];
  }

  dropBomb(snake: Snake) {
    const bomb = snake.dropBomb();
    if (bomb) {
      this.bombs.push(bomb);
    }
  }
}

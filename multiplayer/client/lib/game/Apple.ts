import type Snake from "./Snake";

export default class Apple {
  color = "pink";
  size: number;
  width: number;
  height: number;
  top: number;
  x = 0;
  y = 0;

  constructor(
    snakes: Snake[],
    size: number,
    width: number,
    height: number,
    top: number
  ) {
    this.size = size;
    this.width = width;
    this.height = height;
    this.top = top;
    this.setEmptyPlace(snakes);
  }

  setEmptyPlace(snakes: Snake[]) {
    while (true) {
      const xCandidate = Math.floor((Math.random() * this.width) / this.size) * this.size;
      const yCandidate =
        Math.floor((Math.random() * this.height) / this.size) * this.size;

      if (this.isEmptyPlace(snakes, xCandidate, yCandidate) && yCandidate >= this.top) {
        this.x = xCandidate;
        this.y = yCandidate;
        break;
      }
    }
  }

  isEmptyPlace(snakes: Snake[], x: number, y: number) {
    for (const snake of snakes) {
      for (let i = 0; i < snake.tail.length; i++) {
        if (x === snake.tail[i].x && y === snake.tail[i].y) {
          return false;
        }
      }
    }
    return true;
  }
}

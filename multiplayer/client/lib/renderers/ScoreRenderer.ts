import type { GameState } from "@/lib/game/types";

export default class ScoreRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  draw(state: GameState) {
    this.ctx.font = "20px monospace";
    this.ctx.fillStyle = "white";
    const baseOffset = this.ctx.measureText("Score ").width;
    let x = baseOffset + 10;
    for (const snake of state.snakes) {
      this.ctx.fillStyle = snake.color;
      const label = `${snake.playerId}: ${snake.tail.length - 1} bomb:${snake.remainingBombs}`;
      this.ctx.fillText(label, x, 18);
      x += this.ctx.measureText(label).width + 30;
      if (x > this.canvas.width) break;
    }
  }
}

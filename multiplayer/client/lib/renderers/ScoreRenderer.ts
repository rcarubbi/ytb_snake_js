import type { GameState } from "@/lib/game/types";

export default class ScoreRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  draw(state: GameState) {
    this.ctx.font = "16px monospace";
    this.ctx.fillStyle = "white";
    const lineHeight = 22;
    let x = 10;
    let y = 18;
    for (const snake of state.snakes) {
      this.ctx.fillStyle = snake.color;
      const label = `${snake.playerId}:${snake.tail.length - 1} b:${snake.remainingBombs}`;
      const w = this.ctx.measureText(label).width;
      if (x + w > this.canvas.width - 10) {
        x = 10;
        y += lineHeight;
      }
      this.ctx.fillText(label, x, y);
      x += w + 16;
    }
  }
}

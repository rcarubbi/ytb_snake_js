import type { GameState } from "@/lib/game/types";

export default class BombRenderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
  }

  draw(state: GameState) {
    for (const bomb of state.bombs) {
      this.ctx.fillStyle = bomb.color;
      this.ctx.fillRect(bomb.x, bomb.y, bomb.size, bomb.size);
    }
  }
}

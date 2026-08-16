import type { GameState } from "@/lib/game/types";

export default class AppleRenderer {
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
  }

  draw(state: GameState) {
    for (const apple of state.apples) {
      this.ctx.fillStyle = apple.color;
      this.ctx.fillRect(apple.x, apple.y, apple.size, apple.size);
    }
  }
}

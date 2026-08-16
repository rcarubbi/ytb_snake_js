export default class SwipeGestureListener {
  SWIPE_MIN_LENGTH = 10;
  startX = 0;
  startY = 0;
  endX = 0;
  endY = 0;

  listen(
    event: TouchEvent,
    swipeGestureHandler?: (direction: string) => void
  ) {
    if (event.type === "touchstart") {
      this.startX = event.touches[0].clientX;
      this.startY = event.touches[0].clientY;
    } else if (event.type === "touchend") {
      this.endX = event.changedTouches[0].clientX;
      this.endY = event.changedTouches[0].clientY;
      if (swipeGestureHandler) {
        this.handleSwipe(swipeGestureHandler);
      }
    }
  }

  handleSwipe(swipeGestureHandler: (direction: string) => void) {
    const xDiff = this.endX - this.startX;
    const yDiff = this.endY - this.startY;
    const swipeLength = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

    if (swipeLength > this.SWIPE_MIN_LENGTH) {
      const swipeDirection = this.getSwipeDirection(xDiff, yDiff);
      swipeGestureHandler(swipeDirection);
    }
  }

  getSwipeDirection(xDiff: number, yDiff: number): string {
    const angle = this.getAngle(xDiff, yDiff);

    if (angle <= -45 && angle >= -135) {
      return "up";
    }
    if (angle >= 45 && angle <= 135) {
      return "down";
    }
    if (angle >= -45 && angle <= 45) {
      return "right";
    }
    return "left";
  }

  getAngle(xDiff: number, yDiff: number) {
    const angle = Math.atan2(yDiff, xDiff);
    return Math.round((angle * 180) / Math.PI);
  }
}

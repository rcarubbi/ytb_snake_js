import controls from "@/lib/game/controls";

export default class KeyboardListener {
  listen(event: KeyboardEvent, keyboardHandler: (key: string) => void) {
    for (const keyMap of controls) {
      switch (event.key) {
        case keyMap.up:
        case keyMap.down:
        case keyMap.left:
        case keyMap.right:
        case keyMap.bomb:
          keyboardHandler(event.key);
        default:
          break;
      }
    }
  }
}

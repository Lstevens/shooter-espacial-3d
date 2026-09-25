import { EventEmitter } from '../core/EventEmitter.js';

export class MouseInput {
  #firing = false;
  #events = new EventEmitter();
  #isLocked;
  #onMouseDown;
  #onMouseUp;
  #onContextMenu;
  #onWheel;

  constructor({ isLocked }) {
    this.#isLocked = isLocked;
    this.#onMouseDown = (event) => {
      if (event.button !== 0 || !this.#isLocked()) return;
      this.#firing = true;
      this.#events.emit('fire:press');
    };
    this.#onMouseUp = (event) => {
      if (event.button !== 0) return;
      this.#firing = false;
    };
    this.#onContextMenu = (event) => event.preventDefault();
    this.#onWheel = (event) => {
      if (!this.#isLocked()) return;
      this.#events.emit('weapon:cycle', event.deltaY > 0 ? 1 : -1);
    };
  }

  attach(target, { domElement }) {
    target.addEventListener('mousedown', this.#onMouseDown);
    target.addEventListener('mouseup', this.#onMouseUp);
    target.addEventListener('contextmenu', this.#onContextMenu);
    domElement.addEventListener('wheel', this.#onWheel, { passive: true });
  }

  get firing() {
    return this.#firing;
  }

  on(event, handler) {
    return this.#events.on(event, handler);
  }
}

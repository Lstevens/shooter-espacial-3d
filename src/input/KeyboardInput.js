import { EventEmitter } from '../core/EventEmitter.js';

const WEAPON_SLOTS = { Digit1: 'pistol', Digit2: 'ak', Digit3: 'knife' };

export class KeyboardInput {
  #codes = new Set();
  #events = new EventEmitter();
  #onKeyDown;
  #onKeyUp;

  constructor() {
    this.#onKeyDown = (event) => {
      this.#codes.add(event.code);
      const slot = WEAPON_SLOTS[event.code];
      if (slot) this.#events.emit('weapon:select', slot);
    };
    this.#onKeyUp = (event) => this.#codes.delete(event.code);
  }

  attach(target) {
    target.addEventListener('keydown', this.#onKeyDown);
    target.addEventListener('keyup', this.#onKeyUp);
  }

  isDown(code) {
    return this.#codes.has(code);
  }

  /** @returns {import('../contracts.js').MovementAxis} */
  get movement() {
    return {
      forward: Number(this.isDown('KeyW')) - Number(this.isDown('KeyS')),
      right: Number(this.isDown('KeyD')) - Number(this.isDown('KeyA')),
    };
  }

  on(event, handler) {
    return this.#events.on(event, handler);
  }
}

import { EventEmitter } from '../core/EventEmitter.js';
import { KeyboardInput } from './KeyboardInput.js';
import { MouseInput } from './MouseInput.js';

export const INPUT_EVENTS = {
  firePress: 'fire:press',
  weaponSelect: 'weapon:select',
  weaponCycle: 'weapon:cycle',
  lockRequest: 'lock:request',
};

/**
 * Fachada de entrada. Cada consumidor recibe solo la capacidad que usa
 * (ISP) y no se conoce ninguna regla de juego: aqui solo se traduce
 * eventos del navegador a senales con nombre.
 */
export class InputController {
  #events = new EventEmitter();
  #keyboard = new KeyboardInput();
  #mouse;

  constructor({ target, domElement, isLocked }) {
    this.#keyboard.attach(target);
    this.#mouse = new MouseInput({ isLocked });
    this.#mouse.attach(target, { domElement });
    domElement.addEventListener('click', () => this.#events.emit(INPUT_EVENTS.lockRequest));

    this.#mouse.on('fire:press', () => this.#events.emit(INPUT_EVENTS.firePress));
    this.#mouse.on('weapon:cycle', (direction) =>
      this.#events.emit(INPUT_EVENTS.weaponCycle, direction),
    );
    this.#keyboard.on('weapon:select', (slot) => this.#events.emit(INPUT_EVENTS.weaponSelect, slot));
  }

  on(event, handler) {
    return this.#events.on(event, handler);
  }

  /** @returns {import('../contracts.js').MovementAxis} */
  get movement() {
    return this.#keyboard.movement;
  }

  get firing() {
    return this.#mouse.firing;
  }
}

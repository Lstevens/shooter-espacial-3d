export class EventEmitter {
  #listeners = new Map();

  /** @returns {() => void} funcion para cancelar la suscripcion */
  on(event, handler) {
    if (!this.#listeners.has(event)) this.#listeners.set(event, new Set());
    this.#listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    this.#listeners.get(event)?.delete(handler);
  }

  emit(event, payload) {
    const handlers = this.#listeners.get(event);
    if (!handlers) return;
    for (const handler of [...handlers]) handler(payload);
  }
}

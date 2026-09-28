import { CAMPAIGN } from '../config.js';

/**
 * Progreso de la campania: cuantas etapas estan desbloqueadas. Sin three,
 * sin DOM y sinnocer el juego: solo indices y la etapa actual.
 *
 * El guardado usa localStorage, que puede fallar (modo privado, cuota llena,
 * almacenamiento bloqueado). Por eso todo pasa por #safeRead y #safeWrite:
 * si falla, la campania sigue funcionando en memoria.
 */
export class Campaign {
  #stages;
  #storage;
  #unlocked;

  constructor({ stages = CAMPAIGN.stages, storage = globalThis.localStorage } = {}) {
    this.#stages = stages;
    this.#storage = storage;
    this.#unlocked = this.#read();
  }

  /** Etapas desbloqueadas: 1 al empezar, 5 con la campaña completa. */
  get unlocked() {
    return this.#unlocked;
  }

  get stageIndex() {
    return this.#unlocked - 1;
  }

  get total() {
    return this.#stages.length;
  }

  /** @returns {import('../config.js').Stage} */
  get stage() {
    return this.#stages[this.stageIndex];
  }

  get isComplete() {
    return this.#unlocked >= this.#stages.length;
  }

  /**
   * Abre la siguiente etapa. Se llama una sola vez por partida, al derrotar
   * al jefe.
   * @returns {import('../config.js').Stage|null} la etapa desbloqueada,
   *   o null si ya estaban todas abiertas
   */
  advance() {
    if (this.isComplete) return null;
    this.#unlocked += 1;
    this.#write();
    return this.stage;
  }

  /** Vuelve a la primera etapa. Para empezar de cero la campaña. */
  reset() {
    this.#unlocked = 1;
    this.#write();
  }

  #read() {
    const raw = this.#safeRead();
    const parsed = Number.parseInt(raw ?? '', 10);
    if (!Number.isInteger(parsed) || parsed < 1) return 1;
    // Un guardado con mas etapas que las que existen no debe romper el juego.
    return Math.min(parsed, this.#stages.length);
  }

  #write() {
    try {
      this.#storage?.setItem(CAMPAIGN.storageKey, String(this.#unlocked));
    } catch {
      // Sin guardado no se rompe nada: el progreso vive en memoria.
    }
  }

  #safeRead() {
    try {
      return this.#storage?.getItem(CAMPAIGN.storageKey);
    } catch {
      return null;
    }
  }
}

import { GAME } from '../config.js';

/** Estado puro de la partida: fase, vida y reloj. Sin three ni DOM. */
export class GameState {
  constructor() {
    this.status = 'menu';
    this.hp = GAME.maxHp;
    this.elapsed = 0;
  }

  get isPlaying() {
    return this.status === 'playing';
  }

  get isFinished() {
    return this.status === 'dead' || this.status === 'won';
  }

  get secondsLeft() {
    return Math.max(0, GAME.duration - this.elapsed);
  }

  start() {
    this.status = 'playing';
  }

  pause() {
    if (this.isFinished) return;
    this.status = 'paused';
  }

  finish(won) {
    this.status = won ? 'won' : 'dead';
  }

  /** @returns {boolean} true si el jugador murio con este golpe */
  damage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  reset() {
    this.status = 'menu';
    this.hp = GAME.maxHp;
    this.elapsed = 0;
  }
}

import * as THREE from 'three';
import { GAME } from '../config.js';

const MAX_DELTA = 0.05;

/**
 * Orquestador: decide el orden de actualizacion y las transiciones de
 * la partida. No dibuja nada ni conoce detalles de ningun subsistema.
 */
export class Game {
  #scene;
  #renderer;
  #camera;
  #clock = new THREE.Clock();
  #state;
  #player;
  #input;
  #weapons;
  #mobs;
  #effects;
  #hud;
  #frame = () => this.#tick();

  constructor({ scene, renderer, camera, state, player, input, weapons, mobs, effects, hud }) {
    this.#scene = scene;
    this.#renderer = renderer;
    this.#camera = camera;
    this.#state = state;
    this.#player = player;
    this.#input = input;
    this.#weapons = weapons;
    this.#mobs = mobs;
    this.#effects = effects;
    this.#hud = hud;
  }

  start() {
    this.#weapons.setTargets(this.#mobs.targets);
    this.#hud.render(this.#snapshot());
    this.#renderer.setAnimationLoop(this.#frame);
  }

  restart() {
    this.#state.reset();
    this.#mobs.resetAll(this.#player.position);
    this.#weapons.setTargets(this.#mobs.targets);
    this.#hud.hideGameOver();
    this.#hud.render(this.#snapshot());
    this.#player.lock();
    this.#state.start();
  }

  onPlayerDamage(amount) {
    if (!this.#state.isPlaying) return;
    const died = this.#state.damage(amount);
    this.#hud.flashDamage();
    this.#hud.render(this.#snapshot());
    if (died) this.endGame(false);
  }

  endGame(won) {
    this.#state.finish(won);
    this.#player.unlock();
    this.#hud.showGameOver(won);
  }

  #tick() {
    const delta = Math.min(this.#clock.getDelta(), MAX_DELTA);
    this.update(delta);
    this.#renderer.render(this.#scene, this.#camera);
  }

  update(delta) {
    if (this.#state.isPlaying) {
      this.#player.update(delta, this.#input.movement);
      this.#mobs.update(delta, { targetPosition: this.#player.position });
      this.#updateTimer(delta);
      this.#weapons.update(delta);
    }
    this.#effects.update(delta);
    this.#hud.updateAnnounce(delta);
    this.#hud.render(this.#snapshot());
  }

  #updateTimer(delta) {
    this.#state.elapsed += delta;
    if (!this.#mobs.bossSpawned && this.#state.elapsed >= GAME.bossAt) {
      this.#mobs.spawnBoss(this.#player.position);
      this.#hud.announce('¡Apareció el jefe final!');
    }
    if (this.#state.elapsed >= GAME.duration) this.endGame(true);
  }

  #snapshot() {
    return {
      hp: this.#state.hp,
      maxHp: GAME.maxHp,
      secondsLeft: this.#state.secondsLeft,
      weaponLabel: this.#weapons.currentLabel,
    };
  }
}

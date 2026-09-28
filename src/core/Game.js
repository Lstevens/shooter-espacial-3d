import * as THREE from 'three';
import { GAME } from '../config.js';

const MAX_DELTA = 0.05;

/**
 * Orquestador: decide el orden de actualizacion y las transiciones de
 * la partida. No dibuja nada ni conoce detalles de ningun subsistema.
 * La campania vive aparte; aqui solo se pregunta cual es la etapa actual
 * y se avanza una casilla cuando el jefe cae.
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
  #skybox;
  #hud;
  #campaign;
  #arena;
  #frame = () => this.#tick();

  constructor({ scene, renderer, camera, state, player, input, weapons, mobs, effects, skybox, hud, campaign, arena }) {
    this.#scene = scene;
    this.#renderer = renderer;
    this.#camera = camera;
    this.#state = state;
    this.#player = player;
    this.#input = input;
    this.#weapons = weapons;
    this.#mobs = mobs;
    this.#effects = effects;
    this.#skybox = skybox;
    this.#hud = hud;
    this.#campaign = campaign;
    this.#arena = arena;
  }

  start() {
    this.#loadStage();
    this.#hud.render(this.#snapshot());
    this.#renderer.setAnimationLoop(this.#frame);
  }

  restart() {
    // Si la ultima partida completo la campania, repetir no tiene sentido:
    // el boto de reinicio vuelve a empezar desde la primera camara.
    if (this.#campaign.isComplete) this.#campaign.reset();
    this.#state.reset();
    this.#player.reset();
    this.#loadStage();
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
    if (!this.#state.isPlaying) return;
    const stage = this.#campaign.stage;
    const unlocked = won ? this.#campaign.advance() : null;
    this.#state.finish(won);
    this.#player.unlock();
    this.#hud.showGameOver({
      won,
      stage,
      unlocked,
      complete: won && unlocked === null,
      total: this.#campaign.total,
    });
  }

  #tick() {
    const delta = Math.min(this.#clock.getDelta(), MAX_DELTA);
    this.update(delta);
    this.#renderer.render(this.#scene, this.#camera);
  }

  update(delta) {
    if (this.#state.isPlaying) {
      this.#player.update(delta, this.#input.movement, this.#input.consumeJump());
      this.#mobs.update(delta, { targetPosition: this.#player.position });
      this.#updateTimer(delta);
      this.#weapons.update(delta);
      // Derrotar al jefe final gana la partida, sin esperar al reloj.
      if (this.#mobs.bossDefeated) this.endGame(true);
    }
    this.#effects.update(delta);
    this.#skybox?.update(delta, this.#clock.elapsedTime);
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

  #loadStage() {
    const stage = this.#campaign.stage;
    this.#arena.applyPalette(stage.palette);
    this.#mobs.setStage(stage, this.#player.position);
    this.#weapons.setTargets(this.#mobs.targets);
    this.#hud.announce(`Camara ${stage.id}/${this.#campaign.total}: ${stage.label}`);
  }

  #snapshot() {
    const stage = this.#campaign.stage;
    return {
      hp: this.#state.hp,
      maxHp: GAME.maxHp,
      secondsLeft: this.#state.secondsLeft,
      weaponLabel: this.#weapons.currentLabel,
      stageIndex: stage.id,
      stageTotal: this.#campaign.total,
      stageLabel: stage.label,
    };
  }
}
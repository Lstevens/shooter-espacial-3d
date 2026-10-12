import * as THREE from 'three';
import { GAME } from '../config.js';
import { Door } from '../scenes/Door.js';

const MAX_DELTA = 0.05;

/**
 * Orquestador: decide el orden de actualizacion y las transiciones de
 * la partida. No dibuja nada ni conoce detalles de ningun subsistema.
 *
 * Objetivo: derrotar al jefe de la camara. Al caer, aparece una puerta; al
 * cruzarla se restaura la vida y se carga la siguiente camara. Cruzar la
 * puerta de la ultima camara gana la partida.
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
  #collision;
  #door = null;
  #exitReady = false;
  #frame = () => this.#tick();

  constructor({ scene, renderer, camera, state, player, input, weapons, mobs, effects, skybox, hud, campaign, arena, collision }) {
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
    this.#collision = collision;
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
    this.#restartRun();
  }

  /** Reinicia desde la camara 1 sin importar el progreso de la campania. */
  restartFromFirst() {
    this.#campaign.reset();
    this.#restartRun();
  }

  #restartRun() {
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
    this.#hud.damageNumber(amount);
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
      kills: this.#mobs.kills,
      elapsed: this.#state.elapsed,
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
      // Derrotar al jefe abre la salida; cruzarla cambia de camara.
      if (this.#mobs.bossDefeated && !this.#exitReady) this.#openExit();
      if (this.#door) {
        this.#door.update(delta);
        if (this.#door.contains(this.#player.position)) this.#advanceStage();
      }
    }
    this.#effects.update(delta);
    this.#arena.update(delta);
    this.#skybox?.update(delta, this.#clock.elapsedTime);
    this.#hud.updateAnnounce(delta);
    this.#hud.render(this.#snapshot());
  }

  #updateTimer(delta) {
    this.#state.elapsed += delta;
    if (!this.#mobs.bossSpawned && this.#state.elapsed >= GAME.bossAt) {
      this.#mobs.spawnBoss(this.#player.position);
      this.#hud.announce('Alerta: firma hostil de mando detectada');
    }
  }

  /** Monta la puerta de salida y la abre. */
  #openExit() {
    this.#exitReady = true;
    this.#door = new Door({ scene: this.#scene });
    this.#door.open();
    this.#hud.announce('Núcleo destruido · acceso abierto');
  }

  /** Cruza la puerta: restaura vida y carga la siguiente camara, o gana. */
  #advanceStage() {
    this.#destroyDoor();
    const unlocked = this.#campaign.advance();
    if (unlocked === null) {
      this.endGame(true);
      return;
    }
    this.#state.hp = GAME.maxHp;
    this.#state.elapsed = 0;
    this.#player.reset();
    this.#loadStage();
  }

  #destroyDoor() {
    this.#door?.dispose();
    this.#door = null;
  }

  #loadStage() {
    const stage = this.#campaign.stage;
    this.#destroyDoor();
    this.#exitReady = false;
    this.#arena.setStage(stage);
    this.#collision?.setStatics(this.#arena.colliders);
    this.#mobs.setStage(stage, this.#player.position);
    this.#weapons.setTargets(this.#mobs.targets);
    this.#effects.setSparkEmitters(this.#arena.sparkPoints);
    this.#hud.announce(
      `Cámara ${stage.id}/${this.#campaign.total}: ${stage.label} · ${stage.difficulty}`,
    );
  }

  #snapshot() {
    const stage = this.#campaign.stage;
    return {
      hp: this.#state.hp,
      maxHp: GAME.maxHp,
      elapsed: this.#state.elapsed,
      weaponLabel: this.#weapons.currentLabel,
      stageIndex: stage.id,
      stageTotal: this.#campaign.total,
      stageLabel: stage.label,
      difficulty: stage.difficulty,
    };
  }
}

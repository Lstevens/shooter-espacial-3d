import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Game } from '../../src/core/Game.js';
import { WeaponSystem } from '../../src/weapons/WeaponSystem.js';
import { INPUT_EVENTS, InputController } from '../../src/input/InputController.js';

function makeAudioSpy() {
  const calls = [];
  const audio = Object.fromEntries(
    ['shot', 'hurt', 'death', 'win', 'bossDown'].map((name) => [
      name,
      (...args) => calls.push([name, ...args]),
    ]),
  );
  return { audio, calls };
}

function makeGame({ audio, hp = 100 } = {}) {
  const state = {
    isPlaying: true,
    hp,
    elapsed: 0,
    damage(amount) {
      this.hp -= amount;
      return this.hp <= 0;
    },
    finish(won) {
      this.isPlaying = false;
      this.status = won ? 'won' : 'dead';
    },
  };
  const campaign = {
    stage: { id: 1, label: 'Hangar', difficulty: 'Normal' },
    total: 5,
    advance() {
      return this.stage;
    },
  };
  const player = {
    update() {},
    unlock() {},
    position: new THREE.Vector3(),
  };
  const input = { movement: {}, consumeJump: () => false };
  const weapons = { currentLabel: 'Pistola', update() {} };
  const mobs = {
    kills: 0,
    bossDefeated: false,
    bossSpawned: true,
    update() {},
  };
  const hud = {
    flashDamage() {},
    damageNumber() {},
    render() {},
    showGameOver() {},
    updateAnnounce() {},
    announce() {},
  };
  const effects = { update() {}, setSparkEmitters() {} };
  const arena = { update() {}, setStage() {}, sparkPoints: [], colliders: [] };
  return {
    game: new Game({
      scene: new THREE.Scene(),
      renderer: {},
      camera: {},
      state,
      player,
      input,
      weapons,
      mobs,
      effects,
      skybox: null,
      hud,
      campaign,
      arena,
      collision: null,
      audio,
    }),
    state,
    mobs,
  };
}

test('arma: un disparo aceptado reproduce el sonido del arma seleccionada', () => {
  const calls = [];
  const weapons = new WeaponSystem({
    view: { bobPhase: 0 },
    viewModel: {
      onSwitch() {},
      onShot() {},
      update() {},
    },
    clock: { getElapsedTime: () => 1 },
    isFiring: () => false,
    effects: {},
    attacks: [],
    audio: { shot: (weaponId) => calls.push(weaponId) },
  });

  assert.equal(weapons.tryFire(), true);
  assert.deepEqual(calls, ['knife']);
});

test('jugador: un impacto no letal reproduce el sonido de daño', () => {
  const { audio, calls } = makeAudioSpy();
  const { game } = makeGame({ audio });

  game.onPlayerDamage(10);

  assert.deepEqual(calls, [['hurt']]);
});

test('jugador: morir reproduce el sonido de muerte, no solo el de daño', () => {
  const { audio, calls } = makeAudioSpy();
  const { game } = makeGame({ audio, hp: 10 });

  game.onPlayerDamage(10);

  assert.deepEqual(calls, [['death']]);
});

test('partida: ganar reproduce la fanfarria de victoria', () => {
  const { audio, calls } = makeAudioSpy();
  const { game } = makeGame({ audio });

  game.endGame(true);

  assert.deepEqual(calls, [['win']]);
});

test('entrada: tecla M emite el evento para silenciar el audio', () => {
  const handlers = new Map();
  const target = {
    addEventListener(type, handler) {
      handlers.set(type, handler);
    },
  };
  const domElement = {
    addEventListener(type, handler) {
      handlers.set(`dom:${type}`, handler);
    },
  };
  const input = new InputController({ target, domElement, isLocked: () => false });
  let toggles = 0;
  input.on(INPUT_EVENTS.muteToggle, () => { toggles += 1; });
  const event = { code: 'KeyM', repeat: false, preventDefault() {} };

  handlers.get('keydown')(event);
  handlers.get('keydown')({ ...event, repeat: true });

  assert.equal(toggles, 1);
});

test('jefe: abrir la salida tras derrotarlo reproduce su sonido', () => {
  const { audio, calls } = makeAudioSpy();
  const { game, mobs } = makeGame({ audio });
  mobs.bossDefeated = true;

  game.update(1 / 60);

  assert.deepEqual(calls, [['bossDown']]);
});

import './style.css';
import * as THREE from 'three';
import { Arena } from './engine/Arena.js';
import { createRenderer } from './engine/createRenderer.js';
import { Player } from './player/Player.js';
import { InputController, INPUT_EVENTS } from './input/InputController.js';
import { ViewModel } from './weapons/ViewModel.js';
import { WeaponSystem } from './weapons/WeaponSystem.js';
import { HitscanAttack } from './weapons/attacks/HitscanAttack.js';
import { MeleeAttack } from './weapons/attacks/MeleeAttack.js';
import { MobSystem } from './enemies/MobSystem.js';
import { EffectsSystem } from './fx/EffectsSystem.js';
import { Hud } from './ui/Hud.js';
import { GameState } from './core/GameState.js';
import { Game } from './core/Game.js';

const arena = new Arena();
const renderer = createRenderer(document.body);
const clock = new THREE.Clock();

const state = new GameState();
const hud = new Hud();
const effects = new EffectsSystem({ scene: arena.scene });
const player = new Player({ scene: arena.scene, domElement: renderer.domElement });

const mobs = new MobSystem({
  scene: arena.scene,
  onPlayerDamage: (amount) => game.onPlayerDamage(amount),
});

const viewModel = new ViewModel({ camera: player.camera });
const weapons = new WeaponSystem({
  view: player,
  viewModel,
  clock,
  effects,
  isFiring: () => input.firing,
  attacks: [new HitscanAttack(), new MeleeAttack()],
});

const input = new InputController({
  target: window,
  domElement: renderer.domElement,
  isLocked: () => player.isLocked,
});

const game = new Game({
  scene: arena.scene,
  renderer,
  camera: player.camera,
  state,
  player,
  input,
  weapons,
  mobs,
  effects,
  hud,
});

player.on('lock', () => {
  state.start();
  hud.setCrosshair(true);
});

player.on('unlock', () => {
  state.pause();
  hud.setCrosshair(false);
});

input.on(INPUT_EVENTS.lockRequest, () => {
  if (player.isLocked || state.isFinished) return;
  player.lock();
});

input.on(INPUT_EVENTS.firePress, () => {
  if (!weapons.current.automatic) weapons.tryFire();
});

input.on(INPUT_EVENTS.weaponSelect, (slot) => weapons.select(slot));

input.on(INPUT_EVENTS.weaponCycle, (direction) => weapons.cycle(direction));

hud.onRestart(() => game.restart());

window.addEventListener('resize', () => {
  player.onResize(window.innerWidth, window.innerHeight);
  renderer.setSize(window.innerWidth, window.innerHeight);
});

game.start();

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { PLAYER, ARENA } from '../config.js';
import { EventEmitter } from '../core/EventEmitter.js';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Jugador en primera persona. Implementa el contrato ViewSource
 * (origin, forward, muzzleWorldPosition, bobPhase) que usan las armas.
 */
export class Player {
  #camera;
  #controls;
  #events = new EventEmitter();
  #forward = new THREE.Vector3();
  #right = new THREE.Vector3();
  #direction = new THREE.Vector3();
  #muzzle = new THREE.Vector3(0.3, -0.22, -1.1);
  bobPhase = 0;

  constructor({ scene, domElement }) {
    this.#camera = new THREE.PerspectiveCamera(
      PLAYER.fov,
      window.innerWidth / window.innerHeight,
      PLAYER.near,
      PLAYER.far,
    );
    this.#camera.position.set(0, PLAYER.height, 0);
    scene.add(this.#camera);

    this.#controls = new PointerLockControls(this.#camera, domElement);
    this.#controls.addEventListener('lock', () => this.#events.emit('lock'));
    this.#controls.addEventListener('unlock', () => this.#events.emit('unlock'));
  }

  get camera() {
    return this.#camera;
  }

  get origin() {
    return this.#camera.position;
  }

  get position() {
    return this.#camera.position;
  }

  get isLocked() {
    return this.#controls.isLocked;
  }

  forward(target = new THREE.Vector3()) {
    return this.#camera.getWorldDirection(target);
  }

  muzzleWorldPosition() {
    return this.#camera.localToWorld(this.#muzzle);
  }

  on(event, handler) {
    return this.#events.on(event, handler);
  }

  lock() {
    this.#controls.lock();
  }

  unlock() {
    this.#controls.unlock();
  }

  onResize(width, height) {
    this.#camera.aspect = width / height;
    this.#camera.updateProjectionMatrix();
  }

  /** @param {import('../contracts.js').MovementAxis} axis */
  update(delta, axis) {
    const forward = this.forward(this.#forward);
    forward.y = 0;
    forward.normalize();
    this.#right.crossVectors(forward, UP).normalize();

    const direction = this.#direction.set(0, 0, 0);
    direction.addScaledVector(forward, axis.forward);
    direction.addScaledVector(this.#right, axis.right);

    if (direction.lengthSq() > 0) {
      direction.normalize();
      this.#camera.position.addScaledVector(direction, PLAYER.speed * delta);
      this.bobPhase += delta * PLAYER.bobRate;
    }

    const limit = ARENA.half - PLAYER.edgeMargin;
    this.#camera.position.x = THREE.MathUtils.clamp(this.#camera.position.x, -limit, limit);
    this.#camera.position.z = THREE.MathUtils.clamp(this.#camera.position.z, -limit, limit);
    this.#camera.position.y = PLAYER.height;
  }
}

import * as THREE from 'three';
import { ARENA } from '../config.js';

/** Altura por debajo de la cual una caja es un escalon y no bloquea. */
const STEP_HEIGHT = 0.35;
const EPSILON = 1e-6;

/**
 * Colisiones sin motor de fisicas: cajas estaticas para el escenario y
 * circulos dinamicos para los enemigos vivos.
 *
 * El mundo trabaja en 2D sobre el plano del suelo (X, Z) con una prueba
 * vertical sencilla: una caja solo bloquea si corta la altura del cuerpo.
 * Asi las tuberias y el techo (por encima de la cabeza) no estorban, pero
 * la chatarra y las vigas a ras de suelo si.
 *
 * No conoce ni el jugador ni los enemigos: recibe una posicion y la corrige.
 */
export class CollisionWorld {
  #statics = [];
  #dynamic = [];
  #half;

  constructor({ half = ARENA.half } = {}) {
    this.#half = half;
  }

  get statics() {
    return this.#statics;
  }

  /** @param {THREE.Box3[]} boxes */
  setStatics(boxes) {
    this.#statics = boxes;
  }

  /** @param {{x: number, z: number, radius: number}[]} circles */
  setDynamic(circles) {
    this.#dynamic = circles;
  }

  /**
   * Consulta sin mover: true si un cuerpo de ese radio no cabe ahi, sea
   * por el limite de la arena o por un prop que corta su altura. La usan
   * los enemigos para decidir hacia donde esquivar antes de caminar.
   * @param {{x: number, z: number}} position
   * @param {number} radius
   * @param {number} bodyHeight
   */
  isBlocked(position, radius, bodyHeight) {
    const limit = this.#half - radius;
    if (
      position.x < -limit ||
      position.x > limit ||
      position.z < -limit ||
      position.z > limit
    ) {
      return true;
    }
    for (const box of this.#statics) {
      if (box.max.y <= STEP_HEIGHT || box.min.y >= bodyHeight) continue;
      const closestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x);
      const closestZ = THREE.MathUtils.clamp(position.z, box.min.z, box.max.z);
      const dx = position.x - closestX;
      const dz = position.z - closestZ;
      if (dx * dx + dz * dz < radius * radius) return true;
    }
    return false;
  }

  /**
   * Corrige contra el limite de la arena y los props estaticos.
   * @param {THREE.Vector3} position se modifica in situ
   * @param {number} radius
   * @param {number} bodyHeight altura de los ojos sobre el suelo
   */
  resolveEnvironment(position, radius, bodyHeight) {
    this.#resolveBounds(position, radius);
    this.#resolveStatics(position, radius, bodyHeight);
    return position;
  }

  /** Corrige contra los enemigos vivos (circulos dinamicos). */
  resolveActors(position, radius) {
    for (const circle of this.#dynamic) {
      const dx = position.x - circle.x;
      const dz = position.z - circle.z;
      const minDistance = radius + circle.radius;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= minDistance * minDistance || distanceSq < EPSILON) continue;
      const distance = Math.sqrt(distanceSq);
      const push = (minDistance - distance) / distance;
      position.x += dx * push;
      position.z += dz * push;
    }
    return position;
  }

  #resolveBounds(position, radius) {
    const limit = this.#half - radius;
    position.x = THREE.MathUtils.clamp(position.x, -limit, limit);
    position.z = THREE.MathUtils.clamp(position.z, -limit, limit);
  }

  #resolveStatics(position, radius, bodyHeight) {
    for (const box of this.#statics) {
      // Escalones bajos se pisan; lo que queda por encima de la cabeza no estorba.
      if (box.max.y <= STEP_HEIGHT || box.min.y >= bodyHeight) continue;

      const closestX = THREE.MathUtils.clamp(position.x, box.min.x, box.max.x);
      const closestZ = THREE.MathUtils.clamp(position.z, box.min.z, box.max.z);
      let dx = position.x - closestX;
      let dz = position.z - closestZ;
      const distanceSq = dx * dx + dz * dz;
      if (distanceSq >= radius * radius) continue;

      if (distanceSq < EPSILON) {
        this.#pushOutOfBox(position, box, radius);
        continue;
      }

      const distance = Math.sqrt(distanceSq);
      const push = (radius - distance) / distance;
      position.x += dx * push;
      position.z += dz * push;
    }
  }

  /** Centro dentro de la caja: se sale por la cara mas cercana. */
  #pushOutOfBox(position, box, radius) {
    const left = position.x - box.min.x;
    const right = box.max.x - position.x;
    const back = position.z - box.min.z;
    const front = box.max.z - position.z;
    const smallest = Math.min(left, right, back, front);
    if (smallest === left) position.x = box.min.x - radius;
    else if (smallest === right) position.x = box.max.x + radius;
    else if (smallest === back) position.z = box.min.z - radius;
    else position.z = box.max.z + radius;
  }
}

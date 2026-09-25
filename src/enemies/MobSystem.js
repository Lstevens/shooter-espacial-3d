import * as THREE from 'three';
import { MOB, MOB_VARIANTS } from '../config.js';
import { Mob } from './Mob.js';

/**
 * Ciclo de vida de los enemigos: aparicion, reaparicion y eliminacion
 * del jefe. No sabe nada del jugador, solo recibe su posicion.
 */
export class MobSystem {
  #scene;
  #onPlayerDamage;
  #mobs = [];
  #boss = null;
  #bossSpawned = false;
  #random;

  constructor({ scene, onPlayerDamage, random = Math.random }) {
    this.#scene = scene;
    this.#onPlayerDamage = onPlayerDamage;
    this.#random = random;

    for (let i = 0; i < MOB.count; i += 1) {
      const mob = this.#create(MOB_VARIANTS.grunt);
      mob.reset(this.randomSpawnPosition(new THREE.Vector3(), MOB.spawnMinDistance));
      this.#mobs.push(mob);
    }
  }

  get targets() {
    return this.#mobs;
  }

  get bossSpawned() {
    return this.#bossSpawned;
  }

  spawnBoss(playerPosition) {
    if (this.#bossSpawned) return;
    this.#bossSpawned = true;
    const boss = this.#create(MOB_VARIANTS.boss);
    boss.reset(this.randomSpawnPosition(playerPosition, MOB.spawnMinDistance));
    this.#mobs.push(boss);
    this.#boss = boss;
  }

  /** @param {{ targetPosition: THREE.Vector3 }} context */
  update(delta, context) {
    for (const mob of this.#mobs) {
      if (!mob.isAlive) {
        if (mob.updateDead(delta)) {
          mob.reset(this.randomSpawnPosition(context.targetPosition, MOB.spawnMinDistance));
        }
        continue;
      }
      mob.update(delta, {
        targetPosition: context.targetPosition,
        onHit: this.#onPlayerDamage,
      });
    }
  }

  resetAll(playerPosition) {
    if (this.#boss) {
      this.#scene.remove(this.#boss.group);
      this.#mobs.splice(this.#mobs.indexOf(this.#boss), 1);
      this.#boss = null;
    }
    this.#bossSpawned = false;
    for (const mob of this.#mobs) {
      mob.reset(this.randomSpawnPosition(playerPosition, MOB.spawnMinDistance));
    }
  }

  #create(variant) {
    const mob = new Mob({ variant });
    this.#scene.add(mob.group);
    return mob;
  }

  randomSpawnPosition(playerPosition, minDistance) {
    for (let i = 0; i < MOB.spawnAttempts; i += 1) {
      const angle = this.#random() * Math.PI * 2;
      const radius = MOB.spawnRingInner + this.#random() * MOB.spawnRingSpread;
      const position = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      const distance = Math.hypot(
        position.x - playerPosition.x,
        position.z - playerPosition.z,
      );
      if (distance >= minDistance) return position;
    }
    const angle = this.#random() * Math.PI * 2;
    const radius = MOB.spawnFallbackInner + this.#random();
    return new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  }
}

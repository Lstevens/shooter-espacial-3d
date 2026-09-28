import * as THREE from 'three';
import { MOB, MOB_VARIANTS } from '../config.js';
import { Mob } from './Mob.js';
import { disposeModel } from './MobFactory.js';

/**
 * Ciclo de vida de los enemigos: aparicion, reaparicion y eliminacion
 * del jefe. No sabe nada del jugador, solo recibe su posicion. Tampoco
 * conoce la campania: recibe la etapa ya resuelta en setStage().
 */
export class MobSystem {
  #scene;
  #onPlayerDamage;
  #mobs = [];
  /** Enemigos normales retirados de la arena al aparecer el jefe. */
  #reserve = [];
  #boss = null;
  #bossSpawned = false;
  #stage;
  #random;
  #normalVariants;

  constructor({ scene, onPlayerDamage, random = Math.random }) {
    this.#scene = scene;
    this.#onPlayerDamage = onPlayerDamage;
    this.#random = random;
    this.#normalVariants = Object.values(MOB_VARIANTS).filter((v) => !v.isBoss);
  }

  get targets() {
    return this.#mobs;
  }

  get bossSpawned() {
    return this.#bossSpawned;
  }

  /** @returns {boolean} true si el jefe ya aparecio y el jugador lo elimino */
  get bossDefeated() {
    return this.#bossSpawned && this.#boss !== null && !this.#boss.isAlive;
  }

  /**
   * Prepara la arena para una etapa de la campania. Es el unico camino de
   * creacion de enemigos: se usa al arrancar, al reiniciar y al pasar de
   * camara. Reconstruye todo porque una etapa cambia el numero y la fuerza
   * de los enemigos, no solo sus posiciones.
   * @param {import('../config.js').Stage} stage
   * @param {THREE.Vector3} playerPosition
   */
  setStage(stage, playerPosition) {
    this.#clearAll();
    this.#stage = stage;
    this.#bossSpawned = false;

    // Reparto por turno, no al azar: con 6 mobs y 3 tipos aparecen 2 de
    // cada uno aunque el jugador muera en 10 segundos.
    for (let i = 0; i < stage.mobCount; i += 1) {
      const variant = this.#normalVariants[i % this.#normalVariants.length];
      const mob = this.#create(variant);
      mob.reset(this.randomSpawnPosition(playerPosition, MOB.spawnMinDistance));
      this.#mobs.push(mob);
    }
  }

  spawnBoss(playerPosition) {
    if (this.#bossSpawned) return;
    this.#bossSpawned = true;
    this.#thinEscort();
    const boss = this.#create(this.#stageBossVariant());
    boss.reset(this.randomSpawnPosition(playerPosition, MOB.spawnMinDistance));
    this.#mobs.push(boss);
    this.#boss = boss;
  }

  /** @param {{ targetPosition: THREE.Vector3 }} context */
  update(delta, context) {
    for (const mob of this.#mobs) {
      if (!mob.isAlive) {
        // El jefe es de una sola vez: si muere, se acaba la partida.
        if (mob === this.#boss) continue;
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

  /** Libera mobs, jefe y reserva sin excepcion: la escena queda vacia. */
  #clearAll() {
    for (const mob of this.#mobs) {
      this.#scene.remove(mob.group);
      disposeModel(mob.group);
    }
    for (const mob of this.#reserve) {
      this.#scene.remove(mob.group);
      disposeModel(mob.group);
    }
    this.#mobs.length = 0;
    this.#reserve.length = 0;
    this.#boss = null;
  }

  /**
   * Variante escalada por la etapa. Mob no cambia: lee speed/damage de la
   * variante, asi que aqui se copian los valores base y se aplican los
   * multiplicadores de la camara.
   */
  #create(variant) {
    const scaled = {
      ...variant,
      speed: variant.speed * this.#stage.speedScale,
      damage: Math.round(variant.damage * this.#stage.damageScale),
    };
    const mob = new Mob({ variant: scaled, maxHp: scaled.maxHp });
    this.#scene.add(mob.group);
    return mob;
  }

  /** El jefe usa sus propios valores de la etapa, no factores. */
  #stageBossVariant() {
    const { bossHp, bossDamage, bossSpeed } = this.#stage;
    return { ...MOB_VARIANTS.boss, maxHp: bossHp, damage: bossDamage, speed: bossSpeed };
  }

  /**
   * Al aparecer el jefe la arena se despeja: solo quedan
   * stage.escortCount enemigos normales. Los sobrantes se guardan en
   * reserva (fuera de escena) y se liberan en el proximo setStage.
   */
  #thinEscort() {
    const normals = this.#mobs.filter((mob) => !mob.variant.isBoss);
    const extra = normals.length - this.#stage.escortCount;
    for (let i = 0; i < extra; i += 1) {
      const mob = normals[i];
      if (mob.isAlive) mob.kill();
      this.#scene.remove(mob.group);
      this.#mobs.splice(this.#mobs.indexOf(mob), 1);
      this.#reserve.push(mob);
    }
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
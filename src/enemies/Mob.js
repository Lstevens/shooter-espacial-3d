import * as THREE from 'three';
import { MOB } from '../config.js';
import { createMobModel, registerEntity } from './MobFactory.js';

const HIT_FLASH = 0x88ccff;
const HIT_FLASH_TIME = 0.12;
const ATTACK_ANIM_TIME = 0.4;
/** Desvios probados al esquivar, en radianes, de menor a mayor. */
const NAV_OFFSETS = [0, 0.5, 1.0, 1.5, 2.0];

/**
 * Enemigo. Implementa el contrato Target (group, position, isAlive,
 * takeDamage) que consumen las estrategias de ataque.
 * El jefe es la misma clase con otra variante: no necesita subclase.
 * La geometria y la animacion de las piezas viven en MobFactory.
 */
export class Mob {
  #model;
  #materials;
  #baseEmissive;
  #hp;
  #maxHp;
  #dead = false;
  #respawnTimer = 0;
  #attackCooldown = 0;
  #hitFlash = 0;
  #time = 0;
  #attacking = false;
  #attackTime = 0;
  #toTarget = new THREE.Vector3();
  #next = new THREE.Vector3();
  #moveDir = new THREE.Vector3();
  #probe = new THREE.Vector3();
  /** Lado al que rodea un obstaculo. Fijo para no oscilar izquierda/derecha. */
  #turnSign = Math.random() < 0.5 ? -1 : 1;
  #onKilled;

  constructor({ variant, maxHp = MOB.maxHp, level, onKilled }) {
    this.#model = createMobModel(variant, level);
    this.group = this.#model.group;
    this.#materials = this.#model.materials;
    this.#baseEmissive = this.#materials.map((material) => material.emissive.clone());
    this.variant = variant;
    this.#maxHp = maxHp;
    this.#hp = maxHp;
    this.#onKilled = onKilled;
    registerEntity(this.group, this);
  }

  get position() {
    return this.group.position;
  }

  get isAlive() {
    return !this.#dead;
  }

  get hp() {
    return this.#hp;
  }

  takeDamage(amount) {
    if (this.#dead) return;
    this.#hp -= amount;
    for (const material of this.#materials) material.emissive.setHex(HIT_FLASH);
    this.#hitFlash = HIT_FLASH_TIME;
    if (this.#hp <= 0) {
      this.kill();
      // Solo cuenta la muerte por dano del jugador, no el retiro de escolta.
      this.#onKilled?.();
    }
  }

  kill() {
    this.#hp = 0;
    this.#dead = true;
    this.#respawnTimer = MOB.respawnDelay;
    this.#attacking = false;
    this.#restoreEmissive();
    this.group.visible = false;
  }

  reset(position) {
    this.#hp = this.#maxHp;
    this.#dead = false;
    this.#attackCooldown = MOB.respawnCooldown;
    this.#hitFlash = 0;
    this.#time = 0;
    this.#attacking = false;
    this.#attackTime = 0;
    this.#restoreEmissive();
    this.group.visible = true;
    this.group.position.copy(position);
  }

  /** @returns {boolean} true cuando toca reaparecer */
  updateDead(delta) {
    this.#respawnTimer -= delta;
    return this.#respawnTimer <= 0;
  }

  /** @param {import('../contracts.js').AiContext} context */
  update(delta, context) {
    this.#time += delta;
    this.#attackCooldown -= delta;
    this.#tickHitFlash(delta);

    if (this.#attacking) {
      this.#attackTime += delta;
      if (this.#attackTime >= ATTACK_ANIM_TIME) this.#attacking = false;
    }

    const toTarget = this.#toTarget.subVectors(context.targetPosition, this.group.position);
    toTarget.y = 0;
    const distance = toTarget.length();
    const { attackRange, speed } = this.variant;
    const bodyHeight = this.group.position.y + 1.8;

    const moving = distance < MOB.aggroRange && distance > attackRange;
    let facingX = toTarget.x;
    let facingZ = toTarget.z;
    if (moving) {
      toTarget.normalize();
      // Si la linea recta esta tapada, rodea el prop por el lado mas cercano
      // en vez de empujarlo de frente y quedarse clavado.
      const direction = this.#chooseDirection(toTarget, context.collision, bodyHeight);
      this.#next.copy(this.group.position).addScaledVector(direction, speed * delta);
      context.collision?.resolveEnvironment(this.#next, MOB.radius, bodyHeight);
      this.group.position.copy(this.#next);
      facingX = direction.x;
      facingZ = direction.z;
    }

    // Los modelos miran hacia -Z, asi que el yaw va invertido respecto a lookAt.
    // Mira hacia donde camina; al atacar, hacia el jugador.
    if (Math.abs(facingX) > 1e-4 || Math.abs(facingZ) > 1e-4) {
      this.group.rotation.y = Math.atan2(-facingX, -facingZ);
    }

    this.#model.animate(delta, {
      time: this.#time,
      moving,
      attacking: this.#attacking,
      attackTime: this.#attackTime,
    });

    if (distance <= attackRange && this.#attackCooldown <= 0) {
      this.#attackCooldown = this.variant.attackCooldown;
      this.#attacking = true;
      this.#attackTime = 0;
      context.onHit(this.variant.damage);
    }
  }

  /**
   * Devuelve la direccion de avance menos desviada que no choque. Prueba
   * primero de frente y luego giros cada vez mayores, empezando por el lado
   * que el mob ya venia usando para no oscilar. Si todo esta tapado avanza
   * de frente y deja que la colision lo deslice.
   * @param {THREE.Vector3} desired direccion normalizada al objetivo
   * @param {import('../engine/CollisionWorld.js').CollisionWorld|null} collision
   * @param {number} bodyHeight
   */
  #chooseDirection(desired, collision, bodyHeight) {
    if (!collision) {
      this.#moveDir.copy(desired);
      return this.#moveDir;
    }
    for (const offset of NAV_OFFSETS) {
      if (offset === 0) {
        if (!this.#isAheadBlocked(desired, collision, bodyHeight)) {
          this.#moveDir.copy(desired);
          return this.#moveDir;
        }
        continue;
      }
      const signs = this.#turnSign > 0 ? [1, -1] : [-1, 1];
      for (const sign of signs) {
        this.#rotateY(desired, offset * sign);
        if (!this.#isAheadBlocked(this.#moveDir, collision, bodyHeight)) {
          this.#turnSign = sign;
          return this.#moveDir;
        }
      }
    }
    this.#moveDir.copy(desired);
    return this.#moveDir;
  }

  /** Gira una direccion sobre el plano XZ (positivo = sentido horario). */
  #rotateY(direction, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = direction.x;
    const z = direction.z;
    this.#moveDir.set(x * cos + z * sin, 0, -x * sin + z * cos);
  }

  /** Sondea varios puntos de la linea de avance, no solo el final. */
  #isAheadBlocked(direction, collision, bodyHeight) {
    const probeRadius = MOB.radius * MOB.navProbeScale;
    for (let i = 1; i <= MOB.navSteps; i += 1) {
      const ahead = (MOB.navLookahead * i) / MOB.navSteps;
      this.#probe.copy(this.group.position).addScaledVector(direction, ahead);
      if (collision.isBlocked(this.#probe, probeRadius, bodyHeight)) return true;
    }
    return false;
  }

  #tickHitFlash(delta) {
    if (this.#hitFlash <= 0) return;
    this.#hitFlash -= delta;
    if (this.#hitFlash <= 0) this.#restoreEmissive();
  }

  /**
   * Vuelve cada material a su emissive original. Sin esto el brillo de los
   * ojos se perdia para siempre: el destello lo sobreescribe a azul y el
   * reset lo dejaba en negro.
   */
  #restoreEmissive() {
    this.#materials.forEach((material, index) => {
      material.emissive.copy(this.#baseEmissive[index]);
    });
  }
}

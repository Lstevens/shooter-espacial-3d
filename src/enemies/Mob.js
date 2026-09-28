import * as THREE from 'three';
import { MOB } from '../config.js';
import { createMobModel, registerEntity } from './MobFactory.js';

const HIT_FLASH = 0x88ccff;
const HIT_FLASH_TIME = 0.12;
const ATTACK_ANIM_TIME = 0.4;

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

  constructor({ variant, maxHp = MOB.maxHp }) {
    this.#model = createMobModel(variant);
    this.group = this.#model.group;
    this.#materials = this.#model.materials;
    this.#baseEmissive = this.#materials.map((material) => material.emissive.clone());
    this.variant = variant;
    this.#maxHp = maxHp;
    this.#hp = maxHp;
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
    if (this.#hp <= 0) this.kill();
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

    // Los modelos miran hacia -Z, asi que el yaw va invertido respecto a lookAt.
    if (distance > 0.001) {
      this.group.rotation.y = Math.atan2(-toTarget.x, -toTarget.z);
    }

    const moving = distance < MOB.aggroRange && distance > attackRange;
    if (moving) {
      toTarget.normalize();
      this.group.position.addScaledVector(toTarget, speed * delta);
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

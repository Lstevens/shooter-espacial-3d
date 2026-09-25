import * as THREE from 'three';
import { MOB } from '../config.js';
import { createMobMesh, registerEntity } from './MobFactory.js';

const HIT_FLASH = 0x88ccff;
const NO_EMISSIVE = 0x000000;

/**
 * Enemigo. Implementa el contrato Target (group, position, isAlive,
 * takeDamage) que consumen las estrategias de ataque.
 * El jefe es la misma clase con otra variante: no necesita subclase.
 */
export class Mob {
  #material;
  #hp;
  #maxHp;
  #dead = false;
  #respawnTimer = 0;
  #attackCooldown = 0;
  #hitFlash = 0;
  #toTarget = new THREE.Vector3();

  constructor({ variant, maxHp = MOB.maxHp }) {
    const { group, material } = createMobMesh(variant);
    this.group = group;
    this.#material = material;
    this.variant = variant;
    this.#maxHp = maxHp;
    this.#hp = maxHp;
    registerEntity(group, this);
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
    this.#material.emissive.setHex(HIT_FLASH);
    this.#hitFlash = 1;
    if (this.#hp <= 0) this.kill();
  }

  kill() {
    this.#hp = 0;
    this.#dead = true;
    this.#respawnTimer = MOB.respawnDelay;
    this.group.visible = false;
  }

  reset(position) {
    this.#hp = this.#maxHp;
    this.#dead = false;
    this.#attackCooldown = MOB.respawnCooldown;
    this.#hitFlash = 0;
    this.#material.emissive.setHex(NO_EMISSIVE);
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
    if (this.#hitFlash > 0) {
      this.#hitFlash -= delta;
      if (this.#hitFlash <= 0) this.#material.emissive.setHex(NO_EMISSIVE);
    }

    this.#attackCooldown -= delta;
    const toTarget = this.#toTarget.subVectors(context.targetPosition, this.group.position);
    toTarget.y = 0;
    const distance = toTarget.length();
    const { attackRange, speed } = this.variant;

    if (distance < MOB.aggroRange && distance > attackRange) {
      toTarget.normalize();
      this.group.position.addScaledVector(toTarget, speed * delta);
    }

    this.group.lookAt(
      context.targetPosition.x,
      this.group.position.y,
      context.targetPosition.z,
    );

    if (distance <= attackRange && this.#attackCooldown <= 0) {
    this.#attackCooldown = MOB.respawnCooldown;
      context.onHit(this.variant.damage);
    }
  }
}

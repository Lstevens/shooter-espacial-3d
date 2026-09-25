import * as THREE from 'three';
import { createMuzzleFlash, createWeaponModels } from './WeaponFactory.js';
import { ATTACKS } from './WeaponCatalog.js';

const HOLDER = { x: 0.3, y: -0.28, z: -0.55 };
const RECOIL_DECAY = 7;
const SWING_DECAY = 4;

/** Modelo en primera persona:uje, retroceso, balanceo y destello. */
export class ViewModel {
  #models;
  #flash;
  #flashTimer = 0;
  #recoil = 0;
  #swing = 0;

  constructor({ camera }) {
    this.#models = createWeaponModels();
    this.#flash = createMuzzleFlash();

    this.holder = new THREE.Group();
    this.holder.position.set(HOLDER.x, HOLDER.y, HOLDER.z);
    for (const model of Object.values(this.#models)) this.holder.add(model);
    this.holder.add(this.#flash);
    camera.add(this.holder);
  }

  onSwitch(key) {
    for (const [name, model] of Object.entries(this.#models)) {
      model.visible = name === key;
    }
  }

  /** @param {import('../contracts.js').WeaponDef} weapon */
  onShot(weapon) {
    this.#recoil = 1;
    if (weapon.attack === ATTACKS.melee) {
      this.#swing = 1;
      return;
    }
    this.#flash.material.rotation = Math.random() * Math.PI;
    this.#flash.scale.setScalar(0.4 + Math.random() * 0.3);
    this.#flash.visible = true;
    this.#flashTimer = 0.05;
  }

  update(delta, bobPhase, elapsed) {
    this.#recoil = Math.max(0, this.#recoil - delta * RECOIL_DECAY);
    this.#swing = Math.max(0, this.#swing - delta * SWING_DECAY);
    if (this.#flashTimer > 0) {
      this.#flashTimer -= delta;
      this.#flash.visible = this.#flashTimer > 0;
    }

    this.holder.position.x = HOLDER.x + Math.sin(bobPhase) * 0.02;
    this.holder.position.y = HOLDER.y + Math.abs(Math.cos(bobPhase)) * 0.012;
    this.holder.position.z = HOLDER.z - this.#recoil * 0.12 - this.#swing * 0.18;
    this.holder.rotation.z = Math.sin(elapsed * 1.7) * 0.01 - this.#recoil * 0.06;
    this.holder.rotation.x = Math.sin(elapsed * 1.3) * 0.01;
    this.#models.knife.rotation.x = -1.6 * this.#swing;
  }
}

import * as THREE from 'three';
import { createMuzzleFlash, createSlashArc, createWeaponModels } from './WeaponFactory.js';
import { ATTACKS, DEFAULT_WEAPON, WEAPON_CATALOG } from './WeaponCatalog.js';

const HOLDER = { x: 0.3, y: -0.28, z: -0.55 };
const RECOIL_DECAY = 7;
const SLIDE_CYCLE = 0.09;
const SLIDE_TRAVEL = 0.022;
const SWING_SECONDS = 0.28;
const FLASH_SECONDS = 0.05;
const KNIFE_ANGLE = 1.5;
const KNIFE_ROLL = 0.85;
const SLASH_OPACITY = 0.85;

/**
 * Modelo en primera persona:uja, retroceso, corredera, tajo y destello.
 * Tambien es la fuente de la posicion de la boca: el ViewModel sabe donde
 * termina el canon de cada arma, el jugador no.
 */
export class ViewModel {
  #models;
  #parts;
  #flash;
  #slash;
  #slideRest = 0;
  #flashScale = 0.5;
  #key = DEFAULT_WEAPON;
  #recoil = 0;
  #slide = 0;
  #swing = 0;
  #flashTimer = 0;
  #muzzleWorld = new THREE.Vector3();

  constructor({ camera }) {
    const { models, parts } = createWeaponModels();
    this.#models = models;
    this.#parts = parts;
    this.#flash = createMuzzleFlash();
    this.#slash = createSlashArc();
    this.#slideRest = parts.pistolSlide.position.z;

    this.holder = new THREE.Group();
    this.holder.position.set(HOLDER.x, HOLDER.y, HOLDER.z);
    for (const model of Object.values(this.#models)) this.holder.add(model);
    this.holder.add(this.#flash);
    camera.add(this.holder);
    camera.add(this.#slash);
  }

  onSwitch(key) {
    this.#key = key;
    for (const [name, model] of Object.entries(this.#models)) {
      model.visible = name === key;
    }
    this.#flash.visible = false;
    this.#flashTimer = 0;
    const { muzzle, flashScale } = WEAPON_CATALOG[key];
    this.#flash.position.set(muzzle.x, muzzle.y, muzzle.z);
    this.#flashScale = flashScale;
  }

  /** Boca del arma en coordenadas de mundo, para las trazadoras. */
  muzzleWorldPosition() {
    const { muzzle } = WEAPON_CATALOG[this.#key];
    return this.holder.localToWorld(this.#muzzleWorld.set(muzzle.x, muzzle.y, muzzle.z));
  }

  /** @param {import('../contracts.js').WeaponDef} weapon */
  onShot(weapon) {
    this.#recoil = 1;
    if (weapon.attack === ATTACKS.melee) {
      this.#swing = 1;
      return;
    }
    this.#slide = 1;
    this.#flash.material.rotation = Math.random() * Math.PI;
    this.#flash.scale.setScalar(this.#flashScale * (0.85 + Math.random() * 0.3));
    this.#flash.visible = true;
    this.#flashTimer = FLASH_SECONDS;
  }

  update(delta, bobPhase, elapsed) {
    this.#recoil = Math.max(0, this.#recoil - delta * RECOIL_DECAY);
    this.#slide = Math.max(0, this.#slide - delta / SLIDE_CYCLE);
    this.#swing = Math.max(0, this.#swing - delta / SWING_SECONDS);
    if (this.#flashTimer > 0) {
      this.#flashTimer -= delta;
      this.#flash.visible = this.#flashTimer > 0;
    }

    const weapon = WEAPON_CATALOG[this.#key];
    const slideProgress = 1 - this.#slide;
    const swingProgress = 1 - this.#swing;
    this.#parts.pistolSlide.position.z =
      this.#slideRest - (this.#slide > 0 ? SLIDE_TRAVEL * Math.sin(slideProgress * Math.PI) : 0);

    this.#slash.material.opacity = SLASH_OPACITY * this.#swing;
    this.#slash.scale.setScalar(0.7 + swingProgress * 0.5);
    this.#slash.visible = this.#swing > 0;

    const arc = this.#swing > 0 ? Math.sin(swingProgress * Math.PI) : 0;
    const knife = this.#models.knife;
    knife.rotation.x = -KNIFE_ANGLE * arc;
    knife.rotation.z = KNIFE_ROLL * arc;
    knife.position.x = -0.07 * arc;
    knife.position.y = 0.06 * arc;

    this.holder.position.x = HOLDER.x + Math.sin(bobPhase) * 0.02;
    this.holder.position.y = HOLDER.y + Math.abs(Math.cos(bobPhase)) * 0.012;
    this.holder.position.z = HOLDER.z - this.#recoil * weapon.recoilPush - this.#swing * weapon.swingPush;
    this.holder.rotation.z = Math.sin(elapsed * 1.7) * 0.01 - this.#recoil * 0.06;
    this.holder.rotation.x = Math.sin(elapsed * 1.3) * 0.01 - this.#recoil * 0.05;
  }
}

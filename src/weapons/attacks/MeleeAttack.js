import * as THREE from 'three';
import { ATTACKS } from '../WeaponCatalog.js';
import { HIT_BURSTS } from '../../config.js';

const CONE_DOT = 0.55;

/** Ataque cuerpo a cuerpo: cono frontal, golpea al objetivo mas cercano. */
export class MeleeAttack {
  id = ATTACKS.melee;
  #toTarget = new THREE.Vector3();
  #burstPoint = new THREE.Vector3();
  #up = new THREE.Vector3(0, 1, 0);

  execute(context, weapon) {
    const { origin, direction, targets, fx } = context;
    let best = null;
    let bestDistance = weapon.range;

    for (const target of targets) {
      if (!target.isAlive) continue;
      const toTarget = this.#toTarget.subVectors(target.position, origin);
      const distance = toTarget.length();
      const inCone = toTarget.normalize().dot(direction) > CONE_DOT;
      if (inCone && distance <= weapon.range && distance < bestDistance) {
        bestDistance = distance;
        best = target;
      }
    }

    if (!best) return;
    best.takeDamage(weapon.damage);
    const { count, speed, color } = HIT_BURSTS.melee;
    this.#burstPoint.copy(best.position).add(this.#up);
    fx.spawnBurst(this.#burstPoint, count, speed, color);
  }
}

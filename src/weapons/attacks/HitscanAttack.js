import * as THREE from 'three';
import { ATTACKS } from '../WeaponCatalog.js';
import { HIT_BURSTS } from '../../config.js';

/** Disparo por raycast con trazadora y chispas en el impacto. */
export class HitscanAttack {
  id = ATTACKS.hitscan;
  #raycaster = new THREE.Raycaster();
  #missEnd = new THREE.Vector3();

  execute(context, weapon) {
    const { origin, direction, muzzle, targets, fx } = context;
    this.#raycaster.set(origin, direction);
    this.#raycaster.far = weapon.range;

    const hits = this.#raycaster.intersectObjects(
      targets.map((target) => target.group),
      true,
    );

    if (hits.length === 0) {
      this.#missEnd.copy(origin).addScaledVector(direction, weapon.range);
      fx.spawnTracer(muzzle, this.#missEnd);
      return;
    }

    const [hit] = hits;
    const target = hit.object.userData.entity;
    if (target?.isAlive) {
      target.takeDamage(weapon.damage);
      const { count, speed, color } = HIT_BURSTS.bullet;
      fx.spawnBurst(hit.point, count, speed, color);
    }
    fx.spawnTracer(muzzle, hit.point);
  }
}

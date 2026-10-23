import * as THREE from 'three';

const KINDS = {
  health: { color: 0x4bb34b, emissive: 0x1c5e1c },
  ammo: { color: 0xe0a63a, emissive: 0x6e4a10 },
};

const DEFAULTS = {
  /** Radio de recogida en metros, algo mayor que el radio del jugador. */
  pickupRadius: 1.1,
  /** Segundos antes de que el drop desaparezca solo. */
  lifetime: 20,
  /** Amplitud y velocidad del vaiven flotante. */
  bobAmplitude: 0.18,
  bobSpeed: 2.4,
  spinSpeed: 1.6,
};

/**
 * Drops de los enemigos: vida y municion. Cumple PickupSystemContract.
 *
 * Mallas procedurales (cruz para vida, caja para municion), sin assets.
 * No conoce Game, GameState ni WeaponSystem: solo avisa por `onPickup(kind)`
 * cuando el jugador rozca un drop, y quien llama aplica el efecto.
 *
 * Geometrias y materiales se comparten entre drops: solo cambian la matriz
 * de transformacion, y dispose() los libera una sola vez.
 */
export class PickupSystem {
  #scene;
  #options;
  #group;
  /** @type {{kind: string, mesh: THREE.Object3D, life: number, baseY: number}[]} */
  #active = [];
  #healthMesh;
  #ammoMesh;
  #healthMaterial;
  #ammoMaterial;
  #time = 0;

  constructor({ scene, ...options } = {}) {
    this.#scene = scene;
    this.#options = { ...DEFAULTS, ...options };
    this.#group = new THREE.Group();
    this.#group.name = 'pickups';
    scene?.add(this.#group);

    this.#healthMaterial = new THREE.MeshStandardMaterial({
      color: KINDS.health.color,
      emissive: KINDS.health.emissive,
      emissiveIntensity: 0.9,
      roughness: 0.4,
    });
    this.#ammoMaterial = new THREE.MeshStandardMaterial({
      color: KINDS.ammo.color,
      emissive: KINDS.ammo.emissive,
      emissiveIntensity: 0.9,
      roughness: 0.4,
    });

    // Cruz de vida: dos barras cruzadas.
    const bar = new THREE.BoxGeometry(0.5, 0.16, 0.16);
    const vertical = new THREE.BoxGeometry(0.16, 0.5, 0.16);
    const healthGroup = new THREE.Group();
    healthGroup.add(new THREE.Mesh(bar, this.#healthMaterial));
    healthGroup.add(new THREE.Mesh(vertical, this.#healthMaterial));
    this.#healthMesh = healthGroup;

    // Caja de municion con una banda marcada.
    const box = new THREE.BoxGeometry(0.42, 0.3, 0.3);
    const band = new THREE.BoxGeometry(0.44, 0.08, 0.32);
    const ammoGroup = new THREE.Group();
    ammoGroup.add(new THREE.Mesh(box, this.#ammoMaterial));
    const bandMesh = new THREE.Mesh(band, this.#ammoMaterial);
    bandMesh.position.y = 0.08;
    ammoGroup.add(bandMesh);
    this.#ammoMesh = ammoGroup;
  }

  /**
   * @param {'health'|'ammo'} kind
   * @param {import('three').Vector3} position
   */
  spawn(kind, position) {
    if (!this.#scene || (kind !== 'health' && kind !== 'ammo')) return;
    const template = kind === 'health' ? this.#healthMesh : this.#ammoMesh;
    const mesh = template.clone();
    // El clone() es superficial: los hijos comparten geometria y material,
    // que es exactamente lo que queremos para no duplicar GPU ni dispose().
    mesh.position.copy(position);
    mesh.position.y = Math.max(0.55, position.y + 0.55);
    mesh.visible = true;
    this.#group.add(mesh);
    this.#active.push({
      kind,
      mesh,
      life: this.#options.lifetime,
      baseY: mesh.position.y,
    });
  }

  /**
   * @param {number} delta
   * @param {import('three').Vector3} playerPosition
   * @param {{ onPickup?: (kind: 'health'|'ammo') => void }} hooks
   */
  update(delta, playerPosition, { onPickup } = {}) {
    this.#time += delta;
    for (let i = this.#active.length - 1; i >= 0; i -= 1) {
      const drop = this.#active[i];
      drop.life -= delta;
      if (drop.life <= 0) {
        this.#retire(i);
        continue;
      }

      const { mesh, baseY } = drop;
      mesh.position.y =
        baseY + Math.sin(this.#time * this.#options.bobSpeed) * this.#options.bobAmplitude;
      mesh.rotation.y += this.#options.spinSpeed * delta;

      if (!playerPosition) continue;
      const dx = playerPosition.x - mesh.position.x;
      const dz = playerPosition.z - mesh.position.z;
      if (dx * dx + dz * dz <= this.#options.pickupRadius ** 2) {
        const kind = drop.kind;
        this.#retire(i);
        onPickup?.(kind);
      }
    }
  }

  /** Retira todos los drops, sin efectos. Se usa al cambiar de camara. */
  clear() {
    for (let i = this.#active.length - 1; i >= 0; i -= 1) this.#retire(i);
  }

  /** Libera el grupo y el estado. Tras llamarlo el sistema queda inutilizable. */
  dispose() {
    this.clear();
    this.#scene?.remove(this.#group);
    this.#healthMaterial.dispose();
    this.#ammoMaterial.dispose();
  }

  /**
   * Quita el drop i de la escena y de la lista. Los hijos clonados comparten
   * geometria y material con la plantilla (Mesh.clone es superficial en ese
   * sentido), asi que no se disponen aqui, solo en dispose().
   */
  #retire(index) {
    const [drop] = this.#active.splice(index, 1);
    this.#group.remove(drop.mesh);
  }
}

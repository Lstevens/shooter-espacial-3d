import * as THREE from 'three';
import { ARENA, DOOR, inExitLane } from '../config.js';

const HALF = ARENA.half;
const EMBER_COLOR = 0xff7a1f;
const HULL_DARK = 0x2a231e;

function metal(color, metalness, roughness) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}

/**
 * Restos de una nave estrellada que conforman el escenario. No decide nada
 * de juego: aporta geometria y los puntos calientes ("sparkPoints") desde
 * los que EffectsSystem lanza chispas.
 *
 * Los restos se apoyan en los muros y se reparten en anillo (radio >= 4.5)
 * para no tapar el centro, que es donde aparece el jugador y su linea de tiro.
 */
export class Ship {
  #scene;
  #group;
  #sparkPoints = [];
  #colliders = [];
  #embers = [];
  #disposables = [];
  #time = 0;

  constructor({ scene }) {
    this.#scene = scene;
    this.#group = new THREE.Group();
    this.#group.name = 'shipWreck';
    this.#buildFuselage();
    this.#buildDebris();
    this.#buildBeams();
    this.#buildEngine();
    this.#scene.add(this.#group);
  }

  get group() {
    return this.#group;
  }

  /** Puntos del pecio (coordenadas de mundo) desde los que saltan chispas. */
  get sparkPoints() {
    return this.#sparkPoints;
  }

  /** Cajas que bloquean el paso sobre la chatarra y las vigas. */
  get colliders() {
    return this.#colliders;
  }

  /** Registra la caja de colision y la geometria/material para liberarlos. */
  #track(mesh) {
    mesh.updateWorldMatrix(true, false);
    this.#colliders.push(new THREE.Box3().setFromObject(mesh));
    this.#disposables.push(mesh.geometry);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) if (material) this.#disposables.push(material);
  }

  dispose() {
    this.#scene.remove(this.#group);
    for (const item of this.#disposables) item?.dispose?.();
    this.#disposables.length = 0;
    this.#colliders.length = 0;
    this.#sparkPoints.length = 0;
  }

  /**
   * Fuselaje partido apoyado en el muro del fondo, con costillas y una brecha.
   * El casco se parte en dos mitades con un hueco central alineado con el
   * vano de salida: la puerta queda a la vista y el jugador puede cruzarla.
   */
  #buildFuselage() {
    const hull = metal(0x3a2f28, 0.7, 0.62);
    const rib = metal(HULL_DARK, 0.85, 0.45);
    const backZ = -HALF + 2.2;

    const totalHalf = 4.5;
    const gapHalf = DOOR.width / 2 + 0.6;
    const segmentWidth = totalHalf - gapHalf;
    const segmentCenter = (totalHalf + gapHalf) / 2;

    for (const side of [-1, 1]) {
      const segment = new THREE.Mesh(
        new THREE.BoxGeometry(segmentWidth, 2.6, 3.2),
        hull,
      );
      segment.position.set(side * segmentCenter, 0.9, backZ);
      segment.rotation.set(0.05, 0, side * 0.08);
      this.#group.add(segment);
      this.#track(segment);

      for (const offset of [-0.5, 0.4]) {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.35, 3.1, 3.6), rib);
        frame.position.set(side * (segmentCenter + offset), 0.85, backZ);
        frame.rotation.z = side * 0.08;
        this.#group.add(frame);
        this.#track(frame);
      }
    }

    const gashPos = new THREE.Vector3(-3.6, 1.1, backZ + 1.6);
    const gash = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.9, 0.4),
      new THREE.MeshStandardMaterial({
        color: 0x120a06,
        emissive: EMBER_COLOR,
        emissiveIntensity: 1.6,
        roughness: 1,
      }),
    );
    gash.position.copy(gashPos);
    this.#group.add(gash);
    this.#track(gash);
    this.#embers.push(gash.material);
    this.#sparkPoints.push(gashPos.clone());
  }

  /** Placas y chatarra repartidas en anillo, lejos del punto de aparicion. */
  #buildDebris() {
    const colors = [0x4a3a2e, 0x5a4636, 0x39393f, 0x2e2a26, 0x6a5a4a];
    for (let i = 0; i < 16; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4.5 + Math.random() * (HALF - 5.5);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      if (inExitLane(x, z)) continue;
      const size = 0.4 + Math.random() * 1.1;
      const geometry = new THREE.BoxGeometry(
        size,
        size * (0.4 + Math.random() * 0.5),
        size * (0.6 + Math.random() * 0.8),
      );
      const material = metal(
        colors[i % colors.length],
        0.5 + Math.random() * 0.35,
        0.5 + Math.random() * 0.4,
      );
      const piece = new THREE.Mesh(geometry, material);
      piece.position.set(x, size * 0.2, z);
      piece.rotation.set(Math.random() * 0.6, Math.random() * Math.PI * 2, Math.random() * 0.6);
      this.#group.add(piece);
      this.#track(piece);
    }
  }

  /** Vigas y costillas caidas contra los muros. */
  #buildBeams() {
    const beamMat = metal(0x2c2622, 0.8, 0.5);
    const placements = [
      { x: -HALF + 1.2, z: -3, rot: [0, 0, 0.9] },
      { x: HALF - 1.2, z: 4, rot: [0, 0, -0.9] },
      { x: 3, z: HALF - 1.2, rot: [0.9, 0, 0] },
      { x: -5, z: HALF - 1.2, rot: [0.9, 0, 0] },
    ];
    for (const { x, z, rot } of placements) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4.5, 0.3), beamMat);
      beam.position.set(x, 1.6, z);
      beam.rotation.set(...rot);
      this.#group.add(beam);
      this.#track(beam);
    }
  }

  /** Nacela de motor reventada: cilindro abierto con un nucleo incandescente. */
  #buildEngine() {
    const position = new THREE.Vector3(HALF - 3, 1, -HALF + 4);
    const engine = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 0.8, 3, 12, 1, true),
      metal(0x1c1c22, 0.9, 0.35),
    );
    engine.position.copy(position);
    engine.rotation.set(Math.PI / 2, 0, 0.5);
    this.#group.add(engine);
    this.#track(engine);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x0a0604,
        emissive: EMBER_COLOR,
        emissiveIntensity: 1.8,
        roughness: 1,
      }),
    );
    core.position.copy(position);
    this.#group.add(core);
    this.#track(core);
    this.#embers.push(core.material);
    this.#sparkPoints.push(position.clone());
  }

  update(delta) {
    // Parpadeo irregular de las brasas: da vida al pecio sin luces reales.
    this.#time += delta;
    this.#embers.forEach((material, index) => {
      const pulse = Math.sin(this.#time * (6 + index * 1.7));
      material.emissiveIntensity = 1.4 + pulse * 0.5 + Math.random() * 0.25;
    });
  }
}

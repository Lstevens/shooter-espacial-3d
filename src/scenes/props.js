import * as THREE from 'three';
import { ARENA, inExitLane } from '../config.js';
import { getMetalTexture } from '../engine/textures.js';
import { Ship } from './Ship.js';

const HALF = ARENA.half;
const EMBER_COLOR = 0xff7a1f;

function metal(color, metalness = 0.7, roughness = 0.45, map = getMetalTexture()) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, map });
}

function glow(color, intensity = 2) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.3,
    roughness: 0.25,
  });
}

function randomAngle() {
  return Math.random() * Math.PI * 2;
}

/**
 * Base de un decorado de etapa: agrupa mallas, acumula colisiones (Box3),
 * puntos de chispas y materiales incandescentes que parpadean. Cada theme
 * solo construye; el ciclo de vida (update/dispose) es comun.
 */
class PropScene {
  group = new THREE.Group();
  colliders = [];
  sparkPoints = [];
  #embers = [];
  #disposables = [];
  #scene;
  #time = 0;

  constructor(scene, name) {
    this.#scene = scene;
    this.group.name = name;
    scene.add(this.group);
  }

  add(mesh, collider = true) {
    this.group.add(mesh);
    mesh.updateWorldMatrix(true, false);
    if (collider) this.colliders.push(new THREE.Box3().setFromObject(mesh));
    this.#disposables.push(mesh.geometry);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) if (material) this.#disposables.push(material);
    return mesh;
  }

  ember(material) {
    this.#embers.push(material);
  }

  update(delta) {
    this.#time += delta;
    this.#embers.forEach((material, index) => {
      const pulse = Math.sin(this.#time * (6 + index * 1.7));
      material.emissiveIntensity = 1.4 + pulse * 0.5 + Math.random() * 0.25;
    });
  }

  dispose() {
    this.#scene.remove(this.group);
    for (const item of this.#disposables) item?.dispose?.();
    this.#disposables.length = 0;
    this.colliders.length = 0;
    this.sparkPoints.length = 0;
  }
}

/** Almacen: pilas de contenedores y cajas repartidas en anillo. */
function buildDepot(scene) {
  const props = new PropScene(scene, 'depot');
  const colors = [0x8a6a3a, 0x6a5a46, 0x4a5560, 0x7a4a3a];

  for (let i = 0; i < 12; i += 1) {
    const angle = randomAngle();
    const radius = 4.5 + Math.random() * (HALF - 6);
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (inExitLane(x, z)) continue;
    const w = 1.1 + Math.random() * 1.2;
    const h = 0.9 + Math.random() * 1.1;
    const d = 1.1 + Math.random() * 1.2;
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      metal(colors[i % colors.length], 0.55, 0.55),
    );
    crate.position.set(x, h / 2, z);
    crate.rotation.y = randomAngle();
    props.add(crate);

    if (Math.random() < 0.5) {
      const stack = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.7, h * 0.7, d * 0.7),
        metal(0x3f4650, 0.6, 0.5),
      );
      stack.position.set(crate.position.x, h + (h * 0.7) / 2, crate.position.z);
      stack.rotation.y = randomAngle();
      props.add(stack);
    }
  }

  const container = new THREE.Mesh(new THREE.BoxGeometry(6, 2.4, 2.2), metal(0x5a6472, 0.65, 0.5));
  container.position.set(-HALF + 4, 1.2, HALF - 3.2);
  container.rotation.y = 0.2;
  props.add(container);

  return props;
}

/** Reactor: pilares con nucleo incandescente y tuberias cruzadas. */
function buildReactor(scene) {
  const props = new PropScene(scene, 'reactor');
  const pillarMat = metal(0x3a6b66, 0.8, 0.35);
  const pipeMat = metal(0x4a5a5e, 0.75, 0.4);

  const angles = [0.4, 1.9, 3.4, 4.9];
  for (const angle of angles) {
    const radius = 6.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (inExitLane(x, z)) continue;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2.8, 12), pillarMat);
    pillar.position.set(x, 1.4, z);
    props.add(pillar);

    const coreMat = glow(0x25c7ff, 2.4);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), coreMat);
    core.position.set(x, 2.4, z);
    props.add(core, false);
    props.ember(coreMat);
    props.sparkPoints.push(core.position.clone());
  }

  for (const radius of [5.4, 6.9]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.09, 8, 48), pipeMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 2.9;
    props.add(ring, false);
  }

  return props;
}

/** Crisol: plataformas bajas y fosas de brasas. */
function buildCrucible(scene) {
  const props = new PropScene(scene, 'crucible');
  const rockMat = metal(0x5a3a2e, 0.35, 0.8);

  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2 + 0.3;
    const radius = 5 + Math.random() * 3;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (inExitLane(x, z)) continue;
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(1.4 + Math.random(), 0.7, 1.2 + Math.random()),
      rockMat,
    );
    block.position.set(x, 0.35, z);
    block.rotation.y = randomAngle();
    props.add(block);
  }

  for (let i = 0; i < 3; i += 1) {
    const angle = (i / 3) * Math.PI * 2 + 1.1;
    const radius = 7.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (inExitLane(x, z)) continue;
    const pitMat = glow(EMBER_COLOR, 1.8);
    const pit = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.25, 16), pitMat);
    pit.position.set(x, 0.12, z);
    props.add(pit, false);
    props.ember(pitMat);
    props.sparkPoints.push(pit.position.clone());
  }

  return props;
}

/** Nucleo: anillo de pilares altos con banda de energia suspendida. */
function buildCore(scene) {
  const props = new PropScene(scene, 'core');
  const pillarMat = metal(0x4d3f7a, 0.85, 0.3);

  const count = 6;
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 6.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (inExitLane(x, z)) continue;
    const pillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 3, 0.8),
      pillarMat,
    );
    pillar.position.set(x, 1.5, z);
    props.add(pillar);

    const beaconMat = glow(0xa86fff, 2.6);
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), beaconMat);
    beacon.position.set(pillar.position.x, 3.05, pillar.position.z);
    props.add(beacon, false);
    props.ember(beaconMat);
    props.sparkPoints.push(beacon.position.clone());
  }

  const bandMat = glow(0xc9a6ff, 1.6);
  const band = new THREE.Mesh(new THREE.TorusGeometry(6.4, 0.12, 10, 64), bandMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = 2.5;
  props.add(band, false);
  props.ember(bandMat);

  return props;
}

const BUILDERS = {
  hangar: (scene) => new Ship({ scene }),
  depot: buildDepot,
  reactor: buildReactor,
  crucible: buildCrucible,
  core: buildCore,
};

/**
 * Construye el decorado de una etapa. Todos los themes devuelven la misma
 * forma: group, colliders, sparkPoints, update(delta) y dispose().
 * @param {string} theme
 * @param {{ scene: THREE.Scene }} deps
 */
export function createProps(theme, deps) {
  const builder = BUILDERS[theme] ?? BUILDERS.hangar;
  return builder(deps.scene);
}

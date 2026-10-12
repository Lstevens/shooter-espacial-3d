import * as THREE from 'three';
import { ARENA, DOOR } from '../config.js';

/**
 * Puerta de salida de la camara. Aparece oculta y, al abrirse, dos paneles
 * se deslizan hacia los lados. No decide nada de juego: Game la crea al caer
 * el jefe y consulta contains() para saber si el jugador cruzo.
 */
export class Door {
  #scene;
  #group;
  #left;
  #right;
  #disposables = [];
  #open = 0;
  #state = 'hidden';

  constructor({ scene }) {
    this.#scene = scene;
    this.#group = new THREE.Group();
    this.#group.name = 'exitDoor';
    this.#group.position.set(0, 0, -ARENA.half + 0.12);
    this.#group.visible = false;
    this.#build();
    scene.add(this.#group);
  }

  get position() {
    return this.#group.position;
  }

  get isOpen() {
    return this.#state === 'open';
  }

  #build() {
    const halfWidth = DOOR.width / 2;
    const height = DOOR.height;

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2a3340,
      metalness: 0.85,
      roughness: 0.3,
    });
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x3d4b5c,
      metalness: 0.8,
      roughness: 0.35,
      emissive: 0x0a2a33,
      emissiveIntensity: 0.7,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0x25c7ff,
      emissive: 0x25c7ff,
      emissiveIntensity: 2.2,
      metalness: 0.3,
      roughness: 0.2,
    });

    const postGeometry = new THREE.BoxGeometry(0.3, height + 0.3, 0.5);
    for (const side of [-1, 1]) {
      const post = new THREE.Mesh(postGeometry, frameMat);
      post.position.set(side * (halfWidth + 0.15), (height + 0.3) / 2, 0);
      this.#group.add(post);
      this.#disposables.push(post.geometry, post.material);
    }

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(DOOR.width + 0.6, 0.3, 0.5),
      frameMat,
    );
    lintel.position.y = height + 0.15;
    this.#group.add(lintel);
    this.#disposables.push(lintel.geometry, lintel.material);

    const panelGeometry = new THREE.BoxGeometry(DOOR.width / 2, height, 0.24);
    this.#left = new THREE.Mesh(panelGeometry, panelMat);
    this.#left.position.set(-DOOR.width / 4, height / 2, 0);
    this.#right = new THREE.Mesh(panelGeometry, panelMat);
    this.#right.position.set(DOOR.width / 4, height / 2, 0);
    this.#group.add(this.#left, this.#right);
    this.#disposables.push(panelGeometry, panelMat);

    for (const side of [-1, 1]) {
      const strip = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, height - 0.4, 0.3),
        glowMat,
      );
      strip.position.set(side * (halfWidth - 0.12), height / 2, 0.05);
      this.#group.add(strip);
      this.#disposables.push(strip.geometry, strip.material);
    }
  }

  /** Muestra la puerta y empieza la apertura. */
  open() {
    if (this.#state !== 'hidden') return;
    this.#group.visible = true;
    this.#state = 'opening';
  }

  update(delta) {
    if (this.#state !== 'opening') return;
    this.#open = Math.min(1, this.#open + delta / DOOR.openTime);
    const slide = this.#open * (DOOR.width / 2);
    this.#left.position.x = -DOOR.width / 4 - slide;
    this.#right.position.x = DOOR.width / 4 + slide;
    if (this.#open >= 1) this.#state = 'open';
  }

  /** @returns {boolean} true si el jugador esta cruzando la puerta abierta */
  contains(position) {
    if (this.#state !== 'open') return false;
    const dx = position.x - this.#group.position.x;
    const dz = position.z - this.#group.position.z;
    return Math.hypot(dx, dz) <= DOOR.triggerRadius;
  }

  dispose() {
    this.#scene.remove(this.#group);
    for (const item of this.#disposables) item?.dispose?.();
    this.#disposables.length = 0;
  }
}

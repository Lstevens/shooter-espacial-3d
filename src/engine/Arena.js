import * as THREE from 'three';
import { ARENA, LIGHTS } from '../config.js';

/** Escenario cerrado: escena, niebla, luces, suelo, rejilla y muros. */
export class Arena {
  scene = new THREE.Scene();

  constructor() {
    this.scene.background = new THREE.Color(ARENA.background);
    this.scene.fog = new THREE.Fog(ARENA.background, ARENA.fogNear, ARENA.fogFar);
    this.#addLights();
    this.#addGround();
    this.#addWalls();
  }

  #addLights() {
    this.scene.add(
      new THREE.HemisphereLight(
        LIGHTS.skyColor,
        LIGHTS.groundColor,
        LIGHTS.skyIntensity,
      ),
    );
    const sun = new THREE.DirectionalLight(LIGHTS.sunColor, LIGHTS.sunIntensity);
    sun.position.set(...LIGHTS.sunPosition);
    this.scene.add(sun);
  }

  #addGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA.size, ARENA.size),
      new THREE.MeshStandardMaterial({ color: ARENA.groundColor, roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(ARENA.size, 20, ARENA.gridMain, ARENA.gridLines);
    grid.position.y = 0.002;
    this.scene.add(grid);
  }

  #addWalls() {
    const material = new THREE.MeshStandardMaterial({
      color: ARENA.wallColor,
      side: THREE.DoubleSide,
    });
    const placements = [
      { z: -ARENA.half, y: 0 },
      { z: ARENA.half, y: Math.PI },
      { x: -ARENA.half, y: Math.PI / 2 },
      { x: ARENA.half, y: -Math.PI / 2 },
    ];
    for (const { x = 0, z = 0, y } of placements) {
      const wall = new THREE.Mesh(
        new THREE.PlaneGeometry(ARENA.size, ARENA.wallHeight),
        material,
      );
      wall.position.set(x, ARENA.wallHeight / 2, z);
      wall.rotation.y = y;
      this.scene.add(wall);
    }
  }
}

import * as THREE from 'three';
import { ARENA, LIGHTS } from '../config.js';

/**
 * Escenario cerrado: escena, niebla, luces, suelo, rejilla y muros.
 * Aplica una paleta a la vez: la camara trae su propia combinacion de
 * colores y este modulo solo la pinta, no decide nada de juego.
 */
export class Arena {
  scene = new THREE.Scene();
  #fog;
  #sky;
  #sun;
  #groundMaterial;
  #wallMaterial;
  #grid;

  constructor() {
    this.scene.background = new THREE.Color(ARENA.background);
    this.#fog = new THREE.Fog(ARENA.background, ARENA.fogNear, ARENA.fogFar);
    this.scene.fog = this.#fog;
    this.#addLights();
    this.#addGround();
    this.#addWalls();
    this.applyPalette(ARENA);
  }

  /**
   * Repinta el entorno para una camara sin reconstruir nada. Rejilla
   * aparte: GridHelper pinta por atributos de vertice, asi que se recalcula
   * en lugar de cambiarle el color a una material.
   * @param {import('../config.js').Palette} palette
   */
  applyPalette(palette) {
    this.scene.background.setHex(palette.background);
    this.#fog.color.setHex(palette.background);
    this.#sky.color.setHex(palette.skyColor);
    this.#sun.color.setHex(palette.sunColor);
    this.#groundMaterial.color.setHex(palette.groundColor);
    this.#wallMaterial.color.setHex(palette.wallColor);
    this.#replaceGrid(palette);
  }

  #addLights() {
    this.#sky = new THREE.HemisphereLight(
      LIGHTS.skyColor,
      LIGHTS.groundColor,
      LIGHTS.skyIntensity,
    );
    this.scene.add(this.#sky);
    this.#sun = new THREE.DirectionalLight(LIGHTS.sunColor, LIGHTS.sunIntensity);
    this.#sun.position.set(...LIGHTS.sunPosition);
    this.scene.add(this.#sun);
  }

  #addGround() {
    this.#groundMaterial = new THREE.MeshStandardMaterial({
      color: ARENA.groundColor,
      roughness: 1,
    });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.size, ARENA.size), this.#groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
  }

  #replaceGrid(palette) {
    if (this.#grid) {
      this.scene.remove(this.#grid);
      this.#grid.geometry.dispose();
      this.#grid.material.dispose();
      this.#grid = null;
    }
    const grid = new THREE.GridHelper(ARENA.size, 20, palette.gridMain, palette.gridLines);
    grid.position.y = 0.002;
    this.scene.add(grid);
    this.#grid = grid;
  }

  #addWalls() {
    this.#wallMaterial = new THREE.MeshStandardMaterial({
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
        this.#wallMaterial,
      );
      wall.position.set(x, ARENA.wallHeight / 2, z);
      wall.rotation.y = y;
      this.scene.add(wall);
    }
  }
}
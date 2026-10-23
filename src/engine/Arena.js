import * as THREE from 'three';
import { ARENA, LIGHTS } from '../config.js';
import { getFloorTexture, getWallTexture, getMetalTexture } from './textures.js';
import { createProps } from '../scenes/props.js';

/**
 * Escenario cerrado: escena, niebla, luces, suelo, techo, muros, rejilla y
 * la estructura fija (paneles, tuberias, vigas). El decorado propio de cada
 * camara lo aporta un theme (scenes/props.js) que este modulo monta y
 * desmonta en setStage(), sin tocar el resto de la escena.
 *
 * Expone colliders (cajas) y sparkPoints para que Game los conecte con
 * CollisionWorld y EffectsSystem respectivamente.
 */
export class Arena {
  scene = new THREE.Scene();
  #fog;
  #sky;
  #sun;
  #groundMaterial;
  #wallMaterial;
  #ceilingMaterial;
  #grid;
  #structure = [];
  #structureColliders = [];
  #props = null;

  constructor() {
    this.scene.background = new THREE.Color(ARENA.background);
    this.#fog = new THREE.Fog(ARENA.background, ARENA.fogNear, ARENA.fogFar);
    this.scene.fog = this.#fog;
    this.#addLights();
    this.#addGround();
    this.#addCeiling();
    this.#addWalls();
    this.#addStructure();
    this.applyPalette(ARENA);
  }

  /** Cajas que bloquean el paso: estructura fija mas el decorado actual. */
  get colliders() {
    return [...this.#structureColliders, ...(this.#props?.colliders ?? [])];
  }

  /** Puntos calientes del decorado actual (chispas). */
  get sparkPoints() {
    return this.#props?.sparkPoints ?? [];
  }

  /**
   * Monta la camara: tine el entorno y reemplaza el decorado por el de la
   * etapa. Reconstruir props (no solo recolorear) es lo que hace que cada
   * camara se vea distinta.
   * @param {import('../config.js').Stage} stage
   */
  setStage(stage) {
    this.applyPalette(stage.palette);
    this.#props?.dispose();
    this.#props = createProps(stage.theme ?? 'hangar', { scene: this.scene });
  }

  update(delta) {
    this.#props?.update(delta);
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
    this.#ceilingMaterial.color.setHex(palette.wallColor);
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
      map: getFloorTexture(5),
      roughness: 0.72,
      metalness: 0.65,
    });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA.size, ARENA.size),
      this.#groundMaterial,
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
  }

  #addCeiling() {
    this.#ceilingMaterial = new THREE.MeshStandardMaterial({
      color: ARENA.wallColor,
      map: getFloorTexture(5),
      roughness: 0.8,
      metalness: 0.5,
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA.size, ARENA.size),
      this.#ceilingMaterial,
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ARENA.wallHeight;
    this.scene.add(ceiling);
  }

  #replaceGrid(palette) {
    if (this.#grid) {
      this.scene.remove(this.#grid);
      this.#grid.geometry.dispose();
      this.#grid.material.dispose();
      this.#grid = null;
    }
    const grid = new THREE.GridHelper(ARENA.size, 20, palette.gridMain, palette.gridLines);
    grid.position.y = 0.01;
    grid.material.opacity = 0.28;
    grid.material.transparent = true;
    this.scene.add(grid);
    this.#grid = grid;
  }

  #addWalls() {
    this.#wallMaterial = new THREE.MeshStandardMaterial({
      color: ARENA.wallColor,
      map: getWallTexture(6, 3),
      side: THREE.DoubleSide,
      roughness: 0.7,
      metalness: 0.55,
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

  #addStructure() {
    this.#addWallPanels();
    this.#addPipes();
    this.#addSupportBeams();
  }

  /** Panel decorativo de pared. Baja a la altura del cuerpo: bloquea. */
  #addWallPanels() {
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x4a505c,
      map: getMetalTexture(1),
      roughness: 0.6,
      metalness: 0.7,
    });

    const placements = [
      { x: -8, y: 1.5, z: -ARENA.half + 0.1, width: 3, height: 2, rotY: 0 },
      { x: 7, y: 1.5, z: -ARENA.half + 0.1, width: 3, height: 2, rotY: 0 },
      { x: ARENA.half - 0.1, y: 1.5, z: -6, width: 3, height: 2, rotY: Math.PI / 2 },
      { x: ARENA.half - 0.1, y: 1.5, z: 4, width: 4, height: 2, rotY: Math.PI / 2 },
      { x: -ARENA.half + 0.1, y: 1.5, z: -4, width: 3, height: 2, rotY: -Math.PI / 2 },
      { x: -ARENA.half + 0.1, y: 1.5, z: 5, width: 4, height: 2, rotY: -Math.PI / 2 },
    ];

    for (const { x, y, z, width, height, rotY } of placements) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.14), panelMat);
      panel.position.set(x, y, z);
      panel.rotation.y = rotY;
      this.scene.add(panel);
      this.#structure.push(panel);
      this.#addStructureCollider(panel);
    }
  }

  /** Tuberias altas: decoran por encima de la cabeza, no colisionan. */
  #addPipes() {
    const pipeMat = new THREE.MeshStandardMaterial({
      color: 0x5a5248,
      map: getMetalTexture(2),
      roughness: 0.5,
      metalness: 0.8,
    });

    const pipes = [
      { start: [-ARENA.half + 0.1, 2.5, -8], end: [-ARENA.half + 0.1, 2.5, 8], radius: 0.12 },
      { start: [ARENA.half - 0.1, 2.2, -7], end: [ARENA.half - 0.1, 2.2, 7], radius: 0.15 },
      { start: [-8, 2.7, ARENA.half - 0.1], end: [8, 2.7, ARENA.half - 0.1], radius: 0.1 },
      // Tuberia del muro del fondo partida en dos: el vano de salida queda libre.
      { start: [-7, 2.4, -ARENA.half + 0.1], end: [-3, 2.4, -ARENA.half + 0.1], radius: 0.13 },
      { start: [3, 2.4, -ARENA.half + 0.1], end: [7, 2.4, -ARENA.half + 0.1], radius: 0.13 },
    ];

    for (const { start, end, radius } of pipes) {
      const [x1, y1, z1] = start;
      const [x2, y2, z2] = end;
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);

      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, length, 8),
        pipeMat,
      );
      pipe.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);

      if (Math.abs(x2 - x1) > 0.1) {
        pipe.rotation.z = Math.PI / 2;
      } else if (Math.abs(z2 - z1) > 0.1) {
        pipe.rotation.x = Math.PI / 2;
      }

      this.scene.add(pipe);
      this.#structure.push(pipe);
    }
  }

  /** Vigas de suelo a techo: bloquean el paso. */
  #addSupportBeams() {
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0x33323c,
      map: getMetalTexture(1),
      roughness: 0.8,
      metalness: 0.6,
    });

    const beams = [
      { x: -ARENA.half + 0.2, z: -6 },
      { x: -ARENA.half + 0.2, z: 6 },
      { x: ARENA.half - 0.2, z: -5 },
      { x: ARENA.half - 0.2, z: 5 },
    ];

    for (const { x, z } of beams) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, ARENA.wallHeight, 0.3),
        beamMat,
      );
      beam.position.set(x, ARENA.wallHeight / 2, z);
      this.scene.add(beam);
      this.#structure.push(beam);
      this.#addStructureCollider(beam);
    }
  }

  #addStructureCollider(mesh) {
    mesh.updateWorldMatrix(true, false);
    this.#structureColliders.push(new THREE.Box3().setFromObject(mesh));
  }
}

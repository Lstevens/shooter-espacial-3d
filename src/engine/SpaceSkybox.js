import * as THREE from 'three';
import { SKY } from '../config.js';

/** Skybox espacial procedural: estrellas con parpadeo y planetas lejanos. */
export class SpaceSkybox {
  group = new THREE.Group();
  #planets = [];
  #starUniforms;

  constructor({ scene }) {
    scene.add(this.group);
    this.#addStars();
    this.#addPlanets();
  }

  update(delta, elapsed) {
    this.#starUniforms.uTime.value = elapsed;
    // Se relee por frame: mover la ventana entre monitores cambia el devicePixelRatio.
    this.#starUniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    this.group.rotation.y += delta * SKY.starDrift;
    for (const planet of this.#planets) {
      planet.rotation.y += delta * planet.userData.spin;
    }
  }

  #addStars() {
    const count = SKY.starCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const z = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const ring = Math.sqrt(1 - z * z);
      positions[i * 3] = ring * Math.cos(theta) * SKY.starRadius;
      positions[i * 3 + 1] = z * SKY.starRadius;
      positions[i * 3 + 2] = ring * Math.sin(theta) * SKY.starRadius;

      let size = SKY.starSize * (0.4 + Math.random() * 0.8);
      if (Math.random() < 0.08) size *= 1.8;
      sizes[i] = size;

      const color = new THREE.Color(SKY.colors[i % SKY.colors.length]);
      const brightness = 0.55 + Math.random() * 0.45;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;

      phases[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

    this.#starUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.#starUniforms,
      vertexShader: `
        attribute float aSize;
        attribute vec3 aColor;
        attribute float aPhase;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          vColor = aColor;
          vTwinkle = 0.6 + 0.4 * sin(uTime * ${SKY.twinkleSpeed} + aPhase);
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vTwinkle;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float alpha = smoothstep(0.5, 0.05, d) * vTwinkle;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.group.add(new THREE.Points(geometry, material));
  }

  #addPlanets() {
    for (const def of SKY.planets) {
      const direction = new THREE.Vector3(...def.direction).normalize();
      const texture = createPlanetTexture(def.color);
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(def.radius, 32, 20),
        new THREE.MeshStandardMaterial({ map: texture, roughness: 1, fog: false }),
      );
      planet.position.copy(direction).multiplyScalar(def.distance);
      planet.rotation.z = 0.2 + Math.random() * 0.25;
      planet.userData.spin = 0.03 + Math.random() * 0.05;
      this.group.add(planet);
      this.#planets.push(planet);
      if (def.ring) this.#addRing(planet, def.radius);
    }
  }

  #addRing(planet, radius) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 1.5, radius * 2.2, 48),
      new THREE.MeshBasicMaterial({
        color: 0xd8c9a3,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide,
        fog: false,
      }),
    );
    ring.rotation.x = Math.PI / 2.6;
    planet.add(ring);
  }
}

function createPlanetTexture(hex) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const base = new THREE.Color(hex);

  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 16; i++) {
    const y = Math.random() * size;
    const height = 6 + Math.random() * 22;
    const band = base
      .clone()
      .offsetHSL(0, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.22);
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = `#${band.getHexString()}`;
    ctx.fillRect(0, y, size, height);
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

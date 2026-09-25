import * as THREE from 'three';
import { FX } from '../config.js';

function makeGlowTexture(r1, r2, g1, g2, b1, b2) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  gradient.addColorStop(0, `rgba(${r1},${g1},${b1},1)`);
  gradient.addColorStop(0.5, `rgba(${r2},${g2},${b2},0.8)`);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

function createPool(scene, texture, count) {
  const items = [];
  for (let i = 0; i < count; i += 1) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0,
      }),
    );
    sprite.visible = false;
    scene.add(sprite);
    items.push({ sprite, vel: new THREE.Vector3(), life: 0, maxLife: 1, gravity: false });
  }
  return items;
}

/**
 * Pools de particulas y trazadoras. Cumple el contrato fx que piden
 * las estrategias de ataque.
 */
export class EffectsSystem {
  #particles;
  #tracers;

  constructor({ scene }) {
    const spark = makeGlowTexture(255, 200, 170, 80, 30, 10);
    const tracer = makeGlowTexture(255, 255, 255, 255, 220, 220);
    this.#particles = createPool(scene, spark, FX.particleCount);
    this.#tracers = createPool(scene, tracer, FX.tracerCount);
  }

  spawnBurst(position, count, speed, hex) {
    const start = Math.floor(Math.random() * this.#particles.length);
    let spawned = 0;
    for (let k = 0; k < this.#particles.length && spawned < count; k += 1) {
      const particle = this.#particles[(start + k) % this.#particles.length];
      if (particle.life > 0) continue;
      particle.sprite.visible = true;
      particle.sprite.position.copy(position);
      particle.sprite.material.color.setHex(hex);
      particle.vel
        .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
        .normalize()
        .multiplyScalar(speed * (0.5 + Math.random()));
      particle.life = particle.maxLife = 0.3 + Math.random() * 0.25;
      particle.gravity = true;
      spawned += 1;
    }
  }

  spawnTracer(from, to) {
    const direction = new THREE.Vector3().subVectors(to, from);
    const life = Math.max(0.03, direction.length() / FX.tracerSpeed);
    direction.normalize().multiplyScalar(FX.tracerSpeed);
    for (const tracer of this.#tracers) {
      if (tracer.life > 0) continue;
      tracer.sprite.visible = true;
      tracer.sprite.position.copy(from);
      tracer.sprite.material.color.setHex(0xffffff);
      tracer.vel.copy(direction);
      tracer.life = tracer.maxLife = life;
      tracer.gravity = false;
      return;
    }
  }

  update(delta) {
    for (const item of [...this.#particles, ...this.#tracers]) {
      if (item.life <= 0) continue;
      item.life -= delta;
      if (item.life <= 0) {
        item.sprite.visible = false;
        continue;
      }
      if (item.gravity) item.vel.y -= FX.gravity * delta;
      item.sprite.position.addScaledVector(item.vel, delta);
      const remaining = item.life / item.maxLife;
      item.sprite.material.opacity = remaining;
      item.sprite.scale.setScalar(FX.particleMinScale + FX.particleScaleRange * remaining);
    }
  }
}

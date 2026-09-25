import * as THREE from 'three';

function box(width, height, depth, color) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
  );
}

function buildPistol() {
  const group = new THREE.Group();
  group.add(box(0.08, 0.12, 0.26, 0x3a3f4a));
  const grip = box(0.06, 0.15, 0.07, 0x2a2f38);
  grip.position.set(0, -0.12, 0.06);
  grip.rotation.x = 0.25;
  group.add(grip);
  return group;
}

function buildAk() {
  const group = new THREE.Group();
  group.add(box(0.08, 0.1, 0.62, 0x6b4a2b));
  const handguard = box(0.07, 0.09, 0.22, 0x2f2f2f);
  handguard.position.z = -0.28;
  group.add(handguard);
  const magazine = box(0.06, 0.18, 0.09, 0x1f1f1f);
  magazine.position.set(0, -0.13, -0.06);
  group.add(magazine);
  const stock = box(0.08, 0.11, 0.22, 0x6b4a2b);
  stock.position.z = 0.34;
  group.add(stock);
  return group;
}

function buildKnife() {
  const group = new THREE.Group();
  const blade = box(0.02, 0.03, 0.34, 0xd8dce6);
  blade.position.z = -0.14;
  group.add(blade);
  const handle = box(0.035, 0.05, 0.13, 0x241f18);
  handle.position.z = 0.12;
  group.add(handle);
  return group;
}

function createFlashTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255,255,210,1)');
  gradient.addColorStop(0.4, 'rgba(255,200,80,0.8)');
  gradient.addColorStop(1, 'rgba(255,120,20,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function createWeaponModels() {
  return { pistol: buildPistol(), ak: buildAk(), knife: buildKnife() };
}

export function createMuzzleFlash() {
  const flash = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createFlashTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  flash.position.set(0, 0.1, -0.85);
  flash.scale.setScalar(0.5);
  flash.visible = false;
  return flash;
}

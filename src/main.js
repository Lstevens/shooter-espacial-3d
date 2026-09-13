import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101218);
scene.fog = new THREE.Fog(0x101218, 35, 80);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.7, 0);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(6, 10, 4);
scene.add(sun);

const ARENA = 20;
const HALF = ARENA / 2;

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA, ARENA),
  new THREE.MeshStandardMaterial({ color: 0x2a2f3a, roughness: 1 }),
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const grid = new THREE.GridHelper(ARENA, 20, 0x6f7a8a, 0x3d4552);
grid.position.y = 0.002;
scene.add(grid);

const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a5166, side: THREE.DoubleSide });
for (let s = 0; s < 4; s++) {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(ARENA, 3), wallMat);
  wall.position.y = 1.5;
  if (s === 0) {
    wall.position.z = -HALF;
  } else if (s === 1) {
    wall.position.z = HALF;
    wall.rotation.y = Math.PI;
  } else if (s === 2) {
    wall.position.x = -HALF;
    wall.rotation.y = Math.PI / 2;
  } else {
    wall.position.x = HALF;
    wall.rotation.y = -Math.PI / 2;
  }
  scene.add(wall);
}

const MAX_HP = 20;
let playerHp = MAX_HP;
let gameStatus = 'menu';

const GAME_DURATION = 60;
const BOSS_AT = 40;
let gameTime = 0;
let boss = null;
let bossSpawned = false;

const clock = new THREE.Clock();
const keys = new Set();

const hpFill = document.getElementById('hp-fill');
const hpText = document.getElementById('hp-text');
const weaponLabel = document.getElementById('weapon-label');
const timeEl = document.getElementById('time');
const announceEl = document.getElementById('announce');
const crosshair = document.getElementById('crosshair');
const damageFlash = document.getElementById('damage-flash');
const gameoverEl = document.getElementById('gameover');
const gameoverTitle = document.getElementById('gameover-title');
const restartBtn = document.getElementById('restart');

let announceTimer = 0;

const WEAPONS = {
  pistol: { label: 'Pistola', damage: 20, fireRate: 0.3, automatic: false, range: 50 },
  ak: { label: 'AK', damage: 8, fireRate: 0.1, automatic: true, range: 50 },
  knife: { label: 'Cuchillo', damage: 25, fireRate: 0.3, automatic: false, melee: true, range: 4 },
};
const ORDER = ['pistol', 'ak', 'knife'];

let currentWeaponKey = 'pistol';
let lastShotTime = 0;
let recoil = 0;
let flashTimer = 0;
let knifeSwing = 0;
let bobPhase = 0;
let mouseDown = false;

function box(w, h, d, color) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
  );
  return mesh;
}

const weaponHolder = new THREE.Group();
weaponHolder.position.set(0.3, -0.28, -0.55);
camera.add(weaponHolder);

const pistol = new THREE.Group();
pistol.add(box(0.08, 0.12, 0.26, 0x3a3f4a));
const grip = box(0.06, 0.15, 0.07, 0x2a2f38);
grip.position.set(0, -0.12, 0.06);
grip.rotation.x = 0.25;
pistol.add(grip);
weaponHolder.add(pistol);

const ak = new THREE.Group();
ak.add(box(0.08, 0.1, 0.62, 0x6b4a2b));
const handguard = box(0.07, 0.09, 0.22, 0x2f2f2f);
handguard.position.z = -0.28;
ak.add(handguard);
const magazine = box(0.06, 0.18, 0.09, 0x1f1f1f);
magazine.position.set(0, -0.13, -0.06);
ak.add(magazine);
const stock = box(0.08, 0.11, 0.22, 0x6b4a2b);
stock.position.z = 0.34;
ak.add(stock);
weaponHolder.add(ak);

const knife = new THREE.Group();
const blade = box(0.02, 0.03, 0.34, 0xd8dce6);
blade.position.z = -0.14;
knife.add(blade);
const handle = box(0.035, 0.05, 0.13, 0x241f18);
handle.position.z = 0.12;
knife.add(handle);
weaponHolder.add(knife);

const flashCanvas = document.createElement('canvas');
flashCanvas.width = 64;
flashCanvas.height = 64;
const fctx = flashCanvas.getContext('2d');
const grad = fctx.createRadialGradient(32, 32, 2, 32, 32, 30);
grad.addColorStop(0, 'rgba(255,255,210,1)');
grad.addColorStop(0.4, 'rgba(255,200,80,0.8)');
grad.addColorStop(1, 'rgba(255,120,20,0)');
fctx.fillStyle = grad;
fctx.fillRect(0, 0, 64, 64);

const flash = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(flashCanvas),
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
flash.position.set(0, 0.1, -0.85);
flash.scale.set(0.5, 0.5, 1);
flash.visible = false;
weaponHolder.add(flash);

function setWeapon(key) {
  currentWeaponKey = key;
  pistol.visible = key === 'pistol';
  ak.visible = key === 'ak';
  knife.visible = key === 'knife';
  weaponLabel.textContent = WEAPONS[key].label;
}

const MOB_MAX_HP = 20;
const MOB_COUNT = 6;
const mobs = [];

function randomSpawnPos(minDist = 6.5) {
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 3 + Math.random() * 6.5;
    const p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    const d = Math.hypot(p.x - camera.position.x, p.z - camera.position.z);
    if (d >= minDist) return p;
  }
  const a = Math.random() * Math.PI * 2;
  const r = 8 + Math.random();
  return new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
}

function buildMob({ isBoss = false } = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color: isBoss ? 0x4a2fff : 0x2f7fff,
    emissive: 0x000000,
    roughness: 0.6,
  });
  const group = new THREE.Group();
  function part(w, h, d, x, y, z, rx = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    if (rx) mesh.rotation.x = rx;
    mesh.userData.mob = group;
    group.add(mesh);
  }
  part(0.16, 0.5, 0.16, -0.18, 0.25, 0);
  part(0.16, 0.5, 0.16, 0.18, 0.25, 0);
  part(0.46, 0.6, 0.28, 0, 0.9, 0);
  part(0.13, 0.5, 0.13, -0.33, 0.9, 0);
  part(0.13, 0.5, 0.13, 0.33, 0.9, 0);
  part(0.3, 0.3, 0.3, 0, 1.42, 0);
  group.userData.hp = MOB_MAX_HP;
  group.userData.dead = false;
  group.userData.respawnTimer = 0;
  group.userData.attackCooldown = 0;
  group.userData.hitFlash = 0;
  group.userData.isBoss = isBoss;
  group.userData.speed = isBoss ? 3.2 : 2.2;
  group.userData.damage = isBoss ? 8 : 5;
  group.userData.attackRange = isBoss ? 2.6 : 1.7;
  return group;
}

for (let i = 0; i < MOB_COUNT; i++) {
  const mob = buildMob();
  mob.position.copy(randomSpawnPos());
  scene.add(mob);
  mobs.push(mob);
}

const raycaster = new THREE.Raycaster();

function spawnBoss() {
  if (bossSpawned) return;
  bossSpawned = true;
  boss = buildMob({ isBoss: true });
  boss.scale.setScalar(2.2);
  boss.position.copy(randomSpawnPos());
  scene.add(boss);
  mobs.push(boss);
  announce('¡Apareció el jefe final!');
}

function makeGlowTexture(r1, r2, g1, g2, b1, b2) {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  grad.addColorStop(0, `rgba(${r1},${g1},${b1},1)`);
  grad.addColorStop(0.5, `rgba(${r2},${g2},${b2},0.8)`);
  grad.addColorStop(1, `rgba(0,0,0,0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

const sparkTex = makeGlowTexture(255, 200, 170, 80, 30, 10);
const tracerTex = makeGlowTexture(255, 255, 255, 255, 220, 220);

const particles = [];
const tracers = [];
for (let i = 0; i < 60; i++) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: sparkTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    }),
  );
  sprite.visible = false;
  scene.add(sprite);
  particles.push({ sprite, vel: new THREE.Vector3(), life: 0, maxLife: 1, gravity: true });
}
for (let i = 0; i < 12; i++) {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tracerTex,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    }),
  );
  sprite.visible = false;
  scene.add(sprite);
  tracers.push({ sprite, vel: new THREE.Vector3(), life: 0, maxLife: 1, gravity: false });
}

function spawnBurst(pos, count, speed, hex) {
  const i0 = Math.floor(Math.random() * particles.length);
  let n = 0;
  for (let k = 0; k < particles.length && n < count; k++) {
    const p = particles[(i0 + k) % particles.length];
    if (p.life > 0) continue;
    p.sprite.visible = true;
    p.sprite.position.copy(pos);
    p.sprite.material.color.setHex(hex);
    p.vel
      .set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1)
      .normalize()
      .multiplyScalar(speed * (0.5 + Math.random()));
    p.life = p.maxLife = 0.3 + Math.random() * 0.25;
    p.gravity = true;
    n++;
  }
}

function spawnTracer(from, to) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const speed = 130;
  const life = Math.max(0.03, dir.length() / speed);
  dir.normalize().multiplyScalar(speed);
  for (const p of tracers) {
    if (p.life > 0) continue;
    p.sprite.visible = true;
    p.sprite.position.copy(from);
    p.sprite.material.color.setHex(0xffffff);
    p.vel.copy(dir);
    p.life = p.maxLife = life;
    p.gravity = false;
    return;
  }
}

function updateParticles(delta) {
  for (const p of [...particles, ...tracers]) {
    if (p.life <= 0) continue;
    p.life -= delta;
    if (p.life <= 0) {
      p.sprite.visible = false;
      continue;
    }
    if (p.gravity) p.vel.y -= 9.8 * delta;
    p.sprite.position.addScaledVector(p.vel, delta);
    const k = p.life / p.maxLife;
    p.sprite.material.opacity = k;
    p.sprite.scale.setScalar(0.15 + 0.12 * k);
  }
}

function flashDamage() {
  damageFlash.style.transition = 'none';
  damageFlash.style.opacity = '0.8';
  void damageFlash.offsetWidth;
  damageFlash.style.transition = 'opacity 0.5s';
  damageFlash.style.opacity = '0';
}

function announce(text, seconds = 2.5) {
  announceEl.textContent = text;
  announceTimer = seconds;
  announceEl.style.opacity = '1';
}

function updateAnnounce(delta) {
  if (announceTimer <= 0) return;
  announceTimer -= delta;
  if (announceTimer <= 0) announceEl.style.opacity = '0';
}

function updateHud() {
  hpFill.style.width = `${(playerHp / MAX_HP) * 100}%`;
  hpText.textContent = `${playerHp} / ${MAX_HP}`;
  const remaining = Math.max(0, GAME_DURATION - gameTime);
  const m = Math.floor(remaining / 60);
  const s = Math.floor(remaining % 60);
  timeEl.textContent = `Tiempo: ${m}:${String(s).padStart(2, '0')}`;
}

function killMob(mob) {
  const ud = mob.userData;
  ud.hp = 0;
  ud.dead = true;
  ud.respawnTimer = 3;
  mob.visible = false;
}

function respawnMob(mob) {
  const ud = mob.userData;
  ud.hp = MOB_MAX_HP;
  ud.dead = false;
  ud.attackCooldown = 1;
  ud.hitFlash = 0;
  mob.visible = true;
  mob.position.copy(randomSpawnPos());
}

function damageMob(mob, dmg) {
  const ud = mob.userData;
  ud.hp -= dmg;
  ud.hitFlash = 1;
  mob.traverse((o) => {
    if (o.isMesh) o.material.emissive.setHex(0x88ccff);
  });
  if (ud.hp <= 0) killMob(mob);
}

function gunshot(w) {
  flash.material.rotation = Math.random() * Math.PI;
  flash.scale.setScalar(0.4 + Math.random() * 0.3);
  flash.visible = true;
  flashTimer = 0.05;
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  raycaster.far = w.range;
  const hits = raycaster.intersectObjects(mobs, true);
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  let end;
  if (hits.length > 0) {
    const hit = hits[0];
    const mob = hit.object.userData.mob;
    if (mob && !mob.userData.dead) {
      damageMob(mob, w.damage);
      spawnBurst(hit.point, 12, 4, 0xffaa33);
    }
    end = hit.point;
  } else {
    end = camera.position.clone().addScaledVector(dir, w.range);
  }
  const from = new THREE.Vector3(0.3, -0.22, -1.1);
  camera.localToWorld(from);
  spawnTracer(from, end);
}

function meleeAttack(w) {
  knifeSwing = 1;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  let best = null;
  let bestDist = w.range;
  for (const mob of mobs) {
    if (mob.userData.dead) continue;
    const toMob = new THREE.Vector3().subVectors(mob.position, camera.position);
    const d = toMob.length();
    if (d <= w.range && toMob.normalize().dot(forward) > 0.55) {
      if (d < bestDist) {
        bestDist = d;
        best = mob;
      }
    }
  }
  if (best) {
    damageMob(best, w.damage);
    spawnBurst(best.position.clone().add(new THREE.Vector3(0, 1, 0)), 6, 3, 0x8fd3ff);
  }
}

function tryFire() {
  const w = WEAPONS[currentWeaponKey];
  const t = clock.getElapsedTime();
  if (t - lastShotTime < w.fireRate) return;
  lastShotTime = t;
  recoil = 1;
  if (w.melee) meleeAttack(w);
  else gunshot(w);
}

function updatePlayer(delta) {
  const speed = 5;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  const dir = new THREE.Vector3();
  dir.addScaledVector(forward, Number(keys.has('KeyW')) - Number(keys.has('KeyS')));
  dir.addScaledVector(right, Number(keys.has('KeyD')) - Number(keys.has('KeyA')));
  const moving = dir.lengthSq() > 0;
  if (moving) {
    dir.normalize();
    camera.position.addScaledVector(dir, speed * delta);
    bobPhase += delta * 10;
  }
  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -HALF + 0.5, HALF - 0.5);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -HALF + 0.5, HALF - 0.5);
  camera.position.y = 1.7;
}

function updateMobs(delta) {
  for (const mob of mobs) {
    const ud = mob.userData;
    if (ud.dead) {
      ud.respawnTimer -= delta;
      if (ud.respawnTimer <= 0) respawnMob(mob);
      continue;
    }
    if (ud.hitFlash > 0) {
      ud.hitFlash -= delta;
      if (ud.hitFlash <= 0) {
        mob.traverse((o) => {
          if (o.isMesh) o.material.emissive.setHex(0x000000);
        });
      }
    }
    ud.attackCooldown -= delta;
    const toPlayer = new THREE.Vector3().subVectors(camera.position, mob.position);
    toPlayer.y = 0;
    const dist = toPlayer.length();
    if (dist < 14 && dist > ud.attackRange) {
      toPlayer.normalize();
      mob.position.addScaledVector(toPlayer, ud.speed * delta);
    }
    mob.lookAt(camera.position.x, mob.position.y, camera.position.z);
    if (dist <= ud.attackRange && ud.attackCooldown <= 0) {
      ud.attackCooldown = ud.isBoss ? 0.6 : 1;
      playerHp = Math.max(0, playerHp - ud.damage);
      flashDamage();
      updateHud();
      if (playerHp <= 0) endGame(false);
    }
  }
}

function updateTimer(delta) {
  if (gameStatus !== 'playing') return;
  gameTime += delta;
  if (!bossSpawned && gameTime >= BOSS_AT) spawnBoss();
  if (gameTime >= GAME_DURATION) endGame(true);
}

function updateWeapon(delta) {
  const t = clock.getElapsedTime();
  recoil = Math.max(0, recoil - delta * 7);
  if (flashTimer > 0) {
    flashTimer -= delta;
    flash.visible = flashTimer > 0;
  }
  weaponHolder.position.x = 0.3 + Math.sin(bobPhase) * 0.02;
  weaponHolder.position.y = -0.28 + Math.abs(Math.cos(bobPhase)) * 0.012;
  weaponHolder.position.z = -0.55 - recoil * 0.12 - knifeSwing * 0.18;
  weaponHolder.rotation.z = Math.sin(t * 1.7) * 0.01 - recoil * 0.06;
  weaponHolder.rotation.x = Math.sin(t * 1.3) * 0.01;
  if (knifeSwing > 0) knifeSwing = Math.max(0, knifeSwing - delta * 4);
  knife.rotation.x = -1.6 * knifeSwing;
}

function endGame(won) {
  gameStatus = won ? 'won' : 'dead';
  controls.unlock();
  gameoverTitle.textContent = won ? '¡Ganaste el partido!' : 'Has muerto';
  restartBtn.textContent = won ? 'Jugar de nuevo' : 'Reintentar';
  gameoverEl.classList.add('show');
}

function restart() {
  playerHp = MAX_HP;
  gameTime = 0;
  bossSpawned = false;
  if (boss) {
    mobs.splice(mobs.indexOf(boss), 1);
    scene.remove(boss);
    boss = null;
  }
  updateHud();
  gameoverEl.classList.remove('show');
  for (const mob of mobs) respawnMob(mob);
  controls.lock();
  gameStatus = 'playing';
}

document.getElementById('restart').addEventListener('click', restart);

renderer.domElement.addEventListener('click', () => {
  if (controls.isLocked || gameStatus === 'dead' || gameStatus === 'won') return;
  controls.lock();
});

controls.addEventListener('lock', () => {
  gameStatus = 'playing';
  crosshair.classList.add('active');
});

controls.addEventListener('unlock', () => {
  gameStatus = 'paused';
  crosshair.classList.remove('active');
});

window.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'Digit1') setWeapon('pistol');
  if (event.code === 'Digit2') setWeapon('ak');
  if (event.code === 'Digit3') setWeapon('knife');
});

window.addEventListener('keyup', (event) => keys.delete(event.code));

window.addEventListener('wheel', (event) => {
  if (!controls.isLocked) return;
  const i = ORDER.indexOf(currentWeaponKey);
  const next = event.deltaY > 0 ? (i + 1) % ORDER.length : (i + 2) % ORDER.length;
  setWeapon(ORDER[next]);
});

window.addEventListener('mousedown', (event) => {
  if (event.button !== 0 || !controls.isLocked) return;
  mouseDown = true;
  if (!WEAPONS[currentWeaponKey].automatic) tryFire();
});

window.addEventListener('mouseup', (event) => {
  if (event.button === 0) mouseDown = false;
});

window.addEventListener('contextmenu', (event) => event.preventDefault());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  if (gameStatus === 'playing') {
    updatePlayer(delta);
    updateMobs(delta);
    updateTimer(delta);
    updateWeapon(delta);
    if (mouseDown && WEAPONS[currentWeaponKey].automatic) tryFire();
  }
  updateParticles(delta);
  updateAnnounce(delta);
  updateHud();
  renderer.render(scene, camera);
}

setWeapon('pistol');
updateHud();
renderer.setAnimationLoop(animate);
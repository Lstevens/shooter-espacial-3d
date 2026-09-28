import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/**
 * Modelos de enemigo. Cada modelo trae su geometria, sus materiales y la
 * animacion de sus propias extremidades; la IA y el ciclo de vida viven en Mob.
 *
 * Los modelos miran hacia -Z, igual que las armas en primera persona.
 *
 * Las medidas estan en metros y siguen proporciones humanas: el soldado mide
 * 1.78, apenas mas que el jugador (1.7 con los ojos). Un enemigo que towering
 * sobre la camara deja de leerse como una amenaza y pasa a ser un muro, asi
 * que la silueta va mas por delgadez que por tamano. Solo el jefe crece, y
 * llega a 2.8: por debajo de los muros del mapa.
 *
 * Nada de cajas peladas: las placas van biseladas (RoundedBoxGeometry), las
 * extremidades son capsulas con hombro y codo, y las articulaciones giran
 * desde la cadera o el hombro en vez de deslizarse desde su centro.
 */

const metal = (color, metalness, roughness) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive: 0x000000 });

const glow = (color, intensity) =>
  new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: intensity,
    metalness: 0.3,
    roughness: 0.2,
  });

/**
 * Una paleta por mob, no una global: los materiales se comparten entre las
 * piezas del mismo enemigo (asi el destello de impacto alcanza a todas) pero
 * nunca entre enemigos, asi un golpe no ilumina a los demas.
 */
function soldierPalette() {
  return {
    armor: metal(0x1d6fa8, 0.75, 0.32),
    dark: metal(0x1b2530, 0.85, 0.35),
    glow: glow(0x35a8ff, 3.5),
  };
}

function alienPalette() {
  return {
    armor: metal(0x6b8c3a, 0.25, 0.72),
    dark: metal(0x2b3a1f, 0.2, 0.8),
    glow: glow(0x5cff3c, 3),
  };
}

function tankPalette() {
  return {
    armor: metal(0x9c3226, 0.8, 0.32),
    dark: metal(0x2c1a18, 0.8, 0.38),
    glow: glow(0xff4a22, 3.5),
  };
}

function bossPalette() {
  return {
    armor: metal(0x14141f, 0.95, 0.28),
    dark: metal(0x08080d, 0.9, 0.35),
    glow: glow(0x9b3cff, 4.5),
  };
}

/** Brazos hacia delante, como sosteniendo un arma: es la pose base. */
const ARM_POSE = 1;
const CLAW_POSE = 0.6;

/** Posiciona una pieza en una linea. */
function at(object, x, y, z) {
  object.position.set(x, y, z);
  return object;
}

/**
 * Placa de armadura con aristas biseladas. Un BoxGeometry pelado se lee como
 * una caja por muy pequena que sea; el bisel hace que las aristas cojan luz y
 * es lo que separa "modelado" de "placeholder".
 */
function plate(w, h, d, material, radius = 0.035) {
  const r = Math.min(radius, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002);
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, r), material);
}

function ball(r, material, segments = 14) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), material);
}

function taper(rTop, rBottom, h, material, segments = 14) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), material);
}

function spike(r, h, material, segments = 8) {
  return new THREE.Mesh(new THREE.ConeGeometry(r, h, segments), material);
}

function ring(radius, tube, material) {
  return new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 6, 24), material);
}

/** Mochila o deposito: cilindro tumbado en la espalda, no un bloque solido. */
function bag(r, material, length, y, z) {
  const mesh = taper(r, r * 0.7, length, material, 12);
  mesh.rotation.x = Math.PI / 2;
  return at(mesh, 0, y, z);
}

/** Pivote de articulacion: las piezas cuelgan por debajo y giran desde ahi. */
function joint(x, y, z, children) {
  const group = new THREE.Group();
  at(group, x, y, z);
  for (const child of children) group.add(child);
  return group;
}

/** Brazo con hombro, codo y guante. */
function armJoint(x, y, z, { upper, lower, jointR, hand, material, dark }) {
  const elbowY = -upper.len - upper.r - jointR;
  return joint(x, y, z, [
    at(limb(upper.r, upper.len, dark), 0, -upper.len / 2 - upper.r, 0),
    at(ball(jointR, dark), 0, elbowY, 0),
    at(limb(lower.r, lower.len, dark), 0, elbowY - lower.len / 2 - jointR, 0),
    at(plate(hand.w, hand.h, hand.d, material, 0.02), 0, elbowY - lower.len - jointR - hand.h / 2, 0),
  ]);
}

/** Pierna con muslo, rodilla, espinilla y bota. */
function legJoint(x, y, z, { thigh, shin, foot, material, dark }) {
  const kneeY = -thigh.len - thigh.r - shin.r * 1.1;
  const ankleY = kneeY - shin.len - shin.r * 1.1;
  return joint(x, y, z, [
    at(limb(thigh.r, thigh.len, dark), 0, -thigh.len / 2 - thigh.r, 0),
    at(ball(shin.r * 1.2, material), 0, kneeY, 0),
    at(limb(shin.r, shin.len, dark), 0, ankleY + shin.len / 2, 0),
    at(plate(foot.w, foot.h, foot.d, dark, 0.02), 0, ankleY - foot.h * 0.4, -foot.d * 0.15),
  ]);
}

function limb(radius, length, material) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 3, 10), material);
}

function buildSoldier() {
  const p = soldierPalette();
  const group = new THREE.Group();
  const parts = {};

  // Casco con visera: el visor es lo que marca el frente del modelo.
  const head = new THREE.Group();
  at(head, 0, 1.63, 0);
  const skull = ball(0.135, p.dark);
  skull.scale.set(1, 1.08, 1.02);
  const helmet = ball(0.148, p.armor);
  helmet.scale.set(1, 0.68, 1.05);
  head.add(skull, at(helmet, 0, 0.048, 0), at(plate(0.185, 0.045, 0.035, p.glow, 0.012), 0, 0.005, -0.126));
  parts.head = head;
  group.add(head);

  group.add(at(taper(0.05, 0.062, 0.1, p.dark), 0, 1.5, 0));
  // Peto, abdomen y cincho: tramos estrechos, no un bloque unico.
  group.add(at(plate(0.4, 0.34, 0.25, p.armor, 0.06), 0, 1.36, 0));
  group.add(at(plate(0.13, 0.055, 0.03, p.glow, 0.012), 0, 1.36, -0.135));
  group.add(at(plate(0.32, 0.24, 0.21, p.armor, 0.05), 0, 1.05, 0));
  group.add(at(plate(0.34, 0.075, 0.23, p.dark, 0.02), 0, 0.92, 0));
  group.add(at(plate(0.32, 0.06, 0.21, p.dark, 0.02), 0, 1.53, 0));
  group.add(bag(0.1, p.dark, 0.2, 1.32, 0.17));

  for (const x of [-0.235, 0.235]) {
    const pad = ball(0.1, p.armor);
    pad.scale.set(1, 0.85, 1);
    group.add(at(pad, x, 1.49, 0));
  }

  const armSpec = {
    upper: { r: 0.056, len: 0.28 },
    lower: { r: 0.048, len: 0.24 },
    jointR: 0.052,
    hand: { w: 0.08, h: 0.11, d: 0.08 },
    material: p.armor,
    dark: p.dark,
  };
  parts.armL = at(armJoint(0, 0, 0, armSpec), -0.25, 1.47, 0);
  parts.armR = at(armJoint(0, 0, 0, armSpec), 0.25, 1.47, 0);
  group.add(parts.armL, parts.armR);

  const legSpec = {
    thigh: { r: 0.076, len: 0.3 },
    shin: { r: 0.062, len: 0.28 },
    foot: { w: 0.135, h: 0.095, d: 0.27 },
    material: p.armor,
    dark: p.dark,
  };
  parts.legL = at(legJoint(0, 0, 0, legSpec), -0.105, 0.88, 0);
  parts.legR = at(legJoint(0, 0, 0, legSpec), 0.105, 0.88, 0);
  group.add(parts.legL, parts.legR);

  // Fusil en la mano derecha, nivelado contra la pose de brazos.
  const rifle = new THREE.Group();
  const barrel = taper(0.019, 0.023, 0.32, p.dark, 10);
  barrel.rotation.x = Math.PI / 2;
  rifle.add(
    at(plate(0.07, 0.11, 0.24, p.dark, 0.02), 0, -0.01, 0.1),
    at(plate(0.075, 0.12, 0.28, p.dark, 0.02), 0, 0, -0.11),
    at(plate(0.05, 0.16, 0.05, p.armor, 0.02), 0, -0.09, -0.02),
    at(barrel, 0, 0.01, -0.4),
    at(ball(0.026, p.glow, 8), 0, 0.01, -0.57),
  );
  rifle.rotation.x = -ARM_POSE;
  parts.weapon = at(rifle, 0, -0.56, -0.03);
  parts.armR.add(parts.weapon);

  const materials = Object.values(p);

  return {
    group,
    parts,
    materials,
    animate(delta, { time, moving, attacking, attackTime }) {
      const walk = moving ? Math.sin(time * 8) * 0.5 : 0;
      parts.legL.rotation.x = walk;
      parts.legR.rotation.x = -walk;
      // Absoluto sobre la pose: los brazos no se caen al terminar el ciclo.
      parts.armL.rotation.x = ARM_POSE - walk * 0.45;
      parts.armR.rotation.x = ARM_POSE + walk * 0.45;
      const recoil = attacking && attackTime < 0.3 ? Math.sin(attackTime * 18) * 0.16 : 0;
      parts.weapon.position.z = -0.03 + recoil;
    },
  };
}

function buildAlien() {
  const p = alienPalette();
  const group = new THREE.Group();
  const parts = {};

  const head = new THREE.Group();
  at(head, 0, 1.72, 0);
  const skull = ball(0.15, p.armor);
  skull.scale.set(0.72, 1.18, 0.9);
  const jaw = taper(0.05, 0.1, 0.18, p.dark, 12);
  jaw.rotation.x = Math.PI;
  head.add(skull, at(jaw, 0, -0.14, -0.02));
  for (const x of [-0.055, 0.055]) {
    const eye = ball(0.042, p.glow, 10);
    eye.scale.set(1.3, 0.7, 1);
    head.add(at(eye, x, 0.03, -0.115));
  }
  for (const x of [-0.075, 0.075]) {
    const horn = spike(0.038, 0.28, p.dark, 8);
    horn.rotation.x = -1.1;
    horn.rotation.z = x < 0 ? 0.3 : -0.3;
    head.add(at(horn, x, 0.13, 0.03));
  }
  parts.head = head;
  group.add(head);

  group.add(at(taper(0.045, 0.06, 0.16, p.dark), 0, 1.55, 0));

  // Torso estrecho de insecto, con caparazon delante y segmented atras.
  const torso = ball(0.3, p.armor);
  torso.scale.set(0.6, 1, 0.46);
  group.add(at(torso, 0, 1.22, 0));
  group.add(at(plate(0.24, 0.26, 0.1, p.dark, 0.05), 0, 1.3, -0.13));
  for (let i = 0; i < 3; i += 1) {
    const seg = ring(0.115 - i * 0.012, 0.028, p.dark);
    seg.rotation.x = Math.PI / 2;
    group.add(at(seg, 0, 1.02 - i * 0.09, 0.03));
  }
  group.add(at(plate(0.2, 0.14, 0.16, p.dark, 0.04), 0, 0.9, 0));

  const armSpec = {
    upper: { r: 0.042, len: 0.36 },
    lower: { r: 0.035, len: 0.32 },
    jointR: 0.042,
    hand: { w: 0.06, h: 0.08, d: 0.06 },
    material: p.armor,
    dark: p.dark,
  };
  parts.armL = at(armJoint(0, 0, 0, armSpec), -0.21, 1.42, 0);
  parts.armR = at(armJoint(0, 0, 0, armSpec), 0.21, 1.42, 0);
  group.add(parts.armL, parts.armR);

  for (const [x, hand] of [
    [-0.055, parts.armL],
    [0.055, parts.armR],
  ]) {
    for (let i = -1; i <= 1; i += 1) {
      const claw = spike(0.014, 0.16, p.dark, 6);
      claw.rotation.x = -1.4;
      claw.rotation.z = i * 0.3;
      hand.add(at(claw, x + i * 0.028, -0.88, -0.02));
    }
  }

  const legSpec = {
    thigh: { r: 0.058, len: 0.36 },
    shin: { r: 0.046, len: 0.3 },
    foot: { w: 0.11, h: 0.06, d: 0.24 },
    material: p.armor,
    dark: p.dark,
  };
  parts.legL = at(legJoint(0, 0, 0, legSpec), -0.095, 0.88, 0);
  parts.legR = at(legJoint(0, 0, 0, legSpec), 0.095, 0.88, 0);
  group.add(parts.legL, parts.legR);

  // Lanza de plasma: se queda en la mano y acompana el balanceo del brazo.
  const lance = new THREE.Group();
  const shaft = taper(0.02, 0.028, 0.42, p.dark, 10);
  shaft.rotation.x = Math.PI / 2;
  lance.add(at(shaft, 0, 0, -0.16), at(ball(0.06, p.glow, 12), 0, 0, -0.38), at(spike(0.05, 0.16, p.glow, 10), 0, 0, -0.48));
  lance.rotation.x = -CLAW_POSE;
  parts.weapon = at(lance, 0, -0.74, -0.02);
  parts.armR.add(parts.weapon);

  const materials = Object.values(p);

  return {
    group,
    parts,
    materials,
    animate(delta, { time, moving, attacking, attackTime }) {
      const walk = moving ? Math.sin(time * 6) * 0.55 : 0;
      parts.legL.rotation.x = walk;
      parts.legR.rotation.x = -walk;
      parts.armL.rotation.x = CLAW_POSE - walk * 0.35;
      parts.armR.rotation.x = CLAW_POSE + walk * 0.35;
      parts.head.rotation.z = Math.sin(time * 2.5) * 0.06;
      const lunge = attacking && attackTime < 0.3 ? Math.sin(attackTime * 16) * 0.3 : 0;
      parts.weapon.position.z = -0.02 - lunge;
    },
  };
}

function buildTank() {
  const p = tankPalette();
  const group = new THREE.Group();
  const parts = {};

  // Torso bajo y ancho con glacis inclinado: rompe la caja y baja el peso visual.
  group.add(at(plate(0.7, 0.42, 0.42, p.armor, 0.07), 0, 1.04, 0));
  const glacis = plate(0.58, 0.34, 0.09, p.armor, 0.04);
  glacis.rotation.x = 0.5;
  group.add(at(glacis, 0, 1.08, -0.24));
  group.add(at(plate(0.15, 0.05, 0.035, p.glow, 0.012), 0, 0.93, -0.29));
  group.add(at(plate(0.46, 0.18, 0.3, p.armor, 0.05), 0, 0.77, 0));
  group.add(bag(0.12, p.dark, 0.26, 1.05, 0.25));

  // Cabeza pequena, hundida entre los hombros: perfil de vehiculo, no de persona.
  const head = new THREE.Group();
  at(head, 0, 1.3, -0.04);
  const dome = ball(0.155, p.dark);
  dome.scale.set(1, 0.8, 1);
  head.add(dome, at(plate(0.13, 0.05, 0.03, p.glow, 0.012), 0, -0.01, -0.145));
  parts.head = head;
  group.add(head);

  for (const x of [-0.4, 0.4]) {
    const pauldron = ball(0.185, p.armor);
    pauldron.scale.set(1.15, 0.72, 1);
    group.add(at(pauldron, x, 1.18, 0));
  }

  const armSpec = {
    upper: { r: 0.085, len: 0.18 },
    lower: { r: 0.075, len: 0.14 },
    jointR: 0.075,
    hand: { w: 0.13, h: 0.12, d: 0.12 },
    material: p.armor,
    dark: p.dark,
  };
  parts.armL = at(armJoint(0, 0, 0, armSpec), -0.42, 1.1, 0.02);
  parts.armR = at(armJoint(0, 0, 0, armSpec), 0.42, 1.1, 0.02);
  group.add(parts.armL, parts.armR);

  const legSpec = {
    thigh: { r: 0.105, len: 0.2 },
    shin: { r: 0.085, len: 0.16 },
    foot: { w: 0.19, h: 0.09, d: 0.28 },
    material: p.dark,
    dark: p.dark,
  };
  parts.legL = at(legJoint(0, 0, 0, legSpec), -0.23, 0.74, 0);
  parts.legR = at(legJoint(0, 0, 0, legSpec), 0.23, 0.74, 0);
  group.add(parts.legL, parts.legR);

  //Canon bajo, al frente, sin mas alla de las piernas.
  const cannon = new THREE.Group();
  const breech = taper(0.1, 0.14, 0.34, p.dark, 12);
  breech.rotation.x = Math.PI / 2;
  const muzzle = taper(0.06, 0.075, 0.26, p.glow, 12);
  muzzle.rotation.x = Math.PI / 2;
  cannon.add(
    at(breech, 0, 0, -0.12),
    at(plate(0.16, 0.12, 0.14, p.armor, 0.03), 0, 0.02, 0.08),
    at(muzzle, 0, 0, -0.4),
    at(ball(0.055, p.glow, 10), 0, 0, -0.54),
  );
  parts.cannon = at(cannon, 0.1, 0.95, -0.26);
  group.add(parts.cannon);

  const materials = Object.values(p);

  return {
    group,
    parts,
    materials,
    animate(delta, { time, moving, attacking, attackTime }) {
      const waddle = moving ? Math.sin(time * 4) * 0.5 : 0;
      parts.legL.rotation.x = waddle * 0.5;
      parts.legR.rotation.x = -waddle * 0.5;
      parts.armL.rotation.x = -0.2 - waddle * 0.2;
      parts.armR.rotation.x = -0.2 + waddle * 0.2;
      parts.head.rotation.y = Math.sin(time * 1.6) * 0.25;
      // El canon retrocede al disparar y vuelve: sin esto se queda corrido.
      const recoil = attacking && attackTime < 0.4 ? Math.sin(attackTime * 14) * 0.14 : 0;
      parts.cannon.position.z = -0.26 + recoil;
    },
  };
}

function buildBoss() {
  const p = bossPalette();
  const group = new THREE.Group();
  const parts = {};

  // Torso conico: ancho abajo, estrecho arriba. Al contrario que un cilindro,
  // asi que la silueta sube y se afila en vez de parecer un barril.
  const torso = taper(0.26, 0.46, 0.92, p.armor, 16);
  torso.scale.z = 0.66;
  group.add(at(torso, 0, 1.83, 0));
  group.add(at(plate(0.26, 0.5, 0.16, p.dark, 0.06), 0, 1.75, -0.26));
  // El anillo va por delante del nucleo: concentricos y a la misma altura
  // se leen como dos piezas peleandose por el mismo sitio.
  group.add(at(ring(0.2, 0.03, p.glow), 0, 1.86, -0.33));
  group.add(at(plate(0.5, 0.24, 0.32, p.dark, 0.06), 0, 1.34, 0));
  group.add(at(taper(0.3, 0.4, 0.14, p.dark, 14), 0, 2.3, 0));
  group.add(bag(0.17, p.dark, 0.3, 1.72, 0.24));

  const head = new THREE.Group();
  at(head, 0, 2.5, 0);
  const skull = ball(0.19, p.armor);
  skull.scale.set(0.88, 1, 0.92);
  head.add(skull, at(taper(0.07, 0.1, 0.16, p.dark), 0, -0.19, -0.02));
  for (const x of [-0.07, 0.07]) {
    const eye = ball(0.048, p.glow, 10);
    eye.scale.set(1.4, 0.7, 1);
    head.add(at(eye, x, 0.01, -0.15));
  }
  for (const x of [-0.15, 0.15]) {
    const horn = spike(0.055, 0.3, p.dark, 8);
    horn.rotation.z = x < 0 ? 0.5 : -0.5;
    head.add(at(horn, x, 0.16, 0.02));
  }
  parts.head = head;
  group.add(head);

  // Dos pares de brazos: los de arriba sostiene, los de abajo sujetan.
  parts.arms = [];
  const armSpec = {
    upper: { r: 0.082, len: 0.36 },
    lower: { r: 0.068, len: 0.3 },
    jointR: 0.075,
    hand: { w: 0.1, h: 0.12, d: 0.1 },
    material: p.armor,
    dark: p.dark,
  };
  for (const [x, y, z] of [
    [-0.52, 2.06, 0.02],
    [0.52, 2.06, 0.02],
    [-0.6, 1.6, 0.08],
    [0.6, 1.6, 0.08],
  ]) {
    const arm = at(armJoint(0, 0, 0, armSpec), x, y, z);
    const baseTilt = x < 0 ? 0.4 : -0.4;
    arm.rotation.z = baseTilt;
    group.add(arm);
    parts.arms.push({ arm, baseTilt, x });
  }

  const legSpec = {
    thigh: { r: 0.13, len: 0.4 },
    shin: { r: 0.1, len: 0.34 },
    foot: { w: 0.2, h: 0.11, d: 0.34 },
    material: p.armor,
    dark: p.dark,
  };
  parts.legL = at(legJoint(0, 0, 0, legSpec), -0.24, 1.19, 0);
  parts.legR = at(legJoint(0, 0, 0, legSpec), 0.24, 1.19, 0);
  group.add(parts.legL, parts.legR);

  const halo = ring(0.52, 0.022, p.glow);
  halo.rotation.x = Math.PI / 2;
  parts.halo = at(halo, 0, 2.14, 0);
  group.add(parts.halo);

  parts.core = at(ball(0.14, p.glow, 16), 0, 1.86, -0.3);
  group.add(parts.core);

  const materials = Object.values(p);

  return {
    group,
    parts,
    materials,
    animate(delta, { time, moving, attacking, attackTime }) {
      const walk = moving ? Math.sin(time * 3) * 0.35 : 0;
      parts.legL.rotation.x = walk;
      parts.legR.rotation.x = -walk;
      parts.core.scale.setScalar(1 + Math.sin(time * 7) * 0.18 + (attacking ? 0.25 : 0));
      parts.halo.rotation.z += delta * 0.8;
      // Absoluto sobre la inclinacion base: sumandolo cada frame los brazos
      // se irian abriendo hasta separarse del cuerpo.
      for (const { arm, baseTilt, x } of parts.arms) {
        const side = x < 0 ? 1 : -1;
        arm.rotation.z = baseTilt + Math.sin(time * 2 + baseTilt) * 0.06 * side;
      }
    },
  };
}

const BUILDERS = {
  soldier: buildSoldier,
  alien: buildAlien,
  tank: buildTank,
  boss: buildBoss,
};

/**
 * Construye el modelo de la variante y aplica su escala.
 * @returns {{ group: THREE.Group, parts: object, materials: THREE.Material[], animate: Function }}
 */
export function createMobModel(variant) {
  const build = BUILDERS[variant.model] ?? BUILDERS.soldier;
  const model = build();
  model.group.scale.setScalar(variant.scale);
  return model;
}

/** Registra la entidad en userData para que el raycast pueda resolverla. */
export function registerEntity(group, entity) {
  group.traverse((object) => {
    if (object.isMesh) object.userData.entity = entity;
  });
}

/**
 * Libera la memoria de un modelo. Cada build crea sus propias geometrias y
 * materiales, asi que al cambiar de etapa hay que soltar los enemigos
 * retirados o la GPU acumula buffers sin uso.
 */
export function disposeModel(group) {
  group.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) material.dispose();
  });
}

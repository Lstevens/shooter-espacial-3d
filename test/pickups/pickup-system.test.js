import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { PickupSystem } from '../../src/pickups/PickupSystem.js';

function pickupGroup(scene) {
  return scene.getObjectByName('pickups');
}

test('contrato: expone spawn, update, clear y dispose', () => {
  const scene = new THREE.Scene();
  const system = new PickupSystem({ scene });
  for (const method of ['spawn', 'update', 'clear', 'dispose']) {
    assert.equal(typeof system[method], 'function', `falta ${method}`);
  }
  system.dispose();
});

test('spawn crea un drop visible en la escena', () => {
  const scene = new THREE.Scene();
  const system = new PickupSystem({ scene });
  const group = pickupGroup(scene);
  assert.ok(group, 'el sistema debe montar su grupo en la escena');

  system.spawn('health', new THREE.Vector3(2, 0, -3));
  system.spawn('ammo', new THREE.Vector3(-2, 0, -3));
  assert.equal(group.children.length, 2);

  // Tipos invalidos se ignoran.
  system.spawn('mana', new THREE.Vector3(0, 0, 0));
  assert.equal(group.children.length, 2);

  system.dispose();
});

test('update sin jugador cerca no recoge nada', () => {
  const scene = new THREE.Scene();
  const system = new PickupSystem({ scene });
  const collected = [];
  system.spawn('ammo', new THREE.Vector3(4, 0, 4));

  system.update(0.1, new THREE.Vector3(0, 0, 0), {
    onPickup: (kind) => collected.push(kind),
  });

  assert.equal(collected.length, 0);
  assert.equal(pickupGroup(scene).children.length, 1);
  system.dispose();
});

test('acercarse recoge el drop una sola vez y lo retira', () => {
  const scene = new THREE.Scene();
  const system = new PickupSystem({ scene });
  const collected = [];
  system.spawn('health', new THREE.Vector3(1, 0, 0));

  const near = new THREE.Vector3(1.2, 0, 0);
  system.update(0.1, near, { onPickup: (kind) => collected.push(kind) });
  system.update(0.1, near, { onPickup: (kind) => collected.push(kind) });

  assert.deepEqual(collected, ['health'], 'solo debe recogerse una vez');
  assert.equal(pickupGroup(scene).children.length, 0);
  system.dispose();
});

test('los drops caducan tras su lifetime', () => {
  const scene = new THREE.Scene();
  const system = new PickupSystem({ scene, lifetime: 2 });
  system.spawn('ammo', new THREE.Vector3(5, 0, 5));

  system.update(1, new THREE.Vector3(0, 0, 0), {});
  assert.equal(pickupGroup(scene).children.length, 1, 'aun no caduca');

  system.update(1.5, new THREE.Vector3(0, 0, 0), {});
  assert.equal(pickupGroup(scene).children.length, 0, 'caducado');
  system.dispose();
});

test('clear retira todo y dispose libera el grupo', () => {
  const scene = new THREE.Scene();
  const system = new PickupSystem({ scene });
  system.spawn('health', new THREE.Vector3(1, 0, 1));
  system.spawn('ammo', new THREE.Vector3(-1, 0, 1));

  system.clear();
  assert.equal(pickupGroup(scene).children.length, 0);

  system.spawn('health', new THREE.Vector3(0, 0, 2));
  system.dispose();
  assert.equal(pickupGroup(scene), undefined, 'dispose quita el grupo de la escena');
});

test('sin escena el sistema es inofensivo', () => {
  const system = new PickupSystem({});
  assert.doesNotThrow(() => {
    system.spawn('health', new THREE.Vector3(0, 0, 0));
    system.update(0.1, new THREE.Vector3(0, 0, 0), {});
    system.clear();
    system.dispose();
  });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { Hud } from '../../src/ui/Hud.js';

/**
 * Raiz DOM falsa: cada elemento cuenta sus escrituras de textContent para
 * poder afirmar que el render diferido no reescribe lo que no cambio.
 */
function makeElement(id) {
  const classes = new Set();
  const listeners = {};
  const counts = { text: 0 };
  return {
    id,
    children: [],
    dataset: {},
    offsetWidth: 0,
    style: {},
    counts,
    classes,
    listeners,
    get textContent() {
      return this._text ?? '';
    },
    set textContent(value) {
      counts.text += 1;
      this._text = value;
    },
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      contains: (name) => classes.has(name),
      toggle(name, force) {
        const on = force === undefined ? !classes.has(name) : Boolean(force);
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      },
    },
    addEventListener(type, handler) {
      (listeners[type] ??= []).push(handler);
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    remove() {},
  };
}

function makeRoot() {
  const elements = new Map();
  return {
    elements,
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, makeElement(id));
      return elements.get(id);
    },
    createElement(tag) {
      return makeElement(tag);
    },
  };
}

/** Snapshot completo v1 (con weaponAmmo y boss). */
function fullSnapshot(overrides = {}) {
  return {
    hp: 20,
    maxHp: 20,
    elapsed: 12,
    weaponLabel: 'AK',
    weaponAmmo: {
      hasAmmo: true,
      magazine: 24,
      capacity: 30,
      reserve: 90,
      reloading: false,
      reloadProgress: 0,
    },
    boss: null,
    stageIndex: 1,
    stageTotal: 5,
    stageLabel: 'Hangar',
    difficulty: 'Amenaza baja',
    ...overrides,
  };
}

function totalTextWrites(root) {
  let total = 0;
  for (const element of root.elements.values()) total += element.counts.text;
  return total;
}

test('render diferido: el snapshot identico no reescribe el DOM', () => {
  const root = makeRoot();
  const hud = new Hud(root);

  hud.render(fullSnapshot());
  const writes = totalTextWrites(root);
  assert.ok(writes > 0, 'el primer render debe escribir el DOM');

  hud.render(fullSnapshot());
  assert.equal(totalTextWrites(root), writes, 'el segundo render no debe tocar nada');

  hud.render(fullSnapshot({ hp: 18 }));
  assert.ok(totalTextWrites(root) > writes, 'un cambio de vida debe reescribir');
});

test('tolera snapshots v0 sin weaponAmmo ni boss', () => {
  const root = makeRoot();
  const hud = new Hud(root);
  const legacy = fullSnapshot();
  delete legacy.weaponAmmo;
  delete legacy.boss;

  assert.doesNotThrow(() => hud.render(legacy));
  assert.equal(root.getElementById('weapon-ammo').classes.has('active'), false);
  assert.equal(root.getElementById('boss-bar').classes.has('active'), false);
});

test('muestra y oculta la municion y la recarga', () => {
  const root = makeRoot();
  const hud = new Hud(root);
  const ammoEl = root.getElementById('weapon-ammo');

  hud.render(fullSnapshot());
  assert.equal(ammoEl.classes.has('active'), true);
  assert.equal(root.getElementById('ammo-count').textContent, '24 / 90');
  assert.equal(ammoEl.classes.has('reloading'), false);

  hud.render(
    fullSnapshot({
      weaponAmmo: {
        hasAmmo: true,
        magazine: 5,
        capacity: 30,
        reserve: 40,
        reloading: true,
        reloadProgress: 0.5,
      },
    }),
  );
  assert.equal(ammoEl.classes.has('reloading'), true);
  assert.equal(root.getElementById('reload-fill').style.width, '50%');

  hud.render(fullSnapshot({ weaponAmmo: { hasAmmo: false } }));
  assert.equal(ammoEl.classes.has('active'), false);
});

test('barra del jefe: aparece con boss y refleja la vida', () => {
  const root = makeRoot();
  const hud = new Hud(root);
  const bossBar = root.getElementById('boss-bar');

  hud.render(fullSnapshot());
  assert.equal(bossBar.classes.has('active'), false);

  hud.render(fullSnapshot({ boss: { hp: 100, maxHp: 200 } }));
  assert.equal(bossBar.classes.has('active'), true);
  assert.equal(root.getElementById('boss-fill').style.width, '50.0%');
  assert.equal(root.getElementById('boss-text').textContent, '100 / 200');

  hud.render(fullSnapshot({ boss: null }));
  assert.equal(bossBar.classes.has('active'), false);
});

test('pausa: showPause/hidePause y onResume disparan el boton', () => {
  const root = makeRoot();
  const hud = new Hud(root);
  const pause = root.getElementById('pause');

  hud.showPause();
  assert.equal(pause.classes.has('show'), true);
  hud.hidePause();
  assert.equal(pause.classes.has('show'), false);

  let resumed = 0;
  hud.onResume(() => {
    resumed += 1;
  });
  for (const handler of root.getElementById('pause-resume').listeners.click) handler();
  assert.equal(resumed, 1);
});

test('damageFrom rota el indicador y reinicia su animacion', () => {
  const root = makeRoot();
  const hud = new Hud(root);
  const indicator = root.getElementById('damage-indicator');

  hud.damageFrom(Math.PI / 2);
  assert.equal(indicator.style.transform, `rotate(${Math.PI / 2}rad)`);
  assert.equal(indicator.classes.has('active'), true);

  // Un segundo golpe debe quitar y volver a poner la clase para reiniciar
  // la animacion CSS.
  indicator.classes.delete('active');
  hud.damageFrom(0);
  assert.equal(indicator.style.transform, 'rotate(0rad)');
  assert.equal(indicator.classes.has('active'), true);
});

test('damageNumber anade el flotante al contenedor', () => {
  const root = makeRoot();
  const hud = new Hud(root);
  hud.damageNumber(5);
  assert.equal(root.getElementById('damage-numbers').children.length, 1);
});

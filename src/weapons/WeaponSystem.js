import { WEAPON_CATALOG, WEAPON_ORDER, DEFAULT_WEAPON } from './WeaponCatalog.js';

/**
 * Seleccion y cadencia de armas. Conoce el catalogo y las estrategias
 * por id, pero no sabe como se ejecuta cada una.
 */
export class WeaponSystem {
  #view;
  #attacks = new Map();
  #viewModel;
  #clock;
  #isFiring;
  #effects;
  #targets = [];
  #key = DEFAULT_WEAPON;
  #lastShot = -Infinity;

  constructor({ view, viewModel, clock, isFiring, effects, attacks }) {
    this.#view = view;
    this.#viewModel = viewModel;
    this.#clock = clock;
    this.#isFiring = isFiring;
    this.#effects = effects;
    for (const attack of attacks) this.#attacks.set(attack.id, attack);
    this.select(DEFAULT_WEAPON);
  }

  get currentKey() {
    return this.#key;
  }

  get current() {
    return WEAPON_CATALOG[this.#key];
  }

  get currentLabel() {
    return this.current.label;
  }

  /** @param {import('../contracts.js').Target[]} targets */
  setTargets(targets) {
    this.#targets = targets;
  }

  select(key) {
    if (!WEAPON_CATALOG[key]) return;
    this.#key = key;
    this.#viewModel.onSwitch(key);
  }

  cycle(direction = 1) {
    const index = WEAPON_ORDER.indexOf(this.#key);
    this.select(WEAPON_ORDER[(index + direction + WEAPON_ORDER.length) % WEAPON_ORDER.length]);
  }

  tryFire() {
    const weapon = this.current;
    const now = this.#clock.getElapsedTime();
    if (now - this.#lastShot < weapon.fireRate) return false;
    this.#lastShot = now;

    this.#viewModel.onShot(weapon);
    this.#attacks.get(weapon.attack)?.execute(this.#buildContext(), weapon);
    return true;
  }

  update(delta) {
    this.#viewModel.update(delta, this.#view.bobPhase, this.#clock.getElapsedTime());
    if (this.current.automatic && this.#isFiring()) this.tryFire();
  }

  #buildContext() {
    return {
      origin: this.#view.origin,
      direction: this.#view.forward(),
      muzzle: this.#viewModel.muzzleWorldPosition(),
      targets: this.#targets,
      fx: this.#effects,
    };
  }
}

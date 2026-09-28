export const ATTACKS = {
  hitscan: 'hitscan',
  melee: 'melee',
};

/** @type {Record<string, import('../contracts.js').WeaponDef>} */
export const WEAPON_CATALOG = {
  pistol: {
    label: 'Pistola',
    damage: 20,
    fireRate: 0.3,
    automatic: false,
    range: 50,
    attack: ATTACKS.hitscan,
    muzzle: { x: 0, y: 0.02, z: -0.27 },
    flashScale: 0.4,
    recoilPush: 0.075,
    swingPush: 0,
  },
  ak: {
    label: 'AK',
    damage: 8,
    fireRate: 0.1,
    automatic: true,
    range: 50,
    attack: ATTACKS.hitscan,
    muzzle: { x: 0, y: 0, z: -0.75 },
    flashScale: 0.62,
    recoilPush: 0.05,
    swingPush: 0,
  },
  knife: {
    label: 'Cuchillo',
    damage: 25,
    fireRate: 0.3,
    automatic: false,
    range: 6,
    attack: ATTACKS.melee,
    muzzle: { x: 0, y: 0, z: -0.3 },
    flashScale: 0,
    recoilPush: 0,
    swingPush: 0.16,
  },
};

export const WEAPON_ORDER = ['pistol', 'ak', 'knife'];

export const DEFAULT_WEAPON = 'knife';

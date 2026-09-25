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
  },
  ak: {
    label: 'AK',
    damage: 8,
    fireRate: 0.1,
    automatic: true,
    range: 50,
    attack: ATTACKS.hitscan,
  },
  knife: {
    label: 'Cuchillo',
    damage: 25,
    fireRate: 0.3,
    automatic: false,
    range: 8,
    attack: ATTACKS.melee,
  },
};

export const WEAPON_ORDER = ['pistol', 'ak', 'knife'];

export const DEFAULT_WEAPON = 'pistol';

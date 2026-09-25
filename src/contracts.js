/**
 * Contratos compartidos entre modulos.
 * Solo tipos JSDoc: cero codigo en tiempo de ejecucion.
 * Un modulo depende de la forma documentada aqui, no de una clase concreta.
 *
 * @typedef {Object} WeaponDef
 * @property {string} label
 * @property {number} damage
 * @property {number} fireRate segundos entre disparos
 * @property {boolean} automatic dispara mientras el boton este presionado
 * @property {number} range
 * @property {string} attack id de la estrategia de ataque en WeaponSystem
 *
 * @typedef {Object} AttackContext
 * @property {import('three').Vector3} origin posicion del jugador
 * @property {import('three').Vector3} direction vector normalizado hacia donde mira
 * @property {import('three').Vector3} muzzle punto de salida del proyectil
 * @property {Target[]} targets todo lo que puede recibir dano
 * @property {{ spawnBurst: (position: import('three').Vector3, count: number, speed: number, hex: number) => void,
 *              spawnTracer: (from: import('three').Vector3, to: import('three').Vector3) => void }} fx
 *
 * @typedef {Object} Target contrato minimo de un objetivo atacable
 * @property {import('three').Object3D} group raiz usada para raycast
 * @property {import('three').Vector3} position
 * @property {boolean} isAlive
 * @property {(amount: number) => void} takeDamage
 *
 * @typedef {Object} AttackStrategy contrato minimo de un modo de disparo
 * @property {string} id
 * @property {(context: AttackContext, weapon: WeaponDef) => void} execute
 *
 * @typedef {Object} ViewSource lo que un arma necesita ver para dispararse
 * @property {import('three').Vector3} origin
 * @property {() => import('three').Vector3} forward
 * @property {() => import('three').Vector3} muzzleWorldPosition
 * @property {number} bobPhase
 *
 * @typedef {Object} MovementAxis
 * @property {number} forward -1 0 1
 * @property {number} right -1 0 1
 *
 * @typedef {Object} MobVariant
 * @property {string} label
 * @property {number} color
 * @property {number} scale
 * @property {number} speed
 * @property {number} damage
 * @property {number} attackRange
 * @property {number} attackCooldown
 *
 * @typedef {Object} AiContext
 * @property {import('three').Vector3} targetPosition
 * @property {(damage: number) => void} onHit
 *
 * @typedef {Object} Snapshot lo que el HUD necesita para dibujarse
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} secondsLeft
 * @property {string} weaponLabel
 */

export {};

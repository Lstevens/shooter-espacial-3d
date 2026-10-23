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
 * @property {{x: number, y: number, z: number}} muzzle boca del arma en el espacio del modelo
 * @property {number} flashScale tamano del destello de boca
 * @property {number} recoilPush retroceso del arma al disparar
 * @property {number} swingPush avance del arma al golpear cuerpo a cuerpo
 * @property {number} [magazine] balas por cargador; si falta, el arma no usa municion
 * @property {number} [reserve] reserva inicial
 * @property {number} [maxReserve] tope de reserva
 * @property {number} [reloadTime] segundos que tarda la recarga
 *
 * @typedef {Object} WeaponAmmoState
 * @property {boolean} hasAmmo el arma usa municion
 * @property {number} magazine balas en el cargador
 * @property {number} capacity tamano del cargador
 * @property {number} reserve balas guardadas
 * @property {boolean} reloading
 * @property {number} reloadProgress 0 a 1
 *
 * @typedef {Object} AttackContext
 * @property {import('three').Vector3} origin posicion del jugador
 * @property {import('three').Vector3} direction vector normalizado hacia donde mira
 * @property {import('three').Vector3} muzzle punto de salida del proyectil, vector temporal del ViewModel: copiar antes de usar
 * @property {Target[]} targets todo lo que puede recibir dano
 * @property {{ spawnBurst: (position: import('three').Vector3, count: number, speed: number, hex: number) => void,
 *              spawnTracer: (from: import('three').Vector3, to: import('three').Vector3) => void }} fx
 *
 * @typedef {Object} Target contrato minimo de un objetivo atacable
 * @property {import('three').Object3D} group raiz usada para raycast
 * @property {import('three').Vector3} position
 * @property {boolean} isAlive
 * @property {(amount: number) => void} takeDamage
 * @property {import('three').Vector3} [aimPoint] centro del cuerpo para golpes cuerpo a cuerpo
 * @property {number} [maxHp] vida maxima, para barras o depuracion
 *
 * @typedef {Object} AttackStrategy contrato minimo de un modo de disparo
 * @property {string} id
 * @property {(context: AttackContext, weapon: WeaponDef) => void} execute
 *
 * @typedef {Object} ViewSource lo que un arma necesita ver para dispararse
 * @property {import('three').Vector3} origin
 * @property {() => import('three').Vector3} forward
 * @property {number} bobPhase
 *
 * @typedef {Object} MovementAxis
 * @property {number} forward -1 0 1
 * @property {number} right -1 0 1
 *
 * @typedef {Object} MobVariant
 * @property {string} label
 * @property {number} [maxHp] si falta, gana MOB.maxHp
 * @property {number} color
 * @property {number} scale
 * @property {number} speed
 * @property {number} damage
 * @property {number} attackRange
 * @property {number} attackCooldown
 *
 * @typedef {Object} AiContext
 * @property {import('three').Vector3} targetPosition
 * @property {(damage: number, sourcePosition?: import('three').Vector3) => void} onHit
 * @property {import('./engine/CollisionWorld.js').CollisionWorld|null} [collision]
 *
 * @typedef {Object} BossState
 * @property {number} hp
 * @property {number} maxHp
 *
 * @typedef {Object} Snapshot lo que el HUD necesita para dibujarse
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} elapsed segundos sobrevividos en la camara actual
 * @property {string} weaponLabel
 * @property {WeaponAmmoState} weaponAmmo
 * @property {BossState|null} boss jefe vivo de la camara, si ya aparecio
 * @property {number} stageIndex camara actual de la campania (1 a 5)
 * @property {number} stageTotal total de camaras
 * @property {string} stageLabel nombre de la camara
 * @property {string} difficulty nivel de amenaza de la camara
 *
 * @typedef {Object} HudContract vista del DOM que consume Game
 * @property {(snapshot: Snapshot) => void} render
 * @property {() => void} showPause
 * @property {() => void} hidePause
 * @property {(angleRad: number) => void} damageFrom 0 = frente, +PI/2 = derecha
 * @property {() => void} flashDamage
 * @property {(amount: number) => void} damageNumber
 * @property {(active: boolean) => void} setCrosshair
 *
 * @typedef {Object} AudioContract sonido procedural, sin archivos
 * @property {() => void} resume
 * @property {(muted: boolean) => void} setMuted
 * @property {() => boolean} toggleMute
 * @property {(weaponId: string) => void} shot
 * @property {() => void} reload
 * @property {() => void} empty
 * @property {() => void} hurt
 * @property {() => void} death
 * @property {() => void} win
 * @property {() => void} bossDown
 * @property {() => void} pickup
 *
 * @typedef {'health'|'ammo'} PickupKind
 * @typedef {Object} PickupSystemContract
 * @property {(kind: PickupKind, position: import('three').Vector3) => void} spawn
 * @property {(delta: number, playerPosition: import('three').Vector3,
 *   hooks: { onPickup?: (kind: PickupKind) => void }) => void} update
 * @property {() => void} clear
 * @property {() => void} dispose
 */

export {};

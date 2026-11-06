const ANNOUNCE_SECONDS = 2.5;
const LOW_HEALTH_RATIO = 0.3;
const HP_GOOD = '#4bb34b';
const HP_WARN = '#e0a63a';
const HP_LOW = '#d64545';

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Color de la barra segun la vida restante. */
function hpColor(ratio) {
  if (ratio > 0.6) return HP_GOOD;
  if (ratio > LOW_HEALTH_RATIO) return HP_WARN;
  return HP_LOW;
}

/**
 * Vista del DOM: vida, municion, tiempo, camara, arma, avisos, cruz, pausa,
 * barra del jefe, indicador direccional de dano y fin de partida.
 *
 * `render` es diferido: cada campo se compara con el ultimo valor dibujado y
 * solo toca el DOM si cambio. Game construye el snapshot cada frame, pero el
 * texto del HUD solo cambia de verdad unas pocas veces por segundo.
 *
 * Tolera snapshots antiguos (sin `weaponAmmo` ni `boss`, contrato v0) y raices
 * falsas inyectadas para tests, sin dependencias de navegador.
 */
export class Hud {
  #root;
  #elements;
  #announceTimer = 0;
  /** Ultimo valor dibujado por campo; sirve de cache de escritura. */
  #last = {};

  constructor(root = document) {
    this.#root = root;
    this.#elements = {
      hpBar: root.getElementById('hp-bar'),
      hpFill: root.getElementById('hp-fill'),
      hpText: root.getElementById('hp-text'),
      lowHealth: root.getElementById('low-health'),
      weaponLabel: root.getElementById('weapon-label'),
      weaponAmmo: root.getElementById('weapon-ammo'),
      ammoCount: root.getElementById('ammo-count'),
      reloadFill: root.getElementById('reload-fill'),
      bossBar: root.getElementById('boss-bar'),
      bossFill: root.getElementById('boss-fill'),
      bossText: root.getElementById('boss-text'),
      stageLabel: root.getElementById('stage-label'),
      time: root.getElementById('time'),
      announce: root.getElementById('announce'),
      crosshair: root.getElementById('crosshair'),
      damageFlash: root.getElementById('damage-flash'),
      damageIndicator: root.getElementById('damage-indicator'),
      damageNumbers: root.getElementById('damage-numbers'),
      pause: root.getElementById('pause'),
      pauseResume: root.getElementById('pause-resume'),
      pauseRestart: root.getElementById('pause-restart'),
      pauseRestartFirst: root.getElementById('pause-restart-first'),
      gameover: root.getElementById('gameover'),
      gameoverTitle: root.getElementById('gameover-title'),
      gameoverText: root.getElementById('gameover-text'),
      gameoverStats: root.getElementById('gameover-stats'),
      restart: root.getElementById('restart'),
      restartFirst: root.getElementById('restart-first'),
    };
  }

  onRestart(handler) {
    this.#elements.restart.addEventListener('click', handler);
    this.#elements.pauseRestart?.addEventListener('click', handler);
  }

  onRestartFromFirst(handler) {
    this.#elements.restartFirst.addEventListener('click', handler);
    this.#elements.pauseRestartFirst?.addEventListener('click', handler);
  }

  /**
   * El boton Continuar de la pausa vuelve a pedir el PointerLock; el click
   * es el gesto de usuario que el navegador exige para poder re bloquear.
   */
  onResume(handler) {
    this.#elements.pauseResume?.addEventListener('click', handler);
  }

  showPause() {
    this.#elements.pause?.classList.add('show');
  }

  hidePause() {
    this.#elements.pause?.classList.remove('show');
  }

  setCrosshair(active) {
    this.#elements.crosshair.classList.toggle('active', active);
  }

  /**
   * Escribe en el DOM solo lo que cambio respecto al render anterior.
   * @param {import('../contracts.js').Snapshot} snapshot
   */
  render(snapshot) {
    const hp = Number.isFinite(snapshot.hp) ? Math.max(0, snapshot.hp) : 0;
    const maxHp = snapshot.maxHp > 0 ? snapshot.maxHp : 1;
    const ratio = Math.min(1, hp / maxHp);

    this.#apply('hpWidth', `${(ratio * 100).toFixed(1)}%`, (value) => {
      this.#elements.hpFill.style.width = value;
    });
    this.#apply('hpColor', hpColor(ratio), (value) => {
      this.#elements.hpFill.style.background = value;
    });
    this.#apply('hpText', `${hp} / ${snapshot.maxHp}`, (value) => {
      this.#elements.hpText.textContent = value;
    });
    this.#apply('weaponLabel', snapshot.weaponLabel, (value) => {
      this.#elements.weaponLabel.textContent = value;
    });

    this.#renderAmmo(snapshot.weaponAmmo ?? null);
    this.#renderBoss(snapshot.boss ?? null);

    this.#apply(
      'stageLabel',
      `Camara ${snapshot.stageIndex}/${snapshot.stageTotal}: ${snapshot.stageLabel} · ${snapshot.difficulty}`,
      (value) => {
        this.#elements.stageLabel.textContent = value;
      },
    );
    this.#apply('time', `Resistencia: ${formatTime(snapshot.elapsed)}`, (value) => {
      this.#elements.time.textContent = value;
    });

    const low = ratio > 0 && ratio <= LOW_HEALTH_RATIO;
    this.#apply('hpLow', low, (value) => {
      this.#elements.hpBar.classList.toggle('low', value);
      this.#elements.lowHealth.classList.toggle('active', value);
    });
  }

  /** Municion del arma actual. Sin weaponAmmo (contrato v0) o cuchillo: oculto. */
  #renderAmmo(ammo) {
    const hasAmmo = Boolean(ammo?.hasAmmo);
    this.#apply('hasAmmo', hasAmmo, (value) => {
      this.#elements.weaponAmmo?.classList.toggle('active', value);
    });
    if (!hasAmmo) return;

    this.#apply('ammoCount', `${ammo.magazine} / ${ammo.reserve}`, (value) => {
      this.#elements.ammoCount.textContent = value;
    });
    this.#apply('reloading', Boolean(ammo.reloading), (value) => {
      this.#elements.weaponAmmo?.classList.toggle('reloading', value);
    });
    if (ammo.reloading) {
      const percent = Math.round(
        Math.min(1, Math.max(0, ammo.reloadProgress)) * 100,
      );
      this.#apply('reloadProgress', percent, (value) => {
        this.#elements.reloadFill.style.width = `${value}%`;
      });
    }
  }

  /** Barra del jefe. Sin boss vivo no se muestra. */
  #renderBoss(boss) {
    const active = Boolean(boss);
    this.#apply('bossActive', active, (value) => {
      this.#elements.bossBar?.classList.toggle('active', value);
    });
    if (!active) return;

    const maxHp = boss.maxHp > 0 ? boss.maxHp : 1;
    const ratio = Math.min(1, Math.max(0, boss.hp / maxHp));
    this.#apply('bossWidth', `${(ratio * 100).toFixed(1)}%`, (value) => {
      this.#elements.bossFill.style.width = value;
    });
    this.#apply('bossText', `${Math.ceil(boss.hp)} / ${boss.maxHp}`, (value) => {
      this.#elements.bossText.textContent = value;
    });
  }

  /** Aplica value solo si cambio desde la ultima vez que se dibujo. */
  #apply(key, value, write) {
    if (this.#last[key] === value) return;
    this.#last[key] = value;
    write(value);
  }

  flashDamage() {
    const flash = this.#elements.damageFlash;
    flash.style.transition = 'none';
    flash.style.opacity = '0.8';
    void flash.offsetWidth;
    flash.style.transition = 'opacity 0.5s';
    flash.style.opacity = '0';
  }

  /**
   * Flecha alrededor de la mira indicando de donde vino el golpe.
   * @param {number} angleRad 0 = frente, +PI/2 = derecha
   */
  damageFrom(angleRad = 0) {
    const indicator = this.#elements.damageIndicator;
    if (!indicator) return;
    indicator.style.transform = `rotate(${angleRad}rad)`;
    // Reinicia la animacion CSS para que cada golpe se vea desde el principio.
    indicator.classList.remove('active');
    void indicator.offsetWidth;
    indicator.classList.add('active');
  }

  /** Numero flotante con el dano recibido, para leer el golpe de un vistazo. */
  damageNumber(amount) {
    const number = this.#root.createElement('span');
    number.className = 'damage-number';
    number.textContent = `-${amount}`;
    number.style.left = `${44 + Math.random() * 12}%`;
    number.style.top = `${44 + Math.random() * 12}%`;
    number.addEventListener('animationend', () => number.remove());
    this.#elements.damageNumbers.appendChild(number);
  }

  announce(text, seconds = ANNOUNCE_SECONDS) {
    this.#elements.announce.textContent = text;
    this.#announceTimer = seconds;
    this.#elements.announce.style.opacity = '1';
  }

  updateAnnounce(delta) {
    if (this.#announceTimer <= 0) return;
    this.#announceTimer -= delta;
    if (this.#announceTimer <= 0) this.#elements.announce.style.opacity = '0';
  }

  /**
   * @param {{ won: boolean, stage: import('../config.js').Stage,
   *  unlocked: (import('../config.js').Stage|null), complete: boolean,
   *  total: number, kills: number, elapsed: number }} overview
   */
  showGameOver({ won, stage, unlocked, complete, total, kills, elapsed }) {
    let title;
    if (!won) {
      title = 'OPERADOR CAÍDO';
      this.#elements.gameoverText.textContent =
        `Señal perdida en la cámara ${stage.id}/${total} (${stage.label}). El núcleo sigue activo.`;
      this.#elements.restart.textContent = 'Reintentar';
    } else if (complete) {
      title = 'SISTEMA ASEGURADO';
      this.#elements.gameoverText.textContent =
        `Cámara ${stage.id}/${total} (${stage.label}) neutralizada. Los 5 núcleos están bajo tu control.`;
      this.#elements.restart.textContent = 'Reiniciar campaña';
    } else {
      title = 'CÁMARA DESPEJADA';
      this.#elements.gameoverText.textContent =
        `Núcleo de ${stage.label} asegurado. Acceso concedido a la cámara ` +
        `${unlocked.id}: ${unlocked.label} (${unlocked.difficulty}).`;
      this.#elements.restart.textContent = `Avanzar a cámara ${unlocked.id}`;
    }
    this.#elements.gameoverTitle.textContent = title;
    this.#elements.gameoverTitle.dataset.text = title;
    this.#elements.gameoverStats.textContent =
      `Bajas confirmadas: ${kills} · Tiempo de resistencia: ${formatTime(elapsed)}`;
    this.#elements.gameover.classList.add('show');
  }

  hideGameOver() {
    this.#elements.gameover.classList.remove('show');
  }
}

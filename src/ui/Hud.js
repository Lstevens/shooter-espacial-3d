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

/** Vista del DOM: vida, tiempo, camara, arma, avisos, cruz y fin de partida. */
export class Hud {
  #elements;
  #announceTimer = 0;

  constructor(root = document) {
    this.#elements = {
      hpBar: root.getElementById('hp-bar'),
      hpFill: root.getElementById('hp-fill'),
      hpText: root.getElementById('hp-text'),
      lowHealth: root.getElementById('low-health'),
      weaponLabel: root.getElementById('weapon-label'),
      stageLabel: root.getElementById('stage-label'),
      time: root.getElementById('time'),
      announce: root.getElementById('announce'),
      crosshair: root.getElementById('crosshair'),
      damageFlash: root.getElementById('damage-flash'),
      damageNumbers: root.getElementById('damage-numbers'),
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
  }

  onRestartFromFirst(handler) {
    this.#elements.restartFirst.addEventListener('click', handler);
  }

  setCrosshair(active) {
    this.#elements.crosshair.classList.toggle('active', active);
  }

  /** @param {import('../contracts.js').Snapshot} snapshot */
  render(snapshot) {
    const ratio = snapshot.maxHp > 0 ? snapshot.hp / snapshot.maxHp : 0;
    this.#elements.hpFill.style.width = `${ratio * 100}%`;
    this.#elements.hpFill.style.background = hpColor(ratio);
    this.#elements.hpText.textContent = `${snapshot.hp} / ${snapshot.maxHp}`;
    this.#elements.weaponLabel.textContent = snapshot.weaponLabel;
    this.#elements.stageLabel.textContent =
      `Camara ${snapshot.stageIndex}/${snapshot.stageTotal}: ${snapshot.stageLabel} · ${snapshot.difficulty}`;
    this.#elements.time.textContent = `Resistencia: ${formatTime(snapshot.elapsed)}`;

    const low = ratio > 0 && ratio <= LOW_HEALTH_RATIO;
    this.#elements.hpBar.classList.toggle('low', low);
    this.#elements.lowHealth.classList.toggle('active', low);
  }

  flashDamage() {
    const flash = this.#elements.damageFlash;
    flash.style.transition = 'none';
    flash.style.opacity = '0.8';
    void flash.offsetWidth;
    flash.style.transition = 'opacity 0.5s';
    flash.style.opacity = '0';
  }

  /** Numero flotante con el dano recibido, para leer el golpe de un vistazo. */
  damageNumber(amount) {
    const number = document.createElement('span');
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
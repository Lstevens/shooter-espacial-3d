const ANNOUNCE_SECONDS = 2.5;

/** Vista del DOM: vida, tiempo, camara, arma, avisos, cruz y fin de partida. */
export class Hud {
  #elements;
  #announceTimer = 0;

  constructor(root = document) {
    this.#elements = {
      hpFill: root.getElementById('hp-fill'),
      hpText: root.getElementById('hp-text'),
      weaponLabel: root.getElementById('weapon-label'),
      stageLabel: root.getElementById('stage-label'),
      time: root.getElementById('time'),
      announce: root.getElementById('announce'),
      crosshair: root.getElementById('crosshair'),
      damageFlash: root.getElementById('damage-flash'),
      gameover: root.getElementById('gameover'),
      gameoverTitle: root.getElementById('gameover-title'),
      gameoverText: root.getElementById('gameover-text'),
      restart: root.getElementById('restart'),
    };
  }

  onRestart(handler) {
    this.#elements.restart.addEventListener('click', handler);
  }

  setCrosshair(active) {
    this.#elements.crosshair.classList.toggle('active', active);
  }

  /** @param {import('../contracts.js').Snapshot} snapshot */
  render(snapshot) {
    this.#elements.hpFill.style.width = `${(snapshot.hp / snapshot.maxHp) * 100}%`;
    this.#elements.hpText.textContent = `${snapshot.hp} / ${snapshot.maxHp}`;
    this.#elements.weaponLabel.textContent = snapshot.weaponLabel;
    this.#elements.stageLabel.textContent =
      `Camara ${snapshot.stageIndex}/${snapshot.stageTotal}: ${snapshot.stageLabel}`;
    const minutes = Math.floor(snapshot.secondsLeft / 60);
    const seconds = Math.floor(snapshot.secondsLeft % 60);
    this.#elements.time.textContent = `Tiempo: ${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  flashDamage() {
    const flash = this.#elements.damageFlash;
    flash.style.transition = 'none';
    flash.style.opacity = '0.8';
    void flash.offsetWidth;
    flash.style.transition = 'opacity 0.5s';
    flash.style.opacity = '0';
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
   *  total: number }} overview
   */
  showGameOver({ won, stage, unlocked, complete, total }) {
    if (!won) {
      this.#elements.gameoverTitle.textContent = 'Has muerto';
      this.#elements.gameoverText.textContent =
        `Camara ${stage.id}/${total}: ${stage.label}. El jefe sigue en pie.`;
      this.#elements.restart.textContent = 'Reintentar';
    } else if (complete) {
      this.#elements.gameoverTitle.textContent = '¡Campaña completada!';
      this.#elements.gameoverText.textContent =
        `Derrotaste al jefe de la camara ${stage.id}/${total} (${stage.label}). Los 5 nucleos son tuyos.`;
      this.#elements.restart.textContent = 'Reiniciar campaña';
    } else {
      this.#elements.gameoverTitle.textContent = '¡Cámara superada!';
      this.#elements.gameoverText.textContent =
        `Derrotaste al jefe de la camara ${stage.id}. Se desbloqueo camara ${unlocked.id}: ${unlocked.label}.`;
      this.#elements.restart.textContent = 'Siguiente cámara';
    }
    this.#elements.gameover.classList.add('show');
  }

  hideGameOver() {
    this.#elements.gameover.classList.remove('show');
  }
}
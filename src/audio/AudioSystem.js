/**
 * Audio procedural con WebAudio: cero archivos, todo sintetizado.
 * Cumple el contrato AudioContract de contracts.js.
 *
 * El AudioContext se crea perezosamente en resume(), que Game debe llamar en
 * el primer gesto del usuario (click), como exige la politica de autoplay de
 * los navegadores. Sin soporte de WebAudio todos los metodos son no-op.
 *
 * `contextFactory` es inyectable para tests: recibe nada y devuelve un objeto
 * con la API de BaseAudioContext que este sistema usa.
 */

const SHOT_PROFILES = {
  // Frecuencia central, duracion y color del ruido del disparo por arma.
  pistol: { tone: 620, decay: 0.09, noise: 0.05, sweep: 240 },
  ak: { tone: 480, decay: 0.07, noise: 0.06, sweep: 200 },
  knife: { tone: 180, decay: 0.05, noise: 0.02, sweep: 90 },
};

function defaultContextFactory() {
  const Ctor = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctor) return null;
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

export class AudioSystem {
  #factory;
  #context = null;
  #master = null;
  #muted = false;
  /** Duracion por defecto de un buffer de ruido blanco generado bajo demanda. */
  #noiseBuffer = null;

  constructor({ contextFactory = defaultContextFactory } = {}) {
    this.#factory = contextFactory;
  }

  get muted() {
    return this.#muted;
  }

  /**
   * Crea (una sola vez) y desbloquea el AudioContext. Llamar en el primer
   * gesto de usuario. Seguro de llamar antes de tiempo: no lanza.
   */
  resume() {
    const context = this.#ensureContext();
    if (context?.state === 'suspended') {
      // Promise que se ignora a proposito: el navegador la resuelve en el
      // gesto, y un rechazo posterior no debe romper el bucle del juego.
      context.resume()?.catch?.(() => {});
    }
  }

  setMuted(muted) {
    this.#muted = Boolean(muted);
    if (this.#master) {
      this.#master.gain.value = this.#muted ? 0 : 1;
    }
  }

  /** @returns {boolean} el nuevo estado de silencio */
  toggleMute() {
    this.setMuted(!this.#muted);
    return this.#muted;
  }

  /** @param {string} weaponId id de arma en el catalogo ('pistol'|'ak'|'knife') */
  shot(weaponId) {
    const profile = SHOT_PROFILES[weaponId] ?? SHOT_PROFILES.pistol;
    const context = this.#context;
    if (!context) return;
    const now = context.currentTime;

    // Cuerpo tonal con barrido rapido: da el "pum" del disparo.
    const osc = context.createOscillator();
    const oscGain = context.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(profile.tone, now);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, profile.sweep),
      now + profile.decay,
    );
    oscGain.gain.setValueAtTime(0.35, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + profile.decay);
    osc.connect(oscGain).connect(this.#master);
    osc.start(now);
    osc.stop(now + profile.decay);

    // Soplo de ruido: el aire del disparo.
    this.#playNoise(now, profile.noise, 0.22);
  }

  reload() {
    const context = this.#context;
    if (!context) return;
    const now = context.currentTime;
    // Dos clics mecanicos: suelta del cargador y encaje.
    this.#click(now, 900, 0.05);
    this.#click(now + 0.32, 520, 0.07);
  }

  /** Gatillo sin balas: clic seco y agudo. */
  empty() {
    const context = this.#context;
    if (!context) return;
    this.#click(context.currentTime, 1400, 0.03);
  }

  hurt() {
    const context = this.#context;
    if (!context) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.25);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain).connect(this.#master);
    osc.start(now);
    osc.stop(now + 0.25);
    this.#playNoise(now, 0.12, 0.18);
  }

  death() {
    if (!this.#context) return;
    const now = this.#context.currentTime;
    this.#sweepDown(160, 1.1, 0.32);
    this.#playNoise(now, 0.5, 0.2);
  }

  win() {
    const context = this.#context;
    if (!context) return;
    // Tres notas ascendentes: fanfarria corta de victoria.
    const notes = [523.25, 659.25, 783.99];
    const start = context.currentTime;
    notes.forEach((frequency, index) => {
      this.#toneAt(start + index * 0.16, frequency, 0.22, 0.22);
    });
  }

  /** Cae el jefe: barrido grave largo. */
  bossDown() {
    if (!this.#context) return;
    const now = this.#context.currentTime;
    this.#sweepDown(220, 0.9, 0.3);
    this.#playNoise(now, 0.7, 0.25);
  }

  pickup() {
    const context = this.#context;
    if (!context) return;
    const start = context.currentTime;
    this.#toneAt(start, 660, 0.08, 0.18);
    this.#toneAt(start + 0.08, 990, 0.1, 0.18);
  }

  // ---- internos ----

  #ensureContext() {
    if (!this.#context) {
      this.#context = this.#factory();
      if (!this.#context) return null;
      this.#master = this.#context.createGain();
      this.#master.gain.value = this.#muted ? 0 : 1;
      this.#master.connect(this.#context.destination);
    }
    return this.#context;
  }

  /** Oscilador simple con envolvente, conectado al master. */
  #toneAt(when, frequency, duration, volume) {
    const context = this.#context;
    if (!context) return;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'triangle';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    osc.connect(gain).connect(this.#master);
    osc.start(when);
    osc.stop(when + duration);
  }

  /** Barrido descendente con caida de volumen: muertes y derribos. */
  #sweepDown(fromFrequency, duration, volume) {
    const context = this.#context;
    if (!context) return;
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(fromFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain).connect(this.#master);
    osc.start(now);
    osc.stop(now + duration);
  }

  /** Clic mecanico: ruido muy corto con filtro agudo. */
  #click(when, frequency, volume) {
    const context = this.#context;
    if (!context) return;
    const source = context.createBufferSource();
    source.buffer = this.#getNoiseBuffer(context);
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
    source.connect(filter).connect(gain).connect(this.#master);
    source.start(when);
    source.stop(when + 0.06);
  }

  /** Ruido blanco filtrado: alientos de disparo, impactos, derrumbes. */
  #playNoise(when, duration, volume) {
    const context = this.#context;
    if (!context) return;
    const source = context.createBufferSource();
    source.buffer = this.#getNoiseBuffer(context);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, when);
    filter.frequency.exponentialRampToValueAtTime(300, when + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    source.connect(filter).connect(gain).connect(this.#master);
    source.start(when);
    source.stop(when + duration);
  }

  /** Buffer de ruido blanco reutilizable: generarlo por disparo es caro. */
  #getNoiseBuffer(context) {
    if (this.#noiseBuffer) return this.#noiseBuffer;
    const length = Math.floor(context.sampleRate * 0.5);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    this.#noiseBuffer = buffer;
    return buffer;
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioSystem } from '../../src/audio/AudioSystem.js';

/**
 * AudioContext falso con la superficie exacta que usa AudioSystem.
 * Cada nodo creado queda registrado para afirmar que no hay recursos
 * antes de resume() y que cada efecto genera actividad.
 */
function makeFakeContext() {
  const stats = { oscillators: 0, sources: 0, gains: 0, resumes: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime(value) {
      this.value = value;
    },
    exponentialRampToValueAtTime(value) {
      this.value = value;
    },
  });
  const node = () => ({ connect(target) { return target; } });
  const context = {
    state: 'suspended',
    currentTime: 0,
    sampleRate: 48000,
    destination: node(),
    createGain() {
      stats.gains += 1;
      return { ...node(), gain: param() };
    },
    createOscillator() {
      stats.oscillators += 1;
      return { ...node(), type: '', frequency: param(), start() {}, stop() {} };
    },
    createBufferSource() {
      stats.sources += 1;
      return { ...node(), buffer: null, start() {}, stop() {} };
    },
    createBuffer(channels, length, sampleRate) {
      return {
        sampleRate,
        get length() {
          return length;
        },
        getChannelData: () => new Float32Array(length),
      };
    },
    createBiquadFilter() {
      return { ...node(), type: '', frequency: param() };
    },
    resume() {
      stats.resumes += 1;
      this.state = 'running';
      return Promise.resolve();
    },
  };
  return { context, stats };
}

test('sin resume() no se crea contexto ni suena nada', () => {
  let created = 0;
  const audio = new AudioSystem({
    contextFactory: () => {
      created += 1;
      return makeFakeContext().context;
    },
  });

  audio.shot('pistol');
  audio.reload();
  audio.empty();
  audio.hurt();
  audio.death();
  audio.win();
  audio.bossDown();
  audio.pickup();

  assert.equal(created, 0, 'el contexto debe ser perezoso');
});

test('resume() crea el contexto una sola vez y lo desbloquea', () => {
  let created = 0;
  const { context, stats } = makeFakeContext();
  const audio = new AudioSystem({
    contextFactory: () => {
      created += 1;
      return context;
    },
  });

  audio.resume();
  audio.resume();
  assert.equal(created, 1, 'solo debe crear un contexto');
  assert.equal(stats.resumes >= 1, true);
  assert.equal(context.state, 'running');
});

test('cada efecto genera nodos sin lanzar', () => {
  const { context, stats } = makeFakeContext();
  const audio = new AudioSystem({ contextFactory: () => context });
  audio.resume();

  audio.shot('pistol');
  const afterShot = stats.oscillators + stats.sources;
  assert.ok(afterShot > 0, 'el disparo debe crear nodos');

  audio.shot('ak');
  audio.shot('knife');
  audio.reload();
  audio.empty();
  audio.hurt();
  audio.death();
  audio.win();
  audio.bossDown();
  audio.pickup();

  assert.ok(stats.oscillators >= 8, 'los tonos usan osciladores');
  assert.ok(stats.sources >= 4, 'los ruidos usan buffers');
});

test('toggleMute alterna el master gain y devuelve el estado', () => {
  const { context, stats } = makeFakeContext();
  const audio = new AudioSystem({ contextFactory: () => context });
  audio.resume();

  assert.equal(audio.muted, false);
  assert.equal(audio.toggleMute(), true, 'primer toggle silencia');
  assert.equal(audio.muted, true);
  assert.equal(audio.toggleMute(), false, 'segundo toggle restaura');
  assert.equal(audio.muted, false);
  assert.ok(stats.gains >= 1, 'el master gain ya existe');
});

test('setMuted(true) antes de resume se aplica al crear el contexto', () => {
  const { context } = makeFakeContext();
  const audio = new AudioSystem({ contextFactory: () => context });

  audio.setMuted(true);
  audio.resume();
  assert.equal(audio.muted, true);
});

test('sin soporte de Webaudio todos los metodos son no-op', () => {
  const audio = new AudioSystem({ contextFactory: () => null });

  assert.doesNotThrow(() => {
    audio.resume();
    audio.shot('pistol');
    audio.reload();
    audio.empty();
    audio.hurt();
    audio.death();
    audio.win();
    audio.bossDown();
    audio.pickup();
  });
  assert.equal(audio.toggleMute(), true);
  assert.equal(audio.toggleMute(), false);
});

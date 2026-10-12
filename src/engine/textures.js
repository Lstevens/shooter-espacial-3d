import * as THREE from 'three';

/**
 * Texturas procedurales de interior de nave. Se generan una vez en canvas y
 * se comparten: no hay assets ni dependencias externas, y el color de la
 * etapa las tine via material.color sin rehacerlas.
 *
 * La base es casi blanca para que el tinte de la paleta mande; el detalle
 * (juntas, remaches, arañazos) va en grises oscuros.
 */

let floorTexture;
let wallTexture;
let metalTexture;

function createCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function finalize(canvas, repeatX, repeatY = repeatX) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.repeat.set(repeatX, repeatY);
  return texture;
}

function fillBase(ctx, size, value) {
  ctx.fillStyle = `rgb(${value}, ${value}, ${value + 6})`;
  ctx.fillRect(0, 0, size, size);
}

function drawRivet(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#6b7280';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#e6eaf2';
  ctx.fill();
}

function drawScratches(ctx, size, count) {
  ctx.lineWidth = 1;
  for (let i = 0; i < count; i += 1) {
    ctx.strokeStyle = `rgba(40, 46, 56, ${0.05 + Math.random() * 0.12})`;
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
    ctx.stroke();
  }
}

/** Piso: placas metalicas con juntas y remaches en las esquinas. */
export function getFloorTexture(repeatX = 5) {
  if (floorTexture) return floorTexture;
  const size = 512;
  const tiles = 4;
  const cell = size / tiles;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  fillBase(ctx, size, 214);
  for (let y = 0; y < tiles; y += 1) {
    for (let x = 0; x < tiles; x += 1) {
      const shade = 200 + Math.floor(Math.random() * 44);
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 8})`;
      ctx.fillRect(x * cell + 3, y * cell + 3, cell - 6, cell - 6);
    }
  }

  ctx.strokeStyle = '#3f4652';
  ctx.lineWidth = 4;
  for (let i = 0; i <= tiles; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(size, i * cell);
    ctx.stroke();
  }

  for (let y = 0; y <= tiles; y += 1) {
    for (let x = 0; x <= tiles; x += 1) {
      drawRivet(ctx, x * cell, y * cell, 4);
    }
  }

  drawScratches(ctx, size, 60);
  floorTexture = finalize(canvas, repeatX);
  return floorTexture;
}

/** Muro: paneles verticales con bandas, tornillos y una franja de advertencia. */
export function getWallTexture(repeatX = 8, repeatY = repeatX) {
  if (wallTexture) return wallTexture;
  const size = 512;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  fillBase(ctx, size, 208);

  const bands = 4;
  const bandHeight = size / bands;
  for (let i = 0; i < bands; i += 1) {
    const shade = 196 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 6})`;
    ctx.fillRect(0, i * bandHeight + 4, size, bandHeight - 8);
  }

  ctx.strokeStyle = '#39404b';
  ctx.lineWidth = 5;
  for (let i = 0; i <= bands; i += 1) {
    ctx.beginPath();
    ctx.moveTo(0, i * bandHeight);
    ctx.lineTo(size, i * bandHeight);
    ctx.stroke();
  }

  const columns = 2;
  for (let i = 1; i < columns; i += 1) {
    ctx.beginPath();
    ctx.moveTo((size / columns) * i, 0);
    ctx.lineTo((size / columns) * i, size);
    ctx.stroke();
  }

  for (let y = 0; y <= bands; y += 1) {
    for (let x = 0; x <= columns; x += 1) {
      drawRivet(ctx, (size / columns) * x, y * bandHeight, 5);
    }
  }

  const stripeY = bandHeight * 2 + bandHeight * 0.25;
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, stripeY, size, 14);
  ctx.fillStyle = '#20242c';
  for (let x = -20; x < size; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, stripeY + 14);
    ctx.lineTo(x + 14, stripeY);
    ctx.lineTo(x + 28, stripeY);
    ctx.lineTo(x + 14, stripeY + 14);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  drawScratches(ctx, size, 50);
  wallTexture = finalize(canvas, repeatX, repeatY);
  return wallTexture;
}

/** Metal generico para props: placas con juntas suaves y remaches. */
export function getMetalTexture(repeatX = 2) {
  if (metalTexture) return metalTexture;
  const size = 256;
  const canvas = createCanvas(size);
  const ctx = canvas.getContext('2d');

  fillBase(ctx, size, 205);

  ctx.strokeStyle = '#454c58';
  ctx.lineWidth = 3;
  const step = size / 2;
  for (let i = 0; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }

  drawRivet(ctx, 20, 20, 5);
  drawRivet(ctx, size - 20, 20, 5);
  drawRivet(ctx, 20, size - 20, 5);
  drawRivet(ctx, size - 20, size - 20, 5);

  drawScratches(ctx, size, 30);
  metalTexture = finalize(canvas, repeatX);
  return metalTexture;
}

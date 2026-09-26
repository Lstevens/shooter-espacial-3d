import * as THREE from 'three';

function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function tube(radius, length, material) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 16),
    material,
  );
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

/** Cilindro con el eje en X: remaches, pasadores. */
function pin(radius, length, material) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, length, 10),
    material,
  );
  mesh.rotation.z = Math.PI / 2;
  return mesh;
}

/** Arco de torus: guardapocho de la pistola. */
function arc(radius, thickness, arcAngle, material) {
  return new THREE.Mesh(
    new THREE.TorusGeometry(radius, thickness, 6, 16, arcAngle),
    material,
  );
}

/**
 * Coloca la malla. Si no se pasa rx no toca la rotacion que ya traia,
 * para no pisar el giro de tube() o pin().
 */
function place(mesh, x, y, z, rx = null) {
  mesh.position.set(x, y, z);
  if (rx !== null) mesh.rotation.x = rx;
  return mesh;
}

/**
 * Pistola semiautomatica. La corredera se guarda en parts para que el
 * ViewModel la pueda mover al disparar.
 */
function buildPistol(parts) {
  const group = new THREE.Group();
  const polymer = new THREE.MeshStandardMaterial({ color: 0x24262c, roughness: 0.6, metalness: 0.2 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x5a5f6a, metalness: 0.92, roughness: 0.24 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1c21, metalness: 0.8, roughness: 0.4 });
  const dot = new THREE.MeshStandardMaterial({ color: 0x7dffb0, emissive: 0x2f8f5f, roughness: 0.35 });

  group.add(place(box(0.048, 0.085, 0.3, polymer), 0, -0.02, -0.02));
  group.add(place(tube(0.0125, 0.06, steel), 0, 0.02, -0.225));
  group.add(place(tube(0.0072, 0.03, dark), 0, 0.02, -0.248));

  const slide = new THREE.Group();
  slide.position.set(0, 0.05, -0.05);
  slide.add(box(0.05, 0.072, 0.34, steel));
  for (let i = 0; i < 5; i += 1) {
    slide.add(place(box(0.052, 0.048, 0.007, dark), 0, 0.002, 0.1 + i * 0.012));
  }
  for (let i = 0; i < 3; i += 1) {
    slide.add(place(box(0.052, 0.044, 0.007, dark), 0, 0.002, -0.13 - i * 0.012));
  }
  slide.add(place(box(0.01, 0.03, 0.055, dark), 0.026, 0.008, 0.02));
  slide.add(place(box(0.01, 0.012, 0.07, dark), 0.026, 0.03, -0.06));
  slide.add(place(box(0.01, 0.018, 0.024, steel), 0, 0.045, -0.15));
  slide.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 6), dot), 0, 0.045, -0.163));
  for (const x of [-0.015, 0.015]) {
    slide.add(place(box(0.011, 0.016, 0.022, steel), x, 0.045, 0.15));
  }
  group.add(slide);
  parts.pistolSlide = slide;

  group.add(place(box(0.03, 0.008, 0.1, dark), 0, -0.062, -0.11));
  for (const z of [-0.07, -0.15]) {
    group.add(place(box(0.034, 0.006, 0.01, dark), 0, -0.064, z));
  }
  group.add(place(arc(0.026, 0.005, Math.PI, steel), 0, -0.07, -0.01, -Math.PI / 2));
  group.add(place(box(0.008, 0.028, 0.01, dark), 0, -0.05, -0.012, -0.2));
  group.add(place(box(0.008, 0.01, 0.055, steel), -0.027, 0.03, 0));
  group.add(place(box(0.01, 0.022, 0.016, steel), 0, 0.005, 0.125, 0.3));

  const grip = new THREE.Group();
  grip.position.set(0, -0.1, 0.045);
  grip.rotation.x = -0.3;
  grip.add(place(box(0.046, 0.165, 0.072, polymer), 0, -0.082, 0));
  grip.add(place(box(0.048, 0.17, 0.014, polymer), 0, -0.082, 0.042));
  grip.add(place(box(0.046, 0.17, 0.012, polymer), 0, -0.082, -0.04));
  for (const x of [-0.025, 0.025]) {
    grip.add(place(box(0.008, 0.12, 0.056, dark), x, -0.075, 0.002));
    for (let i = 0; i < 3; i += 1) {
      grip.add(place(box(0.01, 0.009, 0.05, dark), x * 1.08, -0.03 - i * 0.028, 0.002));
    }
  }
  grip.add(place(box(0.05, 0.012, 0.078, dark), 0, -0.17, 0.004));
  grip.add(place(box(0.042, 0.008, 0.05, steel), 0, -0.179, 0.008));
  group.add(grip);

  return group;
}

function buildAk() {
  const group = new THREE.Group();

  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2b, roughness: 0.78 });
  const blued = new THREE.MeshStandardMaterial({ color: 0x1c1c20, metalness: 0.9, roughness: 0.3 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x4a4a52, metalness: 0.95, roughness: 0.22 });
  const poly = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.5, metalness: 0.2 });

  group.add(place(box(0.075, 0.1, 0.4, blued), 0, 0, 0.02));

  group.add(place(box(0.072, 0.075, 0.26, wood), 0, 0.005, -0.31));
  group.add(place(box(0.072, 0.055, 0.26, wood), 0, -0.055, -0.31));
  for (const z of [-0.24, -0.31, -0.38]) {
    group.add(place(box(0.076, 0.014, 0.022, blued), 0, -0.055, z));
  }

  group.add(place(tube(0.018, 0.3, blued), 0, 0.075, -0.3));
  group.add(place(box(0.032, 0.03, 0.045, blued), 0, 0.086, -0.17));
  group.add(place(box(0.03, 0.05, 0.05, blued), 0, 0.045, -0.44));
  group.add(place(box(0.012, 0.036, 0.014, blued), 0, 0.075, -0.46));
  for (const x of [-0.015, 0.015]) {
    group.add(place(box(0.01, 0.02, 0.05, blued), x, 0.085, -0.475));
  }

  group.add(place(tube(0.013, 0.28, steel), 0, 0, -0.54));
  group.add(place(tube(0.021, 0.07, steel), 0, 0, -0.7));
  group.add(place(box(0.046, 0.012, 0.02, blued), 0, 0, -0.7));

  group.add(place(box(0.055, 0.1, 0.075, poly), 0, -0.1, -0.08, 0.18));
  group.add(place(box(0.05, 0.09, 0.07, poly), 0, -0.2, -0.04, 0.4));
  group.add(place(box(0.045, 0.07, 0.06, poly), 0, -0.28, 0.01, 0.62));

  group.add(place(box(0.045, 0.01, 0.075, blued), 0, -0.058, 0.1));
  group.add(place(box(0.012, 0.032, 0.012, steel), 0, -0.045, 0.095));
  group.add(place(box(0.045, 0.13, 0.06, poly), 0, -0.11, 0.17, -0.35));

  group.add(place(box(0.04, 0.045, 0.12, blued), 0, -0.01, 0.27));
  group.add(place(box(0.07, 0.1, 0.12, wood), 0, -0.015, 0.36));

  return group;
}

/**
 * Perfil de la hoja: se dibuja en el plano XY (x hacia la punta, y el ancho
 * del filo) y se extruye en grosor. El bisel da el filo real y ademas deja
 * el segundo material (index 1) en las caras laterales.
 */
function bladeGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.019);
  shape.lineTo(-0.1, 0.02);
  shape.lineTo(-0.21, 0.016);
  shape.lineTo(-0.3, 0.003);
  shape.lineTo(-0.315, -0.007);
  shape.lineTo(-0.25, -0.016);
  shape.lineTo(-0.11, -0.018);
  shape.lineTo(0, -0.017);
  shape.closePath();

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.004,
    bevelEnabled: true,
    bevelThickness: 0.0018,
    bevelSize: 0.0016,
    bevelSegments: 2,
    curveSegments: 1,
  });
  geometry.rotateY(-Math.PI / 2);
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  geometry.translate(-(min.x + max.x) / 2, 0, 0);
  return geometry;
}

function buildKnife() {
  const group = new THREE.Group();
  const flat = new THREE.MeshStandardMaterial({ color: 0x9aa0ac, metalness: 0.9, roughness: 0.34 });
  const edge = new THREE.MeshStandardMaterial({ color: 0xdfe4ee, metalness: 0.98, roughness: 0.1 });
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 0.72 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x6a6f7a, metalness: 0.95, roughness: 0.22 });
  const groove = new THREE.MeshStandardMaterial({ color: 0x5c6270, metalness: 0.85, roughness: 0.4 });

  group.add(new THREE.Mesh(bladeGeometry(), [flat, edge]));

  for (const x of [-0.0046, 0.0046]) {
    group.add(place(box(0.0016, 0.009, 0.19, groove), x, 0.002, -0.15));
  }

  group.add(place(box(0.052, 0.02, 0.018, steel), 0, 0, 0.008));
  group.add(place(box(0.026, 0.044, 0.115, gripMat), 0, 0, 0.075));
  for (const z of [0.035, 0.105]) {
    group.add(place(pin(0.005, 0.03, steel), 0, 0, z));
  }
  for (const z of [0.045, 0.075, 0.105]) {
    group.add(place(box(0.03, 0.008, 0.006, steel), 0, 0.024, z));
  }
  group.add(place(box(0.028, 0.046, 0.016, steel), 0, 0, 0.138));

  return group;
}

function createFlashTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  gradient.addColorStop(0, 'rgba(255,255,210,1)');
  gradient.addColorStop(0.4, 'rgba(255,200,80,0.8)');
  gradient.addColorStop(1, 'rgba(255,120,20,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

export function createWeaponModels() {
  const parts = {};
  const models = {
    pistol: buildPistol(parts),
    ak: buildAk(),
    knife: buildKnife(),
  };
  return { models, parts };
}

export function createMuzzleFlash() {
  const flash = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createFlashTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  flash.position.set(0, 0.1, -0.85);
  flash.scale.setScalar(0.5);
  flash.visible = false;
  return flash;
}

/** Estela de tajo del cuchillo: se dibuja delante de la camara. */
export function createSlashArc() {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.014, 3, 28, Math.PI * 0.85),
    new THREE.MeshBasicMaterial({
      color: 0xcfe6ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  mesh.position.set(0, -0.05, -1.1);
  mesh.rotation.set(-0.5, 0, 0.6);
  mesh.visible = false;
  return mesh;
}

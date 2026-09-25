import * as THREE from 'three';

const BODY_PARTS = [
  { size: [0.16, 0.5, 0.16], at: [-0.18, 0.25, 0] },
  { size: [0.16, 0.5, 0.16], at: [0.18, 0.25, 0] },
  { size: [0.46, 0.6, 0.28], at: [0, 0.9, 0] },
  { size: [0.13, 0.5, 0.13], at: [-0.33, 0.9, 0] },
  { size: [0.13, 0.5, 0.13], at: [0.33, 0.9, 0] },
  { size: [0.3, 0.3, 0.3], at: [0, 1.42, 0] },
];

/**
 * Construye la malla de un enemigo y la registra en userData.entity
 * para que el raycast pueda resolverla.
 */
export function createMobMesh(variant) {
  const material = new THREE.MeshStandardMaterial({
    color: variant.color,
    emissive: 0x000000,
    roughness: 0.6,
  });
  const group = new THREE.Group();
  for (const part of BODY_PARTS) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...part.size), material);
    mesh.position.set(...part.at);
    group.add(mesh);
  }
  group.scale.setScalar(variant.scale);
  return { group, material };
}

export function registerEntity(group, entity) {
  group.traverse((object) => {
    if (object.isMesh) object.userData.entity = entity;
  });
}

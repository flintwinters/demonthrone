import * as THREE from "three";
import { colors, foliageColors } from "./constants.js";
import { material } from "./render-materials.js";
import type { BiomeKind, Tile } from "./types.js";

export type PropPlacement = {
  tile: Tile;
  height: number;
};

const brushGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-0.32, 0, 0.02),
  new THREE.Vector3(0.32, 0, 0.02),
  new THREE.Vector3(0, 0, 0.62),
]);
const boulderGeometry = new THREE.DodecahedronGeometry(0.34, 0);
const brushMaterials = new Map<BiomeKind, THREE.MeshBasicMaterial>();
const transform = new THREE.Object3D();

brushGeometry.userData.shared = true;
boulderGeometry.userData.shared = true;

export function boulders(placements: readonly PropPlacement[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(boulderGeometry, material(colors.boulder), placements.length);

  placements.forEach((placement, index) => {
    setBoulderTransform(mesh, placement, index);
  });
  return mesh;
}

export function brushPatch(biome: BiomeKind, placements: readonly PropPlacement[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(brushGeometry, brushMaterial(biome), placements.length * 2);

  placements.forEach((placement, index) => {
    setBrushTransform(mesh, placement, index * 2, 0);
    setBrushTransform(mesh, placement, index * 2 + 1, Math.PI / 2);
  });
  return mesh;
}

function setBoulderTransform(mesh: THREE.InstancedMesh, placement: PropPlacement, index: number): void {
  const { tile, height } = placement;

  transform.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
  transform.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
  transform.updateMatrix();
  mesh.setMatrixAt(index, transform.matrix);
}

function setBrushTransform(
  mesh: THREE.InstancedMesh,
  placement: PropPlacement,
  index: number,
  rotation: number,
): void {
  const { tile, height } = placement;

  transform.position.set(tile.x + 0.5, tile.y + 0.5, height);
  transform.rotation.set(0, 0, rotation);
  transform.updateMatrix();
  mesh.setMatrixAt(index, transform.matrix);
}

function brushMaterial(biome: BiomeKind): THREE.MeshBasicMaterial {
  const existing = brushMaterials.get(biome);

  if (existing) {
    return existing;
  }

  const created = new THREE.MeshBasicMaterial({
    color: foliageColors[biome],
    side: THREE.DoubleSide,
  });

  brushMaterials.set(biome, created);
  return created;
}

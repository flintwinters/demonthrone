import * as THREE from "three";
import { colors, foliageColors } from "./constants.js";
import { material } from "./render-materials.js";
import type { BiomeKind, Tile } from "./types.js";

const brushGeometry = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-0.32, -0.08, 0.02),
  new THREE.Vector3(0.32, -0.08, 0.02),
  new THREE.Vector3(0, 0.28, 0.02),
]);
const brushMaterials = new Map<BiomeKind, THREE.MeshBasicMaterial>();

export function boulder(tile: Tile, height: number): THREE.Mesh {
  const geometry = new THREE.DodecahedronGeometry(0.34, 0);
  const mesh = new THREE.Mesh(geometry, material(colors.boulder));

  mesh.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
  mesh.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
  return mesh;
}

export function brush(tile: Tile, height: number, biome: BiomeKind): THREE.Group {
  const group = new THREE.Group();

  group.position.set(tile.x + 0.5, tile.y + 0.5, height);
  group.add(brushTriangle(0, biome));
  group.add(brushTriangle(Math.PI / 2, biome));
  return group;
}

function brushTriangle(rotation: number, biome: BiomeKind): THREE.Mesh {
  const mesh = new THREE.Mesh(brushGeometry, brushMaterial(biome));

  mesh.rotation.z = rotation;
  return mesh;
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

import * as THREE from "three";
import { colors } from "./constants.js";
import { material } from "./render-materials.js";
import type { Tile } from "./types.js";

export function boulder(tile: Tile, height: number): THREE.Mesh {
  const geometry = new THREE.DodecahedronGeometry(0.34, 0);
  const mesh = new THREE.Mesh(geometry, material(colors.boulder));

  mesh.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
  mesh.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
  return mesh;
}

export function brush(tile: Tile, height: number): THREE.Group {
  const group = new THREE.Group();

  group.position.set(tile.x + 0.5, tile.y + 0.5, height);
  group.add(brushStem(-0.18, -0.03, 0.28, colors.brushDark));
  group.add(brushStem(0.02, 0.08, 0.34, colors.brush));
  group.add(brushStem(0.17, -0.08, 0.24, colors.brushDark));
  return group;
}

function brushStem(x: number, y: number, height: number, color: string): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, height, 5), material(color));

  mesh.position.set(x, y, height / 2);
  return mesh;
}

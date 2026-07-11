import * as THREE from "three";
import { terrainHeight } from "./constants.js";
import { healthLabel } from "./health-label.js";
import { material, transparentMaterial } from "./render-materials.js";
import type { HeightTile, RenderEnemy, RenderPiece, RenderUnit } from "./types.js";

const unitGeometry = new THREE.SphereGeometry(0.24, 16, 10);
const enemyGeometry = new THREE.ConeGeometry(0.24, 0.5, 5);

unitGeometry.userData.shared = true;
enemyGeometry.userData.shared = true;

export function unitObjects(unit: RenderUnit): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [
    unitMeshAt(unit, unit, 1),
    healthLabel(unit, unit.health, 0.78),
  ];

  if (unit.target) {
    objects.push(unitMeshAt(unit, unit.target, 0.42));
  }

  return objects;
}

export function enemyObjects(enemy: RenderEnemy): THREE.Object3D[] {
  const mesh = new THREE.Mesh(enemyGeometry, material(enemy.color));

  mesh.position.set(enemy.x + 0.5, enemy.y + 0.5, visualHeight(enemy.height) + 0.25);
  mesh.rotation.x = Math.PI / 2;
  return [mesh, healthLabel(enemy, enemy.health, 0.72)];
}

function unitMeshAt(unit: RenderPiece, tile: HeightTile, opacity: number): THREE.Mesh {
  const unitMaterial = opacity < 1 ? transparentMaterial(unit.color, opacity) : material(unit.color);
  const mesh = new THREE.Mesh(unitGeometry, unitMaterial);

  mesh.position.set(tile.x + 0.5, tile.y + 0.5, visualHeight(tile.height) + 0.38);
  return mesh;
}

function visualHeight(height: number): number {
  return height * terrainHeight.visualScale;
}

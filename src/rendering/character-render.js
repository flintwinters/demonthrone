import * as THREE from "three";
import { terrainHeight } from "../constants.js";
import { enemyConfigs } from "../world-config.js";
import { healthLabel } from "./health-label.js";
import { material, transparentMaterial } from "./render-materials.js";
const unitGeometry = new THREE.SphereGeometry(0.24, 16, 10);
const enemyShapes = new Map(enemyConfigs.map((config) => [
    config.type,
    {
        geometry: enemyGeometry(config.appearance),
        centerHeight: config.appearance.height / 2,
        labelHeight: config.appearance.labelHeight,
    },
]));
unitGeometry.userData.shared = true;
for (const shape of enemyShapes.values())
    shape.geometry.userData.shared = true;
export function unitObjects(unit) {
    const objects = [
        unitMeshAt(unit, unit, 1),
        healthLabel(unit, unit.health, 0.78),
    ];
    if (unit.target)
        objects.push(unitMeshAt(unit, unit.target, 0.42));
    return objects;
}
export function enemyObjects(enemy) {
    const shape = enemyShapes.get(enemy.entityType);
    if (!shape)
        throw new Error(`Missing enemy shape: ${enemy.entityType}`);
    const mesh = new THREE.Mesh(shape.geometry, material(enemy.color));
    mesh.position.set(enemy.x + 0.5, enemy.y + 0.5, visualHeight(enemy.height) + shape.centerHeight);
    mesh.rotation.x = Math.PI / 2;
    return [mesh, healthLabel(enemy, enemy.health, shape.labelHeight)];
}
function enemyGeometry(appearance) {
    return appearance.shape === "cone"
        ? new THREE.ConeGeometry(appearance.radius, appearance.height, 5)
        : new THREE.CylinderGeometry(appearance.radius, appearance.radius, appearance.height, 10);
}
function unitMeshAt(unit, tile, opacity) {
    const unitMaterial = opacity < 1 ? transparentMaterial(unit.color, opacity) : material(unit.color);
    const mesh = new THREE.Mesh(unitGeometry, unitMaterial);
    mesh.position.set(tile.x + 0.5, tile.y + 0.5, visualHeight(tile.height) + 0.38);
    return mesh;
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}

import * as THREE from "three";
import { colors } from "./constants.js";
const materials = new Map();
const terrainMaterials = new Map();
export const edgeMaterial = new THREE.LineBasicMaterial({
    color: colors.tileEdge,
    transparent: true,
    opacity: 0.38,
});
export function material(color) {
    const existing = materials.get(color);
    if (existing) {
        return existing;
    }
    const created = new THREE.MeshLambertMaterial({ color });
    materials.set(color, created);
    return created;
}
export function terrainMaterial(color) {
    const existing = terrainMaterials.get(color);
    if (existing) {
        return existing;
    }
    const created = new THREE.MeshLambertMaterial({
        color,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    });
    terrainMaterials.set(color, created);
    return created;
}

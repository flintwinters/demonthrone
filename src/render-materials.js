import * as THREE from "three";
import { colors } from "./constants.js";
const materials = new Map();
const transparentMaterials = new Map();
const terrainMaterials = new Map();
const lineMaterials = new Map();
export const edgeMaterial = new THREE.LineBasicMaterial({
    color: colors.tileEdge,
    transparent: true,
    opacity: 0.38,
});
export const selectedOutlineMaterial = new THREE.LineBasicMaterial({
    color: colors.selectedTileOutline,
    transparent: false,
    depthTest: false,
    depthWrite: false,
});
export function lineMaterial(color) {
    const existing = lineMaterials.get(color);
    if (existing) {
        return existing;
    }
    const created = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.98,
        depthTest: false,
        depthWrite: false,
    });
    lineMaterials.set(color, created);
    return created;
}
export function material(color) {
    const existing = materials.get(color);
    if (existing) {
        return existing;
    }
    const created = new THREE.MeshLambertMaterial({ color });
    materials.set(color, created);
    return created;
}
export function transparentMaterial(color, opacity) {
    const key = `${color}:${opacity}`;
    const existing = transparentMaterials.get(key);
    if (existing) {
        return existing;
    }
    const created = new THREE.MeshLambertMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
    });
    transparentMaterials.set(key, created);
    return created;
}
export function terrainMaterial(color) {
    const key = typeof color === "string" ? color : "vertex-colors";
    const existing = terrainMaterials.get(key);
    if (existing) {
        return existing;
    }
    const created = new THREE.MeshLambertMaterial({
        color: typeof color === "string" ? color : "#ffffff",
        vertexColors: typeof color !== "string",
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    });
    terrainMaterials.set(key, created);
    return created;
}

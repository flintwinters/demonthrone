import * as THREE from "three";
import { colors, foliageColors } from "./constants.js";
import { material } from "./render-materials.js";
const brushGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.32, -0.08, 0.02),
    new THREE.Vector3(0.32, -0.08, 0.02),
    new THREE.Vector3(0, 0.28, 0.02),
]);
const boulderGeometry = new THREE.DodecahedronGeometry(0.34, 0);
const brushMaterials = new Map();
brushGeometry.userData.shared = true;
boulderGeometry.userData.shared = true;
export function boulder(tile, height) {
    const mesh = new THREE.Mesh(boulderGeometry, material(colors.boulder));
    mesh.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
    mesh.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
    return mesh;
}
export function brush(tile, height, biome) {
    const group = new THREE.Group();
    group.position.set(tile.x + 0.5, tile.y + 0.5, height);
    group.add(brushTriangle(0, biome));
    group.add(brushTriangle(Math.PI / 2, biome));
    return group;
}
function brushTriangle(rotation, biome) {
    const mesh = new THREE.Mesh(brushGeometry, brushMaterial(biome));
    mesh.rotation.z = rotation;
    return mesh;
}
function brushMaterial(biome) {
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

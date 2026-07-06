import * as THREE from "three";
import { colors } from "./constants.js";
import { material } from "./render-materials.js";
const brushGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-0.28, 0, 0),
    new THREE.Vector3(0.28, 0, 0),
    new THREE.Vector3(0, 0, 0.42),
]);
const brushMaterial = new THREE.MeshBasicMaterial({
    color: colors.brush,
    side: THREE.DoubleSide,
});
export function boulder(tile, height) {
    const geometry = new THREE.DodecahedronGeometry(0.34, 0);
    const mesh = new THREE.Mesh(geometry, material(colors.boulder));
    mesh.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
    mesh.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
    return mesh;
}
export function brush(tile, height) {
    const group = new THREE.Group();
    group.position.set(tile.x + 0.5, tile.y + 0.5, height);
    group.add(brushTriangle(0));
    group.add(brushTriangle(Math.PI / 2));
    return group;
}
function brushTriangle(rotation) {
    const mesh = new THREE.Mesh(brushGeometry, brushMaterial);
    mesh.rotation.z = rotation;
    return mesh;
}

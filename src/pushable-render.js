import * as THREE from "three";
import { colors, terrainHeight } from "./constants.js";
import { material, transparentMaterial } from "./render-materials.js";
const geometry = new THREE.BoxGeometry(0.56, 0.56, 0.56);
geometry.userData.shared = true;
export function pushableMeshes(pushable) {
    const meshes = [pushableMesh(pushable, pushable, 1)];
    if (pushable.target) {
        meshes.push(pushableMesh(pushable, pushable.target, 0.42));
    }
    return meshes;
}
function pushableMesh(pushable, tile, opacity) {
    const mesh = new THREE.Mesh(geometry, crateMaterial(opacity));
    mesh.position.set(tile.x + 0.5, tile.y + 0.5, tile.height * terrainHeight.visualScale + 0.28);
    mesh.rotation.z = (pushable.id.length % 4) * Math.PI / 16;
    return mesh;
}
function crateMaterial(opacity) {
    return opacity < 1 ? transparentMaterial(colors.pushable, opacity) : material(colors.pushable);
}

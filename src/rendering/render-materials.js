import * as THREE from "three";
import { colors } from "../constants.js";
const materials = new Map();
const transparentMaterials = new Map();
const terrainMaterials = new Map();
const lineMaterials = new Map();
const edgeMaterials = new Map();
let brickTexture = null;
export const edgeMaterial = terrainEdgeMaterial(colors.tileEdge);
export const selectedOutlineMaterial = new THREE.LineBasicMaterial({
    color: colors.selectedTileOutline,
    transparent: true,
    opacity: 0.95,
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
export function terrainEdgeMaterial(color) {
    const existing = edgeMaterials.get(color);
    if (existing) {
        return existing;
    }
    const created = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.42,
    });
    edgeMaterials.set(color, created);
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
export function terrainMaterial(color, pattern) {
    const key = `${pattern ?? "plain"}:${typeof color === "string" ? color : "vertex-colors"}`;
    const existing = terrainMaterials.get(key);
    if (existing) {
        return existing;
    }
    const created = new THREE.MeshLambertMaterial({
        color: typeof color === "string" ? color : "#ffffff",
        vertexColors: typeof color !== "string",
        map: pattern === "brick" ? wallBrickTexture() : null,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
    });
    terrainMaterials.set(key, created);
    return created;
}
export function wallBrickTexture() {
    if (brickTexture)
        return brickTexture;
    const width = 32;
    const height = 16;
    const pixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const shade = brickShade(x, y);
            const offset = (y * width + x) * 4;
            pixels.set([shade, shade, shade, 255], offset);
        }
    }
    const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
    texture.name = "wall-brick-pattern";
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestMipmapNearestFilter;
    texture.needsUpdate = true;
    brickTexture = texture;
    return texture;
}
function brickShade(x, y) {
    const course = Math.floor(y / 8);
    const jointOffset = course % 2 === 0 ? 0 : 8;
    const isBedJoint = y % 8 === 0;
    const isHeadJoint = (x - jointOffset + 32) % 16 <= 1;
    if (isBedJoint || isHeadJoint)
        return 96;
    return 176 + ((x + y * 3) % 5) * 14;
}

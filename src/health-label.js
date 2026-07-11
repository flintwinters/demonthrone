import * as THREE from "three";
import { colors, terrainHeight } from "./constants.js";
const textureSize = 64;
const labelScale = 0.34;
const materials = new Map();
export function healthLabel(tile, health, heightOffset) {
    const sprite = new THREE.Sprite(healthMaterial(health));
    sprite.position.set(tile.x + 0.5, tile.y + 0.5, tile.height * terrainHeight.visualScale + heightOffset);
    sprite.scale.set(labelScale, labelScale, 1);
    return sprite;
}
function healthMaterial(health) {
    const existing = materials.get(health);
    if (existing) {
        return existing;
    }
    const texture = healthTexture(health);
    const created = new THREE.SpriteMaterial({
        map: texture,
        depthTest: false,
        transparent: true,
    });
    materials.set(health, created);
    return created;
}
function healthTexture(health) {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = textureSize;
    canvas.height = textureSize;
    if (!context) {
        throw new Error("Unable to create health label canvas context.");
    }
    context.fillStyle = colors.health;
    context.font = "700 42px ui-sans-serif, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(String(health), textureSize / 2, textureSize / 2);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    return texture;
}

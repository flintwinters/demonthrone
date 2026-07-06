import * as THREE from "three";
import { colors } from "./constants.js";

const materials: Map<string, THREE.MeshLambertMaterial> = new Map();
const transparentMaterials: Map<string, THREE.MeshLambertMaterial> = new Map();
const terrainMaterials: Map<string, THREE.MeshLambertMaterial> = new Map();
const spriteMaterials: Map<number, THREE.MeshBasicMaterial> = new Map();

export const edgeMaterial = new THREE.LineBasicMaterial({
  color: colors.tileEdge,
  transparent: true,
  opacity: 0.38,
});

export function material(color: string): THREE.MeshLambertMaterial {
  const existing = materials.get(color);

  if (existing) {
    return existing;
  }

  const created = new THREE.MeshLambertMaterial({ color });

  materials.set(color, created);
  return created;
}

export function transparentMaterial(color: string, opacity: number): THREE.MeshLambertMaterial {
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

export function terrainMaterial(color: string | readonly string[]): THREE.MeshLambertMaterial {
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

export function spriteMaterial(texture: THREE.Texture): THREE.MeshBasicMaterial {
  const existing = spriteMaterials.get(texture.id);

  if (existing) {
    return existing;
  }

  const created = new THREE.MeshBasicMaterial({
    map: texture,
    alphaTest: 0.5,
    side: THREE.DoubleSide,
    transparent: true,
  });

  spriteMaterials.set(texture.id, created);
  return created;
}

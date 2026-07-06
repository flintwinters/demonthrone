import * as THREE from "three";
import { colors } from "./constants.js";
import { material, spriteMaterial } from "./render-materials.js";
import type { Tile } from "./types.js";

const brushCardGeometry = new THREE.PlaneGeometry(0.7, 0.46);
let cachedBrushTexture: THREE.CanvasTexture | null = null;

export function boulder(tile: Tile, height: number): THREE.Mesh {
  const geometry = new THREE.DodecahedronGeometry(0.34, 0);
  const mesh = new THREE.Mesh(geometry, material(colors.boulder));

  mesh.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
  mesh.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
  return mesh;
}

export function brush(tile: Tile, height: number): THREE.Group {
  const group = new THREE.Group();

  group.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.23);
  group.add(brushCard(0));
  group.add(brushCard(Math.PI / 2));
  return group;
}

function brushCard(rotation: number): THREE.Mesh {
  const mesh = new THREE.Mesh(brushCardGeometry, spriteMaterial(brushTexture()));

  mesh.rotation.set(Math.PI / 2, 0, rotation);
  return mesh;
}

function brushTexture(): THREE.CanvasTexture {
  if (cachedBrushTexture) {
    return cachedBrushTexture;
  }

  const canvas = document.createElement("canvas");
  const context = requiredContext(canvas);

  canvas.width = 64;
  canvas.height = 48;
  context.fillStyle = colors.brushDark;
  context.fillRect(14, 20, 10, 22);
  context.fillRect(40, 16, 9, 26);
  context.fillStyle = colors.brush;
  context.fillRect(24, 10, 16, 34);
  context.fillRect(8, 28, 48, 12);

  const texture = new THREE.CanvasTexture(canvas);

  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  cachedBrushTexture = texture;
  return texture;
}

function requiredContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("2D canvas context is required for brush sprites.");
  }

  return context;
}

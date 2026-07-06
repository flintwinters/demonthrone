import * as THREE from "three";
import {
  cameraDistance,
  cameraElevation,
  terrainHeight,
  worldPixelsPerUnit,
  zoomLimits,
} from "./constants.js";
import type { ScreenPoint, Tile, TileHeight, ViewportSize } from "./types.js";

type ScreenRay = {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
};

export const view: {
  targetX: number;
  targetY: number;
  zoom: number;
  rotation: number;
} = {
  targetX: 6.5,
  targetY: 6.5,
  zoom: 1,
  rotation: -Math.PI / 4,
};

const worldUp = new THREE.Vector3(0, 0, 1);

export function createViewCamera(): THREE.OrthographicCamera {
  return new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, cameraDistance * 3);
}

export function configureViewCamera(canvas: HTMLCanvasElement, camera: THREE.OrthographicCamera): void {
  const viewport = viewportSize(canvas);
  const halfWidth = viewport.width / (worldPixelsPerUnit * view.zoom * 2);
  const halfHeight = viewport.height / (worldPixelsPerUnit * view.zoom * 2);
  const target = cameraTarget();
  const forward = cameraForward();

  camera.left = -halfWidth;
  camera.right = halfWidth;
  camera.top = halfHeight;
  camera.bottom = -halfHeight;
  camera.position.copy(target).sub(forward.multiplyScalar(cameraDistance));
  camera.up.copy(cameraUp());
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
}

export function viewportSize(canvas: HTMLCanvasElement): ViewportSize {
  return {
    width: canvas.width / devicePixelRatio(),
    height: canvas.height / devicePixelRatio(),
  };
}

export function viewportCenter(canvas: HTMLCanvasElement): ScreenPoint {
  const viewport = viewportSize(canvas);

  return {
    x: viewport.width / 2,
    y: viewport.height / 2,
  };
}

export function gridFromScreen(
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
  heightAt: TileHeight | null = null,
): Tile {
  const point = heightAt
    ? topGridPointFromScreen(canvas, screenX, screenY, heightAt)
    : worldPointAtHeight(canvas, screenX, screenY, 0);

  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y),
  };
}

export function panBy(canvas: HTMLCanvasElement, dx: number, dy: number): void {
  const center = viewportCenter(canvas);
  const before = worldPointAtHeight(canvas, center.x, center.y, 0);
  const after = worldPointAtHeight(canvas, center.x - dx, center.y - dy, 0);

  view.targetX += before.x - after.x;
  view.targetY += before.y - after.y;
}

export function zoomAt(canvas: HTMLCanvasElement, screenX: number, screenY: number, nextZoom: number): void {
  const zoom = clamp(nextZoom, zoomLimits.min, zoomLimits.max);
  const before = worldPointAtHeight(canvas, screenX, screenY, 0);

  view.zoom = zoom;
  anchorView(canvas, screenX, screenY, before);
}

export function rotateAt(
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
  nextRotation: number,
): void {
  const before = worldPointAtHeight(canvas, screenX, screenY, 0);

  view.rotation = normalizeRotation(nextRotation);
  anchorView(canvas, screenX, screenY, before);
}

export function devicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

export function screenFromGrid(canvas: HTMLCanvasElement, x: number, y: number, z = 0): ScreenPoint {
  return projectWorldPoint(canvas, new THREE.Vector3(x, y, z));
}

export function worldFromGrid(canvas: HTMLCanvasElement, x: number, y: number, z = 0): ScreenPoint {
  return screenFromGrid(canvas, x, y, z);
}

export function screenFromWorld(world: ScreenPoint): ScreenPoint {
  return {
    x: world.x,
    y: world.y,
  };
}

function topGridPointFromScreen(
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
  heightAt: TileHeight,
): THREE.Vector3 {
  for (let z = terrainHeight.max; z >= terrainHeight.min; z -= 1) {
    const point = worldPointAtHeight(canvas, screenX, screenY, z);
    const tile = { x: Math.floor(point.x), y: Math.floor(point.y) };

    if (heightAt(tile) === z) {
      return point;
    }
  }

  return worldPointAtHeight(canvas, screenX, screenY, terrainHeight.min);
}

function worldPointAtHeight(
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
  height: number,
): THREE.Vector3 {
  const ray = screenRay(canvas, screenX, screenY);
  const distance = (height - ray.origin.z) / ray.direction.z;

  return ray.origin.clone().add(ray.direction.multiplyScalar(distance));
}

function anchorView(canvas: HTMLCanvasElement, screenX: number, screenY: number, before: THREE.Vector3): void {
  const after = worldPointAtHeight(canvas, screenX, screenY, 0);

  view.targetX += before.x - after.x;
  view.targetY += before.y - after.y;
}

function screenRay(canvas: HTMLCanvasElement, screenX: number, screenY: number): ScreenRay {
  const viewport = viewportSize(canvas);
  const camera = createViewCamera();
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const pointer = new THREE.Vector2(
    screenX / viewport.width * 2 - 1,
    -(screenY / viewport.height) * 2 + 1,
  );

  configureViewCamera(canvas, camera);
  origin.set(pointer.x, pointer.y, -1).unproject(camera);
  direction.set(pointer.x, pointer.y, 1).unproject(camera).sub(origin).normalize();

  return { origin, direction };
}

function projectWorldPoint(canvas: HTMLCanvasElement, point: THREE.Vector3): ScreenPoint {
  const viewport = viewportSize(canvas);
  const camera = createViewCamera();
  const projected = point.clone();

  configureViewCamera(canvas, camera);
  projected.project(camera);

  return {
    x: (projected.x + 1) * viewport.width / 2,
    y: (1 - projected.y) * viewport.height / 2,
  };
}

function cameraTarget(): THREE.Vector3 {
  return new THREE.Vector3(view.targetX, view.targetY, 0);
}

function cameraForward(): THREE.Vector3 {
  return new THREE.Vector3(
    Math.cos(view.rotation) * Math.cos(cameraElevation),
    Math.sin(view.rotation) * Math.cos(cameraElevation),
    -Math.sin(cameraElevation),
  ).normalize();
}

function cameraUp(): THREE.Vector3 {
  const forward = cameraForward();
  const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();

  return new THREE.Vector3().crossVectors(right, forward).normalize();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeRotation(rotation: number): number {
  return Math.atan2(Math.sin(rotation), Math.cos(rotation));
}

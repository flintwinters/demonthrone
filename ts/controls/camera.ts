import * as THREE from "three";
import {
  cameraDistance,
  cameraElevation,
  terrainHeight,
  worldPixelsPerUnit,
} from "../constants.js";
import type { ScreenPoint, Tile, TileHeight, ViewportSize } from "../types.js";
import { terrainTileAlongRay } from "./terrain-picker.js";

type ScreenRay = {
  origin: THREE.Vector3;
  direction: THREE.Vector3;
};

export const view: {
  targetX: number;
  targetY: number;
  zoom: number;
  rotation: number;
  elevation: number;
} = {
  targetX: 6.5,
  targetY: 6.5,
  zoom: 1,
  rotation: -Math.PI / 4,
  elevation: cameraElevation,
};

const worldUp = new THREE.Vector3(0, 0, 1);
const screenRayCamera = createViewCamera();
const screenRayResult: ScreenRay = {
  origin: new THREE.Vector3(),
  direction: new THREE.Vector3(),
};
const projectedPoint = new THREE.Vector3();
const projectionCamera = createViewCamera();

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
  if (heightAt) {
    return topGridTileFromScreen(canvas, screenX, screenY, heightAt);
  }

  const point = worldPointAtHeight(canvas, screenX, screenY, 0);

  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y),
  };
}

export function panBy(canvas: HTMLCanvasElement, dx: number, dy: number): void {
  const center = viewportCenter(canvas);
  const before = worldPointAtHeight(canvas, center.x, center.y, 0);
  const after = worldPointAtHeight(canvas, center.x - dx, center.y - dy, 0);

  view.targetX += after.x - before.x;
  view.targetY += after.y - before.y;
}

export function zoomAt(canvas: HTMLCanvasElement, screenX: number, screenY: number, nextZoom: number): void {
  if (!Number.isFinite(nextZoom) || nextZoom <= 0) {
    return;
  }

  const before = worldPointAtHeight(canvas, screenX, screenY, 0);

  view.zoom = nextZoom;
  anchorView(canvas, screenX, screenY, before);
}

export function rotateAt(
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
  nextRotation: number,
  nextElevation = view.elevation,
): void {
  const before = worldPointAtHeight(canvas, screenX, screenY, 0);

  view.rotation = normalizeRotation(nextRotation);
  view.elevation = nextElevation;
  anchorView(canvas, screenX, screenY, before);
}

export function devicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

export function screenFromGrid(canvas: HTMLCanvasElement, x: number, y: number, z = 0): ScreenPoint {
  return projectWorldPoint(canvas, projectedPoint.set(x, y, z));
}

function topGridTileFromScreen(
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
  heightAt: TileHeight,
): Tile {
  const ray = screenRay(canvas, screenX, screenY);
  const tile = terrainTileAlongRay(ray, heightAt);

  if (tile) {
    return tile;
  }

  const point = pointAtRayHeight(ray, visualHeight(terrainHeight.min), new THREE.Vector3());

  return { x: Math.floor(point.x), y: Math.floor(point.y) };
}

function worldPointAtHeight(
  canvas: HTMLCanvasElement,
  screenX: number,
  screenY: number,
  height: number,
): THREE.Vector3 {
  const ray = screenRay(canvas, screenX, screenY);

  return pointAtRayHeight(ray, height, new THREE.Vector3());
}

function anchorView(canvas: HTMLCanvasElement, screenX: number, screenY: number, before: THREE.Vector3): void {
  const after = worldPointAtHeight(canvas, screenX, screenY, 0);

  view.targetX += before.x - after.x;
  view.targetY += before.y - after.y;
}

function screenRay(canvas: HTMLCanvasElement, screenX: number, screenY: number): ScreenRay {
  const viewport = viewportSize(canvas);
  const pointerX = screenX / viewport.width * 2 - 1;
  const pointerY = -(screenY / viewport.height) * 2 + 1;

  configureViewCamera(canvas, screenRayCamera);
  screenRayResult.origin.set(pointerX, pointerY, -1).unproject(screenRayCamera);
  screenRayResult.direction
    .set(pointerX, pointerY, 1)
    .unproject(screenRayCamera)
    .sub(screenRayResult.origin)
    .normalize();

  return screenRayResult;
}

function projectWorldPoint(canvas: HTMLCanvasElement, point: THREE.Vector3): ScreenPoint {
  const viewport = viewportSize(canvas);

  configureViewCamera(canvas, projectionCamera);
  point.project(projectionCamera);

  return {
    x: (point.x + 1) * viewport.width / 2,
    y: (1 - point.y) * viewport.height / 2,
  };
}

function pointAtRayHeight(ray: ScreenRay, height: number, target: THREE.Vector3): THREE.Vector3 {
  const distance = (height - ray.origin.z) / ray.direction.z;

  return target.copy(ray.direction).multiplyScalar(distance).add(ray.origin);
}

function cameraTarget(): THREE.Vector3 {
  return new THREE.Vector3(view.targetX, view.targetY, 0);
}

function cameraForward(): THREE.Vector3 {
  return new THREE.Vector3(
    Math.cos(view.rotation) * Math.cos(view.elevation),
    Math.sin(view.rotation) * Math.cos(view.elevation),
    -Math.sin(view.elevation),
  ).normalize();
}

function cameraUp(): THREE.Vector3 {
  const forward = cameraForward();
  const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();

  return new THREE.Vector3().crossVectors(right, forward).normalize();
}

function normalizeRotation(rotation: number): number {
  return Math.atan2(Math.sin(rotation), Math.cos(rotation));
}

function visualHeight(height: number): number {
  return height * terrainHeight.visualScale;
}

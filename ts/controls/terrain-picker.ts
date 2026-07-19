import { terrainHeight } from "../constants.js";
import type { Point3, Tile, TileHeight } from "../types.js";

type Ray = {
  origin: Point3;
  direction: Point3;
};

type Traversal = {
  tile: Tile;
  stepX: number;
  stepY: number;
  nextX: number;
  nextY: number;
};

const epsilon = 1e-9;

export function terrainTileAlongRay(ray: Ray, heightAt: TileHeight): Tile | null {
  const bounds = terrainRayBounds(ray);

  if (!bounds) {
    return null;
  }

  const traversal = startTraversal(ray, bounds.entry);
  let entry = bounds.entry;

  while (entry <= bounds.exit + epsilon) {
    const exit = Math.min(traversal.nextX, traversal.nextY, bounds.exit);

    if (rayHeightAt(ray, exit) <= visualHeight(heightAt(traversal.tile)) + epsilon) {
      return { ...traversal.tile };
    }

    advanceTraversal(ray, traversal, exit);
    entry = exit;
  }

  return null;
}

function terrainRayBounds(ray: Ray): { entry: number; exit: number } | null {
  if (Math.abs(ray.direction.z) < epsilon) {
    return null;
  }

  const first = (visualHeight(terrainHeight.min) - ray.origin.z) / ray.direction.z;
  const second = (visualHeight(terrainHeight.max) - ray.origin.z) / ray.direction.z;
  const entry = Math.max(0, Math.min(first, second));
  const exit = Math.max(first, second);

  return exit >= entry ? { entry, exit } : null;
}

function startTraversal(ray: Ray, entry: number): Traversal {
  const sample = pointAlongRay(ray, entry + epsilon);
  const tile = { x: Math.floor(sample.x), y: Math.floor(sample.y) };
  const stepX = Math.sign(ray.direction.x);
  const stepY = Math.sign(ray.direction.y);

  return {
    tile,
    stepX,
    stepY,
    nextX: nextBoundaryTime(ray.origin.x, ray.direction.x, tile.x, stepX),
    nextY: nextBoundaryTime(ray.origin.y, ray.direction.y, tile.y, stepY),
  };
}

function advanceTraversal(ray: Ray, traversal: Traversal, exit: number): void {
  if (traversal.nextX <= exit + epsilon) {
    traversal.tile.x += traversal.stepX;
    traversal.nextX = nextBoundaryTime(
      ray.origin.x, ray.direction.x, traversal.tile.x, traversal.stepX,
    );
  }

  if (traversal.nextY <= exit + epsilon) {
    traversal.tile.y += traversal.stepY;
    traversal.nextY = nextBoundaryTime(
      ray.origin.y, ray.direction.y, traversal.tile.y, traversal.stepY,
    );
  }
}

function nextBoundaryTime(origin: number, direction: number, tile: number, step: number): number {
  if (step === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const boundary = step > 0 ? tile + 1 : tile;

  return (boundary - origin) / direction;
}

function pointAlongRay(ray: Ray, distance: number): Point3 {
  return {
    x: ray.origin.x + ray.direction.x * distance,
    y: ray.origin.y + ray.direction.y * distance,
    z: rayHeightAt(ray, distance),
  };
}

function rayHeightAt(ray: Ray, distance: number): number {
  return ray.origin.z + ray.direction.z * distance;
}

function visualHeight(height: number): number {
  return height * terrainHeight.visualScale;
}

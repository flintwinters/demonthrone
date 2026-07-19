import { terrainHeight } from "../constants.js";
const epsilon = 1e-9;
export function terrainTileAlongRay(ray, heightAt) {
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
function terrainRayBounds(ray) {
    if (Math.abs(ray.direction.z) < epsilon) {
        return null;
    }
    const first = (visualHeight(terrainHeight.min) - ray.origin.z) / ray.direction.z;
    const second = (visualHeight(terrainHeight.max) - ray.origin.z) / ray.direction.z;
    const entry = Math.max(0, Math.min(first, second));
    const exit = Math.max(first, second);
    return exit >= entry ? { entry, exit } : null;
}
function startTraversal(ray, entry) {
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
function advanceTraversal(ray, traversal, exit) {
    if (traversal.nextX <= exit + epsilon) {
        traversal.tile.x += traversal.stepX;
        traversal.nextX = nextBoundaryTime(ray.origin.x, ray.direction.x, traversal.tile.x, traversal.stepX);
    }
    if (traversal.nextY <= exit + epsilon) {
        traversal.tile.y += traversal.stepY;
        traversal.nextY = nextBoundaryTime(ray.origin.y, ray.direction.y, traversal.tile.y, traversal.stepY);
    }
}
function nextBoundaryTime(origin, direction, tile, step) {
    if (step === 0) {
        return Number.POSITIVE_INFINITY;
    }
    const boundary = step > 0 ? tile + 1 : tile;
    return (boundary - origin) / direction;
}
function pointAlongRay(ray, distance) {
    return {
        x: ray.origin.x + ray.direction.x * distance,
        y: ray.origin.y + ray.direction.y * distance,
        z: rayHeightAt(ray, distance),
    };
}
function rayHeightAt(ray, distance) {
    return ray.origin.z + ray.direction.z * distance;
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}

import { tileKey } from "./grid.js";
export function lineSightCost(start, end, context) {
    const ray = createRay(start, end);
    if (ray.horizontal === 0)
        return 0;
    let cost = 0;
    let blocked = false;
    traverse(ray, (segment) => {
        blocked ||= blocksRay(ray, segment, context);
        cost += segmentCost(ray, segment, context.sightCost);
    });
    return blocked ? Number.POSITIVE_INFINITY : cost * slopeMultiplier(ray);
}
export function sightSearchRadius(lineOfSight) {
    return Math.ceil(lineOfSight);
}
function createRay(start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return { start, end, dx, dy, dz: end.z - start.z, horizontal: Math.hypot(dx, dy) };
}
function traverse(ray, visit) {
    let tile = { x: Math.floor(ray.start.x), y: Math.floor(ray.start.y) };
    const step = { x: Math.sign(ray.dx), y: Math.sign(ray.dy) };
    const delta = { x: inverseMagnitude(ray.dx), y: inverseMagnitude(ray.dy) };
    let boundary = { x: firstBoundary(ray.start.x, ray.dx), y: firstBoundary(ray.start.y, ray.dy) };
    let start = 0;
    while (start < 1) {
        const end = Math.min(boundary.x, boundary.y, 1);
        const crossX = boundary.x === end;
        const crossY = boundary.y === end;
        visit({ tile, start, end });
        if (end >= 1)
            return;
        visitCornerNeighbors(tile, step, end, crossX, crossY, visit);
        if (crossX) {
            tile = { ...tile, x: tile.x + step.x };
            boundary.x += delta.x;
        }
        if (crossY) {
            tile = { ...tile, y: tile.y + step.y };
            boundary.y += delta.y;
        }
        start = end;
    }
}
function visitCornerNeighbors(tile, step, progress, crossX, crossY, visit) {
    if (!crossX || !crossY)
        return;
    visit({ tile: { x: tile.x + step.x, y: tile.y }, start: progress, end: progress });
    visit({ tile: { x: tile.x, y: tile.y + step.y }, start: progress, end: progress });
}
function firstBoundary(coordinate, direction) {
    if (direction > 0)
        return (Math.floor(coordinate) + 1 - coordinate) / direction;
    if (direction < 0)
        return (coordinate - Math.floor(coordinate)) / -direction;
    return Number.POSITIVE_INFINITY;
}
function inverseMagnitude(value) {
    return value === 0 ? Number.POSITIVE_INFINITY : 1 / Math.abs(value);
}
function blocksRay(ray, segment, context) {
    if (isEndpointSegment(segment))
        return false;
    const low = Math.min(rayZ(ray, segment.start), rayZ(ray, segment.end));
    const terrainTop = context.tileHeight(segment.tile);
    if (low <= terrainTop)
        return true;
    if (boulderBlocks(segment.tile, low, terrainTop, context))
        return true;
    return (context.blockers.get(tileKey(segment.tile)) ?? []).some((blocker) => intersectsHeight(ray, segment, blocker));
}
function isEndpointSegment(segment) {
    return segment.start === 0 || segment.end === 1;
}
function boulderBlocks(tile, low, terrainTop, context) {
    return context.isBoulderTile(tile) && low <= terrainTop + context.boulderHeight;
}
function intersectsHeight(ray, segment, blocker) {
    const first = rayZ(ray, segment.start);
    const last = rayZ(ray, segment.end);
    return Math.max(first, last) >= blocker.bottom && Math.min(first, last) <= blocker.top;
}
function segmentCost(ray, segment, sightCost) {
    const cost = sightCost(segment.tile);
    const traversableCost = Number.isFinite(cost) ? cost : 1;
    return ray.horizontal * (segment.end - segment.start) * traversableCost;
}
function rayZ(ray, progress) {
    return ray.start.z + ray.dz * progress;
}
function slopeMultiplier(ray) {
    return 1 + Math.abs(ray.dz) / ray.horizontal;
}

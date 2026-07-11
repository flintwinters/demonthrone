import { sightGeometry } from "./constants.js";
import { tileKey } from "./grid.js";
const octants = [
    { majorX: 1, majorY: 0, minorX: 0, minorY: 1 },
    { majorX: 1, majorY: 0, minorX: 0, minorY: -1 },
    { majorX: -1, majorY: 0, minorX: 0, minorY: 1 },
    { majorX: -1, majorY: 0, minorX: 0, minorY: -1 },
    { majorX: 0, majorY: 1, minorX: 1, minorY: 0 },
    { majorX: 0, majorY: 1, minorX: -1, minorY: 0 },
    { majorX: 0, majorY: -1, minorX: 1, minorY: 0 },
    { majorX: 0, majorY: -1, minorX: -1, minorY: 0 },
];
export function appendShadowcastTiles(unit, context, seen, tiles) {
    appendShadowcastField(unit, unit.sight, sightGeometry.surfaceClearance, context, seen, tiles);
}
export function shadowcastTiles(origin, range, context, targetOffset = sightGeometry.surfaceClearance) {
    const seen = new Set();
    const tiles = [];
    appendShadowcastField(origin, range, targetOffset, context, seen, tiles);
    return tiles;
}
function appendShadowcastField(origin, range, targetOffset, context, seen, tiles) {
    appendTile(origin, seen, tiles);
    const radius = Math.ceil(range);
    for (const octant of octants) {
        sweepOctant(origin, range, targetOffset, context, octant, radius, seen, tiles);
    }
}
function sweepOctant(origin, range, targetOffset, context, octant, radius, seen, tiles) {
    const bins = radius + 1;
    const sweep = createSweep(bins, context.tileHeight(origin) + sightGeometry.eyeHeight, targetOffset);
    for (let depth = 1; depth <= radius; depth += 1) {
        for (let bin = 0; bin < bins; bin += 1) {
            visitBin(origin, range, context, octant, depth, bin, sweep, seen, tiles);
        }
    }
}
function createSweep(bins, eyeZ, targetOffset) {
    const horizons = new Float64Array(bins);
    horizons.fill(Number.NEGATIVE_INFINITY);
    return { horizons, costs: new Float64Array(bins), bins, eyeZ, targetOffset };
}
function visitBin(origin, range, context, octant, depth, bin, sweep, seen, tiles) {
    const angularSlope = bin / (sweep.bins - 1);
    const minor = Math.min(depth, Math.floor(angularSlope * (depth + 1)));
    const tile = projectTile(origin, octant, depth, minor);
    const horizontal = Math.hypot(depth, minor);
    if (horizontal > range)
        return;
    const step = Math.hypot(1, angularSlope);
    const terrainCost = finiteSightCost(context.sightCost(tile));
    sweep.costs[bin] += step * terrainCost;
    if (isBinVisible(tile, horizontal, bin, range, sweep, context)) {
        appendTile(tile, seen, tiles);
    }
    sweep.horizons[bin] = Math.max(sweep.horizons[bin], occlusionSlope(tile, depth, angularSlope, sweep, context));
}
function projectTile(origin, octant, major, minor) {
    return {
        x: origin.x + octant.majorX * major + octant.minorX * minor,
        y: origin.y + octant.majorY * major + octant.minorY * minor,
    };
}
function isBinVisible(tile, horizontal, bin, sight, sweep, context) {
    if (horizontal > sight)
        return false;
    const deltaZ = context.tileHeight(tile) + sweep.targetOffset - sweep.eyeZ;
    const rangeCost = sweep.costs[bin] * (1 + Math.abs(deltaZ) / horizontal);
    return rangeCost <= sight && deltaZ / horizontal >= sweep.horizons[bin];
}
function occlusionSlope(tile, depth, angularSlope, sweep, context) {
    const nearDistance = Math.max(0.5, (depth - 0.5) * Math.hypot(1, angularSlope));
    const top = obstructionTop(tile, context);
    return (top - sweep.eyeZ) / nearDistance;
}
function obstructionTop(tile, context) {
    let top = context.tileHeight(tile);
    if (context.isBoulderTile(tile))
        top += context.boulderHeight;
    for (const blocker of context.blockers.get(tileKey(tile)) ?? []) {
        top = Math.max(top, blocker.top);
    }
    return top;
}
function finiteSightCost(cost) {
    return Number.isFinite(cost) ? cost : 1;
}
function appendTile(tile, seen, tiles) {
    const key = tileKey(tile);
    if (seen.has(key))
        return;
    seen.add(key);
    tiles.push(tile);
}

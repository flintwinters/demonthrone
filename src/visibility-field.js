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
    appendTile(unit, seen, tiles);
    const radius = Math.ceil(unit.sight);
    for (const octant of octants) {
        sweepOctant(unit, context, octant, radius, seen, tiles);
    }
}
function sweepOctant(unit, context, octant, radius, seen, tiles) {
    const bins = radius * 2 + 1;
    const sweep = createSweep(bins, context.tileHeight(unit) + sightGeometry.eyeHeight);
    for (let depth = 1; depth <= radius; depth += 1) {
        for (let bin = 0; bin < bins; bin += 1) {
            visitBin(unit, context, octant, depth, bin, sweep, seen, tiles);
        }
    }
}
function createSweep(bins, eyeZ) {
    const horizons = new Float64Array(bins);
    horizons.fill(Number.NEGATIVE_INFINITY);
    return { horizons, costs: new Float64Array(bins), bins, eyeZ };
}
function visitBin(unit, context, octant, depth, bin, sweep, seen, tiles) {
    const angularSlope = (bin + 0.5) / sweep.bins;
    const minor = Math.min(depth, Math.floor(angularSlope * (depth + 1)));
    const tile = projectTile(unit, octant, depth, minor);
    const horizontal = Math.hypot(depth, minor);
    const step = Math.hypot(1, angularSlope);
    const terrainCost = finiteSightCost(context.sightCost(tile));
    sweep.costs[bin] += step * terrainCost;
    if (isBinVisible(tile, horizontal, bin, unit.sight, sweep, context)) {
        appendTile(tile, seen, tiles);
    }
    sweep.horizons[bin] = Math.max(sweep.horizons[bin], occlusionSlope(tile, depth, angularSlope, sweep, context));
}
function projectTile(unit, octant, major, minor) {
    return {
        x: unit.x + octant.majorX * major + octant.minorX * minor,
        y: unit.y + octant.majorY * major + octant.minorY * minor,
    };
}
function isBinVisible(tile, horizontal, bin, sight, sweep, context) {
    if (horizontal > sight)
        return false;
    const deltaZ = context.tileHeight(tile) + sightGeometry.surfaceClearance - sweep.eyeZ;
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

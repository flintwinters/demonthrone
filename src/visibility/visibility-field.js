import { sightGeometry } from "../constants.js";
import { tileKey } from "../grid.js";
const angularSupersampling = 3;
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
    const bins = angularSupersampling * radius + 1;
    const sweep = createSweep(bins, context.tileHeight(origin) + sightGeometry.eyeHeight, targetOffset);
    const footprints = createFootprints(radius + 1);
    for (let depth = 1; depth <= radius; depth += 1) {
        resetFootprints(footprints, depth + 1);
        let sample = null;
        for (let bin = 0; bin < bins; bin += 1) {
            const minor = Math.min(depth, Math.floor(sweep.slopes[bin] * (depth + 1)));
            if (sample?.minor !== minor) {
                sample = sampleTile(origin, octant, depth, minor, range, context);
            }
            visitBin(range, depth, bin, sample, sweep, footprints, context);
        }
        appendVisibleFootprints(origin, octant, depth, footprints, seen, tiles);
    }
}
function createSweep(bins, eyeZ, targetOffset) {
    const horizons = new Float64Array(bins);
    const slopes = new Float64Array(bins);
    const steps = new Float64Array(bins);
    const centerSamples = new Uint8Array(bins);
    horizons.fill(Number.NEGATIVE_INFINITY);
    for (let bin = 0; bin < bins; bin += 1) {
        slopes[bin] = bin / (bins - 1);
        steps[bin] = Math.hypot(1, slopes[bin]);
        centerSamples[bin] = bin % angularSupersampling === 0 ? 1 : 0;
    }
    return {
        horizons,
        costs: new Float64Array(bins),
        slopes,
        steps,
        centerSamples,
        eyeZ,
        targetOffset,
    };
}
function visitBin(range, depth, bin, tile, sweep, footprints, context) {
    if (tile.horizontal > range)
        return;
    const step = sweep.steps[bin];
    sweep.costs[bin] += step * tile.terrainCost;
    footprints.total[tile.minor] += 1;
    const visible = isBinVisible(tile.groundHeight, tile.horizontal, bin, range, sweep, context);
    if (visible)
        footprints.visible[tile.minor] += 1;
    if (visible && sweep.centerSamples[bin] === 1)
        footprints.centerVisible[tile.minor] = 1;
    sweep.horizons[bin] = Math.max(sweep.horizons[bin], occlusionSlope(tile.obstructionTop, depth, step, sweep));
}
function sampleTile(origin, octant, depth, minor, range, context) {
    const tile = projectTile(origin, octant, depth, minor);
    const horizontal = Math.hypot(depth, minor);
    if (horizontal > range) {
        return { minor, horizontal, terrainCost: 0, groundHeight: 0, obstructionTop: 0 };
    }
    const terrainCost = finiteSightCost(context.sightCost(tile));
    const groundHeight = context.tileHeight(tile);
    return {
        minor,
        horizontal,
        terrainCost,
        groundHeight,
        obstructionTop: obstructionHeight(tile, groundHeight, context),
    };
}
function createFootprints(size) {
    return {
        visible: new Uint32Array(size),
        total: new Uint32Array(size),
        centerVisible: new Uint8Array(size),
    };
}
function resetFootprints(footprints, end) {
    footprints.visible.fill(0, 0, end);
    footprints.total.fill(0, 0, end);
    footprints.centerVisible.fill(0, 0, end);
}
function appendVisibleFootprints(origin, octant, depth, footprints, seen, tiles) {
    for (let minor = 0; minor <= depth; minor += 1) {
        if (!isFootprintVisible(minor, footprints))
            continue;
        appendTile(projectTile(origin, octant, depth, minor), seen, tiles);
    }
}
function isFootprintVisible(minor, footprints) {
    return footprints.centerVisible[minor] === 1
        || footprints.visible[minor] * 2 > footprints.total[minor];
}
function projectTile(origin, octant, major, minor) {
    return {
        x: origin.x + octant.majorX * major + octant.minorX * minor,
        y: origin.y + octant.majorY * major + octant.minorY * minor,
    };
}
function isBinVisible(groundHeight, horizontal, bin, sight, sweep, context) {
    if (horizontal > sight)
        return false;
    const deltaZ = groundHeight + sweep.targetOffset - sweep.eyeZ;
    const heightMultiplier = context.heightMultiplier ?? 1;
    const rangeCost = sweep.costs[bin] * (1 + heightMultiplier * Math.abs(deltaZ) / horizontal);
    return rangeCost <= sight && deltaZ / horizontal >= sweep.horizons[bin];
}
function occlusionSlope(obstructionTop, depth, step, sweep) {
    const nearDistance = Math.max(0.5, (depth - 0.5) * step);
    return (obstructionTop - sweep.eyeZ) / nearDistance;
}
function obstructionHeight(tile, groundHeight, context) {
    let top = groundHeight;
    if (context.isBoulderTile(tile))
        top += context.boulderHeight;
    if (context.blockers.size === 0)
        return top;
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

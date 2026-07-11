import { sightGeometry, terrainHeight } from "./constants.js";
import { lineSightCost } from "./sight-cost.js";
import { tileKey } from "./grid.js";
export function isVisibleTile(tile, units, sightBlockers, sightCost, tileHeight, isBoulderTile) {
    const context = sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile);
    return units.some((unit) => canUnitSeeTile(unit, tile, context));
}
export function canUnitSeeTile(unit, tile, context) {
    return canSeePoint(unit, tilePoint(tile, context), context);
}
export function canUnitSeeEntity(unit, target, context) {
    return canSeePoint(unit, entityPoint(target, context), context);
}
export function sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile) {
    return {
        sightCost,
        tileHeight: (tile) => visualHeight(tileHeight(tile)),
        isBoulderTile,
        blockers: blockerMap(sightBlockers),
        boulderHeight: sightGeometry.boulderHeight,
    };
}
function canSeePoint(unit, target, context) {
    const source = pointAbove(unit, context, sightGeometry.eyeHeight);
    const horizontal = Math.hypot(target.x - source.x, target.y - source.y);
    return horizontal <= unit.sight && lineSightCost(source, target, context) <= unit.sight;
}
function tilePoint(tile, context) {
    return pointAbove(tile, context, sightGeometry.surfaceClearance);
}
function entityPoint(target, context) {
    return pointAbove(target, context, sightGeometry.characterTargetHeight);
}
function pointAbove(tile, context, offset) {
    return { x: tile.x + 0.5, y: tile.y + 0.5, z: context.tileHeight(tile) + offset };
}
function blockerMap(blockers) {
    const grouped = new Map();
    for (const blocker of blockers) {
        const key = tileKey(blocker);
        grouped.set(key, [...grouped.get(key) ?? [], blocker]);
    }
    return grouped;
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}

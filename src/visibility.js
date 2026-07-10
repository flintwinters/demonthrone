import { lineSightCost } from "./sight-cost.js";
import { sameTile, tileKey } from "./grid.js";
const boulderSightClearance = 3;
export function isVisibleTile(tile, units, sightBlockers, sightCost, tileHeight) {
    const context = sightContext(sightBlockers, sightCost, tileHeight);
    return units.some((unit) => canUnitSeeTile(unit, tile, context));
}
export function canUnitSeeTile(unit, tile, context) {
    return lineSightCost(unit, tile, terrainSightCostFrom(unit, context.sightCost, context.tileHeight), context.tileHeight, blocksSightFrom(unit, context.blockerKeys)) <= unit.sight;
}
export function sightContext(sightBlockers, sightCost, tileHeight) {
    return {
        sightCost,
        tileHeight,
        blockerKeys: new Set(sightBlockers.map(tileKey)),
    };
}
function blocksSightFrom(unit, blockerKeys) {
    return (tile) => !sameTile(tile, unit) && blockerKeys.has(tileKey(tile));
}
function terrainSightCostFrom(unit, sightCost, tileHeight) {
    const viewerHeight = tileHeight(unit);
    return (tile) => {
        const cost = sightCost(tile);
        if (cost === Number.POSITIVE_INFINITY && viewerHeight - tileHeight(tile) > boulderSightClearance) {
            return 1;
        }
        return cost;
    };
}

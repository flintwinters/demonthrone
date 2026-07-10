import { lineSightCost } from "./sight-cost.js";
import { sameTile } from "./grid.js";
const boulderSightClearance = 3;
export function isVisibleTile(tile, units, sightBlockers, sightCost, tileHeight) {
    return units.some((unit) => canUnitSeeTile(unit, tile, sightBlockers, sightCost, tileHeight));
}
function canUnitSeeTile(unit, tile, sightBlockers, sightCost, tileHeight) {
    return lineSightCost(unit, tile, terrainSightCostFrom(unit, sightCost, tileHeight), tileHeight, blocksSightFrom(unit, sightBlockers)) <= unit.sight;
}
function blocksSightFrom(unit, sightBlockers) {
    return (tile) => !sameTile(tile, unit) && sightBlockers.some((blocker) => sameTile(blocker, tile));
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

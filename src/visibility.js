import { lineSightCost } from "./sight-cost.js";
import { tileKey } from "./grid.js";
export function isVisibleTile(tile, units, sightBlockers, sightCost, tileHeight) {
    return units.some((unit) => canUnitSeeTile(unit, tile, sightBlockers, sightCost, tileHeight));
}
function canUnitSeeTile(unit, tile, sightBlockers, sightCost, tileHeight) {
    return lineSightCost(unit, tile, sightCost, tileHeight, blocksSightFrom(unit, sightBlockers)) <= unit.sight;
}
function blocksSightFrom(unit, sightBlockers) {
    return (tile) => tileKey(tile) !== tileKey(unit) && sightBlockers.some((blocker) => tileKey(blocker) === tileKey(tile));
}

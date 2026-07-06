import { lineSightCost } from "./sight-cost.js";
export function isVisibleTile(tile, units, sightCost, tileHeight) {
    return units.some((unit) => canUnitSeeTile(unit, tile, sightCost, tileHeight));
}
function canUnitSeeTile(unit, tile, sightCost, tileHeight) {
    return lineSightCost(unit, tile, sightCost, tileHeight) <= unit.lineOfSight;
}

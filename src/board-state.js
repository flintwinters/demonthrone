import { isObstacleTile } from "./obstacles.js";
import { isBrushTile, sightCost, tileHeight } from "./world.js";
import { selection, units } from "./units.js";
import { isVisibleTile } from "./visibility.js";
export function boardState(selectedTile, hoveredTile, enemies, tombstones, isMovementTile) {
    return {
        selectedTile,
        hoveredTile,
        units: renderableUnits(),
        enemies: renderableEnemies(enemies),
        tombstones: renderableTombstones(tombstones),
        isObstacleTile,
        isBrushTile,
        sightCost,
        selectedUnitId: selection.unitId,
        tileHeight,
        isMovementTile,
        isTileVisible: canSeeTile,
    };
}
export function canSeeTile(tile) {
    return isVisibleTile(tile, units, sightCost, tileHeight);
}
export function enrichTile(tile) {
    return {
        ...tile,
        height: tileHeight(tile),
    };
}
function renderableUnits() {
    return units.map((unit) => ({
        ...unit,
        height: tileHeight(unit),
        target: unit.target ? enrichTile(unit.target) : null,
    }));
}
function renderableEnemies(enemies) {
    return enemies
        .filter(canSeeTile)
        .map((enemy) => ({
        ...enemy,
        height: tileHeight(enemy),
    }));
}
function renderableTombstones(tombstones) {
    return tombstones
        .filter(canSeeTile)
        .map((tombstone) => ({
        ...tombstone,
        height: tileHeight(tombstone),
    }));
}

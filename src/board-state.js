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
        sightBlockers: sightBlockers(enemies),
        tombstones: renderableTombstones(tombstones, enemies),
        isObstacleTile,
        isBrushTile,
        sightCost,
        selectedUnitId: selection.unitId,
        tileHeight,
        isMovementTile,
        isTileVisible: (tile) => canSeeTile(tile, enemies),
    };
}
export function canSeeTile(tile, enemies) {
    return isVisibleTile(tile, units, sightBlockers(enemies), sightCost, tileHeight);
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
        .filter((enemy) => canSeeTile(enemy, enemies))
        .map((enemy) => ({
        ...enemy,
        height: tileHeight(enemy),
    }));
}
function renderableTombstones(tombstones, enemies) {
    return tombstones
        .filter((tombstone) => canSeeTile(tombstone, enemies))
        .map((tombstone) => ({
        ...tombstone,
        height: tileHeight(tombstone),
    }));
}
function sightBlockers(enemies) {
    return [...units, ...enemies];
}

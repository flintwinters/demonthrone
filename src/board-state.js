import { visibilityState } from "./board-visibility.js";
import { tileKey } from "./grid.js";
import { isObstacleTile } from "./obstacles.js";
import { pushables } from "./pushables.js";
import { selection, units } from "./units.js";
import { canUnitSeeEntity, sightContext } from "./visibility.js";
import { isBoulderTile, isBrushTile, sightCost, tileHeight } from "./world.js";
export function boardState(selectedTile, hoveredTile, enemies, tombstones, isMovementTile, isAttackTile, enchantmentSourceId = null, selectionLines = []) {
    const visibility = visibilityState(enemies);
    return {
        selectedTile,
        hoveredTile,
        selectionLines,
        units: renderableUnits(),
        visibleTiles: visibility.tiles,
        enemies: renderableEnemies(enemies, visibility.keys),
        sightBlockers: visibility.blockers,
        tombstones: renderableTombstones(tombstones, visibility.keys),
        pushables: renderablePushables(visibility.keys, enchantmentSourceId),
        isObstacleTile,
        isBoulderTile,
        isBrushTile,
        sightCost,
        selectedUnitId: selection.unitId,
        tileHeight,
        isMovementTile,
        isAttackTile,
    };
}
function renderablePushables(visible, enchantmentSourceId) {
    return pushables
        .filter((pushable) => visible.has(tileKey(pushable)))
        .map((pushable) => ({
        ...pushable,
        height: tileHeight(pushable),
        isEnchantmentSource: pushable.id === enchantmentSourceId,
        target: pushable.target ? enrichTile(pushable.target) : null,
    }));
}
export function canSeeTile(tile, enemies) {
    return visibilityState(enemies).keys.has(tileKey(tile));
}
export function canUnitSee(unit, target, enemies) {
    return canUnitSeeEntity(unit, target, sightContext(visibilityState(enemies).blockers, sightCost, tileHeight, isBoulderTile));
}
export function enrichTile(tile) {
    return { ...tile, height: tileHeight(tile) };
}
function renderableUnits() {
    return units.map((unit) => ({
        ...unit,
        height: tileHeight(unit),
        target: unit.target ? enrichTile(unit.target) : null,
    }));
}
function renderableEnemies(enemies, visible) {
    return enemies
        .filter((enemy) => visible.has(tileKey(enemy)))
        .map((enemy) => ({ ...enemy, height: tileHeight(enemy) }));
}
function renderableTombstones(tombstones, visible) {
    return tombstones
        .filter((tombstone) => visible.has(tileKey(tombstone)))
        .map((tombstone) => ({ ...tombstone, height: tileHeight(tombstone) }));
}

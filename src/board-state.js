import { visibilityState } from "./visibility/index.js";
import { tileKey } from "./grid.js";
import { isObstacleTile } from "./obstacles.js";
import { canUnitSeeEntity, sightContext } from "./visibility/index.js";
import { isBoulderTile, isBrushTile, sightCost, tileHeight } from "./world/index.js";
import { lineOfSightConfig } from "./world-config.js";
export function boardState(game, isMovementTile, isAttackTile, enchantmentSourceId = null, selectionLines = [], revealCenter = null) {
    const visibility = visibilityState(game.units, game.enemies, revealCenter);
    return {
        selectedTile: game.selectedTile,
        hoveredTile: game.hoveredTile,
        selectionLines,
        units: renderableUnits(game),
        visibleTiles: visibility.tiles,
        enemies: renderableEnemies(game.enemies, visibility.keys),
        sightBlockers: visibility.blockers,
        tombstones: renderableTombstones(game.tombstones, visibility.keys),
        pushables: renderablePushables(game, visibility.keys, enchantmentSourceId),
        isObstacleTile,
        isBoulderTile,
        isBrushTile,
        sightCost,
        selectedUnitId: game.selection.unitId,
        tileHeight,
        isMovementTile,
        isAttackTile,
    };
}
function renderablePushables(game, visible, enchantmentSourceId) {
    return game.pushables
        .filter((pushable) => visible.has(tileKey(pushable)))
        .map((pushable) => ({
        ...pushable,
        height: tileHeight(pushable),
        isEnchantmentSource: pushable.id === enchantmentSourceId,
        target: pushable.target ? enrichTile(pushable.target) : null,
    }));
}
export function canSeeTile(tile, game, revealCenter = null) {
    return visibilityState(game.units, game.enemies, revealCenter).keys.has(tileKey(tile));
}
export function canUnitSee(unit, target, game) {
    return canUnitSeeEntity(unit, target, sightContext(visibilityState(game.units, game.enemies).blockers, sightCost, tileHeight, isBoulderTile, lineOfSightConfig.visionHeightMultiplier));
}
export function enrichTile(tile) {
    return { ...tile, height: tileHeight(tile) };
}
function renderableUnits(game) {
    return game.units.map((unit) => ({
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

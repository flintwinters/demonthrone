import { sameTile } from "./grid.js";
export function selectedEntityAt(tile, entities) {
    return tile ? entities.find((entity) => sameTile(entity, tile)) ?? null : null;
}
export function entityStatus(entity) {
    return entity?.entityType ?? "";
}
export function selectedEntityStatus(selectedUnit, selectedSource, selectedTile, entities) {
    return entityStatus(selectedUnit ?? selectedSource ?? selectedEntityAt(selectedTile, entities));
}
export function selectVisibleEntityTile(tile, units, entities, canSee, enrich, interact) {
    if (!canSee(tile)) {
        return null;
    }
    const clickedUnit = units.some((unit) => sameTile(unit, tile));
    const interactionTile = interact(enrich(tile));
    return interactionTile ?? (!clickedUnit && selectedEntityAt(tile, entities) ? enrich(tile) : null);
}

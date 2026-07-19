import { entityAtTile } from "./grid.js";
export function selectedEntityAt(tile, entities) {
    return entityAtTile(entities, tile);
}
export function entityStatus(entity) {
    return entity?.infoText ?? "";
}
export function selectedEntityStatus(selectedUnit, selectedSource, selectedTile, entities) {
    return entityStatus(selectedSource ?? selectedUnit ?? selectedEntityAt(selectedTile, entities));
}
export function selectedObjectStatus(selectedUnit, selectedSource, selectedTile, entities, terrainAt) {
    return selectedEntityStatus(selectedUnit, selectedSource, selectedTile, entities)
        || selectedInspectionStatus(selectedTile, entities, terrainAt);
}
function selectedInspectionStatus(tile, entities, terrainAt) {
    const entity = selectedEntityAt(tile, entities);
    return entity ? entityStatus(entity) : selectedTerrainStatus(tile, terrainAt);
}
function selectedTerrainStatus(tile, terrainAt) {
    return tile ? terrainAt(tile).infoText : "";
}
export function isInspectableTerrain(terrain) {
    return terrain.infoText.length > 0;
}
export function selectVisibleEntityTile(tile, units, entities, canSee, enrich, interact, isInspectableTile = () => false) {
    if (!canSee(tile)) {
        return null;
    }
    const clickedUnit = entityAtTile(units, tile) !== null;
    const interactionTile = interact(enrich(tile));
    return interactionTile ?? inspectTile(tile, clickedUnit, entities, enrich, isInspectableTile);
}
function inspectTile(tile, clickedUnit, entities, enrich, isInspectableTile) {
    if (clickedUnit || (!selectedEntityAt(tile, entities) && !isInspectableTile(tile))) {
        return null;
    }
    return enrich(tile);
}

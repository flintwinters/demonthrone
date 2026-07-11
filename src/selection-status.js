import { sameTile } from "./grid.js";
const terrainInfo = {
    boulder: "boulder",
    brush: "foliage",
    ice: "ice",
    water: "water",
};
export function selectedEntityAt(tile, entities) {
    return tile ? entities.find((entity) => sameTile(entity, tile)) ?? null : null;
}
export function entityStatus(entity) {
    return entity?.entityType ?? "";
}
export function selectedEntityStatus(selectedUnit, selectedSource, selectedTile, entities) {
    return entityStatus(selectedSource ?? selectedUnit ?? selectedEntityAt(selectedTile, entities));
}
export function selectedObjectStatus(selectedUnit, selectedSource, selectedTile, entities, terrainKind) {
    return selectedEntityStatus(selectedUnit, selectedSource, selectedTile, entities)
        || selectedInspectionStatus(selectedTile, entities, terrainKind);
}
function selectedInspectionStatus(tile, entities, terrainKind) {
    const entity = selectedEntityAt(tile, entities);
    return entity ? entityStatus(entity) : selectedTerrainStatus(tile, terrainKind);
}
function selectedTerrainStatus(tile, terrainKind) {
    return tile ? terrainInfo[terrainKind(tile)] ?? "" : "";
}
export function isInspectableTerrain(kind) {
    return terrainInfo[kind] !== undefined;
}
export function selectVisibleEntityTile(tile, units, entities, canSee, enrich, interact, isInspectableTile = () => false) {
    if (!canSee(tile)) {
        return null;
    }
    const clickedUnit = units.some((unit) => sameTile(unit, tile));
    const interactionTile = interact(enrich(tile));
    return interactionTile ?? inspectTile(tile, clickedUnit, entities, enrich, isInspectableTile);
}
function inspectTile(tile, clickedUnit, entities, enrich, isInspectableTile) {
    if (clickedUnit || (!selectedEntityAt(tile, entities) && !isInspectableTile(tile))) {
        return null;
    }
    return enrich(tile);
}

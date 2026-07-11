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
    return entityStatus(selectedUnit ?? selectedSource ?? selectedEntityAt(selectedTile, entities));
}
export function selectedObjectStatus(selectedUnit, selectedSource, selectedTile, entities, terrainKind) {
    const entity = selectedUnit ?? selectedSource ?? selectedEntityAt(selectedTile, entities);
    return entityStatus(entity) || (selectedTile ? terrainInfo[terrainKind(selectedTile)] ?? "" : "");
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

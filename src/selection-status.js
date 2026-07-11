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
    const interaction = interactionStatus(selectedUnit, selectedSource, entities);
    if (interaction) {
        return interaction;
    }
    return selectedInspectionStatus(selectedTile, entities, terrainKind);
}
function selectedInspectionStatus(tile, entities, terrainKind) {
    const entity = selectedEntityAt(tile, entities);
    return entity ? entityStatus(entity) : selectedTerrainStatus(tile, terrainKind);
}
function interactionStatus(unit, source, entities) {
    if (source) {
        return enchantmentStatus(source);
    }
    return unit ? unitInteractionStatus(unit, entities) : "";
}
function enchantmentStatus(source) {
    if ("enchanterUnitId" in source && source.enchanterUnitId) {
        return `${source.entityType} · click again to unbind · elsewhere cancels`;
    }
    return `${source.entityType} · bind to teammate or green crate · click again to cancel`;
}
function unitInteractionStatus(unit, entities) {
    const attackTarget = entities.find((entity) => entity.id === unit.attackTargetId);
    const moveTarget = selectedEntityAt(unit.target, entities);
    if (attackTarget) {
        return `${unit.entityType} · attack ${attackTarget.entityType} · click target or teammate to cancel`;
    }
    if (unit.target) {
        const action = moveTarget?.entityKind === "object" ? "push" : "move";
        return `${unit.entityType} · ${action} planned · click target or teammate to cancel`;
    }
    return `${unit.entityType} · green move · red attack · adjacent crate push`;
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

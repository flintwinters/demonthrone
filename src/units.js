import { TeammateTemplate } from "./domain.js";
import { entityAtTile, sameTile } from "./grid.js";
import { cancelAction, spendAction } from "./teammate-turns.js";
import { teammateConfigs } from "./world-config.js";
export const units = [
    ...teammateConfigs.map((config) => {
        const template = new TeammateTemplate(config.type, config.stats, config.color);
        return template.create(config.id, config.spawn);
    }),
];
export const selection = {
    unitId: null,
};
export function selectedUnit() {
    return units.find((unit) => unit.id === selection.unitId) ?? null;
}
export function clearUnitSelection() {
    selection.unitId = null;
}
export function clickBoardTile(tile, canTargetTile, onTarget) {
    const unit = unitAt(tile);
    if (unit) {
        if (selection.unitId === unit.id) {
            cancelAction(unit);
        }
        selection.unitId = selection.unitId === unit.id ? null : unit.id;
        return selection.unitId ? tile : null;
    }
    return assignSelectedTarget(tile, canTargetTile, onTarget);
}
export function commitPlannedMoves() {
    for (const unit of units) {
        if (!unit.target) {
            continue;
        }
        unit.x = unit.target.x;
        unit.y = unit.target.y;
        unit.target = null;
    }
    syncUnitSelection();
}
export function syncUnitSelection() {
    if (selection.unitId && !selectedUnit()) {
        selection.unitId = null;
    }
}
function assignSelectedTarget(tile, canTargetTile, onTarget) {
    const unit = selectedUnit();
    if (unit?.target && sameTile(unit.target, tile)) {
        cancelAction(unit);
        return null;
    }
    if (unit && canTargetTile(tile, unit)) {
        spendAction(unit);
        onTarget(unit, tile);
        unit.target = { x: tile.x, y: tile.y };
        return tile;
    }
    return null;
}
function unitAt(tile) {
    return entityAtTile(units, tile);
}

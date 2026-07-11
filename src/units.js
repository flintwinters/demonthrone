import { colors } from "./constants.js";
import { TeammateTemplate } from "./domain.js";
import { sameTile } from "./grid.js";
import { clearPlannedPush } from "./pushables.js";
const teammateStats = {
    sight: 50,
    movement: 3,
    attackRange: 1,
    health: 1,
};
const vanguardTemplate = new TeammateTemplate("vanguard", teammateStats, colors.unitOne);
const wardenTemplate = new TeammateTemplate("warden", teammateStats, colors.unitTwo);
export const units = [
    vanguardTemplate.create("vanguard", { x: 5, y: 7 }),
    wardenTemplate.create("warden", { x: 8, y: 6 }),
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
        unit.target = null;
        clearPlannedPush(unit.id);
        return null;
    }
    if (unit && canTargetTile(tile, unit)) {
        onTarget(unit, tile);
        unit.target = { x: tile.x, y: tile.y };
        return tile;
    }
    return null;
}
function unitAt(tile) {
    return units.find((unit) => unit.x === tile.x && unit.y === tile.y) ?? null;
}

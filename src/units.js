import { colors } from "./constants.js";
export const units = [
    {
        id: "vanguard",
        x: 5,
        y: 7,
        color: colors.unitOne,
        sight: 5,
        movement: 3,
        attackRange: 1,
        health: 1,
        target: null,
    },
    {
        id: "warden",
        x: 8,
        y: 6,
        color: colors.unitTwo,
        sight: 5,
        movement: 3,
        attackRange: 1,
        health: 1,
        target: null,
    },
];
export const selection = {
    unitId: null,
};
export function selectedUnit() {
    return units.find((unit) => unit.id === selection.unitId) ?? null;
}
export function plannedUnits() {
    return units.filter(hasTarget);
}
export function clickBoardTile(tile, canTargetTile) {
    const unit = unitAt(tile);
    if (unit) {
        selection.unitId = unit.id;
        return tile;
    }
    return assignSelectedTarget(tile, canTargetTile);
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
    if (selection.unitId && !selectedUnit()) {
        selection.unitId = null;
    }
}
function assignSelectedTarget(tile, canTargetTile) {
    const unit = selectedUnit();
    if (unit && canTargetTile(tile, unit)) {
        unit.target = { x: tile.x, y: tile.y };
        return tile;
    }
    return null;
}
function unitAt(tile) {
    return units.find((unit) => unit.x === tile.x && unit.y === tile.y) ?? null;
}
function hasTarget(unit) {
    return unit.target !== null;
}

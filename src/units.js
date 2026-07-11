import { colors } from "./constants.js";
import { CharacterTemplate } from "./domain.js";
const teammateTemplate = new CharacterTemplate({
    sight: 50,
    movement: 3,
    attackRange: 1,
    health: 1,
});
export const units = [
    teammateTemplate.unit("vanguard", { x: 5, y: 7 }, colors.unitOne),
    teammateTemplate.unit("warden", { x: 8, y: 6 }, colors.unitTwo),
];
export const selection = {
    unitId: null,
};
export function selectedUnit() {
    return units.find((unit) => unit.id === selection.unitId) ?? null;
}
export function clickBoardTile(tile, canTargetTile, onTarget) {
    const unit = unitAt(tile);
    if (unit) {
        selection.unitId = unit.id;
        return tile;
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
    if (selection.unitId && !selectedUnit()) {
        selection.unitId = null;
    }
}
function assignSelectedTarget(tile, canTargetTile, onTarget) {
    const unit = selectedUnit();
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

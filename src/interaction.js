import { sameTile } from "./grid.js";
export function handleEnchantmentClick(tile, currentTile, selection, units, selectedUnit, conflictsWithUnitAction, enrichTile, clearUnitSelection) {
    const source = selection.source();
    if (source && (sameTile(source, tile) || selection.canBindTo(tile, units))) {
        return { handled: true, selectedTile: selection.resolve(tile, units) ? null : currentTile };
    }
    selection.clear();
    return beginEnchantment(tile, selection, selectedUnit, conflictsWithUnitAction, enrichTile, clearUnitSelection);
}
export function cancelAttackForMovement(tile, unit, canMove, cancelAction) {
    if (unit?.attackTargetId && canMove(tile, unit)) {
        cancelAction(unit);
    }
}
function beginEnchantment(tile, selection, unit, conflictsWithUnitAction, enrichTile, clearUnitSelection) {
    if (!selection.begin(tile)) {
        return { handled: false, selectedTile: null };
    }
    if (unit && conflictsWithUnitAction(tile, unit)) {
        selection.clear();
        return { handled: false, selectedTile: null };
    }
    clearUnitSelection();
    return { handled: true, selectedTile: enrichTile(tile) };
}

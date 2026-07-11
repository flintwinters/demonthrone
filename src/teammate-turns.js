import { clearPlannedPush } from "./pushables.js";
const spentUnitIds = new Set();
export function canTakeAction(unit) {
    return !spentUnitIds.has(unit.id);
}
export function spendAction(unit) {
    unit.target = null;
    unit.attackTargetId = null;
    clearPlannedPush(unit.id);
    spentUnitIds.add(unit.id);
}
export function resetActions() {
    spentUnitIds.clear();
}

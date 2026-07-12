import { clearPlannedPush } from "./pushables.js";
let actingUnitId = null;
export function canTakeAction(unit) {
    return actingUnitId === null && unit.health > 0;
}
export function spendAction(unit) {
    if (actingUnitId !== null && actingUnitId !== unit.id)
        return;
    clearUnitAction(unit);
    actingUnitId = unit.id;
}
export function cancelAction(unit) {
    clearUnitAction(unit);
    if (actingUnitId === unit.id)
        actingUnitId = null;
}
export function resetActions() {
    actingUnitId = null;
}
function clearUnitAction(unit) {
    unit.target = null;
    unit.attackTargetId = null;
    clearPlannedPush(unit.id);
}

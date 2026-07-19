import { canTakeAction, cancelAction, spendAction } from "./teammate-turns.js";
import { entityAtTile } from "./grid.js";
export function canAttack(unit, target) {
    return Math.hypot(unit.x - target.x, unit.y - target.y) <= unit.attackRange;
}
export function canPlanAttack(unit, tile, targets, canSee) {
    const target = entityAtTile(targets, tile);
    return Boolean(target
        && (canTakeAction(unit) || unit.attackTargetId === target.id)
        && canSee(target)
        && canAttack(unit, target));
}
export function planAttack(unit, target) {
    spendAction(unit);
    unit.attackTargetId = target.id;
}
export function tryPlanAttack(tile, unit, targets, canSee) {
    const target = entityAtTile(targets, tile);
    if (!target || !unit || !canSee(target) || !canAttack(unit, target)) {
        return null;
    }
    if (!toggleAttack(unit, target)) {
        return null;
    }
    return target;
}
function toggleAttack(unit, target) {
    if (unit.attackTargetId === target.id) {
        cancelAction(unit);
        return true;
    }
    if (!canTakeAction(unit)) {
        return false;
    }
    planAttack(unit, target);
    return true;
}
export function resolveAttacks(units, targets, additionalTargets = [], beforeRemove = () => { }) {
    const targetGroups = [targets, additionalTargets];
    const allTargets = targetGroups.flat();
    for (const unit of units) {
        damageTarget(unit, allTargets);
        unit.attackTargetId = null;
    }
    const destroyed = allTargets.filter((target) => target.health <= 0);
    for (const target of destroyed) {
        beforeRemove(target);
        const group = targetGroups.find((candidates) => candidates.includes(target));
        group?.splice(group.indexOf(target), 1);
    }
    return destroyed.map(({ x, y }) => ({ x, y }));
}
function damageTarget(unit, targets) {
    const target = targets.find((candidate) => candidate.id === unit.attackTargetId);
    if (target && canAttack(unit, target)) {
        target.health -= 1;
    }
}

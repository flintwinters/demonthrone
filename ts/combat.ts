import { l1Distance } from "./grid.js";
import { canTakeAction, cancelAction, spendAction } from "./teammate-turns.js";
import type { DamageableEntity, Tile, TilePredicate, Unit } from "./types.js";

export function canAttack(unit: Unit, target: DamageableEntity): boolean {
  return l1Distance(unit, target) <= unit.attackRange;
}

export function canPlanAttack(
  unit: Unit,
  tile: Tile,
  targets: readonly DamageableEntity[],
  canSee: TilePredicate,
): boolean {
  const target = targets.find((candidate) => candidate.x === tile.x && candidate.y === tile.y);

  return Boolean(target
    && (canTakeAction(unit) || unit.attackTargetId === target.id)
    && canSee(target)
    && canAttack(unit, target));
}

export function planAttack(unit: Unit, target: DamageableEntity): void {
  spendAction(unit);
  unit.attackTargetId = target.id;
}

export function tryPlanAttack(
  tile: Tile,
  unit: Unit | null,
  targets: readonly DamageableEntity[],
  canSee: TilePredicate,
): DamageableEntity | null {
  const target = targets.find((candidate) => candidate.x === tile.x && candidate.y === tile.y);

  if (!target || !unit || !canSee(target) || !canAttack(unit, target)) {
    return null;
  }

  if (!toggleAttack(unit, target)) {
    return null;
  }
  return target;
}

function toggleAttack(unit: Unit, target: DamageableEntity): boolean {
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

export function resolveAttacks(
  units: Unit[],
  targets: DamageableEntity[],
  ...additionalTargetGroups: DamageableEntity[][]
): Tile[] {
  const targetGroups = [targets, ...additionalTargetGroups];
  const allTargets = targetGroups.flat();

  for (const unit of units) {
    damageTarget(unit, allTargets);
    unit.attackTargetId = null;
  }

  const destroyed = allTargets.filter((target) => target.health <= 0);

  for (const target of destroyed) {
    const group = targetGroups.find((candidates) => candidates.includes(target));

    group?.splice(group.indexOf(target), 1);
  }

  return destroyed.map(({ x, y }) => ({ x, y }));
}

function damageTarget(unit: Unit, targets: readonly DamageableEntity[]): void {
  const target = targets.find((candidate) => candidate.id === unit.attackTargetId);

  if (target && canAttack(unit, target)) {
    target.health -= 1;
  }
}

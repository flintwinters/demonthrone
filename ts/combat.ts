import { l1Distance } from "./grid.js";
import { canTakeAction, spendAction } from "./teammate-turns.js";
import type { Enemy, Tile, TilePredicate, Unit } from "./types.js";

export function canAttack(unit: Unit, enemy: Enemy): boolean {
  return l1Distance(unit, enemy) <= unit.attackRange;
}

export function planAttack(unit: Unit, enemy: Enemy): void {
  spendAction(unit);
  unit.attackTargetId = enemy.id;
}

export function tryPlanAttack(
  tile: Tile,
  unit: Unit | null,
  enemies: Enemy[],
  canSee: TilePredicate,
): Enemy | null {
  const enemy = enemies.find((candidate) => candidate.x === tile.x && candidate.y === tile.y);

  if (!enemy || !unit || !canTakeAction(unit) || !canSee(enemy) || !canAttack(unit, enemy)) {
    return null;
  }

  planAttack(unit, enemy);
  return enemy;
}

export function resolveAttacks(units: Unit[], enemies: Enemy[]): Tile[] {
  for (const unit of units) {
    damageTarget(unit, enemies);
    unit.attackTargetId = null;
  }

  const destroyed = enemies.filter((enemy) => enemy.health <= 0);

  for (const enemy of destroyed) {
    enemies.splice(enemies.indexOf(enemy), 1);
  }

  return destroyed.map(({ x, y }) => ({ x, y }));
}

function damageTarget(unit: Unit, enemies: Enemy[]): void {
  const enemy = enemies.find((candidate) => candidate.id === unit.attackTargetId);

  if (enemy && canAttack(unit, enemy)) {
    enemy.health -= 1;
  }
}

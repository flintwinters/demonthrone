import { actionFields, type ActionFields } from "./action-fields.js";
import { canPlanAttack } from "./combat.js";
import { sameTile, tileKey } from "./grid.js";
import type { DamageableEntity, Enemy, HeightTile, Tile, TilePredicate, Unit } from "./types.js";

export function isSelectionAttackTile(
  unit: Unit | null,
  selectedTile: HeightTile | null,
  tile: Tile,
  enemies: Enemy[],
  targets: DamageableEntity[],
  isMovementBlocked: TilePredicate,
): boolean {
  return unit
    ? canPlanAttack(
      unit, tile, targets,
      (candidate) => actionFields(unit, enemies, isMovementBlocked).attack.has(tileKey(candidate)),
    )
    : isEnemyActionTile(selectedTile, tile, enemies, isMovementBlocked, "attack");
}

export function isEnemyActionTile(
  selectedTile: HeightTile | null,
  tile: Tile,
  enemies: Enemy[],
  isMovementBlocked: TilePredicate,
  field: keyof ActionFields,
): boolean {
  if (!selectedTile) return false;
  const enemy = enemies.find((candidate) => sameTile(candidate, selectedTile));

  return Boolean(enemy && actionFields(enemy, enemies, isMovementBlocked)[field].has(tileKey(tile)));
}

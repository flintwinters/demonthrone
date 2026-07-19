import { actionFields, type ActionFields, type MovementPolicy } from "./action-fields.js";
import { canPlanAttack } from "./combat.js";
import { sameTile, tileKey } from "./grid.js";
import type { DamageableEntity, Enemy, HeightTile, Tile, Unit } from "./types.js";

export function isSelectionAttackTile(
  unit: Unit | null,
  selectedTile: HeightTile | null,
  tile: Tile,
  enemies: Enemy[],
  targets: DamageableEntity[],
  movementPolicy: MovementPolicy,
): boolean {
  return unit
    ? canPlanAttack(
      unit, tile, targets,
      (candidate) => actionFields(unit, enemies, movementPolicy).attack.has(tileKey(candidate)),
    )
    : isEnemyActionTile(selectedTile, tile, enemies, movementPolicy, "attack");
}

export function isEnemyActionTile(
  selectedTile: HeightTile | null,
  tile: Tile,
  enemies: Enemy[],
  movementPolicy: MovementPolicy,
  field: keyof ActionFields,
): boolean {
  if (!selectedTile) return false;
  const enemy = enemies.find((candidate) => sameTile(candidate, selectedTile));

  return Boolean(enemy && actionFields(enemy, enemies, movementPolicy)[field].has(tileKey(tile)));
}

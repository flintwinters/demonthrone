import { actionFields, type ActionFields, type MovementPolicy } from "./action-fields.js";
import { canPlanAttack } from "./combat.js";
import { entityAtTile, tileKey } from "./grid.js";
import type { GameState } from "./game-state.js";
import type { DamageableEntity, HeightTile, Tile, Unit } from "./types.js";

export function isSelectionAttackTile(
  unit: Unit | null,
  selectedTile: HeightTile | null,
  tile: Tile,
  game: GameState,
  targets: DamageableEntity[],
  movementPolicy: MovementPolicy,
): boolean {
  return unit
    ? canPlanAttack(
      unit, tile, targets,
      (candidate) => actionFields(unit, game, movementPolicy).attack.has(tileKey(candidate)),
    )
    : isEnemyActionTile(selectedTile, tile, game, movementPolicy, "attack");
}

export function isEnemyActionTile(
  selectedTile: HeightTile | null,
  tile: Tile,
  game: GameState,
  movementPolicy: MovementPolicy,
  field: keyof ActionFields,
): boolean {
  if (!selectedTile) return false;
  const enemy = entityAtTile(game.enemies, selectedTile);

  return Boolean(enemy && actionFields(enemy, game, movementPolicy)[field].has(tileKey(tile)));
}

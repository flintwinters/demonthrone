import { actionFields } from "./action-fields.js";
import { canPlanAttack } from "./combat.js";
import { sameTile, tileKey } from "./grid.js";
export function isSelectionAttackTile(unit, selectedTile, tile, enemies, targets, isMovementBlocked) {
    return unit
        ? canPlanAttack(unit, tile, targets, (candidate) => actionFields(unit, enemies, isMovementBlocked).attack.has(tileKey(candidate)))
        : isEnemyActionTile(selectedTile, tile, enemies, isMovementBlocked, "attack");
}
export function isEnemyActionTile(selectedTile, tile, enemies, isMovementBlocked, field) {
    if (!selectedTile)
        return false;
    const enemy = enemies.find((candidate) => sameTile(candidate, selectedTile));
    return Boolean(enemy && actionFields(enemy, enemies, isMovementBlocked)[field].has(tileKey(tile)));
}

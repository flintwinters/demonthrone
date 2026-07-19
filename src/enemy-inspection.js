import { actionFields } from "./action-fields.js";
import { canPlanAttack } from "./combat.js";
import { sameTile, tileKey } from "./grid.js";
export function isSelectionAttackTile(unit, selectedTile, tile, enemies, targets, movementPolicy) {
    return unit
        ? canPlanAttack(unit, tile, targets, (candidate) => actionFields(unit, enemies, movementPolicy).attack.has(tileKey(candidate)))
        : isEnemyActionTile(selectedTile, tile, enemies, movementPolicy, "attack");
}
export function isEnemyActionTile(selectedTile, tile, enemies, movementPolicy, field) {
    if (!selectedTile)
        return false;
    const enemy = enemies.find((candidate) => sameTile(candidate, selectedTile));
    return Boolean(enemy && actionFields(enemy, enemies, movementPolicy)[field].has(tileKey(tile)));
}

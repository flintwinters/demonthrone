import { actionFields } from "./action-fields.js";
import { canPlanAttack } from "./combat.js";
import { sameTile, tileKey } from "./grid.js";
export function isSelectionAttackTile(unit, selectedTile, tile, game, targets, movementPolicy) {
    return unit
        ? canPlanAttack(unit, tile, targets, (candidate) => actionFields(unit, game, movementPolicy).attack.has(tileKey(candidate)))
        : isEnemyActionTile(selectedTile, tile, game, movementPolicy, "attack");
}
export function isEnemyActionTile(selectedTile, tile, game, movementPolicy, field) {
    if (!selectedTile)
        return false;
    const enemy = game.enemies.find((candidate) => sameTile(candidate, selectedTile));
    return Boolean(enemy && actionFields(enemy, game, movementPolicy)[field].has(tileKey(tile)));
}

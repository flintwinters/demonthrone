import { actionFields } from "./action-fields.js";
import { canPlanAttack } from "./combat.js";
import { entityAtTile, tileKey } from "./grid.js";
export function isSelectionAttackTile(unit, selectedTile, tile, game, targets, movementPolicy) {
    return unit
        ? canPlanAttack(unit, tile, targets, (candidate) => actionFields(unit, game, movementPolicy).attack.has(tileKey(candidate)))
        : isEnemyActionTile(selectedTile, tile, game, movementPolicy, "attack");
}
export function isEnemyActionTile(selectedTile, tile, game, movementPolicy, field) {
    if (!selectedTile)
        return false;
    const enemy = entityAtTile(game.enemies, selectedTile);
    return Boolean(enemy && actionFields(enemy, game, movementPolicy)[field].has(tileKey(tile)));
}

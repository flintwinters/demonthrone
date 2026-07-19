import { visibilityState } from "./visibility/index.js";
import { sightGeometry } from "./constants.js";
import { tileKey } from "./grid.js";
import { reachableTileKeys } from "./movement.js";
import { shadowcastTiles } from "./visibility/index.js";
import { sightContext } from "./visibility/index.js";
import { isBoulderTile, movementCost, tileHeight } from "./world/index.js";
import { lineOfSightConfig } from "./world-config.js";
let cached = null;
export function actionFields(unit, game, movementPolicy) {
    const signature = actionFieldSignature(unit, game, movementPolicy.key);
    if (cached?.signature === signature)
        return cached.fields;
    const context = sightContext(visibilityState(game.units, game.enemies).blockers, () => 1, tileHeight, isBoulderTile, lineOfSightConfig.attackHeightMultiplier);
    const movement = reachableTileKeys(unit, unit.movement, movementPolicy.isBlocked, tileHeight, movementCost);
    const attack = new Set(shadowcastTiles(unit, unit.attackRange, context, sightGeometry.eyeHeight).map(tileKey));
    const fields = { movement, attack };
    cached = { signature, fields };
    return fields;
}
function actionFieldSignature(unit, game, movementPolicyKey) {
    return [
        movementPolicyKey, unit.id, unit.x, unit.y, unit.movement, unit.attackRange,
        ...[...game.units, ...game.enemies, ...game.pushables].map(entitySignature),
    ].join(";");
}
function entitySignature(entity) {
    const target = "target" in entity ? entity.target : null;
    return `${entity.id}:${entity.x}:${entity.y}:${target?.x ?? ""}:${target?.y ?? ""}`;
}

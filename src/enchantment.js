import { cardinalDirections, l1Distance, neighborTile } from "./grid.js";
import { pushableAt, pushables } from "./pushables.js";
const maxUpwardChaseHeight = 2;
export function toggleEnchantment(tile, unit) {
    const pushable = pushableAt(tile);
    if (!pushable) {
        return false;
    }
    pushable.enchanterUnitId = pushable.enchanterUnitId === unit.id ? null : unit.id;
    return true;
}
export function chaseEnchanters(units, alreadyMoved, isBlocked, tileHeight) {
    for (const pushable of pushables) {
        const enchanter = units.find((unit) => unit.id === pushable.enchanterUnitId);
        if (enchanter && !alreadyMoved.has(pushable.id)) {
            moveToward(pushable, enchanter, isBlocked, tileHeight);
        }
    }
}
function moveToward(pushable, enchanter, isBlocked, tileHeight) {
    const destination = cardinalDirections
        .map((direction) => neighborTile(pushable, direction))
        .find((tile) => isChaseStep(pushable, tile, enchanter, isBlocked, tileHeight));
    if (destination) {
        pushable.x = destination.x;
        pushable.y = destination.y;
    }
}
function isChaseStep(pushable, tile, enchanter, isBlocked, tileHeight) {
    return l1Distance(tile, enchanter) < l1Distance(pushable, enchanter)
        && !isBlocked(tile)
        && tileHeight(tile) - tileHeight(pushable) <= maxUpwardChaseHeight;
}

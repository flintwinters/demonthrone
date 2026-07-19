import { entityAtTile, l1Distance, neighborTile } from "./grid.js";
import { PushableTemplate } from "./domain.js";
import { pushableConfig } from "./world-config.js";
const crateTemplate = new PushableTemplate(pushableConfig.type, pushableConfig.infoText, pushableConfig.health);
export const pushables = [];
export function createPushable(id, tile) {
    return crateTemplate.create(id, tile);
}
export function pushableAt(tile) {
    return entityAtTile(pushables, tile);
}
export function isPushableTile(tile) {
    return pushableAt(tile) !== null;
}
export function canPushTo(unit, tile, isBlocked, tileHeight) {
    const pushable = pushableAt(tile);
    if (!pushable
        || (pushable.pushedByUnitId !== null && pushable.pushedByUnitId !== unit.id)
        || l1Distance(tile, unit) !== 1) {
        return false;
    }
    const destination = pushDestination(unit, pushable);
    return !isBlocked(destination)
        && isValidPushHeight(tileHeight(pushable), tileHeight(destination));
}
export function planPush(unit, tile, isBlocked, tileHeight) {
    clearPlannedPush(unit.id);
    const pushable = pushableAt(tile);
    if (!pushable || !canPushTo(unit, tile, isBlocked, tileHeight)) {
        return false;
    }
    pushable.target = pushDestination(unit, pushable);
    pushable.pushedByUnitId = unit.id;
    return true;
}
export function clearPlannedPush(unitId) {
    const pushable = pushables.find((candidate) => candidate.pushedByUnitId === unitId);
    if (pushable) {
        pushable.target = null;
        pushable.pushedByUnitId = null;
    }
}
export function commitPlannedPushes() {
    for (const pushable of pushables) {
        if (pushable.target) {
            pushable.x = pushable.target.x;
            pushable.y = pushable.target.y;
        }
        pushable.target = null;
        pushable.pushedByUnitId = null;
    }
}
function pushDestination(unit, pushable) {
    return neighborTile(pushable, {
        x: pushable.x - unit.x,
        y: pushable.y - unit.y,
    });
}
function isValidPushHeight(current, destination) {
    const heightChange = destination - current;
    return heightChange >= 0 && heightChange <= pushableConfig.maxUpwardPushHeight;
}

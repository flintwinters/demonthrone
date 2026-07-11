import { neighborTile, sameTile } from "./grid.js";
const maxUpwardPushHeight = 2;
export const pushables = [
    pushable("crate-one", { x: 5, y: 8 }),
    pushable("crate-two", { x: 9, y: 6 }),
];
export function pushableAt(tile) {
    return pushables.find((pushable) => sameTile(pushable, tile)) ?? null;
}
export function isPushableTile(tile) {
    return pushableAt(tile) !== null;
}
export function canPushTo(unit, tile, isBlocked, tileHeight) {
    const pushable = pushableAt(tile);
    if (!pushable
        || (pushable.pushedByUnitId !== null && pushable.pushedByUnitId !== unit.id)
        || Math.abs(tile.x - unit.x) + Math.abs(tile.y - unit.y) !== 1) {
        return false;
    }
    const destination = pushDestination(unit, pushable);
    return !isBlocked(destination)
        && isValidPushHeight(tileHeight(pushable), tileHeight(destination));
}
export function planPush(unit, tile) {
    clearPlannedPush(unit.id);
    const pushable = pushableAt(tile);
    if (pushable) {
        pushable.target = pushDestination(unit, pushable);
        pushable.pushedByUnitId = unit.id;
    }
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
function pushable(id, tile) {
    return { id, ...tile, target: null, pushedByUnitId: null };
}
function pushDestination(unit, pushable) {
    return neighborTile(pushable, {
        x: pushable.x - unit.x,
        y: pushable.y - unit.y,
    });
}
function isValidPushHeight(current, destination) {
    const heightChange = destination - current;
    return heightChange >= 0 && heightChange <= maxUpwardPushHeight;
}

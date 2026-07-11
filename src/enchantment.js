import { sameTile } from "./grid.js";
import { pushables } from "./pushables.js";
export function bindEnchantment(source, target, units) {
    const owner = enchantmentOwner(target, units);
    if (source.enchanterUnitId || source.id === target.id || !owner) {
        return null;
    }
    const displacedFollower = followerOf(target.id);
    source.followsId = target.id;
    source.enchanterUnitId = owner.id;
    if (displacedFollower) {
        displacedFollower.followsId = source.id;
    }
    return owner;
}
export function dispelEnchantment(source, units) {
    const owner = units.find((unit) => unit.id === source.enchanterUnitId) ?? null;
    if (owner) {
        dispelChain(source.id);
    }
    return owner;
}
export function enchantmentOwner(target, units) {
    if (isUnit(target, units)) {
        return target;
    }
    return units.find((unit) => unit.id === target.enchanterUnitId) ?? null;
}
function isUnit(target, units) {
    return units.some((unit) => unit.id === target.id);
}
export function captureFollowerPositions(units) {
    return new Map([...units, ...pushables].map((item) => [item.id, { x: item.x, y: item.y }]));
}
export function followPositionHistory(units, previous) {
    for (const unit of units) {
        followChain(unit, previous);
    }
}
function followChain(parent, previous) {
    const follower = pushables.find((pushable) => pushable.followsId === parent.id);
    const priorParent = previous.get(parent.id);
    if (!follower || !priorParent) {
        return;
    }
    if (!sameTile(parent, priorParent)) {
        follower.x = priorParent.x;
        follower.y = priorParent.y;
    }
    followChain(follower, previous);
}
function dispelChain(pushableId) {
    const pushable = pushables.find((candidate) => candidate.id === pushableId);
    if (!pushable) {
        return;
    }
    const follower = followerOf(pushable.id);
    pushable.followsId = null;
    pushable.enchanterUnitId = null;
    if (follower) {
        dispelChain(follower.id);
    }
}
function followerOf(id) {
    return pushables.find((pushable) => pushable.followsId === id) ?? null;
}

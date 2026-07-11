import { sameTile } from "./grid.js";
import { pushableAt, pushables } from "./pushables.js";
export function toggleEnchantment(tile, unit) {
    const pushable = pushableAt(tile);
    if (!pushable) {
        return false;
    }
    if (pushable.enchanterUnitId === unit.id) {
        dispelChain(pushable.id);
    }
    else {
        pushable.followsId = chainTailId(unit.id);
        assignChainOwner(pushable.id, unit.id);
    }
    return true;
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
function chainTailId(rootId) {
    let tailId = rootId;
    let follower = followerOf(tailId);
    while (follower) {
        tailId = follower.id;
        follower = followerOf(tailId);
    }
    return tailId;
}
function assignChainOwner(pushableId, unitId) {
    const pushable = pushables.find((candidate) => candidate.id === pushableId);
    if (pushable) {
        pushable.enchanterUnitId = unitId;
        const follower = followerOf(pushable.id);
        if (follower) {
            assignChainOwner(follower.id, unitId);
        }
    }
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

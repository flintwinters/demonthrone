import { cardinalDirections, neighborTile, sameTile, tileKey } from "./grid.js";
const maxUpwardStepHeight = 2;
export function canReachTile(start, target, limit, isBlockedTile, tileHeight, movementCost) {
    const frontier = [{ tile: start, cost: 0 }];
    const bestCosts = new Map([[tileKey(start), 0]]);
    while (frontier.length > 0) {
        const current = takeCheapest(frontier);
        if (sameTile(current.tile, target)) {
            return current.cost > 0;
        }
        appendReachableNeighbors(current, limit, isBlockedTile, tileHeight, movementCost, bestCosts, frontier);
    }
    return false;
}
export function movementStepCost(previous, tile, tileHeight, movementCost) {
    const heightDelta = tileHeight(tile) - tileHeight(previous);
    return movementCost(tile) * 2 ** heightDelta;
}
function appendReachableNeighbors(current, limit, isBlockedTile, tileHeight, movementCost, bestCosts, frontier) {
    for (const direction of cardinalDirections) {
        const tile = neighborTile(current.tile, direction);
        const cost = current.cost + movementStepCost(current.tile, tile, tileHeight, movementCost);
        if (isReachableStep(current.tile, tile, cost, limit, isBlockedTile, tileHeight, bestCosts)) {
            bestCosts.set(tileKey(tile), cost);
            frontier.push({ tile, cost });
        }
    }
}
function isReachableStep(previous, tile, cost, limit, isBlockedTile, tileHeight, bestCosts) {
    return cost <= limit
        && cost < (bestCosts.get(tileKey(tile)) ?? Number.POSITIVE_INFINITY)
        && !isBlockedTile(tile)
        && tileHeight(tile) - tileHeight(previous) <= maxUpwardStepHeight;
}
function takeCheapest(frontier) {
    let cheapestIndex = 0;
    for (let index = 1; index < frontier.length; index += 1) {
        if (frontier[index].cost < frontier[cheapestIndex].cost) {
            cheapestIndex = index;
        }
    }
    return frontier.splice(cheapestIndex, 1)[0];
}

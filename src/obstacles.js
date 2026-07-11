import { isObstacleTile as blocksMovement } from "./world.js";
import { isPushableTile } from "./pushables.js";
export function isObstacleTile(tile) {
    return blocksMovement(tile);
}
export function isBoardObstacle(tile) {
    return isObstacleTile(tile) || isPushableTile(tile);
}

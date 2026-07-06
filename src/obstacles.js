import { isObstacleTile as blocksMovement } from "./world.js";
export function isObstacleTile(tile) {
    return blocksMovement(tile);
}

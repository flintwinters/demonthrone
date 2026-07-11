import { isObstacleTile as blocksMovement } from "./world.js";
import { isPushableTile } from "./pushables.js";
import type { Tile } from "./types.js";

export function isObstacleTile(tile: Tile): boolean {
  return blocksMovement(tile);
}

export function isBoardObstacle(tile: Tile): boolean {
  return isObstacleTile(tile) || isPushableTile(tile);
}

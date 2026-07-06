import { isObstacleTile as blocksMovement } from "./world.js";
import type { Tile } from "./types.js";

export function isObstacleTile(tile: Tile): boolean {
  return blocksMovement(tile);
}

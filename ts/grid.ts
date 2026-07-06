import type { Tile } from "./types.js";

export function l1Distance(first: Tile, second: Tile): number {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

export function tileKey(tile: Tile): string {
  return `${tile.x}:${tile.y}`;
}

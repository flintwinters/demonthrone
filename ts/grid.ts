import type { Tile } from "./types.js";

export const cardinalDirections: readonly Tile[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function l1Distance(first: Tile, second: Tile): number {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

export function neighborTile(tile: Tile, direction: Tile): Tile {
  return {
    x: tile.x + direction.x,
    y: tile.y + direction.y,
  };
}

export function sameTile(first: Tile | null, second: Tile | null): boolean {
  return first?.x === second?.x && first?.y === second?.y;
}

export function tileKey(tile: Tile): string {
  return `${tile.x}:${tile.y}`;
}

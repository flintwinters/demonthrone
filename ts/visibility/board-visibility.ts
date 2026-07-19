import { tileKey } from "../grid.js";
import { characterSightBlockers } from "./visibility.js";
import { visibleTiles } from "./tiles.js";
import { units } from "../units.js";
import { isBoulderTile, sightCost, tileHeight } from "../world/index.js";
import { gameOverConfig, lineOfSightConfig } from "../world-config.js";
import type { Enemy, SightBlocker, Tile, TileSightCost } from "../types.js";

export type VisibilityState = {
  tiles: Tile[];
  keys: Set<string>;
  blockers: SightBlocker[];
};

let cached: { signature: string; state: VisibilityState } | null = null;

export function visibilityState(enemies: Enemy[], revealCenter: Tile | null = null): VisibilityState {
  const signature = revealCenter ? `defeat:${tileKey(revealCenter)}` : visibilitySignature(enemies);

  if (cached?.signature === signature) return cached.state;
  const blockers = characterSightBlockers([...units, ...enemies], tileHeight);
  const tiles = revealCenter
    ? circularTiles(revealCenter, gameOverConfig.revealRadius)
    : visibleTiles(units, blockers, enemyObscuredSightCost(enemies), tileHeight, isBoulderTile);
  const state = { tiles, keys: new Set(tiles.map(tileKey)), blockers };

  cached = { signature, state };
  return state;
}

export function enemyObscuredSightCost(
  enemies: readonly Tile[],
  baseSightCost: TileSightCost = sightCost,
): TileSightCost {
  const occupied = new Set(enemies.map(tileKey));

  return (tile) => baseSightCost(tile) * (
    occupied.has(tileKey(tile)) ? lineOfSightConfig.enemySightCostMultiplier : 1
  );
}

export function circularTiles(center: Tile, radius: number): Tile[] {
  const tiles: Tile[] = [];

  for (let y = center.y - radius; y <= center.y + radius; y += 1) {
    for (let x = center.x - radius; x <= center.x + radius; x += 1) {
      if (Math.hypot(x - center.x, y - center.y) <= radius) tiles.push({ x, y });
    }
  }
  return tiles;
}

function visibilitySignature(enemies: Enemy[]): string {
  return [...units, ...enemies]
    .map((character) => `${character.id}:${character.x}:${character.y}:${character.sight}:${character.health}`)
    .join(";");
}

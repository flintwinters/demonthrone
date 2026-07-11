import { sightGeometry, terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { visibleTiles } from "./tiles.js";
import { units } from "./units.js";
import { isBoulderTile, sightCost, tileHeight } from "./world.js";
import type { Enemy, SightBlocker, Tile } from "./types.js";

export type VisibilityState = {
  tiles: Tile[];
  keys: Set<string>;
  blockers: SightBlocker[];
};

let cached: { signature: string; state: VisibilityState } | null = null;

export function visibilityState(enemies: Enemy[]): VisibilityState {
  const signature = visibilitySignature(enemies);

  if (cached?.signature === signature) return cached.state;
  const blockers = sightBlockers(enemies);
  const tiles = visibleTiles(units, blockers, sightCost, tileHeight, isBoulderTile);
  const state = { tiles, keys: new Set(tiles.map(tileKey)), blockers };

  cached = { signature, state };
  return state;
}

function sightBlockers(enemies: Enemy[]): SightBlocker[] {
  return [...units, ...enemies].map((character) => {
    const ground = tileHeight(character) * terrainHeight.visualScale;

    return {
      x: character.x,
      y: character.y,
      bottom: ground + sightGeometry.characterBottom,
      top: ground + sightGeometry.characterTop,
    };
  });
}

function visibilitySignature(enemies: Enemy[]): string {
  return [...units, ...enemies]
    .map((character) => `${character.id}:${character.x}:${character.y}:${character.sight}:${character.health}`)
    .join(";");
}

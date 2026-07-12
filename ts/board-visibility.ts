import { sightGeometry, terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { visibleTiles } from "./tiles.js";
import { units } from "./units.js";
import { isBoulderTile, sightCost, tileHeight } from "./world.js";
import { gameOverConfig } from "./world-config.js";
import { enemyConfigs } from "./world-config.js";
import type { Enemy, SightBlocker, Tile, Unit } from "./types.js";

export type VisibilityState = {
  tiles: Tile[];
  keys: Set<string>;
  blockers: SightBlocker[];
};

let cached: { signature: string; state: VisibilityState } | null = null;

export function visibilityState(enemies: Enemy[], revealCenter: Tile | null = null): VisibilityState {
  const signature = revealCenter ? `defeat:${tileKey(revealCenter)}` : visibilitySignature(enemies);

  if (cached?.signature === signature) return cached.state;
  const blockers = sightBlockers(enemies);
  const tiles = revealCenter
    ? circularTiles(revealCenter, gameOverConfig.revealRadius)
    : visibleTiles(units, blockers, sightCost, tileHeight, isBoulderTile);
  const state = { tiles, keys: new Set(tiles.map(tileKey)), blockers };

  cached = { signature, state };
  return state;
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

function sightBlockers(enemies: Enemy[]): SightBlocker[] {
  return [...units, ...enemies].map((character) => {
    const ground = tileHeight(character) * terrainHeight.visualScale;

    return {
      x: character.x,
      y: character.y,
      bottom: ground + sightGeometry.characterBottom,
      top: ground + characterSightHeight(character),
    };
  });
}

function characterSightHeight(character: Unit | Enemy): number {
  if (character.entityKind === "teammate") return sightGeometry.characterTop;
  const config = enemyConfigs.find((candidate) => candidate.type === character.entityType);

  if (!config) throw new Error(`Missing enemy config: ${character.entityType}`);
  return config.appearance.height;
}

function visibilitySignature(enemies: Enemy[]): string {
  return [...units, ...enemies]
    .map((character) => `${character.id}:${character.x}:${character.y}:${character.sight}:${character.health}`)
    .join(";");
}

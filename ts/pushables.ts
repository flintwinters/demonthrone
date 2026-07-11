import { NoiseLayer } from "./domain.js";
import { neighborTile, sameTile } from "./grid.js";
import { entitySpawnBounds, perlinPlacementTiles } from "./procedural-placement.js";
import { units } from "./units.js";
import { isObstacleTile } from "./world.js";
import type { Pushable, Tile, TileHeight, TilePredicate, Unit } from "./types.js";

const maxUpwardPushHeight = 2;
const pushableCount = 2;
const pushableHealth = 3;
const pushablePlacementNoise = new NoiseLayer({ scale: 0.17, seed: 0x63726174 });

export const pushables: Pushable[] = perlinPlacementTiles(
  pushableCount,
  entitySpawnBounds,
  pushablePlacementNoise,
  (tile) => !isObstacleTile(tile) && !units.some((unit) => sameTile(unit, tile)),
).map((tile, index) => pushable(`crate-${index + 1}`, tile));

export function pushableAt(tile: Tile): Pushable | null {
  return pushables.find((pushable) => sameTile(pushable, tile)) ?? null;
}

export function isPushableTile(tile: Tile): boolean {
  return pushableAt(tile) !== null;
}

export function canPushTo(
  unit: Unit,
  tile: Tile,
  isBlocked: TilePredicate,
  tileHeight: TileHeight,
): boolean {
  const pushable = pushableAt(tile);

  if (!pushable
    || (pushable.pushedByUnitId !== null && pushable.pushedByUnitId !== unit.id)
    || Math.abs(tile.x - unit.x) + Math.abs(tile.y - unit.y) !== 1) {
    return false;
  }

  const destination = pushDestination(unit, pushable);
  return !isBlocked(destination)
    && isValidPushHeight(tileHeight(pushable), tileHeight(destination));
}

export function planPush(unit: Unit, tile: Tile): void {
  clearPlannedPush(unit.id);
  const pushable = pushableAt(tile);

  if (pushable) {
    pushable.target = pushDestination(unit, pushable);
    pushable.pushedByUnitId = unit.id;
  }
}

export function clearPlannedPush(unitId: string): void {
  const pushable = pushables.find((candidate) => candidate.pushedByUnitId === unitId);

  if (pushable) {
    pushable.target = null;
    pushable.pushedByUnitId = null;
  }
}

export function commitPlannedPushes(): void {
  for (const pushable of pushables) {
    if (pushable.target) {
      pushable.x = pushable.target.x;
      pushable.y = pushable.target.y;
    }

    pushable.target = null;
    pushable.pushedByUnitId = null;
  }

}

function pushable(id: string, tile: Tile): Pushable {
  return { id, ...tile, health: pushableHealth, target: null, pushedByUnitId: null, enchanterUnitId: null, followsId: null };
}

function pushDestination(unit: Tile, pushable: Tile): Tile {
  return neighborTile(pushable, {
    x: pushable.x - unit.x,
    y: pushable.y - unit.y,
  });
}

function isValidPushHeight(current: number, destination: number): boolean {
  const heightChange = destination - current;

  return heightChange >= 0 && heightChange <= maxUpwardPushHeight;
}

import { neighborTile, sameTile } from "./grid.js";
import type { Pushable, Tile, TileHeight, TilePredicate, Unit } from "./types.js";

const maxUpwardPushHeight = 2;

export const pushables: Pushable[] = [
  pushable("crate-one", { x: 5, y: 8 }),
  pushable("crate-two", { x: 9, y: 6 }),
];

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
    && tileHeight(destination) - tileHeight(pushable) <= maxUpwardPushHeight;
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
  return { id, ...tile, target: null, pushedByUnitId: null };
}

function pushDestination(unit: Tile, pushable: Tile): Tile {
  return neighborTile(pushable, {
    x: pushable.x - unit.x,
    y: pushable.y - unit.y,
  });
}

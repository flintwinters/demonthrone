import { cardinalDirections, l1Distance, neighborTile } from "./grid.js";
import { pushableAt, pushables } from "./pushables.js";
import type { Pushable, Tile, TileHeight, TilePredicate, Unit } from "./types.js";

const maxUpwardChaseHeight = 2;

export function toggleEnchantment(tile: Tile, unit: Unit): boolean {
  const pushable = pushableAt(tile);

  if (!pushable) {
    return false;
  }

  pushable.enchanterUnitId = pushable.enchanterUnitId === unit.id ? null : unit.id;
  return true;
}

export function chaseEnchanters(
  units: readonly Unit[],
  alreadyMoved: ReadonlySet<string>,
  isBlocked: TilePredicate,
  tileHeight: TileHeight,
): void {
  for (const pushable of pushables) {
    const enchanter = units.find((unit) => unit.id === pushable.enchanterUnitId);

    if (enchanter && !alreadyMoved.has(pushable.id)) {
      moveToward(pushable, enchanter, isBlocked, tileHeight);
    }
  }
}

function moveToward(
  pushable: Pushable,
  enchanter: Unit,
  isBlocked: TilePredicate,
  tileHeight: TileHeight,
): void {
  const destination = cardinalDirections
    .map((direction) => neighborTile(pushable, direction))
    .find((tile) => isChaseStep(pushable, tile, enchanter, isBlocked, tileHeight));

  if (destination) {
    pushable.x = destination.x;
    pushable.y = destination.y;
  }
}

function isChaseStep(
  pushable: Pushable,
  tile: Tile,
  enchanter: Unit,
  isBlocked: TilePredicate,
  tileHeight: TileHeight,
): boolean {
  return l1Distance(tile, enchanter) < l1Distance(pushable, enchanter)
    && !isBlocked(tile)
    && tileHeight(tile) - tileHeight(pushable) <= maxUpwardChaseHeight;
}

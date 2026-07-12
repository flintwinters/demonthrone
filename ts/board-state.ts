import { visibilityState } from "./board-visibility.js";
import { tileKey } from "./grid.js";
import { isObstacleTile } from "./obstacles.js";
import { pushables } from "./pushables.js";
import { selection, units } from "./units.js";
import { canUnitSeeEntity, sightContext } from "./visibility.js";
import { isBoulderTile, isBrushTile, sightCost, tileHeight } from "./world.js";
import { lineOfSightConfig } from "./world-config.js";
import type {
  BoardState, DamageableEntity, Enemy, HeightTile, RenderEnemy, RenderPushable,
  RenderTombstone, RenderUnit, SelectionArc, Tile, TilePredicate, Unit,
} from "./types.js";

export function boardState(
  selectedTile: HeightTile | null,
  hoveredTile: HeightTile | null,
  enemies: Enemy[],
  tombstones: Tile[],
  isMovementTile: TilePredicate,
  isAttackTile: TilePredicate,
  enchantmentSourceId: string | null = null,
  selectionLines: readonly SelectionArc[] = [],
  revealCenter: Tile | null = null,
): BoardState {
  const visibility = visibilityState(enemies, revealCenter);

  return {
    selectedTile,
    hoveredTile,
    selectionLines,
    units: renderableUnits(),
    visibleTiles: visibility.tiles,
    enemies: renderableEnemies(enemies, visibility.keys),
    sightBlockers: visibility.blockers,
    tombstones: renderableTombstones(tombstones, visibility.keys),
    pushables: renderablePushables(visibility.keys, enchantmentSourceId),
    isObstacleTile,
    isBoulderTile,
    isBrushTile,
    sightCost,
    selectedUnitId: selection.unitId,
    tileHeight,
    isMovementTile,
    isAttackTile,
  };
}

function renderablePushables(visible: Set<string>, enchantmentSourceId: string | null): RenderPushable[] {
  return pushables
    .filter((pushable) => visible.has(tileKey(pushable)))
    .map((pushable) => ({
      ...pushable,
      height: tileHeight(pushable),
      isEnchantmentSource: pushable.id === enchantmentSourceId,
      target: pushable.target ? enrichTile(pushable.target) : null,
    }));
}

export function canSeeTile(tile: Tile, enemies: Enemy[], revealCenter: Tile | null = null): boolean {
  return visibilityState(enemies, revealCenter).keys.has(tileKey(tile));
}

export function canUnitSee(unit: Unit, target: DamageableEntity, enemies: Enemy[]): boolean {
  return canUnitSeeEntity(unit, target, sightContext(
    visibilityState(enemies).blockers,
    sightCost,
    tileHeight,
    isBoulderTile,
    lineOfSightConfig.visionHeightMultiplier,
  ));
}

export function enrichTile(tile: Tile): HeightTile {
  return { ...tile, height: tileHeight(tile) };
}

function renderableUnits(): RenderUnit[] {
  return units.map((unit) => ({
    ...unit,
    height: tileHeight(unit),
    target: unit.target ? enrichTile(unit.target) : null,
  }));
}

function renderableEnemies(enemies: Enemy[], visible: Set<string>): RenderEnemy[] {
  return enemies
    .filter((enemy) => visible.has(tileKey(enemy)))
    .map((enemy) => ({ ...enemy, height: tileHeight(enemy) }));
}

function renderableTombstones(tombstones: Tile[], visible: Set<string>): RenderTombstone[] {
  return tombstones
    .filter((tombstone) => visible.has(tileKey(tombstone)))
    .map((tombstone) => ({ ...tombstone, height: tileHeight(tombstone) }));
}

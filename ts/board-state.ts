import { visibilityState } from "./visibility/index.js";
import { tileKey } from "./grid.js";
import type { GameState } from "./game-state.js";
import { isObstacleTile } from "./obstacles.js";
import { canUnitSeeEntity, sightContext } from "./visibility/index.js";
import { isBoulderTile, isBrushTile, sightCost, tileHeight } from "./world/index.js";
import { lineOfSightConfig } from "./world-config.js";
import type {
  BoardState, DamageableEntity, Enemy, HeightTile, RenderEnemy, RenderPushable,
  RenderTombstone, RenderUnit, SelectionArc, Tile, TilePredicate, Unit,
} from "./types.js";

export function boardState(
  game: GameState,
  isMovementTile: TilePredicate,
  isAttackTile: TilePredicate,
  enchantmentSourceId: string | null = null,
  selectionLines: readonly SelectionArc[] = [],
  revealCenter: Tile | null = null,
): BoardState {
  const visibility = visibilityState(game.units, game.enemies, revealCenter);

  return {
    selectedTile: game.selectedTile,
    hoveredTile: game.hoveredTile,
    selectionLines,
    units: renderableUnits(game),
    visibleTiles: visibility.tiles,
    enemies: renderableEnemies(game.enemies, visibility.keys),
    sightBlockers: visibility.blockers,
    tombstones: renderableTombstones(game.tombstones, visibility.keys),
    pushables: renderablePushables(game, visibility.keys, enchantmentSourceId),
    isObstacleTile,
    isBoulderTile,
    isBrushTile,
    sightCost,
    selectedUnitId: game.selection.unitId,
    tileHeight,
    isMovementTile,
    isAttackTile,
  };
}

function renderablePushables(
  game: GameState,
  visible: Set<string>,
  enchantmentSourceId: string | null,
): RenderPushable[] {
  return game.pushables
    .filter((pushable) => visible.has(tileKey(pushable)))
    .map((pushable) => ({
      ...pushable,
      height: tileHeight(pushable),
      isEnchantmentSource: pushable.id === enchantmentSourceId,
      target: pushable.target ? enrichTile(pushable.target) : null,
    }));
}

export function canSeeTile(tile: Tile, game: GameState, revealCenter: Tile | null = null): boolean {
  return visibilityState(game.units, game.enemies, revealCenter).keys.has(tileKey(tile));
}

export function canUnitSee(unit: Unit, target: DamageableEntity, game: GameState): boolean {
  return canUnitSeeEntity(unit, target, sightContext(
    visibilityState(game.units, game.enemies).blockers,
    sightCost,
    tileHeight,
    isBoulderTile,
    lineOfSightConfig.visionHeightMultiplier,
  ));
}

export function enrichTile(tile: Tile): HeightTile {
  return { ...tile, height: tileHeight(tile) };
}

function renderableUnits(game: GameState): RenderUnit[] {
  return game.units.map((unit) => ({
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

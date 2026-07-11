import { isObstacleTile } from "./obstacles.js";
import { pushables } from "./pushables.js";
import { isBrushTile, sightCost, tileHeight } from "./world.js";
import { selection, units } from "./units.js";
import { isVisibleTile } from "./visibility.js";
import type { BoardState, Enemy, HeightTile, RenderEnemy, RenderPushable, RenderTombstone, RenderUnit, Tile, TilePredicate } from "./types.js";

export function boardState(
  selectedTile: HeightTile | null,
  hoveredTile: HeightTile | null,
  enemies: Enemy[],
  tombstones: Tile[],
  isMovementTile: TilePredicate,
): BoardState {
  return {
    selectedTile,
    hoveredTile,
    units: renderableUnits(),
    enemies: renderableEnemies(enemies),
    sightBlockers: sightBlockers(enemies),
    tombstones: renderableTombstones(tombstones, enemies),
    pushables: renderablePushables(),
    isObstacleTile,
    isBrushTile,
    sightCost,
    selectedUnitId: selection.unitId,
    tileHeight,
    isMovementTile,
  };
}

function renderablePushables(): RenderPushable[] {
  return pushables.map((pushable) => ({
    ...pushable,
    height: tileHeight(pushable),
    target: pushable.target ? enrichTile(pushable.target) : null,
  }));
}

export function canSeeTile(tile: Tile, enemies: Enemy[]): boolean {
  return isVisibleTile(tile, units, sightBlockers(enemies), sightCost, tileHeight);
}

export function enrichTile(tile: Tile): HeightTile {
  return {
    ...tile,
    height: tileHeight(tile),
  };
}

function renderableUnits(): RenderUnit[] {
  return units.map((unit) => ({
    ...unit,
    height: tileHeight(unit),
    target: unit.target ? enrichTile(unit.target) : null,
  }));
}

function renderableEnemies(enemies: Enemy[]): RenderEnemy[] {
  return enemies
    .filter((enemy) => canSeeTile(enemy, enemies))
    .map((enemy) => ({
      ...enemy,
      height: tileHeight(enemy),
    }));
}

function renderableTombstones(tombstones: Tile[], enemies: Enemy[]): RenderTombstone[] {
  return tombstones
    .filter((tombstone) => canSeeTile(tombstone, enemies))
    .map((tombstone) => ({
      ...tombstone,
      height: tileHeight(tombstone),
    }));
}

function sightBlockers(enemies: Enemy[]): Tile[] {
  return [...units, ...enemies];
}

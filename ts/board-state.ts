import { isObstacleTile } from "./obstacles.js";
import { pushables } from "./pushables.js";
import { isBoulderTile, isBrushTile, sightCost, tileHeight } from "./world.js";
import { selection, units } from "./units.js";
import { sightGeometry, terrainHeight } from "./constants.js";
import { canUnitSeeEntity, isVisibleTile, sightContext } from "./visibility.js";
import type { BoardState, DamageableEntity, Enemy, HeightTile, RenderEnemy, RenderPushable, RenderTombstone, RenderUnit, SightBlocker, Tile, TilePredicate, Unit } from "./types.js";

export function boardState(
  selectedTile: HeightTile | null,
  hoveredTile: HeightTile | null,
  enemies: Enemy[],
  tombstones: Tile[],
  isMovementTile: TilePredicate,
  isAttackTile: TilePredicate,
  enchantmentSourceId: string | null = null,
): BoardState {
  return {
    selectedTile,
    hoveredTile,
    units: renderableUnits(),
    enemies: renderableEnemies(enemies),
    sightBlockers: sightBlockers(enemies),
    tombstones: renderableTombstones(tombstones, enemies),
    pushables: renderablePushables(enemies, enchantmentSourceId),
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

function renderablePushables(enemies: Enemy[], enchantmentSourceId: string | null): RenderPushable[] {
  return pushables
    .filter((pushable) => canSeeTile(pushable, enemies))
    .map((pushable) => ({
      ...pushable,
      height: tileHeight(pushable),
      isEnchantmentSource: pushable.id === enchantmentSourceId,
      target: pushable.target ? enrichTile(pushable.target) : null,
    }));
}

export function canSeeTile(tile: Tile, enemies: Enemy[]): boolean {
  return isVisibleTile(tile, units, sightBlockers(enemies), sightCost, tileHeight, isBoulderTile);
}

export function canUnitSee(unit: Unit, target: DamageableEntity, enemies: Enemy[]): boolean {
  return canUnitSeeEntity(unit, target, sightContext(
    sightBlockers(enemies), sightCost, tileHeight, isBoulderTile,
  ));
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

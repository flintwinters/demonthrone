import { sightGeometry, terrainHeight } from "../constants.js";
import { enemyConfigs, lineOfSightConfig } from "../world-config.js";
import { lineSightCost, type SightRayContext } from "./sight-cost.js";
import { tileKey } from "../grid.js";
import type {
  Character, DamageableEntity, Point3, SightBlocker, Tile, TileHeight, TilePredicate, TileSightCost, Unit,
} from "../types.js";

export type SightContext = SightRayContext;

export function isVisibleTile(
  tile: Tile,
  units: Unit[],
  sightBlockers: SightBlocker[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  isBoulderTile: TilePredicate,
): boolean {
  const context = sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile);

  return units.some((unit) => canUnitSeeTile(unit, tile, context));
}

export function canUnitSeeTile(unit: Unit, tile: Tile, context: SightContext): boolean {
  return canSeePoint(unit, tilePoint(tile, context), context);
}

export function canUnitSeeEntity(
  unit: Unit,
  target: DamageableEntity,
  context: SightContext,
): boolean {
  return canSeePoint(unit, entityPoint(target, context), context);
}

export function canCharacterSeeEntity(
  character: Character,
  target: DamageableEntity,
  context: SightContext,
): boolean {
  return canSeePoint(character, entityPoint(target, context), context);
}

export function characterSightBlockers(
  characters: readonly Character[],
  tileHeight: TileHeight,
): SightBlocker[] {
  return characters.map((character) => {
    const ground = visualHeight(tileHeight(character));

    return {
      x: character.x,
      y: character.y,
      bottom: ground + sightGeometry.characterBottom,
      top: ground + characterSightHeight(character),
    };
  });
}

export function sightContext(
  sightBlockers: SightBlocker[],
  sightCost: TileSightCost,
  tileHeight: TileHeight,
  isBoulderTile: TilePredicate,
  heightMultiplier: number = lineOfSightConfig.visionHeightMultiplier,
): SightContext {
  return {
    sightCost,
    tileHeight: (tile) => visualHeight(tileHeight(tile)),
    isBoulderTile,
    blockers: blockerMap(sightBlockers),
    boulderHeight: sightGeometry.boulderHeight,
    heightMultiplier,
  };
}

export function memoizedSightContext(context: SightContext): SightContext {
  return {
    ...context,
    sightCost: memoizedTileValue(context.sightCost),
    tileHeight: memoizedTileValue(context.tileHeight),
    isBoulderTile: memoizedTileValue(context.isBoulderTile),
  };
}

function canSeePoint(character: Character, target: Point3, context: SightContext): boolean {
  const source = pointAbove(character, context, sightGeometry.eyeHeight);
  const horizontal = Math.hypot(target.x - source.x, target.y - source.y);

  return horizontal <= character.sight && lineSightCost(source, target, context) <= character.sight;
}

function tilePoint(tile: Tile, context: SightContext): Point3 {
  return pointAbove(tile, context, sightGeometry.surfaceClearance);
}

function entityPoint(target: DamageableEntity, context: SightContext): Point3 {
  return pointAbove(target, context, sightGeometry.characterTargetHeight);
}

function pointAbove(tile: Tile, context: SightContext, offset: number): Point3 {
  return { x: tile.x + 0.5, y: tile.y + 0.5, z: context.tileHeight(tile) + offset };
}

function blockerMap(blockers: SightBlocker[]): Map<string, SightBlocker[]> {
  const grouped = new Map<string, SightBlocker[]>();

  for (const blocker of blockers) {
    const key = tileKey(blocker);
    grouped.set(key, [...grouped.get(key) ?? [], blocker]);
  }
  return grouped;
}

function memoizedTileValue<Value>(valueAt: (tile: Tile) => Value): (tile: Tile) => Value {
  const values = new Map<string, Value>();

  return (tile) => {
    const key = tileKey(tile);
    const existing = values.get(key);

    if (existing !== undefined) return existing;
    const value = valueAt(tile);

    values.set(key, value);
    return value;
  };
}

function visualHeight(height: number): number {
  return height * terrainHeight.visualScale;
}

function characterSightHeight(character: Character): number {
  if (character.entityKind === "teammate") return sightGeometry.characterTop;
  const config = enemyConfigs.find((candidate) => candidate.type === character.entityType);

  if (!config) throw new Error(`Missing enemy config: ${character.entityType}`);
  return config.appearance.height;
}

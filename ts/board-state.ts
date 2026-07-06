import { isObstacleTile } from "./obstacles.js";
import { isBrushTile, sightCost, tileHeight } from "./world.js";
import { selection, units } from "./units.js";
import { isVisibleTile } from "./visibility.js";
import type { BoardState, Enemy, HeightTile, RenderEnemy, RenderUnit, Tile, TilePredicate } from "./types.js";

export function boardState(
  selectedTile: HeightTile | null,
  hoveredTile: HeightTile | null,
  enemies: Enemy[],
  isMovementTile: TilePredicate,
): BoardState {
  return {
    selectedTile,
    hoveredTile,
    units: renderableUnits(),
    enemies: renderableEnemies(enemies),
    isObstacleTile,
    isBrushTile,
    sightCost,
    selectedUnitId: selection.unitId,
    tileHeight,
    isMovementTile,
    isTileVisible: canSeeTile,
  };
}

export function canSeeTile(tile: Tile): boolean {
  return isVisibleTile(tile, units, sightCost, tileHeight);
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
    .filter(canSeeTile)
    .map((enemy) => ({
      ...enemy,
      height: tileHeight(enemy),
    }));
}

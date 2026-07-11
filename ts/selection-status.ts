import { sameTile } from "./grid.js";
import type { Entity, HeightTile, Tile, Unit } from "./types.js";

type TileEnricher = (tile: Tile) => HeightTile;
type TileInteraction = (tile: HeightTile) => HeightTile | null;

export function selectedEntityAt(tile: Tile | null, entities: readonly Entity[]): Entity | null {
  return tile ? entities.find((entity) => sameTile(entity, tile)) ?? null : null;
}

export function entityStatus(entity: Entity | null): string {
  return entity?.entityType ?? "";
}

export function selectedEntityStatus(
  selectedUnit: Unit | null,
  selectedSource: Entity | null,
  selectedTile: Tile | null,
  entities: readonly Entity[],
): string {
  return entityStatus(selectedUnit ?? selectedSource ?? selectedEntityAt(selectedTile, entities));
}

export function selectVisibleEntityTile(
  tile: Tile,
  units: readonly Unit[],
  entities: readonly Entity[],
  canSee: (tile: Tile) => boolean,
  enrich: TileEnricher,
  interact: TileInteraction,
): HeightTile | null {
  if (!canSee(tile)) {
    return null;
  }

  const clickedUnit = units.some((unit) => sameTile(unit, tile));
  const interactionTile = interact(enrich(tile));

  return interactionTile ?? (!clickedUnit && selectedEntityAt(tile, entities) ? enrich(tile) : null);
}

import { entityAtTile } from "./grid.js";
import type { Entity, HeightTile, Terrain, Tile, Unit } from "./types.js";

type TileEnricher = (tile: Tile) => HeightTile;
type TileInteraction = (tile: HeightTile) => HeightTile | null;

export function selectedEntityAt(tile: Tile | null, entities: readonly Entity[]): Entity | null {
  return entityAtTile(entities, tile);
}

export function entityStatus(entity: Entity | null): string {
  return entity?.infoText ?? "";
}

export function selectedEntityStatus(
  selectedUnit: Unit | null,
  selectedSource: Entity | null,
  selectedTile: Tile | null,
  entities: readonly Entity[],
): string {
  return entityStatus(selectedSource ?? selectedUnit ?? selectedEntityAt(selectedTile, entities));
}

export function selectedObjectStatus(
  selectedUnit: Unit | null,
  selectedSource: Entity | null,
  selectedTile: Tile | null,
  entities: readonly Entity[],
  terrainAt: (tile: Tile) => Terrain,
): string {
  return selectedEntityStatus(selectedUnit, selectedSource, selectedTile, entities)
    || selectedInspectionStatus(selectedTile, entities, terrainAt);
}

function selectedInspectionStatus(
  tile: Tile | null,
  entities: readonly Entity[],
  terrainAt: (tile: Tile) => Terrain,
): string {
  const entity = selectedEntityAt(tile, entities);

  return entity ? entityStatus(entity) : selectedTerrainStatus(tile, terrainAt);
}

function selectedTerrainStatus(
  tile: Tile | null,
  terrainAt: (tile: Tile) => Terrain,
): string {
  return tile ? terrainAt(tile).infoText : "";
}

export function isInspectableTerrain(terrain: Terrain): boolean {
  return terrain.infoText.length > 0;
}

export function selectVisibleEntityTile(
  tile: Tile,
  units: readonly Unit[],
  entities: readonly Entity[],
  canSee: (tile: Tile) => boolean,
  enrich: TileEnricher,
  interact: TileInteraction,
  isInspectableTile: (tile: Tile) => boolean = () => false,
): HeightTile | null {
  if (!canSee(tile)) {
    return null;
  }

  const clickedUnit = entityAtTile(units, tile) !== null;
  const interactionTile = interact(enrich(tile));

  return interactionTile ?? inspectTile(tile, clickedUnit, entities, enrich, isInspectableTile);
}

function inspectTile(
  tile: Tile,
  clickedUnit: boolean,
  entities: readonly Entity[],
  enrich: TileEnricher,
  isInspectableTile: (tile: Tile) => boolean,
): HeightTile | null {
  if (clickedUnit || (!selectedEntityAt(tile, entities) && !isInspectableTile(tile))) {
    return null;
  }

  return enrich(tile);
}

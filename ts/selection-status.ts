import { sameTile } from "./grid.js";
import type { Entity, HeightTile, TerrainKind, Tile, Unit } from "./types.js";

type TileEnricher = (tile: Tile) => HeightTile;
type TileInteraction = (tile: HeightTile) => HeightTile | null;

const terrainInfo: Readonly<Partial<Record<TerrainKind, string>>> = {
  boulder: "boulder",
  brush: "foliage",
  ice: "ice",
  water: "water",
};

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

export function selectedObjectStatus(
  selectedUnit: Unit | null,
  selectedSource: Entity | null,
  selectedTile: Tile | null,
  entities: readonly Entity[],
  terrainKind: (tile: Tile) => TerrainKind,
): string {
  const entity = selectedUnit ?? selectedSource ?? selectedEntityAt(selectedTile, entities);

  return entityStatus(entity) || (selectedTile ? terrainInfo[terrainKind(selectedTile)] ?? "" : "");
}

export function isInspectableTerrain(kind: TerrainKind): boolean {
  return terrainInfo[kind] !== undefined;
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

  const clickedUnit = units.some((unit) => sameTile(unit, tile));
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

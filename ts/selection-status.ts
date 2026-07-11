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
  return entityStatus(selectedSource ?? selectedUnit ?? selectedEntityAt(selectedTile, entities));
}

export function selectedObjectStatus(
  selectedUnit: Unit | null,
  selectedSource: Entity | null,
  selectedTile: Tile | null,
  entities: readonly Entity[],
  terrainKind: (tile: Tile) => TerrainKind,
): string {
  const interaction = interactionStatus(selectedUnit, selectedSource, entities);

  if (interaction) {
    return interaction;
  }

  return selectedInspectionStatus(selectedTile, entities, terrainKind);
}

function selectedInspectionStatus(
  tile: Tile | null,
  entities: readonly Entity[],
  terrainKind: (tile: Tile) => TerrainKind,
): string {
  const entity = selectedEntityAt(tile, entities);

  return entity ? entityStatus(entity) : selectedTerrainStatus(tile, terrainKind);
}

function interactionStatus(
  unit: Unit | null,
  source: Entity | null,
  entities: readonly Entity[],
): string {
  if (source) {
    return enchantmentStatus(source);
  }

  return unit ? unitInteractionStatus(unit, entities) : "";
}

function enchantmentStatus(source: Entity): string {
  if ("enchanterUnitId" in source && source.enchanterUnitId) {
    return `${source.entityType} · click again to unbind · elsewhere cancels`;
  }

  return `${source.entityType} · bind to teammate or green crate · click again to cancel`;
}

function unitInteractionStatus(unit: Unit, entities: readonly Entity[]): string {
  const attackTarget = entities.find((entity) => entity.id === unit.attackTargetId);
  const moveTarget = selectedEntityAt(unit.target, entities);

  if (attackTarget) {
    return `${unit.entityType} · attack ${attackTarget.entityType} · click target or teammate to cancel`;
  }
  if (unit.target) {
    const action = moveTarget?.entityKind === "object" ? "push" : "move";

    return `${unit.entityType} · ${action} planned · click target or teammate to cancel`;
  }
  return `${unit.entityType} · green move · red attack · adjacent crate push`;
}

function selectedTerrainStatus(
  tile: Tile | null,
  terrainKind: (tile: Tile) => TerrainKind,
): string {
  return tile ? terrainInfo[terrainKind(tile)] ?? "" : "";
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

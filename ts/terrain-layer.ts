import * as THREE from "three";
import { terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { terrainBatchSurface } from "./terrain-batch.js";
import { tileStyle } from "./terrain-style.js";
import { boulders, brushPatch, type PropPlacement } from "./terrain-props.js";
import { tileTerrain } from "./world.js";
import { selectionOutlineConfig } from "./selection-visuals.js";
import { selectedOutlineMaterial } from "./render-materials.js";
import type { BiomeKind, BoardState, HeightTile, RenderUnit, Tile } from "./types.js";

export function terrainLayer(boardState: BoardState, tiles: Tile[]): THREE.Group {
  const group = new THREE.Group();
  const levels = tileLevels(boardState, tiles);
  const heights = tileHeights(levels, tiles);

  addTerrainSurfaces(group, boardState, tiles, levels, heights);
  addSelectionOutlines(group, boardState, heights);
  addTerrainProps(group, boardState, tiles);
  return group;
}

function addSelectionOutlines(
  group: THREE.Group,
  boardState: BoardState,
  heights: Map<string, number>,
): void {
  const selectedTiles = selectedOutlineTiles(boardState, heights);

  if (selectedTiles.length === 0) {
    return;
  }

  const selectedGeometry = selectionOutlineGeometry(selectedTiles, heights);

  group.add(new THREE.LineSegments(selectedGeometry, selectedOutlineMaterial));
}

function selectedOutlineTiles(
  boardState: BoardState,
  heights: Map<string, number>,
): Tile[] {
  const keys = new Set<string>();
  const selectedTiles: Tile[] = [];
  const selectedUnit = boardState.units.find((unit) => unit.id === boardState.selectedUnitId);

  appendOutlineTile(boardState.selectedTile, heights, keys, selectedTiles);
  appendOutlineTile(selectedUnit ?? null, heights, keys, selectedTiles);
  return selectedTiles;
}

function appendOutlineTile(
  tile: Tile | null,
  heights: Map<string, number>,
  keys: Set<string>,
  selectedTiles: Tile[],
): void {
  if (!tile) return;
  const key = tileKey(tile);

  if (keys.has(key) || !heights.has(key)) return;
  keys.add(key);
  selectedTiles.push(tile);
}

function selectionOutlineGeometry(selectedTiles: readonly Tile[], heights: Map<string, number>): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const outlineInset = selectionOutlineConfig.edgeInset;
  const outlineZOffset = selectionOutlineConfig.zLift;

  for (const tile of selectedTiles) {
    const height = heights.get(tileKey(tile));

    if (height === undefined) {
      continue;
    }

    const z = height + outlineZOffset;
    const x0 = tile.x - outlineInset;
    const y0 = tile.y - outlineInset;
    const x1 = tile.x + 1 + outlineInset;
    const y1 = tile.y + 1 + outlineInset;

    positions.push(
      x0, y0, z,
      x1, y0, z,
      x1, y0, z,
      x1, y1, z,
      x1, y1, z,
      x0, y1, z,
      x0, y1, z,
      x0, y0, z,
    );
  }

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export function terrainSignature(tiles: Tile[], boardState: BoardState): string {
  return [
    tiles.map((tile) => `${tileKey(tile)}:${boardState.tileHeight(tile)}`).join("|"),
    styleSignature(boardState),
  ].join("#");
}

function addTerrainSurfaces(
  group: THREE.Group,
  boardState: BoardState,
  tiles: Tile[],
  levels: Map<string, number>,
  heights: Map<string, number>,
): void {
  const styles = new Map<string, ReturnType<typeof tileStyle>>();

  for (const tile of tiles) {
    const level = levels.get(tileKey(tile)) ?? 0;

    styles.set(tileKey(tile), tileStyle(tile, boardState, level));
  }

  group.add(terrainBatchSurface(tiles, styles, heights));
}

function styleSignature(boardState: BoardState): string {
  return [
    boardState.selectedUnitId ?? "",
    tileSignature(boardState.selectedTile),
    tileSignature(boardState.hoveredTile),
    unitsSignature(boardState.units),
  ].join("|");
}

function tileSignature(tile: HeightTile | null): string {
  return tile ? `${tile.x}:${tile.y}` : "";
}

function unitsSignature(units: RenderUnit[]): string {
  return units.map(unitStyleSignature).join(";");
}

function unitStyleSignature(unit: RenderUnit): string {
  return [
    unit.id,
    unit.x,
    unit.y,
    tileSignature(unit.target),
    unit.attackTargetId ?? "",
  ].join(":");
}

function addTerrainProps(group: THREE.Group, boardState: BoardState, tiles: Tile[]): void {
  const props = collectProps(boardState, tiles);

  if (props.boulders.length > 0) {
    group.add(boulders(props.boulders));
  }

  for (const [biome, placements] of props.brushes) {
    group.add(brushPatch(biome, placements));
  }
}

function collectProps(
  boardState: BoardState,
  tiles: Tile[],
): { boulders: PropPlacement[]; brushes: Map<BiomeKind, PropPlacement[]> } {
  const props = { boulders: [] as PropPlacement[], brushes: new Map<BiomeKind, PropPlacement[]>() };

  for (const tile of tiles) {
    collectProp(props, boardState, tile);
  }

  return props;
}

function collectProp(
  props: { boulders: PropPlacement[]; brushes: Map<BiomeKind, PropPlacement[]> },
  boardState: BoardState,
  tile: Tile,
): void {
  const height = visualHeight(boardState.tileHeight(tile));
  const placement = { tile, height };

  if (boardState.isBoulderTile(tile)) {
    props.boulders.push(placement);
  }

  if (boardState.isBrushTile(tile)) {
    appendBrush(props.brushes, tileTerrain(tile).biome, placement);
  }
}

function appendBrush(
  brushes: Map<BiomeKind, PropPlacement[]>,
  biome: BiomeKind,
  placement: PropPlacement,
): void {
  const placements = brushes.get(biome) ?? [];

  placements.push(placement);
  brushes.set(biome, placements);
}

function tileLevels(boardState: BoardState, tiles: Tile[]): Map<string, number> {
  return new Map(tiles.map((tile) => [tileKey(tile), boardState.tileHeight(tile)]));
}

function tileHeights(levels: Map<string, number>, tiles: Tile[]): Map<string, number> {
  return new Map(tiles.map((tile) => [tileKey(tile), visualHeight(levels.get(tileKey(tile)) ?? 0)]));
}

function visualHeight(height: number): number {
  return height * terrainHeight.visualScale;
}

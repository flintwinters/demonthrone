import * as THREE from "three";
import { terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { tileBaseStyle } from "./terrain-style.js";
import { terrainSurface } from "./terrain-mesh.js";
import { boulder, brush } from "./terrain-props.js";
import { tileTerrain } from "./world.js";
import type { BoardState, Tile } from "./types.js";

export function terrainLayer(boardState: BoardState, tiles: Tile[]): THREE.Group {
  const group = new THREE.Group();
  const levels = tileLevels(boardState, tiles);
  const heights = tileHeights(levels, tiles);

  addTerrainSurfaces(group, boardState, tiles, levels, heights);
  addTerrainProps(group, boardState, tiles);
  return group;
}

export function terrainSignature(tiles: Tile[], boardState: BoardState): string {
  return tiles.map((tile) => `${tileKey(tile)}:${boardState.tileHeight(tile)}`).join("|");
}

function addTerrainSurfaces(
  group: THREE.Group,
  boardState: BoardState,
  tiles: Tile[],
  levels: Map<string, number>,
  heights: Map<string, number>,
): void {
  for (const tile of tiles) {
    const level = levels.get(tileKey(tile)) ?? 0;
    const height = heights.get(tileKey(tile)) ?? 0;

    group.add(terrainSurface(tile, height, tileBaseStyle(tile, level), heights));
  }
}

function addTerrainProps(group: THREE.Group, boardState: BoardState, tiles: Tile[]): void {
  for (const tile of tiles) {
    addTerrainProp(group, boardState, tile);
  }
}

function addTerrainProp(group: THREE.Group, boardState: BoardState, tile: Tile): void {
  const height = visualHeight(boardState.tileHeight(tile));

  if (boardState.isObstacleTile(tile)) {
    group.add(boulder(tile, height));
  }

  if (boardState.isBrushTile(tile)) {
    group.add(brush(tile, height, tileTerrain(tile).biome));
  }
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

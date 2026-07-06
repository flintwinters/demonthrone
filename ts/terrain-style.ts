import * as THREE from "three";
import { colors, terrainHeight } from "./constants.js";
import type { TerrainStyle } from "./terrain-mesh.js";
import type { BoardState, RenderUnit, Tile } from "./types.js";

export function tileStyle(tile: Tile, boardState: BoardState, level: number): TerrainStyle {
  if (isPlannedMoveTarget(tile, boardState.units)) {
    return terrainStyle(colors.moveTarget, colors.movementTileSideRight, level);
  }

  if (isPlannedMoveStart(tile, boardState.units)) {
    return terrainStyle(colors.moveStart, colors.tileSideRight, level);
  }

  if (sameTile(boardState.selectedTile, tile)) {
    return terrainStyle(colors.selectedTile, colors.tileSideRight, level);
  }

  if (boardState.isMovementTile(tile)) {
    return movementTileStyle(tile, boardState, level);
  }

  if (sameTile(boardState.hoveredTile, tile)) {
    return terrainStyle(colors.hoveredTile, colors.tileSideRight, level);
  }

  return terrainStyle(colors.tile, colors.tileSideRight, level);
}

function movementTileStyle(tile: Tile, boardState: BoardState, level: number): TerrainStyle {
  const top = sameTile(boardState.hoveredTile, tile) ? colors.hoveredMovementTile : colors.movementTile;

  return terrainStyle(top, colors.movementTileSideRight, level);
}

function terrainStyle(top: string, side: string, level: number): TerrainStyle {
  return {
    top: shadeByHeight(top, level, 0),
    side: sideGradient(side, level),
  };
}

function sideGradient(color: string, level: number): readonly [string, string, string, string] {
  return [
    shadeByHeight(color, level, 0.08),
    shadeByHeight(color, level, 0.08),
    shadeByHeight(color, level, -0.14),
    shadeByHeight(color, level, -0.14),
  ];
}

function shadeByHeight(color: string, level: number, offset: number): string {
  const range = Math.max(1, terrainHeight.max - terrainHeight.min);
  const normalized = (level - terrainHeight.min) / range;
  const shade = normalized * 0.1 - 0.03 + offset;
  const base = new THREE.Color(color);
  const target = new THREE.Color(shade >= 0 ? "#ffffff" : "#000000");

  return `#${base.lerp(target, Math.abs(shade)).getHexString()}`;
}

function isPlannedMoveStart(tile: Tile, units: RenderUnit[]): boolean {
  return units.some((unit) => unit.target && sameTile(unit, tile));
}

function isPlannedMoveTarget(tile: Tile, units: RenderUnit[]): boolean {
  return units.some((unit) => unit.target && sameTile(unit.target, tile));
}

function sameTile(first: Tile | null, second: Tile): boolean {
  return first?.x === second.x && first?.y === second.y;
}

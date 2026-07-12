import * as THREE from "three";
import { colors, terrainHeight } from "./constants.js";
import { sameTile } from "./grid.js";
import type { TerrainStyle } from "./terrain-mesh.js";
import { tileBiome, tileTerrain } from "./world.js";
import type { BiomeKind, BoardState, RenderUnit, Tile } from "./types.js";

type BiomeStyle = {
  top: string;
  side: string;
};

const biomeStyles = {
  cinder: {
    top: colors.cinderTile,
    side: colors.cinderTileSide,
  },
  fen: {
    top: colors.fenTile,
    side: colors.fenTileSide,
  },
  heath: {
    top: colors.heathTile,
    side: colors.heathTileSide,
  },
  ridge: {
    top: colors.ridgeTile,
    side: colors.ridgeTileSide,
  },
  bog: {
    top: colors.bogTile,
    side: colors.bogTileSide,
  },
  mesa: {
    top: colors.mesaTile,
    side: colors.mesaTileSide,
  },
} satisfies Record<BiomeKind, BiomeStyle>;

export function tileStyle(tile: Tile, boardState: BoardState, level: number): TerrainStyle {
  const priority = priorityTileStyle(tile, boardState, level);

  if (priority) {
    return priority;
  }

  if (boardState.isAttackTile(tile)) {
    const top = sameTile(boardState.hoveredTile, tile) ? colors.hoveredAttackTile : colors.attackTile;

    return terrainStyle(top, colors.tileSideRight, level);
  }

  if (boardState.isMovementTile(tile)) {
    return movementTileStyle(tile, boardState, level);
  }

  if (sameTile(boardState.hoveredTile, tile)) {
    return terrainStyle(colors.hoveredTile, colors.tileSideRight, level);
  }

  return biomeTerrainStyle(tile, level);
}

function priorityTileStyle(tile: Tile, boardState: BoardState, level: number): TerrainStyle | null {
  if (isPlannedAttackTarget(tile, boardState)) {
    return terrainStyle(colors.attackTarget, colors.tileSideRight, level);
  }

  if (isPlannedMoveTarget(tile, boardState.units)) {
    return terrainStyle(colors.moveTarget, colors.movementTileSideRight, level);
  }

  if (isPlannedMoveStart(tile, boardState.units)) {
    return terrainStyle(colors.moveStart, colors.tileSideRight, level);
  }

  if (sameTile(boardState.selectedTile, tile)) {
    return terrainStyle(colors.selectedTile, colors.tileSideRight, level);
  }

  return null;
}

function isPlannedAttackTarget(tile: Tile, boardState: BoardState): boolean {
  const target = [...boardState.enemies, ...boardState.pushables].find((candidate) => sameTile(candidate, tile));

  return Boolean(target && boardState.units.some((unit) => unit.attackTargetId === target.id));
}

function movementTileStyle(tile: Tile, boardState: BoardState, level: number): TerrainStyle {
  const top = sameTile(boardState.hoveredTile, tile) ? colors.hoveredMovementTile : colors.movementTile;

  return terrainStyle(top, colors.movementTileSideRight, level, colors.movementTileStroke);
}

function biomeTerrainStyle(tile: Tile, level: number): TerrainStyle {
  const terrain = tileTerrain(tile);

  if (terrain.kind === "water") {
    return terrainStyle(colors.waterTile, colors.waterTileSide, level);
  }

  if (terrain.kind === "ice") {
    return terrainStyle(colors.iceTile, colors.iceTileSide, level);
  }

  const style = biomeStyles[tileBiome(tile)];

  return terrainStyle(style.top, style.side, level);
}

function terrainStyle(top: string, side: string, level: number, edge = colors.tileEdge): TerrainStyle {
  return {
    top: shadeByHeight(top, level, 0),
    side: sideGradient(side, level),
    edge,
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

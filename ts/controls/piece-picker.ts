import { screenFromGrid, view } from "./camera.js";
import { terrainHeight } from "../constants.js";
import { piecePickerConfig } from "../world-config.js";
import type { ScreenPoint, Tile, TileHeight, TilePredicate } from "../types.js";

export function pickPieceTile(
  canvas: HTMLCanvasElement,
  point: ScreenPoint,
  pieces: readonly Tile[],
  canSee: TilePredicate,
  tileHeight: TileHeight,
): Tile | null {
  let nearest: Tile | null = null;
  let nearestDistance = Math.max(piecePickerConfig.minimumPickRadius, piecePickerConfig.pickRadius * view.zoom);

  for (const piece of pieces) {
    const distance = screenDistance(point, pieceScreenPoint(canvas, piece, tileHeight));

    if (canSee(piece) && distance < nearestDistance) {
      nearest = piece;
      nearestDistance = distance;
    }
  }

  return nearest ? { x: nearest.x, y: nearest.y } : null;
}

function pieceScreenPoint(canvas: HTMLCanvasElement, piece: Tile, tileHeight: TileHeight): ScreenPoint {
  return screenFromGrid(
    canvas,
    piece.x + 0.5,
    piece.y + 0.5,
    tileHeight(piece) * terrainHeight.visualScale + piecePickerConfig.pieceHeight,
  );
}

function screenDistance(first: ScreenPoint, second: ScreenPoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

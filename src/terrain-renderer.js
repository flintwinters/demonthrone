import { drawVoxelPrimitive, tileDepth, voxelPrimitives } from "./voxel-renderer.js";

const sideNeighbors = [
  { direction: "north", x: 0, y: -1 },
  { direction: "east", x: 1, y: 0 },
  { direction: "south", x: 0, y: 1 },
  { direction: "west", x: -1, y: 0 },
];

export function drawTerrain(canvas, context, boardState, tiles, tileStyle) {
  const tileMap = visibleTileMap(tiles, boardState.tileHeight);
  const orderedTiles = tiles.toSorted((first, second) => tileDepth(canvas, first) - tileDepth(canvas, second));
  const primitives = terrainPrimitives(canvas, boardState, orderedTiles, tileMap, tileStyle);

  primitives.toSorted(comparePrimitiveDepth).forEach((primitive) => drawVoxelPrimitive(context, primitive));
}

function terrainPrimitives(canvas, boardState, tiles, tileMap, tileStyle) {
  const primitives = [];

  for (const gridPoint of tiles) {
    primitives.push(...tilePrimitives(canvas, gridPoint, boardState, tileMap, tileStyle));
  }

  return primitives;
}

function tilePrimitives(canvas, gridPoint, boardState, tileMap, tileStyle) {
  const style = tileStyle(gridPoint, boardState);
  const height = tileMap.get(tileKey(gridPoint));
  const faces = exposedFaces(canvas, gridPoint, height, tileMap);

  return voxelPrimitives(canvas, gridPoint, height, faces, style);
}

function comparePrimitiveDepth(first, second) {
  return first.depth - second.depth || primitivePriority(first) - primitivePriority(second);
}

function primitivePriority(primitive) {
  return primitive.kind === "side" ? 0 : 1;
}

function visibleTileMap(tiles, tileHeight) {
  return new Map(tiles.map((tile) => [tileKey(tile), tileHeight(tile)]));
}

function exposedFaces(canvas, gridPoint, height, tileMap) {
  const depth = tileDepth(canvas, gridPoint);

  return sideNeighbors
    .map((neighbor) => exposedFace(canvas, gridPoint, height, depth, tileMap, neighbor))
    .filter(Boolean);
}

function exposedFace(canvas, gridPoint, height, depth, tileMap, neighbor) {
  const neighborTile = { x: gridPoint.x + neighbor.x, y: gridPoint.y + neighbor.y };
  const neighborHeight = tileMap.get(tileKey(neighborTile));

  if (neighborHeight === undefined || neighborHeight >= height || !isFrontNeighbor(canvas, depth, neighborTile)) {
    return null;
  }

  return {
    direction: neighbor.direction,
    height: neighborHeight,
  };
}

function isFrontNeighbor(canvas, depth, neighborTile) {
  return tileDepth(canvas, neighborTile) > depth;
}

function tileKey(tile) {
  return `${tile.x}:${tile.y}`;
}

import * as THREE from "three";
import { colors } from "./constants.js";
import { tileKey } from "./grid.js";
import { terrainEdgeMaterial, terrainMaterial } from "./render-materials.js";
import type { TerrainStyle } from "./terrain-mesh.js";
import type { Tile } from "./types.js";

type Vertex = readonly [number, number, number];

type FaceBatch = {
  style: string | readonly string[];
  positions: number[];
  colors: number[];
  indices: number[];
};

type TerrainBatches = {
  faces: Map<string, FaceBatch>;
  edges: Map<string, number[]>;
};

type Neighbor = {
  dx: number;
  dy: number;
  face: (tile: Tile, lower: number, upper: number) => readonly Vertex[];
};

const neighbors: readonly Neighbor[] = [
  { dx: 0, dy: -1, face: northFace },
  { dx: 1, dy: 0, face: eastFace },
  { dx: 0, dy: 1, face: southFace },
  { dx: -1, dy: 0, face: westFace },
];

export function terrainBatchSurface(
  tiles: Tile[],
  styles: Map<string, TerrainStyle>,
  heights: Map<string, number>,
): THREE.Group {
  const batches = createBatches(tiles, styles, heights);
  const group = new THREE.Group();

  for (const batch of batches.faces.values()) {
    group.add(faceMesh(batch));
  }

  for (const [color, edges] of batches.edges) {
    group.add(edgeLines(edges, color));
  }
  return group;
}

function createBatches(
  tiles: Tile[],
  styles: Map<string, TerrainStyle>,
  heights: Map<string, number>,
): TerrainBatches {
  const batches: TerrainBatches = { faces: new Map(), edges: new Map() };

  for (const tile of tiles) {
    appendTile(batches, tile, styles.get(tileKey(tile)), heights);
  }

  return batches;
}

function appendTile(
  batches: TerrainBatches,
  tile: Tile,
  style: TerrainStyle | undefined,
  heights: Map<string, number>,
): void {
  const height = heights.get(tileKey(tile)) ?? 0;

  if (!style) {
    return;
  }

  appendFace(batches, topFace(tile, height), style.top, style.edge);
  appendSideFaces(batches, tile, height, style.side, heights);
}

function appendSideFaces(
  batches: TerrainBatches,
  tile: Tile,
  height: number,
  sideStyle: TerrainStyle["side"],
  heights: Map<string, number>,
): void {
  for (const neighbor of neighbors) {
    const lower = heights.get(tileKey({ x: tile.x + neighbor.dx, y: tile.y + neighbor.dy }));

    if (lower === undefined || lower >= height) {
      continue;
    }

    appendFace(batches, neighbor.face(tile, lower, height), sideStyle, colors.tileEdge);
  }
}

function appendFace(
  batches: TerrainBatches,
  vertices: readonly Vertex[],
  style: FaceBatch["style"],
  edgeColor: string,
): void {
  const batch = faceBatch(batches.faces, style);
  const offset = batch.positions.length / 3;

  for (const vertex of vertices) {
    batch.positions.push(...vertex);
  }

  appendFaceColors(batch, style);
  batch.indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  appendEdges(edgeBatch(batches.edges, edgeColor), vertices);
}

function appendFaceColors(batch: FaceBatch, style: FaceBatch["style"]): void {
  if (typeof style === "string") {
    return;
  }

  for (const color of style) {
    batch.colors.push(...new THREE.Color(color).toArray());
  }
}

function appendEdges(edges: number[], vertices: readonly Vertex[]): void {
  appendEdge(edges, vertices[0], vertices[1]);
  appendEdge(edges, vertices[1], vertices[2]);
  appendEdge(edges, vertices[2], vertices[3]);
  appendEdge(edges, vertices[3], vertices[0]);
}

function appendEdge(edges: number[], start: Vertex, end: Vertex): void {
  edges.push(...start, ...end);
}

function edgeBatch(edges: Map<string, number[]>, color: string): number[] {
  const existing = edges.get(color);

  if (existing) {
    return existing;
  }

  const created: number[] = [];

  edges.set(color, created);
  return created;
}

function faceBatch(batches: Map<string, FaceBatch>, style: FaceBatch["style"]): FaceBatch {
  const key = styleKey(style);
  const existing = batches.get(key);

  if (existing) {
    return existing;
  }

  const created = { style, positions: [], colors: [], indices: [] };

  batches.set(key, created);
  return created;
}

function styleKey(style: FaceBatch["style"]): string {
  return typeof style === "string" ? style : "vertex-colors";
}

function faceMesh(batch: FaceBatch): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(batch.positions, 3));
  geometry.setIndex(batch.indices);
  if (batch.colors.length > 0) {
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(batch.colors, 3));
  }
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, terrainMaterial(batch.style));
}

function edgeLines(edges: number[], color: string): THREE.LineSegments {
  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  return new THREE.LineSegments(geometry, terrainEdgeMaterial(color));
}

function topFace(tile: Tile, height: number): readonly Vertex[] {
  return [
    [tile.x, tile.y, height],
    [tile.x + 1, tile.y, height],
    [tile.x + 1, tile.y + 1, height],
    [tile.x, tile.y + 1, height],
  ];
}

function northFace(tile: Tile, lower: number, upper: number): readonly Vertex[] {
  return [
    [tile.x, tile.y, upper],
    [tile.x + 1, tile.y, upper],
    [tile.x + 1, tile.y, lower],
    [tile.x, tile.y, lower],
  ];
}

function eastFace(tile: Tile, lower: number, upper: number): readonly Vertex[] {
  return [
    [tile.x + 1, tile.y, upper],
    [tile.x + 1, tile.y + 1, upper],
    [tile.x + 1, tile.y + 1, lower],
    [tile.x + 1, tile.y, lower],
  ];
}

function southFace(tile: Tile, lower: number, upper: number): readonly Vertex[] {
  return [
    [tile.x + 1, tile.y + 1, upper],
    [tile.x, tile.y + 1, upper],
    [tile.x, tile.y + 1, lower],
    [tile.x + 1, tile.y + 1, lower],
  ];
}

function westFace(tile: Tile, lower: number, upper: number): readonly Vertex[] {
  return [
    [tile.x, tile.y + 1, upper],
    [tile.x, tile.y, upper],
    [tile.x, tile.y, lower],
    [tile.x, tile.y + 1, lower],
  ];
}

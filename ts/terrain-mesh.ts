import * as THREE from "three";
import { tileKey } from "./grid.js";
import { edgeMaterial, terrainMaterial } from "./render-materials.js";
import type { Tile } from "./types.js";

export type SurfaceStyle = string | readonly [string, string, string, string];

export type TerrainStyle = {
  top: SurfaceStyle;
  side: SurfaceStyle;
};

const neighbors = [
  { x: 0, y: -1, face: northFace },
  { x: 1, y: 0, face: eastFace },
  { x: 0, y: 1, face: southFace },
  { x: -1, y: 0, face: westFace },
];

export function terrainSurface(
  tile: Tile,
  height: number,
  style: TerrainStyle,
  tileHeights: Map<string, number>,
): THREE.Group {
  const group = new THREE.Group();

  group.add(surfaceMesh(topFace(tile, height), style.top));
  for (const neighbor of neighbors) {
    appendSideSurface(group, tile, height, style, tileHeights, neighbor);
  }

  return group;
}

function appendSideSurface(
  group: THREE.Group,
  tile: Tile,
  height: number,
  style: TerrainStyle,
  tileHeights: Map<string, number>,
  neighbor: (typeof neighbors)[number],
): void {
  const neighborHeight = tileHeights.get(tileKey({ x: tile.x + neighbor.x, y: tile.y + neighbor.y }));

  if (neighborHeight === undefined || neighborHeight >= height) {
    return;
  }

  group.add(surfaceMesh(neighbor.face(tile, neighborHeight, height), style.side));
}

function surfaceMesh(points: THREE.Vector3[], style: SurfaceStyle): THREE.Group {
  const mesh = new THREE.Mesh(surfaceGeometry(points, style), terrainMaterial(style));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMaterial);
  const group = new THREE.Group();

  group.add(mesh, edges);
  return group;
}

function surfaceGeometry(points: THREE.Vector3[], style: SurfaceStyle): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  if (Array.isArray(style)) {
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(vertexColors(style), 3));
  }
  geometry.computeVertexNormals();
  return geometry;
}

function vertexColors(colors: readonly string[]): number[] {
  return colors.flatMap((color) => new THREE.Color(color).toArray());
}

function topFace(tile: Tile, height: number): THREE.Vector3[] {
  return [
    new THREE.Vector3(tile.x, tile.y, height),
    new THREE.Vector3(tile.x + 1, tile.y, height),
    new THREE.Vector3(tile.x + 1, tile.y + 1, height),
    new THREE.Vector3(tile.x, tile.y + 1, height),
  ];
}

function northFace(tile: Tile, lower: number, upper: number): THREE.Vector3[] {
  return [
    new THREE.Vector3(tile.x, tile.y, upper),
    new THREE.Vector3(tile.x + 1, tile.y, upper),
    new THREE.Vector3(tile.x + 1, tile.y, lower),
    new THREE.Vector3(tile.x, tile.y, lower),
  ];
}

function eastFace(tile: Tile, lower: number, upper: number): THREE.Vector3[] {
  return [
    new THREE.Vector3(tile.x + 1, tile.y, upper),
    new THREE.Vector3(tile.x + 1, tile.y + 1, upper),
    new THREE.Vector3(tile.x + 1, tile.y + 1, lower),
    new THREE.Vector3(tile.x + 1, tile.y, lower),
  ];
}

function southFace(tile: Tile, lower: number, upper: number): THREE.Vector3[] {
  return [
    new THREE.Vector3(tile.x + 1, tile.y + 1, upper),
    new THREE.Vector3(tile.x, tile.y + 1, upper),
    new THREE.Vector3(tile.x, tile.y + 1, lower),
    new THREE.Vector3(tile.x + 1, tile.y + 1, lower),
  ];
}

function westFace(tile: Tile, lower: number, upper: number): THREE.Vector3[] {
  return [
    new THREE.Vector3(tile.x, tile.y + 1, upper),
    new THREE.Vector3(tile.x, tile.y, upper),
    new THREE.Vector3(tile.x, tile.y, lower),
    new THREE.Vector3(tile.x, tile.y + 1, lower),
  ];
}

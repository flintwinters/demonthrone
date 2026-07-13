import * as THREE from "three";
import { colors } from "../constants.js";
import { tileKey } from "../grid.js";
import { terrainEdgeMaterial, terrainMaterial } from "./render-materials.js";
const neighbors = [
    { dx: 0, dy: -1, face: northFace },
    { dx: 1, dy: 0, face: eastFace },
    { dx: 0, dy: 1, face: southFace },
    { dx: -1, dy: 0, face: westFace },
];
export function terrainBatchSurface(tiles, styles, heights) {
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
function createBatches(tiles, styles, heights) {
    const batches = { faces: new Map(), edges: new Map() };
    for (const tile of tiles) {
        appendTile(batches, tile, styles.get(tileKey(tile)), heights);
    }
    return batches;
}
function appendTile(batches, tile, style, heights) {
    const height = heights.get(tileKey(tile)) ?? 0;
    if (!style) {
        return;
    }
    appendFace(batches, topFace(tile, height), style.top, style.edge, style.pattern);
    appendSideFaces(batches, tile, height, style.side, heights, style.pattern);
}
function appendSideFaces(batches, tile, height, sideStyle, heights, pattern) {
    for (const neighbor of neighbors) {
        const lower = heights.get(tileKey({ x: tile.x + neighbor.dx, y: tile.y + neighbor.dy }));
        if (lower === undefined || lower >= height) {
            continue;
        }
        appendFace(batches, neighbor.face(tile, lower, height), sideStyle, colors.tileEdge, pattern);
    }
}
function appendFace(batches, vertices, style, edgeColor, pattern) {
    const batch = faceBatch(batches.faces, style, pattern);
    const offset = batch.positions.length / 3;
    for (const vertex of vertices) {
        batch.positions.push(...vertex);
    }
    appendFaceColors(batch, style);
    batch.uvs.push(...faceUvs(vertices));
    batch.indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
    appendEdges(edgeBatch(batches.edges, edgeColor), vertices);
}
function appendFaceColors(batch, style) {
    if (typeof style === "string") {
        return;
    }
    for (const color of style) {
        batch.colors.push(...new THREE.Color(color).toArray());
    }
}
function appendEdges(edges, vertices) {
    appendEdge(edges, vertices[0], vertices[1]);
    appendEdge(edges, vertices[1], vertices[2]);
    appendEdge(edges, vertices[2], vertices[3]);
    appendEdge(edges, vertices[3], vertices[0]);
}
function appendEdge(edges, start, end) {
    edges.push(...start, ...end);
}
function edgeBatch(edges, color) {
    const existing = edges.get(color);
    if (existing) {
        return existing;
    }
    const created = [];
    edges.set(color, created);
    return created;
}
function faceBatch(batches, style, pattern) {
    const key = `${pattern ?? "plain"}:${styleKey(style)}`;
    const existing = batches.get(key);
    if (existing) {
        return existing;
    }
    const created = { style, positions: [], colors: [], uvs: [], indices: [], pattern };
    batches.set(key, created);
    return created;
}
function styleKey(style) {
    return typeof style === "string" ? style : "vertex-colors";
}
function faceMesh(batch) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(batch.positions, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(batch.uvs, 2));
    geometry.setIndex(batch.indices);
    if (batch.colors.length > 0) {
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(batch.colors, 3));
    }
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, terrainMaterial(batch.style, batch.pattern));
}
function faceUvs(vertices) {
    const isTop = vertices.every((vertex) => vertex[2] === vertices[0][2]);
    const usesX = isTop || vertices.some((vertex) => vertex[0] !== vertices[0][0]);
    return vertices.flatMap((vertex) => [usesX ? vertex[0] : vertex[1], isTop ? vertex[1] : vertex[2]]);
}
function edgeLines(edges, color) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
    return new THREE.LineSegments(geometry, terrainEdgeMaterial(color));
}
function topFace(tile, height) {
    return [
        [tile.x, tile.y, height],
        [tile.x + 1, tile.y, height],
        [tile.x + 1, tile.y + 1, height],
        [tile.x, tile.y + 1, height],
    ];
}
function northFace(tile, lower, upper) {
    return [
        [tile.x, tile.y, upper],
        [tile.x + 1, tile.y, upper],
        [tile.x + 1, tile.y, lower],
        [tile.x, tile.y, lower],
    ];
}
function eastFace(tile, lower, upper) {
    return [
        [tile.x + 1, tile.y, upper],
        [tile.x + 1, tile.y + 1, upper],
        [tile.x + 1, tile.y + 1, lower],
        [tile.x + 1, tile.y, lower],
    ];
}
function southFace(tile, lower, upper) {
    return [
        [tile.x + 1, tile.y + 1, upper],
        [tile.x, tile.y + 1, upper],
        [tile.x, tile.y + 1, lower],
        [tile.x + 1, tile.y + 1, lower],
    ];
}
function westFace(tile, lower, upper) {
    return [
        [tile.x, tile.y + 1, upper],
        [tile.x, tile.y, upper],
        [tile.x, tile.y, lower],
        [tile.x, tile.y + 1, lower],
    ];
}

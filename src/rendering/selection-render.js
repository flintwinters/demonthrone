import * as THREE from "three";
import { terrainHeight } from "../constants.js";
import { tileKey } from "../grid.js";
import { lineMaterial, selectedOutlineMaterial } from "./render-materials.js";
import { material } from "./render-materials.js";
import { parabolicSelectionLineConfig, selectionOutlineConfig } from "../selection-visuals.js";
import { hoveredTileColor } from "./terrain-style.js";
export function addSelectionVisuals(root, boardState) {
    addHoverSurface(root, boardState);
    addSelectionOutlines(root, boardState);
    for (const arc of boardState.selectionLines) {
        const line = new THREE.LineSegments(selectionLineGeometry(arc), lineMaterial(arc.color));
        line.renderOrder = 90;
        root.add(line);
    }
}
function addHoverSurface(root, boardState) {
    const tile = boardState.hoveredTile;
    if (!tile)
        return;
    const color = hoveredTileColor(tile, boardState);
    if (!color)
        return;
    const z = visualHeight(tile.height) + 0.002;
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(tile.x, tile.y, z),
        new THREE.Vector3(tile.x + 1, tile.y, z),
        new THREE.Vector3(tile.x + 1, tile.y + 1, z),
        new THREE.Vector3(tile.x, tile.y + 1, z),
    ]);
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    root.add(new THREE.Mesh(geometry, material(color)));
}
function addSelectionOutlines(root, boardState) {
    const tiles = selectedOutlineTiles(boardState);
    if (tiles.length === 0)
        return;
    const outline = new THREE.LineSegments(selectionOutlineGeometry(tiles), selectedOutlineMaterial);
    outline.renderOrder = 100;
    root.add(outline);
}
function selectedOutlineTiles(boardState) {
    const keys = new Set();
    const tiles = [];
    const unit = boardState.units.find((candidate) => candidate.id === boardState.selectedUnitId);
    appendOutlineTile(boardState.selectedTile, keys, tiles);
    appendOutlineTile(unit ?? null, keys, tiles);
    return tiles;
}
function appendOutlineTile(tile, keys, tiles) {
    if (!tile)
        return;
    const key = tileKey(tile);
    if (keys.has(key))
        return;
    keys.add(key);
    tiles.push(tile);
}
function selectionOutlineGeometry(tiles) {
    const positions = [];
    for (const tile of tiles)
        appendOutline(positions, tile);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}
function appendOutline(positions, tile) {
    const z = visualHeight(tile.height) + selectionOutlineConfig.zLift;
    const x0 = tile.x - selectionOutlineConfig.edgeInset;
    const y0 = tile.y - selectionOutlineConfig.edgeInset;
    const x1 = tile.x + 1 + selectionOutlineConfig.edgeInset;
    const y1 = tile.y + 1 + selectionOutlineConfig.edgeInset;
    positions.push(x0, y0, z, x1, y0, z, x1, y0, z, x1, y1, z, x1, y1, z, x0, y1, z, x0, y1, z, x0, y0, z);
}
function selectionLineGeometry(arc) {
    const positions = [];
    const segments = parabolicSelectionLineConfig.segmentCount;
    const startHeight = visualHeight(arc.start.height) + parabolicSelectionLineConfig.endpointLift;
    const endHeight = visualHeight(arc.end.height) + parabolicSelectionLineConfig.endpointLift;
    const distance = Math.hypot(arc.start.x - arc.end.x, arc.start.y - arc.end.y);
    const peak = parabolicSelectionLineConfig.basePeakHeight + distance * parabolicSelectionLineConfig.distanceScale;
    for (let segment = 0; segment < segments; segment += 1) {
        const start = arcPoint(arc, segment / segments, startHeight, endHeight, peak);
        const end = arcPoint(arc, (segment + 1) / segments, startHeight, endHeight, peak);
        positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}
function arcPoint(arc, t, startHeight, endHeight, peak) {
    const offset = parabolicSelectionLineConfig.centerOffset;
    const x = arc.start.x + offset + (arc.end.x - arc.start.x) * t;
    const y = arc.start.y + offset + (arc.end.y - arc.start.y) * t;
    const base = startHeight + (endHeight - startHeight) * t;
    const height = parabolicSelectionLineConfig.parabolaPeakScale * t * (1 - t) * peak;
    return new THREE.Vector3(x, y, base + height);
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}

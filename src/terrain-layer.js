import * as THREE from "three";
import { terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { terrainBatchSurface } from "./terrain-batch.js";
import { tileStyle } from "./terrain-style.js";
import { boulders, brushPatch } from "./terrain-props.js";
import { tileTerrain } from "./world.js";
import { selectedOutlineMaterial } from "./render-materials.js";
export function terrainLayer(boardState, tiles) {
    const group = new THREE.Group();
    const levels = tileLevels(boardState, tiles);
    const heights = tileHeights(levels, tiles);
    addTerrainSurfaces(group, boardState, tiles, levels, heights);
    addSelectionOutlines(group, boardState, heights);
    addTerrainProps(group, boardState, tiles);
    return group;
}
function addSelectionOutlines(group, boardState, heights) {
    const selectedTiles = selectedOutlineTiles(boardState, heights);
    if (selectedTiles.length === 0) {
        return;
    }
    const selectedGeometry = selectionOutlineGeometry(selectedTiles, heights);
    group.add(new THREE.LineSegments(selectedGeometry, selectedOutlineMaterial));
}
function selectedOutlineTiles(boardState, heights) {
    const keys = new Set();
    const selectedTiles = [];
    const selectedUnit = boardState.units.find((unit) => unit.id === boardState.selectedUnitId);
    appendOutlineTile(boardState.selectedTile, heights, keys, selectedTiles);
    appendOutlineTile(selectedUnit ?? null, heights, keys, selectedTiles);
    return selectedTiles;
}
function appendOutlineTile(tile, heights, keys, selectedTiles) {
    if (!tile)
        return;
    const key = tileKey(tile);
    if (keys.has(key) || !heights.has(key))
        return;
    keys.add(key);
    selectedTiles.push(tile);
}
function selectionOutlineGeometry(selectedTiles, heights) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const outlineOffset = 0.0025;
    for (const tile of selectedTiles) {
        const height = heights.get(tileKey(tile));
        if (height === undefined) {
            continue;
        }
        const z = height + outlineOffset;
        const x = tile.x;
        const y = tile.y;
        positions.push(x, y, z, x + 1, y, z, x + 1, y, z, x + 1, y + 1, z, x + 1, y + 1, z, x, y + 1, z, x, y + 1, z, x, y, z);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}
export function terrainSignature(tiles, boardState) {
    return [
        tiles.map((tile) => `${tileKey(tile)}:${boardState.tileHeight(tile)}`).join("|"),
        styleSignature(boardState),
    ].join("#");
}
function addTerrainSurfaces(group, boardState, tiles, levels, heights) {
    const styles = new Map();
    for (const tile of tiles) {
        const level = levels.get(tileKey(tile)) ?? 0;
        styles.set(tileKey(tile), tileStyle(tile, boardState, level));
    }
    group.add(terrainBatchSurface(tiles, styles, heights));
}
function styleSignature(boardState) {
    return [
        boardState.selectedUnitId ?? "",
        tileSignature(boardState.selectedTile),
        tileSignature(boardState.hoveredTile),
        unitsSignature(boardState.units),
    ].join("|");
}
function tileSignature(tile) {
    return tile ? `${tile.x}:${tile.y}` : "";
}
function unitsSignature(units) {
    return units.map(unitStyleSignature).join(";");
}
function unitStyleSignature(unit) {
    return [
        unit.id,
        unit.x,
        unit.y,
        tileSignature(unit.target),
        unit.attackTargetId ?? "",
    ].join(":");
}
function addTerrainProps(group, boardState, tiles) {
    const props = collectProps(boardState, tiles);
    if (props.boulders.length > 0) {
        group.add(boulders(props.boulders));
    }
    for (const [biome, placements] of props.brushes) {
        group.add(brushPatch(biome, placements));
    }
}
function collectProps(boardState, tiles) {
    const props = { boulders: [], brushes: new Map() };
    for (const tile of tiles) {
        collectProp(props, boardState, tile);
    }
    return props;
}
function collectProp(props, boardState, tile) {
    const height = visualHeight(boardState.tileHeight(tile));
    const placement = { tile, height };
    if (boardState.isBoulderTile(tile)) {
        props.boulders.push(placement);
    }
    if (boardState.isBrushTile(tile)) {
        appendBrush(props.brushes, tileTerrain(tile).biome, placement);
    }
}
function appendBrush(brushes, biome, placement) {
    const placements = brushes.get(biome) ?? [];
    placements.push(placement);
    brushes.set(biome, placements);
}
function tileLevels(boardState, tiles) {
    return new Map(tiles.map((tile) => [tileKey(tile), boardState.tileHeight(tile)]));
}
function tileHeights(levels, tiles) {
    return new Map(tiles.map((tile) => [tileKey(tile), visualHeight(levels.get(tileKey(tile)) ?? 0)]));
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}

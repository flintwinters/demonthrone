import * as THREE from "three";
import { terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { tileBaseStyle } from "./terrain-style.js";
import { terrainSurface } from "./terrain-mesh.js";
import { boulder, brush } from "./terrain-props.js";
import { tileTerrain } from "./world.js";
export function terrainLayer(boardState, tiles) {
    const group = new THREE.Group();
    const levels = tileLevels(boardState, tiles);
    const heights = tileHeights(levels, tiles);
    addTerrainSurfaces(group, boardState, tiles, levels, heights);
    addTerrainProps(group, boardState, tiles);
    return group;
}
export function terrainSignature(tiles, boardState) {
    return tiles.map((tile) => `${tileKey(tile)}:${boardState.tileHeight(tile)}`).join("|");
}
function addTerrainSurfaces(group, boardState, tiles, levels, heights) {
    for (const tile of tiles) {
        const level = levels.get(tileKey(tile)) ?? 0;
        const height = heights.get(tileKey(tile)) ?? 0;
        group.add(terrainSurface(tile, height, tileBaseStyle(tile, level), heights));
    }
}
function addTerrainProps(group, boardState, tiles) {
    for (const tile of tiles) {
        addTerrainProp(group, boardState, tile);
    }
}
function addTerrainProp(group, boardState, tile) {
    const height = visualHeight(boardState.tileHeight(tile));
    if (boardState.isObstacleTile(tile)) {
        group.add(boulder(tile, height));
    }
    if (boardState.isBrushTile(tile)) {
        group.add(brush(tile, height, tileTerrain(tile).biome));
    }
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

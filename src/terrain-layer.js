import * as THREE from "three";
import { terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { terrainBatchSurface } from "./terrain-batch.js";
import { tileBaseStyle } from "./terrain-style.js";
import { boulders, brushPatch } from "./terrain-props.js";
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
    const styles = new Map();
    for (const tile of tiles) {
        const level = levels.get(tileKey(tile)) ?? 0;
        styles.set(tileKey(tile), tileBaseStyle(tile, level));
    }
    group.add(terrainBatchSurface(tiles, styles, heights));
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
    if (boardState.isObstacleTile(tile)) {
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

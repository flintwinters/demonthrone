import * as THREE from "three";
import { colors, terrainHeight } from "./constants.js";
export function tileStyle(tile, boardState, level) {
    if (isPlannedMoveTarget(tile, boardState.units)) {
        return terrainStyle(colors.moveTarget, colors.movementTileSideRight, level);
    }
    if (isPlannedMoveStart(tile, boardState.units)) {
        return terrainStyle(colors.moveStart, colors.tileSideRight, level);
    }
    if (sameTile(boardState.selectedTile, tile)) {
        return terrainStyle(colors.selectedTile, colors.tileSideRight, level);
    }
    if (boardState.isMovementTile(tile)) {
        return movementTileStyle(tile, boardState, level);
    }
    if (sameTile(boardState.hoveredTile, tile)) {
        return terrainStyle(colors.hoveredTile, colors.tileSideRight, level);
    }
    return terrainStyle(colors.tile, colors.tileSideRight, level);
}
function movementTileStyle(tile, boardState, level) {
    const top = sameTile(boardState.hoveredTile, tile) ? colors.hoveredMovementTile : colors.movementTile;
    return terrainStyle(top, colors.movementTileSideRight, level);
}
function terrainStyle(top, side, level) {
    return {
        top: topGradient(top, level),
        side: shadeByHeight(side, level, -0.08),
    };
}
function topGradient(color, level) {
    return [
        shadeByHeight(color, level, 0.08),
        shadeByHeight(color, level, 0.02),
        shadeByHeight(color, level, -0.1),
        shadeByHeight(color, level, -0.04),
    ];
}
function shadeByHeight(color, level, offset) {
    const range = Math.max(1, terrainHeight.max - terrainHeight.min);
    const normalized = (level - terrainHeight.min) / range;
    const shade = normalized * 0.24 - 0.08 + offset;
    const base = new THREE.Color(color);
    const target = new THREE.Color(shade >= 0 ? "#ffffff" : "#000000");
    return `#${base.lerp(target, Math.abs(shade)).getHexString()}`;
}
function isPlannedMoveStart(tile, units) {
    return units.some((unit) => unit.target && sameTile(unit, tile));
}
function isPlannedMoveTarget(tile, units) {
    return units.some((unit) => unit.target && sameTile(unit.target, tile));
}
function sameTile(first, second) {
    return first?.x === second.x && first?.y === second.y;
}

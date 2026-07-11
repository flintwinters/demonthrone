import * as THREE from "three";
import { colors, terrainHeight } from "./constants.js";
import { sameTile } from "./grid.js";
import { tileBiome, tileTerrain } from "./world.js";
const biomeStyles = {
    cinder: {
        top: colors.cinderTile,
        side: colors.cinderTileSide,
    },
    fen: {
        top: colors.fenTile,
        side: colors.fenTileSide,
    },
    heath: {
        top: colors.heathTile,
        side: colors.heathTileSide,
    },
    ridge: {
        top: colors.ridgeTile,
        side: colors.ridgeTileSide,
    },
};
export function tileStyle(tile, boardState, level) {
    const priority = priorityTileStyle(tile, boardState, level);
    if (priority) {
        return priority;
    }
    if (boardState.isAttackTile(tile)) {
        const top = sameTile(boardState.hoveredTile, tile) ? colors.hoveredAttackTile : colors.attackTile;
        return terrainStyle(top, colors.tileSideRight, level);
    }
    if (boardState.isMovementTile(tile)) {
        return movementTileStyle(tile, boardState, level);
    }
    if (sameTile(boardState.hoveredTile, tile)) {
        return terrainStyle(colors.hoveredTile, colors.tileSideRight, level);
    }
    return biomeTerrainStyle(tile, level);
}
function priorityTileStyle(tile, boardState, level) {
    if (isPlannedAttackTarget(tile, boardState)) {
        return terrainStyle(colors.attackTarget, colors.tileSideRight, level);
    }
    if (isPlannedMoveTarget(tile, boardState.units)) {
        return terrainStyle(colors.moveTarget, colors.movementTileSideRight, level);
    }
    if (isPlannedMoveStart(tile, boardState.units)) {
        return terrainStyle(colors.moveStart, colors.tileSideRight, level);
    }
    if (sameTile(boardState.selectedTile, tile)) {
        return terrainStyle(colors.selectedTile, colors.tileSideRight, level);
    }
    return null;
}
function isPlannedAttackTarget(tile, boardState) {
    const enemy = boardState.enemies.find((candidate) => sameTile(candidate, tile));
    return Boolean(enemy && boardState.units.some((unit) => unit.attackTargetId === enemy.id));
}
function movementTileStyle(tile, boardState, level) {
    const top = sameTile(boardState.hoveredTile, tile) ? colors.hoveredMovementTile : colors.movementTile;
    return terrainStyle(top, colors.movementTileSideRight, level);
}
function biomeTerrainStyle(tile, level) {
    const terrain = tileTerrain(tile);
    if (terrain.kind === "water") {
        return terrainStyle(colors.waterTile, colors.waterTileSide, level);
    }
    if (terrain.kind === "ice") {
        return terrainStyle(colors.iceTile, colors.iceTileSide, level);
    }
    const style = biomeStyles[tileBiome(tile)];
    return terrainStyle(style.top, style.side, level);
}
function terrainStyle(top, side, level) {
    return {
        top: shadeByHeight(top, level, 0),
        side: sideGradient(side, level),
    };
}
function sideGradient(color, level) {
    return [
        shadeByHeight(color, level, 0.08),
        shadeByHeight(color, level, 0.08),
        shadeByHeight(color, level, -0.14),
        shadeByHeight(color, level, -0.14),
    ];
}
function shadeByHeight(color, level, offset) {
    const range = Math.max(1, terrainHeight.max - terrainHeight.min);
    const normalized = (level - terrainHeight.min) / range;
    const shade = normalized * 0.1 - 0.03 + offset;
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

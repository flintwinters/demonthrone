import * as THREE from "three";
import { colors, terrainHeight } from "./constants.js";
import { tileBiome } from "./world.js";
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
export function tileBaseStyle(tile, level) {
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

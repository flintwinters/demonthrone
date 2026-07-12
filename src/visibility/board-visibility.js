import { sightGeometry, terrainHeight } from "../constants.js";
import { tileKey } from "../grid.js";
import { visibleTiles } from "./tiles.js";
import { units } from "../units.js";
import { isBoulderTile, sightCost, tileHeight } from "../world/index.js";
import { gameOverConfig } from "../world-config.js";
import { enemyConfigs } from "../world-config.js";
let cached = null;
export function visibilityState(enemies, revealCenter = null) {
    const signature = revealCenter ? `defeat:${tileKey(revealCenter)}` : visibilitySignature(enemies);
    if (cached?.signature === signature)
        return cached.state;
    const blockers = sightBlockers(enemies);
    const tiles = revealCenter
        ? circularTiles(revealCenter, gameOverConfig.revealRadius)
        : visibleTiles(units, blockers, sightCost, tileHeight, isBoulderTile);
    const state = { tiles, keys: new Set(tiles.map(tileKey)), blockers };
    cached = { signature, state };
    return state;
}
export function circularTiles(center, radius) {
    const tiles = [];
    for (let y = center.y - radius; y <= center.y + radius; y += 1) {
        for (let x = center.x - radius; x <= center.x + radius; x += 1) {
            if (Math.hypot(x - center.x, y - center.y) <= radius)
                tiles.push({ x, y });
        }
    }
    return tiles;
}
function sightBlockers(enemies) {
    return [...units, ...enemies].map((character) => {
        const ground = tileHeight(character) * terrainHeight.visualScale;
        return {
            x: character.x,
            y: character.y,
            bottom: ground + sightGeometry.characterBottom,
            top: ground + characterSightHeight(character),
        };
    });
}
function characterSightHeight(character) {
    if (character.entityKind === "teammate")
        return sightGeometry.characterTop;
    const config = enemyConfigs.find((candidate) => candidate.type === character.entityType);
    if (!config)
        throw new Error(`Missing enemy config: ${character.entityType}`);
    return config.appearance.height;
}
function visibilitySignature(enemies) {
    return [...units, ...enemies]
        .map((character) => `${character.id}:${character.x}:${character.y}:${character.sight}:${character.health}`)
        .join(";");
}

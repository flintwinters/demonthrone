import { sightGeometry, terrainHeight } from "../constants.js";
import { enemyConfigs, lineOfSightConfig } from "../world-config.js";
import { lineSightCost } from "./sight-cost.js";
import { tileKey } from "../grid.js";
export function isVisibleTile(tile, units, sightBlockers, sightCost, tileHeight, isBoulderTile) {
    const context = sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile);
    return units.some((unit) => canUnitSeeTile(unit, tile, context));
}
export function canUnitSeeTile(unit, tile, context) {
    return canSeePoint(unit, tilePoint(tile, context), context);
}
export function canUnitSeeEntity(unit, target, context) {
    return canSeePoint(unit, entityPoint(target, context), context);
}
export function canCharacterSeeEntity(character, target, context) {
    return canSeePoint(character, entityPoint(target, context), context);
}
export function characterSightBlockers(characters, tileHeight) {
    return characters.map((character) => {
        const ground = visualHeight(tileHeight(character));
        return {
            x: character.x,
            y: character.y,
            bottom: ground + sightGeometry.characterBottom,
            top: ground + characterSightHeight(character),
        };
    });
}
export function sightContext(sightBlockers, sightCost, tileHeight, isBoulderTile, heightMultiplier = lineOfSightConfig.visionHeightMultiplier) {
    return {
        sightCost,
        tileHeight: (tile) => visualHeight(tileHeight(tile)),
        isBoulderTile,
        blockers: blockerMap(sightBlockers),
        boulderHeight: sightGeometry.boulderHeight,
        heightMultiplier,
    };
}
export function memoizedSightContext(context) {
    return {
        ...context,
        sightCost: memoizedTileValue(context.sightCost),
        tileHeight: memoizedTileValue(context.tileHeight),
        isBoulderTile: memoizedTileValue(context.isBoulderTile),
    };
}
function canSeePoint(character, target, context) {
    const source = pointAbove(character, context, sightGeometry.eyeHeight);
    const horizontal = Math.hypot(target.x - source.x, target.y - source.y);
    return horizontal <= character.sight && lineSightCost(source, target, context) <= character.sight;
}
function tilePoint(tile, context) {
    return pointAbove(tile, context, sightGeometry.surfaceClearance);
}
function entityPoint(target, context) {
    return pointAbove(target, context, sightGeometry.characterTargetHeight);
}
function pointAbove(tile, context, offset) {
    return { x: tile.x + 0.5, y: tile.y + 0.5, z: context.tileHeight(tile) + offset };
}
function blockerMap(blockers) {
    const grouped = new Map();
    for (const blocker of blockers) {
        const key = tileKey(blocker);
        grouped.set(key, [...grouped.get(key) ?? [], blocker]);
    }
    return grouped;
}
function memoizedTileValue(valueAt) {
    const values = new Map();
    return (tile) => {
        const key = tileKey(tile);
        const existing = values.get(key);
        if (existing !== undefined)
            return existing;
        const value = valueAt(tile);
        values.set(key, value);
        return value;
    };
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}
function characterSightHeight(character) {
    if (character.entityKind === "teammate")
        return sightGeometry.characterTop;
    const config = enemyConfigs.find((candidate) => candidate.type === character.entityType);
    if (!config)
        throw new Error(`Missing enemy config: ${character.entityType}`);
    return config.appearance.height;
}

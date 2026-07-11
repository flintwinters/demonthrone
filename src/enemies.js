import { colors } from "./constants.js";
import { CharacterTemplate } from "./domain.js";
import { cardinalDirections, l1Distance, neighborTile, sameTile } from "./grid.js";
const enemyTemplate = new CharacterTemplate({
    sight: 5,
    movement: 1,
    attackRange: 1,
    health: 1,
});
export function createEnemy(id, tile) {
    return enemyTemplate.enemy(id, tile, colors.enemy);
}
export function moveEnemies(enemies, units, isBlockedTile) {
    for (const enemy of enemies) {
        moveEnemy(enemy, enemies, units, isBlockedTile);
    }
}
export function attackUnits(units, enemies) {
    const destroyed = [];
    for (let index = units.length - 1; index >= 0; index -= 1) {
        if (isAttacked(units[index], enemies)) {
            units[index].health -= 1;
        }
        if (units[index].health <= 0) {
            const [unit] = units.splice(index, 1);
            destroyed.push(unit);
        }
    }
    return destroyed;
}
function closestUnit(enemy, units) {
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    for (const unit of units) {
        const distance = l1Distance(enemy, unit);
        if (distance < closestDistance) {
            closest = unit;
            closestDistance = distance;
        }
    }
    return closest;
}
function moveEnemy(enemy, enemies, units, isBlockedTile) {
    for (let step = 0; step < enemy.movement; step += 1) {
        const target = closestUnit(enemy, units);
        if (!target) {
            return;
        }
        const next = bestStep(enemy, target, enemies, units, isBlockedTile);
        enemy.x = next.x;
        enemy.y = next.y;
    }
}
function bestStep(enemy, target, enemies, units, isBlockedTile) {
    const candidates = cardinalDirections
        .map((direction) => neighborTile(enemy, direction))
        .filter((tile) => canEnemyEnter(tile, enemies, units, isBlockedTile));
    return candidates.reduce((best, tile) => closerTile(best, tile, target), enemy);
}
function canEnemyEnter(tile, enemies, units, isBlockedTile) {
    return !isBlockedTile(tile)
        && !units.some((unit) => sameTile(unit, tile))
        && !enemies.some((enemy) => sameTile(enemy, tile));
}
function closerTile(best, tile, target) {
    return l1Distance(tile, target) < l1Distance(best, target) ? tile : best;
}
function isAttacked(unit, enemies) {
    return enemies.some((enemy) => l1Distance(enemy, unit) <= enemy.attackRange);
}

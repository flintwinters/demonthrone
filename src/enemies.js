import { EnemyTemplate } from "./domain.js";
import { cardinalDirections, l1Distance, neighborTile, sameTile } from "./grid.js";
import { enemyConfigs } from "./world-config.js";
const enemyTemplates = new Map(enemyConfigs.map((config) => [
    config.type,
    new EnemyTemplate(config.type, config.stats, config.color),
]));
export function createEnemy(type, id, tile) {
    const template = enemyTemplates.get(type);
    if (!template)
        throw new Error(`Unknown enemy type: ${type}`);
    return template.create(id, tile);
}
export function moveEnemies(enemies, units, isBlockedTile) {
    for (const enemy of enemies) {
        moveEnemy(enemy, enemies, units, isBlockedTile);
    }
}
export function attackUnits(units, enemies) {
    const destroyed = [];
    for (let index = units.length - 1; index >= 0; index -= 1) {
        units[index].health -= incomingDamage(units[index], enemies);
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
    if (enemy.turnsUntilMove > 0) {
        enemy.turnsUntilMove -= 1;
        return;
    }
    for (let step = 0; step < enemy.movement; step += 1) {
        const target = closestUnit(enemy, units);
        if (!target) {
            return;
        }
        const next = bestStep(enemy, target, enemies, units, isBlockedTile);
        enemy.x = next.x;
        enemy.y = next.y;
    }
    enemy.turnsUntilMove = enemy.movementInterval - 1;
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
function incomingDamage(unit, enemies) {
    return enemies.reduce((damage, enemy) => damage + (l1Distance(enemy, unit) <= enemy.attackRange ? enemy.damage : 0), 0);
}

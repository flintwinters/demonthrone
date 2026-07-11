import { NoiseLayer } from "./domain.js";
import { createEnemy } from "./enemies.js";
import { sameTile, tileKey } from "./grid.js";
import { PerlinSpawnField } from "./procedural-placement.js";
import { createPushable, pushables } from "./pushables.js";
import { isObstacleTile } from "./world.js";
import { entityGeneration } from "./world-config.js";
const pushableField = new PerlinSpawnField(new NoiseLayer(entityGeneration.pushable.noise), entityGeneration.pushable.threshold);
const enemyField = new PerlinSpawnField(new NoiseLayer(entityGeneration.enemy.noise), entityGeneration.enemy.threshold);
export function materializeEntities(units, enemies) {
    const pushableTiles = pushableField.materialize(units, entityGeneration.radius, (tile) => isAvailable(tile, units, enemies));
    pushables.push(...pushableTiles.map((tile) => createPushable(`crate@${tileKey(tile)}`, tile)));
    const enemyTiles = enemyField.materialize(units, entityGeneration.radius, (tile) => isAvailable(tile, units, enemies));
    enemies.push(...enemyTiles.map((tile) => createEnemy(`enemy@${tileKey(tile)}`, tile)));
}
function isAvailable(tile, units, enemies) {
    return !isObstacleTile(tile)
        && !units.some((unit) => sameTile(unit, tile))
        && !enemies.some((enemy) => sameTile(enemy, tile))
        && !pushables.some((pushable) => sameTile(pushable, tile));
}

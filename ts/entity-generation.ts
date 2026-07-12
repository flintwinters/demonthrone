import { NoiseLayer } from "./domain.js";
import { createEnemy } from "./enemies.js";
import { sameTile, tileKey } from "./grid.js";
import { PerlinSpawnField } from "./procedural-placement.js";
import { createPushable, pushables } from "./pushables.js";
import { isObstacleTile } from "./world/index.js";
import { enemyConfigs, entityGeneration } from "./world-config.js";
import type { Enemy, Tile, Unit } from "./types.js";

const pushableField = new PerlinSpawnField(
  new NoiseLayer(entityGeneration.pushable.noise),
  entityGeneration.pushable.threshold,
);
const enemyFields = enemyConfigs.map(({ type }) => {
  const config = entityGeneration.enemy[type];

  return { type, field: new PerlinSpawnField(new NoiseLayer(config.noise), config.threshold) };
});

export function materializeEntities(units: readonly Unit[], enemies: Enemy[]): void {
  const pushableTiles = pushableField.materialize(
    units,
    entityGeneration.radius,
    (tile) => isAvailable(tile, units, enemies),
  );

  pushables.push(...pushableTiles.map((tile) => createPushable(`crate@${tileKey(tile)}`, tile)));

  for (const { type, field } of enemyFields) {
    const enemyTiles = field.materialize(
      units,
      entityGeneration.radius,
      (tile) => isAvailable(tile, units, enemies),
    );

    enemies.push(...enemyTiles.map((tile) => createEnemy(type, `${type}@${tileKey(tile)}`, tile)));
  }
}

function isAvailable(tile: Tile, units: readonly Unit[], enemies: readonly Enemy[]): boolean {
  return !isObstacleTile(tile)
    && !units.some((unit) => sameTile(unit, tile))
    && !enemies.some((enemy) => sameTile(enemy, tile))
    && !pushables.some((pushable) => sameTile(pushable, tile));
}

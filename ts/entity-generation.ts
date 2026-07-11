import { NoiseLayer } from "./domain.js";
import { createEnemy } from "./enemies.js";
import { sameTile, tileKey } from "./grid.js";
import { PerlinSpawnField } from "./procedural-placement.js";
import { createPushable, pushables } from "./pushables.js";
import { isObstacleTile } from "./world.js";
import type { Enemy, Tile, Unit } from "./types.js";

const generationRadius = 12;
const pushableField = new PerlinSpawnField(
  new NoiseLayer({ scale: 0.17, seed: 0x63726174 }),
  0.7,
);
const enemyField = new PerlinSpawnField(
  new NoiseLayer({ scale: 0.1, seed: 0x6e6d79 }),
  0.65,
);

export function materializeEntities(units: readonly Unit[], enemies: Enemy[]): void {
  const pushableTiles = pushableField.materialize(
    units,
    generationRadius,
    (tile) => isAvailable(tile, units, enemies),
  );

  pushables.push(...pushableTiles.map((tile) => createPushable(`crate@${tileKey(tile)}`, tile)));

  const enemyTiles = enemyField.materialize(
    units,
    generationRadius,
    (tile) => isAvailable(tile, units, enemies),
  );

  enemies.push(...enemyTiles.map((tile) => createEnemy(`enemy@${tileKey(tile)}`, tile)));
}

function isAvailable(tile: Tile, units: readonly Unit[], enemies: readonly Enemy[]): boolean {
  return !isObstacleTile(tile)
    && !units.some((unit) => sameTile(unit, tile))
    && !enemies.some((enemy) => sameTile(enemy, tile))
    && !pushables.some((pushable) => sameTile(pushable, tile));
}

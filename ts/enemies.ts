import { colors } from "./constants.js";
import { l1Distance, tileKey } from "./grid.js";
import type { Enemy, Tile, TilePredicate, Unit } from "./types.js";

const enemyCount = 5;
const maxSpawnAttempts = 500;
const spawnBounds = {
  minX: 0,
  maxX: 13,
  minY: 0,
  maxY: 13,
};
const directions = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

export function randomEnemies(units: Unit[], isBlockedTile: TilePredicate): Enemy[] {
  const enemies: Enemy[] = [];
  let attempts = 0;

  while (enemies.length < enemyCount) {
    attempts += 1;

    if (attempts > maxSpawnAttempts) {
      throw new Error("Unable to place random enemies.");
    }

    const tile = randomSpawnTile();

    if (isBlockedTile(tile) || isOccupied(tile, units, enemies)) {
      continue;
    }

    enemies.push({
      ...tile,
      id: `enemy-${enemies.length + 1}`,
      color: colors.enemy,
    });
  }

  return enemies;
}

export function moveEnemies(enemies: Enemy[], units: Unit[], isBlockedTile: TilePredicate): void {
  for (const enemy of enemies) {
    const target = closestUnit(enemy, units);

    if (!target) {
      return;
    }

    moveEnemy(enemy, target, enemies, units, isBlockedTile);
  }
}

export function destroyAdjacentUnits(units: Unit[], enemies: Enemy[]): Unit[] {
  const destroyed: Unit[] = [];

  for (let index = units.length - 1; index >= 0; index -= 1) {
    if (enemies.some((enemy) => l1Distance(enemy, units[index]) === 1)) {
      const [unit] = units.splice(index, 1);

      destroyed.push(unit);
    }
  }

  return destroyed;
}

function randomSpawnTile(): Tile {
  return {
    x: randomInt(spawnBounds.minX, spawnBounds.maxX),
    y: randomInt(spawnBounds.minY, spawnBounds.maxY),
  };
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function isOccupied(tile: Tile, units: Unit[], enemies: Enemy[]): boolean {
  return units.some((unit) => sameTile(unit, tile)) || enemies.some((enemy) => sameTile(enemy, tile));
}

function closestUnit(enemy: Enemy, units: Unit[]): Unit | null {
  let closest: Unit | null = null;
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

function moveEnemy(
  enemy: Enemy,
  target: Unit,
  enemies: Enemy[],
  units: Unit[],
  isBlockedTile: TilePredicate,
): void {
  const next = bestStep(enemy, target, enemies, units, isBlockedTile);

  enemy.x = next.x;
  enemy.y = next.y;
}

function bestStep(
  enemy: Enemy,
  target: Unit,
  enemies: Enemy[],
  units: Unit[],
  isBlockedTile: TilePredicate,
): Tile {
  const candidates = directions
    .map((direction) => ({ x: enemy.x + direction.x, y: enemy.y + direction.y }))
    .filter((tile) => canEnemyEnter(tile, enemies, units, isBlockedTile));

  return candidates.reduce((best, tile) => closerTile(best, tile, target), enemy);
}

function canEnemyEnter(tile: Tile, enemies: Enemy[], units: Unit[], isBlockedTile: TilePredicate): boolean {
  return !isBlockedTile(tile)
    && !units.some((unit) => sameTile(unit, tile))
    && !enemies.some((enemy) => sameTile(enemy, tile));
}

function closerTile(best: Tile, tile: Tile, target: Unit): Tile {
  return l1Distance(tile, target) < l1Distance(best, target) ? tile : best;
}

function sameTile(first: Tile, second: Tile): boolean {
  return tileKey(first) === tileKey(second);
}

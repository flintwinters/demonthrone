const boulderChance = 0.13;
const safeRadius = 1;

export function isObstacleTile(tile) {
  return !isSafeStart(tile) && coordinateNoise(tile) < boulderChance;
}

function isSafeStart(tile) {
  return Math.abs(tile.x - 5) + Math.abs(tile.y - 7) <= safeRadius
    || Math.abs(tile.x - 8) + Math.abs(tile.y - 6) <= safeRadius;
}

function coordinateNoise(tile) {
  const hash = Math.imul(tile.x, 73856093) ^ Math.imul(tile.y, 19349663) ^ 0x5eed;

  return (hash >>> 0) / 0x100000000;
}

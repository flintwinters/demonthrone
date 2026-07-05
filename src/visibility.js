export function isVisibleTile(tile, units) {
  return units.some((unit) => l1Distance(tile, unit) <= unit.lineOfSight);
}

export function l1Distance(first, second) {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

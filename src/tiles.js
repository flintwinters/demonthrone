import { l1Distance } from "./visibility.js";

export function visibleTiles(units) {
  const seen = new Set();
  const tiles = [];

  for (const unit of units) {
    appendVisibleTiles(unit, seen, tiles);
  }

  return tiles;
}

function appendVisibleTiles(unit, seen, tiles) {
  for (let y = unit.y - unit.lineOfSight; y <= unit.y + unit.lineOfSight; y += 1) {
    appendVisibleRow(unit, y, seen, tiles);
  }
}

function appendVisibleRow(unit, y, seen, tiles) {
  for (let x = unit.x - unit.lineOfSight; x <= unit.x + unit.lineOfSight; x += 1) {
    appendVisibleTile(unit, { x, y }, seen, tiles);
  }
}

function appendVisibleTile(unit, tile, seen, tiles) {
  const key = `${tile.x}:${tile.y}`;

  if (seen.has(key) || l1Distance(unit, tile) > unit.lineOfSight) {
    return;
  }

  seen.add(key);
  tiles.push(tile);
}

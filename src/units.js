import { colors } from "./constants.js";

export const units = [
  {
    id: "vanguard",
    x: 5,
    y: 7,
    color: colors.unitOne,
    lineOfSight: 5,
    target: null,
  },
  {
    id: "warden",
    x: 8,
    y: 6,
    color: colors.unitTwo,
    lineOfSight: 5,
    target: null,
  },
];

export const selection = {
  unitId: null,
};

export function selectedUnit() {
  return units.find((unit) => unit.id === selection.unitId) ?? null;
}

export function plannedUnits() {
  return units.filter((unit) => unit.target);
}

export function clickBoardTile(tile) {
  const unit = unitAt(tile);

  if (unit) {
    selection.unitId = unit.id;
    return tile;
  }

  assignSelectedTarget(tile);
  return tile;
}

export function commitPlannedMoves() {
  for (const unit of plannedUnits()) {
    unit.x = unit.target.x;
    unit.y = unit.target.y;
    unit.target = null;
  }
}

function assignSelectedTarget(tile) {
  const unit = selectedUnit();

  if (unit) {
    unit.target = { x: tile.x, y: tile.y };
  }
}

function unitAt(tile) {
  return units.find((unit) => unit.x === tile.x && unit.y === tile.y) ?? null;
}

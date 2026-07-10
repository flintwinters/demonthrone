import { colors } from "./constants.js";
import type { HeightTile, Tile, Unit } from "./types.js";

type PlannedUnit = Unit & {
  target: Tile;
};

export const units: Unit[] = [
  {
    id: "vanguard",
    x: 5,
    y: 7,
    color: colors.unitOne,
    sight: 5,
    movement: 3,
    attackRange: 1,
    health: 1,
    target: null,
  },
  {
    id: "warden",
    x: 8,
    y: 6,
    color: colors.unitTwo,
    sight: 5,
    movement: 3,
    attackRange: 1,
    health: 1,
    target: null,
  },
];

export const selection: { unitId: string | null } = {
  unitId: null,
};

export function selectedUnit(): Unit | null {
  return units.find((unit) => unit.id === selection.unitId) ?? null;
}

export function plannedUnits(): PlannedUnit[] {
  return units.filter(hasTarget);
}

export function clickBoardTile(
  tile: HeightTile,
  canTargetTile: (tile: Tile, unit: Unit) => boolean,
): HeightTile | null {
  const unit = unitAt(tile);

  if (unit) {
    selection.unitId = unit.id;
    return tile;
  }

  return assignSelectedTarget(tile, canTargetTile);
}

export function commitPlannedMoves(): void {
  for (const unit of units) {
    if (!unit.target) {
      continue;
    }

    unit.x = unit.target.x;
    unit.y = unit.target.y;
    unit.target = null;
  }

  if (selection.unitId && !selectedUnit()) {
    selection.unitId = null;
  }
}

function assignSelectedTarget(
  tile: HeightTile,
  canTargetTile: (tile: Tile, unit: Unit) => boolean,
): HeightTile | null {
  const unit = selectedUnit();

  if (unit && canTargetTile(tile, unit)) {
    unit.target = { x: tile.x, y: tile.y };
    return tile;
  }

  return null;
}

function unitAt(tile: Tile): Unit | null {
  return units.find((unit) => unit.x === tile.x && unit.y === tile.y) ?? null;
}

function hasTarget(unit: Unit): unit is PlannedUnit {
  return unit.target !== null;
}

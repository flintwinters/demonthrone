import { EnchantmentSelection } from "./enchantment-selection.js";
import { sameTile } from "./grid.js";
import type { HeightTile, Tile, Unit } from "./types.js";

type EnchantmentClick = {
  handled: boolean;
  selectedTile: HeightTile | null;
};

export function handleEnchantmentClick(
  tile: Tile,
  currentTile: HeightTile | null,
  selection: EnchantmentSelection,
  units: readonly Unit[],
  selectedUnit: Unit | null,
  conflictsWithUnitAction: (tile: Tile, unit: Unit) => boolean,
  enrichTile: (tile: Tile) => HeightTile,
  clearUnitSelection: () => void,
): EnchantmentClick {
  const source = selection.source();

  if (source && (sameTile(source, tile) || selection.canBindTo(tile, units))) {
    return { handled: true, selectedTile: selection.resolve(tile, units) ? null : currentTile };
  }

  selection.clear();
  return beginEnchantment(
    tile, selection, selectedUnit, conflictsWithUnitAction, enrichTile, clearUnitSelection,
  );
}

export function cancelAttackForMovement(
  tile: Tile,
  unit: Unit | null,
  canMove: (tile: Tile, unit: Unit) => boolean,
  cancelAction: (unit: Unit) => void,
): void {
  if (unit?.attackTargetId && canMove(tile, unit)) {
    cancelAction(unit);
  }
}

export function clearInteraction(
  selection: EnchantmentSelection,
  unit: Unit | null,
  cancelAction: (unit: Unit) => void,
  clearUnitSelection: () => void,
): void {
  selection.clear();
  if (unit) {
    cancelAction(unit);
    clearUnitSelection();
  }
}

function beginEnchantment(
  tile: Tile,
  selection: EnchantmentSelection,
  unit: Unit | null,
  conflictsWithUnitAction: (tile: Tile, unit: Unit) => boolean,
  enrichTile: (tile: Tile) => HeightTile,
  clearUnitSelection: () => void,
): EnchantmentClick {
  if (!selection.begin(tile)) {
    return { handled: false, selectedTile: null };
  }

  if (unit && conflictsWithUnitAction(tile, unit)) {
    selection.clear();
    return { handled: false, selectedTile: null };
  }

  clearUnitSelection();
  return { handled: true, selectedTile: enrichTile(tile) };
}

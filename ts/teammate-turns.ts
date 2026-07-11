import { clearPlannedPush } from "./pushables.js";
import type { Unit } from "./types.js";

const spentUnitIds = new Set<string>();

export function canTakeAction(unit: Unit): boolean {
  return !spentUnitIds.has(unit.id);
}

export function spendAction(unit: Unit): void {
  unit.target = null;
  clearPlannedPush(unit.id);
  spentUnitIds.add(unit.id);
}

export function resetActions(): void {
  spentUnitIds.clear();
}

import { clearPlannedPush } from "./pushables.js";
import type { Unit } from "./types.js";

let actingUnitId: string | null = null;

export function canTakeAction(unit: Unit): boolean {
  return actingUnitId === null && unit.health > 0;
}

export function spendAction(unit: Unit): void {
  if (actingUnitId !== null && actingUnitId !== unit.id) return;
  clearUnitAction(unit);
  actingUnitId = unit.id;
}

export function cancelAction(unit: Unit): void {
  clearUnitAction(unit);
  if (actingUnitId === unit.id) actingUnitId = null;
}

export function resetActions(): void {
  actingUnitId = null;
}

function clearUnitAction(unit: Unit): void {
  unit.target = null;
  unit.attackTargetId = null;
  clearPlannedPush(unit.id);
}

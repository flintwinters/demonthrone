import { colors } from "./constants.js";
import type { EnchantmentSelection } from "./enchantment-selection.js";
import type { Enemy, HeightTile, Pushable, SelectionArc, Tile, Unit } from "./types.js";

export const selectionOutlineConfig = {
  edgeInset: 0,
  zLift: 0.001,
};

export const parabolicSelectionLineConfig = {
  centerOffset: 0.5,
  segmentCount: 20,
  basePeakHeight: 0.55,
  distanceScale: 0.18,
  endpointLift: 0.34,
  parabolaPeakScale: 4,
  attackColor: colors.attackTarget,
  enchantmentColor: colors.enchantmentLine,
};

export function plannedSelectionLines(
  enchantment: EnchantmentSelection,
  hoveredTile: HeightTile | null,
  units: Unit[],
  enemies: Enemy[],
  pushables: Pushable[],
  enrich: (tile: Tile) => HeightTile,
): readonly SelectionArc[] {
  const lines = enchantmentLine(enchantment, hoveredTile, units, enrich);

  for (const unit of units) {
    const target = attackTarget(unit, enemies, pushables);

    if (target) lines.push({
      start: enrich(unit), end: enrich(target), color: parabolicSelectionLineConfig.attackColor,
    });
  }
  return lines;
}

function enchantmentLine(
  enchantment: EnchantmentSelection,
  hoveredTile: HeightTile | null,
  units: Unit[],
  enrich: (tile: Tile) => HeightTile,
): SelectionArc[] {
  const source = enchantment.source();

  return source && hoveredTile && enchantment.canBindTo(hoveredTile, units)
    ? [{ start: enrich(source), end: hoveredTile, color: parabolicSelectionLineConfig.enchantmentColor }]
    : [];
}

function attackTarget(unit: Unit, enemies: Enemy[], pushables: Pushable[]): Enemy | Pushable | null {
  if (!unit.attackTargetId) return null;
  return enemies.find((candidate) => candidate.id === unit.attackTargetId)
    ?? pushables.find((candidate) => candidate.id === unit.attackTargetId)
    ?? null;
}

import { colors } from "./constants.js";
export const selectionOutlineConfig = {
    edgeInset: 0.06,
    zLift: 0.006,
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
export function plannedSelectionLines(enchantment, hoveredTile, units, enemies, pushables, enrich) {
    const lines = enchantmentLine(enchantment, hoveredTile, units, enrich);
    for (const unit of units) {
        const target = attackTarget(unit, enemies, pushables);
        if (target)
            lines.push({
                start: enrich(unit), end: enrich(target), color: parabolicSelectionLineConfig.attackColor,
            });
    }
    return lines;
}
function enchantmentLine(enchantment, hoveredTile, units, enrich) {
    const source = enchantment.source();
    return source && hoveredTile && enchantment.canBindTo(hoveredTile, units)
        ? [{ start: enrich(source), end: hoveredTile, color: parabolicSelectionLineConfig.enchantmentColor }]
        : [];
}
function attackTarget(unit, enemies, pushables) {
    if (!unit.attackTargetId)
        return null;
    return enemies.find((candidate) => candidate.id === unit.attackTargetId)
        ?? pushables.find((candidate) => candidate.id === unit.attackTargetId)
        ?? null;
}

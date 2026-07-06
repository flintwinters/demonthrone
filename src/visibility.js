export function isVisibleTile(tile, units, isObstacleTile) {
    return units.some((unit) => canUnitSeeTile(unit, tile, isObstacleTile));
}
export function l1Distance(first, second) {
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}
function canUnitSeeTile(unit, tile, isObstacleTile) {
    return l1Distance(unit, tile) <= unit.lineOfSight
        && hasOpenSightLine(unit, tile, isObstacleTile);
}
function hasOpenSightLine(start, end, isObstacleTile) {
    const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    for (let step = 1; step < steps; step += 1) {
        if (isObstacleTile(linePoint(start, end, step, steps))) {
            return false;
        }
    }
    return true;
}
function linePoint(start, end, step, steps) {
    return {
        x: Math.round(start.x + (end.x - start.x) * step / steps),
        y: Math.round(start.y + (end.y - start.y) * step / steps),
    };
}

import { l1Distance } from "./grid.js";
const downhillDistanceDiscount = 0.25;
const uphillHeightPenalty = 1;
export function lineSightCost(start, end, sightCost, tileHeight) {
    const steps = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
    let cost = 0;
    let previous = start;
    for (let step = 1; step <= steps; step += 1) {
        const current = linePoint(start, end, step, steps);
        cost += segmentSightCost(previous, current, tileHeight);
        if (step < steps) {
            cost += sightCost(current) - 1;
        }
        previous = current;
    }
    return cost;
}
export function sightSearchRadius(lineOfSight) {
    return Math.ceil(lineOfSight / (1 - downhillDistanceDiscount));
}
function segmentSightCost(start, end, tileHeight) {
    const distance = l1Distance(start, end);
    const heightDelta = tileHeight(end) - tileHeight(start);
    if (heightDelta > 0) {
        return distance + heightDelta * uphillHeightPenalty;
    }
    if (heightDelta < 0) {
        return distance * (1 - downhillDistanceDiscount);
    }
    return distance;
}
function linePoint(start, end, step, steps) {
    return {
        x: Math.round(start.x + (end.x - start.x) * step / steps),
        y: Math.round(start.y + (end.y - start.y) * step / steps),
    };
}

import { sightGeometry } from "./constants.js";
import { tileKey } from "./grid.js";
import type { SightContext } from "./visibility.js";
import type { Tile, Unit } from "./types.js";

type Octant = { majorX: number; majorY: number; minorX: number; minorY: number };
type Sweep = { horizons: Float64Array; costs: Float64Array; bins: number; eyeZ: number };

const octants: readonly Octant[] = [
  { majorX: 1, majorY: 0, minorX: 0, minorY: 1 },
  { majorX: 1, majorY: 0, minorX: 0, minorY: -1 },
  { majorX: -1, majorY: 0, minorX: 0, minorY: 1 },
  { majorX: -1, majorY: 0, minorX: 0, minorY: -1 },
  { majorX: 0, majorY: 1, minorX: 1, minorY: 0 },
  { majorX: 0, majorY: 1, minorX: -1, minorY: 0 },
  { majorX: 0, majorY: -1, minorX: 1, minorY: 0 },
  { majorX: 0, majorY: -1, minorX: -1, minorY: 0 },
];

export function appendShadowcastTiles(
  unit: Unit,
  context: SightContext,
  seen: Set<string>,
  tiles: Tile[],
): void {
  appendTile(unit, seen, tiles);
  const radius = Math.ceil(unit.sight);

  for (const octant of octants) {
    sweepOctant(unit, context, octant, radius, seen, tiles);
  }
}

function sweepOctant(
  unit: Unit,
  context: SightContext,
  octant: Octant,
  radius: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const bins = radius * 2 + 1;
  const sweep = createSweep(bins, context.tileHeight(unit) + sightGeometry.eyeHeight);

  for (let depth = 1; depth <= radius; depth += 1) {
    for (let bin = 0; bin < bins; bin += 1) {
      visitBin(unit, context, octant, depth, bin, sweep, seen, tiles);
    }
  }
}

function createSweep(bins: number, eyeZ: number): Sweep {
  const horizons = new Float64Array(bins);

  horizons.fill(Number.NEGATIVE_INFINITY);
  return { horizons, costs: new Float64Array(bins), bins, eyeZ };
}

function visitBin(
  unit: Unit,
  context: SightContext,
  octant: Octant,
  depth: number,
  bin: number,
  sweep: Sweep,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const angularSlope = (bin + 0.5) / sweep.bins;
  const minor = Math.min(depth, Math.floor(angularSlope * (depth + 1)));
  const tile = projectTile(unit, octant, depth, minor);
  const horizontal = Math.hypot(depth, minor);
  const step = Math.hypot(1, angularSlope);
  const terrainCost = finiteSightCost(context.sightCost(tile));

  sweep.costs[bin] += step * terrainCost;
  if (isBinVisible(tile, horizontal, bin, unit.sight, sweep, context)) {
    appendTile(tile, seen, tiles);
  }
  sweep.horizons[bin] = Math.max(sweep.horizons[bin], occlusionSlope(tile, depth, angularSlope, sweep, context));
}

function projectTile(unit: Unit, octant: Octant, major: number, minor: number): Tile {
  return {
    x: unit.x + octant.majorX * major + octant.minorX * minor,
    y: unit.y + octant.majorY * major + octant.minorY * minor,
  };
}

function isBinVisible(
  tile: Tile,
  horizontal: number,
  bin: number,
  sight: number,
  sweep: Sweep,
  context: SightContext,
): boolean {
  if (horizontal > sight) return false;
  const deltaZ = context.tileHeight(tile) + sightGeometry.surfaceClearance - sweep.eyeZ;
  const rangeCost = sweep.costs[bin] * (1 + Math.abs(deltaZ) / horizontal);

  return rangeCost <= sight && deltaZ / horizontal >= sweep.horizons[bin];
}

function occlusionSlope(
  tile: Tile,
  depth: number,
  angularSlope: number,
  sweep: Sweep,
  context: SightContext,
): number {
  const nearDistance = Math.max(0.5, (depth - 0.5) * Math.hypot(1, angularSlope));
  const top = obstructionTop(tile, context);

  return (top - sweep.eyeZ) / nearDistance;
}

function obstructionTop(tile: Tile, context: SightContext): number {
  let top = context.tileHeight(tile);

  if (context.isBoulderTile(tile)) top += context.boulderHeight;
  for (const blocker of context.blockers.get(tileKey(tile)) ?? []) {
    top = Math.max(top, blocker.top);
  }
  return top;
}

function finiteSightCost(cost: number): number {
  return Number.isFinite(cost) ? cost : 1;
}

function appendTile(tile: Tile, seen: Set<string>, tiles: Tile[]): void {
  const key = tileKey(tile);

  if (seen.has(key)) return;
  seen.add(key);
  tiles.push(tile);
}

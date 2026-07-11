import { sightGeometry } from "./constants.js";
import { tileKey } from "./grid.js";
import type { SightContext } from "./visibility.js";
import type { Tile, Unit } from "./types.js";

type Octant = { majorX: number; majorY: number; minorX: number; minorY: number };
type Sweep = { horizons: Float64Array; costs: Float64Array; bins: number; eyeZ: number; targetOffset: number };

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
  appendShadowcastField(unit, unit.sight, sightGeometry.surfaceClearance, context, seen, tiles);
}

export function shadowcastTiles(
  origin: Tile,
  range: number,
  context: SightContext,
  targetOffset: number = sightGeometry.surfaceClearance,
): Tile[] {
  const seen = new Set<string>();
  const tiles: Tile[] = [];

  appendShadowcastField(origin, range, targetOffset, context, seen, tiles);
  return tiles;
}

function appendShadowcastField(
  origin: Tile,
  range: number,
  targetOffset: number,
  context: SightContext,
  seen: Set<string>,
  tiles: Tile[],
): void {
  appendTile(origin, seen, tiles);
  const radius = Math.ceil(range);

  for (const octant of octants) {
    sweepOctant(origin, range, targetOffset, context, octant, radius, seen, tiles);
  }
}

function sweepOctant(
  origin: Tile,
  range: number,
  targetOffset: number,
  context: SightContext,
  octant: Octant,
  radius: number,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const bins = radius + 1;
  const sweep = createSweep(bins, context.tileHeight(origin) + sightGeometry.eyeHeight, targetOffset);

  for (let depth = 1; depth <= radius; depth += 1) {
    for (let bin = 0; bin < bins; bin += 1) {
      visitBin(origin, range, context, octant, depth, bin, sweep, seen, tiles);
    }
  }
}

function createSweep(bins: number, eyeZ: number, targetOffset: number): Sweep {
  const horizons = new Float64Array(bins);

  horizons.fill(Number.NEGATIVE_INFINITY);
  return { horizons, costs: new Float64Array(bins), bins, eyeZ, targetOffset };
}

function visitBin(
  origin: Tile,
  range: number,
  context: SightContext,
  octant: Octant,
  depth: number,
  bin: number,
  sweep: Sweep,
  seen: Set<string>,
  tiles: Tile[],
): void {
  const angularSlope = bin / (sweep.bins - 1);
  const minor = Math.min(depth, Math.floor(angularSlope * (depth + 1)));
  const tile = projectTile(origin, octant, depth, minor);
  const horizontal = Math.hypot(depth, minor);

  if (horizontal > range) return;
  const step = Math.hypot(1, angularSlope);
  const terrainCost = finiteSightCost(context.sightCost(tile));

  sweep.costs[bin] += step * terrainCost;
  if (isBinVisible(tile, horizontal, bin, range, sweep, context)) {
    appendTile(tile, seen, tiles);
  }
  sweep.horizons[bin] = Math.max(sweep.horizons[bin], occlusionSlope(tile, depth, angularSlope, sweep, context));
}

function projectTile(origin: Tile, octant: Octant, major: number, minor: number): Tile {
  return {
    x: origin.x + octant.majorX * major + octant.minorX * minor,
    y: origin.y + octant.majorY * major + octant.minorY * minor,
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
  const deltaZ = context.tileHeight(tile) + sweep.targetOffset - sweep.eyeZ;
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

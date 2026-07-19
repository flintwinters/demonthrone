import { sightGeometry } from "../constants.js";
import { tileKey } from "../grid.js";
import type { SightContext } from "./visibility.js";
import type { Tile, Unit } from "../types.js";

type Octant = { majorX: number; majorY: number; minorX: number; minorY: number };
type Sweep = {
  horizons: Float64Array;
  costs: Float64Array;
  slopes: Float64Array;
  steps: Float64Array;
  eyeZ: number;
  targetOffset: number;
};
type Footprints = {
  visible: Uint32Array;
  total: Uint32Array;
  centerVisible: Uint8Array;
};
type SampledTile = {
  minor: number;
  centerBin: number;
  horizontal: number;
  terrainCost: number;
  groundHeight: number;
  obstructionTop: number;
};

const angularSupersampling = 3;

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
  const bins = angularSupersampling * radius + 1;
  const sweep = createSweep(bins, context.tileHeight(origin) + sightGeometry.eyeHeight, targetOffset);
  const footprints = createFootprints(radius + 1);

  for (let depth = 1; depth <= radius; depth += 1) {
    resetFootprints(footprints, depth + 1);
    let sample: SampledTile | null = null;

    for (let bin = 0; bin < bins; bin += 1) {
      const minor = Math.min(depth, Math.floor(sweep.slopes[bin] * (depth + 1)));

      if (sample?.minor !== minor) {
        sample = sampleTile(origin, octant, depth, minor, range, bins, context);
      }
      visitBin(range, depth, bin, sample, sweep, footprints, context);
    }
    appendVisibleFootprints(origin, octant, depth, footprints, seen, tiles);
  }
}

function createSweep(bins: number, eyeZ: number, targetOffset: number): Sweep {
  const horizons = new Float64Array(bins);
  const slopes = new Float64Array(bins);
  const steps = new Float64Array(bins);

  horizons.fill(Number.NEGATIVE_INFINITY);
  for (let bin = 0; bin < bins; bin += 1) {
    slopes[bin] = bin / (bins - 1);
    steps[bin] = Math.hypot(1, slopes[bin]);
  }
  return {
    horizons,
    costs: new Float64Array(bins),
    slopes,
    steps,
    eyeZ,
    targetOffset,
  };
}

function visitBin(
  range: number,
  depth: number,
  bin: number,
  tile: SampledTile,
  sweep: Sweep,
  footprints: Footprints,
  context: SightContext,
): void {
  if (tile.horizontal > range) return;
  const step = sweep.steps[bin];

  sweep.costs[bin] += step * tile.terrainCost;
  footprints.total[tile.minor] += 1;
  const visible = isBinVisible(tile.groundHeight, tile.horizontal, bin, range, sweep, context);

  if (visible) footprints.visible[tile.minor] += 1;
  if (bin === tile.centerBin) footprints.centerVisible[tile.minor] = visible ? 1 : 0;
  sweep.horizons[bin] = Math.max(
    sweep.horizons[bin],
    occlusionSlope(tile.obstructionTop, depth, step, sweep),
  );
}

function sampleTile(
  origin: Tile,
  octant: Octant,
  depth: number,
  minor: number,
  range: number,
  bins: number,
  context: SightContext,
): SampledTile {
  const tile = projectTile(origin, octant, depth, minor);
  const horizontal = Math.hypot(depth, minor);
  const centerBin = tileCenterBin(minor, depth, bins);

  if (horizontal > range) {
    return { minor, centerBin, horizontal, terrainCost: 0, groundHeight: 0, obstructionTop: 0 };
  }
  const terrainCost = finiteSightCost(context.sightCost(tile));
  const groundHeight = context.tileHeight(tile);

  return {
    minor,
    centerBin,
    horizontal,
    terrainCost,
    groundHeight,
    obstructionTop: obstructionHeight(tile, groundHeight, context),
  };
}

function tileCenterBin(minor: number, depth: number, bins: number): number {
  const denominator = bins - 1;
  const lower = Math.ceil(minor * denominator / (depth + 1));
  const upper = minor === depth
    ? denominator
    : Math.ceil((minor + 1) * denominator / (depth + 1)) - 1;
  const center = Math.round(minor * denominator / depth);

  return Math.max(lower, Math.min(center, upper));
}

function createFootprints(size: number): Footprints {
  return {
    visible: new Uint32Array(size),
    total: new Uint32Array(size),
    centerVisible: new Uint8Array(size),
  };
}

function resetFootprints(footprints: Footprints, end: number): void {
  footprints.visible.fill(0, 0, end);
  footprints.total.fill(0, 0, end);
  footprints.centerVisible.fill(0, 0, end);
}

function appendVisibleFootprints(
  origin: Tile,
  octant: Octant,
  depth: number,
  footprints: Footprints,
  seen: Set<string>,
  tiles: Tile[],
): void {
  for (let minor = 0; minor <= depth; minor += 1) {
    if (!isFootprintVisible(minor, footprints)) continue;
    appendTile(projectTile(origin, octant, depth, minor), seen, tiles);
  }
}

function isFootprintVisible(minor: number, footprints: Footprints): boolean {
  return footprints.centerVisible[minor] === 1
    || footprints.visible[minor] * 2 > footprints.total[minor];
}

function projectTile(origin: Tile, octant: Octant, major: number, minor: number): Tile {
  return {
    x: origin.x + octant.majorX * major + octant.minorX * minor,
    y: origin.y + octant.majorY * major + octant.minorY * minor,
  };
}

function isBinVisible(
  groundHeight: number,
  horizontal: number,
  bin: number,
  sight: number,
  sweep: Sweep,
  context: SightContext,
): boolean {
  if (horizontal > sight) return false;
  const deltaZ = groundHeight + sweep.targetOffset - sweep.eyeZ;
  const heightMultiplier = context.heightMultiplier ?? 1;
  const rangeCost = sweep.costs[bin] * (1 + heightMultiplier * Math.abs(deltaZ) / horizontal);

  return rangeCost <= sight && deltaZ / horizontal >= sweep.horizons[bin];
}

function occlusionSlope(
  obstructionTop: number,
  depth: number,
  step: number,
  sweep: Sweep,
): number {
  const nearDistance = Math.max(0.5, (depth - 0.5) * step);

  return (obstructionTop - sweep.eyeZ) / nearDistance;
}

function obstructionHeight(tile: Tile, groundHeight: number, context: SightContext): number {
  let top = groundHeight;

  if (context.isBoulderTile(tile)) top += context.boulderHeight;
  if (context.blockers.size === 0) return top;
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

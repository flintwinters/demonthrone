import type { Tile } from "./types.js";

type Sample = (tile: Tile) => number;
type Predicate = (tile: Tile) => boolean;

type BasinAnchor = Tile & {
  readonly ground: number;
  readonly wetness: number;
};

type RankedAnchor = {
  readonly anchor: BasinAnchor;
  readonly distanceSquared: number;
};

const anchorCacheLimit = 2048;

export class BasinField {
  private readonly anchors = new Map<string, BasinAnchor>();

  constructor(
    private readonly cellSize: number,
    private readonly radius: number,
    private readonly depth: number,
    private readonly groundHeight: Sample,
    private readonly wetness: Sample,
  ) {}

  surfaceAt(tile: Tile, isWet: Predicate): number | null {
    const [nearest, second] = this.rankedAnchors(tile);

    if (!nearest || !second || !this.belongsToBasin(nearest, second)) {
      return null;
    }

    const { anchor } = nearest;
    const surface = anchor.ground + this.depth;

    return this.isFlooded(anchor, tile, surface, isWet) ? surface : null;
  }

  private isFlooded(anchor: BasinAnchor, tile: Tile, surface: number, isWet: Predicate): boolean {
    return isWet(anchor) && isWet(tile) && this.groundHeight(tile) <= surface;
  }

  private belongsToBasin(nearest: RankedAnchor, second: RankedAnchor): boolean {
    const maximumDistance = this.radius * this.radius;
    const ownershipMargin = second.distanceSquared - nearest.distanceSquared;

    return nearest.distanceSquared <= maximumDistance && ownershipMargin > 1;
  }

  private rankedAnchors(tile: Tile): RankedAnchor[] {
    const cellX = Math.floor(tile.x / this.cellSize);
    const cellY = Math.floor(tile.y / this.cellSize);
    const ranked = new Map<string, RankedAnchor>();

    for (let y = cellY - 1; y <= cellY + 1; y += 1) {
      for (let x = cellX - 1; x <= cellX + 1; x += 1) {
        const anchor = this.anchorAt(x, y);

        ranked.set(`${anchor.x}:${anchor.y}`, { anchor, distanceSquared: squaredDistance(tile, anchor) });
      }
    }

    return [...ranked.values()].sort(compareRankedAnchors);
  }

  private anchorAt(cellX: number, cellY: number): BasinAnchor {
    const key = `${cellX}:${cellY}`;
    const cached = this.anchors.get(key);

    if (cached) {
      this.anchors.delete(key);
      this.anchors.set(key, cached);
      return cached;
    }

    const anchor = this.findAnchor(cellX, cellY);

    this.cacheAnchor(key, anchor);
    return anchor;
  }

  private cacheAnchor(key: string, anchor: BasinAnchor): void {
    if (this.anchors.size >= anchorCacheLimit) {
      const oldestKey = this.anchors.keys().next().value;

      if (oldestKey !== undefined) {
        this.anchors.delete(oldestKey);
      }
    }

    this.anchors.set(key, anchor);
  }

  private findAnchor(cellX: number, cellY: number): BasinAnchor {
    let lowest: BasinAnchor | null = null;
    const startX = cellX * this.cellSize - this.radius;
    const startY = cellY * this.cellSize - this.radius;
    const searchSize = this.cellSize + this.radius * 2;

    for (let y = startY; y < startY + searchSize; y += 1) {
      for (let x = startX; x < startX + searchSize; x += 1) {
        lowest = lowerAnchor(lowest, this.sampleAnchor({ x, y }));
      }
    }

    if (!lowest) {
      throw new Error("A basin cell must contain at least one tile.");
    }
    return lowest;
  }

  private sampleAnchor(tile: Tile): BasinAnchor {
    return { ...tile, ground: this.groundHeight(tile), wetness: this.wetness(tile) };
  }
}

function lowerAnchor(current: BasinAnchor | null, candidate: BasinAnchor): BasinAnchor {
  if (!current || candidate.ground < current.ground) {
    return candidate;
  }

  return candidate.ground === current.ground && candidate.wetness > current.wetness ? candidate : current;
}

function compareRankedAnchors(first: RankedAnchor, second: RankedAnchor): number {
  return first.distanceSquared - second.distanceSquared
    || first.anchor.x - second.anchor.x
    || first.anchor.y - second.anchor.y;
}

function squaredDistance(first: Tile, second: Tile): number {
  return (first.x - second.x) ** 2 + (first.y - second.y) ** 2;
}

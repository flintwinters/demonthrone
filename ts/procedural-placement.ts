import type { NoiseLayer } from "./domain.js";
import { cardinalDirections, neighborTile, tileKey } from "./grid.js";
import type { Tile, TilePredicate } from "./types.js";

export class PerlinSpawnField {
  private readonly consumedOrigins = new Set<string>();

  constructor(
    private readonly noise: NoiseLayer,
    private readonly threshold: number,
  ) {}

  materialize(centers: readonly Tile[], radius: number, isAvailable: TilePredicate): Tile[] {
    const visited = new Set<string>();
    const spawned: Tile[] = [];

    for (const center of centers) {
      this.scan(center, radius, visited, isAvailable, spawned);
    }

    return spawned;
  }

  private scan(
    center: Tile,
    radius: number,
    visited: Set<string>,
    isAvailable: TilePredicate,
    spawned: Tile[],
  ): void {
    for (let y = center.y - radius; y <= center.y + radius; y += 1) {
      for (let x = center.x - radius; x <= center.x + radius; x += 1) {
        this.trySpawn({ x, y }, visited, isAvailable, spawned);
      }
    }
  }

  private trySpawn(
    tile: Tile,
    visited: Set<string>,
    isAvailable: TilePredicate,
    spawned: Tile[],
  ): void {
    const key = tileKey(tile);

    if (visited.has(key) || this.consumedOrigins.has(key)) {
      return;
    }

    visited.add(key);

    if (isAvailable(tile) && this.isSpawnPeak(tile)) {
      this.consumedOrigins.add(key);
      spawned.push(tile);
    }
  }

  private isSpawnPeak(tile: Tile): boolean {
    const value = this.noise.value(tile);

    return value >= this.threshold
      && cardinalDirections.every((direction) => value > this.noise.value(neighborTile(tile, direction)));
  }
}

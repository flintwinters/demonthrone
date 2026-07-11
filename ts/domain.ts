import { l1Distance } from "./grid.js";
import { perlinNoise2d } from "./noise.js";
import type { BiomeKind, CharacterStats, Enemy, Terrain, TerrainKind, Tile, Unit } from "./types.js";

export type NoiseLayerConfig = {
  scale: number;
  seed: number;
};

export type HeightSample = "centered" | "crest" | "linear" | "terraced";

export class NoiseLayer {
  constructor(private readonly config: NoiseLayerConfig) {}

  value(tile: Tile): number {
    return perlinNoise2d(tile.x * this.config.scale, tile.y * this.config.scale, this.config.seed);
  }
}

export class HeightComponent {
  constructor(
    private readonly layer: NoiseLayer,
    private readonly sample: HeightSample,
    private readonly weight: number,
  ) {}

  value(tile: Tile): number {
    return sampleHeight(this.layer.value(tile), this.sample) * this.weight;
  }
}

export class HeightProfile {
  constructor(
    private readonly base: number,
    private readonly components: readonly HeightComponent[],
  ) {}

  value(tile: Tile): number {
    return this.components.reduce((height, component) => height + component.value(tile), this.base);
  }
}

export class BiomeProfile {
  constructor(
    readonly kind: BiomeKind,
    readonly height: HeightProfile,
    readonly boulderThreshold: number,
    readonly brushThreshold: number,
    readonly brushSightCost: number,
  ) {}
}

export class TerrainType {
  constructor(
    readonly kind: TerrainKind,
    readonly blocksMovement: boolean,
    private readonly baseSightCost: number,
  ) {}

  terrain(biome: BiomeProfile): Terrain {
    return {
      kind: this.kind,
      biome: biome.kind,
      blocksMovement: this.blocksMovement,
      sightCost: this.kind === "brush" ? biome.brushSightCost : this.baseSightCost,
    };
  }
}

export class SafeZone {
  constructor(
    private readonly center: Tile,
    private readonly radius: number,
  ) {}

  contains(tile: Tile): boolean {
    return l1Distance(tile, this.center) <= this.radius;
  }
}

export class CharacterTemplate {
  constructor(private readonly stats: CharacterStats) {}

  unit(id: string, tile: Tile, color: string): Unit {
    return {
      ...tile,
      ...this.stats,
      id,
      color,
      target: null,
      attackTargetId: null,
    };
  }

  enemy(id: string, tile: Tile, color: string): Enemy {
    return {
      ...tile,
      ...this.stats,
      id,
      color,
    };
  }
}

function sampleHeight(value: number, sample: HeightSample): number {
  if (sample === "centered") {
    return value - 0.5;
  }

  if (sample === "crest") {
    return 1 - Math.abs(value - 0.5) * 2;
  }

  if (sample === "terraced") {
    return Math.round(value * 4) / 4;
  }

  return value;
}

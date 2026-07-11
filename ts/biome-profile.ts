import { perlinNoise2d } from "./noise.js";
import type { BiomeKind, Terrain, TerrainKind, Tile } from "./types.js";

export type NoiseLayerConfig = { scale: number; seed: number };
export type HeightSample = "centered" | "crest" | "linear" | "terraced";
export type HeightComponentConfig = NoiseLayerConfig & { sample: HeightSample; weight: number };
export type NoiseFeatureConfig = NoiseLayerConfig & { threshold: number };
export type BiomeProfileConfig = {
  kind: BiomeKind;
  height: { base: number; components: readonly HeightComponentConfig[] };
  boulder: NoiseFeatureConfig;
  brush: NoiseFeatureConfig & { sightCost: number };
  water: NoiseFeatureConfig;
  ice: NoiseFeatureConfig;
};

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
  constructor(private readonly base: number, private readonly components: readonly HeightComponent[]) {}

  value(tile: Tile): number {
    return this.components.reduce((height, component) => height + component.value(tile), this.base);
  }
}

export class NoiseFeature {
  readonly layer: NoiseLayer;

  constructor(readonly config: NoiseFeatureConfig) {
    this.layer = new NoiseLayer(config);
  }

  value(tile: Tile): number {
    return this.layer.value(tile);
  }

  contains(tile: Tile): boolean {
    return this.value(tile) > this.config.threshold;
  }
}

export class BiomeProfile {
  readonly kind: BiomeKind;
  readonly height: HeightProfile;
  readonly boulder: NoiseFeature;
  readonly brush: NoiseFeature;
  readonly water: NoiseFeature;
  readonly ice: NoiseFeature;
  readonly brushSightCost: number;

  constructor(readonly config: BiomeProfileConfig) {
    this.kind = config.kind;
    this.height = new HeightProfile(config.height.base, config.height.components.map(heightComponent));
    this.boulder = new NoiseFeature(config.boulder);
    this.brush = new NoiseFeature(config.brush);
    this.water = new NoiseFeature(config.water);
    this.ice = new NoiseFeature(config.ice);
    this.brushSightCost = config.brush.sightCost;
  }
}

export class TerrainType {
  constructor(
    readonly kind: TerrainKind,
    readonly blocksMovement: boolean,
    private readonly baseSightCost: number,
    private readonly baseMovementCost: number,
  ) {}

  terrain(biome: BiomeProfile): Terrain {
    return {
      kind: this.kind,
      biome: biome.kind,
      blocksMovement: this.blocksMovement,
      sightCost: this.kind === "brush" ? biome.brushSightCost : this.baseSightCost,
      movementCost: this.baseMovementCost,
    };
  }
}

function sampleHeight(value: number, sample: HeightSample): number {
  if (sample === "centered") return value - 0.5;
  if (sample === "crest") return 1 - Math.abs(value - 0.5) * 2;
  if (sample === "terraced") return Math.round(value * 4) / 4;
  return value;
}

function heightComponent(config: HeightComponentConfig): HeightComponent {
  return new HeightComponent(new NoiseLayer(config), config.sample, config.weight);
}

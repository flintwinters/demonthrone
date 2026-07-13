import { perlinNoise2d } from "./noise.js";
import type { BiomeKind, Terrain, TerrainKind, Tile } from "./types.js";

export type NoiseLayerConfig = { scale: number; magnitude: number; seed: number };
export type ContourPathConfig = NoiseLayerConfig & { center: number; halfWidth: number };
export type HeightSample = "centered" | "crest" | "linear" | "terraced";
export type HeightComponentConfig = {
  wavelength: number;
  amplitude: number;
  seed: number;
  sample: HeightSample;
};
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
    return perlinNoise2d(tile.x * this.config.scale, tile.y * this.config.scale, this.config.seed)
      * this.config.magnitude;
  }
}

export class ContourPathField {
  private readonly layer: NoiseLayer;

  constructor(readonly config: ContourPathConfig) {
    this.layer = new NoiseLayer(config);
  }

  contains(tile: Tile): boolean {
    return Math.abs(this.layer.value(tile) - this.config.center) <= this.config.halfWidth;
  }
}

export class HeightComponent {
  constructor(private readonly config: HeightComponentConfig) {}

  value(tile: Tile): number {
    const noise = perlinNoise2d(
      tile.x / this.config.wavelength,
      tile.y / this.config.wavelength,
      this.config.seed,
    );

    return sampleHeight(noise, this.config.sample) * this.config.amplitude;
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
  return new HeightComponent(config);
}

import { l1Distance } from "./grid.js";
import { perlinNoise2d } from "./noise.js";
import type {
  BiomeKind,
  Character,
  CharacterStats,
  Enemy,
  Entity,
  Pushable,
  Terrain,
  TerrainKind,
  Tile,
  Unit,
} from "./types.js";

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
    readonly waterThreshold: number,
  ) {}
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

export class SafeZone {
  constructor(
    private readonly center: Tile,
    private readonly radius: number,
  ) {}

  contains(tile: Tile): boolean {
    return l1Distance(tile, this.center) <= this.radius;
  }
}

export abstract class EntityTemplate<TEntity extends Entity> {
  constructor(readonly entityType: string) {}

  abstract create(id: string, tile: Tile): TEntity;
}

abstract class CharacterTemplate<TEntity extends Character> extends EntityTemplate<TEntity> {
  constructor(
    entityType: string,
    protected readonly stats: CharacterStats,
    protected readonly color: string,
  ) {
    super(entityType);
  }
}

export class TeammateTemplate extends CharacterTemplate<Unit> {
  create(id: string, tile: Tile): Unit {
    return {
      ...tile,
      ...this.stats,
      id,
      entityKind: "teammate",
      entityType: this.entityType,
      color: this.color,
      target: null,
      attackTargetId: null,
    };
  }
}

export class EnemyTemplate extends CharacterTemplate<Enemy> {
  create(id: string, tile: Tile): Enemy {
    return {
      ...tile,
      ...this.stats,
      id,
      entityKind: "enemy",
      entityType: this.entityType,
      color: this.color,
    };
  }
}

export class PushableTemplate extends EntityTemplate<Pushable> {
  constructor(entityType: string, private readonly health: number) {
    super(entityType);
  }

  create(id: string, tile: Tile): Pushable {
    return {
      id,
      ...tile,
      entityKind: "object",
      entityType: this.entityType,
      health: this.health,
      target: null,
      pushedByUnitId: null,
      enchanterUnitId: null,
      followsId: null,
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

import { l1Distance } from "./grid.js";
import { perlinNoise2d } from "./noise.js";
export class NoiseLayer {
    config;
    constructor(config) {
        this.config = config;
    }
    value(tile) {
        return perlinNoise2d(tile.x * this.config.scale, tile.y * this.config.scale, this.config.seed);
    }
}
export class HeightComponent {
    layer;
    sample;
    weight;
    constructor(layer, sample, weight) {
        this.layer = layer;
        this.sample = sample;
        this.weight = weight;
    }
    value(tile) {
        return sampleHeight(this.layer.value(tile), this.sample) * this.weight;
    }
}
export class HeightProfile {
    base;
    components;
    constructor(base, components) {
        this.base = base;
        this.components = components;
    }
    value(tile) {
        return this.components.reduce((height, component) => height + component.value(tile), this.base);
    }
}
export class BiomeProfile {
    kind;
    height;
    boulderThreshold;
    brushThreshold;
    brushSightCost;
    waterThreshold;
    constructor(kind, height, boulderThreshold, brushThreshold, brushSightCost, waterThreshold) {
        this.kind = kind;
        this.height = height;
        this.boulderThreshold = boulderThreshold;
        this.brushThreshold = brushThreshold;
        this.brushSightCost = brushSightCost;
        this.waterThreshold = waterThreshold;
    }
}
export class TerrainType {
    kind;
    blocksMovement;
    baseSightCost;
    baseMovementCost;
    constructor(kind, blocksMovement, baseSightCost, baseMovementCost) {
        this.kind = kind;
        this.blocksMovement = blocksMovement;
        this.baseSightCost = baseSightCost;
        this.baseMovementCost = baseMovementCost;
    }
    terrain(biome) {
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
    center;
    radius;
    constructor(center, radius) {
        this.center = center;
        this.radius = radius;
    }
    contains(tile) {
        return l1Distance(tile, this.center) <= this.radius;
    }
}
export class EntityTemplate {
    entityType;
    constructor(entityType) {
        this.entityType = entityType;
    }
}
class CharacterTemplate extends EntityTemplate {
    stats;
    color;
    constructor(entityType, stats, color) {
        super(entityType);
        this.stats = stats;
        this.color = color;
    }
}
export class TeammateTemplate extends CharacterTemplate {
    create(id, tile) {
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
export class EnemyTemplate extends CharacterTemplate {
    create(id, tile) {
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
export class PushableTemplate extends EntityTemplate {
    health;
    constructor(entityType, health) {
        super(entityType);
        this.health = health;
    }
    create(id, tile) {
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
function sampleHeight(value, sample) {
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

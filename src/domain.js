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
export class CharacterTemplate {
    stats;
    constructor(stats) {
        this.stats = stats;
    }
    unit(id, tile, color) {
        return {
            ...tile,
            ...this.stats,
            id,
            color,
            target: null,
            attackTargetId: null,
        };
    }
    enemy(id, tile, color) {
        return {
            ...tile,
            ...this.stats,
            id,
            color,
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

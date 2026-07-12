import { perlinNoise2d } from "./noise.js";
export class NoiseLayer {
    config;
    constructor(config) {
        this.config = config;
    }
    value(tile) {
        return perlinNoise2d(tile.x * this.config.scale, tile.y * this.config.scale, this.config.seed)
            * this.config.magnitude;
    }
}
export class HeightComponent {
    config;
    constructor(config) {
        this.config = config;
    }
    value(tile) {
        const noise = perlinNoise2d(tile.x / this.config.wavelength, tile.y / this.config.wavelength, this.config.seed);
        return sampleHeight(noise, this.config.sample) * this.config.amplitude;
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
export class NoiseFeature {
    config;
    layer;
    constructor(config) {
        this.config = config;
        this.layer = new NoiseLayer(config);
    }
    value(tile) {
        return this.layer.value(tile);
    }
    contains(tile) {
        return this.value(tile) > this.config.threshold;
    }
}
export class BiomeProfile {
    config;
    kind;
    height;
    boulder;
    brush;
    water;
    ice;
    brushSightCost;
    constructor(config) {
        this.config = config;
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
function sampleHeight(value, sample) {
    if (sample === "centered")
        return value - 0.5;
    if (sample === "crest")
        return 1 - Math.abs(value - 0.5) * 2;
    if (sample === "terraced")
        return Math.round(value * 4) / 4;
    return value;
}
function heightComponent(config) {
    return new HeightComponent(config);
}

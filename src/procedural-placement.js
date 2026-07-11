import { cardinalDirections, neighborTile, tileKey } from "./grid.js";
export class PerlinSpawnField {
    noise;
    threshold;
    consumedOrigins = new Set();
    constructor(noise, threshold) {
        this.noise = noise;
        this.threshold = threshold;
    }
    materialize(centers, radius, isAvailable) {
        const visited = new Set();
        const spawned = [];
        for (const center of centers) {
            this.scan(center, radius, visited, isAvailable, spawned);
        }
        return spawned;
    }
    scan(center, radius, visited, isAvailable, spawned) {
        for (let y = center.y - radius; y <= center.y + radius; y += 1) {
            for (let x = center.x - radius; x <= center.x + radius; x += 1) {
                this.trySpawn({ x, y }, visited, isAvailable, spawned);
            }
        }
    }
    trySpawn(tile, visited, isAvailable, spawned) {
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
    isSpawnPeak(tile) {
        const value = this.noise.value(tile);
        return value >= this.threshold
            && cardinalDirections.every((direction) => value > this.noise.value(neighborTile(tile, direction)));
    }
}

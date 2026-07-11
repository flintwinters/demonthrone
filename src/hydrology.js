const anchorCacheLimit = 2048;
export class BasinField {
    cellSize;
    radius;
    depth;
    groundHeight;
    wetness;
    anchors = new Map();
    constructor(cellSize, radius, depth, groundHeight, wetness) {
        this.cellSize = cellSize;
        this.radius = radius;
        this.depth = depth;
        this.groundHeight = groundHeight;
        this.wetness = wetness;
    }
    surfaceAt(tile, isWet) {
        const [nearest, second] = this.rankedAnchors(tile);
        if (!nearest || !second || !this.belongsToBasin(nearest, second)) {
            return null;
        }
        const { anchor } = nearest;
        const surface = anchor.ground + this.depth;
        return this.isFlooded(anchor, tile, surface, isWet) ? surface : null;
    }
    isFlooded(anchor, tile, surface, isWet) {
        return isWet(anchor) && isWet(tile) && this.groundHeight(tile) <= surface;
    }
    belongsToBasin(nearest, second) {
        const maximumDistance = this.radius * this.radius;
        const ownershipMargin = second.distanceSquared - nearest.distanceSquared;
        return nearest.distanceSquared <= maximumDistance && ownershipMargin > 1;
    }
    rankedAnchors(tile) {
        const cellX = Math.floor(tile.x / this.cellSize);
        const cellY = Math.floor(tile.y / this.cellSize);
        const ranked = new Map();
        for (let y = cellY - 1; y <= cellY + 1; y += 1) {
            for (let x = cellX - 1; x <= cellX + 1; x += 1) {
                const anchor = this.anchorAt(x, y);
                ranked.set(`${anchor.x}:${anchor.y}`, { anchor, distanceSquared: squaredDistance(tile, anchor) });
            }
        }
        return [...ranked.values()].sort(compareRankedAnchors);
    }
    anchorAt(cellX, cellY) {
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
    cacheAnchor(key, anchor) {
        if (this.anchors.size >= anchorCacheLimit) {
            const oldestKey = this.anchors.keys().next().value;
            if (oldestKey !== undefined) {
                this.anchors.delete(oldestKey);
            }
        }
        this.anchors.set(key, anchor);
    }
    findAnchor(cellX, cellY) {
        let lowest = null;
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
    sampleAnchor(tile) {
        return { ...tile, ground: this.groundHeight(tile), wetness: this.wetness(tile) };
    }
}
function lowerAnchor(current, candidate) {
    if (!current || candidate.ground < current.ground) {
        return candidate;
    }
    return candidate.ground === current.ground && candidate.wetness > current.wetness ? candidate : current;
}
function compareRankedAnchors(first, second) {
    return first.distanceSquared - second.distanceSquared
        || first.anchor.x - second.anchor.x
        || first.anchor.y - second.anchor.y;
}
function squaredDistance(first, second) {
    return (first.x - second.x) ** 2 + (first.y - second.y) ** 2;
}

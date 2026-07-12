import { l1Distance } from "./grid.js";
export * from "./biome-profile.js";
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
    enemyType;
    enemyStats;
    constructor(enemyType, enemyStats, color) {
        super(enemyType, enemyStats, color);
        this.enemyType = enemyType;
        this.enemyStats = enemyStats;
    }
    create(id, tile) {
        return {
            ...tile,
            ...this.enemyStats,
            id,
            entityKind: "enemy",
            entityType: this.enemyType,
            color: this.color,
            turnsUntilMove: 0,
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

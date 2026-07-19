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
    infoText;
    constructor(entityType, infoText) {
        this.entityType = entityType;
        this.infoText = infoText;
    }
}
class CharacterTemplate extends EntityTemplate {
    stats;
    color;
    constructor(entityType, infoText, stats, color) {
        super(entityType, infoText);
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
            infoText: this.infoText,
            color: this.color,
            target: null,
            attackTargetId: null,
        };
    }
}
export class EnemyTemplate extends CharacterTemplate {
    enemyType;
    enemyStats;
    constructor(enemyType, infoText, enemyStats, color) {
        super(enemyType, infoText, enemyStats, color);
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
            infoText: this.infoText,
            color: this.color,
            turnsUntilMove: 0,
        };
    }
}
export class PushableTemplate extends EntityTemplate {
    health;
    constructor(entityType, infoText, health) {
        super(entityType, infoText);
        this.health = health;
    }
    create(id, tile) {
        return {
            id,
            ...tile,
            entityKind: "object",
            entityType: this.entityType,
            infoText: this.infoText,
            health: this.health,
            target: null,
            pushedByUnitId: null,
            enchanterUnitId: null,
            followsId: null,
        };
    }
}

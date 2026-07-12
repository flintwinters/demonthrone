import { l1Distance } from "./grid.js";
import type {
  Character,
  CharacterStats,
  Enemy,
  EnemyStats,
  EnemyType,
  Entity,
  Pushable,
  Tile,
  Unit,
} from "./types.js";

export * from "./biome-profile.js";

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
  constructor(private readonly enemyType: EnemyType, private readonly enemyStats: EnemyStats, color: string) {
    super(enemyType, enemyStats, color);
  }

  create(id: string, tile: Tile): Enemy {
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

export type Tile = {
  x: number;
  y: number;
};

export type BiomeKind = "cinder" | "fen" | "heath" | "ridge" | "bog" | "mesa";
export type TerrainKind = "floor" | "boulder" | "brush" | "ice" | "water";

export type Terrain = {
  kind: TerrainKind;
  biome: BiomeKind;
  blocksMovement: boolean;
  sightCost: number;
  movementCost: number;
};

export type HeightTile = Tile & {
  height: number;
};

export type Point3 = {
  x: number;
  y: number;
  z: number;
};

export type SightBlocker = Tile & {
  bottom: number;
  top: number;
};

export type CharacterStats = {
  sight: number;
  movement: number;
  attackRange: number;
  health: number;
};

export interface Entity extends Tile {
  id: string;
  entityKind: "teammate" | "enemy" | "object";
  entityType: string;
}

export interface DamageableEntity extends Entity {
  health: number;
}

export interface Character extends DamageableEntity, CharacterStats {
  color: string;
}

export interface Teammate extends Character {
  entityKind: "teammate";
  target: Tile | null;
  attackTargetId: string | null;
}

export type Unit = Teammate;

export interface Enemy extends Character {
  entityKind: "enemy";
}

export interface WorldObject extends DamageableEntity {
  entityKind: "object";
}

export interface Pushable extends WorldObject {
  target: Tile | null;
  pushedByUnitId: string | null;
  enchanterUnitId: string | null;
  followsId: string | null;
}

export type RenderPiece = Entity & {
  color: string;
  height: number;
};

export type RenderUnit = Unit & {
  height: number;
  target: HeightTile | null;
};

export type RenderEnemy = Enemy & {
  height: number;
};

export type RenderTombstone = Tile & {
  height: number;
};

export type RenderPushable = Pushable & {
  height: number;
  isEnchantmentSource: boolean;
  target: HeightTile | null;
};

export type TilePredicate = (tile: Tile) => boolean;
export type DamageableEntityPredicate = (entity: DamageableEntity) => boolean;
export type TileHeight = (tile: Tile) => number;
export type TileMovementCost = (tile: Tile) => number;
export type TileSightCost = (tile: Tile) => number;

export type ScreenPoint = {
  x: number;
  y: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

export type PointerMap = Map<number, ScreenPoint>;

export type BoardState = {
  selectedTile: HeightTile | null;
  hoveredTile: HeightTile | null;
  units: RenderUnit[];
  enemies: RenderEnemy[];
  sightBlockers: SightBlocker[];
  tombstones: RenderTombstone[];
  pushables: RenderPushable[];
  isObstacleTile: TilePredicate;
  isBoulderTile: TilePredicate;
  isBrushTile: TilePredicate;
  sightCost: TileSightCost;
  selectedUnitId: string | null;
  tileHeight: TileHeight;
  isMovementTile: TilePredicate;
  isAttackTile: TilePredicate;
};

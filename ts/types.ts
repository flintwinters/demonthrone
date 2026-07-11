export type Tile = {
  x: number;
  y: number;
};

export type BiomeKind = "cinder" | "fen" | "heath" | "ridge";
export type TerrainKind = "floor" | "boulder" | "brush";

export type Terrain = {
  kind: TerrainKind;
  biome: BiomeKind;
  blocksMovement: boolean;
  sightCost: number;
};

export type HeightTile = Tile & {
  height: number;
};

export type CharacterStats = {
  sight: number;
  movement: number;
  attackRange: number;
  health: number;
};

export type Unit = Tile & CharacterStats & {
  id: string;
  color: string;
  target: Tile | null;
};

export type Enemy = Tile & CharacterStats & {
  id: string;
  color: string;
};

export type Pushable = Tile & {
  id: string;
  target: Tile | null;
  pushedByUnitId: string | null;
  enchanterUnitId: string | null;
  followsId: string | null;
};

export type RenderPiece = Tile & {
  id: string;
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
  target: HeightTile | null;
};

export type TilePredicate = (tile: Tile) => boolean;
export type TileHeight = (tile: Tile) => number;
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
  sightBlockers: Tile[];
  tombstones: RenderTombstone[];
  pushables: RenderPushable[];
  isObstacleTile: TilePredicate;
  isBrushTile: TilePredicate;
  sightCost: TileSightCost;
  selectedUnitId: string | null;
  tileHeight: TileHeight;
  isMovementTile: TilePredicate;
};

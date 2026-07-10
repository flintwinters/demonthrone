export type Tile = {
  x: number;
  y: number;
};

export type HeightTile = Tile & {
  height: number;
};

export type Unit = Tile & {
  id: string;
  color: string;
  lineOfSight: number;
  movement: number;
  target: Tile | null;
};

export type Enemy = Tile & {
  id: string;
  color: string;
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
  tombstones: RenderTombstone[];
  isObstacleTile: TilePredicate;
  isBrushTile: TilePredicate;
  sightCost: TileSightCost;
  selectedUnitId: string | null;
  tileHeight: TileHeight;
  isMovementTile: TilePredicate;
  isTileVisible: TilePredicate;
};

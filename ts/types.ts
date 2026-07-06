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

export type RenderUnit = Unit & {
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
  isObstacleTile: TilePredicate;
  isBrushTile: TilePredicate;
  sightCost: TileSightCost;
  selectedUnitId: string | null;
  tileHeight: TileHeight;
  isMovementTile: TilePredicate;
  isTileVisible: TilePredicate;
};

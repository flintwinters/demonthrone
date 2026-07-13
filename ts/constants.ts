import type { BiomeKind } from "./types.js";

export const tile = {
  width: 1,
  height: 1,
};

export const terrainHeight = {
  min: -32,
  max: 49,
  mappingMin: -2,
  mappingMax: 7,
  contrast: 1.25,
  step: 0.32,
  visualScale: 0.5,
};

export const sightGeometry = {
  eyeHeight: 0.38,
  characterBottom: 0.08,
  characterTop: 0.62,
  characterTargetHeight: 0.32,
  boulderHeight: 0.66,
  surfaceClearance: 0.001,
};

export const gridTopOffset = 72;
export const worldPixelsPerUnit = 76;
export const cameraDistance = 80;
export const cameraElevation = Math.atan(Math.SQRT1_2);
export const dragThreshold = 3;
export const mouseRotateSpeed = -0.008;
export const mousePitchSpeed = -0.006;
export const wheelDeltaLineMode = 1;

export const rotationControlStep = Math.PI / 96;
export const rotationControlInterval = 16;

export const colors = {
  background: "#000000",
  tile: "#282828",
  tileSideLeft: "#1d2021",
  tileSideRight: "#3c3836",
  tileBottom: "#1d2021",
  tileEdge: "#665c54",
  cinderTile: "#1d2021",
  cinderTileSide: "#282828",
  fenTile: "#3f5f4a",
  fenTileSide: "#2d4f4b",
  heathTile: "#32302f",
  heathTileSide: "#3c3836",
  ridgeTile: "#504945",
  ridgeTileSide: "#665c54",
  bogTile: "#203028",
  bogTileSide: "#2d4540",
  mesaTile: "#8a6640",
  mesaTileSide: "#6f4d32",
  waterTile: "#076678",
  waterTileSide: "#054f5f",
  iceTile: "#83a598",
  iceTileSide: "#458588",
  hoveredTile: "#32302f",
  selectedTile: "#3c3836",
  selectedTileOutline: "#fbf1c7",
  tileStroke: "#928374",
  moveStart: "#665c54",
  movementTile: "#3f6f67",
  hoveredMovementTile: "#4c7f73",
  movementTileSideRight: "#4c7f73",
  movementTileStroke: "#8ec07c",
  moveTarget: "#458588",
  attackTile: "#9d0006",
  hoveredAttackTile: "#cc241d",
  attackTarget: "#fb4934",
  enchantmentLine: "#8fbcbb",
  brushCinder: "#6f7b35",
  brushFen: "#46735a",
  brushHeath: "#66731e",
  brushRidge: "#4c664e",
  brushBog: "#2b563f",
  brushMesa: "#8a6843",
  boulder: "#6a6f94",
  pushable: "#fabd2f",
  enchantedPushable: "#b8bb26",
  unitOne: "#fe5f55",
  unitTwo: "#d5d83d",
  unitThree: "#d65d0e",
  enemy: "#e6a4ba",
  nephilim: "#d3869b",
  tombstone: "#a89984",
  health: "#fbf1c7",
};

export const foliageColors = {
  cinder: colors.brushCinder,
  fen: colors.brushFen,
  heath: colors.brushHeath,
  ridge: colors.brushRidge,
  bog: colors.brushBog,
  mesa: colors.brushMesa,
} satisfies Record<BiomeKind, string>;

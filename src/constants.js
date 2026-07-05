export const tile = {
  width: 96,
  height: 48,
};

export const terrainHeight = {
  min: 0,
  max: 5,
  step: tile.height / 2,
};

export const gridTopOffset = 72;
export const dragThreshold = 3;
export const mouseRotateSpeed = -0.008;
export const wheelDeltaLineMode = 1;

export const zoomLimits = {
  min: 0.5,
  max: 2.5,
};
export const rotationControlStep = Math.PI / 96;
export const rotationControlInterval = 16;

export const colors = {
  background: "#1d2021",
  tile: "#282828",
  tileSideLeft: "#1d2021",
  tileSideRight: "#3c3836",
  selectedTile: "#3c3836",
  tileStroke: "#928374",
  selectedTileStroke: "#fabd2f",
  moveLine: "#83a598",
  movementTile: "#3f6f67",
  movementTileStroke: "#8ec07c",
  moveTarget: "#458588",
  moveTargetFill: "rgba(69, 133, 136, 0.28)",
  boulder: "#665c54",
  boulderShadow: "#1d2021",
  boulderTop: "#928374",
  unitBase: "#1d2021",
  unitOne: "#fb4934",
  unitTwo: "#b8bb26",
};

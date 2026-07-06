export const tile = {
    width: 1,
    height: 1,
};
export const terrainHeight = {
    min: 0,
    max: 5,
    step: 0.32,
    visualScale: 0.5,
};
export const gridTopOffset = 72;
export const worldPixelsPerUnit = 76;
export const cameraDistance = 80;
export const cameraElevation = Math.atan(Math.SQRT1_2);
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
    tileBottom: "#1d2021",
    tileEdge: "#504945",
    hoveredTile: "#32302f",
    selectedTile: "#3c3836",
    tileStroke: "#928374",
    selectedTileStroke: "#fabd2f",
    moveLine: "#83a598",
    movementTile: "#3f6f67",
    hoveredMovementTile: "#4c7f73",
    movementTileSideLeft: "#2d4f4b",
    movementTileSideRight: "#4c7f73",
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

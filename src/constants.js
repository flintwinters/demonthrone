export const tile = {
    width: 1,
    height: 1,
};
export const terrainHeight = {
    min: -2,
    max: 7,
    contrast: 1.25,
    step: 0.32,
    visualScale: 0.5,
};
export const gridTopOffset = 72;
export const worldPixelsPerUnit = 76;
export const cameraDistance = 80;
export const cameraElevation = Math.atan(Math.SQRT1_2);
export const cameraElevationLimits = {
    min: 0.12,
    max: 1.5,
};
export const dragThreshold = 3;
export const mouseRotateSpeed = -0.008;
export const mousePitchSpeed = -0.006;
export const wheelDeltaLineMode = 1;
export const rotationControlStep = Math.PI / 96;
export const rotationControlInterval = 16;
export const colors = {
    background: "#1d2021",
    tile: "#282828",
    tileSideLeft: "#1d2021",
    tileSideRight: "#3c3836",
    tileBottom: "#1d2021",
    tileEdge: "#504945",
    cinderTile: "#1d2021",
    cinderTileSide: "#282828",
    fenTile: "#3f5f4a",
    fenTileSide: "#2d4f4b",
    heathTile: "#32302f",
    heathTileSide: "#3c3836",
    ridgeTile: "#504945",
    ridgeTileSide: "#665c54",
    waterTile: "#076678",
    waterTileSide: "#054f5f",
    iceTile: "#83a598",
    iceTileSide: "#458588",
    hoveredTile: "#32302f",
    selectedTile: "#3c3836",
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
    brushCinder: "#4f5014",
    brushFen: "#3f5942",
    brushHeath: "#515318",
    brushRidge: "#354d37",
    boulder: "#7c6f64",
    pushable: "#fabd2f",
    enchantedPushable: "#b8bb26",
    unitOne: "#fe5f55",
    unitTwo: "#d5d83d",
    enemy: "#e6a4ba",
    tombstone: "#a89984",
    health: "#fbf1c7",
};
export const foliageColors = {
    cinder: colors.brushCinder,
    fen: colors.brushFen,
    heath: colors.brushHeath,
    ridge: colors.brushRidge,
};

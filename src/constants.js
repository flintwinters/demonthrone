export const tile = {
    width: 1,
    height: 1,
};
export const terrainHeight = {
    min: -32,
    max: 37,
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
    background: "#111516",
    tile: "#3d3936",
    tileSideLeft: "#292726",
    tileSideRight: "#514b46",
    tileBottom: "#252526",
    tileEdge: "#827468",
    cinderTile: "#713642",
    cinderTileSide: "#472932",
    fenTile: "#43835a",
    fenTileSide: "#2d5c40",
    heathTile: "#767b3d",
    heathTileSide: "#4c502b",
    ridgeTile: "#7b5b49",
    ridgeTileSide: "#503c34",
    bogTile: "#2d674f",
    bogTileSide: "#1d4639",
    mesaTile: "#b7773d",
    mesaTileSide: "#7d4d2f",
    wallTile: "#b5b5b5",
    wallTileSide: "#7d7d7d",
    waterTile: "#147f96",
    waterTileSide: "#0b596c",
    iceTile: "#94c9c1",
    iceTileSide: "#528e98",
    hoveredTile: "#655a50",
    selectedTile: "#796b5d",
    selectedTileOutline: "#fff0c0",
    tileStroke: "#b8aa91",
    moveStart: "#8a7d68",
    movementTile: "#3d856f",
    hoveredMovementTile: "#50a087",
    movementTileSideRight: "#33715f",
    movementTileStroke: "#a9d983",
    moveTarget: "#4aa0a1",
    attackTile: "#ad2428",
    hoveredAttackTile: "#da3f35",
    attackTarget: "#ff6757",
    enchantmentLine: "#9ed9d2",
    brushCinder: "#84943b",
    brushFen: "#438060",
    brushHeath: "#7b8b2c",
    brushRidge: "#587a55",
    brushBog: "#326d4e",
    brushMesa: "#9b713b",
    boulder: "#8088b9",
    pushable: "#ffc43d",
    enchantedPushable: "#c8d43b",
    unitOne: "#ff695e",
    unitTwo: "#e1e448",
    unitThree: "#ef7b22",
    enemy: "#f093b1",
    nephilim: "#d76f99",
    tombstone: "#b8aa96",
    health: "#fff0c0",
};
export const foliageColors = {
    cinder: colors.brushCinder,
    fen: colors.brushFen,
    heath: colors.brushHeath,
    ridge: colors.brushRidge,
    bog: colors.brushBog,
    mesa: colors.brushMesa,
};

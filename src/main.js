import { devicePixelRatio, gridFromScreen, screenFromGrid, view } from "./camera.js";
import { terrainHeight } from "./constants.js";
import { connectInput } from "./input.js";
import { canReachTile } from "./movement.js";
import { isObstacleTile } from "./obstacles.js";
import { drawGrid } from "./renderer.js";
import { connectRotationControls } from "./rotation-controls.js";
import { connectViewCube } from "./view-cube.js";
import { isBrushTile, sightCost, tileHeight } from "./world.js";
import { clickBoardTile, commitPlannedMoves, plannedUnits, selection, selectedUnit, units, } from "./units.js";
import { isVisibleTile, l1Distance } from "./visibility.js";
const unitPickRadius = 30;
const unitPickMinRadius = 18;
const unitPickHeight = 0.3;
const canvas = requiredElement("#grid");
const goButton = requiredElement("#go");
const rotateLeftButton = requiredElement("#rotate-left");
const rotateRightButton = requiredElement("#rotate-right");
let selectedTile = null;
let hoveredTile = null;
function draw() {
    drawGrid(canvas, boardState());
    syncGoButton();
}
function resize() {
    const pixelRatio = devicePixelRatio();
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    draw();
}
function selectTile(tile) {
    selectedTile = tile && canSeeTile(tile) ? clickBoardTile(enrichTile(tile), canMoveToTile) : null;
    draw();
}
function hoverTile(tile) {
    const nextTile = tile && canSeeTile(tile) ? enrichTile(tile) : null;
    if (sameTile(hoveredTile, nextTile)) {
        return;
    }
    hoveredTile = nextTile;
    draw();
}
function pickSelectableTile(point) {
    return pickUnitTile(point) ?? terrainTileAt(point);
}
function boardState() {
    return {
        selectedTile,
        hoveredTile,
        units: renderableUnits(),
        isObstacleTile,
        isBrushTile,
        sightCost,
        selectedUnitId: selection.unitId,
        tileHeight,
        isMovementTile: canSelectedUnitMoveTo,
        isTileVisible: canSeeTile,
    };
}
function canSeeTile(tile) {
    return isVisibleTile(tile, units, sightCost);
}
function canSelectedUnitMoveTo(tile) {
    const unit = selectedUnit();
    return unit ? canMoveToTile(tile, unit) : false;
}
function canMoveToTile(tile, unit) {
    const distance = l1Distance(tile, unit);
    return canSeeTile(tile)
        && !isMovementBlocked(tile)
        && distance <= unit.movement
        && canReachTile(unit, tile, unit.movement, isMovementBlocked);
}
function pickUnitTile(point) {
    let nearest = null;
    let nearestDistance = pickRadius();
    for (const unit of units) {
        if (!canSeeTile(unit)) {
            continue;
        }
        const distance = screenDistance(point, unitScreenPoint(unit));
        if (distance < nearestDistance) {
            nearest = unit;
            nearestDistance = distance;
        }
    }
    return nearest ? { x: nearest.x, y: nearest.y } : null;
}
function terrainTileAt(point) {
    return gridFromScreen(canvas, point.x, point.y, tileHeight);
}
function renderableUnits() {
    return units.map((unit) => ({
        ...unit,
        height: tileHeight(unit),
        target: unit.target ? enrichTile(unit.target) : null,
    }));
}
function enrichTile(tile) {
    return {
        ...tile,
        height: tileHeight(tile),
    };
}
function isMovementBlocked(tile) {
    return isObstacleTile(tile) || isOccupiedTile(tile);
}
function isOccupiedTile(tile) {
    return units.some((unit) => unit.x === tile.x && unit.y === tile.y);
}
function unitScreenPoint(unit) {
    return screenFromGrid(canvas, unit.x + 0.5, unit.y + 0.5, visualHeight(tileHeight(unit)) + unitPickHeight);
}
function screenDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
}
function sameTile(first, second) {
    return first?.x === second?.x && first?.y === second?.y;
}
function pickRadius() {
    return Math.max(unitPickMinRadius, unitPickRadius * view.zoom);
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}
function syncGoButton() {
    goButton.hidden = plannedUnits().length === 0;
}
function go() {
    if (plannedUnits().length === 0) {
        return;
    }
    commitPlannedMoves();
    draw();
}
function handleKeyDown(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        go();
    }
}
connectInput(canvas, selectTile, hoverTile, draw, tileHeight, pickSelectableTile);
connectRotationControls(canvas, { left: rotateLeftButton, right: rotateRightButton }, draw);
connectViewCube(canvas, draw);
goButton.addEventListener("click", go);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("resize", resize);
resize();
function requiredElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Missing required element: ${selector}`);
    }
    return element;
}

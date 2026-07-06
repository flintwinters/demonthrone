import { devicePixelRatio } from "./camera.js";
import { connectInput } from "./input.js";
import { canReachTile } from "./movement.js";
import { isObstacleTile } from "./obstacles.js";
import { drawGrid } from "./renderer.js";
import { connectRotationControls } from "./rotation-controls.js";
import { isSightBlockingTile, tileHeight } from "./world.js";
import { clickBoardTile, commitPlannedMoves, plannedUnits, selection, selectedUnit, units, } from "./units.js";
import { isVisibleTile, l1Distance } from "./visibility.js";
const canvas = requiredElement("#grid");
const goButton = requiredElement("#go");
const rotateLeftButton = requiredElement("#rotate-left");
const rotateRightButton = requiredElement("#rotate-right");
let selectedTile = null;
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
function boardState() {
    return {
        selectedTile,
        units: renderableUnits(),
        isObstacleTile,
        selectedUnitId: selection.unitId,
        tileHeight,
        isMovementTile: canSelectedUnitMoveTo,
        isTileVisible: canSeeTile,
    };
}
function canSeeTile(tile) {
    return isVisibleTile(tile, units, isSightBlockingTile);
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
connectInput(canvas, selectTile, draw, tileHeight);
connectRotationControls(canvas, { left: rotateLeftButton, right: rotateRightButton }, draw);
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

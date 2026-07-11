import { boardState, canSeeTile, enrichTile } from "./board-state.js";
import { devicePixelRatio, gridFromScreen, screenFromGrid, view } from "./camera.js";
import { terrainHeight } from "./constants.js";
import { attackUnits, moveEnemies, randomEnemies } from "./enemies.js";
import { chaseEnchanters } from "./enchantment.js";
import { connectEnchantmentControl } from "./enchantment-control.js";
import { l1Distance, sameTile } from "./grid.js";
import { connectInput } from "./input.js";
import { canReachTile } from "./movement.js";
import { isBoardObstacle } from "./obstacles.js";
import { canPushTo, clearPlannedPush, commitPlannedPushes, isPushableTile, planPush, pushables } from "./pushables.js";
import { drawGrid } from "./renderer.js";
import { connectRotationControls } from "./rotation-controls.js";
import { tileHeight } from "./world.js";
import { connectTurnControl } from "./turn-control.js";
import { canTakeAction, resetActions } from "./teammate-turns.js";
import { clickBoardTile, commitPlannedMoves, selection, selectedUnit, units, } from "./units.js";
const unitPickRadius = 30;
const unitPickMinRadius = 18;
const unitPickHeight = 0.3;
const canvas = requiredElement("#grid");
const goButton = requiredElement("#go");
const rotateLeftButton = requiredElement("#rotate-left");
const rotateRightButton = requiredElement("#rotate-right");
let selectedTile = null;
let hoveredTile = null;
const enemies = randomEnemies(units, isBoardObstacle);
const tombstones = [];
let focusedTile = null;
const enchantmentControl = connectEnchantmentControl(requiredElement("#enchant"), () => focusedTile, selectedUnit, draw);
function draw() {
    drawGrid(canvas, boardState(selectedTile, hoveredTile, enemies, tombstones, canSelectedUnitMoveTo));
    goButton.hidden = units.length === 0;
    enchantmentControl.sync();
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
    focusedTile = tile;
    selectedTile = tile && canSeeTile(tile, enemies)
        ? clickBoardTile(enrichTile(tile), canMoveToTile, assignMoveTarget)
        : null;
    draw();
}
function hoverTile(tile) {
    const nextTile = tile && canSeeTile(tile, enemies) ? enrichTile(tile) : null;
    if (sameTile(hoveredTile, nextTile)) {
        return;
    }
    hoveredTile = nextTile;
    draw();
}
function pickSelectableTile(point) {
    return pickUnitTile(point) ?? terrainTileAt(point);
}
function canSelectedUnitMoveTo(tile) {
    const unit = selectedUnit();
    return unit ? canMoveToTile(tile, unit) : false;
}
function canMoveToTile(tile, unit) {
    const distance = l1Distance(tile, unit);
    return canTakeAction(unit)
        && canSeeTile(tile, enemies)
        && distance <= unit.movement
        && (canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)
            || (!isMovementBlocked(tile)
                && canReachTile(unit, tile, unit.movement, isMovementBlocked, tileHeight)));
}
function assignMoveTarget(unit, tile) {
    clearPlannedPush(unit.id);
    if (isPushableTile(tile)) {
        planPush(unit, tile);
    }
}
function pickUnitTile(point) {
    let nearest = null;
    let nearestDistance = pickRadius();
    for (const unit of units) {
        if (!canSeeTile(unit, enemies)) {
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
function isMovementBlocked(tile) {
    return isBoardObstacle(tile) || isOccupiedTile(tile);
}
function isPushDestinationBlocked(tile) {
    return isMovementBlocked(tile)
        || units.some((unit) => sameTile(unit.target, tile))
        || pushables.some((pushable) => sameTile(pushable.target, tile));
}
function isOccupiedTile(tile) {
    return units.some((unit) => sameTile(unit, tile)) || enemies.some((enemy) => sameTile(enemy, tile));
}
function unitScreenPoint(unit) {
    return screenFromGrid(canvas, unit.x + 0.5, unit.y + 0.5, visualHeight(tileHeight(unit)) + unitPickHeight);
}
function screenDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
}
function pickRadius() {
    return Math.max(unitPickMinRadius, unitPickRadius * view.zoom);
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}
function go() {
    if (units.length === 0) {
        return;
    }
    tombstones.length = 0;
    commitPlannedMoves();
    const pushed = commitPlannedPushes();
    chaseEnchanters(units, pushed, isMovementBlocked, tileHeight);
    moveEnemies(enemies, units, isBoardObstacle);
    tombstones.push(...attackUnits(units, enemies).map(({ x, y }) => ({ x, y })));
    resetActions();
    syncSelection();
    draw();
}
function syncSelection() {
    if (selection.unitId && !selectedUnit()) {
        selection.unitId = null;
        selectedTile = null;
    }
}
connectInput(canvas, selectTile, hoverTile, draw, tileHeight, pickSelectableTile);
connectRotationControls(canvas, { left: rotateLeftButton, right: rotateRightButton }, draw);
connectTurnControl(goButton, go);
window.addEventListener("resize", resize);
resize();
function requiredElement(selector) {
    const element = document.querySelector(selector);
    if (!element) {
        throw new Error(`Missing required element: ${selector}`);
    }
    return element;
}

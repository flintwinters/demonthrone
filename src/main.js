import { boardState, canSeeTile, canUnitSee, enrichTile } from "./board-state.js";
import { devicePixelRatio, gridFromScreen } from "./camera.js";
import { connectCancelInput } from "./cancel-input.js";
import { canPlanAttack, resolveAttacks, tryPlanAttack } from "./combat.js";
import { attackUnits, moveEnemies } from "./enemies.js";
import { materializeEntities } from "./entity-generation.js";
import { captureFollowerPositions, followPositionHistory } from "./enchantment.js";
import { EnchantmentSelection } from "./enchantment-selection.js";
import { sameTile } from "./grid.js";
import { connectInput } from "./input.js";
import { handleEnchantmentClick } from "./interaction.js";
import { canReachTile } from "./movement.js";
import { requiredElement } from "./dom.js";
import { isBoardObstacle } from "./obstacles.js";
import { pickPieceTile } from "./piece-picker.js";
import { canPushTo, clearPlannedPush, commitPlannedPushes, isPushableTile, planPush, pushables } from "./pushables.js";
import { drawGrid } from "./renderer.js";
import { connectRotationControls } from "./rotation-controls.js";
import { isInspectableTerrain, selectedObjectStatus, selectVisibleEntityTile } from "./selection-status.js";
import { movementCost, tileHeight, tileTerrain } from "./world.js";
import { connectTurnControl } from "./turn-control.js";
import { canTakeAction, cancelAction, resetActions } from "./teammate-turns.js";
import { clearUnitSelection, clickBoardTile, commitPlannedMoves, selectedUnit, syncUnitSelection, units, } from "./units.js";
const canvas = requiredElement("#grid");
const goButton = requiredElement("#go");
const rotateLeftButton = requiredElement("#rotate-left");
const rotateRightButton = requiredElement("#rotate-right");
const selectionStatus = requiredElement("#selection-status");
let selectedTile = null;
let hoveredTile = null;
const enemies = [];
const tombstones = [];
const enchantmentSelection = new EnchantmentSelection();
function draw() {
    drawGrid(canvas, boardState(selectedTile, hoveredTile, enemies, tombstones, canInteractionTargetTile, canSelectedUnitAttackTile, enchantmentSelection.source()?.id ?? null));
    goButton.hidden = units.length === 0;
    selectionStatus.value = selectedObjectStatus(selectedUnit(), enchantmentSelection.source(), selectedTile, [...units, ...enemies, ...pushables], (tile) => tileTerrain(tile).kind);
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
    const enchantmentClick = handleEnchantmentClick(tile, selectedTile, enchantmentSelection, units, selectedUnit(), conflictsWithUnitAction, enrichTile, clearUnitSelection);
    if (enchantmentClick.handled) {
        selectedTile = enchantmentClick.selectedTile;
        draw();
        return;
    }
    const unit = selectedUnit();
    const attackTarget = isPushInteraction(tile, unit) ? null : tryPlanAttack(tile, unit, [...enemies, ...pushables], (candidate) => Boolean(unit && canUnitSee(unit, candidate, enemies)));
    if (attackTarget) {
        selectedTile = enrichTile(attackTarget);
        draw();
        return;
    }
    selectedTile = selectVisibleEntityTile(tile, units, [...units, ...enemies, ...pushables], (candidate) => canSeeTile(candidate, enemies), enrichTile, (candidate) => clickBoardTile(candidate, canMoveToTile, assignMoveTarget), (candidate) => isInspectableTerrain(tileTerrain(candidate).kind));
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
    const piece = pickPieceTile(canvas, point, [...units, ...enemies, ...pushables], (tile) => canSeeTile(tile, enemies), tileHeight);
    return piece ?? gridFromScreen(canvas, point.x, point.y, tileHeight);
}
function canInteractionTargetTile(tile) {
    if (enchantmentSelection.source()) {
        return enchantmentSelection.canBindTo(tile, units);
    }
    const unit = selectedUnit();
    return unit ? canMoveToTile(tile, unit) : false;
}
function canSelectedUnitAttackTile(tile) {
    const unit = selectedUnit();
    return Boolean(unit && canPlanAttack(unit, tile, [...enemies, ...pushables], (candidate) => canUnitSee(unit, candidate, enemies)));
}
function conflictsWithUnitAction(tile, unit) {
    return canMoveToTile(tile, unit) || canPlanAttack(unit, tile, [...enemies, ...pushables], (candidate) => canUnitSee(unit, candidate, enemies));
}
function canMoveToTile(tile, unit) {
    return canTakeAction(unit)
        && canSeeTile(tile, enemies)
        && (canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)
            || (!isMovementBlocked(tile)
                && canReachTile(unit, tile, unit.movement, isMovementBlocked, tileHeight, movementCost)));
}
function isPushInteraction(tile, unit) {
    return Boolean(unit && (sameTile(unit.target, tile)
        || canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)));
}
function assignMoveTarget(unit, tile) {
    clearPlannedPush(unit.id);
    if (isPushableTile(tile)) {
        planPush(unit, tile);
    }
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
function go() {
    if (units.length === 0) {
        return;
    }
    tombstones.length = 0;
    const previousPositions = captureFollowerPositions(units);
    commitPlannedMoves();
    commitPlannedPushes();
    followPositionHistory(units, previousPositions);
    tombstones.push(...resolveAttacks(units, enemies, pushables));
    tombstones.push(...attackUnits(units, enemies).map(({ x, y }) => ({ x, y })));
    materializeEntities(units, enemies);
    moveEnemies(enemies, units, isBoardObstacle);
    resetActions();
    enchantmentSelection.clear();
    syncUnitSelection();
    if (!selectedUnit()) {
        selectedTile = null;
    }
    draw();
}
connectInput(canvas, selectTile, hoverTile, draw, tileHeight, pickSelectableTile);
connectCancelInput(cancelInteraction);
connectRotationControls(canvas, { left: rotateLeftButton, right: rotateRightButton }, draw);
connectTurnControl(goButton, go);
window.addEventListener("resize", resize);
materializeEntities(units, enemies);
moveEnemies(enemies, units, isBoardObstacle);
resize();
function cancelInteraction() {
    const unit = selectedUnit();
    enchantmentSelection.clear();
    if (unit) {
        cancelAction(unit);
        clearUnitSelection();
    }
    selectedTile = null;
    draw();
}

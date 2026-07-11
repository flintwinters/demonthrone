import { boardState, canSeeTile, canUnitSee, enrichTile } from "./board-state.js";
import { devicePixelRatio, gridFromScreen } from "./camera.js";
import { connectCancelInput } from "./cancel-input.js";
import { canPlanAttack, resolveAttacks, tryPlanAttack } from "./combat.js";
import { attackUnits, moveEnemies } from "./enemies.js";
import { materializeEntities } from "./entity-generation.js";
import { captureFollowerPositions, dispelDestroyedPushable, followPositionHistory } from "./enchantment.js";
import { EnchantmentSelection } from "./enchantment-selection.js";
import { sameTile } from "./grid.js";
import { connectInput } from "./input.js";
import { cancelAttackForMovement, clearInteraction, handleEnchantmentClick } from "./interaction.js";
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
import {
  clearUnitSelection,
  clickBoardTile,
  commitPlannedMoves,
  selectedUnit,
  syncUnitSelection,
  units,
} from "./units.js";
import type { Enemy, HeightTile, ScreenPoint, Tile, Unit } from "./types.js";

const canvas = requiredElement<HTMLCanvasElement>("#grid");
const goButton = requiredElement<HTMLButtonElement>("#go");
const rotateLeftButton = requiredElement<HTMLButtonElement>("#rotate-left");
const rotateRightButton = requiredElement<HTMLButtonElement>("#rotate-right");
const selectionStatus = requiredElement<HTMLOutputElement>("#selection-status");
let selectedTile: HeightTile | null = null;
let hoveredTile: HeightTile | null = null;
const enemies: Enemy[] = [];
const tombstones: Tile[] = [];
const enchantmentSelection = new EnchantmentSelection();
function draw(): void {
  drawGrid(canvas, boardState(
    selectedTile, hoveredTile, enemies, tombstones, canInteractionTargetTile, canSelectedUnitAttackTile,
    enchantmentSelection.source()?.id ?? null,
  ));
  goButton.hidden = units.length === 0;
  selectionStatus.value = selectedObjectStatus(
    selectedUnit(), enchantmentSelection.source(), selectedTile, [...units, ...enemies, ...pushables],
    (tile) => tileTerrain(tile).kind,
  );
}

function resize(): void {
  const pixelRatio = devicePixelRatio();
  const { innerWidth: width, innerHeight: height } = window;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  draw();
}

function selectTile(tile: Tile): void {
  cancelAttackForMovement(tile, selectedUnit(), canMoveIgnoringAction, cancelAction);
  const enchantmentClick = handleEnchantmentClick(
    tile, selectedTile, enchantmentSelection, units, selectedUnit(), conflictsWithUnitAction,
    enrichTile, clearUnitSelection,
  );

  if (enchantmentClick.handled) {
    selectedTile = enchantmentClick.selectedTile;
    draw();
    return;
  }

  const unit = selectedUnit();
  const attackTarget = isPushInteraction(tile, unit) ? null : tryPlanAttack(
    tile, unit, [...enemies, ...pushables],
    (candidate) => Boolean(unit && canUnitSee(unit, candidate, enemies)),
  );

  if (attackTarget) {
    selectedTile = enrichTile(attackTarget);
    draw();
    return;
  }

  selectedTile = selectVisibleEntityTile(
    tile,
    units,
    [...units, ...enemies, ...pushables],
    (candidate) => canSeeTile(candidate, enemies),
    enrichTile,
    (candidate) => clickBoardTile(candidate, canMoveToTile, assignMoveTarget),
    (candidate) => isInspectableTerrain(tileTerrain(candidate).kind),
  );
  draw();
}

function hoverTile(tile: Tile | null): void {
  const nextTile = tile && canSeeTile(tile, enemies) ? enrichTile(tile) : null;

  if (sameTile(hoveredTile, nextTile)) {
    return;
  }

  hoveredTile = nextTile;
  draw();
}

function pickSelectableTile(point: ScreenPoint): Tile {
  const piece = pickPieceTile(
    canvas, point, [...units, ...enemies, ...pushables], (tile) => canSeeTile(tile, enemies), tileHeight,
  );

  return piece ?? gridFromScreen(canvas, point.x, point.y, tileHeight);
}

function canInteractionTargetTile(tile: Tile): boolean {
  if (enchantmentSelection.source()) {
    return enchantmentSelection.canBindTo(tile, units);
  }

  const unit = selectedUnit();

  return unit ? canMoveToTile(tile, unit) : false;
}

function canSelectedUnitAttackTile(tile: Tile): boolean {
  const unit = selectedUnit();

  return Boolean(unit && canPlanAttack(
    unit, tile, [...enemies, ...pushables], (candidate) => canUnitSee(unit, candidate, enemies),
  ));
}

function conflictsWithUnitAction(tile: Tile, unit: Unit): boolean {
  return canMoveToTile(tile, unit) || canPlanAttack(
    unit, tile, [...enemies, ...pushables], (candidate) => canUnitSee(unit, candidate, enemies),
  );
}

function canMoveToTile(tile: Tile, unit: Unit): boolean {
  return canTakeAction(unit) && canMoveIgnoringAction(tile, unit);
}

function canMoveIgnoringAction(tile: Tile, unit: Unit): boolean {
  return canSeeTile(tile, enemies)
    && (canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)
      || (!isMovementBlocked(tile)
        && canReachTile(unit, tile, unit.movement, isMovementBlocked, tileHeight, movementCost)));
}

function isPushInteraction(tile: Tile, unit: Unit | null): boolean {
  return Boolean(unit && (sameTile(unit.target, tile)
    || canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)));
}

function assignMoveTarget(unit: Unit, tile: Tile): void {
  clearPlannedPush(unit.id);

  if (isPushableTile(tile)) {
    planPush(unit, tile);
  }
}

function isMovementBlocked(tile: Tile): boolean {
  return isBoardObstacle(tile) || isOccupiedTile(tile);
}

function isPushDestinationBlocked(tile: Tile): boolean {
  return isMovementBlocked(tile)
    || units.some((unit) => sameTile(unit.target, tile))
    || pushables.some((pushable) => sameTile(pushable.target, tile));
}

function isOccupiedTile(tile: Tile): boolean {
  return units.some((unit) => sameTile(unit, tile)) || enemies.some((enemy) => sameTile(enemy, tile));
}

function go(): void {
  if (units.length === 0) {
    return;
  }

  tombstones.length = 0;
  const previousPositions = captureFollowerPositions(units);

  commitPlannedMoves();
  commitPlannedPushes();

  followPositionHistory(units, previousPositions);
  tombstones.push(...resolveAttacks(
    units, enemies, pushables, target => dispelDestroyedPushable(target, units),
  ));
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
connectRotationControls(
  canvas,
  { left: rotateLeftButton, right: rotateRightButton },
  draw,
);
connectTurnControl(goButton, go);
window.addEventListener("resize", resize);
materializeEntities(units, enemies);
moveEnemies(enemies, units, isBoardObstacle);
resize();

function cancelInteraction(): void {
  clearInteraction(enchantmentSelection, selectedUnit(), cancelAction, clearUnitSelection);
  selectedTile = null;
  draw();
}

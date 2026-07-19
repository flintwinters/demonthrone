import { boardState, canSeeTile, enrichTile } from "./board-state.js";
import { actionFields } from "./action-fields.js";
import { syncCompass } from "./compass.js";
import { devicePixelRatio, gridFromScreen } from "./controls/index.js";
import { connectCancelInput } from "./controls/index.js";
import { canPlanAttack, resolveAttacks, tryPlanAttack } from "./combat.js";
import { attackUnits, moveEnemies } from "./enemies.js";
import { isEnemyActionTile, isSelectionAttackTile } from "./enemy-inspection.js";
import { materializeEntities } from "./entity-generation.js";
import { captureFollowerPositions, dispelDestroyedPushable, followPositionHistory } from "./enchantment.js";
import { EnchantmentSelection } from "./enchantment-selection.js";
import { sameTile, tileKey } from "./grid.js";
import { GameOverState } from "./game-over.js";
import { connectInput } from "./controls/index.js";
import { cancelAttackForMovement, clearInteraction, handleEnchantmentClick } from "./interaction.js";
import { requiredElement } from "./dom.js";
import { isBoardObstacle } from "./obstacles.js";
import { pickPieceTile } from "./controls/index.js";
import { canPushTo, clearPlannedPush, commitPlannedPushes, isPushableTile, planPush, pushables } from "./pushables.js";
import { drawGrid } from "./rendering/index.js";
import { connectRotationControls } from "./controls/index.js";
import { visibilityState } from "./visibility/index.js";
import { isInspectableTerrain, selectedObjectStatus, selectVisibleEntityTile } from "./selection-status.js";
import { tileHeight, tileTerrain } from "./world/index.js";
import { connectTurnControl } from "./turn-control.js";
import { canTakeAction, cancelAction, resetActions } from "./teammate-turns.js";
import { plannedSelectionLines } from "./selection-visuals.js";
import {
  clearUnitSelection,
  clickBoardTile,
  commitPlannedMoves,
  selectedUnit,
  syncUnitSelection,
  units,
} from "./units.js";
import type { Enemy, HeightTile, ScreenPoint, Tile, TilePredicate, Unit } from "./types.js";

const canvas = requiredElement<HTMLCanvasElement>("#grid");
const goButton = requiredElement<HTMLButtonElement>("#go");
const rotateLeftButton = requiredElement<HTMLButtonElement>("#rotate-left");
const rotateRightButton = requiredElement<HTMLButtonElement>("#rotate-right");
const selectionStatus = requiredElement<HTMLOutputElement>("#selection-status");
const compassDial = requiredElement<HTMLElement>("#compass-dial");
let selectedTile: HeightTile | null = null;
let hoveredTile: HeightTile | null = null;
const enemies: Enemy[] = [];
const tombstones: Tile[] = [];
const enchantmentSelection = new EnchantmentSelection();
const gameOver = new GameOverState(requiredElement<HTMLOutputElement>("#game-over"));
function draw(): void {
  syncCompass(compassDial);
  drawGrid(canvas, boardState(
    selectedTile, hoveredTile, enemies, tombstones, canInteractionTargetTile, canSelectedUnitAttackTile,
    enchantmentSelection.source()?.id ?? null,
    plannedSelectionLines(enchantmentSelection, hoveredTile, units, enemies, pushables, enrichTile),
    gameOver.center,
  ));
  goButton.hidden = units.length === 0;
  gameOver.syncStatus();
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
    (candidate) => Boolean(unit
      && actionFields(unit, enemies, teamVisibleMovementBlocker()).attack.has(tileKey(candidate))),
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
    (candidate) => canSeeTile(candidate, enemies, gameOver.center),
    enrichTile,
    (candidate) => clickBoardTile(candidate, canMoveToTile, assignMoveTarget),
    (candidate) => isInspectableTerrain(tileTerrain(candidate).kind),
  );
  draw();
}

function hoverTile(tile: Tile | null): void {
  const nextTile = tile && canSeeTile(tile, enemies, gameOver.center) ? enrichTile(tile) : null;

  if (sameTile(hoveredTile, nextTile)) {
    return;
  }

  hoveredTile = nextTile;
  draw();
}

function pickSelectableTile(point: ScreenPoint): Tile {
  const piece = pickPieceTile(
    canvas, point, [...units, ...enemies, ...pushables],
    (tile) => canSeeTile(tile, enemies, gameOver.center), tileHeight,
  );

  return piece ?? gridFromScreen(canvas, point.x, point.y, tileHeight);
}

function canInteractionTargetTile(tile: Tile): boolean {
  if (enchantmentSelection.source()) {
    return enchantmentSelection.canBindTo(tile, units);
  }

  const unit = selectedUnit();

  return unit ? canMoveToTile(tile, unit) : isEnemyActionTile(selectedTile, tile, enemies, isMovementBlocked, "movement");
}

function canSelectedUnitAttackTile(tile: Tile): boolean {
  return isSelectionAttackTile(
    selectedUnit(), selectedTile, tile, enemies, [...enemies, ...pushables], teamVisibleMovementBlocker(),
  );
}

function conflictsWithUnitAction(tile: Tile, unit: Unit): boolean {
  return canMoveToTile(tile, unit) || canPlanAttack(
    unit, tile, [...enemies, ...pushables],
    (candidate) => actionFields(unit, enemies, teamVisibleMovementBlocker()).attack.has(tileKey(candidate)),
  );
}

function canMoveToTile(tile: Tile, unit: Unit): boolean {
  return canTakeAction(unit) && canMoveIgnoringAction(tile, unit);
}

function canMoveIgnoringAction(tile: Tile, unit: Unit): boolean {
  return canSeeTile(tile, enemies, gameOver.center)
    && (canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)
      || (!isMovementBlocked(tile)
        && actionFields(unit, enemies, teamVisibleMovementBlocker()).movement.has(tileKey(tile))));
}

function teamVisibleMovementBlocker(): TilePredicate {
  const visible = visibilityState(enemies, gameOver.center).keys;

  return (tile) => isMovementBlocked(tile) || !visible.has(tileKey(tile));
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
  return isBoardObstacle(tile)
    || units.some((unit) => sameTile(unit, tile))
    || enemies.some((enemy) => sameTile(enemy, tile));
}

function isPushDestinationBlocked(tile: Tile): boolean {
  return isMovementBlocked(tile)
    || units.some((unit) => sameTile(unit.target, tile))
    || pushables.some((pushable) => sameTile(pushable.target, tile));
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
  const defeatedUnits = attackUnits(units, enemies);

  tombstones.push(...defeatedUnits.map(({ x, y }) => ({ x, y })));
  gameOver.recordDefeated(defeatedUnits, units);
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

function cancelInteraction(): void {
  clearInteraction(enchantmentSelection, selectedUnit(), cancelAction, clearUnitSelection);
  selectedTile = null;
  draw();
}

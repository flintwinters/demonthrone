import { boardState, canSeeTile, enrichTile } from "./board-state.js";
import { actionFields, type MovementPolicy } from "./action-fields.js";
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
import { createGameState } from "./game-state.js";
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
  selection,
  syncUnitSelection,
  units,
} from "./units.js";
import type { ScreenPoint, Tile, TilePredicate, Unit } from "./types.js";

const canvas = requiredElement<HTMLCanvasElement>("#grid");
const goButton = requiredElement<HTMLButtonElement>("#go");
const rotateLeftButton = requiredElement<HTMLButtonElement>("#rotate-left");
const rotateRightButton = requiredElement<HTMLButtonElement>("#rotate-right");
const selectionStatus = requiredElement<HTMLOutputElement>("#selection-status");
const compassDial = requiredElement<HTMLElement>("#compass-dial");
const game = createGameState(units, pushables, selection);
const enchantmentSelection = new EnchantmentSelection();
const gameOver = new GameOverState(requiredElement<HTMLOutputElement>("#game-over"));
function draw(): void {
  syncCompass(compassDial);
  drawGrid(canvas, boardState(
    game, canInteractionTargetTile, canSelectedUnitAttackTile,
    enchantmentSelection.source()?.id ?? null,
    plannedSelectionLines(
      enchantmentSelection, game.hoveredTile, game.units, game.enemies, game.pushables, enrichTile,
    ),
    gameOver.center,
  ));
  goButton.hidden = units.length === 0;
  gameOver.syncStatus();
  selectionStatus.value = selectedObjectStatus(
    selectedUnit(), enchantmentSelection.source(), game.selectedTile,
    [...game.units, ...game.enemies, ...game.pushables],
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
    tile, game.selectedTile, enchantmentSelection, game.units, selectedUnit(), conflictsWithUnitAction,
    enrichTile, clearUnitSelection,
  );

  if (enchantmentClick.handled) {
    game.selectedTile = enchantmentClick.selectedTile;
    draw();
    return;
  }

  const unit = selectedUnit();
  const attackTarget = isPushInteraction(tile, unit) ? null : tryPlanAttack(
    tile, unit, [...game.enemies, ...game.pushables],
    (candidate) => Boolean(unit
      && actionFields(unit, game, teamVisibleMovementPolicy()).attack.has(tileKey(candidate))),
  );

  if (attackTarget) {
    game.selectedTile = enrichTile(attackTarget);
    draw();
    return;
  }

  game.selectedTile = selectVisibleEntityTile(
    tile,
    game.units,
    [...game.units, ...game.enemies, ...game.pushables],
    (candidate) => canSeeTile(candidate, game, gameOver.center),
    enrichTile,
    (candidate) => clickBoardTile(candidate, canMoveToTile, assignMoveTarget),
    (candidate) => isInspectableTerrain(tileTerrain(candidate).kind),
  );
  draw();
}

function hoverTile(tile: Tile | null): void {
  const nextTile = tile && canSeeTile(tile, game, gameOver.center) ? enrichTile(tile) : null;

  if (sameTile(game.hoveredTile, nextTile)) {
    return;
  }

  game.hoveredTile = nextTile;
  draw();
}

function pickSelectableTile(point: ScreenPoint): Tile {
  const piece = pickPieceTile(
    canvas, point, [...game.units, ...game.enemies, ...game.pushables],
    (tile) => canSeeTile(tile, game, gameOver.center), tileHeight,
  );

  return piece ?? gridFromScreen(canvas, point.x, point.y, tileHeight);
}

function canInteractionTargetTile(tile: Tile): boolean {
  if (enchantmentSelection.source()) {
    return enchantmentSelection.canBindTo(tile, game.units);
  }

  const unit = selectedUnit();

  return unit ? canMoveToTile(tile, unit) : isEnemyActionTile(
    game.selectedTile, tile, game, boardMovementPolicy(), "movement",
  );
}

function canSelectedUnitAttackTile(tile: Tile): boolean {
  return isSelectionAttackTile(
    selectedUnit(), game.selectedTile, tile, game,
    [...game.enemies, ...game.pushables], teamVisibleMovementPolicy(),
  );
}

function conflictsWithUnitAction(tile: Tile, unit: Unit): boolean {
  return canMoveToTile(tile, unit) || canPlanAttack(
    unit, tile, [...game.enemies, ...game.pushables],
    (candidate) => actionFields(unit, game, teamVisibleMovementPolicy()).attack.has(tileKey(candidate)),
  );
}

function canMoveToTile(tile: Tile, unit: Unit): boolean {
  return canTakeAction(unit) && canMoveIgnoringAction(tile, unit);
}

function canMoveIgnoringAction(tile: Tile, unit: Unit): boolean {
  return canSeeTile(tile, game, gameOver.center)
    && (canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)
      || (!isMovementBlocked(tile)
        && actionFields(unit, game, teamVisibleMovementPolicy()).movement.has(tileKey(tile))));
}

function teamVisibleMovementPolicy(): MovementPolicy {
  const visible = visibilityState(game.units, game.enemies, gameOver.center).keys;

  return {
    key: `team-visible:${gameOver.center ? tileKey(gameOver.center) : "living-team"}`,
    isBlocked: (tile) => isMovementBlocked(tile) || !visible.has(tileKey(tile)),
  };
}

function boardMovementPolicy(): MovementPolicy {
  return { key: "board-occupancy", isBlocked: isMovementBlocked };
}

function isPushInteraction(tile: Tile, unit: Unit | null): boolean {
  return Boolean(unit && (sameTile(unit.target, tile)
    || canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)));
}

function assignMoveTarget(unit: Unit, tile: Tile): void {
  clearPlannedPush(unit.id);

  if (isPushableTile(tile)) {
    planPush(unit, tile, isPushDestinationBlocked, tileHeight);
  }
}

function isMovementBlocked(tile: Tile): boolean {
  return isBoardObstacle(tile)
    || game.units.some((unit) => sameTile(unit, tile))
    || game.enemies.some((enemy) => sameTile(enemy, tile));
}

function isPushDestinationBlocked(tile: Tile): boolean {
  return isMovementBlocked(tile)
    || game.units.some((unit) => sameTile(unit.target, tile))
    || game.pushables.some((pushable) => sameTile(pushable.target, tile));
}

function go(): void {
  if (game.units.length === 0) {
    return;
  }

  game.tombstones.length = 0;
  const previousPositions = captureFollowerPositions(game.units);

  commitPlannedMoves();
  commitPlannedPushes();

  followPositionHistory(game.units, previousPositions);
  game.tombstones.push(...resolveAttacks(
    game.units, game.enemies, game.pushables,
    target => dispelDestroyedPushable(target, game.units),
  ));
  const defeatedUnits = attackUnits(game.units, game.enemies);

  game.tombstones.push(...defeatedUnits.map(({ x, y }) => ({ x, y })));
  gameOver.recordDefeated(defeatedUnits, game.units);
  materializeEntities(game.units, game.enemies);
  moveEnemies(game.enemies, game.units, isBoardObstacle);
  resetActions();
  enchantmentSelection.clear();
  syncUnitSelection();
  if (!selectedUnit()) {
    game.selectedTile = null;
  }
  draw();
}

connectInput(canvas, selectTile, hoverTile, draw, tileHeight, pickSelectableTile);
connectCancelInput(cancelInteraction);
connectRotationControls(canvas, { left: rotateLeftButton, right: rotateRightButton }, draw);
connectTurnControl(goButton, go);
window.addEventListener("resize", resize);
materializeEntities(game.units, game.enemies);
moveEnemies(game.enemies, game.units, isBoardObstacle);
resize();

function cancelInteraction(): void {
  clearInteraction(enchantmentSelection, selectedUnit(), cancelAction, clearUnitSelection);
  game.selectedTile = null;
  draw();
}

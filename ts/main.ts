import { boardState, canSeeTile, canUnitSee, enrichTile } from "./board-state.js";
import { devicePixelRatio, gridFromScreen } from "./camera.js";
import { resolveAttacks, tryPlanAttack } from "./combat.js";
import { attackUnits, moveEnemies } from "./enemies.js";
import { materializeEntities } from "./entity-generation.js";
import { captureFollowerPositions, followPositionHistory } from "./enchantment.js";
import { connectEnchantmentControl } from "./enchantment-control.js";
import { l1Distance, sameTile } from "./grid.js";
import { connectInput } from "./input.js";
import { canReachTile } from "./movement.js";
import { isBoardObstacle } from "./obstacles.js";
import { pickPieceTile } from "./piece-picker.js";
import { canPushTo, clearPlannedPush, commitPlannedPushes, isPushableTile, planPush, pushables } from "./pushables.js";
import { drawGrid } from "./renderer.js";
import { connectRotationControls } from "./rotation-controls.js";
import { movementCost, tileHeight } from "./world.js";
import { connectTurnControl } from "./turn-control.js";
import { canTakeAction, resetActions } from "./teammate-turns.js";
import {
  clickBoardTile,
  commitPlannedMoves,
  selection,
  selectedUnit,
  units,
} from "./units.js";
import type { Enemy, HeightTile, ScreenPoint, Tile, Unit } from "./types.js";

const canvas = requiredElement<HTMLCanvasElement>("#grid");
const goButton = requiredElement<HTMLButtonElement>("#go");
const rotateLeftButton = requiredElement<HTMLButtonElement>("#rotate-left");
const rotateRightButton = requiredElement<HTMLButtonElement>("#rotate-right");
let selectedTile: HeightTile | null = null;
let hoveredTile: HeightTile | null = null;
const enemies: Enemy[] = [];
const tombstones: Tile[] = [];
let focusedTile: Tile | null = null;
const enchantmentControl = connectEnchantmentControl(
  requiredElement<HTMLButtonElement>("#enchant"), () => focusedTile, selectedUnit, draw,
);

function draw(): void {
  drawGrid(canvas, boardState(
    selectedTile, hoveredTile, enemies, tombstones, canSelectedUnitMoveTo, canSelectedUnitAttackTile,
  ));
  goButton.hidden = units.length === 0;
  enchantmentControl.sync();
}

function resize(): void {
  const pixelRatio = devicePixelRatio();
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  draw();
}

function selectTile(tile: Tile): void {
  focusedTile = tile;
  const unit = selectedUnit();
  const attackTarget = tryPlanAttack(
    tile, unit, enemies, (candidate) => Boolean(unit && canUnitSee(unit, candidate, enemies)),
  );

  if (attackTarget) {
    selectedTile = enrichTile(attackTarget);
    draw();
    return;
  }

  selectedTile = tile && canSeeTile(tile, enemies)
    ? clickBoardTile(enrichTile(tile), canMoveToTile, assignMoveTarget)
    : null;
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
    canvas, point, [...units, ...enemies], (tile) => canSeeTile(tile, enemies), tileHeight,
  );

  return piece ?? terrainTileAt(point);
}

function canSelectedUnitMoveTo(tile: Tile): boolean {
  const unit = selectedUnit();

  return unit ? canMoveToTile(tile, unit) : false;
}

function canSelectedUnitAttackTile(tile: Tile): boolean {
  const unit = selectedUnit();

  return Boolean(unit
    && canTakeAction(unit)
    && canUnitSee(unit, tile, enemies)
    && l1Distance(unit, tile) <= unit.attackRange);
}

function canMoveToTile(tile: Tile, unit: Unit): boolean {
  return canTakeAction(unit)
    && canSeeTile(tile, enemies)
    && (canPushTo(unit, tile, isPushDestinationBlocked, tileHeight)
      || (!isMovementBlocked(tile)
        && canReachTile(unit, tile, unit.movement, isMovementBlocked, tileHeight, movementCost)));
}

function assignMoveTarget(unit: Unit, tile: Tile): void {
  clearPlannedPush(unit.id);

  if (isPushableTile(tile)) {
    planPush(unit, tile);
  }
}

function terrainTileAt(point: ScreenPoint): Tile {
  return gridFromScreen(canvas, point.x, point.y, tileHeight);
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
  tombstones.push(...resolveAttacks(units, enemies));
  tombstones.push(...attackUnits(units, enemies).map(({ x, y }) => ({ x, y })));
  materializeEntities(units, enemies);
  moveEnemies(enemies, units, isBoardObstacle);
  resetActions();
  syncSelection();
  draw();
}

function syncSelection(): void {
  if (selection.unitId && !selectedUnit()) {
    selection.unitId = null;
    selectedTile = null;
  }
}

connectInput(canvas, selectTile, hoverTile, draw, tileHeight, pickSelectableTile);
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

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

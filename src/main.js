import { devicePixelRatio } from "./camera.js";
import { connectInput } from "./input.js";
import { canReachTile } from "./movement.js";
import { isObstacleTile } from "./obstacles.js";
import { drawGrid } from "./renderer.js";
import { connectRotationControls } from "./rotation-controls.js";
import { isSightBlockingTile } from "./world.js";
import {
  clickBoardTile,
  commitPlannedMoves,
  plannedUnits,
  selection,
  selectedUnit,
  units,
} from "./units.js";
import { isVisibleTile, l1Distance } from "./visibility.js";

const canvas = document.querySelector("#grid");
const goButton = document.querySelector("#go");
const rotateLeftButton = document.querySelector("#rotate-left");
const rotateRightButton = document.querySelector("#rotate-right");
const context = canvas.getContext("2d");
let selectedTile = null;

function draw() {
  drawGrid(canvas, context, boardState());
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
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  draw();
}

function selectTile(tile) {
  selectedTile = tile && canSeeTile(tile) ? clickBoardTile(tile, canMoveToTile) : null;
  draw();
}

function boardState() {
  return {
    selectedTile,
    units,
    isObstacleTile,
    selectedUnitId: selection.unitId,
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

connectInput(canvas, selectTile, draw);
connectRotationControls(
  canvas,
  { left: rotateLeftButton, right: rotateRightButton },
  draw,
);
goButton.addEventListener("click", go);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("resize", resize);
resize();

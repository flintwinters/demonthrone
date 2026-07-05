import { devicePixelRatio } from "./camera.js";
import { connectInput } from "./input.js";
import { drawGrid } from "./renderer.js";
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
    selectedUnitId: selection.unitId,
    isMovementTile: canSelectedUnitMoveTo,
    isTileVisible: canSeeTile,
  };
}

function canSeeTile(tile) {
  return isVisibleTile(tile, units);
}

function canSelectedUnitMoveTo(tile) {
  const unit = selectedUnit();

  return unit ? canMoveToTile(tile, unit) : false;
}

function canMoveToTile(tile, unit) {
  const distance = l1Distance(tile, unit);

  return canSeeTile(tile)
    && distance > 0
    && distance <= unit.movement
    && !isOccupiedTile(tile);
}

function isOccupiedTile(tile) {
  return units.some((unit) => unit.x === tile.x && unit.y === tile.y);
}

function syncGoButton() {
  goButton.hidden = plannedUnits().length === 0;
}

function go() {
  commitPlannedMoves();
  draw();
}

connectInput(canvas, selectTile, draw);
goButton.addEventListener("click", go);
window.addEventListener("resize", resize);
resize();

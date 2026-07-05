import { devicePixelRatio } from "./camera.js";
import { connectInput } from "./input.js";
import { drawGrid } from "./renderer.js";
import {
  clickBoardTile,
  commitPlannedMoves,
  plannedUnits,
  selection,
  units,
} from "./units.js";

const canvas = document.querySelector("#grid");
const goButton = document.querySelector("#go");
const context = canvas.getContext("2d");
let selectedTile = null;

function draw() {
  drawGrid(canvas, context, selectedTile, units, selection.unitId);
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
  selectedTile = tile ? clickBoardTile(tile) : null;
  draw();
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

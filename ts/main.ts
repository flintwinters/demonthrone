import { devicePixelRatio } from "./camera.js";
import { connectInput } from "./input.js";
import { canReachTile } from "./movement.js";
import { isObstacleTile } from "./obstacles.js";
import { drawGrid } from "./renderer.js";
import { connectRotationControls } from "./rotation-controls.js";
import { isSightBlockingTile, tileHeight } from "./world.js";
import {
  clickBoardTile,
  commitPlannedMoves,
  plannedUnits,
  selection,
  selectedUnit,
  units,
} from "./units.js";
import { isVisibleTile, l1Distance } from "./visibility.js";
import type { BoardState, HeightTile, RenderUnit, Tile, Unit } from "./types.js";

const canvas = requiredElement<HTMLCanvasElement>("#grid");
const goButton = requiredElement<HTMLButtonElement>("#go");
const rotateLeftButton = requiredElement<HTMLButtonElement>("#rotate-left");
const rotateRightButton = requiredElement<HTMLButtonElement>("#rotate-right");
let selectedTile: HeightTile | null = null;

function draw(): void {
  drawGrid(canvas, boardState());
  syncGoButton();
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
  selectedTile = tile && canSeeTile(tile) ? clickBoardTile(enrichTile(tile), canMoveToTile) : null;
  draw();
}

function boardState(): BoardState {
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

function canSeeTile(tile: Tile): boolean {
  return isVisibleTile(tile, units, isSightBlockingTile);
}

function canSelectedUnitMoveTo(tile: Tile): boolean {
  const unit = selectedUnit();

  return unit ? canMoveToTile(tile, unit) : false;
}

function canMoveToTile(tile: Tile, unit: Unit): boolean {
  const distance = l1Distance(tile, unit);

  return canSeeTile(tile)
    && !isMovementBlocked(tile)
    && distance <= unit.movement
    && canReachTile(unit, tile, unit.movement, isMovementBlocked);
}

function renderableUnits(): RenderUnit[] {
  return units.map((unit) => ({
    ...unit,
    height: tileHeight(unit),
    target: unit.target ? enrichTile(unit.target) : null,
  }));
}

function enrichTile(tile: Tile): HeightTile {
  return {
    ...tile,
    height: tileHeight(tile),
  };
}

function isMovementBlocked(tile: Tile): boolean {
  return isObstacleTile(tile) || isOccupiedTile(tile);
}

function isOccupiedTile(tile: Tile): boolean {
  return units.some((unit) => unit.x === tile.x && unit.y === tile.y);
}

function syncGoButton(): void {
  goButton.hidden = plannedUnits().length === 0;
}

function go(): void {
  if (plannedUnits().length === 0) {
    return;
  }

  commitPlannedMoves();
  draw();
}

function handleKeyDown(event: KeyboardEvent): void {
  if (event.key === "Enter") {
    event.preventDefault();
    go();
  }
}

connectInput(canvas, selectTile, draw, tileHeight);
connectRotationControls(
  canvas,
  { left: rotateLeftButton, right: rotateRightButton },
  draw,
);
goButton.addEventListener("click", go);
window.addEventListener("keydown", handleKeyDown);
window.addEventListener("resize", resize);
resize();

function requiredElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

import { devicePixelRatio, gridFromScreen, screenFromGrid, view } from "./camera.js";
import { terrainHeight } from "./constants.js";
import { connectInput } from "./input.js";
import { canReachTile } from "./movement.js";
import { isObstacleTile } from "./obstacles.js";
import { drawGrid } from "./renderer.js";
import { connectRotationControls } from "./rotation-controls.js";
import { connectViewCube } from "./view-cube.js";
import { isBrushTile, sightCost, tileHeight } from "./world.js";
import {
  clickBoardTile,
  commitPlannedMoves,
  plannedUnits,
  selection,
  selectedUnit,
  units,
} from "./units.js";
import { isVisibleTile, l1Distance } from "./visibility.js";
import type { BoardState, HeightTile, RenderUnit, ScreenPoint, Tile, Unit } from "./types.js";

const unitPickRadius = 30;
const unitPickMinRadius = 18;
const unitPickHeight = 0.3;

const canvas = requiredElement<HTMLCanvasElement>("#grid");
const goButton = requiredElement<HTMLButtonElement>("#go");
const rotateLeftButton = requiredElement<HTMLButtonElement>("#rotate-left");
const rotateRightButton = requiredElement<HTMLButtonElement>("#rotate-right");
let selectedTile: HeightTile | null = null;
let hoveredTile: HeightTile | null = null;

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

function hoverTile(tile: Tile | null): void {
  const nextTile = tile && canSeeTile(tile) ? enrichTile(tile) : null;

  if (sameTile(hoveredTile, nextTile)) {
    return;
  }

  hoveredTile = nextTile;
  draw();
}

function pickSelectableTile(point: ScreenPoint): Tile {
  return pickUnitTile(point) ?? terrainTileAt(point);
}

function boardState(): BoardState {
  return {
    selectedTile,
    hoveredTile,
    units: renderableUnits(),
    isObstacleTile,
    isBrushTile,
    sightCost,
    selectedUnitId: selection.unitId,
    tileHeight,
    isMovementTile: canSelectedUnitMoveTo,
    isTileVisible: canSeeTile,
  };
}

function canSeeTile(tile: Tile): boolean {
  return isVisibleTile(tile, units, sightCost);
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

function pickUnitTile(point: ScreenPoint): Tile | null {
  let nearest: Unit | null = null;
  let nearestDistance = pickRadius();

  for (const unit of units) {
    if (!canSeeTile(unit)) {
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

function terrainTileAt(point: ScreenPoint): Tile {
  return gridFromScreen(canvas, point.x, point.y, tileHeight);
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

function unitScreenPoint(unit: Unit): ScreenPoint {
  return screenFromGrid(
    canvas,
    unit.x + 0.5,
    unit.y + 0.5,
    visualHeight(tileHeight(unit)) + unitPickHeight,
  );
}

function screenDistance(first: ScreenPoint, second: ScreenPoint): number {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function sameTile(first: Tile | null, second: Tile | null): boolean {
  return first?.x === second?.x && first?.y === second?.y;
}

function pickRadius(): number {
  return Math.max(unitPickMinRadius, unitPickRadius * view.zoom);
}

function visualHeight(height: number): number {
  return height * terrainHeight.visualScale;
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

connectInput(canvas, selectTile, hoverTile, draw, tileHeight, pickSelectableTile);
connectRotationControls(
  canvas,
  { left: rotateLeftButton, right: rotateRightButton },
  draw,
);
connectViewCube(canvas, draw);
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

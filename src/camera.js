import { gridTopOffset, tile, zoomLimits } from "./constants.js";

export const view = {
  x: 0,
  y: 0,
  zoom: 1,
  rotation: 0,
};

export function viewportSize(canvas) {
  return {
    width: canvas.width / devicePixelRatio(),
    height: canvas.height / devicePixelRatio(),
  };
}

export function viewportCenter(canvas) {
  const viewport = viewportSize(canvas);

  return {
    x: viewport.width / 2,
    y: viewport.height / 2,
  };
}

export function screenFromGrid(canvas, x, y) {
  return screenFromWorld(worldFromGrid(canvas, x, y));
}

export function worldFromGrid(canvas, x, y) {
  const viewport = viewportSize(canvas);
  const rotated = rotatePoint({ x, y }, view.rotation);

  return {
    x: viewport.width / 2 + (rotated.x - rotated.y) * tile.width / 2,
    y: gridTopOffset + (rotated.x + rotated.y) * tile.height / 2,
  };
}

export function gridFromScreen(canvas, screenX, screenY) {
  const point = gridPointFromScreen(canvas, screenX, screenY);

  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y),
  };
}

export function zoomAt(screenX, screenY, nextZoom) {
  const zoom = clamp(nextZoom, zoomLimits.min, zoomLimits.max);
  const scale = zoom / view.zoom;

  view.x = screenX - (screenX - view.x) * scale;
  view.y = screenY - (screenY - view.y) * scale;
  view.zoom = zoom;
}

export function rotateAt(canvas, screenX, screenY, nextRotation) {
  const grid = gridPointFromScreen(canvas, screenX, screenY);
  view.rotation = normalizeRotation(nextRotation);
  const screen = screenFromGrid(canvas, grid.x, grid.y);

  view.x += screenX - screen.x;
  view.y += screenY - screen.y;
}

export function devicePixelRatio() {
  return window.devicePixelRatio || 1;
}

export function screenFromWorld(world) {
  return {
    x: view.x + world.x * view.zoom,
    y: view.y + world.y * view.zoom,
  };
}

function worldFromScreen(screenX, screenY) {
  return {
    x: (screenX - view.x) / view.zoom,
    y: (screenY - view.y) / view.zoom,
  };
}

function gridPointFromScreen(canvas, screenX, screenY) {
  const rotated = rotatedGridPointFromScreen(canvas, screenX, screenY);

  return rotatePoint(rotated, -view.rotation);
}

function rotatedGridPointFromScreen(canvas, screenX, screenY) {
  const world = worldFromScreen(screenX, screenY);
  const viewport = viewportSize(canvas);
  const dx = world.x - viewport.width / 2;
  const dy = world.y - gridTopOffset;

  return {
    x: (dy / (tile.height / 2) + dx / (tile.width / 2)) / 2,
    y: (dy / (tile.height / 2) - dx / (tile.width / 2)) / 2,
  };
}

function rotatePoint(point, rotation) {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);

  return {
    x: point.x * cosine - point.y * sine,
    y: point.x * sine + point.y * cosine,
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeRotation(rotation) {
  return Math.atan2(Math.sin(rotation), Math.cos(rotation));
}

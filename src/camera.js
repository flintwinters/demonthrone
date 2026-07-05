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

export function screenFromGrid(canvas, x, y) {
  return screenFromWorld(worldFromGrid(canvas, x, y));
}

export function worldFromGrid(canvas, x, y) {
  const viewport = viewportSize(canvas);
  return {
    x: viewport.width / 2 + (x - y) * tile.width / 2,
    y: gridTopOffset + (x + y) * tile.height / 2,
  };
}

export function gridFromScreen(canvas, screenX, screenY) {
  const world = worldFromScreen(screenX, screenY);
  const viewport = viewportSize(canvas);
  const worldX = world.x;
  const worldY = world.y;
  const dx = worldX - viewport.width / 2;
  const dy = worldY - gridTopOffset - tile.height / 2;

  return {
    x: Math.round((dy / (tile.height / 2) + dx / (tile.width / 2)) / 2),
    y: Math.round((dy / (tile.height / 2) - dx / (tile.width / 2)) / 2),
  };
}

export function zoomAt(screenX, screenY, nextZoom) {
  const zoom = clamp(nextZoom, zoomLimits.min, zoomLimits.max);
  const scale = zoom / view.zoom;

  view.x = screenX - (screenX - view.x) * scale;
  view.y = screenY - (screenY - view.y) * scale;
  view.zoom = zoom;
}

export function rotateAt(screenX, screenY, nextRotation) {
  const world = worldFromScreen(screenX, screenY);
  view.rotation = normalizeRotation(nextRotation);
  const screen = screenFromWorld(world);

  view.x += screenX - screen.x;
  view.y += screenY - screen.y;
}

export function devicePixelRatio() {
  return window.devicePixelRatio || 1;
}

export function screenFromWorld(world) {
  const rotated = rotatePoint(world, view.rotation);

  return {
    x: view.x + rotated.x * view.zoom,
    y: view.y + rotated.y * view.zoom,
  };
}

function worldFromScreen(screenX, screenY) {
  const x = (screenX - view.x) / view.zoom;
  const y = (screenY - view.y) / view.zoom;

  return rotatePoint({ x, y }, -view.rotation);
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

import { gridTopOffset, tile, zoomLimits } from "./constants.js";

export const view = {
  x: 0,
  y: 0,
  zoom: 1,
};

export function viewportSize(canvas) {
  return {
    width: canvas.width / devicePixelRatio(),
    height: canvas.height / devicePixelRatio(),
  };
}

export function screenFromGrid(canvas, x, y) {
  const viewport = viewportSize(canvas);

  return {
    x: view.x + (viewport.width / 2 + (x - y) * tile.width / 2) * view.zoom,
    y: view.y + (gridTopOffset + (x + y) * tile.height / 2) * view.zoom,
  };
}

export function gridFromScreen(canvas, screenX, screenY) {
  const viewport = viewportSize(canvas);
  const worldX = (screenX - view.x) / view.zoom;
  const worldY = (screenY - view.y) / view.zoom;
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

export function devicePixelRatio() {
  return window.devicePixelRatio || 1;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

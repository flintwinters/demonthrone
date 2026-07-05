import { screenFromWorld, worldFromGrid } from "./camera.js";
import { colors, terrainHeight } from "./constants.js";

export function drawVoxelTile(canvas, context, gridPoint, height, style) {
  const top = screenDiamond(canvas, gridPoint, 1, height);
  const base = screenDiamond(canvas, gridPoint, 1, terrainHeight.min);

  if (height > terrainHeight.min) {
    drawColumnSides(context, top, base);
  }

  drawDiamond(context, top, style.fill, style.stroke, style.lineWidth);
}

export function tileCenter(canvas, gridPoint, height = 0) {
  const point = worldFromGrid(canvas, gridPoint.x + 0.5, gridPoint.y + 0.5, height);

  return screenFromWorld(point);
}

export function screenDiamond(canvas, gridPoint, scale, height = 0) {
  const inset = (1 - scale) / 2;

  return {
    top: screenGridPoint(canvas, gridPoint.x + inset, gridPoint.y + inset, height),
    right: screenGridPoint(canvas, gridPoint.x + 1 - inset, gridPoint.y + inset, height),
    bottom: screenGridPoint(canvas, gridPoint.x + 1 - inset, gridPoint.y + 1 - inset, height),
    left: screenGridPoint(canvas, gridPoint.x + inset, gridPoint.y + 1 - inset, height),
  };
}

export function tileDepth(canvas, gridPoint) {
  return tileCenter(canvas, gridPoint, terrainHeight.min).y;
}

function drawColumnSides(context, top, base) {
  drawFace(context, [top.left, top.bottom, base.bottom, base.left], colors.tileSideLeft);
  drawFace(context, [top.right, top.bottom, base.bottom, base.right], colors.tileSideRight);
}

function drawDiamond(context, corners, fill, stroke, lineWidth) {
  pathDiamond(context, corners);
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.lineWidth = lineWidth;
  context.lineJoin = "miter";
  context.stroke();
}

function drawFace(context, points, fill) {
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);

  for (const point of points.slice(1)) {
    context.lineTo(point.x, point.y);
  }

  context.closePath();
  context.fillStyle = fill;
  context.fill();
}

function pathDiamond(context, corners) {
  context.beginPath();
  context.moveTo(corners.top.x, corners.top.y);
  context.lineTo(corners.right.x, corners.right.y);
  context.lineTo(corners.bottom.x, corners.bottom.y);
  context.lineTo(corners.left.x, corners.left.y);
  context.closePath();
}

function screenGridPoint(canvas, x, y, height) {
  return screenFromWorld(worldFromGrid(canvas, x, y, height));
}

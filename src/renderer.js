import { viewportSize, screenFromWorld, worldFromGrid, view } from "./camera.js";
import { colors, tile } from "./constants.js";
import { visibleTiles } from "./tiles.js";

export function drawGrid(canvas, context, boardState) {
  const { width, height } = viewportSize(canvas);
  const tiles = visibleTiles(boardState.units, boardState.isObstacleTile);

  context.clearRect(0, 0, width, height);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, width, height);

  drawTiles(canvas, context, boardState, tiles);
  drawObstacles(canvas, context, boardState, tiles);
  drawMovePlans(canvas, context, boardState.units);
  drawUnits(canvas, context, boardState.units, boardState.selectedUnitId);
}

function drawTiles(canvas, context, boardState, tiles) {
  for (const gridPoint of tiles) {
    drawTile(canvas, context, gridPoint, boardState);
  }
}

function drawTile(canvas, context, gridPoint, boardState) {
  const corners = screenDiamond(canvas, gridPoint, tile.width, tile.height);
  const style = tileStyle(gridPoint, boardState);

  context.beginPath();
  context.moveTo(corners.top.x, corners.top.y);
  context.lineTo(corners.right.x, corners.right.y);
  context.lineTo(corners.bottom.x, corners.bottom.y);
  context.lineTo(corners.left.x, corners.left.y);
  context.closePath();
  context.fillStyle = style.fill;
  context.fill();
  context.strokeStyle = style.stroke;
  context.lineWidth = style.lineWidth;
  context.lineJoin = "miter";
  context.stroke();
}

function tileStyle(gridPoint, boardState) {
  if (sameTile(boardState.selectedTile, gridPoint)) {
    return {
      fill: colors.selectedTile,
      stroke: colors.selectedTileStroke,
      lineWidth: 2,
    };
  }

  if (boardState.isMovementTile(gridPoint)) {
    return {
      fill: colors.movementTile,
      stroke: colors.movementTileStroke,
      lineWidth: 2,
    };
  }

  return {
    fill: colors.tile,
    stroke: colors.tileStroke,
    lineWidth: 1,
  };
}

function sameTile(first, second) {
  return first?.x === second.x && first?.y === second.y;
}

function drawObstacles(canvas, context, boardState, tiles) {
  for (const gridPoint of tiles) {
    if (boardState.isObstacleTile(gridPoint)) {
      drawObstacle(canvas, context, gridPoint);
    }
  }
}

function drawObstacle(canvas, context, gridPoint) {
  const center = tileCenter(canvas, gridPoint);
  const radius = Math.max(8, 13 * view.zoom);

  context.fillStyle = colors.boulderShadow;
  context.beginPath();
  context.ellipse(center.x, center.y + radius * 0.42, radius * 1.1, radius * 0.38, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = colors.boulder;
  context.beginPath();
  context.arc(center.x, center.y - radius * 0.1, radius, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = colors.boulderTop;
  context.beginPath();
  context.arc(center.x - radius * 0.28, center.y - radius * 0.38, radius * 0.32, 0, Math.PI * 2);
  context.fill();
}

function drawMovePlans(canvas, context, units) {
  for (const unit of units) {
    if (unit.target) {
      drawMovePlan(canvas, context, unit);
    }
  }
}

function drawMovePlan(canvas, context, unit) {
  const start = tileCenter(canvas, unit);
  const end = tileCenter(canvas, unit.target);

  context.strokeStyle = colors.moveLine;
  context.lineWidth = Math.max(2, 2 * view.zoom);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();
  drawTargetMarker(canvas, context, unit.target);
}

function drawTargetMarker(canvas, context, target) {
  const corners = screenDiamond(canvas, target, tile.width * 0.58, tile.height * 0.58);

  context.fillStyle = colors.moveTargetFill;
  context.strokeStyle = colors.moveTarget;
  context.lineWidth = Math.max(2, 2 * view.zoom);
  context.beginPath();
  context.moveTo(corners.top.x, corners.top.y);
  context.lineTo(corners.right.x, corners.right.y);
  context.lineTo(corners.bottom.x, corners.bottom.y);
  context.lineTo(corners.left.x, corners.left.y);
  context.closePath();
  context.fill();
  context.stroke();
}

function drawUnits(canvas, context, units, selectedUnitId) {
  for (const unit of units) {
    drawUnit(canvas, context, unit, unit.id === selectedUnitId);
  }
}

function drawUnit(canvas, context, unit, isSelected) {
  const center = tileCenter(canvas, unit);
  const radius = Math.max(7, 10 * view.zoom);
  const baseRadius = radius * 1.3;

  context.fillStyle = colors.unitBase;
  context.beginPath();
  context.ellipse(center.x, center.y + radius * 0.62, baseRadius, radius * 0.44, 0, 0, Math.PI * 2);
  context.fill();
  context.fillStyle = unit.color;
  context.beginPath();
  context.arc(center.x, center.y, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = isSelected ? colors.selectedTileStroke : colors.unitBase;
  context.lineWidth = Math.max(2, 2 * view.zoom);
  context.stroke();
}

function tileCenter(canvas, gridPoint) {
  const point = worldFromGrid(canvas, gridPoint.x, gridPoint.y);

  return screenFromWorld({ x: point.x, y: point.y + tile.height / 2 });
}

function screenDiamond(canvas, gridPoint, width, height) {
  const point = worldFromGrid(canvas, gridPoint.x, gridPoint.y);

  return {
    top: screenFromWorld(point),
    right: screenFromWorld({ x: point.x + width / 2, y: point.y + height / 2 }),
    bottom: screenFromWorld({ x: point.x, y: point.y + height }),
    left: screenFromWorld({ x: point.x - width / 2, y: point.y + height / 2 }),
  };
}

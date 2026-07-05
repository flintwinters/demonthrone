import { viewportSize, screenFromGrid, view } from "./camera.js";
import { colors, gridSize, tile } from "./constants.js";

export function drawGrid(canvas, context, boardState) {
  const { width, height } = viewportSize(canvas);

  context.clearRect(0, 0, width, height);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, width, height);

  drawTiles(canvas, context, boardState);
  drawMovePlans(canvas, context, boardState.units);
  drawUnits(canvas, context, boardState.units, boardState.selectedUnitId);
}

function drawTiles(canvas, context, boardState) {
  eachGridTile((x, y) => {
    const gridPoint = { x, y };

    if (boardState.isTileVisible(gridPoint)) {
      drawTile(canvas, context, gridPoint, boardState);
    }
  });
}

function drawTile(canvas, context, gridPoint, boardState) {
  const point = screenFromGrid(canvas, gridPoint.x, gridPoint.y);
  const width = tile.width * view.zoom;
  const height = tile.height * view.zoom;
  const style = tileStyle(gridPoint, boardState);

  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(point.x + width / 2, point.y + height / 2);
  context.lineTo(point.x, point.y + height);
  context.lineTo(point.x - width / 2, point.y + height / 2);
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
  const center = tileCenter(canvas, target);
  const width = tile.width * view.zoom * 0.58;
  const height = tile.height * view.zoom * 0.58;

  context.fillStyle = colors.moveTargetFill;
  context.strokeStyle = colors.moveTarget;
  context.lineWidth = Math.max(2, 2 * view.zoom);
  context.beginPath();
  context.moveTo(center.x, center.y - height / 2);
  context.lineTo(center.x + width / 2, center.y);
  context.lineTo(center.x, center.y + height / 2);
  context.lineTo(center.x - width / 2, center.y);
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
  const point = screenFromGrid(canvas, gridPoint.x, gridPoint.y);

  return {
    x: point.x,
    y: point.y + tile.height * view.zoom / 2,
  };
}

function eachGridTile(callback) {
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      callback(x, y);
    }
  }
}

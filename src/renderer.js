import { viewportSize, screenFromGrid, view } from "./camera.js";
import { colors, gridSize, tile } from "./constants.js";

export function drawGrid(canvas, context, selectedTile) {
  const { width, height } = viewportSize(canvas);

  context.clearRect(0, 0, width, height);
  context.fillStyle = colors.background;
  context.fillRect(0, 0, width, height);

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      drawTile(canvas, context, x, y, selectedTile);
    }
  }
}

function drawTile(canvas, context, x, y, selectedTile) {
  const point = screenFromGrid(canvas, x, y);
  const width = tile.width * view.zoom;
  const height = tile.height * view.zoom;
  const style = tileStyle(selectedTile, x, y);

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

function tileStyle(selectedTile, x, y) {
  if (selectedTile?.x === x && selectedTile?.y === y) {
    return {
      fill: colors.selectedTile,
      stroke: colors.selectedTileStroke,
      lineWidth: 2,
    };
  }

  return {
    fill: colors.tile,
    stroke: colors.tileStroke,
    lineWidth: 1,
  };
}

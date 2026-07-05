const canvas = document.querySelector("#grid");
const context = canvas.getContext("2d");

const tile = {
  width: 96,
  height: 48,
};

const gridSize = 48;
const view = {
  x: 0,
  y: 0,
};
let selectedTile = null;
let dragStart = null;

function screenFromGrid(x, y) {
  return {
    x: view.x + canvas.width / 2 + (x - y) * tile.width / 2,
    y: view.y + 72 + (x + y) * tile.height / 2,
  };
}

function gridFromScreen(screenX, screenY) {
  const dx = screenX - view.x - canvas.width / 2;
  const dy = screenY - view.y - 72 - tile.height / 2;
  return {
    x: Math.round((dy / (tile.height / 2) + dx / (tile.width / 2)) / 2),
    y: Math.round((dy / (tile.height / 2) - dx / (tile.width / 2)) / 2),
  };
}

function resize() {
  const pixelRatio = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  draw();
}

function draw() {
  const width = canvas.width / (window.devicePixelRatio || 1);
  const height = canvas.height / (window.devicePixelRatio || 1);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "#1d2021";
  context.fillRect(0, 0, width, height);

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      drawTile(x, y);
    }
  }
}

function drawTile(x, y) {
  const point = screenFromGrid(x, y);
  const isSelected = selectedTile?.x === x && selectedTile?.y === y;

  context.beginPath();
  context.moveTo(point.x, point.y);
  context.lineTo(point.x + tile.width / 2, point.y + tile.height / 2);
  context.lineTo(point.x, point.y + tile.height);
  context.lineTo(point.x - tile.width / 2, point.y + tile.height / 2);
  context.closePath();
  context.fillStyle = isSelected ? "#3c3836" : "#282828";
  context.fill();
  context.strokeStyle = isSelected ? "#fabd2f" : "#928374";
  context.lineWidth = isSelected ? 2 : 1;
  context.lineJoin = "miter";
  context.stroke();
}

function pointerPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
}

function isInsideGrid(grid) {
  return grid.x >= 0 && grid.y >= 0 && grid.x < gridSize && grid.y < gridSize;
}

canvas.addEventListener("pointerdown", (event) => {
  const point = pointerPosition(event);
  dragStart = {
    pointerId: event.pointerId,
    pointerX: point.x,
    pointerY: point.y,
    viewX: view.x,
    viewY: view.y,
    moved: false,
  };
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragStart || dragStart.pointerId !== event.pointerId) {
    return;
  }
  const point = pointerPosition(event);
  const dx = point.x - dragStart.pointerX;
  const dy = point.y - dragStart.pointerY;
  dragStart.moved = dragStart.moved || Math.hypot(dx, dy) > 3;
  view.x = dragStart.viewX + dx;
  view.y = dragStart.viewY + dy;
  draw();
});

canvas.addEventListener("pointerup", (event) => {
  if (!dragStart || dragStart.pointerId !== event.pointerId) {
    return;
  }

  if (!dragStart.moved) {
    const point = pointerPosition(event);
    const grid = gridFromScreen(point.x, point.y);
    selectedTile = isInsideGrid(grid) ? grid : null;
    draw();
  }

  dragStart = null;
});

canvas.addEventListener("pointercancel", () => {
  dragStart = null;
});

window.addEventListener("resize", resize);
resize();

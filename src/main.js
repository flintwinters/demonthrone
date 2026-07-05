const canvas = document.querySelector("#grid");
const context = canvas.getContext("2d");

const tile = {
  width: 96,
  height: 48,
};

const gridSize = 48;
const zoomLimits = {
  min: 0.5,
  max: 2.5,
};
const wheelDeltaLineMode = 1;
const view = {
  x: 0,
  y: 0,
  zoom: 1,
};
let selectedTile = null;
let dragStart = null;
const activePointers = new Map();
let pinchStart = null;

function viewportSize() {
  return {
    width: canvas.width / (window.devicePixelRatio || 1),
    height: canvas.height / (window.devicePixelRatio || 1),
  };
}

function screenFromGrid(x, y) {
  const viewport = viewportSize();
  return {
    x: view.x + (viewport.width / 2 + (x - y) * tile.width / 2) * view.zoom,
    y: view.y + (72 + (x + y) * tile.height / 2) * view.zoom,
  };
}

function gridFromScreen(screenX, screenY) {
  const viewport = viewportSize();
  const worldX = (screenX - view.x) / view.zoom;
  const worldY = (screenY - view.y) / view.zoom;
  const dx = worldX - viewport.width / 2;
  const dy = worldY - 72 - tile.height / 2;
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function zoomAt(screenX, screenY, nextZoom) {
  const zoom = clamp(nextZoom, zoomLimits.min, zoomLimits.max);
  const scale = zoom / view.zoom;

  view.x = screenX - (screenX - view.x) * scale;
  view.y = screenY - (screenY - view.y) * scale;
  view.zoom = zoom;
  draw();
}

function draw() {
  const { width, height } = viewportSize();

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

function currentPinch() {
  const points = Array.from(activePointers.values());
  if (points.length < 2) {
    return null;
  }

  const [first, second] = points;
  return {
    centerX: (first.x + second.x) / 2,
    centerY: (first.y + second.y) / 2,
    distance: Math.hypot(second.x - first.x, second.y - first.y),
  };
}

canvas.addEventListener("pointerdown", (event) => {
  const point = pointerPosition(event);
  activePointers.set(event.pointerId, point);

  if (activePointers.size > 1) {
    const pinch = currentPinch();
    pinchStart = pinch
      ? {
          distance: pinch.distance,
          zoom: view.zoom,
        }
      : null;
    dragStart = null;
    canvas.setPointerCapture(event.pointerId);
    return;
  }

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
  if (activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, pointerPosition(event));
  }

  if (pinchStart) {
    const pinch = currentPinch();
    if (pinch && pinchStart.distance > 0) {
      zoomAt(
        pinch.centerX,
        pinch.centerY,
        pinchStart.zoom * (pinch.distance / pinchStart.distance),
      );
    }
    return;
  }

  if (!dragStart || dragStart.pointerId !== event.pointerId) {
    return;
  }
  const point = activePointers.get(event.pointerId) ?? pointerPosition(event);
  const dx = point.x - dragStart.pointerX;
  const dy = point.y - dragStart.pointerY;
  dragStart.moved = dragStart.moved || Math.hypot(dx, dy) > 3;
  view.x = dragStart.viewX + dx;
  view.y = dragStart.viewY + dy;
  draw();
});

canvas.addEventListener("pointerup", (event) => {
  activePointers.delete(event.pointerId);

  if (pinchStart) {
    pinchStart = activePointers.size >= 2 ? pinchStart : null;
    dragStart = null;
    return;
  }

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

canvas.addEventListener("pointercancel", (event) => {
  activePointers.delete(event.pointerId);
  pinchStart = activePointers.size >= 2 ? pinchStart : null;
  dragStart = null;
});

canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const point = pointerPosition(event);
    const deltaY = event.deltaMode === wheelDeltaLineMode ? event.deltaY * 16 : event.deltaY;
    const zoomFactor = Math.exp(-deltaY * 0.001);
    zoomAt(point.x, point.y, view.zoom * zoomFactor);
  },
  { passive: false },
);

window.addEventListener("resize", resize);
resize();

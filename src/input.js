import { gridFromScreen, rotateAt, view, zoomAt } from "./camera.js";
import { dragThreshold, wheelDeltaLineMode } from "./constants.js";

export function connectInput(canvas, onSelectTile, onViewChange) {
  const activePointers = new Map();
  let dragStart = null;
  let pinchStart = null;

  function pointerDown(event) {
    const point = pointerPosition(canvas, event);
    activePointers.set(event.pointerId, point);

    if (activePointers.size > 1) {
      pinchStart = startPinch(activePointers);
      dragStart = null;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    dragStart = createDragStart(event.pointerId, point);
    canvas.setPointerCapture(event.pointerId);
  }

  function pointerMove(event) {
    updatePointer(canvas, activePointers, event);

    if (pinchStart) {
      handlePinch(canvas, activePointers, pinchStart, onViewChange);
      return;
    }

    if (dragStart?.pointerId === event.pointerId) {
      dragStart = handleDrag(activePointers, event.pointerId, dragStart, onViewChange);
    }
  }

  function pointerUp(event) {
    activePointers.delete(event.pointerId);

    if (pinchStart) {
      pinchStart = endPinch(activePointers);
      dragStart = null;
      return;
    }

    if (dragStart?.pointerId === event.pointerId) {
      selectTile(canvas, event, dragStart, onSelectTile);
      dragStart = null;
    }
  }

  function pointerCancel(event) {
    activePointers.delete(event.pointerId);
    pinchStart = endPinch(activePointers);
    dragStart = null;
  }

  function wheel(event) {
    event.preventDefault();
    const point = pointerPosition(canvas, event);
    const deltaY = normalizedWheelDeltaY(event);
    const zoomFactor = Math.exp(-deltaY * 0.001);
    zoomAt(point.x, point.y, view.zoom * zoomFactor);
    onViewChange();
  }

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerCancel);
  canvas.addEventListener("wheel", wheel, { passive: false });
}

function createDragStart(pointerId, point) {
  return {
    pointerId,
    pointerX: point.x,
    pointerY: point.y,
    viewX: view.x,
    viewY: view.y,
    moved: false,
  };
}

function handleDrag(activePointers, pointerId, dragStart, onViewChange) {
  const point = activePointers.get(pointerId);
  const dx = point.x - dragStart.pointerX;
  const dy = point.y - dragStart.pointerY;

  view.x = dragStart.viewX + dx;
  view.y = dragStart.viewY + dy;
  onViewChange();

  return {
    ...dragStart,
    moved: dragStart.moved || Math.hypot(dx, dy) > dragThreshold,
  };
}

function selectTile(canvas, event, dragStart, onSelectTile) {
  if (dragStart.moved) {
    return;
  }

  const point = pointerPosition(canvas, event);
  const grid = gridFromScreen(canvas, point.x, point.y);
  onSelectTile(grid);
}

function startPinch(activePointers) {
  const pinch = currentPinch(activePointers);

  return pinch
    ? {
        distance: pinch.distance,
        angle: pinch.angle,
        rotation: view.rotation,
        zoom: view.zoom,
      }
    : null;
}

function handlePinch(canvas, activePointers, pinchStart, onViewChange) {
  const pinch = currentPinch(activePointers);

  if (!pinch || pinchStart.distance <= 0) {
    return;
  }

  zoomAt(
    pinch.centerX,
    pinch.centerY,
    pinchStart.zoom * (pinch.distance / pinchStart.distance),
  );
  rotateAt(
    canvas,
    pinch.centerX,
    pinch.centerY,
    pinchStart.rotation + angleDelta(pinchStart.angle, pinch.angle),
  );
  onViewChange();
}

function endPinch(activePointers) {
  return activePointers.size >= 2 ? startPinch(activePointers) : null;
}

function currentPinch(activePointers) {
  const points = Array.from(activePointers.values());

  if (points.length < 2) {
    return null;
  }

  const [first, second] = points;
  return {
    centerX: (first.x + second.x) / 2,
    centerY: (first.y + second.y) / 2,
    distance: Math.hypot(second.x - first.x, second.y - first.y),
    angle: Math.atan2(second.y - first.y, second.x - first.x),
  };
}

function updatePointer(canvas, activePointers, event) {
  if (activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, pointerPosition(canvas, event));
  }
}

function pointerPosition(canvas, event) {
  const bounds = canvas.getBoundingClientRect();

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
}

function normalizedWheelDeltaY(event) {
  return event.deltaMode === wheelDeltaLineMode ? event.deltaY * 16 : event.deltaY;
}

function angleDelta(start, end) {
  return Math.atan2(Math.sin(end - start), Math.cos(end - start));
}

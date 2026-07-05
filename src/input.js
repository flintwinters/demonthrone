import { gridFromScreen, rotateAt, view, viewportCenter, zoomAt } from "./camera.js";
import { dragThreshold, mouseRotateSpeed, wheelDeltaLineMode } from "./constants.js";
import { endPinch, handlePinch, startPinch } from "./pinch.js";

export function connectInput(canvas, onSelectTile, onViewChange) {
  const activePointers = new Map();
  let dragStart = null;
  let pinchStart = null;
  let rotateStart = null;

  function pointerDown(event) {
    const point = pointerPosition(canvas, event);
    activePointers.set(event.pointerId, point);

    if (activePointers.size > 1) {
      pinchStart = startPinch(activePointers);
      dragStart = null;
      rotateStart = null;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (isMouseRotate(event)) {
      rotateStart = createRotateStart(event.pointerId, point);
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

    if (rotateStart?.pointerId === event.pointerId) {
      handlePointerRotate(canvas, activePointers, event.pointerId, rotateStart, onViewChange);
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
      rotateStart = null;
      return;
    }

    if (rotateStart?.pointerId === event.pointerId) {
      rotateStart = null;
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
    rotateStart = null;
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
  canvas.addEventListener("contextmenu", suppressContextMenu);
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

function createRotateStart(pointerId, point) {
  return {
    pointerId,
    pointerX: point.x,
    rotation: view.rotation,
  };
}

function handlePointerRotate(canvas, activePointers, pointerId, rotateStart, onViewChange) {
  const point = activePointers.get(pointerId);
  const center = viewportCenter(canvas);
  const dx = point.x - rotateStart.pointerX;
  const nextRotation = rotateStart.rotation + dx * mouseRotateSpeed;

  rotateAt(canvas, center.x, center.y, nextRotation);
  onViewChange();
}

function selectTile(canvas, event, dragStart, onSelectTile) {
  if (dragStart.moved) {
    return;
  }

  const point = pointerPosition(canvas, event);
  const grid = gridFromScreen(canvas, point.x, point.y);
  onSelectTile(grid);
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

function isMouseRotate(event) {
  return event.pointerType === "mouse" && event.button === 2;
}

function suppressContextMenu(event) {
  event.preventDefault();
}

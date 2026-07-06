import { gridFromScreen, panBy, rotateAt, view, viewportCenter, zoomAt } from "./camera.js";
import { dragThreshold, mouseRotateSpeed, wheelDeltaLineMode } from "./constants.js";
import { endPinch, handlePinch, startPinch, type PinchStart } from "./pinch.js";
import type { PointerMap, ScreenPoint, Tile, TileHeight } from "./types.js";

type ScreenTilePicker = (point: ScreenPoint) => Tile;

type DragStart = {
  pointerId: number;
  pointerX: number;
  pointerY: number;
  dx: number;
  dy: number;
  moved: boolean;
};

type RotateStart = {
  pointerId: number;
  pointerX: number;
  rotation: number;
};

export function connectInput(
  canvas: HTMLCanvasElement,
  onSelectTile: (tile: Tile) => void,
  onViewChange: () => void,
  heightAt: TileHeight | null = null,
  screenTileAt: ScreenTilePicker | null = null,
): void {
  const activePointers: PointerMap = new Map();
  let dragStart: DragStart | null = null;
  let pinchStart: PinchStart | null = null;
  let rotateStart: RotateStart | null = null;

  function pointerDown(event: PointerEvent): void {
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

  function pointerMove(event: PointerEvent): void {
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
      dragStart = handleDrag(canvas, activePointers, event.pointerId, dragStart, onViewChange);
    }
  }

  function pointerUp(event: PointerEvent): void {
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
      selectTile(canvas, event, dragStart, onSelectTile, heightAt, screenTileAt);
      dragStart = null;
    }
  }

  function pointerCancel(event: PointerEvent): void {
    activePointers.delete(event.pointerId);
    pinchStart = endPinch(activePointers);
    dragStart = null;
    rotateStart = null;
  }

  function wheel(event: WheelEvent): void {
    event.preventDefault();
    const point = pointerPosition(canvas, event);
    const deltaY = normalizedWheelDeltaY(event);
    const zoomFactor = Math.exp(-deltaY * 0.001);
    zoomAt(canvas, point.x, point.y, view.zoom * zoomFactor);
    onViewChange();
  }

  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerCancel);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("contextmenu", suppressContextMenu);
}

function createDragStart(pointerId: number, point: ScreenPoint): DragStart {
  return {
    pointerId,
    pointerX: point.x,
    pointerY: point.y,
    dx: 0,
    dy: 0,
    moved: false,
  };
}

function handleDrag(
  canvas: HTMLCanvasElement,
  activePointers: PointerMap,
  pointerId: number,
  dragStart: DragStart,
  onViewChange: () => void,
): DragStart {
  const point = activePointers.get(pointerId);

  if (!point) {
    return dragStart;
  }

  const dx = point.x - dragStart.pointerX;
  const dy = point.y - dragStart.pointerY;

  panBy(canvas, dx - dragStart.dx, dy - dragStart.dy);
  onViewChange();

  return {
    ...dragStart,
    dx,
    dy,
    moved: dragStart.moved || Math.hypot(dx, dy) > dragThreshold,
  };
}

function createRotateStart(pointerId: number, point: ScreenPoint): RotateStart {
  return {
    pointerId,
    pointerX: point.x,
    rotation: view.rotation,
  };
}

function handlePointerRotate(
  canvas: HTMLCanvasElement,
  activePointers: PointerMap,
  pointerId: number,
  rotateStart: RotateStart,
  onViewChange: () => void,
): void {
  const point = activePointers.get(pointerId);

  if (!point) {
    return;
  }

  const center = viewportCenter(canvas);
  const dx = point.x - rotateStart.pointerX;
  const nextRotation = rotateStart.rotation + dx * mouseRotateSpeed;

  rotateAt(canvas, center.x, center.y, nextRotation);
  onViewChange();
}

function selectTile(
  canvas: HTMLCanvasElement,
  event: PointerEvent,
  dragStart: DragStart,
  onSelectTile: (tile: Tile) => void,
  heightAt: TileHeight | null,
  screenTileAt: ScreenTilePicker | null,
): void {
  if (dragStart.moved) {
    return;
  }

  const point = pointerPosition(canvas, event);
  const grid = screenTileAt ? screenTileAt(point) : gridFromScreen(canvas, point.x, point.y, heightAt);
  onSelectTile(grid);
}

function updatePointer(canvas: HTMLCanvasElement, activePointers: PointerMap, event: PointerEvent): void {
  if (activePointers.has(event.pointerId)) {
    activePointers.set(event.pointerId, pointerPosition(canvas, event));
  }
}

function pointerPosition(canvas: HTMLCanvasElement, event: PointerEvent | WheelEvent): ScreenPoint {
  const bounds = canvas.getBoundingClientRect();

  return {
    x: event.clientX - bounds.left,
    y: event.clientY - bounds.top,
  };
}

function normalizedWheelDeltaY(event: WheelEvent): number {
  return event.deltaMode === wheelDeltaLineMode ? event.deltaY * 16 : event.deltaY;
}

function isMouseRotate(event: PointerEvent): boolean {
  return event.pointerType === "mouse" && event.button === 2;
}

function suppressContextMenu(event: MouseEvent): void {
  event.preventDefault();
}

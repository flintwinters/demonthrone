import { gridFromScreen, panBy, rotateAt, view, viewportCenter, zoomAt } from "./camera.js";
import { dragThreshold, mousePitchSpeed, mouseRotateSpeed, wheelDeltaLineMode } from "./constants.js";
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
  pointerY: number;
  rotation: number;
  elevation: number;
};

export function connectInput(
  canvas: HTMLCanvasElement,
  onSelectTile: (tile: Tile) => void,
  onHoverTile: (tile: Tile | null) => void,
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

    onHoverTile(null);
    activePointers.set(event.pointerId, point);

    if (activePointers.size > 1) {
      pinchStart = startPinch(activePointers);
      dragStart = null;
      rotateStart = null;
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    if (isMouseRotate(event)) {
      rotateStart = { pointerId: event.pointerId, pointerX: point.x, pointerY: point.y, rotation: view.rotation, elevation: view.elevation };
      canvas.setPointerCapture(event.pointerId);
      return;
    }

    dragStart = createDragStart(event.pointerId, point);
    canvas.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent): void {
    updatePointer(canvas, activePointers, event);

    if (event.pointerType === "mouse" && activePointers.size === 0) {
      onHoverTile(tileAtPointer(canvas, event, heightAt, screenTileAt));
      return;
    }

    if (pinchStart) {
      handlePinch(canvas, activePointers, pinchStart, onViewChange);
      return;
    }

    if (isPointerStart(rotateStart, event)) {
      handlePointerRotate(canvas, activePointers, event.pointerId, rotateStart, onViewChange);
      return;
    }

    if (isPointerStart(dragStart, event)) {
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

    if (isPointerStart(rotateStart, event)) {
      rotateStart = null;
      return;
    }

    if (isPointerStart(dragStart, event)) {
      selectTile(canvas, event, dragStart, onSelectTile, heightAt, screenTileAt);
      dragStart = null;
    }
  }

  function pointerCancel(event: PointerEvent): void {
    activePointers.delete(event.pointerId);
    pinchStart = endPinch(activePointers);
    dragStart = null;
    rotateStart = null;
    onHoverTile(null);
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
  canvas.addEventListener("pointerleave", () => onHoverTile(null));
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
  const dy = point.y - rotateStart.pointerY;
  const nextRotation = rotateStart.rotation + dy * mouseRotateSpeed;
  const nextElevation = rotateStart.elevation + dx * mousePitchSpeed;

  rotateAt(canvas, center.x, center.y, nextRotation, nextElevation);
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

  onSelectTile(tileAtPointer(canvas, event, heightAt, screenTileAt));
}

function tileAtPointer(
  canvas: HTMLCanvasElement,
  event: PointerEvent,
  heightAt: TileHeight | null,
  screenTileAt: ScreenTilePicker | null,
): Tile {
  const point = pointerPosition(canvas, event);

  return screenTileAt ? screenTileAt(point) : gridFromScreen(canvas, point.x, point.y, heightAt);
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

function isPointerStart(start: DragStart | RotateStart | null, event: PointerEvent): start is DragStart | RotateStart {
  return start !== null && start.pointerId === event.pointerId;
}

function suppressContextMenu(event: MouseEvent): void {
  event.preventDefault();
}

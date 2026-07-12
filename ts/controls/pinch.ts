import { rotateAt, view, zoomAt } from "./camera.js";
import type { PointerMap } from "../types.js";

export type PinchStart = {
  distance: number;
  angle: number;
  rotation: number;
  zoom: number;
};

type Pinch = {
  centerX: number;
  centerY: number;
  distance: number;
  angle: number;
};

export function startPinch(activePointers: PointerMap): PinchStart | null {
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

export function handlePinch(
  canvas: HTMLCanvasElement,
  activePointers: PointerMap,
  pinchStart: PinchStart,
  onViewChange: () => void,
): void {
  const pinch = currentPinch(activePointers);

  if (!pinch || pinchStart.distance <= 0) {
    return;
  }

  zoomAt(
    canvas,
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

export function endPinch(activePointers: PointerMap): PinchStart | null {
  return activePointers.size >= 2 ? startPinch(activePointers) : null;
}

function currentPinch(activePointers: PointerMap): Pinch | null {
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

function angleDelta(start: number, end: number): number {
  return Math.atan2(Math.sin(end - start), Math.cos(end - start));
}

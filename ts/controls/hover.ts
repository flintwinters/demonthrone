import type { ScreenPoint, Tile } from "../types.js";

type HoverScheduler = {
  schedule: (point: ScreenPoint) => void;
  clear: () => void;
};

type HoverTilePicker = (point: ScreenPoint) => Tile;

export function createHoverScheduler(
  onHoverTile: (tile: Tile | null) => void,
  pickTile: HoverTilePicker,
): HoverScheduler {
  let frame = 0;
  let pendingPoint: ScreenPoint | null = null;

  function schedule(point: ScreenPoint): void {
    if (samePoint(point, pendingPoint)) {
      return;
    }

    pendingPoint = point;

    if (frame === 0) {
      frame = window.requestAnimationFrame(flush);
    }
  }

  function clear(): void {
    if (frame !== 0) {
      window.cancelAnimationFrame(frame);
    }

    frame = 0;
    pendingPoint = null;
    onHoverTile(null);
  }

  function flush(): void {
    const point = pendingPoint;

    frame = 0;
    pendingPoint = null;

    if (point) {
      onHoverTile(pickTile(point));
    }
  }

  return { schedule, clear };
}

function samePoint(first: ScreenPoint, second: ScreenPoint | null): boolean {
  return first.x === second?.x && first.y === second?.y;
}

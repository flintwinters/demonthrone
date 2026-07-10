export function createHoverScheduler(onHoverTile, pickTile) {
    let frame = 0;
    let pendingPoint = null;
    function schedule(point) {
        if (samePoint(point, pendingPoint)) {
            return;
        }
        pendingPoint = point;
        if (frame === 0) {
            frame = window.requestAnimationFrame(flush);
        }
    }
    function clear() {
        if (frame !== 0) {
            window.cancelAnimationFrame(frame);
        }
        frame = 0;
        pendingPoint = null;
        onHoverTile(null);
    }
    function flush() {
        const point = pendingPoint;
        frame = 0;
        pendingPoint = null;
        if (point) {
            onHoverTile(pickTile(point));
        }
    }
    return { schedule, clear };
}
function samePoint(first, second) {
    return first.x === second?.x && first.y === second?.y;
}

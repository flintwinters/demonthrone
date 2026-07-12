import { gridFromScreen, panBy, rotateAt, view, viewportCenter, zoomAt } from "./camera.js";
import { dragThreshold, mousePitchSpeed, mouseRotateSpeed, wheelDeltaLineMode } from "../constants.js";
import { createHoverScheduler } from "./hover.js";
import { endPinch, handlePinch, startPinch } from "./pinch.js";
export function connectInput(canvas, onSelectTile, onHoverTile, onViewChange, heightAt = null, screenTileAt = null) {
    const activePointers = new Map();
    let dragStart = null;
    let pinchStart = null;
    let rotateStart = null;
    const hover = createHoverScheduler(onHoverTile, point => tileAtPoint(canvas, point, heightAt, screenTileAt));
    function pointerDown(event) {
        const point = pointerPosition(canvas, event);
        hover.clear();
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
    function pointerMove(event) {
        updatePointer(canvas, activePointers, event);
        if (event.pointerType === "mouse" && activePointers.size === 0) {
            hover.schedule(pointerPosition(canvas, event));
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
    function pointerUp(event) {
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
    function pointerCancel(event) {
        activePointers.delete(event.pointerId);
        pinchStart = endPinch(activePointers);
        dragStart = null;
        rotateStart = null;
        hover.clear();
    }
    function wheel(event) {
        event.preventDefault();
        const point = pointerPosition(canvas, event);
        const deltaY = normalizedWheelDeltaY(event);
        const zoomFactor = Math.exp(-deltaY * 0.001);
        hover.clear();
        zoomAt(canvas, point.x, point.y, view.zoom * zoomFactor);
        onViewChange();
    }
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerCancel);
    canvas.addEventListener("pointerleave", hover.clear);
    canvas.addEventListener("wheel", wheel, { passive: false });
    canvas.addEventListener("contextmenu", suppressContextMenu);
}
function createDragStart(pointerId, point) {
    return {
        pointerId,
        pointerX: point.x,
        pointerY: point.y,
        dx: 0,
        dy: 0,
        moved: false,
    };
}
function handleDrag(canvas, activePointers, pointerId, dragStart, onViewChange) {
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
function handlePointerRotate(canvas, activePointers, pointerId, rotateStart, onViewChange) {
    const point = activePointers.get(pointerId);
    if (!point) {
        return;
    }
    const center = viewportCenter(canvas);
    const dx = point.x - rotateStart.pointerX;
    const dy = point.y - rotateStart.pointerY;
    const nextRotation = rotateStart.rotation + dx * mouseRotateSpeed;
    const nextElevation = rotateStart.elevation - dy * mousePitchSpeed;
    rotateAt(canvas, center.x, center.y, nextRotation, nextElevation);
    onViewChange();
}
function selectTile(canvas, event, dragStart, onSelectTile, heightAt, screenTileAt) {
    if (dragStart.moved) {
        return;
    }
    onSelectTile(tileAtPoint(canvas, pointerPosition(canvas, event), heightAt, screenTileAt));
}
function tileAtPoint(canvas, point, heightAt, screenTileAt) {
    return screenTileAt ? screenTileAt(point) : gridFromScreen(canvas, point.x, point.y, heightAt);
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
function isPointerStart(start, event) {
    return start !== null && start.pointerId === event.pointerId;
}
function suppressContextMenu(event) {
    event.preventDefault();
}

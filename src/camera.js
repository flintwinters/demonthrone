import * as THREE from "three";
import { cameraDistance, cameraElevation, cameraElevationLimits, terrainHeight, worldPixelsPerUnit, zoomLimits, } from "./constants.js";
export const view = {
    targetX: 6.5,
    targetY: 6.5,
    zoom: 1,
    rotation: -Math.PI / 4,
    elevation: cameraElevation,
};
const worldUp = new THREE.Vector3(0, 0, 1);
export function createViewCamera() {
    return new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, cameraDistance * 3);
}
export function configureViewCamera(canvas, camera) {
    const viewport = viewportSize(canvas);
    const halfWidth = viewport.width / (worldPixelsPerUnit * view.zoom * 2);
    const halfHeight = viewport.height / (worldPixelsPerUnit * view.zoom * 2);
    const target = cameraTarget();
    const forward = cameraForward();
    camera.left = -halfWidth;
    camera.right = halfWidth;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.position.copy(target).sub(forward.multiplyScalar(cameraDistance));
    camera.up.copy(cameraUp());
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
}
export function viewportSize(canvas) {
    return {
        width: canvas.width / devicePixelRatio(),
        height: canvas.height / devicePixelRatio(),
    };
}
export function viewportCenter(canvas) {
    const viewport = viewportSize(canvas);
    return {
        x: viewport.width / 2,
        y: viewport.height / 2,
    };
}
export function gridFromScreen(canvas, screenX, screenY, heightAt = null) {
    const point = heightAt
        ? topGridPointFromScreen(canvas, screenX, screenY, heightAt)
        : worldPointAtHeight(canvas, screenX, screenY, 0);
    return {
        x: Math.floor(point.x),
        y: Math.floor(point.y),
    };
}
export function panBy(canvas, dx, dy) {
    const center = viewportCenter(canvas);
    const before = worldPointAtHeight(canvas, center.x, center.y, 0);
    const after = worldPointAtHeight(canvas, center.x - dx, center.y - dy, 0);
    view.targetX += after.x - before.x;
    view.targetY += after.y - before.y;
}
export function zoomAt(canvas, screenX, screenY, nextZoom) {
    const zoom = clamp(nextZoom, zoomLimits.min, zoomLimits.max);
    const before = worldPointAtHeight(canvas, screenX, screenY, 0);
    view.zoom = zoom;
    anchorView(canvas, screenX, screenY, before);
}
export function rotateAt(canvas, screenX, screenY, nextRotation, nextElevation = view.elevation) {
    const before = worldPointAtHeight(canvas, screenX, screenY, 0);
    view.rotation = normalizeRotation(nextRotation);
    view.elevation = clamp(nextElevation, cameraElevationLimits.min, cameraElevationLimits.max);
    anchorView(canvas, screenX, screenY, before);
}
export function devicePixelRatio() {
    return window.devicePixelRatio || 1;
}
export function screenFromGrid(canvas, x, y, z = 0) {
    return projectWorldPoint(canvas, new THREE.Vector3(x, y, z));
}
function topGridPointFromScreen(canvas, screenX, screenY, heightAt) {
    for (let z = terrainHeight.max; z >= terrainHeight.min; z -= 1) {
        const point = worldPointAtHeight(canvas, screenX, screenY, visualHeight(z));
        const tile = { x: Math.floor(point.x), y: Math.floor(point.y) };
        if (heightAt(tile) === z) {
            return point;
        }
    }
    return worldPointAtHeight(canvas, screenX, screenY, visualHeight(terrainHeight.min));
}
function worldPointAtHeight(canvas, screenX, screenY, height) {
    const ray = screenRay(canvas, screenX, screenY);
    const distance = (height - ray.origin.z) / ray.direction.z;
    return ray.origin.clone().add(ray.direction.multiplyScalar(distance));
}
function anchorView(canvas, screenX, screenY, before) {
    const after = worldPointAtHeight(canvas, screenX, screenY, 0);
    view.targetX += before.x - after.x;
    view.targetY += before.y - after.y;
}
function screenRay(canvas, screenX, screenY) {
    const viewport = viewportSize(canvas);
    const camera = createViewCamera();
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    const pointer = new THREE.Vector2(screenX / viewport.width * 2 - 1, -(screenY / viewport.height) * 2 + 1);
    configureViewCamera(canvas, camera);
    origin.set(pointer.x, pointer.y, -1).unproject(camera);
    direction.set(pointer.x, pointer.y, 1).unproject(camera).sub(origin).normalize();
    return { origin, direction };
}
function projectWorldPoint(canvas, point) {
    const viewport = viewportSize(canvas);
    const camera = createViewCamera();
    const projected = point.clone();
    configureViewCamera(canvas, camera);
    projected.project(camera);
    return {
        x: (projected.x + 1) * viewport.width / 2,
        y: (1 - projected.y) * viewport.height / 2,
    };
}
function cameraTarget() {
    return new THREE.Vector3(view.targetX, view.targetY, 0);
}
function cameraForward() {
    return new THREE.Vector3(Math.cos(view.rotation) * Math.cos(view.elevation), Math.sin(view.rotation) * Math.cos(view.elevation), -Math.sin(view.elevation)).normalize();
}
function cameraUp() {
    const forward = cameraForward();
    const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
    return new THREE.Vector3().crossVectors(right, forward).normalize();
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
function normalizeRotation(rotation) {
    return Math.atan2(Math.sin(rotation), Math.cos(rotation));
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}

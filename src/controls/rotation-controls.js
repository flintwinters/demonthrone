import { rotateAt, view, viewportCenter } from "./camera.js";
import { rotationControlInterval, rotationControlStep } from "../constants.js";
export function connectRotationControls(canvas, controls, onViewChange) {
    const state = {
        intervalId: null,
    };
    connectButton(canvas, controls.left, rotationControlStep, state, onViewChange);
    connectButton(canvas, controls.right, -rotationControlStep, state, onViewChange);
    window.addEventListener("pointerup", () => stopRotation(state));
    window.addEventListener("pointercancel", () => stopRotation(state));
}
function connectButton(canvas, button, amount, state, onViewChange) {
    button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        startRotation(canvas, amount, state, onViewChange);
    });
    button.addEventListener("click", (event) => {
        event.preventDefault();
    });
}
function startRotation(canvas, amount, state, onViewChange) {
    stopRotation(state);
    rotateBy(canvas, amount, onViewChange);
    state.intervalId = window.setInterval(() => rotateBy(canvas, amount, onViewChange), rotationControlInterval);
}
function stopRotation(state) {
    if (state.intervalId === null) {
        return;
    }
    window.clearInterval(state.intervalId);
    state.intervalId = null;
}
function rotateBy(canvas, amount, onViewChange) {
    const center = viewportCenter(canvas);
    rotateAt(canvas, center.x, center.y, view.rotation + amount);
    onViewChange();
}

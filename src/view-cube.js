import { rotateAt, viewportCenter } from "./camera.js";
const presets = {
    top: { rotation: -Math.PI / 4, elevation: 1.5 },
    front: { rotation: -Math.PI / 2, elevation: 0.12 },
    right: { rotation: 0, elevation: 0.12 },
};
export function connectViewCube(canvas, onViewChange) {
    for (const button of document.querySelectorAll("[data-view]")) {
        button.addEventListener("click", () => setView(canvas, button.dataset.view ?? "", onViewChange));
    }
}
function setView(canvas, name, onViewChange) {
    const preset = presets[name];
    if (!preset) {
        return;
    }
    const center = viewportCenter(canvas);
    rotateAt(canvas, center.x, center.y, preset.rotation, preset.elevation);
    onViewChange();
}

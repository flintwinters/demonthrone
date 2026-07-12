import { view } from "./controls/index.js";
export function syncCompass(dial) {
    const rotation = compassRotation(view.rotation);
    dial.style.transform = `rotate(${rotation}rad)`;
    for (const marker of dial.querySelectorAll(".compass-marker")) {
        marker.style.transform = `rotate(${-rotation}rad)`;
    }
}
export function compassRotation(cameraRotation) {
    return cameraRotation - Math.PI / 2;
}

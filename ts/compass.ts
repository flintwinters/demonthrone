import { view } from "./controls/index.js";

export function syncCompass(dial: HTMLElement): void {
  const rotation = compassRotation(view.rotation);

  dial.style.transform = `rotate(${rotation}rad)`;
  for (const marker of dial.querySelectorAll<HTMLElement>(".compass-marker")) {
    marker.style.transform = `rotate(${-rotation}rad)`;
  }
}

export function compassRotation(cameraRotation: number): number {
  return cameraRotation - Math.PI / 2;
}

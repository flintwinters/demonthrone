import { rotateAt, view, viewportCenter } from "./camera.js";
import { rotationControlInterval, rotationControlStep } from "./constants.js";

type RotationControls = {
  left: HTMLButtonElement;
  right: HTMLButtonElement;
};

type RotationState = {
  intervalId: number | null;
};

export function connectRotationControls(
  canvas: HTMLCanvasElement,
  controls: RotationControls,
  onViewChange: () => void,
): void {
  const state: RotationState = {
    intervalId: null,
  };

  connectButton(canvas, controls.left, rotationControlStep, state, onViewChange);
  connectButton(canvas, controls.right, -rotationControlStep, state, onViewChange);
  window.addEventListener("pointerup", () => stopRotation(state));
  window.addEventListener("pointercancel", () => stopRotation(state));
}

function connectButton(
  canvas: HTMLCanvasElement,
  button: HTMLButtonElement,
  amount: number,
  state: RotationState,
  onViewChange: () => void,
): void {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    startRotation(canvas, amount, state, onViewChange);
  });

  button.addEventListener("click", (event) => {
    event.preventDefault();
  });
}

function startRotation(
  canvas: HTMLCanvasElement,
  amount: number,
  state: RotationState,
  onViewChange: () => void,
): void {
  stopRotation(state);
  rotateBy(canvas, amount, onViewChange);
  state.intervalId = window.setInterval(
    () => rotateBy(canvas, amount, onViewChange),
    rotationControlInterval,
  );
}

function stopRotation(state: RotationState): void {
  if (state.intervalId === null) {
    return;
  }

  window.clearInterval(state.intervalId);
  state.intervalId = null;
}

function rotateBy(canvas: HTMLCanvasElement, amount: number, onViewChange: () => void): void {
  const center = viewportCenter(canvas);

  rotateAt(canvas, center.x, center.y, view.rotation + amount);
  onViewChange();
}

import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = { devicePixelRatio: 1 };

const { view, zoomAt } = await import("../src/camera.js");
const canvas = { width: 800, height: 600 };

test("zoom has no configured maximum", () => {
  zoomAt(canvas, 400, 300, 100);

  assert.equal(view.zoom, 100);
});

test("zoom retains its minimum bound", () => {
  zoomAt(canvas, 400, 300, 0.1);

  assert.equal(view.zoom, 0.5);
});

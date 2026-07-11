import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = { devicePixelRatio: 1 };

const { view, zoomAt } = await import("../src/camera.js");
const canvas = { width: 800, height: 600 };

test("zoom has no configured maximum", () => {
  zoomAt(canvas, 400, 300, 100);

  assert.equal(view.zoom, 100);
});

test("zoom out has no configured minimum", () => {
  zoomAt(canvas, 400, 300, 0.000001);

  assert.equal(view.zoom, 0.000001);
});

test("zoom rejects values outside the positive finite projection domain", () => {
  zoomAt(canvas, 400, 300, 0.25);

  for (const invalidZoom of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    zoomAt(canvas, 400, 300, invalidZoom);
    assert.equal(view.zoom, 0.25);
  }
});

import assert from "node:assert/strict";
import test from "node:test";

globalThis.window = { devicePixelRatio: 1 };

const { compassRotation } = await import("../src/compass.js");

test("compass north aligns with the camera's world-space heading", () => {
  assert.equal(compassRotation(Math.PI / 2), 0);
  assert.equal(compassRotation(0), -Math.PI / 2);
  assert.equal(compassRotation(-Math.PI / 2), -Math.PI);
});

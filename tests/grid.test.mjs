import assert from "node:assert/strict";
import test from "node:test";
import { entityAtTile } from "../src/grid.js";

test("entity lookup returns the entity occupying a tile", () => {
  const entities = [
    { id: "first", x: 2, y: 3 },
    { id: "second", x: -4, y: 8 },
  ];

  assert.equal(entityAtTile(entities, { x: -4, y: 8 }), entities[1]);
  assert.equal(entityAtTile(entities, { x: 0, y: 0 }), null);
  assert.equal(entityAtTile(entities, null), null);
});

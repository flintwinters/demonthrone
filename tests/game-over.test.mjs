import assert from "node:assert/strict";
import test from "node:test";
import { circularTiles } from "../src/visibility/index.js";
import { GameOverState } from "../src/game-over.js";
import { tileKey } from "../src/grid.js";

test("defeat reveal is an inclusive Euclidean circle", () => {
  const keys = new Set(circularTiles({ x: 3, y: -2 }, 2).map(tileKey));

  assert.equal(keys.has("3:-2"), true);
  assert.equal(keys.has("5:-2"), true);
  assert.equal(keys.has("4:-1"), true);
  assert.equal(keys.has("5:0"), false);
  assert.equal(keys.size, 13);
});

test("game over begins at the final defeated teammate", () => {
  const status = { hidden: true };
  const state = new GameOverState(status);
  const first = { x: 2, y: 3 };
  const last = { x: -4, y: 7 };

  state.recordDefeated([first], [last]);
  assert.equal(state.center, null);
  state.recordDefeated([first, last], []);
  state.syncStatus();
  assert.deepEqual(state.center, last);
  assert.equal(status.hidden, false);
});

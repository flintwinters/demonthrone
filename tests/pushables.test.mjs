import assert from "node:assert/strict";
import test from "node:test";
import {
  canPushTo,
  clearPlannedPush,
  commitPlannedPushes,
  planPush,
  pushables,
} from "../src/pushables.js";

const unit = {
  id: "test-unit",
  x: 5,
  y: 7,
  color: "#fff",
  sight: 1,
  movement: 3,
  attackRange: 1,
  health: 1,
  target: null,
};
const flatHeight = () => 0;

test("a teammate can push an adjacent crate into a free tile", () => {
  assert.equal(canPushTo(unit, { x: 5, y: 8 }, () => false, flatHeight), true);
});

test("a blocked crate destination prevents a push", () => {
  const blocksDestination = (tile) => tile.x === 5 && tile.y === 9;

  assert.equal(canPushTo(unit, { x: 5, y: 8 }, blocksDestination, flatHeight), false);
});

test("planned pushes can be cleared or committed", () => {
  const crate = pushables[0];

  planPush(unit, crate);
  assert.deepEqual(crate.target, { x: 5, y: 9 });
  clearPlannedPush(unit.id);
  assert.equal(crate.target, null);

  planPush(unit, crate);
  commitPlannedPushes();
  assert.deepEqual({ x: crate.x, y: crate.y }, { x: 5, y: 9 });
  assert.equal(crate.target, null);
});

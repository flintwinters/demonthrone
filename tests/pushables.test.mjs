import assert from "node:assert/strict";
import test from "node:test";
import { boardState } from "../src/board-state.js";
import { chaseEnchanters, toggleEnchantment } from "../src/enchantment.js";
import { canTakeAction, resetActions, spendAction } from "../src/teammate-turns.js";
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

test("a crate cannot be pushed downhill", () => {
  const downhillHeight = (tile) => tile.y === 8 ? 1 : 0;

  assert.equal(canPushTo(unit, { x: 5, y: 8 }, () => false, downhillHeight), false);
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

test("crates outside teammate line of sight are not rendered", () => {
  const crate = pushables[0];
  const original = { x: crate.x, y: crate.y };

  crate.x = 1000;
  crate.y = 1000;
  const isRendered = boardState(null, null, [], [], () => false).pushables
    .some((candidate) => candidate.id === crate.id);

  assert.equal(isRendered, false);
  crate.x = original.x;
  crate.y = original.y;
});

test("enchantment toggles and makes a crate chase its teammate", () => {
  const crate = pushables[0];

  assert.equal(toggleEnchantment(crate, unit), true);
  assert.equal(crate.enchanterUnitId, unit.id);
  chaseEnchanters([unit], new Set([crate.id]), () => false, flatHeight);
  assert.deepEqual({ x: crate.x, y: crate.y }, { x: 5, y: 9 });
  chaseEnchanters([unit], new Set(), () => false, flatHeight);
  assert.deepEqual({ x: crate.x, y: crate.y }, { x: 5, y: 8 });
  assert.equal(toggleEnchantment(crate, unit), true);
  assert.equal(crate.enchanterUnitId, null);
});

test("spending an enchant action clears movement and push plans for the turn", () => {
  const crate = pushables[0];

  unit.target = { x: crate.x, y: crate.y };
  planPush(unit, crate);
  spendAction(unit);
  assert.equal(unit.target, null);
  assert.equal(crate.target, null);
  assert.equal(canTakeAction(unit), false);
  resetActions();
  assert.equal(canTakeAction(unit), true);
});

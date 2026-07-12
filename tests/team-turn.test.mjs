import assert from "node:assert/strict";
import test from "node:test";
import { canTakeAction, resetActions } from "../src/teammate-turns.js";
import { clickBoardTile, selection, units } from "../src/units.js";

test("planning one movement reserves the entire teammate turn", () => {
  const acting = units[0];
  const waiting = units[1];
  const destination = { x: acting.x + 10, y: acting.y, height: 0 };

  clickBoardTile({ ...acting, height: 0 }, () => true, () => {});
  assert.deepEqual(clickBoardTile(destination, () => true, () => {}), destination);
  assert.equal(canTakeAction(acting), false);
  assert.equal(canTakeAction(waiting), false);
  assert.equal(clickBoardTile(destination, () => true, () => {}), null);
  assert.equal(canTakeAction(waiting), true);
  selection.unitId = null;
  resetActions();
});

import assert from "node:assert/strict";
import test from "node:test";
import { actionFields } from "../src/action-fields.js";

const character = {
  id: "cache-policy-character",
  entityKind: "enemy",
  entityType: "pursuer",
  x: 200,
  y: 200,
  color: "#fff",
  sight: 4,
  movement: 2,
  attackRange: 2,
  health: 1,
  damage: 1,
  movementInterval: 1,
  turnsUntilMove: 0,
};

test("action-field caching distinguishes movement policies", () => {
  const blocked = actionFields(character, [], { key: "all-blocked", isBlocked: () => true });
  const open = actionFields(character, [], { key: "unblocked", isBlocked: () => false });

  assert.equal(blocked.movement.size, 0);
  assert.equal(open.movement.size > 0, true);
});

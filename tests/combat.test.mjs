import assert from "node:assert/strict";
import test from "node:test";
import { canAttack, planAttack, resolveAttacks, tryPlanAttack } from "../src/combat.js";
import { canTakeAction, resetActions } from "../src/teammate-turns.js";

function teammate(id, attackRange = 2) {
  return {
    id,
    x: 0,
    y: 0,
    color: "#fff",
    sight: 5,
    movement: 3,
    attackRange,
    health: 3,
    target: { x: 1, y: 0 },
    attackTargetId: null,
  };
}

function enemy(id, x, health = 2) {
  return { id, x, y: 0, color: "#fff", sight: 5, movement: 1, attackRange: 1, health };
}

test("planning an in-range attack spends the teammate action", () => {
  const unit = teammate("attacker");
  const target = enemy("target", 2);

  assert.equal(canAttack(unit, target), true);
  planAttack(unit, target);
  assert.equal(unit.target, null);
  assert.equal(unit.attackTargetId, target.id);
  assert.equal(canTakeAction(unit), false);
  resetActions();
});

test("attack resolution damages and removes defeated enemies", () => {
  const unit = teammate("finisher");
  const target = enemy("target", 1, 1);
  const enemies = [target];

  planAttack(unit, target);
  assert.deepEqual(resolveAttacks([unit], enemies), [{ x: 1, y: 0 }]);
  assert.equal(enemies.length, 0);
  assert.equal(unit.attackTargetId, null);
  resetActions();
});

test("out-of-range enemies cannot be targeted", () => {
  const unit = teammate("distant-attacker", 1);
  const target = enemy("distant-target", 2);

  assert.equal(tryPlanAttack(target, unit, [target], () => true), null);
  assert.equal(target.health, 2);
});

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

test("one teammate action locks every other teammate for the turn", () => {
  const acting = teammate("acting");
  const waiting = teammate("waiting");
  const target = enemy("target", 1);

  planAttack(acting, target);
  assert.equal(canTakeAction(acting), false);
  assert.equal(canTakeAction(waiting), false);
  assert.equal(tryPlanAttack(target, waiting, [target], () => true), null);
  resetActions();
  assert.equal(canTakeAction(waiting), true);
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

test("attack distance uses a circular field rather than Manhattan lines", () => {
  const unit = teammate("diagonal-attacker", 2);
  const target = { ...enemy("diagonal-target", 1), y: 1 };

  assert.equal(canAttack(unit, target), true);
});

test("clicking a planned attack again cancels and refunds it", () => {
  const unit = teammate("cancel-attacker");
  const target = enemy("cancel-target", 1);

  assert.equal(tryPlanAttack(target, unit, [target], () => true), target);
  assert.equal(canTakeAction(unit), false);
  assert.equal(tryPlanAttack(target, unit, [target], () => true), target);
  assert.equal(unit.attackTargetId, null);
  assert.equal(canTakeAction(unit), true);
});

test("attacks can damage and destroy crates", () => {
  const unit = teammate("crate-attacker");
  const crate = {
    id: "crate-target",
    entityKind: "object",
    entityType: "crate",
    x: 1,
    y: 0,
    health: 1,
  };
  const crates = [crate];

  planAttack(unit, crate);
  assert.deepEqual(resolveAttacks([unit], [], crates), [{ x: 1, y: 0 }]);
  assert.equal(crates.length, 0);
  resetActions();
});

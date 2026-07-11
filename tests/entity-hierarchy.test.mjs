import assert from "node:assert/strict";
import test from "node:test";
import { EnemyTemplate, PushableTemplate, TeammateTemplate } from "../src/domain.js";

const stats = { sight: 8, movement: 2, attackRange: 3, health: 5 };

test("character templates create discriminated, independently extensible archetypes", () => {
  const teammate = new TeammateTemplate("ranger", stats, "#83a598")
    .create("ally-1", { x: 2, y: 3 });
  const enemy = new EnemyTemplate("warlock", stats, "#cc241d")
    .create("enemy-1", { x: 7, y: 9 });

  assert.deepEqual(
    [teammate.entityKind, teammate.entityType, teammate.target, teammate.attackTargetId],
    ["teammate", "ranger", null, null],
  );
  assert.deepEqual(
    [enemy.entityKind, enemy.entityType, enemy.health, enemy.attackRange],
    ["enemy", "warlock", 5, 3],
  );
});

test("object templates share entity identity while preserving object-specific state", () => {
  const relic = new PushableTemplate("relic", 12).create("relic-1", { x: -4, y: 6 });

  assert.deepEqual(
    [relic.entityKind, relic.entityType, relic.health, relic.target, relic.followsId],
    ["object", "relic", 12, null, null],
  );
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  entityStatus,
  selectedEntityAt,
  selectedEntityStatus,
  selectVisibleEntityTile,
} from "../src/selection-status.js";

const warden = {
  id: "unit-2",
  entityKind: "teammate",
  entityType: "warden",
  x: 8,
  y: 6,
};

test("selection status contains only the selected entity archetype", () => {
  assert.equal(entityStatus(warden), "warden");
  assert.equal(entityStatus(null), "");
});

test("status lookup ignores empty selected terrain", () => {
  assert.equal(selectedEntityAt({ x: 8, y: 6 }, [warden]), warden);
  assert.equal(selectedEntityAt({ x: 9, y: 6 }, [warden]), null);
});

test("entity status prioritizes explicit gameplay selections", () => {
  const crate = { ...warden, id: "crate-1", entityKind: "object", entityType: "crate" };

  assert.equal(selectedEntityStatus(warden, crate, crate, [warden, crate]), "warden");
  assert.equal(selectedEntityStatus(null, crate, warden, [warden, crate]), "crate");
});

test("visible non-unit entities can be selected for inspection", () => {
  const enemy = { ...warden, id: "enemy-1", entityKind: "enemy", entityType: "pursuer" };
  const enrich = (tile) => ({ ...tile, height: 2 });

  assert.deepEqual(
    selectVisibleEntityTile({ x: 8, y: 6 }, [], [enemy], () => true, enrich, () => null),
    { x: 8, y: 6, height: 2 },
  );
  assert.equal(selectVisibleEntityTile({ x: 8, y: 6 }, [], [enemy], () => false, enrich, () => null), null);
});

import assert from "node:assert/strict";
import test from "node:test";
import { terrainTraits } from "../src/game-config.js";
import {
  entityStatus,
  isInspectableTerrain,
  selectedEntityAt,
  selectedEntityStatus,
  selectedObjectStatus,
  selectVisibleEntityTile,
} from "../src/selection-status.js";

const warden = {
  id: "unit-2",
  entityKind: "teammate",
  entityType: "warden",
  infoText: "warden",
  x: 8,
  y: 6,
};

test("every configured terrain type owns its inspection text", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(terrainTraits).map(([kind, terrain]) => [kind, terrain.infoText])),
    { floor: "", boulder: "boulder", brush: "foliage", ice: "ice", water: "water" },
  );
});

test("selection status contains only the selected entity archetype", () => {
  assert.equal(entityStatus(warden), "warden");
  assert.equal(entityStatus(null), "");
});

test("status lookup ignores empty selected terrain", () => {
  assert.equal(selectedEntityAt({ x: 8, y: 6 }, [warden]), warden);
  assert.equal(selectedEntityAt({ x: 9, y: 6 }, [warden]), null);
});

test("entity status prioritizes explicit gameplay selections", () => {
  const crate = {
    ...warden, id: "crate-1", entityKind: "object", entityType: "crate", infoText: "wooden crate",
  };

  assert.equal(selectedEntityStatus(warden, crate, crate, [warden, crate]), "wooden crate");
  assert.equal(selectedEntityStatus(null, crate, warden, [warden, crate]), "wooden crate");
});

test("status text remains concise during active interactions", () => {
  const unit = { ...warden, target: null, attackTargetId: null };
  const crate = {
    ...warden,
    id: "crate-1",
    entityKind: "object",
    entityType: "crate",
    infoText: "crate",
    enchanterUnitId: null,
  };
  const terrainAt = () => ({ infoText: "" });

  assert.equal(selectedObjectStatus(unit, null, unit, [unit, crate], terrainAt), "warden");
  assert.equal(selectedObjectStatus(null, crate, crate, [unit, crate], terrainAt), "crate");
});

test("visible non-unit entities can be selected for inspection", () => {
  const enemy = {
    ...warden, id: "enemy-1", entityKind: "enemy", entityType: "pursuer", infoText: "pursuer",
  };
  const enrich = (tile) => ({ ...tile, height: 2 });

  assert.deepEqual(
    selectVisibleEntityTile({ x: 8, y: 6 }, [], [enemy], () => true, enrich, () => null),
    { x: 8, y: 6, height: 2 },
  );
  assert.equal(selectVisibleEntityTile({ x: 8, y: 6 }, [], [enemy], () => false, enrich, () => null), null);
});

test("terrain objects have concise user-facing inspection text", () => {
  const foliage = { infoText: "foliage" };

  assert.equal(selectedObjectStatus(null, null, { x: 3, y: 4 }, [], () => foliage), "foliage");
  assert.equal(isInspectableTerrain({ infoText: "boulder" }), true);
  assert.equal(isInspectableTerrain({ infoText: "" }), false);
});

test("visible terrain objects can be selected for inspection", () => {
  const enrich = (tile) => ({ ...tile, height: 2 });

  assert.deepEqual(
    selectVisibleEntityTile(
      { x: 3, y: 4 }, [], [], () => true, enrich, () => null, () => true,
    ),
    { x: 3, y: 4, height: 2 },
  );
});

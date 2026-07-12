import assert from "node:assert/strict";
import test from "node:test";
import { boardState } from "../src/board-state.js";
import { resolveAttacks } from "../src/combat.js";
import { materializeEntities } from "../src/entity-generation.js";
import {
  bindEnchantment,
  captureFollowerPositions,
  dispelDestroyedPushable,
  dispelEnchantment,
  followPositionHistory,
} from "../src/enchantment.js";
import { EnchantmentSelection } from "../src/enchantment-selection.js";
import { handleEnchantmentClick } from "../src/interaction.js";
import { canTakeAction, resetActions, spendAction } from "../src/teammate-turns.js";
import { units } from "../src/units.js";
import {
  canPushTo,
  clearPlannedPush,
  commitPlannedPushes,
  planPush,
  pushables,
} from "../src/pushables.js";

materializeEntities([{
  id: "generator",
  x: 5,
  y: 7,
  color: "#fff",
  sight: 5,
  movement: 3,
  attackRange: 1,
  health: 3,
  target: null,
  attackTargetId: null,
}], []);
const initialCrate = pushables[0];
const unit = {
  id: "test-unit",
  x: initialCrate.x,
  y: initialCrate.y - 1,
  color: "#fff",
  sight: 1,
  movement: 3,
  attackRange: 1,
  health: 1,
  target: null,
};
const flatHeight = () => 0;

test("a teammate can push an adjacent crate into a free tile", () => {
  assert.equal(initialCrate.health, 3);
  assert.equal(canPushTo(unit, initialCrate, () => false, flatHeight), true);
});

test("a blocked crate destination prevents a push", () => {
  const blocksDestination = (tile) => tile.x === initialCrate.x && tile.y === initialCrate.y + 1;

  assert.equal(canPushTo(unit, initialCrate, blocksDestination, flatHeight), false);
});

test("a crate cannot be pushed downhill", () => {
  const downhillHeight = (tile) => tile.x === initialCrate.x && tile.y === initialCrate.y ? 1 : 0;

  assert.equal(canPushTo(unit, initialCrate, () => false, downhillHeight), false);
});

test("planned pushes can be cleared or committed", () => {
  const crate = pushables[0];
  const destination = { x: crate.x, y: crate.y + 1 };

  planPush(unit, crate);
  assert.deepEqual(crate.target, destination);
  clearPlannedPush(unit.id);
  assert.equal(crate.target, null);

  planPush(unit, crate);
  commitPlannedPushes();
  assert.deepEqual({ x: crate.x, y: crate.y }, destination);
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

test("the pending enchantment source is exposed to the renderer", () => {
  const crate = pushables[0];
  const original = { x: crate.x, y: crate.y };

  crate.x = units[0].x;
  crate.y = units[0].y;
  const renderedCrate = boardState(null, null, [], [], () => false, () => false, crate.id).pushables
    .find((candidate) => candidate.id === crate.id);

  assert.equal(renderedCrate?.isEnchantmentSource, true);
  crate.x = original.x;
  crate.y = original.y;
});

test("crates bind to an explicitly selected chain target", () => {
  const [first, second, inserted] = pushables;

  assert.equal(bindEnchantment(first, unit, [unit]), unit);
  assert.equal(bindEnchantment(second, first, [unit]), unit);
  assert.equal(first.followsId, unit.id);
  assert.equal(second.followsId, first.id);

  assert.equal(bindEnchantment(inserted, first, [unit]), unit);
  assert.equal(inserted.followsId, first.id);
  assert.equal(second.followsId, inserted.id);
  const previous = captureFollowerPositions([unit]);
  const previousUnit = previous.get(unit.id);
  const previousFirst = previous.get(first.id);
  const previousInserted = previous.get(inserted.id);

  unit.x += 1;
  followPositionHistory([unit], previous);
  assert.deepEqual({ x: first.x, y: first.y }, previousUnit);
  assert.deepEqual({ x: inserted.x, y: inserted.y }, previousFirst);
  assert.deepEqual({ x: second.x, y: second.y }, previousInserted);

  assert.equal(dispelEnchantment(inserted, [unit]), unit);
  assert.equal(first.enchanterUnitId, unit.id);
  assert.equal(inserted.enchanterUnitId, null);
  assert.equal(second.enchanterUnitId, null);
  assert.equal(dispelEnchantment(first, [unit]), unit);
  assert.equal(first.enchanterUnitId, null);
  unit.x -= 1;
});

test("crate-first binding consumes the target teammate's action", () => {
  const source = pushables.find((crate) => crate.x !== unit.x || crate.y !== unit.y);
  const binding = new EnchantmentSelection();

  assert.notEqual(source, undefined);
  assert.equal(binding.begin(source), true);
  assert.equal(binding.canBindTo(unit, [unit]), true);
  assert.equal(binding.resolve(unit, [unit]), true);
  assert.equal(source.followsId, unit.id);
  assert.equal(canTakeAction(unit), false);
  resetActions();
  dispelEnchantment(source, [unit]);
});

test("an unrelated click cancels binding and remains available to other actions", () => {
  const source = pushables[0];
  const binding = new EnchantmentSelection();

  binding.begin(source);
  const result = handleEnchantmentClick(
    { x: source.x + 20, y: source.y + 20 }, null, binding, [unit], null,
    () => false, (tile) => ({ ...tile, height: 0 }), () => {},
  );

  assert.equal(result.handled, false);
  assert.equal(binding.source(), null);
});

test("unit actions take precedence over beginning a crate bind", () => {
  const source = pushables[0];
  const binding = new EnchantmentSelection();
  const result = handleEnchantmentClick(
    source, null, binding, [unit], unit,
    () => true, (tile) => ({ ...tile, height: 0 }), () => assert.fail("selection cleared"),
  );

  assert.equal(result.handled, false);
  assert.equal(binding.source(), null);
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

test("destroying an enchanted crate dispels its downstream chain", () => {
  const [destroyed, follower] = pushables;

  bindEnchantment(destroyed, unit, [unit]);
  bindEnchantment(follower, destroyed, [unit]);
  destroyed.health = 0;
  resolveAttacks([], [], pushables, target => dispelDestroyedPushable(target, [unit]));

  assert.equal(pushables.includes(destroyed), false);
  assert.equal(follower.enchanterUnitId, null);
  assert.equal(follower.followsId, null);
});

import assert from "node:assert/strict";
import test from "node:test";
import { hoveredTileColor, terrainSignature } from "../src/rendering/index.js";

const tile = { x: 3, y: 4 };

function boardState(hoveredTile, isMovementTile = () => false, isAttackTile = () => false) {
  return {
    hoveredTile,
    selectedTile: null,
    selectedUnitId: null,
    units: [],
    enemies: [],
    pushables: [],
    tileHeight: () => 2,
    isMovementTile,
    isAttackTile,
  };
}

test("hover changes do not invalidate cached terrain geometry", () => {
  const idle = terrainSignature([tile], boardState(null));
  const hovered = terrainSignature([tile], boardState({ ...tile, height: 2 }));

  assert.equal(hovered, idle);
});

test("hover feedback retains distinct movement and attack colors", () => {
  const hovered = { ...tile, height: 2 };
  const ordinary = hoveredTileColor(tile, boardState(hovered));
  const movement = hoveredTileColor(tile, boardState(hovered, () => true));
  const attack = hoveredTileColor(tile, boardState(hovered, () => false, () => true));

  assert.notEqual(ordinary, movement);
  assert.notEqual(movement, attack);
  assert.notEqual(attack, ordinary);
});

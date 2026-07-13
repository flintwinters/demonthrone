import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { terrainBatchSurface, tileStyle } from "../src/rendering/index.js";
import { isWallTile, tileHeight } from "../src/world/index.js";

test("wall terrain batches use a repeating nearest-filtered brick texture", () => {
  const mesh = terrainMesh({
    top: "#665c54",
    side: ["#665c54", "#665c54", "#3c3836", "#3c3836"],
    edge: "#928374",
    pattern: "brick",
  });
  const texture = mesh.material.map;

  assert.notEqual(texture, null);
  assert.equal(texture.name, "wall-brick-pattern");
  assert.equal(texture.wrapS, THREE.RepeatWrapping);
  assert.equal(texture.wrapT, THREE.RepeatWrapping);
  assert.equal(texture.magFilter, THREE.NearestFilter);
  assert.equal(mesh.geometry.hasAttribute("uv"), true);
});

test("ordinary terrain batches remain untextured", () => {
  const mesh = terrainMesh({ top: "#282828", side: "#1d2021", edge: "#928374" });

  assert.equal(mesh.material.map, null);
});

test("brick mortar is lighter than the wall's brick faces", () => {
  const texture = terrainMesh({
    top: "#a0a0a0", side: "#707070", edge: "#928374", pattern: "brick",
  }).material.map;
  const pixels = texture.image.data;
  const mortar = pixels[0];
  const brick = pixels[(2 * texture.image.width + 4) * 4];

  assert.equal(mortar > brick, true);
});

test("generated walls use neutral gray independent of biome", () => {
  const wall = findWall();
  const style = tileStyle(wall, idleBoardState(), tileHeight(wall));
  const top = new THREE.Color(style.top);

  assert.equal(style.pattern, "brick");
  assert.equal(top.r, top.g);
  assert.equal(top.g, top.b);
});

function terrainMesh(style) {
  const tile = { x: 3, y: 5 };
  const group = terrainBatchSurface(
    [tile],
    new Map([["3:5", style]]),
    new Map([["3:5", 4]]),
  );

  return group.children.find((child) => child.isMesh);
}

function findWall() {
  for (let y = -40; y <= 40; y += 1) {
    for (let x = -40; x <= 40; x += 1) {
      if (isWallTile({ x, y })) return { x, y };
    }
  }

  throw new Error("Expected a generated wall tile.");
}

function idleBoardState() {
  return {
    selectedTile: null,
    hoveredTile: null,
    units: [],
    enemies: [],
    pushables: [],
    isAttackTile: () => false,
    isMovementTile: () => false,
  };
}

import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { colors, foliageColors } from "../src/constants.js";

const biomeSurfaces = [
  [colors.cinderTile, colors.cinderTileSide],
  [colors.fenTile, colors.fenTileSide],
  [colors.heathTile, colors.heathTileSide],
  [colors.ridgeTile, colors.ridgeTileSide],
  [colors.bogTile, colors.bogTileSide],
  [colors.mesaTile, colors.mesaTileSide],
  [colors.waterTile, colors.waterTileSide],
  [colors.iceTile, colors.iceTileSide],
];

test("biome surfaces are saturated and brighter than their side faces", () => {
  for (const [top, side] of biomeSurfaces) {
    assert.ok(hsl(top).saturation >= 0.3, `${top} should remain saturated`);
    assert.ok(hsl(top).lightness > hsl(side).lightness, `${top} should read above ${side}`);
  }
});

test("foliage stays colorful but subordinate to interactive pieces", () => {
  const focusLightness = Math.min(
    hsl(colors.pushable).lightness,
    hsl(colors.unitOne).lightness,
    hsl(colors.unitTwo).lightness,
    hsl(colors.unitThree).lightness,
  );

  for (const color of Object.values(foliageColors)) {
    const foliage = hsl(color);

    assert.ok(foliage.saturation >= 0.35, `${color} should remain visibly colored`);
    assert.ok(foliage.lightness < focusLightness, `${color} should not compete with pieces`);
  }
});

function hsl(color) {
  const value = { h: 0, s: 0, l: 0 };

  new THREE.Color(color).getHSL(value);
  return { saturation: value.s, lightness: value.l };
}

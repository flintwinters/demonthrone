import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { colors } from "../src/constants.js";
import { skyBackground } from "../src/rendering/sky-background.js";

test("sky background grades from dark groundward color to sky-blue zenith", () => {
  const texture = skyBackground(colors.background, colors.sky);

  assert.equal(texture.name, "sky-background-gradient");
  assert.equal(texture.image.width, 1);
  assert.equal(texture.image.height, 2);
  assert.deepEqual([...texture.image.data], [
    0x11, 0x15, 0x16, 0xff,
    0x83, 0xa5, 0x98, 0xff,
  ]);
  assert.equal(texture.colorSpace, THREE.SRGBColorSpace);
  assert.equal(texture.magFilter, THREE.LinearFilter);
  assert.equal(texture.minFilter, THREE.LinearFilter);
  assert.equal(texture.version, 1);
});

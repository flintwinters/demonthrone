import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { cameraDistance, colors } from "../src/constants.js";
import { centerSkybox, createSkybox } from "../src/rendering/skybox.js";

test("skybox is camera-centered inward-facing 3D geometry", () => {
  const skybox = createSkybox(colors.background, colors.sky);
  const camera = new THREE.OrthographicCamera();

  camera.position.set(17, -9, 31);
  centerSkybox(skybox, camera);

  assert.equal(skybox.name, "skybox");
  assert.equal(skybox.geometry.type, "BoxGeometry");
  assert.equal(skybox.geometry.parameters.width, cameraDistance * 2);
  assert.equal(skybox.geometry.parameters.height, cameraDistance * 2);
  assert.equal(skybox.geometry.parameters.depth, cameraDistance * 2);
  assert.deepEqual(skybox.position.toArray(), camera.position.toArray());
  assert.equal(skybox.material.side, THREE.BackSide);
  assert.equal(skybox.material.depthTest, false);
  assert.equal(skybox.material.depthWrite, false);
  assert.equal(skybox.frustumCulled, false);
});

test("skybox shader derives its gradient from normalized 3D height", () => {
  const skybox = createSkybox(colors.background, colors.sky);
  const { fragmentShader, uniforms } = skybox.material;

  assert.match(fragmentShader, /normalize\(skyDirection\)\.z/);
  assert.equal(uniforms.bottomColor.value.getHexString(), "111516");
  assert.equal(uniforms.topColor.value.getHexString(), "83a598");
});

import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { colors } from "../src/constants.js";
import { configureSkybox, createSkybox } from "../src/rendering/skybox.js";

test("skybox is inward-facing 3D geometry projected at infinite depth", () => {
  const skybox = createSkybox(colors.background, colors.sky);

  assert.equal(skybox.name, "skybox");
  assert.equal(skybox.geometry.type, "BoxGeometry");
  assert.equal(skybox.geometry.parameters.width, 2);
  assert.equal(skybox.geometry.parameters.height, 2);
  assert.equal(skybox.geometry.parameters.depth, 2);
  assert.match(skybox.material.vertexShader, /gl_Position = clipPosition\.xyww/);
  assert.equal(skybox.material.side, THREE.BackSide);
  assert.equal(skybox.material.depthTest, false);
  assert.equal(skybox.material.depthWrite, false);
  assert.equal(skybox.frustumCulled, false);
});

test("skybox projection follows camera rotation but not position or zoom", () => {
  const skybox = createSkybox(colors.background, colors.sky);
  const camera = new THREE.OrthographicCamera(-4, 4, 3, -3, 0.1, 240);
  const viewport = { width: 800, height: 600 };

  camera.position.set(17, -9, 31);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  configureSkybox(skybox, camera, viewport);
  const initialProjection = skybox.material.uniforms.skyViewProjection.value.clone();

  camera.position.add(new THREE.Vector3(1000, -500, 200));
  camera.zoom = 0.01;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  configureSkybox(skybox, camera, viewport);

  assert.ok(initialProjection.equals(skybox.material.uniforms.skyViewProjection.value));
});

test("skybox shader derives its gradient from normalized 3D height", () => {
  const skybox = createSkybox(colors.background, colors.sky);
  const { fragmentShader, uniforms } = skybox.material;

  assert.match(fragmentShader, /normalize\(skyDirection\)\.z/);
  assert.equal(uniforms.bottomColor.value.getHexString(), "111516");
  assert.equal(uniforms.topColor.value.getHexString(), "83a598");
});

import * as THREE from "three";
import type { ViewportSize } from "../types.js";

const skyNear = 0.1;
const skyFar = 10;
const skyHalfHeight = 1;
const skyViewRotation = new THREE.Matrix4();
const skyProjection = new THREE.Matrix4();

const vertexShader = `
  uniform mat4 skyViewProjection;
  varying vec3 skyDirection;

  void main() {
    skyDirection = position;
    vec4 clipPosition = skyViewProjection * vec4(position, 1.0);
    gl_Position = clipPosition.xyww;
  }
`;

const fragmentShader = `
  uniform vec3 bottomColor;
  uniform vec3 topColor;
  varying vec3 skyDirection;

  void main() {
    float height = normalize(skyDirection).z;
    float blend = smoothstep(-1.0, 1.0, height);
    gl_FragColor = vec4(mix(bottomColor, topColor, blend), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createSkybox(bottom: string, top: string): THREE.Mesh<THREE.BoxGeometry, THREE.ShaderMaterial> {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      bottomColor: { value: new THREE.Color(bottom) },
      topColor: { value: new THREE.Color(top) },
      skyViewProjection: { value: new THREE.Matrix4() },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
  });
  const skybox = new THREE.Mesh(geometry, material);

  skybox.name = "skybox";
  skybox.frustumCulled = false;
  skybox.renderOrder = Number.NEGATIVE_INFINITY;
  return skybox;
}

export function configureSkybox(
  skybox: THREE.Mesh<THREE.BoxGeometry, THREE.ShaderMaterial>,
  camera: THREE.Camera,
  viewport: ViewportSize,
): void {
  const aspect = viewport.width / viewport.height;

  skyProjection.makePerspective(
    -skyHalfHeight * aspect,
    skyHalfHeight * aspect,
    skyHalfHeight,
    -skyHalfHeight,
    skyNear,
    skyFar,
  );
  skyViewRotation.extractRotation(camera.matrixWorldInverse);
  skybox.material.uniforms.skyViewProjection.value.multiplyMatrices(skyProjection, skyViewRotation);
}

import * as THREE from "three";
import { cameraDistance } from "../constants.js";
const vertexShader = `
  varying vec3 skyDirection;

  void main() {
    skyDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
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
export function createSkybox(bottom, top) {
    const geometry = new THREE.BoxGeometry(cameraDistance * 2, cameraDistance * 2, cameraDistance * 2);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            bottomColor: { value: new THREE.Color(bottom) },
            topColor: { value: new THREE.Color(top) },
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
export function centerSkybox(skybox, camera) {
    skybox.position.copy(camera.position);
}

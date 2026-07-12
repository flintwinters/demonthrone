import * as THREE from "three";
import { configureViewCamera, createViewCamera, devicePixelRatio } from "./controls/index.js";
import { enemyObjects, unitObjects } from "./character-render.js";
import { colors, terrainHeight } from "./constants.js";
import { material } from "./render-materials.js";
import { addSelectionVisuals } from "./selection-render.js";
import { pushableMeshes } from "./pushable-render.js";
import { terrainLayer, terrainSignature } from "./terrain-layer.js";
const tombstoneGeometry = new THREE.SphereGeometry(0.15, 12, 8);
const hemisphereLightIntensity = 4.2;
const directionalLightIntensity = 3.5;
const state = { current: null };
tombstoneGeometry.userData.shared = true;
export function drawGrid(canvas, boardState) {
    const renderState = initializeRenderer(canvas);
    const tiles = boardState.visibleTiles;
    configureViewCamera(canvas, renderState.camera);
    syncTerrain(renderState, boardState, tiles);
    clearRoot(renderState.dynamicRoot);
    addTombstones(renderState, boardState.tombstones);
    addPushables(renderState, boardState.pushables);
    renderState.dynamicRoot.add(...boardState.enemies.flatMap(enemyObjects));
    renderState.dynamicRoot.add(...boardState.units.flatMap(unitObjects));
    addSelectionVisuals(renderState.dynamicRoot, boardState);
    renderState.renderer.render(renderState.scene, renderState.camera);
}
function addPushables(renderState, pushables) {
    for (const pushable of pushables) {
        renderState.dynamicRoot.add(...pushableMeshes(pushable));
    }
}
function initializeRenderer(canvas) {
    if (state.current) {
        configureRendererSize(state.current.renderer, canvas);
        return state.current;
    }
    const renderState = {
        renderer: new THREE.WebGLRenderer({ canvas, antialias: false }),
        scene: new THREE.Scene(),
        camera: createViewCamera(),
        root: new THREE.Group(),
        dynamicRoot: new THREE.Group(),
        terrainCache: null,
    };
    configureRendererSize(renderState.renderer, canvas);
    renderState.renderer.setClearColor(colors.background, 1);
    renderState.scene.add(renderState.root);
    renderState.root.add(renderState.dynamicRoot);
    renderState.scene.add(new THREE.HemisphereLight(colors.tileStroke, colors.background, hemisphereLightIntensity));
    renderState.scene.add(directionalLight());
    state.current = renderState;
    return renderState;
}
function configureRendererSize(renderer, canvas) {
    renderer.setPixelRatio(devicePixelRatio());
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}
function clearRoot(root) {
    disposeGroup(root);
    root.clear();
}
function syncTerrain(renderState, boardState, tiles) {
    const signature = terrainSignature(tiles, boardState);
    if (renderState.terrainCache?.signature === signature) {
        return;
    }
    if (renderState.terrainCache) {
        disposeGroup(renderState.terrainCache.group);
        renderState.root.remove(renderState.terrainCache.group);
    }
    const group = terrainLayer(boardState, tiles);
    renderState.root.add(group);
    renderState.terrainCache = { signature, group };
}
function addTombstones(renderState, tombstones) {
    for (const tombstone of tombstones) {
        renderState.dynamicRoot.add(tombstoneMesh(tombstone));
    }
}
function tombstoneMesh(tombstone) {
    const mesh = new THREE.Mesh(tombstoneGeometry, material(colors.tombstone));
    mesh.position.set(tombstone.x + 0.5, tombstone.y + 0.5, visualHeight(tombstone.height) + 0.16);
    return mesh;
}
function directionalLight() {
    const light = new THREE.DirectionalLight(colors.tileStroke, directionalLightIntensity);
    light.position.set(-3, -4, 7);
    return light;
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
}
function disposeGroup(group) {
    group.traverse((object) => {
        if (object instanceof THREE.Mesh && isDisposableGeometry(object.geometry)) {
            object.geometry.dispose();
        }
        if (object instanceof THREE.LineSegments && isDisposableGeometry(object.geometry)) {
            object.geometry.dispose();
        }
    });
}
function isDisposableGeometry(geometry) {
    return geometry.userData.shared !== true;
}

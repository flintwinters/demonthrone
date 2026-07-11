import * as THREE from "three";
import { configureViewCamera, createViewCamera, devicePixelRatio } from "./camera.js";
import { enemyObjects, unitObjects } from "./character-render.js";
import { colors, terrainHeight } from "./constants.js";
import { lineMaterial, material } from "./render-materials.js";
import { pushableMeshes } from "./pushable-render.js";
import { terrainLayer, terrainSignature } from "./terrain-layer.js";
import { parabolicSelectionLineConfig } from "./selection-visuals.js";
const tombstoneGeometry = new THREE.SphereGeometry(0.15, 12, 8);
const hemisphereLightIntensity = 2.8;
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
    addSelectionLines(renderState, boardState.selectionLines);
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
function addSelectionLines(renderState, selectionLines) {
    for (const arc of selectionLines) {
        renderState.dynamicRoot.add(selectionLineMesh(arc));
    }
}
function tombstoneMesh(tombstone) {
    const mesh = new THREE.Mesh(tombstoneGeometry, material(colors.tombstone));
    mesh.position.set(tombstone.x + 0.5, tombstone.y + 0.5, visualHeight(tombstone.height) + 0.16);
    return mesh;
}
function selectionLineMesh(arc) {
    return new THREE.LineSegments(selectionLineGeometry(arc), lineMaterial(arc.color));
}
function selectionLineGeometry(arc) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const segments = parabolicSelectionLineConfig.segmentCount;
    const startHeight = visualHeight(arc.start.height) + parabolicSelectionLineConfig.endpointLift;
    const endHeight = visualHeight(arc.end.height) + parabolicSelectionLineConfig.endpointLift;
    const distance = Math.hypot(arc.start.x - arc.end.x, arc.start.y - arc.end.y);
    const peak = parabolicSelectionLineConfig.basePeakHeight + distance * parabolicSelectionLineConfig.distanceScale;
    for (let segment = 0; segment < segments; segment += 1) {
        const startT = segment / segments;
        const endT = (segment + 1) / segments;
        const start = arcPoint(arc, startT, startHeight, endHeight, peak);
        const finish = arcPoint(arc, endT, startHeight, endHeight, peak);
        positions.push(start.x, start.y, start.z, finish.x, finish.y, finish.z);
    }
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
}
function arcPoint(arc, t, startHeight, endHeight, peak) {
    const centerOffset = parabolicSelectionLineConfig.centerOffset;
    const x = arc.start.x + centerOffset + (arc.end.x + centerOffset - (arc.start.x + centerOffset)) * t;
    const y = arc.start.y + centerOffset + (arc.end.y + centerOffset - (arc.start.y + centerOffset)) * t;
    const baseHeight = startHeight + (endHeight - startHeight) * t;
    const arcHeight = parabolicSelectionLineConfig.parabolaPeakScale * t * (1 - t) * peak;
    return new THREE.Vector3(x, y, baseHeight + arcHeight);
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

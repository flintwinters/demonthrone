import * as THREE from "three";
import { configureViewCamera, createViewCamera, devicePixelRatio } from "./camera.js";
import { colors, terrainHeight } from "./constants.js";
import { material, transparentMaterial } from "./render-materials.js";
import { terrainLayer, terrainSignature } from "./terrain-layer.js";
import { visibleTiles } from "./tiles.js";
const unitGeometry = new THREE.SphereGeometry(0.24, 16, 10);
const enemyGeometry = new THREE.ConeGeometry(0.24, 0.5, 5);
const tombstoneGeometry = new THREE.SphereGeometry(0.15, 12, 8);
const state = {
    current: null,
};
unitGeometry.userData.shared = true;
enemyGeometry.userData.shared = true;
tombstoneGeometry.userData.shared = true;
export function drawGrid(canvas, boardState) {
    const renderState = initializeRenderer(canvas);
    const tiles = syncVisibleTiles(renderState, boardState);
    configureViewCamera(canvas, renderState.camera);
    syncTerrain(renderState, boardState, tiles);
    clearRoot(renderState.dynamicRoot);
    addTombstones(renderState, boardState.tombstones);
    addPlannedUnits(renderState, boardState.units);
    addEnemies(renderState, boardState.enemies);
    addUnits(renderState, boardState.units);
    renderState.renderer.render(renderState.scene, renderState.camera);
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
        visibleCache: null,
        terrainCache: null,
    };
    configureRendererSize(renderState.renderer, canvas);
    renderState.renderer.setClearColor(colors.background, 1);
    renderState.scene.add(renderState.root);
    renderState.root.add(renderState.dynamicRoot);
    renderState.scene.add(new THREE.HemisphereLight(colors.tileStroke, colors.background, 1.7));
    renderState.scene.add(directionalLight());
    state.current = renderState;
    return renderState;
}
function syncVisibleTiles(renderState, boardState) {
    const signature = visibilitySignature(boardState);
    if (renderState.visibleCache?.signature === signature) {
        return renderState.visibleCache.tiles;
    }
    const tiles = visibleTiles(boardState.units, boardState.sightBlockers, boardState.sightCost, boardState.tileHeight);
    renderState.visibleCache = { signature, tiles };
    return tiles;
}
function visibilitySignature(boardState) {
    return [
        tileListSignature(boardState.units),
        tileListSignature(boardState.sightBlockers),
    ].join("|");
}
function tileListSignature(tiles) {
    return tiles.map((tile) => `${tile.x}:${tile.y}`).join(";");
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
function addUnits(renderState, units) {
    for (const unit of units) {
        renderState.dynamicRoot.add(unitMesh(unit, 1));
    }
}
function addEnemies(renderState, enemies) {
    for (const enemy of enemies) {
        renderState.dynamicRoot.add(enemyMesh(enemy));
    }
}
function addTombstones(renderState, tombstones) {
    for (const tombstone of tombstones) {
        renderState.dynamicRoot.add(tombstoneMesh(tombstone));
    }
}
function addPlannedUnits(renderState, units) {
    for (const unit of units) {
        if (unit.target) {
            renderState.dynamicRoot.add(unitMeshAt(unit, unit.target, 0.42));
        }
    }
}
function unitMesh(unit, opacity) {
    return unitMeshAt(unit, unit, opacity);
}
function unitMeshAt(unit, tile, opacity) {
    const mesh = new THREE.Mesh(unitGeometry, unitMaterial(unit.color, opacity));
    mesh.position.set(tile.x + 0.5, tile.y + 0.5, visualHeight(tile.height) + 0.38);
    return mesh;
}
function enemyMesh(enemy) {
    const mesh = new THREE.Mesh(enemyGeometry, material(enemy.color));
    mesh.position.set(enemy.x + 0.5, enemy.y + 0.5, visualHeight(enemy.height) + 0.25);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
}
function tombstoneMesh(tombstone) {
    const mesh = new THREE.Mesh(tombstoneGeometry, material(colors.tombstone));
    mesh.position.set(tombstone.x + 0.5, tombstone.y + 0.5, visualHeight(tombstone.height) + 0.16);
    return mesh;
}
function unitMaterial(color, opacity) {
    return opacity < 1 ? transparentMaterial(color, opacity) : material(color);
}
function directionalLight() {
    const light = new THREE.DirectionalLight(colors.tileStroke, 2.2);
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

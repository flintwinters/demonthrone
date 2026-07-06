import * as THREE from "three";
import { configureViewCamera, createViewCamera } from "./camera.js";
import { colors, terrainHeight } from "./constants.js";
import { edgeMaterial, material, terrainMaterial } from "./render-materials.js";
import { visibleTiles } from "./tiles.js";
const state = {
    current: null,
};
export function drawGrid(canvas, boardState) {
    const tiles = visibleTiles(boardState.units, boardState.isObstacleTile);
    const renderState = initializeRenderer(canvas);
    configureViewCamera(canvas, renderState.camera);
    resetRoot(renderState);
    addTerrain(renderState, boardState, tiles);
    addObstacles(renderState, boardState, tiles);
    addMovePlans(renderState, boardState.units);
    addUnits(renderState, boardState.units, boardState.selectedUnitId);
    renderState.renderer.render(renderState.scene, renderState.camera);
}
function initializeRenderer(canvas) {
    if (state.current) {
        state.current.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
        return state.current;
    }
    const renderState = {
        renderer: new THREE.WebGLRenderer({ canvas, antialias: false }),
        scene: new THREE.Scene(),
        camera: createViewCamera(),
        root: new THREE.Group(),
    };
    renderState.renderer.setClearColor(colors.background, 1);
    renderState.scene.add(renderState.root);
    renderState.scene.add(new THREE.HemisphereLight(colors.tileStroke, colors.background, 1.7));
    renderState.scene.add(directionalLight());
    state.current = renderState;
    return renderState;
}
function resetRoot(renderState) {
    disposeGroup(renderState.root);
    renderState.scene.remove(renderState.root);
    renderState.root = new THREE.Group();
    renderState.scene.add(renderState.root);
}
function addTerrain(renderState, boardState, tiles) {
    for (const tile of tiles) {
        const height = boardState.tileHeight(tile);
        const style = tileStyle(tile, boardState);
        renderState.root.add(terrainColumn(tile, height, style));
    }
}
function addObstacles(renderState, boardState, tiles) {
    for (const tile of tiles) {
        if (boardState.isObstacleTile(tile)) {
            renderState.root.add(boulder(tile, boardState.tileHeight(tile)));
        }
    }
}
function addMovePlans(renderState, units) {
    for (const unit of units) {
        if (unit.target) {
            renderState.root.add(movePlan(unit, unit.target));
        }
    }
}
function addUnits(renderState, units, selectedUnitId) {
    for (const unit of units) {
        renderState.root.add(unitMesh(unit, unit.id === selectedUnitId));
    }
}
function terrainColumn(tile, height, style) {
    const depth = heightDepth(height);
    const geometry = new THREE.BoxGeometry(1, 1, depth);
    const mesh = new THREE.Mesh(geometry, columnMaterials(style));
    const group = new THREE.Group();
    mesh.position.set(tile.x + 0.5, tile.y + 0.5, height - depth / 2);
    group.add(mesh, columnEdges(mesh));
    return group;
}
function boulder(tile, height) {
    const geometry = new THREE.DodecahedronGeometry(0.34, 0);
    const mesh = new THREE.Mesh(geometry, material(colors.boulder));
    mesh.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
    mesh.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
    return mesh;
}
function movePlan(start, target) {
    const points = [
        new THREE.Vector3(start.x + 0.5, start.y + 0.5, start.height + 0.08),
        new THREE.Vector3(target.x + 0.5, target.y + 0.5, target.height + 0.08),
    ];
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: colors.moveLine }));
    return line;
}
function unitMesh(unit, isSelected) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.12, 16), material(isSelected ? colors.selectedTileStroke : colors.unitBase));
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10), material(unit.color));
    base.position.z = unit.height + 0.06;
    body.position.z = unit.height + 0.38;
    group.position.set(unit.x + 0.5, unit.y + 0.5, 0);
    group.add(base, body);
    return group;
}
function tileStyle(tile, boardState) {
    if (sameTile(boardState.selectedTile, tile)) {
        return { top: colors.selectedTile, side: colors.tileSideRight };
    }
    if (boardState.isMovementTile(tile)) {
        return { top: colors.movementTile, side: colors.movementTileSideRight };
    }
    return { top: colors.tile, side: colors.tileSideRight };
}
function columnMaterials(style) {
    const side = terrainMaterial(style.side);
    const top = terrainMaterial(style.top);
    return [side, side, side, side, top, terrainMaterial(colors.tileBottom)];
}
function columnEdges(mesh) {
    const geometry = new THREE.EdgesGeometry(mesh.geometry);
    const edges = new THREE.LineSegments(geometry, edgeMaterial);
    edges.position.copy(mesh.position);
    return edges;
}
function directionalLight() {
    const light = new THREE.DirectionalLight(colors.tileStroke, 2.2);
    light.position.set(-3, -4, 7);
    return light;
}
function heightDepth(height) {
    return Math.max(terrainHeight.step, height);
}
function sameTile(first, second) {
    return first?.x === second.x && first?.y === second.y;
}
function disposeGroup(group) {
    group.traverse((object) => {
        if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
        }
        if (object instanceof THREE.LineSegments) {
            object.geometry.dispose();
        }
    });
}

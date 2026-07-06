import * as THREE from "three";
import { configureViewCamera, createViewCamera, devicePixelRatio } from "./camera.js";
import { colors, terrainHeight } from "./constants.js";
import { material, transparentMaterial } from "./render-materials.js";
import { terrainSurface, tileKey } from "./terrain-mesh.js";
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
    addPlannedUnits(renderState, boardState.units);
    addUnits(renderState, boardState.units, boardState.selectedUnitId);
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
    };
    configureRendererSize(renderState.renderer, canvas);
    renderState.renderer.setClearColor(colors.background, 1);
    renderState.scene.add(renderState.root);
    renderState.scene.add(new THREE.HemisphereLight(colors.tileStroke, colors.background, 1.7));
    renderState.scene.add(directionalLight());
    state.current = renderState;
    return renderState;
}
function configureRendererSize(renderer, canvas) {
    renderer.setPixelRatio(devicePixelRatio());
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}
function resetRoot(renderState) {
    disposeGroup(renderState.root);
    renderState.scene.remove(renderState.root);
    renderState.root = new THREE.Group();
    renderState.scene.add(renderState.root);
}
function addTerrain(renderState, boardState, tiles) {
    const tileHeights = new Map(tiles.map((tile) => [tileKey(tile), visualHeight(boardState.tileHeight(tile))]));
    for (const tile of tiles) {
        const height = tileHeights.get(tileKey(tile)) ?? 0;
        const style = tileStyle(tile, boardState);
        renderState.root.add(terrainSurface(tile, height, style, tileHeights));
    }
}
function addObstacles(renderState, boardState, tiles) {
    for (const tile of tiles) {
        if (boardState.isObstacleTile(tile)) {
            renderState.root.add(boulder(tile, visualHeight(boardState.tileHeight(tile))));
        }
    }
}
function addUnits(renderState, units, selectedUnitId) {
    for (const unit of units) {
        renderState.root.add(unitMesh(unit, unit.id === selectedUnitId, 1));
    }
}
function addPlannedUnits(renderState, units) {
    for (const unit of units) {
        if (unit.target) {
            renderState.root.add(unitMesh(plannedUnit(unit, unit.target), false, 0.42));
        }
    }
}
function plannedUnit(unit, target) {
    return {
        ...unit,
        x: target.x,
        y: target.y,
        height: target.height,
    };
}
function boulder(tile, height) {
    const geometry = new THREE.DodecahedronGeometry(0.34, 0);
    const mesh = new THREE.Mesh(geometry, material(colors.boulder));
    mesh.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
    mesh.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
    return mesh;
}
function unitMesh(unit, isSelected, opacity) {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.12, 16), unitMaterial(isSelected ? colors.selectedTileStroke : colors.unitBase, opacity));
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10), unitMaterial(unit.color, opacity));
    base.position.z = visualHeight(unit.height) + 0.06;
    body.position.z = visualHeight(unit.height) + 0.38;
    group.position.set(unit.x + 0.5, unit.y + 0.5, 0);
    group.add(base, body);
    return group;
}
function unitMaterial(color, opacity) {
    return opacity < 1 ? transparentMaterial(color, opacity) : material(color);
}
function tileStyle(tile, boardState) {
    if (isPlannedMoveTarget(tile, boardState.units)) {
        return { top: colors.moveTarget, side: colors.movementTileSideRight };
    }
    if (isPlannedMoveStart(tile, boardState.units)) {
        return { top: colors.moveStart, side: colors.tileSideRight };
    }
    if (sameTile(boardState.selectedTile, tile)) {
        return { top: colors.selectedTile, side: colors.tileSideRight };
    }
    if (boardState.isMovementTile(tile)) {
        return movementTileStyle(tile, boardState);
    }
    if (sameTile(boardState.hoveredTile, tile)) {
        return { top: colors.hoveredTile, side: colors.tileSideRight };
    }
    return { top: colors.tile, side: colors.tileSideRight };
}
function movementTileStyle(tile, boardState) {
    return {
        top: sameTile(boardState.hoveredTile, tile) ? colors.hoveredMovementTile : colors.movementTile,
        side: colors.movementTileSideRight,
    };
}
function isPlannedMoveStart(tile, units) {
    return units.some((unit) => unit.target && sameTile(unit, tile));
}
function isPlannedMoveTarget(tile, units) {
    return units.some((unit) => unit.target && sameTile(unit.target, tile));
}
function directionalLight() {
    const light = new THREE.DirectionalLight(colors.tileStroke, 2.2);
    light.position.set(-3, -4, 7);
    return light;
}
function sameTile(first, second) {
    return first?.x === second.x && first?.y === second.y;
}
function visualHeight(height) {
    return height * terrainHeight.visualScale;
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

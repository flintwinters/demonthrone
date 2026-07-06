import * as THREE from "three";
import { configureViewCamera, createViewCamera } from "./camera.js";
import { colors, terrainHeight } from "./constants.js";
import { visibleTiles } from "./tiles.js";

const state = {
  renderer: null,
  scene: null,
  camera: null,
  root: null,
};
const materials = new Map();

export function drawGrid(canvas, boardState) {
  const tiles = visibleTiles(boardState.units, boardState.isObstacleTile);

  initializeRenderer(canvas);
  configureViewCamera(canvas, state.camera);
  resetRoot();
  addTerrain(boardState, tiles);
  addObstacles(boardState, tiles);
  addMovePlans(boardState.units);
  addUnits(boardState.units, boardState.selectedUnitId);
  state.renderer.render(state.scene, state.camera);
}

function initializeRenderer(canvas) {
  if (state.renderer) {
    state.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    return;
  }

  state.renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  state.renderer.setClearColor(colors.background, 1);
  state.scene = new THREE.Scene();
  state.camera = createViewCamera();
  state.root = new THREE.Group();
  state.scene.add(state.root);
  state.scene.add(new THREE.HemisphereLight(colors.tileStroke, colors.background, 1.7));
  state.scene.add(directionalLight());
}

function resetRoot() {
  disposeGroup(state.root);
  state.scene.remove(state.root);
  state.root = new THREE.Group();
  state.scene.add(state.root);
}

function addTerrain(boardState, tiles) {
  for (const tile of tiles) {
    const height = boardState.tileHeight(tile);
    const style = tileStyle(tile, boardState);

    state.root.add(terrainColumn(tile, height, style));
  }
}

function addObstacles(boardState, tiles) {
  for (const tile of tiles) {
    if (boardState.isObstacleTile(tile)) {
      state.root.add(boulder(tile, boardState.tileHeight(tile)));
    }
  }
}

function addMovePlans(units) {
  for (const unit of units) {
    if (unit.target) {
      state.root.add(movePlan(unit, unit.target));
    }
  }
}

function addUnits(units, selectedUnitId) {
  for (const unit of units) {
    state.root.add(unitMesh(unit, unit.id === selectedUnitId));
  }
}

function terrainColumn(tile, height, style) {
  const depth = heightDepth(height);
  const geometry = new THREE.BoxGeometry(1, 1, depth);
  const mesh = new THREE.Mesh(geometry, columnMaterials(style));

  mesh.position.set(tile.x + 0.5, tile.y + 0.5, height - depth / 2);
  return mesh;
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
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: colors.moveLine }),
  );

  return line;
}

function unitMesh(unit, isSelected) {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.38, 0.12, 16),
    material(isSelected ? colors.selectedTileStroke : colors.unitBase),
  );
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
  const side = material(style.side);
  const top = material(style.top);

  return [side, side, side, side, top, material(colors.tileBottom)];
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

function material(color) {
  if (!materials.has(color)) {
    materials.set(color, new THREE.MeshLambertMaterial({ color }));
  }

  return materials.get(color);
}

function disposeGroup(group) {
  group.traverse((object) => {
    object.geometry?.dispose();
  });
}

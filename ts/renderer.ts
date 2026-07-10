import * as THREE from "three";
import { configureViewCamera, createViewCamera, devicePixelRatio } from "./camera.js";
import { colors, terrainHeight } from "./constants.js";
import { tileKey } from "./grid.js";
import { material, transparentMaterial } from "./render-materials.js";
import { tileStyle } from "./terrain-style.js";
import { terrainSurface } from "./terrain-mesh.js";
import { boulder, brush } from "./terrain-props.js";
import { visibleTiles } from "./tiles.js";
import type { BoardState, HeightTile, RenderEnemy, RenderPiece, RenderTombstone, RenderUnit, Tile } from "./types.js";

type RenderState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  root: THREE.Group;
};

const state: { current: RenderState | null } = {
  current: null,
};

export function drawGrid(canvas: HTMLCanvasElement, boardState: BoardState): void {
  const tiles = visibleTiles(boardState.units, boardState.sightCost, boardState.tileHeight);
  const renderState = initializeRenderer(canvas);

  configureViewCamera(canvas, renderState.camera);
  resetRoot(renderState);
  addTerrain(renderState, boardState, tiles);
  addObstacles(renderState, boardState, tiles);
  addTombstones(renderState, boardState.tombstones);
  addPlannedUnits(renderState, boardState.units);
  addEnemies(renderState, boardState.enemies);
  addUnits(renderState, boardState.units, boardState.selectedUnitId);
  renderState.renderer.render(renderState.scene, renderState.camera);
}

function initializeRenderer(canvas: HTMLCanvasElement): RenderState {
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

function configureRendererSize(renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement): void {
  renderer.setPixelRatio(devicePixelRatio());
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}

function resetRoot(renderState: RenderState): void {
  disposeGroup(renderState.root);
  renderState.scene.remove(renderState.root);
  renderState.root = new THREE.Group();
  renderState.scene.add(renderState.root);
}

function addTerrain(renderState: RenderState, boardState: BoardState, tiles: Tile[]): void {
  const tileLevels = new Map(tiles.map((tile) => [tileKey(tile), boardState.tileHeight(tile)]));
  const tileHeights = new Map(tiles.map((tile) => [tileKey(tile), visualHeight(tileLevels.get(tileKey(tile)) ?? 0)]));

  for (const tile of tiles) {
    const level = tileLevels.get(tileKey(tile)) ?? 0;
    const height = tileHeights.get(tileKey(tile)) ?? 0;
    const style = tileStyle(tile, boardState, level);

    renderState.root.add(terrainSurface(tile, height, style, tileHeights));
  }
}

function addObstacles(renderState: RenderState, boardState: BoardState, tiles: Tile[]): void {
  for (const tile of tiles) {
    if (boardState.isObstacleTile(tile)) {
      renderState.root.add(boulder(tile, visualHeight(boardState.tileHeight(tile))));
    }

    if (boardState.isBrushTile(tile)) {
      renderState.root.add(brush(tile, visualHeight(boardState.tileHeight(tile))));
    }
  }
}

function addUnits(renderState: RenderState, units: RenderUnit[], selectedUnitId: string | null): void {
  for (const unit of units) {
    renderState.root.add(unitMesh(unit, unit.id === selectedUnitId, 1));
  }
}

function addEnemies(renderState: RenderState, enemies: RenderEnemy[]): void {
  for (const enemy of enemies) {
    renderState.root.add(enemyMesh(enemy));
  }
}

function addTombstones(renderState: RenderState, tombstones: RenderTombstone[]): void {
  for (const tombstone of tombstones) {
    renderState.root.add(tombstoneMesh(tombstone));
  }
}

function addPlannedUnits(renderState: RenderState, units: RenderUnit[]): void {
  for (const unit of units) {
    if (unit.target) {
      renderState.root.add(unitMesh(plannedUnit(unit, unit.target), false, 0.42));
    }
  }
}

function plannedUnit(unit: RenderUnit, target: HeightTile): RenderUnit {
  return {
    ...unit,
    x: target.x,
    y: target.y,
    height: target.height,
  };
}

function unitMesh(unit: RenderPiece, isSelected: boolean, opacity: number): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10), unitMaterial(unit.color, opacity));

  body.position.z = visualHeight(unit.height) + 0.38;
  group.position.set(unit.x + 0.5, unit.y + 0.5, 0);
  group.add(body);
  return group;
}

function enemyMesh(enemy: RenderEnemy): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.5, 5), material(enemy.color));

  mesh.position.set(enemy.x + 0.5, enemy.y + 0.5, visualHeight(enemy.height) + 0.25);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

function tombstoneMesh(tombstone: RenderTombstone): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), material(colors.tombstone));

  mesh.position.set(tombstone.x + 0.5, tombstone.y + 0.5, visualHeight(tombstone.height) + 0.16);
  return mesh;
}

function unitMaterial(color: string, opacity: number): THREE.MeshLambertMaterial {
  return opacity < 1 ? transparentMaterial(color, opacity) : material(color);
}

function directionalLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(colors.tileStroke, 2.2);

  light.position.set(-3, -4, 7);
  return light;
}

function visualHeight(height: number): number {
  return height * terrainHeight.visualScale;
}

function disposeGroup(group: THREE.Group): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
    }

    if (object instanceof THREE.LineSegments) {
      object.geometry.dispose();
    }
  });
}

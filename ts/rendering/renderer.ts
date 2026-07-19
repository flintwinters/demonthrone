import * as THREE from "three";
import {
  configureViewCamera,
  createViewCamera,
  devicePixelRatio,
} from "../controls/index.js";
import { enemyObjects, unitObjects } from "./character-render.js";
import { colors, terrainHeight } from "../constants.js";
import { material } from "./render-materials.js";
import { addSelectionVisuals } from "./selection-render.js";
import { pushableMeshes } from "./pushable-render.js";
import { terrainLayer, terrainSignature } from "./terrain-layer.js";
import type { BoardState, RenderPushable, RenderTombstone, Tile } from "../types.js";

type RenderState = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  root: THREE.Group;
  dynamicRoot: THREE.Group;
  terrainCache: TerrainCache | null;
};

type TerrainCache = {
  signature: string;
  group: THREE.Group;
};

const tombstoneGeometry = new THREE.SphereGeometry(0.15, 12, 8);
const hemisphereLightIntensity = 4.2;
const directionalLightIntensity = 3.5;
const state: { current: RenderState | null } = { current: null };

tombstoneGeometry.userData.shared = true;

export function drawGrid(canvas: HTMLCanvasElement, boardState: BoardState): void {
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

function addPushables(renderState: RenderState, pushables: RenderPushable[]): void {
  for (const pushable of pushables) {
    renderState.dynamicRoot.add(...pushableMeshes(pushable));
  }
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
    dynamicRoot: new THREE.Group(),
    terrainCache: null,
  };

  configureRendererSize(renderState.renderer, canvas);
  renderState.renderer.setClearColor(colors.background, 1);
  renderState.scene.add(renderState.root);
  renderState.root.add(renderState.dynamicRoot);
  renderState.scene.add(new THREE.HemisphereLight(
    colors.tileStroke, colors.background, hemisphereLightIntensity,
  ));
  renderState.scene.add(directionalLight());
  state.current = renderState;
  return renderState;
}

function configureRendererSize(renderer: THREE.WebGLRenderer, canvas: HTMLCanvasElement): void {
  renderer.setPixelRatio(devicePixelRatio());
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
}

function clearRoot(root: THREE.Group): void {
  disposeGroup(root);
  root.clear();
}

function syncTerrain(renderState: RenderState, boardState: BoardState, tiles: Tile[]): void {
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

function addTombstones(renderState: RenderState, tombstones: RenderTombstone[]): void {
  for (const tombstone of tombstones) {
    renderState.dynamicRoot.add(tombstoneMesh(tombstone));
  }
}

function tombstoneMesh(tombstone: RenderTombstone): THREE.Mesh {
  const mesh = new THREE.Mesh(tombstoneGeometry, material(colors.tombstone));

  mesh.position.set(tombstone.x + 0.5, tombstone.y + 0.5, visualHeight(tombstone.height) + 0.16);
  return mesh;
}

function directionalLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(colors.tileStroke, directionalLightIntensity);

  light.position.set(-3, -4, 7);
  return light;
}

function visualHeight(height: number): number {
  return height * terrainHeight.visualScale;
}

function disposeGroup(group: THREE.Group): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh && isDisposableGeometry(object.geometry)) {
      object.geometry.dispose();
    }

    if (object instanceof THREE.LineSegments && isDisposableGeometry(object.geometry)) {
      object.geometry.dispose();
    }
  });
}

function isDisposableGeometry(geometry: THREE.BufferGeometry): boolean {
  return geometry.userData.shared !== true;
}

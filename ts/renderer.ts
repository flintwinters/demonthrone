import * as THREE from "three";
import { configureViewCamera, createViewCamera } from "./camera.js";
import { colors, terrainHeight } from "./constants.js";
import { material } from "./render-materials.js";
import { terrainSurface, tileKey, type TerrainStyle } from "./terrain-mesh.js";
import { visibleTiles } from "./tiles.js";
import type { BoardState, HeightTile, RenderUnit, Tile } from "./types.js";

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

function initializeRenderer(canvas: HTMLCanvasElement): RenderState {
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

function resetRoot(renderState: RenderState): void {
  disposeGroup(renderState.root);
  renderState.scene.remove(renderState.root);
  renderState.root = new THREE.Group();
  renderState.scene.add(renderState.root);
}

function addTerrain(renderState: RenderState, boardState: BoardState, tiles: Tile[]): void {
  const tileHeights = new Map(tiles.map((tile) => [tileKey(tile), visualHeight(boardState.tileHeight(tile))]));

  for (const tile of tiles) {
    const height = tileHeights.get(tileKey(tile)) ?? 0;
    const style = tileStyle(tile, boardState);

    renderState.root.add(terrainSurface(tile, height, style, tileHeights));
  }
}

function addObstacles(renderState: RenderState, boardState: BoardState, tiles: Tile[]): void {
  for (const tile of tiles) {
    if (boardState.isObstacleTile(tile)) {
      renderState.root.add(boulder(tile, visualHeight(boardState.tileHeight(tile))));
    }
  }
}

function addMovePlans(renderState: RenderState, units: RenderUnit[]): void {
  for (const unit of units) {
    if (unit.target) {
      renderState.root.add(movePlan(unit, unit.target));
    }
  }
}

function addUnits(renderState: RenderState, units: RenderUnit[], selectedUnitId: string | null): void {
  for (const unit of units) {
    renderState.root.add(unitMesh(unit, unit.id === selectedUnitId));
  }
}

function boulder(tile: Tile, height: number): THREE.Mesh {
  const geometry = new THREE.DodecahedronGeometry(0.34, 0);
  const mesh = new THREE.Mesh(geometry, material(colors.boulder));

  mesh.position.set(tile.x + 0.5, tile.y + 0.5, height + 0.32);
  mesh.rotation.set(0.3, 0.1, tile.x * 0.7 + tile.y * 0.2);
  return mesh;
}

function movePlan(start: RenderUnit, target: HeightTile): THREE.Line {
  const points = [
    new THREE.Vector3(start.x + 0.5, start.y + 0.5, visualHeight(start.height) + 0.08),
    new THREE.Vector3(target.x + 0.5, target.y + 0.5, visualHeight(target.height) + 0.08),
  ];
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color: colors.moveLine }),
  );

  return line;
}

function unitMesh(unit: RenderUnit, isSelected: boolean): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.38, 0.12, 16),
    material(isSelected ? colors.selectedTileStroke : colors.unitBase),
  );
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 10), material(unit.color));

  base.position.z = visualHeight(unit.height) + 0.06;
  body.position.z = visualHeight(unit.height) + 0.38;
  group.position.set(unit.x + 0.5, unit.y + 0.5, 0);
  group.add(base, body);
  return group;
}

function tileStyle(tile: Tile, boardState: BoardState): TerrainStyle {
  if (sameTile(boardState.selectedTile, tile)) {
    return { top: colors.selectedTile, side: colors.tileSideRight };
  }

  if (boardState.isMovementTile(tile)) {
    return { top: colors.movementTile, side: colors.movementTileSideRight };
  }

  return { top: colors.tile, side: colors.tileSideRight };
}

function directionalLight(): THREE.DirectionalLight {
  const light = new THREE.DirectionalLight(colors.tileStroke, 2.2);

  light.position.set(-3, -4, 7);
  return light;
}

function sameTile(first: Tile | null, second: Tile): boolean {
  return first?.x === second.x && first?.y === second.y;
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

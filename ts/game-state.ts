import type { Enemy, HeightTile, Pushable, Tile, Unit } from "./types.js";

export type GameState = {
  units: Unit[];
  enemies: Enemy[];
  pushables: Pushable[];
  tombstones: Tile[];
  selection: { unitId: string | null };
  selectedTile: HeightTile | null;
  hoveredTile: HeightTile | null;
};

export function createGameState(
  units: Unit[],
  pushables: Pushable[],
  selection: GameState["selection"],
): GameState {
  return {
    units,
    enemies: [],
    pushables,
    tombstones: [],
    selection,
    selectedTile: null,
    hoveredTile: null,
  };
}

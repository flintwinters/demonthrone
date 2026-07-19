export function createGameState(units, pushables, selection) {
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

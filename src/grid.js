export const cardinalDirections = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
];
export function l1Distance(first, second) {
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}
export function neighborTile(tile, direction) {
    return {
        x: tile.x + direction.x,
        y: tile.y + direction.y,
    };
}
export function sameTile(first, second) {
    return first?.x === second?.x && first?.y === second?.y;
}
export function tileKey(tile) {
    return `${tile.x}:${tile.y}`;
}

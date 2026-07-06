export function l1Distance(first, second) {
    return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}
export function tileKey(tile) {
    return `${tile.x}:${tile.y}`;
}

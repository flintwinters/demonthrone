import { screenFromGrid, view } from "./camera.js";
import { terrainHeight } from "./constants.js";
import { piecePickerConfig } from "./world-config.js";
export function pickPieceTile(canvas, point, pieces, canSee, tileHeight) {
    let nearest = null;
    let nearestDistance = Math.max(piecePickerConfig.minimumPickRadius, piecePickerConfig.pickRadius * view.zoom);
    for (const piece of pieces) {
        const distance = screenDistance(point, pieceScreenPoint(canvas, piece, tileHeight));
        if (canSee(piece) && distance < nearestDistance) {
            nearest = piece;
            nearestDistance = distance;
        }
    }
    return nearest ? { x: nearest.x, y: nearest.y } : null;
}
function pieceScreenPoint(canvas, piece, tileHeight) {
    return screenFromGrid(canvas, piece.x + 0.5, piece.y + 0.5, tileHeight(piece) * terrainHeight.visualScale + piecePickerConfig.pieceHeight);
}
function screenDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
}

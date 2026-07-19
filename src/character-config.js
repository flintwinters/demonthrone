import { colors } from "./constants.js";
export const teammateConfigs = [
    teammate("vanguard", { x: 5, y: 7 }, colors.unitOne, 80, 2, 2, 5),
    teammate("warden", { x: 8, y: 6 }, colors.unitTwo, 18, 6, 8, 2),
    teammate("varmint", { x: 6, y: 8 }, colors.unitThree, 36, 20, 3, 3),
    teammate("marauder", { x: 7, y: 8 }, colors.unitThree, 128, 30, 3, 3),
];
export const enemyConfigs = [
    enemy("pursuer", colors.enemy, { shape: "cone", radius: 0.24, height: 0.5, labelHeight: 0.72 }, 5, 1, 2, 1, 1, 1),
    enemy("nephilim", colors.nephilim, { shape: "cylinder", radius: 0.22, height: 0.9, labelHeight: 1.1 }, 5, 1, 1, 8, 3, 3),
];
function teammate(id, spawn, color, sight, movement, attackRange, health) {
    return { id, type: id, infoText: id, spawn, color, stats: { sight, movement, attackRange, health } };
}
function enemy(type, color, appearance, sight, movement, attackRange, health, damage, movementInterval) {
    return {
        type,
        infoText: type,
        color,
        appearance,
        stats: { sight, movement, attackRange, health, damage, movementInterval },
    };
}

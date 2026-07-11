import { colors } from "./constants.js";
export const teammateConfigs = [
    teammate("vanguard", { x: 5, y: 7 }, colors.unitOne, 64, 2, 1, 5),
    teammate("warden", { x: 8, y: 6 }, colors.unitTwo, 18, 6, 3, 2),
    teammate("varmint", { x: 6, y: 8 }, colors.unitThree, 36, 4, 2, 3),
];
export const enemyConfig = {
    type: "pursuer",
    color: colors.enemy,
    stats: { sight: 5, movement: 1, attackRange: 1, health: 1 },
};
function teammate(id, spawn, color, sight, movement, attackRange, health) {
    return { id, type: id, spawn, color, stats: { sight, movement, attackRange, health } };
}

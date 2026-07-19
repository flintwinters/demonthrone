import { colors } from "./constants.js";
import type { CharacterStats, EnemyStats, EnemyType } from "./types.js";

export type TeammateConfig = {
  id: string;
  type: string;
  infoText: string;
  spawn: { x: number; y: number };
  color: string;
  stats: CharacterStats;
};

export const teammateConfigs: readonly TeammateConfig[] = [
  teammate("vanguard", { x: 5, y: 7 }, colors.unitOne,  80, 2, 2, 5),
  teammate("warden", { x: 8, y: 6 }, colors.unitTwo,    18, 6, 8, 2),
  teammate("varmint", { x: 6, y: 8 }, colors.unitThree, 36, 20, 3, 3),
  teammate("marauder", { x: 7, y: 8 }, colors.unitThree, 128, 30, 3, 3),
];

export type EnemyAppearance = {
  shape: "cone" | "cylinder";
  radius: number;
  height: number;
  labelHeight: number;
};
export type EnemyConfig = {
  type: EnemyType;
  infoText: string;
  color: string;
  stats: EnemyStats;
  appearance: EnemyAppearance;
};

export const enemyConfigs = [
  enemy("pursuer", colors.enemy, { shape: "cone", radius: 0.24, height: 0.5, labelHeight: 0.72 },
    5, 1, 2, 1, 1, 1),
  enemy("nephilim", colors.nephilim, { shape: "cylinder", radius: 0.22, height: 0.9, labelHeight: 1.1 },
    5, 1, 1, 8, 3, 3),
] satisfies readonly EnemyConfig[];

function teammate(
  id: string,
  spawn: { x: number; y: number },
  color: string,
  sight: number,
  movement: number,
  attackRange: number,
  health: number,
): TeammateConfig {
  return { id, type: id, infoText: id, spawn, color, stats: { sight, movement, attackRange, health } };
}

function enemy(
  type: EnemyType,
  color: string,
  appearance: EnemyAppearance,
  sight: number,
  movement: number,
  attackRange: number,
  health: number,
  damage: number,
  movementInterval: number,
): EnemyConfig {
  return {
    type,
    infoText: type,
    color,
    appearance,
    stats: { sight, movement, attackRange, health, damage, movementInterval },
  };
}

import { visibilityState } from "./visibility/index.js";
import { sightGeometry } from "./constants.js";
import { tileKey } from "./grid.js";
import { reachableTileKeys } from "./movement.js";
import { pushables } from "./pushables.js";
import { units } from "./units.js";
import { shadowcastTiles } from "./visibility/index.js";
import { sightContext } from "./visibility/index.js";
import { isBoulderTile, movementCost, tileHeight } from "./world/index.js";
import { lineOfSightConfig } from "./world-config.js";
import type { Character, Enemy, TilePredicate } from "./types.js";

export type ActionFields = { movement: Set<string>; attack: Set<string> };
export type MovementPolicy = { key: string; isBlocked: TilePredicate };

let cached: { signature: string; fields: ActionFields } | null = null;

export function actionFields(unit: Character, enemies: Enemy[], movementPolicy: MovementPolicy): ActionFields {
  const signature = actionFieldSignature(unit, enemies, movementPolicy.key);

  if (cached?.signature === signature) return cached.fields;
  const context = sightContext(
    visibilityState(enemies).blockers,
    () => 1,
    tileHeight,
    isBoulderTile,
    lineOfSightConfig.attackHeightMultiplier,
  );
  const movement = reachableTileKeys(
    unit, unit.movement, movementPolicy.isBlocked, tileHeight, movementCost,
  );
  const attack = new Set(shadowcastTiles(
    unit, unit.attackRange, context, sightGeometry.eyeHeight,
  ).map(tileKey));
  const fields = { movement, attack };

  cached = { signature, fields };
  return fields;
}

function actionFieldSignature(unit: Character, enemies: Enemy[], movementPolicyKey: string): string {
  return [
    movementPolicyKey, unit.id, unit.x, unit.y, unit.movement, unit.attackRange,
    ...[...units, ...enemies, ...pushables].map(entitySignature),
  ].join(";");
}

function entitySignature(entity: typeof units[number] | Enemy | typeof pushables[number]): string {
  const target = "target" in entity ? entity.target : null;

  return `${entity.id}:${entity.x}:${entity.y}:${target?.x ?? ""}:${target?.y ?? ""}`;
}

import { visibilityState } from "./visibility/index.js";
import { sightGeometry } from "./constants.js";
import { tileKey } from "./grid.js";
import type { GameState } from "./game-state.js";
import { reachableTileKeys } from "./movement.js";
import { shadowcastTiles } from "./visibility/index.js";
import { sightContext } from "./visibility/index.js";
import { isBoulderTile, movementCost, tileHeight } from "./world/index.js";
import { lineOfSightConfig } from "./world-config.js";
import type { Character, TilePredicate } from "./types.js";

export type ActionFields = { movement: Set<string>; attack: Set<string> };
export type MovementPolicy = { key: string; isBlocked: TilePredicate };

let cached: { signature: string; fields: ActionFields } | null = null;

export function actionFields(unit: Character, game: GameState, movementPolicy: MovementPolicy): ActionFields {
  const signature = actionFieldSignature(unit, game, movementPolicy.key);

  if (cached?.signature === signature) return cached.fields;
  const context = sightContext(
    visibilityState(game.units, game.enemies).blockers,
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

function actionFieldSignature(unit: Character, game: GameState, movementPolicyKey: string): string {
  return [
    movementPolicyKey, unit.id, unit.x, unit.y, unit.movement, unit.attackRange,
    ...[...game.units, ...game.enemies, ...game.pushables].map(entitySignature),
  ].join(";");
}

type StatefulEntity = GameState["units"][number]
  | GameState["enemies"][number]
  | GameState["pushables"][number];

function entitySignature(entity: StatefulEntity): string {
  const target = "target" in entity ? entity.target : null;

  return `${entity.id}:${entity.x}:${entity.y}:${target?.x ?? ""}:${target?.y ?? ""}`;
}

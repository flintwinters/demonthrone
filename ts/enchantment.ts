import { sameTile } from "./grid.js";
import { pushables } from "./pushables.js";
import type { Pushable, Tile, Unit } from "./types.js";

type Positioned = Tile & { id: string };

export function bindEnchantment(source: Pushable, target: Unit | Pushable, units: readonly Unit[]): Unit | null {
  const owner = enchantmentOwner(target, units);

  if (source.enchanterUnitId || source.id === target.id || !owner) {
    return null;
  }

  const displacedFollower = followerOf(target.id);

  source.followsId = target.id;
  source.enchanterUnitId = owner.id;
  if (displacedFollower) {
    displacedFollower.followsId = source.id;
  }
  return owner;
}

export function dispelEnchantment(source: Pushable, units: readonly Unit[]): Unit | null {
  const owner = units.find((unit) => unit.id === source.enchanterUnitId) ?? null;

  if (owner) {
    dispelChain(source.id);
  }
  return owner;
}

export function enchantmentOwner(target: Unit | Pushable, units: readonly Unit[]): Unit | null {
  if (isUnit(target, units)) {
    return target;
  }

  return units.find((unit) => unit.id === target.enchanterUnitId) ?? null;
}

function isUnit(target: Unit | Pushable, units: readonly Unit[]): target is Unit {
  return units.some((unit) => unit.id === target.id);
}

export function captureFollowerPositions(units: readonly Unit[]): Map<string, Tile> {
  return new Map([...units, ...pushables].map((item) => [item.id, { x: item.x, y: item.y }]));
}

export function followPositionHistory(units: readonly Unit[], previous: ReadonlyMap<string, Tile>): void {
  for (const unit of units) {
    followChain(unit, previous);
  }
}

function followChain(parent: Positioned, previous: ReadonlyMap<string, Tile>): void {
  const follower = pushables.find((pushable) => pushable.followsId === parent.id);
  const priorParent = previous.get(parent.id);

  if (!follower || !priorParent) {
    return;
  }

  if (!sameTile(parent, priorParent)) {
    follower.x = priorParent.x;
    follower.y = priorParent.y;
  }

  followChain(follower, previous);
}

function dispelChain(pushableId: string): void {
  const pushable = pushables.find((candidate) => candidate.id === pushableId);

  if (!pushable) {
    return;
  }

  const follower = followerOf(pushable.id);

  pushable.followsId = null;
  pushable.enchanterUnitId = null;

  if (follower) {
    dispelChain(follower.id);
  }
}

function followerOf(id: string): Pushable | null {
  return pushables.find((pushable) => pushable.followsId === id) ?? null;
}

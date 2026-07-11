import { bindEnchantment, dispelEnchantment, enchantmentOwner } from "./enchantment.js";
import { sameTile } from "./grid.js";
import { pushableAt, pushables } from "./pushables.js";
import { canTakeAction, spendAction } from "./teammate-turns.js";
import type { Pushable, Tile, Unit } from "./types.js";

export class EnchantmentSelection {
  private sourceId: string | null = null;

  source(): Pushable | null {
    return pushables.find((pushable) => pushable.id === this.sourceId) ?? null;
  }

  begin(tile: Tile): boolean {
    const source = pushableAt(tile);

    this.sourceId = source?.id ?? null;
    return source !== null;
  }

  resolve(tile: Tile, units: readonly Unit[]): boolean {
    const source = this.source();

    if (!source) {
      return false;
    }

    return sameTile(source, tile)
      ? this.resolveSource(source, units)
      : this.bindToTarget(source, tile, units);
  }

  canBindTo(tile: Tile, units: readonly Unit[]): boolean {
    const source = this.source();

    return source ? bindingOwner(source, tile, units) !== null : false;
  }

  clear(): void {
    this.sourceId = null;
  }

  private dispel(source: Pushable, units: readonly Unit[]): boolean {
    const owner = enchantmentOwner(source, units);

    if (!owner || !canTakeAction(owner)) {
      return false;
    }

    dispelEnchantment(source, units);
    spendAction(owner);
    this.sourceId = null;
    return true;
  }

  private resolveSource(source: Pushable, units: readonly Unit[]): boolean {
    return source.enchanterUnitId ? this.dispel(source, units) : this.cancel();
  }

  private bindToTarget(source: Pushable, tile: Tile, units: readonly Unit[]): boolean {
    const target = targetAt(tile, units);
    const owner = bindingOwner(source, tile, units);

    if (!target || !owner) {
      return false;
    }

    bindEnchantment(source, target, units);
    spendAction(owner);
    this.sourceId = null;
    return true;
  }

  private cancel(): boolean {
    this.sourceId = null;
    return true;
  }
}

function targetAt(tile: Tile, units: readonly Unit[]): Unit | Pushable | null {
  return units.find((unit) => sameTile(unit, tile)) ?? pushableAt(tile);
}

function bindingOwner(source: Pushable, tile: Tile, units: readonly Unit[]): Unit | null {
  const target = targetAt(tile, units);

  if (!target || source.id === target.id || source.enchanterUnitId) {
    return null;
  }

  const owner = enchantmentOwner(target, units);

  return owner && canTakeAction(owner) ? owner : null;
}

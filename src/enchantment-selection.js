import { bindEnchantment, dispelEnchantment, enchantmentOwner } from "./enchantment.js";
import { sameTile } from "./grid.js";
import { pushableAt, pushables } from "./pushables.js";
import { canTakeAction, spendAction } from "./teammate-turns.js";
export class EnchantmentSelection {
    sourceId = null;
    source() {
        return pushables.find((pushable) => pushable.id === this.sourceId) ?? null;
    }
    begin(tile) {
        const source = pushableAt(tile);
        this.sourceId = source?.id ?? null;
        return source !== null;
    }
    resolve(tile, units) {
        const source = this.source();
        if (!source) {
            return false;
        }
        return sameTile(source, tile)
            ? this.resolveSource(source, units)
            : this.bindToTarget(source, tile, units);
    }
    canBindTo(tile, units) {
        const source = this.source();
        return source ? bindingOwner(source, tile, units) !== null : false;
    }
    clear() {
        this.sourceId = null;
    }
    dispel(source, units) {
        const owner = enchantmentOwner(source, units);
        if (!owner || !canTakeAction(owner)) {
            return false;
        }
        dispelEnchantment(source, units);
        spendAction(owner);
        this.sourceId = null;
        return true;
    }
    resolveSource(source, units) {
        return source.enchanterUnitId ? this.dispel(source, units) : this.cancel();
    }
    bindToTarget(source, tile, units) {
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
    cancel() {
        this.sourceId = null;
        return true;
    }
}
function targetAt(tile, units) {
    return units.find((unit) => sameTile(unit, tile)) ?? pushableAt(tile);
}
function bindingOwner(source, tile, units) {
    const target = targetAt(tile, units);
    if (!target || source.id === target.id || source.enchanterUnitId) {
        return null;
    }
    const owner = enchantmentOwner(target, units);
    return owner && canTakeAction(owner) ? owner : null;
}

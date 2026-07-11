import { toggleEnchantment } from "./enchantment.js";
import { pushableAt } from "./pushables.js";
import { canTakeAction, spendAction } from "./teammate-turns.js";
export function connectEnchantmentControl(button, focusedTile, selectedUnit, redraw) {
    function toggle() {
        const unit = selectedUnit();
        const tile = focusedTile();
        if (unit && canTakeAction(unit) && tile && toggleEnchantment(tile, unit)) {
            spendAction(unit);
            redraw();
        }
    }
    function sync() {
        const tile = focusedTile();
        const unit = selectedUnit();
        const pushable = tile ? pushableAt(tile) : null;
        button.disabled = !unit || !canTakeAction(unit) || !pushable;
        button.setAttribute("aria-pressed", String(Boolean(unit && pushable?.enchanterUnitId === unit.id)));
    }
    function keyDown(event) {
        if (event.key.toLowerCase() === "e") {
            event.preventDefault();
            toggle();
        }
    }
    button.addEventListener("click", toggle);
    window.addEventListener("keydown", keyDown);
    return { sync };
}

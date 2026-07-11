import { toggleEnchantment } from "./enchantment.js";
import { pushableAt } from "./pushables.js";
import type { Tile, Unit } from "./types.js";

export type EnchantmentControl = {
  sync: () => void;
};

export function connectEnchantmentControl(
  button: HTMLButtonElement,
  focusedTile: () => Tile | null,
  selectedUnit: () => Unit | null,
  redraw: () => void,
): EnchantmentControl {
  function toggle(): void {
    const unit = selectedUnit();
    const tile = focusedTile();

    if (unit && tile && toggleEnchantment(tile, unit)) {
      redraw();
    }
  }

  function sync(): void {
    const tile = focusedTile();
    const unit = selectedUnit();
    const pushable = tile ? pushableAt(tile) : null;

    button.disabled = !unit || !pushable;
    button.setAttribute("aria-pressed", String(Boolean(unit && pushable?.enchanterUnitId === unit.id)));
  }

  function keyDown(event: KeyboardEvent): void {
    if (event.key.toLowerCase() === "e") {
      event.preventDefault();
      toggle();
    }
  }

  button.addEventListener("click", toggle);
  window.addEventListener("keydown", keyDown);
  return { sync };
}

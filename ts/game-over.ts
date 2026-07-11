import type { Tile, Unit } from "./types.js";

export class GameOverState {
  center: Tile | null = null;

  constructor(private readonly status: HTMLOutputElement) {}

  syncStatus(): void {
    this.status.hidden = this.center === null;
  }

  recordDefeated(defeated: Unit[], survivors: Unit[]): void {
    if (survivors.length > 0 || defeated.length === 0) return;
    const last = defeated.at(-1);

    this.center = last ? { x: last.x, y: last.y } : null;
  }
}

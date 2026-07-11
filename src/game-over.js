export class GameOverState {
    status;
    center = null;
    constructor(status) {
        this.status = status;
    }
    syncStatus() {
        this.status.hidden = this.center === null;
    }
    recordDefeated(defeated, survivors) {
        if (survivors.length > 0 || defeated.length === 0)
            return;
        const last = defeated.at(-1);
        this.center = last ? { x: last.x, y: last.y } : null;
    }
}

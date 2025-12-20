/**
 * Shared game time state that can be injected into systems
 */
export class GameTime {
    private _tick = 0;

    get tick(): number {
        return this._tick;
    }

    setTick(tick: number): void {
        this._tick = tick;
    }
}

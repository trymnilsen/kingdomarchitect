export interface GameTime {
    readonly tick: number;
}

export class MutableGameTime implements GameTime {
    private _currentTick: number = 0;

    public get tick(): number {
        return this._currentTick;
    }

    public updateTick(tick: number) {
        this._currentTick = tick;
    }
}

export class GameTime {
    private _startTick: number = 0;
    private _currentTick: number = 0;

    public get localTick(): number {
        return this._currentTick - this._startTick;
    }

    public get tick(): number {
        return this._currentTick;
    }
}

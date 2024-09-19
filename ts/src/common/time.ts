export class GameTime {
    private _tick: number = 0;

    public get tick(): number {
        return this._tick;
    }

    public set tick(v: number) {
        this._tick = v;
    }
}

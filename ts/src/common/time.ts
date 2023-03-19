export interface GameTime {
    /**
     * The current gametick
     */
    readonly tick: number;
    /**
     * The time of day represented as a number between 0.0 and 1.0
     * Dawn: 0.0 -> 0.25
     * Day: 0.25 -> 0.5
     * Dusk: 0.5 -> 0.75
     * Night: 0.75 -> 1.0
     */
    readonly fractionalTimeOfDay: number;

    readonly nextTimeOfDay: TimeOfDay[];
}

export enum TimeOfDay {
    Dawn,
    Day,
    Dusk,
    Night,
}

export class MutableGameTime implements GameTime {
    private _currentTick: number = 0;
    private _fractionalTimeOfDay: number = 0;
    private _nextTimeOfDay: TimeOfDay[] = [
        TimeOfDay.Dawn,
        TimeOfDay.Day,
        TimeOfDay.Dusk,
        TimeOfDay.Night,
    ];

    public get fractionalTimeOfDay(): number {
        return this._fractionalTimeOfDay;
    }

    public get nextTimeOfDay(): TimeOfDay[] {
        return this._nextTimeOfDay;
    }

    public get tick(): number {
        return this._currentTick;
    }

    public updateTick(tick: number) {
        this._currentTick = tick;
        this._fractionalTimeOfDay = (tick % 64) / 64;
        this._nextTimeOfDay = this.generateNextTimeOfDay();
    }

    private generateNextTimeOfDay(): TimeOfDay[] {
        const timeOfDayIndex = Math.floor(this.fractionalTimeOfDay * 4);
        return [
            timeOfDayIndex,
            (timeOfDayIndex + 1) % 4,
            (timeOfDayIndex + 2) % 4,
            (timeOfDayIndex + 3) % 4,
        ];
    }
}

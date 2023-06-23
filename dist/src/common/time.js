function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
export var TimeOfDay;
(function(TimeOfDay) {
    TimeOfDay[TimeOfDay["Dawn"] = 0] = "Dawn";
    TimeOfDay[TimeOfDay["Day"] = 1] = "Day";
    TimeOfDay[TimeOfDay["Dusk"] = 2] = "Dusk";
    TimeOfDay[TimeOfDay["Night"] = 3] = "Night";
})(TimeOfDay || (TimeOfDay = {}));
export class MutableGameTime {
    get fractionalTimeOfDay() {
        return this._fractionalTimeOfDay;
    }
    get nextTimeOfDay() {
        return this._nextTimeOfDay;
    }
    get tick() {
        return this._currentTick;
    }
    updateTick(tick) {
        this._currentTick = tick;
        this._fractionalTimeOfDay = tick % 64 / 64;
        this._nextTimeOfDay = this.generateNextTimeOfDay();
    }
    generateNextTimeOfDay() {
        const timeOfDayIndex = Math.floor(this.fractionalTimeOfDay * 4);
        return [
            timeOfDayIndex,
            (timeOfDayIndex + 1) % 4,
            (timeOfDayIndex + 2) % 4,
            (timeOfDayIndex + 3) % 4
        ];
    }
    constructor(){
        _define_property(this, "_currentTick", 0);
        _define_property(this, "_fractionalTimeOfDay", 0);
        _define_property(this, "_nextTimeOfDay", [
            TimeOfDay.Dawn,
            TimeOfDay.Day,
            TimeOfDay.Dusk,
            TimeOfDay.Night
        ]);
    }
}

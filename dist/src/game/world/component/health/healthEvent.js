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
import { ComponentEvent } from "../componentEvent.js";
export class HealthEvent extends ComponentEvent {
    constructor(oldHealth, newHealth, sourceComponent){
        super(sourceComponent);
        _define_property(this, "oldHealth", void 0);
        _define_property(this, "newHealth", void 0);
        this.oldHealth = oldHealth;
        this.newHealth = newHealth;
    }
}

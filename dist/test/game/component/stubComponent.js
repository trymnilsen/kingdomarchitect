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
import { EntityComponent } from "../../../src/game/world/component/entityComponent.js";
/**
 * A stub of a component for use with testing
 */ export class StubComponent extends EntityComponent {
    onStart(tick) {
        if (this.callbacks?.onStart) {
            this.callbacks.onStart();
        }
    }
    onStop(tick) {
        if (this.callbacks?.onStop) {
            this.callbacks.onStop();
        }
    }
    constructor(callbacks){
        super();
        _define_property(this, "callbacks", void 0);
        this.callbacks = callbacks;
    }
}

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
import { EntityComponent } from "../entityComponent.js";
export class TenantComponent extends EntityComponent {
    get house() {
        return this._house;
    }
    set house(v) {
        this._house = v;
    }
    constructor(...args){
        super(...args);
        _define_property(this, "_house", null);
    }
}

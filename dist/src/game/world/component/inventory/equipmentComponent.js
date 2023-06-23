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
export class EquipmentComponent extends EntityComponent {
    get mainItem() {
        return this._mainItem;
    }
    set mainItem(v) {
        // TODO: Drop current item when a new one is set
        this._mainItem = v;
    }
    get otherItem() {
        return this._otherItem;
    }
    set otherItem(v) {
        this._otherItem = v;
    }
    constructor(...args){
        super(...args);
        _define_property(this, "_mainItem", null);
        _define_property(this, "_otherItem", null);
    }
}

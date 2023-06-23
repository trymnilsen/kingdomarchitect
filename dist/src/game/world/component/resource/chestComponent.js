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
export class ChestComponent extends EntityComponent {
    constructor(items){
        super();
        _define_property(this, "items", void 0);
        this.items = items;
    }
}

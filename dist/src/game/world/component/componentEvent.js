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
export class ComponentEvent {
    constructor(sourceComponent){
        _define_property(this, "sourceComponent", void 0);
        this.sourceComponent = sourceComponent;
    }
}

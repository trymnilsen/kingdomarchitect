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
export class SelectedEntityItem {
    get tilePosition() {
        return this.entity.worldPosition;
    }
    get selectionSize() {
        return {
            x: 1,
            y: 1
        };
    }
    isSelectedItem(item) {
        return item === this;
    }
    constructor(entity){
        _define_property(this, "entity", void 0);
        this.entity = entity;
    }
}

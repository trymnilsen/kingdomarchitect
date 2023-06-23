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
export class GraphNode {
    get x() {
        return this._x;
    }
    get y() {
        return this._y;
    }
    get weight() {
        return this._weight;
    }
    get isWall() {
        return this.weight == 0;
    }
    clean() {
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.isDirty = false;
        this.visited = false;
        this.closed = false;
        this.parent = null;
    }
    constructor(x, y, weight){
        _define_property(this, "_x", void 0);
        _define_property(this, "_y", void 0);
        /**
     * A weight of 0 denotes a wall.
     * A weight cannot be negative.
     * A weight cannot be between 0 and 1 (exclusive).
     * A weight can contain decimal values (greater than 1).
     */ _define_property(this, "_weight", void 0);
        _define_property(this, "f", void 0);
        _define_property(this, "g", void 0);
        _define_property(this, "h", void 0);
        _define_property(this, "visited", void 0);
        _define_property(this, "closed", void 0);
        _define_property(this, "parent", void 0);
        _define_property(this, "isDirty", void 0);
        if (weight < 0 || weight > 0 && weight < 1) {
            console.warn(`Invalid weight for node`, {
                x,
                y,
                weight
            });
            weight = 0;
        }
        this.isDirty = false;
        this._weight = weight;
        this._x = x;
        this._y = y;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.visited = false;
        this.closed = false;
        this.parent = null;
    }
}

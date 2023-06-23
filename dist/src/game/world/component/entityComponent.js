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
export class EntityComponent {
    get entity() {
        if (!this._entity) {
            throw new Error("No entity available for component");
        }
        return this._entity;
    }
    set entity(value) {
        this._entity = value;
    }
    publishEvent(event) {
        if (!!this._entity) {
            this._entity.componentEvents.publish(event);
        } else {
            console.warn("No entity set, event is not published", this, event);
        }
    }
    /**
     * Called when the component is started, this is either
     * when its added to an entity that is attached or when the entity
     * the component is added on is added to an entity that is attached
     *
     * @param tick
     */ onStart(tick) {}
    /**
     * Called when the component is either removed from an entity or when
     * an entity this component is added to is removed from the entity-tree.
     *
     */ onStop(tick) {}
    onUpdate(tick) {}
    onDraw(context, screenPosition) {}
    constructor(){
        _define_property(this, "_entity", void 0);
    }
}

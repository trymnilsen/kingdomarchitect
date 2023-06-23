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
export class EntityInstanceJobConstraint {
    isEntityApplicableForJob(job, entity) {
        return entity === this.entity;
    }
    constructor(entity){
        _define_property(this, "entity", void 0);
        this.entity = entity;
    }
}

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
import { EntityInstanceJobConstraint } from "../../constraint/entityInstanceConstraint.js";
import { Job } from "../../job.js";
import { MoveToBeforeJob } from "../moveToBeforeJob.js";
export class AttackBuildingJob extends MoveToBeforeJob {
    constructor(entity, building){
        super(new _AttackBuilding(entity), new EntityInstanceJobConstraint(entity));
    }
}
class _AttackBuilding extends Job {
    get tileX() {
        return this.attackEntity.position.x;
    }
    get tileY() {
        return this.attackEntity.position.y;
    }
    update(tick) {
        this.complete();
    }
    constructor(entity){
        super();
        _define_property(this, "attackEntity", void 0);
        this.attackEntity = entity;
    }
}

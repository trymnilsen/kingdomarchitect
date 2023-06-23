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
import { BuildingComponent } from "../../component/building/buildingComponent.js";
import { HealthComponent } from "../../component/health/healthComponent.js";
import { WorkerConstraint } from "../constraint/workerConstraint.js";
import { Job } from "../job.js";
import { MoveToBeforeJob } from "./moveToBeforeJob.js";
export class BuildJob extends MoveToBeforeJob {
    constructor(buildingToBuild){
        super(new _BuildJob(buildingToBuild), new WorkerConstraint()); /*, isFarmerJobConstraint);*/ 
    }
}
class _BuildJob extends Job {
    get tileX() {
        return this.buildingEntity.worldPosition.x;
    }
    get tileY() {
        return this.buildingEntity.worldPosition.y;
    }
    update(tick) {
        const entity = this.entity;
        if (!entity) {
            throw new Error("No entity set for job");
        }
        const healthComponent = this.buildingEntity.getComponent(HealthComponent);
        if (!healthComponent) {
            throw new Error("No health component on building entity");
        }
        if (healthComponent.healthPercentage < 1) {
            healthComponent.heal(10);
        }
        if (healthComponent.healthPercentage >= 1) {
            this.buildingComponent.finishBuild();
            this.complete();
        }
    }
    constructor(building){
        super();
        _define_property(this, "buildingComponent", void 0);
        _define_property(this, "buildingEntity", void 0);
        this.buildingEntity = building;
        const buildingComponent = building.getComponent(BuildingComponent);
        if (!buildingComponent) {
            throw new Error("No building component on building entity");
        }
        this.buildingComponent = buildingComponent;
    }
}

import { BuildingComponent } from "../../building/buildingComponent.js";
import { HealthComponent } from "../../health/healthComponent.js";
import { Entity } from "../../../entity/entity.js";
import { WorkerConstraint } from "../constraint/workerConstraint.js";
import { Job } from "../job.js";
import { MoveToBeforeJob } from "./moveToBeforeJob.js";

export class BuildJob extends MoveToBeforeJob {
    constructor(buildingToBuild: Entity) {
        super(
            new _BuildJob(buildingToBuild),
            new WorkerConstraint()
        ); /*, isFarmerJobConstraint);*/
    }
}

class _BuildJob extends Job {
    private buildingComponent: BuildingComponent;
    private buildingEntity: Entity;
    get tileX(): number {
        return this.buildingEntity.worldPosition.x;
    }

    get tileY(): number {
        return this.buildingEntity.worldPosition.y;
    }

    constructor(building: Entity) {
        super();
        this.buildingEntity = building;
        const buildingComponent = building.getComponent(BuildingComponent);
        if (!buildingComponent) {
            throw new Error("No building component on building entity");
        }

        this.buildingComponent = buildingComponent;
    }

    update(tick: number): void {
        const entity = this.entity;
        if (!entity) {
            throw new Error("No entity set for job");
        }

        const healthComponent =
            this.buildingEntity.getComponent(HealthComponent);

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
}

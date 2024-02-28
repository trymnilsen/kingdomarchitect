import { Entity } from "../../../entity/entity.js";
import { BuildingComponent } from "../../building/buildingComponent.js";
import { assertEntityComponent } from "../../entityComponent.js";
import { HealthComponent } from "../../health/healthComponent.js";
import { MovementComponent } from "../../movement/movementComponent.js";
import { Job } from "../job.js";

export class BuildJob extends Job {
    constructor(
        private buildingComponent: BuildingComponent,
        private healthComponent: HealthComponent,
    ) {
        super();
    }

    update(): void {
        const target = this.buildingComponent.entity.worldPosition;
        if (this.adjacentTo(target)) {
            if (this.healthComponent.healthPercentage < 1) {
                this.healthComponent.heal(10);
            }
            if (this.healthComponent.healthPercentage >= 1) {
                this.buildingComponent.finishBuild();
                this.complete();
            }
        } else {
            const movementComponent =
                this.entity.requireComponent(MovementComponent);

            movementComponent.pathTo(target);
        }
    }
}

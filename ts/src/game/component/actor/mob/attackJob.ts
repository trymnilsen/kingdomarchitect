import { Entity } from "../../../entity/entity.js";
import { HealthComponent } from "../../health/healthComponent.js";
import { Job } from "../../job/job.js";
import { MovementComponent } from "../../movement/movementComponent.js";

export class AttackJob extends Job {
    constructor(
        private target: Entity,
        private damage: number,
    ) {
        super();
    }

    override update(): void {
        if (!this.target) {
            console.warn(
                "No entity set for job, completing",
                this.target,
                this,
            );
            this.complete();
            return;
        }

        const targetHealthComponent =
            this.target.requireComponent(HealthComponent);

        if (targetHealthComponent?.health === 0) {
            this.complete();
            return;
        }

        if (this.adjacentTo(this.target.worldPosition)) {
            targetHealthComponent?.damage(this.damage, this.entity);
        } else {
            const movementComponent =
                this.entity.getComponent(MovementComponent);

            if (!movementComponent) {
                this.complete();
                return;
            }

            movementComponent.pathTo(this.target.worldPosition);
        }
    }
}

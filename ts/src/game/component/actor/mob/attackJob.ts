import { isPointAdjacentTo } from "../../../../common/point.js";
import { Entity } from "../../../entity/entity.js";
import { HealthComponent } from "../../health/healthComponent.js";
import { Job } from "../../job/job.js";

export class AttackJob extends Job {
    constructor(private target: Entity, private amount: number) {
        super();
    }

    override update(tick: number): void {
        const targetHealthComponent = this.target.getComponent(HealthComponent);
        if (targetHealthComponent?.health === 0) {
            this.complete();
            return;
        }

        if (
            isPointAdjacentTo(
                this.entity.worldPosition,
                this.target.worldPosition
            )
        ) {
            if (!!targetHealthComponent) {
                targetHealthComponent?.damage(this.amount, this.entity);
            } else {
                console.error(
                    "Cannot attack entity without a health component, completing job"
                );
                this.complete();
            }
        } else {
            //TODO: We should follow the entity?
        }
    }
}

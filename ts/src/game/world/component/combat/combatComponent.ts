import { randomEntry } from "../../../../common/array.js";
import { adjacentPoints } from "../../../../common/point.js";
import { Entity } from "../../entity/entity.js";
import { RootEntity } from "../../entity/rootEntity.js";
import { AttackJob } from "../../job/jobs/attack/attackJob.js";
import { EntityComponent } from "../entityComponent.js";
import { HealthComponent } from "../health/healthComponent.js";
import { JobRunnerComponent } from "../job/jobRunnerComponent.js";

export class CombatComponent extends EntityComponent {
    private currentTarget: Entity | null = null;
    override onUpdate(tick: number): void {
        if (this.currentTarget === null) {
            const target = this.findNewTarget();
            const jobRunner = this.entity.getComponent(JobRunnerComponent);
            if (!!jobRunner) {
                const attackJob = new AttackJob();
                jobRunner.assignJob(attackJob);
            }
        }
    }

    private findNewTarget(): Entity | null {
        const adjacentPositions = adjacentPoints(this.entity.worldPosition);
        const rootEntity = this.entity.getRootEntity() as RootEntity;
        const aggroableEntities = adjacentPositions.flatMap((point) => {
            return rootEntity.getEntityAt(point).filter((entity) => {
                return entity.getComponent(HealthComponent);
            });
        });

        if (aggroableEntities.length > 0) {
            const randomEntity = randomEntry(aggroableEntities);
            this.currentTarget = randomEntity;
            return randomEntity;
        } else {
            return null;
        }
    }
}

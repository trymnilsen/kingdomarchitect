import { checkAdjacency } from "../../common/point.js";
import { damage, HealthComponentId } from "../component/healthComponent.js";
import { completeJob, type Job, type JobHandler } from "./job.js";
import { doMovement, MovementResult } from "./movementHelper.js";

export interface AttackJob extends Job {
    id: typeof AttackJobId;
    target: string;
    attacker: string;
}

export function AttackJob(attacker: string, target: string): AttackJob {
    return {
        id: AttackJobId,
        target: target,
        attacker: attacker,
    };
}

export const AttackJobId = "attackJob";

export const attackHandler: JobHandler<AttackJob> = (root, runner, job) => {
    const targetEntity = root.findEntity(job.target);

    if (runner.id !== job.attacker) {
        console.error(
            "Attacker and runner id not matching",
            runner.id,
            job.attacker,
        );
        completeJob(runner);
        return;
    }
    if (!targetEntity) {
        console.error("Target not a valid entity");
        completeJob(runner);
        return;
    }

    if (
        checkAdjacency(targetEntity.worldPosition, runner.worldPosition) ===
        null
    ) {
        const movement = doMovement(runner, targetEntity.worldPosition);
        if (movement == MovementResult.Failure) {
            console.log("Failed to move");
            completeJob(runner);
        }
    } else {
        const healthComponent = targetEntity.getEcsComponent(HealthComponentId);
        if (!healthComponent) {
            console.log("target had no health component");
            completeJob(runner);
            return;
        }

        damage(healthComponent, 1);
        targetEntity.invalidateComponent(HealthComponentId);

        if (healthComponent.currentHp === 0) {
            completeJob(runner);
        }
    }
};

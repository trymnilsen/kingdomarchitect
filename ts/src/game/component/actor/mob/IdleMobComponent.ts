import { ComponentFactory, EntityComponent } from "../../entityComponent.js";
import { JobRunnerComponent } from "../../job/jobRunnerComponent.js";
import { LookForFoodJob } from "./LookForFoodJob.js";

export class IdleMobComponent extends EntityComponent {
    override factory(): ComponentFactory {
        return () => new IdleMobComponent();
    }
    override onUpdate(tick: number): void {
        const jobRunner = this.entity.requireComponent(JobRunnerComponent);
        if (!jobRunner.activeJob) {
            jobRunner.assignJob(new LookForFoodJob());
        }
    }
}

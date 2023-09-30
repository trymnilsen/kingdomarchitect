import { StatelessComponent } from "../../entityComponent.js";
import { JobRunnerComponent } from "../../job/jobRunnerComponent.js";
import { LookForFoodJob } from "./LookForFoodJob.js";

export class IdleMobComponent extends StatelessComponent {
    override onUpdate(): void {
        const jobRunner = this.entity.requireComponent(JobRunnerComponent);
        if (!jobRunner.activeJob) {
            jobRunner.assignJob(new LookForFoodJob());
        }
    }
}

import { EcsComponent } from "../../../ecs/ecsComponent.js";
import { Job } from "./job.js";

export class JobComponent extends EcsComponent {
    jobs: Job[] = [];
}

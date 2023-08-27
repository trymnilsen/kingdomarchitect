import { ComponentEvent } from "../componentEvent.js";
import { Job } from "./job.js";
import { JobQueueComponent } from "./jobQueueComponent.js";

export class JobAddedEvent extends ComponentEvent<JobQueueComponent> {
    constructor(public job: Job, sourceComponent: JobQueueComponent) {
        super(sourceComponent);
    }
}

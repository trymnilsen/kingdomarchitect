import type { JSONValue } from "../../common/object.js";
import { Point } from "../../common/point.js";
import type { Job } from "../job/job.js";

export class JobRunnerComponent {
    currentJob: Job | null = null;
}

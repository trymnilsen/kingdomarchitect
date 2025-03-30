import { Point } from "../../common/point.js";

interface Job {
    id: string;
}

interface MoveToJob extends Job {
    position: Point;
}

export class JobRunnerComponent {
    currentJob: MoveToJob | null = null;
}

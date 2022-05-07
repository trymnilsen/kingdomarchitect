import { Point } from "../../../common/point";
import { Job } from "../job/job";

export class MoveToJob extends Job {
    private path: Point[];
    constructor(path: Point[]) {
        super();
        this.path = path.reverse();
    }
    update(tick: number): void {
        const newPosition = this.path.pop();
        if (newPosition) {
            this.actor.tilePosition.x = newPosition.x;
            this.actor.tilePosition.y = newPosition.y;
        } else {
            console.log("Move to job finished");
            this.complete();
        }
    }
}

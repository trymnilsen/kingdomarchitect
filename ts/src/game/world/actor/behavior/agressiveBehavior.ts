import { Job } from "../job/job";
import { Behavior, UpdateContext } from "./behavior";

export class AgressiveBehavior implements Behavior {
    getIdleJob(): Job | null {
        throw new Error("Method not implemented.");
    }
    update(tick: number, updateContext: UpdateContext): void {
        throw new Error("Method not implemented.");
    }
}

import type { EntityAction } from "../../../../module/action/entityAction.js";
import { JobRunnerComponentId } from "../../../component/jobRunnerComponent.js";
import type { Entity } from "../../../entity/entity.js";
import type { QueueJobAction } from "../../job/queueJobAction.js";

export function actorDispatcher(action: EntityAction, root: Entity) {
    const actionId = action.id[1];
    switch (actionId) {
        case "queueJob":
            const queueAction = action as QueueJobAction;
            const entity = root.findEntity(queueAction.entityId);
            const jobRunner = entity?.getEcsComponent(JobRunnerComponentId);
            if (!!entity && !!jobRunner) {
                jobRunner.currentJob = queueAction.job;
            }

            break;
        default:
            break;
    }
}

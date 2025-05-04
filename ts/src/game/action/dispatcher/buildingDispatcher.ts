import type { EntityAction } from "../../../module/action/entityAction.js";
import { JobRunnerComponentId } from "../../component/jobRunnerComponent.js";
import type { Entity } from "../../entity/entity.js";
import { buildingPrefab } from "../../prefab/buildingPrefab.js";
import type { QueueJobAction } from "../job/queueJobAction.js";
import type { BuildBuildingAction } from "../world/buildingAction.js";

export function buildingDispatcher(action: EntityAction, root: Entity) {
    const actionId = action.id[1];
    switch (actionId) {
        case "build":
            const buildAction = action as BuildBuildingAction;
            const buldingEntity = buildingPrefab(buildAction.building, true);
            buldingEntity.worldPosition = buildAction.position;
            root.addChild(buldingEntity);
            const jobQueue = root.requireEcsComponent("JobQueue");
            jobQueue.jobs.push({
                id: "buildBuildingJob",
                entityId: buldingEntity.id,
            });
            root.invalidateComponent("JobQueue");
            break;
        default:
            break;
    }
}

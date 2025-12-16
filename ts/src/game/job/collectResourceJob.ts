import { checkAdjacency } from "../../common/point.js";
import { ResourceComponentId } from "../component/resourceComponent.js";
import { damage, HealthComponentId } from "../component/healthComponent.js";
import type { Entity } from "../entity/entity.js";
import { completeJob, type Job, type JobHandler } from "./job.js";
import { doMovement, MovementResult } from "./movementHelper.js";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../component/inventoryComponent.js";
import { treeResource } from "../../data/inventory/items/naturalResource.js";
import { woodResourceItem } from "../../data/inventory/items/resources.js";

export interface CollectResourceJob extends Job {
    id: typeof CollectResourceJobId;
    entityId: string;
}

export function CollectResourceJob(entity: Entity): CollectResourceJob {
    return {
        id: CollectResourceJobId,
        entityId: entity.id,
    };
}

export const CollectResourceJobId = "chopTreeJob";

export const collectResourceHandler: JobHandler<CollectResourceJob> = (
    _scene,
    root,
    runner,
    job,
) => {
    const treeEntity = root.findEntity(job.entityId);

    if (!treeEntity) {
        console.error(`Unable to find tree entity with id ${job.entityId}`);
        completeJob(runner);
        return;
    }

    const resourceComponent = treeEntity.getEcsComponent(ResourceComponentId);
    if (!resourceComponent) {
        console.error(`No resource component on entity ${job.entityId}`);
        completeJob(runner);
        return;
    }

    // Check if we're adjacent to the tree
    if (
        checkAdjacency(treeEntity.worldPosition, runner.worldPosition) === null
    ) {
        // Not adjacent, move towards the tree
        const movement = doMovement(runner, treeEntity.worldPosition);
        if (movement == MovementResult.Failure) {
            console.log("Failed to move to tree");
            completeJob(runner);
        }
    } else {
        // Adjacent to the tree, chop it
        const healthComponent = treeEntity.getEcsComponent(HealthComponentId);
        if (!healthComponent) {
            console.log("Tree had no health component");
            completeJob(runner);
            return;
        }

        // Deal damage to the tree
        damage(healthComponent, 10);
        treeEntity.invalidateComponent(HealthComponentId);

        // If tree is destroyed, complete the job
        if (healthComponent.currentHp <= 0) {
            completeJob(runner);
            treeEntity.remove();
            runner.updateComponent(InventoryComponentId, (inventory) => {
                addInventoryItem(inventory, woodResourceItem, 4);
            });
        }
    }
};

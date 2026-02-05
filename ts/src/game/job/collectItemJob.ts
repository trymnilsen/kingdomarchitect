import { checkAdjacency } from "../../common/point.ts";
import type { Entity } from "../entity/entity.ts";
import { completeJob, type Job, type JobHandler } from "./job.ts";
import { doMovement, MovementResult } from "./movementHelper.ts";
import {
    addInventoryItem,
    InventoryComponentId,
} from "../component/inventoryComponent.ts";
import {
    CollectableComponentId,
    collectAllItems,
} from "../component/collectableComponent.ts";

export interface CollectItemJob extends Job {
    id: typeof CollectItemJobId;
    /** Entity ID of the building/entity with CollectableComponent */
    entityId: string;
}

export function CollectItemJob(entity: Entity): CollectItemJob {
    return {
        id: CollectItemJobId,
        state: "pending",
        entityId: entity.id,
    };
}

export const CollectItemJobId = "collectItem";

export const collectItemHandler: JobHandler<CollectItemJob> = (
    root,
    runner,
    job,
    _tick,
) => {
    const targetEntity = root.findEntity(job.entityId);

    if (!targetEntity) {
        console.error(
            `Unable to find entity with id ${job.entityId} for item collection`,
        );
        completeJob(runner, root);
        return;
    }

    const collectableComponent = targetEntity.getEcsComponent(
        CollectableComponentId,
    );
    if (!collectableComponent) {
        console.error(`No collectable component on entity ${job.entityId}`);
        completeJob(runner, root);
        return;
    }

    // Check if there are items to collect
    if (collectableComponent.items.length === 0) {
        console.log("No items to collect");
        completeJob(runner, root);
        return;
    }

    // Check if we're adjacent to the target
    if (
        checkAdjacency(targetEntity.worldPosition, runner.worldPosition) ===
        null
    ) {
        // Not adjacent, move towards the target
        const movement = doMovement(runner, targetEntity.worldPosition);
        if (movement === MovementResult.Failure) {
            console.log("Failed to move to target for item collection");
            completeJob(runner, root);
        }
    } else {
        // Adjacent to the target, collect all items
        const items = collectAllItems(collectableComponent);

        // Add items to worker's inventory
        runner.updateComponent(InventoryComponentId, (inventory) => {
            for (const itemQuantity of items) {
                addInventoryItem(
                    inventory,
                    itemQuantity.item,
                    itemQuantity.amount,
                );
            }
        });

        // Mark component as updated
        targetEntity.invalidateComponent(CollectableComponentId);

        // Complete the job
        completeJob(runner, root);
    }
};

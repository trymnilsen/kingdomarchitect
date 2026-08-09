import type { Entity } from "../entity/entity.ts";
import type { Job } from "./job.ts";

export interface CollectItemJob extends Job {
    id: typeof CollectItemJobId;
    /** Entity ID of the building/entity with CollectableComponent */
    entityId: string;
    /**
     * Which of that entity's stacks this job is for.
     *
     * A worker's held slot takes one item type per trip, so a collectable
     * holding several types is several hauls. The entity alone therefore stops
     * naming the work, and the job's address grows a coordinate. Deciding the
     * type here rather than at execution time is what keeps a two-output
     * building from hauling one type and stranding the other.
     */
    itemId: string;
}

export function CollectItemJob(entity: Entity, itemId: string): CollectItemJob {
    return {
        id: CollectItemJobId,
        entityId: entity.id,
        itemId,
    };
}

export const CollectItemJobId = "collectItem";

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
     * holding several types is several hauls and the entity alone no longer
     * names the work. Naming the type when the job is queued, rather than when
     * it runs, keeps a two-output building from hauling one type forever and
     * stranding the other.
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

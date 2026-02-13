import type { Entity } from "../entity/entity.ts";
import type { Job } from "./job.ts";

export interface CollectItemJob extends Job {
    id: typeof CollectItemJobId;
    /** Entity ID of the building/entity with CollectableComponent */
    entityId: string;
}

export function CollectItemJob(entity: Entity): CollectItemJob {
    return {
        id: CollectItemJobId,
        entityId: entity.id,
    };
}

export const CollectItemJobId = "collectItem";

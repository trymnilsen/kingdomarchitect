import type { Entity } from "../entity/entity.ts";
import type { Job } from "./job.ts";
import { ResourceHarvestMode } from "../../data/inventory/items/naturalResource.ts";

export interface CollectResourceJob extends Job {
    id: typeof CollectResourceJobId;
    entityId: string;
    harvestAction: ResourceHarvestMode;
}

export function CollectResourceJob(
    entity: Entity,
    harvestAction: ResourceHarvestMode,
): CollectResourceJob {
    return {
        id: CollectResourceJobId,
        entityId: entity.id,
        harvestAction,
    };
}

export const CollectResourceJobId = "collectResource";

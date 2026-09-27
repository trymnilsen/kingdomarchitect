import { spriteRefs } from "../../../asset/sprite.ts";
import { BuildingComponentId } from "../../component/buildingComponent.ts";
import { damage, HealthComponentId } from "../../component/healthComponent.ts";
import { SpriteComponentId } from "../../component/spriteComponent.ts";
import type { Entity } from "../../entity/entity.ts";
import { finishDismantle } from "../../job/dismantleBuildingJob.ts";
import { completeClaimedJob } from "../../job/jobLifecycle.ts";
import { ActionComplete, ActionRunning, type ActionResult } from "./action.ts";

export type DismantleBuildingActionData = {
    type: "dismantleBuilding";
    entityId: string;
};

/**
 * Dismantle a building by draining its HealthComponent, the reverse of
 * constructBuildingAction. Complete when hp <= 0, at which point finishDismantle
 * scatters materials, evicts occupants, clears jobs, and removes the entity.
 */
export function executeDismantleBuildingAction(
    action: DismantleBuildingActionData,
    entity: Entity,
    tick: number,
): ActionResult {
    const root = entity.getRootEntity();
    const buildingEntity = root.findEntity(action.entityId);

    if (!buildingEntity) {
        // Already removed (e.g. cancelled out from under us), so replan.
        return {
            kind: "failed",
            cause: { type: "targetGone", entityId: action.entityId },
        };
    }

    const buildingComponent =
        buildingEntity.requireEcsComponent(BuildingComponentId);
    const healthComponent =
        buildingEntity.requireEcsComponent(HealthComponentId);

    // Show the building as a scaffold while it is being torn down. A scaffold
    // being dismantled already shows that sprite, so only completed buildings
    // need the swap.
    if (!buildingComponent.scaffolded) {
        const spriteComponent =
            buildingEntity.getEcsComponent(SpriteComponentId);
        if (
            spriteComponent &&
            spriteComponent.sprite !== spriteRefs.wooden_house_scaffold
        ) {
            spriteComponent.sprite = spriteRefs.wooden_house_scaffold;
            buildingEntity.invalidateComponent(SpriteComponentId);
        }
    }

    damage(healthComponent, 10);
    buildingEntity.invalidateComponent(HealthComponentId);

    if (healthComponent.currentHp <= 0) {
        finishDismantle(root, tick, buildingEntity);
        completeClaimedJob(entity);
        return ActionComplete;
    }

    return ActionRunning;
}

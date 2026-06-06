import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import { FarmComponentId, FarmState } from "../component/farmComponent.ts";
import { getCropDefinition } from "../../data/crop/cropDefinitions.ts";

export const farmGrowthSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, currentTick: number): void {
    const farms = root.queryComponents(FarmComponentId);

    for (const [entity, farm] of farms) {
        const growthDuration = getCropDefinition(farm.cropId).growthDuration;
        if (
            farm.state === FarmState.Growing &&
            currentTick - farm.plantedAtTick >= growthDuration
        ) {
            farm.state = FarmState.Ready;
            entity.invalidateComponent(FarmComponentId);
        }
    }
}

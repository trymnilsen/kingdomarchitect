import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import { FarmComponentId, FarmState } from "../component/farmComponent.ts";

export const farmGrowthSystem: EcsSystem = {
    onUpdate: update,
};

function update(root: Entity, currentTick: number): void {
    const farms = root.queryComponents(FarmComponentId);

    for (const [entity, farm] of farms) {
        if (
            farm.state === FarmState.Growing &&
            currentTick - farm.plantedAtTick >= farm.growthDuration
        ) {
            farm.state = FarmState.Ready;
            entity.invalidateComponent(FarmComponentId);
        }
    }
}

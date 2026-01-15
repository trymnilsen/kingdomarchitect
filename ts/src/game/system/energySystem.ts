import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import {
    EnergyComponentId,
    decreaseEnergy,
    type EnergyComponent,
} from "../component/energyComponent.ts";

/**
 * System that decreases energy for all entities with an EnergyComponent.
 * Energy decreases by energyRate per tick (simulation runs at 1 Hz).
 */
export const energySystem: EcsSystem = {
    onUpdate: (root: Entity, _tick: number) => {
        const entitiesWithEnergy = root.queryComponents(EnergyComponentId);

        for (const [_entity, energyComponent] of entitiesWithEnergy) {
            decreaseEnergy(energyComponent, energyComponent.energyRate);
        }
    },
};

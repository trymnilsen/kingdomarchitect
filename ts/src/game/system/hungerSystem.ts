import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import type { Entity } from "../entity/entity.ts";
import {
    HungerComponentId,
    increaseHunger,
    type HungerComponent,
} from "../component/hungerComponent.ts";

/**
 * System that increases hunger for all entities with a HungerComponent.
 * Hunger increases by hungerRate per tick (simulation runs at 1 Hz).
 */
export const hungerSystem: EcsSystem = {
    onUpdate: (root: Entity, _tick: number) => {
        const entitiesWithHunger = root.queryComponents(HungerComponentId);

        for (const [_entity, hungerComponent] of entitiesWithHunger) {
            increaseHunger(hungerComponent, hungerComponent.hungerRate);
        }
    },
};

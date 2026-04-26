import type { EcsSystem } from "../../common/ecs/ecsSystem.ts";
import { DespawnTimerComponentId } from "../component/despawnTimerComponent.ts";
import type { Entity } from "../entity/entity.ts";

export const despawnTimerSystem: EcsSystem = {
    onUpdate: (root, tick) => {
        const expired: Entity[] = [];
        const timers = root.queryComponents(DespawnTimerComponentId);
        for (const [entity, timer] of timers) {
            if (tick - timer.spawnTime >= timer.duration) {
                expired.push(entity);
            }
        }
        for (const entity of expired) {
            entity.remove();
        }
    },
};

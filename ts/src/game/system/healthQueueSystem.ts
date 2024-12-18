import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createHealthQueueSystem(): EcsSystem {
    return createSystem().build();
}

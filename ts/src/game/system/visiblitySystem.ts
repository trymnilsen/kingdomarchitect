import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createVisibilitySystem(): EcsSystem {
    return createSystem({}).build();
}

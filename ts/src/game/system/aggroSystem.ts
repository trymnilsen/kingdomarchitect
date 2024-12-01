import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createAggroSystem(): EcsSystem {
    return createSystem({}).build();
}

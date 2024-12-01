import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createResourceSystem(): EcsSystem {
    return createSystem({}).build();
}

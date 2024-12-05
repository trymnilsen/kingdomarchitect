import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createJobSystem(): EcsSystem {
    return createSystem({}).build();
}

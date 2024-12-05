import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createEffectSystem(): EcsSystem {
    return createSystem({}).build();
}

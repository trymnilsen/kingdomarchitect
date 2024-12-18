import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createCraftingSystem(): EcsSystem {
    return createSystem().build();
}

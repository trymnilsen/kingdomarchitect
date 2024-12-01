import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createHousingSystem(): EcsSystem {
    return createSystem({}).build();
}

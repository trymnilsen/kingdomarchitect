import { createSystem, EcsSystem } from "../../ecs/ecsSystem.js";

export function createBattleQueueSystem(): EcsSystem {
    return createSystem({}).build();
}

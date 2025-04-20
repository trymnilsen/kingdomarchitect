import { EcsSystem } from "../module/ecs/ecsSystem.js";
import type { GameServerMessageEntry } from "./gameServerMessageBus.js";

export function makeReplicatedEntitiesSystem(
    postMessage: (message: GameServerMessageEntry) => void,
): EcsSystem {
    return {
        onEntityEvent: {
            child_added: (entity) => {
                postMessage({
                    id: "addEntity",
                    entity: {
                        id: entity.id,
                        parent: entity.parent?.id,
                        position: entity.worldPosition,
                    },
                    components: entity.components,
                });
            },
        },
    };
}

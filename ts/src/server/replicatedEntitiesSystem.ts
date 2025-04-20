import { getConstructorName } from "../common/constructor.js";
import { EcsSystem } from "../module/ecs/ecsSystem.js";
import type { GameServerMessageEntry } from "./gameServerMessageBus.js";

export function makeReplicatedEntitiesSystem(
    postMessage: (message: GameServerMessageEntry) => void,
): EcsSystem {
    return {
        onEntityEvent: {
            child_added: (_root, event) => {
                if (event.target.isGameRoot) {
                    return;
                }
                postMessage({
                    id: "addEntity",
                    entity: {
                        id: event.target.id,
                        parent: event.target.parent?.id,
                        position: event.target.worldPosition,
                    },
                    components: event.target.components.map((component) => {
                        return {
                            id: getConstructorName(component),
                            data: component,
                        };
                        //TODO: Fix any
                    }) as any,
                });
            },
        },
    };
}

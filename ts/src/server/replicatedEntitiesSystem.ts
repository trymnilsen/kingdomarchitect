import { EcsSystem } from "../common/ecs/ecsSystem.js";
import type { GameMessage } from "./message/gameMessage.js";

export function makeReplicatedEntitiesSystem(
    postMessage: (message: GameMessage) => void,
): EcsSystem {
    return {
        onEntityEvent: {
            component_updated: (_root, event) => {
                if (event.source.isGameRoot) {
                    return;
                }
                postMessage({
                    type: "setComponent",
                    component: event.item,
                    entity: event.source.id,
                });
            },
            transform: (_root, event) => {
                postMessage({
                    type: "transform",
                    entity: event.source.id,
                    position: event.source.worldPosition,
                    oldPosition: event.oldPosition,
                });
            },
            child_added: (_root, event) => {
                if (event.target.isGameRoot) {
                    return;
                }
                postMessage({
                    type: "addEntity",
                    entity: {
                        id: event.target.id,
                        parent: event.target.parent?.id,
                        position: event.target.worldPosition,
                    },
                    components: event.target.components,
                });
            },
        },
    };
}

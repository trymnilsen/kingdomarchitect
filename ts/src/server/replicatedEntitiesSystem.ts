import { EcsSystem } from "../common/ecs/ecsSystem.js";

export function makeReplicatedEntitiesSystem(
    postMessage: (message: any) => void,
): EcsSystem {
    return {
        onEntityEvent: {
            component_updated: (_root, event) => {
                postMessage({
                    id: "setComponent",
                    component: event.item,
                    entity: event.source.id,
                });
            },
            transform: (_root, event) => {
                postMessage({
                    id: "transform",
                    entityId: event.source.id,
                    position: event.source.worldPosition,
                });
            },
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
                    components: event.target.components,
                });
            },
        },
    };
}

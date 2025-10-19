import { EcsSystem } from "../common/ecs/ecsSystem.js";
import { JobQueueComponentId } from "../game/component/jobQueueComponent.js";
import { Entity } from "../game/entity/entity.js";
import type {
    GameMessage,
    ReplicatedEntityData,
} from "./message/gameMessage.js";

export function makeReplicatedEntitiesSystem(
    postMessage: (message: GameMessage) => void,
): EcsSystem {
    return {
        onEntityEvent: {
            component_updated: (_root, event) => {
                if (
                    event.source.isGameRoot &&
                    event.item.id != JobQueueComponentId
                ) {
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

                const children = buildChildrenData(event.target);

                postMessage({
                    type: "addEntity",
                    id: event.target.id,
                    parent: event.target.parent?.id,
                    position: event.target.worldPosition,
                    components: event.target.components,
                    children: children.length > 0 ? children : undefined,
                });
            },
            child_removed: (_root, event) => {
                if (event.target.isGameRoot) {
                    return;
                }

                postMessage({
                    type: "removeEntity",
                    entity: event.target.id,
                });
            },
        },
    };
}

/**
 * Recursively build the children data for an entity
 */
function buildChildrenData(entity: Entity): ReplicatedEntityData[] {
    const children: ReplicatedEntityData[] = [];

    for (const child of entity.children) {
        const childData: ReplicatedEntityData = {
            id: child.id,
            parent: child.parent?.id,
            position: child.worldPosition,
            components: child.components,
        };

        // Recursively gather nested children
        const nestedChildren = buildChildrenData(child);
        if (nestedChildren.length > 0) {
            childData.children = nestedChildren;
        }

        children.push(childData);
    }

    return children;
}
